-- ============================================================================
-- FIX CALCULATE_BUDGET_SPENT FUNCTION - ADD EXPENSE TYPE FILTER
-- ============================================================================
-- Bug Fix: The calculate_budget_spent() function was incorrectly including
-- both income and expense transactions when calculating budget spent amounts.
-- Budgets should only track expense transactions.
--
-- This migration adds the `type = 'expense'` filter to both calculation paths:
-- 1. Category-based budget calculation
-- 2. Tag-based budget calculation
--
-- No data migration is required as this only updates the function logic.
-- Historical budget calculations will automatically use the corrected logic.
-- ============================================================================

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

  -- Calculate spent for category budget (FIXED: Added type = 'expense' filter)
  IF p_category_id IS NOT NULL THEN
    SELECT COALESCE(SUM(amount), 0)
    INTO v_spent
    FROM transactions
    WHERE user_id = p_user_id
      AND category_id = p_category_id
      AND type = 'expense'  -- FIXED: Only include expense transactions
      AND date >= v_start_date
      AND date <= v_end_date;

  -- Calculate spent for tag budget (FIXED: Added type = 'expense' filter)
  ELSIF p_tag_id IS NOT NULL THEN
    SELECT COALESCE(SUM(t.amount), 0)
    INTO v_spent
    FROM transactions t
    JOIN transaction_tags tt ON t.id = tt.transaction_id
    WHERE t.user_id = p_user_id
      AND tt.tag_id = p_tag_id
      AND t.type = 'expense'  -- FIXED: Only include expense transactions
      AND t.date >= v_start_date
      AND t.date <= v_end_date;

  ELSE
    v_spent := 0;
  END IF;

  RETURN v_spent;
END;
$$;

COMMENT ON FUNCTION calculate_budget_spent IS 'Calculates the total spent amount (expenses only) for a budget period. Accepts a period date (any date in the month) and automatically calculates the full month range. Pass either category_id OR tag_id (not both).';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- The budget_progress view automatically uses the updated function.
-- No changes to the view are needed as it references calculate_budget_spent().
--
-- Expected behavior after migration:
-- - Budget spent amounts will only include expense transactions
-- - Income transactions will be excluded from budget calculations
-- - Historical budget data will display correct spent amounts
-- ============================================================================