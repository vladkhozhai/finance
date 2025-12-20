-- Migration: Add payment_method_id to transactions table
-- Story 1: Payment Method Management (Card #19)
-- Links transactions to payment methods for multi-currency tracking

-- ============================================================================
-- ALTER TRANSACTIONS TABLE
-- ============================================================================

-- Add payment_method_id column to transactions (nullable initially for backward compatibility)
ALTER TABLE transactions
ADD COLUMN payment_method_id UUID REFERENCES payment_methods(id) ON DELETE RESTRICT;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for efficient queries by payment method
CREATE INDEX idx_transactions_payment_method_id ON transactions(payment_method_id);

-- Composite index for user + payment method queries
CREATE INDEX idx_transactions_user_payment_method ON transactions(user_id, payment_method_id);

-- ============================================================================
-- VALIDATION TRIGGER
-- ============================================================================

-- Ensure payment method belongs to the same user as the transaction
CREATE OR REPLACE FUNCTION validate_transaction_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  -- If payment_method_id is provided, verify it belongs to the user
  IF NEW.payment_method_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM payment_methods
      WHERE id = NEW.payment_method_id
        AND user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'Payment method does not belong to the user';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_transaction_payment_method
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION validate_transaction_payment_method();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Calculate current balance for a payment method
-- This calculates the sum of all income minus all expenses for this payment method
CREATE OR REPLACE FUNCTION get_payment_method_balance(p_payment_method_id UUID)
RETURNS DECIMAL(12, 2)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    SUM(
      CASE
        WHEN type = 'income' THEN amount
        WHEN type = 'expense' THEN -amount
        ELSE 0
      END
    ), 0
  )
  FROM transactions
  WHERE payment_method_id = p_payment_method_id;
$$;

-- Function to get balances by currency for a user
-- This aggregates all payment methods of the same currency
CREATE OR REPLACE FUNCTION get_user_balance_by_currency(p_user_id UUID)
RETURNS TABLE (
  currency TEXT,
  balance DECIMAL(12, 2)
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT
    pm.currency,
    COALESCE(
      SUM(
        CASE
          WHEN t.type = 'income' THEN t.amount
          WHEN t.type = 'expense' THEN -t.amount
          ELSE 0
        END
      ), 0
    ) AS balance
  FROM payment_methods pm
  LEFT JOIN transactions t ON t.payment_method_id = pm.id
  WHERE pm.user_id = p_user_id
    AND pm.is_active = true
  GROUP BY pm.currency
  ORDER BY pm.currency;
$$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN transactions.payment_method_id IS 'Foreign key to payment_methods - tracks which payment method was used for this transaction';
COMMENT ON FUNCTION get_payment_method_balance(UUID) IS 'Calculate current balance for a payment method by summing income and subtracting expenses';
COMMENT ON FUNCTION get_user_balance_by_currency(UUID) IS 'Get user balances grouped by currency across all active payment methods';
COMMENT ON FUNCTION validate_transaction_payment_method() IS 'Trigger function ensuring payment method belongs to transaction owner';

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- IMPORTANT: payment_method_id is nullable to support:
-- 1. Backward compatibility with existing transactions
-- 2. Gradual migration of existing data
-- 3. Optional payment method assignment

-- For future enforcement (if desired), you can add a NOT NULL constraint:
-- ALTER TABLE transactions
-- ALTER COLUMN payment_method_id SET NOT NULL;

-- This should only be done after:
-- 1. All existing transactions have been assigned a payment method
-- 2. Default payment method logic is implemented in the application
-- 3. Migration script has been run to populate payment_method_id for existing transactions
