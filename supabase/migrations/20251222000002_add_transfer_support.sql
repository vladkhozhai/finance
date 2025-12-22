-- Migration: Add support for transfers between payment methods
-- Card #43: Transfer Between Payment Accounts
--
-- Architecture: Uses linked transactions approach where each transfer creates TWO
-- linked transactions (withdrawal + deposit) rather than a single transfer transaction.
-- This maintains data integrity, preserves currency separation, and simplifies balance
-- calculations.

-- ============================================================================
-- 1. EXTEND TRANSACTION TYPE ENUM
-- ============================================================================
-- Drop the old type constraint and create a new one that includes 'transfer'
ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_type_check
  CHECK (LOWER(type) IN ('income', 'expense', 'transfer'));

-- ============================================================================
-- 2. ADD LINKED_TRANSACTION_ID COLUMN
-- ============================================================================
-- This column links the two sides of a transfer together
-- Both transactions in a transfer pair will reference each other
ALTER TABLE transactions
  ADD COLUMN linked_transaction_id UUID
    REFERENCES transactions(id) ON DELETE CASCADE;

-- Add index for performance (only for non-null values)
CREATE INDEX idx_transactions_linked_transaction_id
  ON transactions(linked_transaction_id)
  WHERE linked_transaction_id IS NOT NULL;

-- ============================================================================
-- 3. MAKE CATEGORY_ID NULLABLE FOR TRANSFERS
-- ============================================================================
-- Transfers don't have categories (they're not income/expense)
ALTER TABLE transactions
  ALTER COLUMN category_id DROP NOT NULL;

-- ============================================================================
-- 4. ADD CATEGORY VALIDATION BY TYPE
-- ============================================================================
-- Constraint: transfers must NOT have category, income/expense MUST have category
ALTER TABLE transactions
  ADD CONSTRAINT check_category_by_type
  CHECK (
    (type = 'transfer' AND category_id IS NULL) OR
    (type IN ('income', 'expense') AND category_id IS NOT NULL)
  );

-- ============================================================================
-- 5. UPDATE FUNCTION COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON COLUMN transactions.type IS
  'Transaction type: income, expense, or transfer between payment methods (stored as lowercase)';

COMMENT ON COLUMN transactions.linked_transaction_id IS
  'For transfers: links the two sides of a transfer (withdrawal and deposit). Both transactions reference each other.';

COMMENT ON COLUMN transactions.category_id IS
  'Category FK (ON DELETE RESTRICT prevents deletion of used categories). NULL for transfers, required for income/expense.';

-- ============================================================================
-- 6. UPDATE BUDGET CALCULATION FUNCTIONS TO EXCLUDE TRANSFERS
-- ============================================================================
-- Update calculate_budget_spent to exclude transfer transactions from budget calculations
CREATE OR REPLACE FUNCTION calculate_budget_spent(
  p_user_id UUID,
  p_category_id UUID DEFAULT NULL,
  p_tag_id UUID DEFAULT NULL,
  p_period TEXT DEFAULT 'monthly'
)
RETURNS DECIMAL(12, 2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_spent DECIMAL(12, 2);
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  -- Calculate period boundaries
  IF p_period = 'monthly' THEN
    v_start_date := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    v_end_date := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
  ELSE
    -- Default to current month if period is unknown
    v_start_date := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    v_end_date := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
  END IF;

  -- Calculate spent for category budget (exclude transfers)
  IF p_category_id IS NOT NULL THEN
    SELECT COALESCE(SUM(amount), 0)
    INTO v_spent
    FROM transactions
    WHERE user_id = p_user_id
      AND category_id = p_category_id
      AND type != 'transfer'  -- EXCLUDE TRANSFERS
      AND date >= v_start_date
      AND date <= v_end_date;

  -- Calculate spent for tag budget (exclude transfers)
  ELSIF p_tag_id IS NOT NULL THEN
    SELECT COALESCE(SUM(t.amount), 0)
    INTO v_spent
    FROM transactions t
    JOIN transaction_tags tt ON t.id = tt.transaction_id
    WHERE t.user_id = p_user_id
      AND tt.tag_id = p_tag_id
      AND t.type != 'transfer'  -- EXCLUDE TRANSFERS
      AND t.date >= v_start_date
      AND t.date <= v_end_date;

  ELSE
    v_spent := 0;
  END IF;

  RETURN v_spent;
END;
$$;

-- ============================================================================
-- 7. UPDATE BALANCE CALCULATION FUNCTION TO HANDLE TRANSFERS
-- ============================================================================
-- Update get_user_balance to handle transfer transactions
-- Transfers affect balance based on their amount sign (no category needed)
CREATE OR REPLACE FUNCTION get_user_balance(p_user_id UUID)
RETURNS DECIMAL(12, 2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance DECIMAL(12, 2);
BEGIN
  SELECT COALESCE(
    SUM(
      CASE
        WHEN t.type = 'income' THEN t.amount
        WHEN t.type = 'expense' THEN -t.amount
        WHEN t.type = 'transfer' THEN t.amount  -- Transfers use amount directly (negative for withdrawal, positive for deposit)
        ELSE 0
      END
    ), 0
  )
  INTO v_balance
  FROM transactions t
  WHERE t.user_id = p_user_id;

  RETURN v_balance;
END;
$$;

-- ============================================================================
-- 8. UPDATE BUDGET_PROGRESS VIEW TO EXCLUDE TRANSFERS
-- ============================================================================
-- Drop and recreate the budget_progress view to exclude transfers from calculations
DROP VIEW IF EXISTS budget_progress;

CREATE VIEW budget_progress AS
SELECT
  b.id,
  b.user_id,
  b.category_id,
  b.tag_id,
  b.amount as budget_amount,
  b.period,
  b.created_at,
  b.updated_at,
  -- Calculate period boundaries
  DATE_TRUNC('month', CURRENT_DATE)::DATE as period_start,
  (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE as period_end,
  -- Calculate spent amount (excluding transfers)
  CASE
    WHEN b.category_id IS NOT NULL THEN
      COALESCE(
        (SELECT SUM(t.amount)
         FROM transactions t
         WHERE t.user_id = b.user_id
           AND t.category_id = b.category_id
           AND t.type != 'transfer'  -- EXCLUDE TRANSFERS
           AND t.date >= DATE_TRUNC('month', CURRENT_DATE)::DATE
           AND t.date <= (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE
        ), 0
      )
    WHEN b.tag_id IS NOT NULL THEN
      COALESCE(
        (SELECT SUM(t.amount)
         FROM transactions t
         JOIN transaction_tags tt ON t.id = tt.transaction_id
         WHERE t.user_id = b.user_id
           AND tt.tag_id = b.tag_id
           AND t.type != 'transfer'  -- EXCLUDE TRANSFERS
           AND t.date >= DATE_TRUNC('month', CURRENT_DATE)::DATE
           AND t.date <= (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE
        ), 0
      )
    ELSE 0
  END as spent_amount,
  -- Calculate percentage
  CASE
    WHEN b.amount > 0 THEN
      ROUND(
        (CASE
          WHEN b.category_id IS NOT NULL THEN
            COALESCE(
              (SELECT SUM(t.amount)
               FROM transactions t
               WHERE t.user_id = b.user_id
                 AND t.category_id = b.category_id
                 AND t.type != 'transfer'  -- EXCLUDE TRANSFERS
                 AND t.date >= DATE_TRUNC('month', CURRENT_DATE)::DATE
                 AND t.date <= (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE
              ), 0
            )
          WHEN b.tag_id IS NOT NULL THEN
            COALESCE(
              (SELECT SUM(t.amount)
               FROM transactions t
               JOIN transaction_tags tt ON t.id = tt.transaction_id
               WHERE t.user_id = b.user_id
                 AND tt.tag_id = b.tag_id
                 AND t.type != 'transfer'  -- EXCLUDE TRANSFERS
                 AND t.date >= DATE_TRUNC('month', CURRENT_DATE)::DATE
                 AND t.date <= (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE
              ), 0
            )
          ELSE 0
        END / b.amount) * 100, 2
      )
    ELSE 0
  END as spent_percentage,
  -- Is overspent flag
  CASE
    WHEN b.category_id IS NOT NULL THEN
      COALESCE(
        (SELECT SUM(t.amount)
         FROM transactions t
         WHERE t.user_id = b.user_id
           AND t.category_id = b.category_id
           AND t.type != 'transfer'  -- EXCLUDE TRANSFERS
           AND t.date >= DATE_TRUNC('month', CURRENT_DATE)::DATE
           AND t.date <= (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE
        ), 0
      ) > b.amount
    WHEN b.tag_id IS NOT NULL THEN
      COALESCE(
        (SELECT SUM(t.amount)
         FROM transactions t
         JOIN transaction_tags tt ON t.id = tt.transaction_id
         WHERE t.user_id = b.user_id
           AND tt.tag_id = b.tag_id
           AND t.type != 'transfer'  -- EXCLUDE TRANSFERS
           AND t.date >= DATE_TRUNC('month', CURRENT_DATE)::DATE
           AND t.date <= (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE
        ), 0
      ) > b.amount
    ELSE FALSE
  END as is_overspent
FROM budgets b;

-- Grant access to the view
GRANT SELECT ON budget_progress TO authenticated;

-- ============================================================================
-- MIGRATION VERIFICATION
-- ============================================================================
-- Verify the changes by checking constraints
DO $$
BEGIN
  -- Verify type constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'transactions_type_check'
  ) THEN
    RAISE EXCEPTION 'Type constraint not found';
  END IF;

  -- Verify category_by_type constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_category_by_type'
  ) THEN
    RAISE EXCEPTION 'Category by type constraint not found';
  END IF;

  -- Verify linked_transaction_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions'
    AND column_name = 'linked_transaction_id'
  ) THEN
    RAISE EXCEPTION 'linked_transaction_id column not found';
  END IF;

  -- Verify category_id is nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions'
    AND column_name = 'category_id'
    AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION 'category_id should be nullable';
  END IF;

  RAISE NOTICE 'Migration verified successfully';
END $$;
