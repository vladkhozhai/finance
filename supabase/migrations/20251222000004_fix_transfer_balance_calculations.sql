-- Migration: Fix balance calculations for transfer transactions
-- Bug #017C: Critical P0 bug with incorrect balance calculations
--
-- PROBLEM:
-- 1. get_user_balance() INCLUDES transfers -> inflates total balance
-- 2. get_payment_method_balance() EXCLUDES transfers -> payment account balances don't update
--
-- SOLUTION:
-- 1. get_user_balance() should EXCLUDE transfers (they're neutral to overall balance)
-- 2. get_payment_method_balance() should INCLUDE transfers (they affect individual accounts)
--
-- EXPECTED BEHAVIOR:
-- - Transfer from Cash USD to Card USD: Total balance unchanged, Cash decreases, Card increases
-- - Overall balance = sum of payment account balances
-- - Transfers net out to zero in overall balance (one negative, one positive)

-- ============================================================================
-- 1. RELAX AMOUNT CONSTRAINTS TO ALLOW NEGATIVE VALUES FOR TRANSFERS
-- ============================================================================
-- The existing constraints only allow positive amount/native_amount values.
-- For transfers, withdrawals need negative amounts.

-- Fix amount constraint
ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_amount_positive;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_amount_valid
  CHECK (
    (type IN ('income', 'expense') AND amount > 0) OR
    (type = 'transfer' AND amount != 0)
  );

COMMENT ON CONSTRAINT transactions_amount_valid ON transactions IS
  'Validates amount: positive for income/expense, non-zero for transfers (negative for withdrawals, positive for deposits)';

-- Fix native_amount constraint
ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS chk_transactions_native_amount_positive;

ALTER TABLE transactions
  ADD CONSTRAINT chk_transactions_native_amount_valid
  CHECK (
    native_amount IS NULL OR
    (type IN ('income', 'expense') AND native_amount > 0) OR
    (type = 'transfer' AND native_amount != 0)
  );

COMMENT ON CONSTRAINT chk_transactions_native_amount_valid ON transactions IS
  'Validates native_amount: positive for income/expense, non-zero for transfers (negative for withdrawals, positive for deposits)';

-- ============================================================================
-- 2. FIX get_user_balance() - EXCLUDE TRANSFERS
-- ============================================================================
-- Transfers should NOT affect total balance (they're just moving money between accounts)
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
        -- REMOVED: WHEN t.type = 'transfer' THEN t.amount
        -- Transfers should be excluded from overall balance calculation
        ELSE 0
      END
    ), 0
  )
  INTO v_balance
  FROM transactions t
  WHERE t.user_id = p_user_id
    AND t.type != 'transfer';  -- Explicitly exclude transfers

  RETURN v_balance;
END;
$$;

COMMENT ON FUNCTION get_user_balance(UUID) IS
  'Calculate user''s total balance in base currency (income - expenses). Excludes transfers as they are neutral to overall balance.';

-- ============================================================================
-- 3. FIX get_payment_method_balance() - INCLUDE TRANSFERS
-- ============================================================================
-- Transfers MUST affect payment account balances:
-- - Withdrawal (negative amount): decreases source account
-- - Deposit (positive amount): increases destination account
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
        WHEN type = 'transfer' THEN COALESCE(native_amount, amount)  -- ADDED: Include transfers
        ELSE 0
      END
    ), 0
  )
  FROM transactions
  WHERE payment_method_id = p_payment_method_id;
$$;

COMMENT ON FUNCTION get_payment_method_balance(UUID) IS
  'Calculate payment method balance in its native currency. Includes income, expenses, AND transfers (withdrawals/deposits).';

-- ============================================================================
-- 4. VERIFICATION TESTS
-- ============================================================================
DO $$
DECLARE
  v_test_user_id UUID;
  v_pm1_id UUID;
  v_pm2_id UUID;
  v_income_cat_id UUID;
  v_expense_cat_id UUID;
  v_transfer_cat_id UUID;
  v_trans1_id UUID;
  v_trans2_id UUID;
  v_balance DECIMAL(12, 2);
  v_pm1_balance DECIMAL(12, 2);
  v_pm2_balance DECIMAL(12, 2);
BEGIN
  RAISE NOTICE '=== TESTING BALANCE CALCULATIONS WITH TRANSFERS ===';

  -- Create test user
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'balance-test@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_test_user_id;

  -- Create profile (triggers should handle this, but ensure it exists)
  INSERT INTO profiles (id, currency, created_at, updated_at)
  VALUES (v_test_user_id, 'USD', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Create test payment methods
  INSERT INTO payment_methods (user_id, name, currency, is_default, is_active)
  VALUES (v_test_user_id, 'Test Cash', 'USD', true, true)
  RETURNING id INTO v_pm1_id;

  INSERT INTO payment_methods (user_id, name, currency, is_default, is_active)
  VALUES (v_test_user_id, 'Test Card', 'USD', false, true)
  RETURNING id INTO v_pm2_id;

  -- Create test categories
  INSERT INTO categories (user_id, name, color, type)
  VALUES (v_test_user_id, 'Test Income', '#00FF00', 'income')
  RETURNING id INTO v_income_cat_id;

  INSERT INTO categories (user_id, name, color, type)
  VALUES (v_test_user_id, 'Test Expense', '#FF0000', 'expense')
  RETURNING id INTO v_expense_cat_id;

  RAISE NOTICE 'Test Setup: User=%, PM1=%, PM2=%', v_test_user_id, v_pm1_id, v_pm2_id;

  -- TEST 1: Initial state (should be 0)
  RAISE NOTICE 'TEST 1: Initial balances should be 0';
  v_balance := get_user_balance(v_test_user_id);
  v_pm1_balance := get_payment_method_balance(v_pm1_id);
  v_pm2_balance := get_payment_method_balance(v_pm2_id);

  IF v_balance != 0 OR v_pm1_balance != 0 OR v_pm2_balance != 0 THEN
    RAISE EXCEPTION '✗ TEST 1 FAILED: Initial balances not zero. Total=%, PM1=%, PM2=%',
      v_balance, v_pm1_balance, v_pm2_balance;
  END IF;
  RAISE NOTICE '✓ TEST 1 PASSED: All balances are 0';

  -- TEST 2: Add income to PM1 ($500)
  RAISE NOTICE 'TEST 2: Add $500 income to Cash';
  INSERT INTO transactions (user_id, payment_method_id, category_id, type, amount, native_amount, date, description)
  VALUES (v_test_user_id, v_pm1_id, v_income_cat_id, 'income', 500, 500, CURRENT_DATE, 'Test income');

  v_balance := get_user_balance(v_test_user_id);
  v_pm1_balance := get_payment_method_balance(v_pm1_id);
  v_pm2_balance := get_payment_method_balance(v_pm2_id);

  IF v_balance != 500 OR v_pm1_balance != 500 OR v_pm2_balance != 0 THEN
    RAISE EXCEPTION '✗ TEST 2 FAILED: After $500 income. Total=% (expected 500), PM1=% (expected 500), PM2=% (expected 0)',
      v_balance, v_pm1_balance, v_pm2_balance;
  END IF;
  RAISE NOTICE '✓ TEST 2 PASSED: Total=$500, Cash=$500, Card=$0';

  -- TEST 3: Transfer $100 from PM1 to PM2
  RAISE NOTICE 'TEST 3: Transfer $100 from Cash to Card';

  -- Create withdrawal transaction (negative amount)
  INSERT INTO transactions (user_id, payment_method_id, type, amount, native_amount, date, description)
  VALUES (v_test_user_id, v_pm1_id, 'transfer', -100, -100, CURRENT_DATE, 'Transfer to Card')
  RETURNING id INTO v_trans1_id;

  -- Create deposit transaction (positive amount)
  INSERT INTO transactions (user_id, payment_method_id, type, amount, native_amount, date, description, linked_transaction_id)
  VALUES (v_test_user_id, v_pm2_id, 'transfer', 100, 100, CURRENT_DATE, 'Transfer from Cash', v_trans1_id)
  RETURNING id INTO v_trans2_id;

  -- Update withdrawal to link back to deposit
  UPDATE transactions SET linked_transaction_id = v_trans2_id WHERE id = v_trans1_id;

  v_balance := get_user_balance(v_test_user_id);
  v_pm1_balance := get_payment_method_balance(v_pm1_id);
  v_pm2_balance := get_payment_method_balance(v_pm2_id);

  IF v_balance != 500 THEN
    RAISE EXCEPTION '✗ TEST 3 FAILED: Total balance changed after transfer. Total=% (expected 500)', v_balance;
  END IF;

  IF v_pm1_balance != 400 THEN
    RAISE EXCEPTION '✗ TEST 3 FAILED: Cash balance incorrect. PM1=% (expected 400)', v_pm1_balance;
  END IF;

  IF v_pm2_balance != 100 THEN
    RAISE EXCEPTION '✗ TEST 3 FAILED: Card balance incorrect. PM2=% (expected 100)', v_pm2_balance;
  END IF;

  RAISE NOTICE '✓ TEST 3 PASSED: Total=$500 (unchanged), Cash=$400, Card=$100';

  -- TEST 4: Verify sum of payment accounts equals total
  RAISE NOTICE 'TEST 4: Verify sum of payment accounts equals total balance';
  IF (v_pm1_balance + v_pm2_balance) != v_balance THEN
    RAISE EXCEPTION '✗ TEST 4 FAILED: Sum of payment accounts (%) != total balance (%)',
      (v_pm1_balance + v_pm2_balance), v_balance;
  END IF;
  RAISE NOTICE '✓ TEST 4 PASSED: Cash + Card ($400 + $100) = Total ($500)';

  -- Cleanup
  DELETE FROM transactions WHERE user_id = v_test_user_id;
  DELETE FROM categories WHERE user_id = v_test_user_id;
  DELETE FROM payment_methods WHERE user_id = v_test_user_id;
  DELETE FROM profiles WHERE id = v_test_user_id;
  DELETE FROM auth.users WHERE id = v_test_user_id;

  RAISE NOTICE '=== ALL TESTS PASSED ✓ ===';
  RAISE NOTICE 'Balance calculation functions are now correct!';
END $$;

-- ============================================================================
-- MIGRATION SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Migration 20251222000004 applied successfully';
  RAISE NOTICE 'Bug #017C FIXED: Balance calculations now correct';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '- get_user_balance() now EXCLUDES transfers';
  RAISE NOTICE '- get_payment_method_balance() now INCLUDES transfers';
  RAISE NOTICE '- Overall balance stays constant during transfers';
  RAISE NOTICE '- Payment account balances update correctly';
  RAISE NOTICE '';
END $$;
