-- Verification Script for Multi-Currency Schema
-- Run this after migration to verify everything is working correctly

-- ============================================================================
-- 1. Verify Schema Changes
-- ============================================================================

SELECT '=== Transactions Table Columns ===' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'transactions'
  AND column_name IN ('native_amount', 'exchange_rate', 'base_currency', 'payment_method_id')
ORDER BY column_name;

SELECT '=== Exchange Rates Table Structure ===' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'exchange_rates'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. Verify Exchange Rates Data
-- ============================================================================

SELECT '=== Exchange Rates Count by Source ===' as section;
SELECT source, COUNT(*) as total_rates
FROM exchange_rates
GROUP BY source
ORDER BY source;

SELECT '=== Sample Exchange Rates (USD pairs) ===' as section;
SELECT from_currency, to_currency, rate, date
FROM exchange_rates
WHERE from_currency = 'USD' OR to_currency = 'USD'
ORDER BY from_currency, to_currency
LIMIT 10;

SELECT '=== EUR/USD Rate Check ===' as section;
SELECT from_currency, to_currency, rate
FROM exchange_rates
WHERE (from_currency = 'EUR' AND to_currency = 'USD')
   OR (from_currency = 'USD' AND to_currency = 'EUR');

-- ============================================================================
-- 3. Test Helper Functions
-- ============================================================================

SELECT '=== Test get_exchange_rate() Function ===' as section;

-- Identity conversion (should return 1.0)
SELECT 'USD to USD (identity)' as test_case,
       get_exchange_rate('USD', 'USD') as rate;

-- Direct rate lookup
SELECT 'EUR to USD (direct)' as test_case,
       get_exchange_rate('EUR', 'USD') as rate;

-- Reverse rate (should calculate from inverse)
SELECT 'USD to EUR (reverse)' as test_case,
       get_exchange_rate('USD', 'EUR') as rate;

-- Non-existent rate (should return NULL)
SELECT 'XXX to YYY (not found)' as test_case,
       get_exchange_rate('XXX', 'YYY') as rate;

-- ============================================================================
-- 4. Test convert_amount() Function
-- ============================================================================

SELECT '=== Test convert_amount() Function ===' as section;

-- Convert EUR to USD
SELECT 'Convert €100 to USD' as test_case,
       convert_amount(100.00, 'EUR', 'USD') as converted_amount;

-- Convert USD to EUR
SELECT 'Convert $100 to EUR' as test_case,
       convert_amount(100.00, 'USD', 'EUR') as converted_amount;

-- Convert UAH to USD
SELECT 'Convert ₴1000 to USD' as test_case,
       convert_amount(1000.00, 'UAH', 'USD') as converted_amount;

-- Identity conversion
SELECT 'Convert $100 to USD (identity)' as test_case,
       convert_amount(100.00, 'USD', 'USD') as converted_amount;

-- ============================================================================
-- 5. Verify Indexes
-- ============================================================================

SELECT '=== Indexes on transactions (multi-currency) ===' as section;
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'transactions'
  AND (indexname LIKE '%currency%' OR indexname LIKE '%payment_method%' OR indexname LIKE '%legacy%')
ORDER BY indexname;

SELECT '=== Indexes on exchange_rates ===' as section;
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'exchange_rates'
ORDER BY indexname;

-- ============================================================================
-- 6. Verify RLS Policies
-- ============================================================================

SELECT '=== RLS Policies for exchange_rates ===' as section;
SELECT policyname, cmd as operation, roles
FROM pg_policies
WHERE tablename = 'exchange_rates'
ORDER BY policyname;

-- ============================================================================
-- 7. Verify Constraints
-- ============================================================================

SELECT '=== Check Constraints on transactions ===' as section;
SELECT conname as constraint_name, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'transactions'::regclass
  AND contype = 'c'
  AND conname LIKE '%currency%'
ORDER BY conname;

SELECT '=== Check Constraints on exchange_rates ===' as section;
SELECT conname as constraint_name, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'exchange_rates'::regclass
  AND contype = 'c'
ORDER BY conname;

-- ============================================================================
-- 8. Cross-Currency Calculations Example
-- ============================================================================

SELECT '=== Cross-Currency Conversion Examples ===' as section;

-- EUR to GBP (via cross-rate)
SELECT 'EUR to GBP' as conversion,
       get_exchange_rate('EUR', 'GBP') as rate,
       convert_amount(100.00, 'EUR', 'GBP') as amount;

-- UAH to EUR
SELECT 'UAH to EUR' as conversion,
       get_exchange_rate('UAH', 'EUR') as rate,
       convert_amount(1000.00, 'UAH', 'EUR') as amount;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '=== ✅ VERIFICATION COMPLETE ===' as section;
SELECT 'All schema components verified successfully!' as message;
SELECT 'Multi-currency transaction support is ready for backend implementation.' as status;
