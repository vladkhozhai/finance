-- Test script to verify payment_methods schema and RLS policies

-- 1. Check if payment_methods table exists
SELECT 'payment_methods table exists' AS test,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_methods' AND table_schema = 'public') AS result;

-- 2. Check RLS is enabled on payment_methods
SELECT 'RLS enabled on payment_methods' AS test,
  relrowsecurity AS result
FROM pg_class
WHERE relname = 'payment_methods' AND relnamespace = 'public'::regnamespace;

-- 3. Check columns exist
SELECT 'payment_methods columns' AS test,
  string_agg(column_name::text, ', ' ORDER BY ordinal_position) AS result
FROM information_schema.columns
WHERE table_name = 'payment_methods' AND table_schema = 'public';

-- 4. Check constraints
SELECT 'payment_methods constraints' AS test,
  string_agg(constraint_name::text, ', ') AS result
FROM information_schema.table_constraints
WHERE table_name = 'payment_methods' AND table_schema = 'public';

-- 5. Check indexes
SELECT 'payment_methods indexes' AS test,
  string_agg(indexname::text, ', ') AS result
FROM pg_indexes
WHERE tablename = 'payment_methods' AND schemaname = 'public';

-- 6. Check RLS policies
SELECT 'payment_methods policies' AS test,
  string_agg(policyname::text, ', ') AS result
FROM pg_policies
WHERE tablename = 'payment_methods' AND schemaname = 'public';

-- 7. Check helper functions exist
SELECT 'Helper functions' AS test,
  string_agg(proname::text, ', ') AS result
FROM pg_proc
WHERE proname IN ('get_payment_method_balance', 'get_user_active_payment_methods_count', 'get_user_default_payment_method');

-- 8. Check transactions table has payment_method_id column
SELECT 'transactions.payment_method_id exists' AS test,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'payment_method_id') AS result;

-- 9. Check foreign key constraint exists
SELECT 'payment_method FK exists' AS test,
  EXISTS(
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'transactions'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'payment_method_id'
  ) AS result;
