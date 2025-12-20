-- ============================================================================
-- ENHANCE BUDGETS SCHEMA
-- ============================================================================
-- This migration enhances the budgets table with:
-- 1. Period stored as DATE (first day of month) instead of TEXT + start_date
-- 2. Proper unique constraints that work with nullable category_id/tag_id
-- 3. Period validation to ensure it's the first day of the month
-- 4. Improved indexes for performance

-- Drop existing unique constraints that don't work properly with NULLs
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_user_id_category_id_start_date_key;
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_user_id_tag_id_start_date_key;

-- Drop the old period column (was TEXT, unused)
ALTER TABLE budgets DROP COLUMN IF EXISTS period;

-- Rename start_date to period for clarity
ALTER TABLE budgets RENAME COLUMN start_date TO period;

-- Add constraint to ensure period is the first day of the month
ALTER TABLE budgets ADD CONSTRAINT budgets_period_first_day_of_month
  CHECK (EXTRACT(DAY FROM period) = 1);

-- Create partial unique indexes for category-based budgets
-- This works correctly with NULL values, ensuring one budget per category per period
CREATE UNIQUE INDEX idx_budgets_unique_category_period
  ON budgets(user_id, category_id, period)
  WHERE category_id IS NOT NULL;

-- Create partial unique indexes for tag-based budgets
-- This works correctly with NULL values, ensuring one budget per tag per period
CREATE UNIQUE INDEX idx_budgets_unique_tag_period
  ON budgets(user_id, tag_id, period)
  WHERE tag_id IS NOT NULL;

-- Add comment explaining the XOR constraint
COMMENT ON TABLE budgets IS 'Monthly budgets for categories or tags. Each budget must have either category_id OR tag_id set (not both, not neither). Period must be the first day of a month.';

COMMENT ON COLUMN budgets.category_id IS 'Foreign key to categories table. Must be set if tag_id is NULL (XOR constraint).';
COMMENT ON COLUMN budgets.tag_id IS 'Foreign key to tags table. Must be set if category_id is NULL (XOR constraint).';
COMMENT ON COLUMN budgets.period IS 'First day of the month for this budget period (e.g., 2025-01-01 for January 2025).';
COMMENT ON COLUMN budgets.amount IS 'Budget limit amount. Must be positive.';

-- Add index on period for efficient date range queries
DROP INDEX IF EXISTS idx_budgets_start_date;
CREATE INDEX idx_budgets_period ON budgets(period DESC);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON budgets(user_id, period DESC);
CREATE INDEX IF NOT EXISTS idx_budgets_user_category ON budgets(user_id, category_id) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_budgets_user_tag ON budgets(user_id, tag_id) WHERE tag_id IS NOT NULL;

-- ============================================================================
-- HELPER FUNCTIONS FOR BUDGET PERIODS
-- ============================================================================

-- Function: Get the first day of the month for a given date
CREATE OR REPLACE FUNCTION get_first_day_of_month(p_date DATE)
RETURNS DATE
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT DATE_TRUNC('month', p_date)::DATE;
$$;

COMMENT ON FUNCTION get_first_day_of_month IS 'Returns the first day of the month for a given date. Useful for normalizing dates to budget periods.';

-- Function: Get the last day of the month for a given date
CREATE OR REPLACE FUNCTION get_last_day_of_month(p_date DATE)
RETURNS DATE
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT (DATE_TRUNC('month', p_date) + INTERVAL '1 month - 1 day')::DATE;
$$;

COMMENT ON FUNCTION get_last_day_of_month IS 'Returns the last day of the month for a given date. Useful for calculating budget period end dates.';

-- ============================================================================
-- UPDATE CALCULATE_BUDGET_SPENT FUNCTION
-- ============================================================================
-- Drop the old function signature and create new one with updated parameters

DROP FUNCTION IF EXISTS calculate_budget_spent(UUID, UUID, UUID, DATE, DATE);

CREATE OR REPLACE FUNCTION calculate_budget_spent(
  p_user_id UUID,
  p_category_id UUID DEFAULT NULL,
  p_tag_id UUID DEFAULT NULL,
  p_period DATE DEFAULT CURRENT_DATE
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
  -- Calculate start and end dates for the budget period
  v_start_date := get_first_day_of_month(p_period);
  v_end_date := get_last_day_of_month(p_period);

  -- Calculate spent for category budget
  IF p_category_id IS NOT NULL THEN
    SELECT COALESCE(SUM(amount), 0)
    INTO v_spent
    FROM transactions
    WHERE user_id = p_user_id
      AND category_id = p_category_id
      AND date >= v_start_date
      AND date <= v_end_date;

  -- Calculate spent for tag budget
  ELSIF p_tag_id IS NOT NULL THEN
    SELECT COALESCE(SUM(t.amount), 0)
    INTO v_spent
    FROM transactions t
    JOIN transaction_tags tt ON t.id = tt.transaction_id
    WHERE t.user_id = p_user_id
      AND tt.tag_id = p_tag_id
      AND t.date >= v_start_date
      AND t.date <= v_end_date;

  ELSE
    v_spent := 0;
  END IF;

  RETURN v_spent;
END;
$$;

COMMENT ON FUNCTION calculate_budget_spent IS 'Calculates the total spent amount for a budget period. Accepts a period date (any date in the month) and automatically calculates the full month range. Pass either category_id OR tag_id (not both).';

-- ============================================================================
-- CREATE VIEW FOR BUDGET PROGRESS
-- ============================================================================
-- This view provides a convenient way to query budgets with calculated spent amounts

CREATE OR REPLACE VIEW budget_progress AS
SELECT
  b.id,
  b.user_id,
  b.category_id,
  b.tag_id,
  b.amount AS budget_amount,
  b.period,
  get_last_day_of_month(b.period) AS period_end,
  calculate_budget_spent(b.user_id, b.category_id, b.tag_id, b.period) AS spent_amount,
  ROUND(
    (calculate_budget_spent(b.user_id, b.category_id, b.tag_id, b.period) / b.amount) * 100,
    2
  ) AS spent_percentage,
  CASE
    WHEN calculate_budget_spent(b.user_id, b.category_id, b.tag_id, b.period) > b.amount
    THEN TRUE
    ELSE FALSE
  END AS is_overspent,
  b.created_at,
  b.updated_at
FROM budgets b;

-- Enable RLS on the view (inherits from budgets table)
ALTER VIEW budget_progress SET (security_invoker = true);

COMMENT ON VIEW budget_progress IS 'Provides budget data with calculated spent amounts, percentages, and overspent indicators. Secured via RLS policies on the underlying budgets table.';
