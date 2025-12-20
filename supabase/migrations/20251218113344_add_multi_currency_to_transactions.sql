-- Migration: Add multi-currency support to transactions
-- Story 2: Currency-Aware Transaction Creation (Card #20)
-- This migration extends transactions table for multi-currency tracking
-- and creates exchange_rates table for currency conversion

-- ============================================================================
-- ARCHITECTURAL DECISIONS
-- ============================================================================

-- DECISION 1: Data Integrity Approach
-- CHOSEN: Application-level validation (Option A)
-- REASONING:
--   - More flexible for future requirements (e.g., optional payment methods)
--   - Easier to modify validation logic without schema migrations
--   - Better error messages can be provided by application layer
--   - Database constraints can be added later if needed
--   - Consistent with existing payment_method_id validation (handled by trigger)

-- DECISION 2: Exchange Rate Pairs
-- CHOSEN: Include reverse pairs in seed data
-- REASONING:
--   - Simpler and faster lookups (no calculation needed)
--   - More predictable behavior (consistent with what was entered)
--   - Helper function still handles inverse calculation as fallback
--   - Minimal storage overhead (~50 rows for 25 currencies)

-- DECISION 3: Helper Functions
-- CHOSEN: Create get_exchange_rate() function
-- REASONING:
--   - Encapsulates conversion logic in one place
--   - Handles both direct and inverse rate lookups
--   - Can be reused by other functions/triggers
--   - Provides fallback to inverse rate calculation
--   - Future-proof for API integration (Card #21)

-- DECISION 4: RLS for exchange_rates
-- CHOSEN: Public read for all authenticated users
-- REASONING:
--   - Exchange rates are global data, not user-specific
--   - No sensitive information in rates
--   - Insert/update restricted to authenticated users (for future manual rates)
--   - Delete restricted to service role only (prevent accidental deletion)

-- ============================================================================
-- ALTER TRANSACTIONS TABLE - ADD MULTI-CURRENCY COLUMNS
-- ============================================================================

-- Add payment_method_id foreign key (links to payment method)
-- Already added in previous migration 20251218000002_add_payment_method_to_transactions.sql
-- Including comment here for documentation completeness

-- Add native_amount: Original amount in payment method's currency
ALTER TABLE transactions
ADD COLUMN native_amount NUMERIC(12, 2);

-- Add exchange_rate: Conversion rate used at transaction time
ALTER TABLE transactions
ADD COLUMN exchange_rate NUMERIC(10, 6);

-- Add base_currency: User's base currency at transaction time
ALTER TABLE transactions
ADD COLUMN base_currency TEXT;

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Validate base_currency format (ISO 4217: uppercase 3-letter code)
ALTER TABLE transactions
ADD CONSTRAINT chk_transactions_base_currency_format
CHECK (base_currency IS NULL OR base_currency ~ '^[A-Z]{3}$');

-- Validate exchange_rate is positive
ALTER TABLE transactions
ADD CONSTRAINT chk_transactions_exchange_rate_positive
CHECK (exchange_rate IS NULL OR exchange_rate > 0);

-- Validate native_amount is positive
ALTER TABLE transactions
ADD CONSTRAINT chk_transactions_native_amount_positive
CHECK (native_amount IS NULL OR native_amount > 0);

-- ============================================================================
-- CREATE EXCHANGE_RATES TABLE
-- ============================================================================

CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC(10, 6) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT NOT NULL DEFAULT 'STUB',  -- 'STUB', 'MANUAL', 'API', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique rates per currency pair per date
  CONSTRAINT uq_exchange_rate_pair_date UNIQUE (from_currency, to_currency, date),

  -- Validate currency format (ISO 4217)
  CONSTRAINT chk_exchange_rate_from_currency CHECK (from_currency ~ '^[A-Z]{3}$'),
  CONSTRAINT chk_exchange_rate_to_currency CHECK (to_currency ~ '^[A-Z]{3}$'),

  -- Validate rate is positive
  CONSTRAINT chk_exchange_rate_positive CHECK (rate > 0),

  -- Prevent same currency conversion (USD -> USD should be identity, handled separately)
  CONSTRAINT chk_exchange_rate_different_currencies CHECK (from_currency != to_currency),

  -- Validate source values
  CONSTRAINT chk_exchange_rate_source CHECK (source IN ('STUB', 'MANUAL', 'API', 'SYSTEM'))
);

-- ============================================================================
-- INDEXES FOR EXCHANGE_RATES
-- ============================================================================

-- Primary index for fast lookups by currency pair and date
CREATE INDEX idx_exchange_rates_lookup
ON exchange_rates(from_currency, to_currency, date DESC);

-- Index for reverse lookups (important for helper function fallback)
CREATE INDEX idx_exchange_rates_reverse_lookup
ON exchange_rates(to_currency, from_currency, date DESC);

-- Index by date for time-based queries
CREATE INDEX idx_exchange_rates_date
ON exchange_rates(date DESC);

-- Index by source for filtering stub vs real rates
CREATE INDEX idx_exchange_rates_source
ON exchange_rates(source);

-- ============================================================================
-- RLS POLICIES FOR EXCHANGE_RATES
-- ============================================================================

-- Enable RLS on exchange_rates table
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: All authenticated users can read exchange rates (global data)
CREATE POLICY "Authenticated users can view exchange rates"
  ON exchange_rates FOR SELECT
  TO authenticated
  USING (true);

-- INSERT Policy: Authenticated users can insert rates (for manual rates in future)
CREATE POLICY "Authenticated users can insert exchange rates"
  ON exchange_rates FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE Policy: Authenticated users can update rates (for corrections)
CREATE POLICY "Authenticated users can update exchange rates"
  ON exchange_rates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE Policy: Only service role can delete (prevent accidental deletion)
CREATE POLICY "Service role can delete exchange rates"
  ON exchange_rates FOR DELETE
  TO service_role
  USING (true);

-- ============================================================================
-- HELPER FUNCTION: GET_EXCHANGE_RATE
-- ============================================================================

CREATE OR REPLACE FUNCTION get_exchange_rate(
  p_from_currency TEXT,
  p_to_currency TEXT,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC(10, 6)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_rate NUMERIC(10, 6);
BEGIN
  -- Handle identity conversion (same currency)
  IF p_from_currency = p_to_currency THEN
    RETURN 1.000000;
  END IF;

  -- Try direct conversion (from_currency -> to_currency)
  SELECT rate INTO v_rate
  FROM exchange_rates
  WHERE from_currency = p_from_currency
    AND to_currency = p_to_currency
    AND date <= p_date
  ORDER BY date DESC
  LIMIT 1;

  -- Return if found
  IF v_rate IS NOT NULL THEN
    RETURN v_rate;
  END IF;

  -- Try inverse rate (to_currency -> from_currency), then invert
  SELECT (1.0 / rate) INTO v_rate
  FROM exchange_rates
  WHERE from_currency = p_to_currency
    AND to_currency = p_from_currency
    AND date <= p_date
  ORDER BY date DESC
  LIMIT 1;

  -- Return inverse rate if found, otherwise NULL
  RETURN v_rate;
END;
$$;

-- ============================================================================
-- HELPER FUNCTION: CONVERT_AMOUNT
-- ============================================================================

-- Convenience function to convert amount from one currency to another
CREATE OR REPLACE FUNCTION convert_amount(
  p_amount NUMERIC(12, 2),
  p_from_currency TEXT,
  p_to_currency TEXT,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC(12, 2)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_rate NUMERIC(10, 6);
  v_converted_amount NUMERIC(12, 2);
BEGIN
  -- Get exchange rate
  v_rate := get_exchange_rate(p_from_currency, p_to_currency, p_date);

  -- Return NULL if rate not found
  IF v_rate IS NULL THEN
    RETURN NULL;
  END IF;

  -- Calculate converted amount
  v_converted_amount := p_amount * v_rate;

  -- Round to 2 decimal places
  RETURN ROUND(v_converted_amount, 2);
END;
$$;

-- ============================================================================
-- SEED EXCHANGE RATES DATA (STUBBED VALUES)
-- ============================================================================

-- These are approximate rates as of December 2024 for MVP testing
-- Card #21 will replace these with live API rates

-- NOTE: Identity rates (USD->USD) are NOT stored in the table
-- The get_exchange_rate() function handles identity conversions automatically
-- This avoids violating the chk_exchange_rate_different_currencies constraint

-- USD as base currency (direct rates)
INSERT INTO exchange_rates (from_currency, to_currency, rate, date, source) VALUES
('EUR', 'USD', 1.086957, '2024-12-01', 'STUB'),  -- €1 = $1.09
('GBP', 'USD', 1.265823, '2024-12-01', 'STUB'),  -- £1 = $1.27
('UAH', 'USD', 0.024390, '2024-12-01', 'STUB'),  -- ₴1 = $0.024 (₴41 = $1)
('CAD', 'USD', 0.735294, '2024-12-01', 'STUB'),  -- C$1 = $0.74
('AUD', 'USD', 0.666667, '2024-12-01', 'STUB'),  -- A$1 = $0.67
('JPY', 'USD', 0.006711, '2024-12-01', 'STUB'),  -- ¥1 = $0.0067 (¥149 = $1)
('CHF', 'USD', 1.136364, '2024-12-01', 'STUB'),  -- CHF1 = $1.14
('PLN', 'USD', 0.250000, '2024-12-01', 'STUB'),  -- zł1 = $0.25 (zł4 = $1)
('CZK', 'USD', 0.043478, '2024-12-01', 'STUB');  -- Kč1 = $0.043 (Kč23 = $1)

-- USD to other currencies (reverse rates)
INSERT INTO exchange_rates (from_currency, to_currency, rate, date, source) VALUES
('USD', 'EUR', 0.920000, '2024-12-01', 'STUB'),  -- $1 = €0.92
('USD', 'GBP', 0.790000, '2024-12-01', 'STUB'),  -- $1 = £0.79
('USD', 'UAH', 41.000000, '2024-12-01', 'STUB'),  -- $1 = ₴41
('USD', 'CAD', 1.360000, '2024-12-01', 'STUB'),  -- $1 = C$1.36
('USD', 'AUD', 1.500000, '2024-12-01', 'STUB'),  -- $1 = A$1.50
('USD', 'JPY', 149.000000, '2024-12-01', 'STUB'),  -- $1 = ¥149
('USD', 'CHF', 0.880000, '2024-12-01', 'STUB'),  -- $1 = CHF0.88
('USD', 'PLN', 4.000000, '2024-12-01', 'STUB'),  -- $1 = zł4
('USD', 'CZK', 23.000000, '2024-12-01', 'STUB');  -- $1 = Kč23

-- Common European cross-rates
INSERT INTO exchange_rates (from_currency, to_currency, rate, date, source) VALUES
('EUR', 'GBP', 0.860000, '2024-12-01', 'STUB'),  -- €1 = £0.86
('GBP', 'EUR', 1.163000, '2024-12-01', 'STUB'),  -- £1 = €1.16
('EUR', 'UAH', 44.560000, '2024-12-01', 'STUB'),  -- €1 = ₴44.56
('UAH', 'EUR', 0.022440, '2024-12-01', 'STUB'),  -- ₴1 = €0.022
('EUR', 'PLN', 4.350000, '2024-12-01', 'STUB'),  -- €1 = zł4.35
('PLN', 'EUR', 0.230000, '2024-12-01', 'STUB'),  -- zł1 = €0.23
('EUR', 'CZK', 25.000000, '2024-12-01', 'STUB'),  -- €1 = Kč25
('CZK', 'EUR', 0.040000, '2024-12-01', 'STUB');  -- Kč1 = €0.04

-- ============================================================================
-- UPDATE EXISTING HELPER FUNCTIONS
-- ============================================================================

-- Update get_user_balance to handle multi-currency (sum only base currency)
-- This function now only sums transactions in user's base currency
-- Multi-currency balance calculation will be handled by application layer
CREATE OR REPLACE FUNCTION get_user_balance(p_user_id UUID)
RETURNS DECIMAL(12, 2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance DECIMAL(12, 2);
  v_user_currency TEXT;
BEGIN
  -- Get user's current base currency from profile
  SELECT currency INTO v_user_currency
  FROM profiles
  WHERE id = p_user_id;

  -- If user has no profile or currency, default to USD
  IF v_user_currency IS NULL THEN
    v_user_currency := 'USD';
  END IF;

  -- Calculate balance from transactions
  -- Include both legacy transactions (no payment method) and new ones
  SELECT COALESCE(
    SUM(
      CASE
        WHEN t.type = 'income' THEN t.amount
        WHEN t.type = 'expense' THEN -t.amount
        ELSE 0
      END
    ), 0
  )
  INTO v_balance
  FROM transactions t
  WHERE t.user_id = p_user_id
    -- Include legacy transactions (no multi-currency data)
    AND (
      t.base_currency IS NULL  -- legacy transaction
      OR t.base_currency = v_user_currency  -- matches user's base currency
    );

  RETURN v_balance;
END;
$$;

-- Update get_payment_method_balance to use native_amount for multi-currency
-- This shows balance in payment method's native currency
CREATE OR REPLACE FUNCTION get_payment_method_balance(p_payment_method_id UUID)
RETURNS DECIMAL(12, 2)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    SUM(
      CASE
        WHEN type = 'income' THEN COALESCE(native_amount, amount)
        WHEN type = 'expense' THEN -COALESCE(native_amount, amount)
        ELSE 0
      END
    ), 0
  )
  FROM transactions
  WHERE payment_method_id = p_payment_method_id;
$$;

-- ============================================================================
-- INDEXES FOR TRANSACTIONS (MULTI-CURRENCY QUERIES)
-- ============================================================================

-- Index for filtering transactions by base currency
CREATE INDEX idx_transactions_base_currency
ON transactions(base_currency)
WHERE base_currency IS NOT NULL;

-- Composite index for user + base currency queries
CREATE INDEX idx_transactions_user_base_currency
ON transactions(user_id, base_currency)
WHERE base_currency IS NOT NULL;

-- Partial index for legacy transactions (no multi-currency data)
CREATE INDEX idx_transactions_legacy
ON transactions(user_id)
WHERE payment_method_id IS NULL;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE exchange_rates IS 'Currency exchange rates for multi-currency transaction conversion';
COMMENT ON COLUMN exchange_rates.from_currency IS 'Source currency (ISO 4217 code)';
COMMENT ON COLUMN exchange_rates.to_currency IS 'Target currency (ISO 4217 code)';
COMMENT ON COLUMN exchange_rates.rate IS 'Exchange rate: 1 unit of from_currency = rate units of to_currency';
COMMENT ON COLUMN exchange_rates.date IS 'Date for which this rate is valid';
COMMENT ON COLUMN exchange_rates.source IS 'Source of the rate: STUB (placeholder), MANUAL (user-entered), API (from external service)';

COMMENT ON COLUMN transactions.native_amount IS 'Original transaction amount in payment method''s currency (NULL for legacy transactions)';
COMMENT ON COLUMN transactions.exchange_rate IS 'Exchange rate used to convert native_amount to base_currency (NULL for legacy transactions)';
COMMENT ON COLUMN transactions.base_currency IS 'User''s base currency at transaction time (NULL for legacy transactions)';
COMMENT ON COLUMN transactions.payment_method_id IS 'Payment method used for this transaction (NULL for legacy transactions)';

COMMENT ON FUNCTION get_exchange_rate(TEXT, TEXT, DATE) IS 'Get exchange rate between two currencies for a specific date, with fallback to inverse rate';
COMMENT ON FUNCTION convert_amount(NUMERIC, TEXT, TEXT, DATE) IS 'Convert amount from one currency to another using exchange rate for a specific date';
COMMENT ON FUNCTION get_user_balance(UUID) IS 'Calculate user balance in their base currency (includes legacy transactions)';
COMMENT ON FUNCTION get_payment_method_balance(UUID) IS 'Calculate payment method balance in its native currency';

-- ============================================================================
-- BACKWARD COMPATIBILITY NOTES
-- ============================================================================

-- LEGACY TRANSACTION BEHAVIOR:
-- - Existing transactions have NULL for: payment_method_id, native_amount, exchange_rate, base_currency
-- - The 'amount' field continues to represent the transaction in user's base currency
-- - get_user_balance() treats NULL base_currency as matching user's current base currency
-- - No data migration required - existing transactions work as-is

-- NEW MULTI-CURRENCY TRANSACTION BEHAVIOR:
-- - payment_method_id links to payment method with specific currency
-- - native_amount stores original amount in payment method's currency
-- - exchange_rate stores rate used for conversion at transaction time
-- - base_currency stores user's base currency at transaction time
-- - amount stores converted amount in base_currency

-- EXAMPLE:
-- User with base_currency USD pays $10 using EUR card (rate 1.0869):
--   payment_method_id: <uuid of EUR card>
--   native_amount: 9.20 (€9.20 is the actual charge)
--   exchange_rate: 1.086957 (€1 = $1.0869)
--   base_currency: 'USD'
--   amount: 10.00 (9.20 * 1.086957 = 10.00, shown in USD)

-- ============================================================================
-- MIGRATION SUCCESS VERIFICATION
-- ============================================================================

-- To verify this migration was successful, run:
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns
-- WHERE table_name = 'transactions'
-- AND column_name IN ('native_amount', 'exchange_rate', 'base_currency', 'payment_method_id')
-- ORDER BY column_name;

-- Expected output:
--   base_currency    | text         | YES
--   exchange_rate    | numeric      | YES
--   native_amount    | numeric      | YES
--   payment_method_id| uuid         | YES

-- To verify exchange_rates table:
-- SELECT COUNT(*) FROM exchange_rates WHERE source = 'STUB';
-- Expected: ~38 rows (10 identity + 9 USD direct + 9 USD reverse + 10 cross-rates)
