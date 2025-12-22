-- Test SQL for Transfer Support Migration
-- This file contains test cases to verify the transfer schema works correctly
-- RUN THIS AFTER applying 20251222000002_add_transfer_support.sql

-- ============================================================================
-- SCHEMA VALIDATION TESTS (No data insertion required)
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TRANSFER SUPPORT MIGRATION TESTS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- ============================================================================
  -- TEST 1: Verify category_id Column is Nullable
  -- ============================================================================
  RAISE NOTICE 'TEST 1: Verify category_id is nullable';

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions'
    AND column_name = 'category_id'
    AND is_nullable = 'YES'
  ) THEN
    RAISE NOTICE '✓ TEST 1 PASSED: category_id is nullable';
  ELSE
    RAISE EXCEPTION '✗ TEST 1 FAILED: category_id is not nullable';
  END IF;

  -- ============================================================================
  -- TEST 2: Verify linked_transaction_id Column Exists
  -- ============================================================================
  RAISE NOTICE 'TEST 2: Verify linked_transaction_id column exists';

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions'
    AND column_name = 'linked_transaction_id'
  ) THEN
    RAISE NOTICE '✓ TEST 2 PASSED: linked_transaction_id column exists';
  ELSE
    RAISE EXCEPTION '✗ TEST 2 FAILED: linked_transaction_id column not found';
  END IF;

  -- ============================================================================
  -- TEST 3: Verify Foreign Key Constraint on linked_transaction_id
  -- ============================================================================
  RAISE NOTICE 'TEST 3: Verify foreign key constraint on linked_transaction_id';

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'transactions'
      AND kcu.column_name = 'linked_transaction_id'
      AND tc.constraint_type = 'FOREIGN KEY'
  ) THEN
    RAISE NOTICE '✓ TEST 3 PASSED: Foreign key constraint exists';
  ELSE
    RAISE EXCEPTION '✗ TEST 3 FAILED: Foreign key constraint not found';
  END IF;

  -- ============================================================================
  -- TEST 4: Verify Index on linked_transaction_id
  -- ============================================================================
  RAISE NOTICE 'TEST 4: Verify index on linked_transaction_id';

  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'transactions'
    AND indexname = 'idx_transactions_linked_transaction_id'
  ) THEN
    RAISE NOTICE '✓ TEST 4 PASSED: Index on linked_transaction_id exists';
  ELSE
    RAISE EXCEPTION '✗ TEST 4 FAILED: Index on linked_transaction_id not found';
  END IF;

  -- ============================================================================
  -- TEST 5: Verify check_category_by_type Constraint Exists
  -- ============================================================================
  RAISE NOTICE 'TEST 5: Verify check_category_by_type constraint exists';

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_category_by_type'
  ) THEN
    RAISE NOTICE '✓ TEST 5 PASSED: check_category_by_type constraint exists';
  ELSE
    RAISE EXCEPTION '✗ TEST 5 FAILED: check_category_by_type constraint not found';
  END IF;

  -- ============================================================================
  -- TEST 6: Verify transactions_type_check Constraint Exists
  -- ============================================================================
  RAISE NOTICE 'TEST 6: Verify transactions_type_check constraint exists';

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'transactions_type_check'
  ) THEN
    RAISE NOTICE '✓ TEST 6 PASSED: transactions_type_check constraint exists';
  ELSE
    RAISE EXCEPTION '✗ TEST 6 FAILED: transactions_type_check constraint not found';
  END IF;

  -- ============================================================================
  -- TEST 7: Verify budget_progress View Exists
  -- ============================================================================
  RAISE NOTICE 'TEST 7: Verify budget_progress view exists';

  IF EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_name = 'budget_progress'
  ) THEN
    RAISE NOTICE '✓ TEST 7 PASSED: budget_progress view exists';
  ELSE
    RAISE EXCEPTION '✗ TEST 7 FAILED: budget_progress view not found';
  END IF;

  -- ============================================================================
  -- TEST 8: Verify calculate_budget_spent Function Exists
  -- ============================================================================
  RAISE NOTICE 'TEST 8: Verify calculate_budget_spent function exists';

  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'calculate_budget_spent'
  ) THEN
    RAISE NOTICE '✓ TEST 8 PASSED: calculate_budget_spent function exists';
  ELSE
    RAISE EXCEPTION '✗ TEST 8 FAILED: calculate_budget_spent function not found';
  END IF;

  -- ============================================================================
  -- TEST 9: Verify get_user_balance Function Exists
  -- ============================================================================
  RAISE NOTICE 'TEST 9: Verify get_user_balance function exists';

  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'get_user_balance'
  ) THEN
    RAISE NOTICE '✓ TEST 9 PASSED: get_user_balance function exists';
  ELSE
    RAISE EXCEPTION '✗ TEST 9 FAILED: get_user_balance function not found';
  END IF;

  -- ============================================================================
  -- TEST SUMMARY
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ALL TESTS PASSED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Migration 20251222000002_add_transfer_support.sql is working correctly.';
  RAISE NOTICE '';

END $$;

-- ============================================================================
-- MANUAL TEST CASES (Run these with a real test user)
-- ============================================================================
-- Replace 'YOUR_TEST_USER_ID' with an actual user UUID from your test environment

-- TEST: Create a complete transfer pair
/*
BEGIN;

-- Get test data
DO $$
DECLARE
  test_user_id UUID := 'YOUR_TEST_USER_ID';
  test_pm_usd UUID;
  test_pm_eur UUID;
  transfer_1 UUID := uuid_generate_v4();
  transfer_2 UUID := uuid_generate_v4();
BEGIN
  -- Get payment methods
  SELECT id INTO test_pm_usd FROM payment_methods
  WHERE user_id = test_user_id AND currency = 'USD' LIMIT 1;

  SELECT id INTO test_pm_eur FROM payment_methods
  WHERE user_id = test_user_id AND currency = 'EUR' LIMIT 1;

  -- Create withdrawal transaction (source)
  INSERT INTO transactions (
    id,
    user_id,
    payment_method_id,
    category_id,
    amount,
    native_amount,
    base_currency,
    exchange_rate,
    type,
    linked_transaction_id,
    description,
    date
  ) VALUES (
    transfer_1,
    test_user_id,
    test_pm_usd,
    NULL,  -- No category for transfers
    -100.00,  -- Negative for withdrawal
    -100.00,
    'USD',
    1.00,
    'transfer',
    transfer_2,  -- Links to deposit
    'Transfer to EUR Savings',
    CURRENT_DATE
  );

  -- Create deposit transaction (destination)
  INSERT INTO transactions (
    id,
    user_id,
    payment_method_id,
    category_id,
    amount,
    native_amount,
    base_currency,
    exchange_rate,
    type,
    linked_transaction_id,
    description,
    date
  ) VALUES (
    transfer_2,
    test_user_id,
    test_pm_eur,
    NULL,  -- No category for transfers
    92.50,  -- Positive for deposit
    92.50,
    'EUR',
    1.08,
    'transfer',
    transfer_1,  -- Links to withdrawal
    'Transfer from USD Credit Card',
    CURRENT_DATE
  );

  -- Verify the transfer was created
  IF EXISTS (
    SELECT 1 FROM transactions
    WHERE id = transfer_1 AND linked_transaction_id = transfer_2
  ) AND EXISTS (
    SELECT 1 FROM transactions
    WHERE id = transfer_2 AND linked_transaction_id = transfer_1
  ) THEN
    RAISE NOTICE '✓ Transfer pair created successfully';
  ELSE
    RAISE EXCEPTION '✗ Transfer pair creation failed';
  END IF;

  -- Test cascade delete
  DELETE FROM transactions WHERE id = transfer_1;

  IF NOT EXISTS (
    SELECT 1 FROM transactions WHERE id = transfer_2
  ) THEN
    RAISE NOTICE '✓ Cascade delete works - both transactions deleted';
  ELSE
    RAISE EXCEPTION '✗ Cascade delete failed - orphaned transaction remains';
  END IF;

END $$;

ROLLBACK;
*/

-- ============================================================================
-- NOTES FOR DEVELOPERS
-- ============================================================================
-- 1. The test user must exist in auth.users
-- 2. The test user must have at least 2 payment methods with different currencies
-- 3. Run these tests in a test/staging environment, not production
-- 4. Always wrap manual tests in BEGIN/ROLLBACK to avoid data pollution
