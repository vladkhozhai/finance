/**
 * Migration: Migrate Orphaned Transactions
 *
 * Purpose: Fix Bug #27 - Balance Discrepancy
 *
 * Problem:
 * - Transactions created before payment_method_id was added have NULL payment_method_id
 * - These "orphaned" transactions are not included in TotalBalanceCard calculations
 * - Causes discrepancy between legacy and modern balance calculations
 *
 * Solution:
 * 1. Create a default "Cash/Unspecified" payment method for each affected user
 * 2. Migrate orphaned transactions to this default payment method
 * 3. Add NOT NULL constraint to prevent future orphaned transactions
 *
 * Migration Date: 2025-12-19
 * Related Card: #27
 */

-- ===========================================================================
-- STEP 1: Create default "Cash/Unspecified" payment method for affected users
-- ===========================================================================

-- Create payment method for users who have orphaned transactions
-- Use user's profile currency for the default payment method
INSERT INTO payment_methods (
  user_id,
  name,
  currency,
  is_default,
  is_active,
  color,
  card_type
)
SELECT DISTINCT
  t.user_id,
  'Cash/Unspecified' as name,
  COALESCE(p.currency, 'USD') as currency,
  false as is_default,
  true as is_active,
  '#6B7280' as color, -- neutral gray
  NULL as card_type
FROM transactions t
LEFT JOIN profiles p ON t.user_id = p.id
WHERE t.payment_method_id IS NULL
ON CONFLICT DO NOTHING;

-- ===========================================================================
-- STEP 2: Migrate orphaned transactions to the default payment method
-- ===========================================================================

-- Update all orphaned transactions to use the newly created payment method
UPDATE transactions t
SET payment_method_id = (
  SELECT id
  FROM payment_methods pm
  WHERE pm.user_id = t.user_id
    AND pm.name = 'Cash/Unspecified'
  LIMIT 1
)
WHERE t.payment_method_id IS NULL;

-- ===========================================================================
-- STEP 3: Verify migration success
-- ===========================================================================

-- This should return 0 rows (no orphaned transactions remaining)
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM transactions
  WHERE payment_method_id IS NULL;

  IF orphaned_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % orphaned transactions still exist', orphaned_count;
  END IF;

  RAISE NOTICE 'Migration successful: All transactions have payment methods assigned';
END $$;

-- ===========================================================================
-- STEP 4: Add NOT NULL constraint to prevent future orphaned transactions
-- ===========================================================================

-- Enforce that all future transactions MUST have a payment method
ALTER TABLE transactions
ALTER COLUMN payment_method_id SET NOT NULL;

-- ===========================================================================
-- STEP 5: Add check constraint for referential integrity
-- ===========================================================================

-- Ensure payment_method_id references a valid, active payment method
-- Note: This is informational - FK constraint already exists
COMMENT ON COLUMN transactions.payment_method_id IS
'Payment method used for this transaction. MUST reference an active payment method. Cannot be NULL.';

-- ===========================================================================
-- MIGRATION COMPLETE
-- ===========================================================================

-- Summary of changes:
-- ✅ Created "Cash/Unspecified" payment methods for affected users
-- ✅ Migrated orphaned transactions to default payment method
-- ✅ Added NOT NULL constraint to prevent future orphaned transactions
-- ✅ Verified migration success

-- Expected Impact:
-- - TotalBalanceCard and BalanceSummary will now show the same balance
-- - All transactions are now included in balance calculations
-- - Future transactions will require a payment method at creation time
