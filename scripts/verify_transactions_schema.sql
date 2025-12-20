-- ============================================================================
-- SCHEMA VERIFICATION SCRIPT FOR TRANSACTIONS AND TRANSACTION_TAGS
-- ============================================================================
-- This script verifies all requirements from PRD Card #5

\echo '============================================================================'
\echo 'TRANSACTIONS TABLE VERIFICATION'
\echo '============================================================================'

-- Check table exists and view structure
\d transactions

\echo ''
\echo '--- Checking Constraints ---'
SELECT
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'transactions'
ORDER BY con.contype, con.conname;

\echo ''
\echo '--- Checking Indexes ---'
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'transactions'
ORDER BY indexname;

\echo ''
\echo '--- Checking Foreign Keys ---'
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name='transactions';

\echo ''
\echo '--- Checking RLS Policies ---'
SELECT
  polname AS policy_name,
  polcmd AS command,
  CASE polpermissive
    WHEN TRUE THEN 'PERMISSIVE'
    ELSE 'RESTRICTIVE'
  END AS type,
  pg_get_expr(polqual, polrelid) AS using_expression,
  pg_get_expr(polwithcheck, polrelid) AS with_check_expression
FROM pg_policy
WHERE polrelid = 'transactions'::regclass
ORDER BY polcmd, polname;

\echo ''
\echo '============================================================================'
\echo 'TRANSACTION_TAGS TABLE VERIFICATION'
\echo '============================================================================'

-- Check table exists and view structure
\d transaction_tags

\echo ''
\echo '--- Checking Constraints ---'
SELECT
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'transaction_tags'
ORDER BY con.contype, con.conname;

\echo ''
\echo '--- Checking Indexes ---'
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'transaction_tags'
ORDER BY indexname;

\echo ''
\echo '--- Checking Foreign Keys ---'
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name='transaction_tags';

\echo ''
\echo '--- Checking RLS Policies ---'
SELECT
  polname AS policy_name,
  polcmd AS command,
  CASE polpermissive
    WHEN TRUE THEN 'PERMISSIVE'
    ELSE 'RESTRICTIVE'
  END AS type,
  pg_get_expr(polqual, polrelid) AS using_expression,
  pg_get_expr(polwithcheck, polrelid) AS with_check_expression
FROM pg_policy
WHERE polrelid = 'transaction_tags'::regclass
ORDER BY polcmd, polname;

\echo ''
\echo '============================================================================'
\echo 'FUNCTIONAL TESTS'
\echo '============================================================================'

-- Test 1: Amount validation (must be positive)
\echo ''
\echo '--- Test 1: Amount Validation (must be positive) ---'
BEGIN;
-- This should fail with constraint violation
INSERT INTO transactions (user_id, category_id, amount, type, date, description)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  -10.50,
  'expense',
  CURRENT_DATE,
  'Should fail - negative amount'
);
ROLLBACK;

-- Test 2: Type validation (must be income or expense)
\echo ''
\echo '--- Test 2: Type Validation (must be income or expense) ---'
BEGIN;
-- This should fail with constraint violation
INSERT INTO transactions (user_id, category_id, amount, type, date, description)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  10.50,
  'invalid_type',
  CURRENT_DATE,
  'Should fail - invalid type'
);
ROLLBACK;

-- Test 3: Description length validation (max 500 characters)
\echo ''
\echo '--- Test 3: Description Length Validation (max 500 chars) ---'
BEGIN;
-- This should fail with constraint violation
INSERT INTO transactions (user_id, category_id, amount, type, date, description)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  10.50,
  'expense',
  CURRENT_DATE,
  REPEAT('x', 501) -- 501 characters
);
ROLLBACK;

-- Test 4: Type normalization (should convert to lowercase)
\echo ''
\echo '--- Test 4: Type Normalization (converts to lowercase) ---'
\echo 'Note: This test requires actual user and category to pass foreign key constraints'

\echo ''
\echo '============================================================================'
\echo 'VERIFICATION SUMMARY'
\echo '============================================================================'
\echo 'Schema verification complete. Review the output above for:'
\echo '  ✓ Transactions table has type, amount, date, description, user_id, category_id'
\echo '  ✓ Amount constraint: CHECK (amount > 0)'
\echo '  ✓ Type constraint: CHECK (LOWER(type) IN (income, expense))'
\echo '  ✓ Description constraint: CHECK (description IS NULL OR LENGTH(description) <= 500)'
\echo '  ✓ Foreign key: category_id REFERENCES categories ON DELETE RESTRICT'
\echo '  ✓ Foreign key: user_id REFERENCES auth.users ON DELETE CASCADE'
\echo '  ✓ Indexes: (user_id, date DESC), category_id, type'
\echo '  ✓ RLS Policies: SELECT, INSERT, UPDATE, DELETE for user_id ownership'
\echo ''
\echo '  ✓ Transaction_tags table has transaction_id, tag_id, created_at'
\echo '  ✓ Composite PRIMARY KEY (transaction_id, tag_id) ensures uniqueness'
\echo '  ✓ Foreign key: transaction_id REFERENCES transactions ON DELETE CASCADE'
\echo '  ✓ Foreign key: tag_id REFERENCES tags ON DELETE CASCADE'
\echo '  ✓ Indexes: transaction_id, tag_id'
\echo '  ✓ RLS Policies: SELECT, INSERT, UPDATE, DELETE based on transaction ownership'
\echo '============================================================================'
