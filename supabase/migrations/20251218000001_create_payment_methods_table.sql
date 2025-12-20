-- Migration: Create payment_methods table for multi-currency support
-- Story 1: Payment Method Management (Card #19)
-- This enables users to manage multiple bank cards/accounts with different currencies

-- ============================================================================
-- PAYMENT_METHODS TABLE
-- ============================================================================
-- Users can manage multiple payment methods (cards, cash, accounts) each with its own currency

CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  currency TEXT NOT NULL,  -- ISO 4217 code (USD, EUR, UAH, GBP, etc.)
  card_type TEXT,          -- 'debit', 'credit', 'cash', 'savings', 'other'
  color TEXT,              -- Hex color code for UI display (e.g., '#3B82F6')
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- 1. Currency must be uppercase 3-letter ISO 4217 code
ALTER TABLE payment_methods
ADD CONSTRAINT chk_currency_format
CHECK (currency ~ '^[A-Z]{3}$');

-- 2. Card type validation (if provided)
ALTER TABLE payment_methods
ADD CONSTRAINT chk_card_type
CHECK (card_type IS NULL OR card_type IN ('debit', 'credit', 'cash', 'savings', 'other'));

-- 3. Color validation (hex color format if provided)
ALTER TABLE payment_methods
ADD CONSTRAINT chk_color_format
CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$');

-- 4. Name length validation
ALTER TABLE payment_methods
ADD CONSTRAINT chk_name_length
CHECK (LENGTH(TRIM(name)) >= 1 AND LENGTH(name) <= 100);

-- 5. Unique constraint: payment method names must be unique per user
ALTER TABLE payment_methods
ADD CONSTRAINT uq_user_payment_method_name
UNIQUE (user_id, name);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary key index on id (automatically created)
-- Index on user_id for efficient user queries
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);

-- Composite index for filtering active payment methods
CREATE INDEX idx_payment_methods_user_active ON payment_methods(user_id, is_active)
WHERE is_active = true;

-- Composite index for quick default payment method lookup
CREATE INDEX idx_payment_methods_user_default ON payment_methods(user_id, is_default)
WHERE is_default = true;

-- Index on currency for potential currency-based filtering
CREATE INDEX idx_payment_methods_currency ON payment_methods(currency);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on payment_methods table
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: Users can only view their own payment methods
CREATE POLICY "Users can view their own payment methods"
  ON payment_methods FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT Policy: Users can only create payment methods for themselves
CREATE POLICY "Users can create their own payment methods"
  ON payment_methods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy: Users can only update their own payment methods
CREATE POLICY "Users can update their own payment methods"
  ON payment_methods FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE Policy: Users can only delete their own payment methods (soft delete preferred via is_active)
CREATE POLICY "Users can delete their own payment methods"
  ON payment_methods FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger 1: Update updated_at timestamp on row modification
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger 2: Ensure only one default payment method per user
-- When a payment method is set as default, unset all other defaults for that user
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new/updated payment method is being set as default
  IF NEW.is_default = true THEN
    -- Unset default flag on all other payment methods for this user
    UPDATE payment_methods
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ensure_single_default_payment_method
  BEFORE INSERT OR UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_payment_method();

-- Trigger 3: Normalize currency to uppercase (defensive)
CREATE OR REPLACE FUNCTION normalize_payment_method_currency()
RETURNS TRIGGER AS $$
BEGIN
  -- Convert currency to uppercase for consistent storage
  NEW.currency = UPPER(NEW.currency);

  -- Trim whitespace from name
  NEW.name = TRIM(NEW.name);

  -- Normalize color to uppercase hex if provided
  IF NEW.color IS NOT NULL THEN
    NEW.color = UPPER(NEW.color);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalize_payment_method_data
  BEFORE INSERT OR UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION normalize_payment_method_currency();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Get user's active payment methods count
CREATE OR REPLACE FUNCTION get_user_active_payment_methods_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM payment_methods
  WHERE user_id = p_user_id
    AND is_active = true;
$$;

-- Function: Get user's default payment method
CREATE OR REPLACE FUNCTION get_user_default_payment_method(p_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT id
  FROM payment_methods
  WHERE user_id = p_user_id
    AND is_default = true
    AND is_active = true
  LIMIT 1;
$$;

-- NOTE: get_payment_method_balance() function is defined in the next migration
-- after payment_method_id column is added to transactions table

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE payment_methods IS 'User payment methods (cards, cash, accounts) with multi-currency support';
COMMENT ON COLUMN payment_methods.id IS 'Unique identifier for the payment method';
COMMENT ON COLUMN payment_methods.user_id IS 'Foreign key to auth.users (owner of the payment method)';
COMMENT ON COLUMN payment_methods.name IS 'User-defined name for the payment method (e.g., "Chase Visa", "Cash Wallet")';
COMMENT ON COLUMN payment_methods.currency IS 'ISO 4217 currency code (e.g., USD, EUR, UAH) - immutable after creation';
COMMENT ON COLUMN payment_methods.card_type IS 'Type of payment method: debit, credit, cash, savings, or other';
COMMENT ON COLUMN payment_methods.color IS 'Hex color code for UI display (e.g., #3B82F6)';
COMMENT ON COLUMN payment_methods.is_default IS 'Flag indicating if this is the default payment method for quick transaction entry';
COMMENT ON COLUMN payment_methods.is_active IS 'Soft delete flag - inactive payment methods are archived but historical transactions remain intact';
COMMENT ON COLUMN payment_methods.created_at IS 'Timestamp when the payment method was created';
COMMENT ON COLUMN payment_methods.updated_at IS 'Timestamp when the payment method was last updated (auto-updated by trigger)';

COMMENT ON FUNCTION get_user_active_payment_methods_count(UUID) IS 'Count the number of active payment methods for a user';
COMMENT ON FUNCTION get_user_default_payment_method(UUID) IS 'Get the UUID of the user''s default payment method';
COMMENT ON FUNCTION ensure_single_default_payment_method() IS 'Trigger function ensuring only one payment method per user can be marked as default';
COMMENT ON FUNCTION normalize_payment_method_currency() IS 'Trigger function normalizing currency to uppercase and trimming whitespace from name';

-- ============================================================================
-- REFERENCE DATA: Common ISO 4217 Currency Codes
-- ============================================================================
-- This is informational only - not inserted into the database
-- USD - United States Dollar
-- EUR - Euro
-- UAH - Ukrainian Hryvnia
-- GBP - British Pound Sterling
-- JPY - Japanese Yen
-- CNY - Chinese Yuan
-- CHF - Swiss Franc
-- CAD - Canadian Dollar
-- AUD - Australian Dollar
-- PLN - Polish Złoty
-- CZK - Czech Koruna
-- SEK - Swedish Krona
-- NOK - Norwegian Krone
-- DKK - Danish Krone
-- HUF - Hungarian Forint
-- RON - Romanian Leu
-- BGN - Bulgarian Lev
-- RUB - Russian Ruble
-- TRY - Turkish Lira
-- INR - Indian Rupee
-- BRL - Brazilian Real
-- MXN - Mexican Peso
-- ZAR - South African Rand
-- SGD - Singapore Dollar
-- HKD - Hong Kong Dollar
-- KRW - South Korean Won
-- THB - Thai Baht
-- MYR - Malaysian Ringgit
-- IDR - Indonesian Rupiah
-- PHP - Philippine Peso
-- VND - Vietnamese Dong
-- NZD - New Zealand Dollar
-- AED - UAE Dirham
-- SAR - Saudi Riyal
-- QAR - Qatari Riyal
-- KWD - Kuwaiti Dinar
-- BHD - Bahraini Dinar
-- OMR - Omani Rial
-- JOD - Jordanian Dinar
-- ILS - Israeli New Shekel
-- EGP - Egyptian Pound
-- NGN - Nigerian Naira
-- KES - Kenyan Shilling
-- GHS - Ghanaian Cedi
-- XAF - Central African CFA Franc
-- XOF - West African CFA Franc
