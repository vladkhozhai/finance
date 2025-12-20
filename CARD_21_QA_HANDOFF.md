# Card #21: Exchange Rate Management - QA Handoff

## 🎯 What Was Implemented

**Feature**: Live exchange rate integration with caching and daily refresh for multi-currency transactions.

**Key Changes**:
- ✅ Database schema enhanced with cache management columns
- ✅ Exchange rate service created for API integration
- ✅ Cron endpoint secured with authentication token
- ✅ Transaction actions updated to use live rates
- ✅ Stale-while-revalidate fallback implemented

---

## 🔧 Setup Instructions

### 1. Ensure Development Environment is Ready

```bash
# Pull latest code
git pull origin main

# Install dependencies (if needed)
npm install

# Start Supabase local instance
npx supabase start

# Apply migrations (if not already applied)
npx supabase migration up --include-all

# Start dev server
npm run dev
```

### 2. Verify Environment Variables

Check `.env.local` contains:
```bash
EXCHANGE_RATE_API_URL=https://open.er-api.com/v6/latest/USD
EXCHANGE_RATE_CACHE_TTL_HOURS=24
EXCHANGE_RATE_CRON_SECRET=RY3OPh1KrHcnyChQlMhh+WTv5+WKS50dAtOb/3oe1H0=
```

### 3. Verify Database Schema

```sql
-- Check that exchange_rates table has new columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'exchange_rates'
AND column_name IN ('expires_at', 'last_fetched_at', 'api_provider', 'is_stale', 'fetch_error_count');
```
**Expected**: 5 rows returned

---

## 🧪 Test Cases

### TC-01: Cron Endpoint Authentication

**Priority**: HIGH
**Type**: Security

**Test Case 01.1: Valid Token**
```bash
curl -X GET http://localhost:3000/api/cron/refresh-rates \
  -H "Authorization: Bearer RY3OPh1KrHcnyChQlMhh+WTv5+WKS50dAtOb/3oe1H0="
```
**Expected**:
- Status: 200 OK
- Response: `{"success": true, "message": "Exchange rates refreshed successfully", ...}`

**Test Case 01.2: Invalid Token**
```bash
curl -X GET http://localhost:3000/api/cron/refresh-rates \
  -H "Authorization: Bearer INVALID_TOKEN"
```
**Expected**:
- Status: 401 Unauthorized
- Response: `{"error": "Unauthorized", "details": "Invalid or missing authorization token"}`

**Test Case 01.3: Missing Token**
```bash
curl -X GET http://localhost:3000/api/cron/refresh-rates
```
**Expected**:
- Status: 401 Unauthorized
- Response: `{"error": "Unauthorized", ...}`

**Test Case 01.4: Wrong HTTP Method**
```bash
curl -X POST http://localhost:3000/api/cron/refresh-rates \
  -H "Authorization: Bearer RY3OPh1KrHcnyChQlMhh+WTv5+WKS50dAtOb/3oe1H0="
```
**Expected**:
- Status: 405 Method Not Allowed
- Response: `{"error": "Method not allowed"}`

---

### TC-02: Exchange Rate Fetching

**Priority**: HIGH
**Type**: Functional

**Prerequisites**:
- Login to FinanceFlow
- Create payment method with UAH currency (if not exists)
- Have at least one category

**Test Case 02.1: First Transaction (Cold Cache)**

**Steps**:
1. Navigate to Transactions page
2. Click "Create Transaction"
3. Fill in:
   - Type: Expense
   - Amount: 1000
   - Payment Method: UAH Card
   - Category: Food
   - Date: Today
4. Submit transaction

**Expected**:
- ✅ Transaction creates successfully
- ✅ Check browser console/server logs: Should see API call (~500ms latency)
- ✅ Verify in database:
  ```sql
  SELECT from_currency, to_currency, rate, source, api_provider
  FROM exchange_rates
  WHERE from_currency = 'UAH' AND to_currency = 'USD'
  ORDER BY created_at DESC
  LIMIT 1;
  ```
  - `source` should be 'API'
  - `api_provider` should be 'exchangerate-api.com'
  - `expires_at` should be ~24 hours in future

**Test Case 02.2: Second Transaction (Warm Cache)**

**Steps**:
1. Immediately create another transaction with same currency
2. Submit transaction

**Expected**:
- ✅ Transaction creates successfully
- ✅ Check logs: Should use cached rate (<50ms, no API call logged)
- ✅ Verify in database: Same rate as Test Case 02.1 (no new row created)

**Test Case 02.3: Identity Conversion (Same Currency)**

**Steps**:
1. Create transaction where payment method currency = user base currency (e.g., USD → USD)
2. Submit transaction

**Expected**:
- ✅ Transaction creates successfully
- ✅ Exchange rate should be 1.0 (no API call)

---

### TC-03: Cache Expiration

**Priority**: MEDIUM
**Type**: Functional

**Test Case 03.1: Verify Cache TTL**

**Steps**:
1. Create transaction to populate cache
2. Check database:
   ```sql
   SELECT from_currency, to_currency,
          EXTRACT(EPOCH FROM (expires_at - NOW())) / 3600 as hours_until_expiration
   FROM exchange_rates
   WHERE source = 'API'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

**Expected**:
- `hours_until_expiration` should be ≈ 24 hours (within ±1 minute)

**Test Case 03.2: Expired Cache Behavior**

**Steps**:
1. Create transaction to populate cache
2. Manually expire cache:
   ```sql
   UPDATE exchange_rates
   SET expires_at = NOW() - INTERVAL '1 hour'
   WHERE source = 'API' AND from_currency = 'UAH' AND to_currency = 'USD';
   ```
3. Create another transaction with same currency

**Expected**:
- ✅ Transaction creates successfully
- ✅ New API call made (check logs)
- ✅ Cache updated with new `expires_at`

---

### TC-04: Stale Rate Fallback

**Priority**: HIGH
**Type**: Error Handling

**Test Case 04.1: API Unavailable with Stale Cache**

**Prerequisites**:
- Disconnect from internet OR modify `.env.local` to use invalid API URL

**Steps**:
1. Create transaction with stale cache present (mark as stale first):
   ```sql
   UPDATE exchange_rates
   SET expires_at = NOW() - INTERVAL '1 hour',
       is_stale = true
   WHERE source = 'API' AND from_currency = 'UAH';
   ```
2. Create transaction with UAH payment method

**Expected**:
- ✅ Transaction creates successfully (uses stale rate)
- ✅ Warning logged: "Using stale exchange rate"
- ✅ No error shown to user

**Test Case 04.2: API Unavailable without Cache**

**Prerequisites**:
- Disconnect from internet
- Delete all cached rates for test currency:
  ```sql
  DELETE FROM exchange_rates
  WHERE from_currency = 'UAH' AND to_currency = 'USD'
  AND source = 'API';
  ```

**Steps**:
1. Create transaction with UAH payment method

**Expected**:
- ❌ Transaction fails with error: "Exchange rate not available for UAH to USD. Please provide a manual rate."
- ✅ User sees clear error message

---

### TC-05: Manual Rate Override

**Priority**: LOW
**Type**: Functional

**Test Case 05.1: Set Manual Rate**

**Steps**:
1. In browser console or test script:
   ```javascript
   // Note: This would typically be done by admin/user in future UI
   const response = await fetch('/api/set-manual-rate', {
     method: 'POST',
     body: JSON.stringify({
       fromCurrency: 'UAH',
       toCurrency: 'USD',
       rate: 0.025
     })
   });
   ```
   OR provide manual rate in transaction form (if UI supports it)

2. Create transaction with UAH payment method

**Expected**:
- ✅ Transaction uses manual rate (0.025) instead of API rate
- ✅ Verify in database:
  ```sql
  SELECT * FROM exchange_rates
  WHERE source = 'MANUAL'
  ORDER BY created_at DESC;
  ```

---

### TC-06: Multi-Currency Pairs

**Priority**: MEDIUM
**Type**: Functional

**Test Case 06.1: USD → EUR (Direct API Support)**

**Steps**:
1. Create payment method with EUR currency
2. Create transaction with EUR payment method
3. User base currency: USD

**Expected**:
- ✅ Transaction creates successfully
- ✅ Rate fetched from API (EUR → USD conversion)

**Test Case 06.2: UAH → EUR (Triangulation via USD)**

**Steps**:
1. Create payment method with UAH currency
2. Create transaction with UAH payment method
3. User base currency: EUR

**Expected**:
- ✅ Transaction creates successfully
- ✅ Rate calculated via triangulation: UAH → USD → EUR
- ✅ Verify calculation:
  ```sql
  SELECT
    (SELECT rate FROM exchange_rates WHERE from_currency = 'UAH' AND to_currency = 'USD') AS uah_to_usd,
    (SELECT rate FROM exchange_rates WHERE from_currency = 'USD' AND to_currency = 'EUR') AS usd_to_eur,
    (SELECT rate FROM exchange_rates WHERE from_currency = 'UAH' AND to_currency = 'EUR') AS uah_to_eur;
  ```
  - `uah_to_eur` ≈ `uah_to_usd` * `usd_to_eur` (within rounding tolerance)

**Test Case 06.3: Inverse Rate Storage**

**Steps**:
1. Create transaction: UAH → USD
2. Check database:
   ```sql
   SELECT from_currency, to_currency, rate
   FROM exchange_rates
   WHERE (from_currency = 'UAH' AND to_currency = 'USD')
      OR (from_currency = 'USD' AND to_currency = 'UAH')
   ORDER BY created_at DESC;
   ```

**Expected**:
- ✅ Both rates stored (UAH → USD AND USD → UAH)
- ✅ Inverse relationship: `rate(UAH→USD) * rate(USD→UAH)` ≈ 1.0

---

### TC-07: Cron Rate Refresh

**Priority**: HIGH
**Type**: Integration

**Test Case 07.1: Manual Cron Trigger**

**Steps**:
1. Trigger cron endpoint:
   ```bash
   curl -X GET http://localhost:3000/api/cron/refresh-rates \
     -H "Authorization: Bearer RY3OPh1KrHcnyChQlMhh+WTv5+WKS50dAtOb/3oe1H0="
   ```

**Expected**:
- ✅ Status: 200 OK
- ✅ Response contains: `"success": true`
- ✅ Check database: Multiple rates updated
  ```sql
  SELECT COUNT(*) FROM exchange_rates
  WHERE last_fetched_at >= NOW() - INTERVAL '1 minute';
  ```
  Should be > 0

**Test Case 07.2: Verify Stale Marking**

**Steps**:
1. Manually expire some rates:
   ```sql
   UPDATE exchange_rates
   SET expires_at = NOW() - INTERVAL '1 hour',
       is_stale = false
   WHERE source = 'API'
   LIMIT 5;
   ```
2. Trigger cron endpoint
3. Check database:
   ```sql
   SELECT COUNT(*) FROM exchange_rates
   WHERE is_stale = true;
   ```

**Expected**:
- ✅ Expired rates marked as `is_stale = true`

**Test Case 07.3: Cleanup Old Rates**

**Steps**:
1. Insert old test rate:
   ```sql
   INSERT INTO exchange_rates (from_currency, to_currency, rate, date, source, is_stale)
   VALUES ('TEST', 'USD', 1.5, CURRENT_DATE - INTERVAL '100 days', 'API', true);
   ```
2. Call cleanup function:
   ```sql
   SELECT cleanup_old_rates();
   ```

**Expected**:
- ✅ Old test rate deleted
- ✅ Function returns count of deleted rows

---

### TC-08: Error Handling

**Priority**: MEDIUM
**Type**: Error Handling

**Test Case 08.1: API Rate Limit Exceeded**

**Steps**:
1. Mock API response with rate limit error (requires code modification or proxy)
2. Create transaction

**Expected**:
- ✅ Falls back to stale rate (if available)
- ✅ OR shows clear error message (if no stale rate)
- ✅ `fetch_error_count` incremented

**Test Case 08.2: Invalid Currency Code**

**Steps**:
1. Create transaction with invalid currency code (e.g., "XXX")

**Expected**:
- ❌ Transaction fails with validation error
- ✅ No API call made

**Test Case 08.3: Network Timeout**

**Steps**:
1. Simulate network timeout (set very low timeout in fetch call)
2. Create transaction

**Expected**:
- ✅ Falls back to stale rate
- ✅ Error logged but user not blocked

---

## 🔍 Regression Testing

### Areas to Test for Regressions

1. **Existing Multi-Currency Transactions** (Card #20)
   - ✅ Legacy transactions still work (NULL multi-currency fields)
   - ✅ Manual exchange rate override still works
   - ✅ Payment method balance calculation correct

2. **Transaction CRUD Operations**
   - ✅ Create transaction without payment method (legacy mode)
   - ✅ Update transaction with currency change
   - ✅ Delete transaction (cascade to tags)

3. **Dashboard Balance Display**
   - ✅ Balance calculated correctly in base currency
   - ✅ Payment method balances show native currency amounts
   - ✅ Total balance conversion accurate

4. **Budget Tracking**
   - ✅ Budget calculations use base currency amounts
   - ✅ Multi-currency transactions counted correctly in budgets

---

## 📊 Performance Testing

### Test Case P-01: Cache Performance

**Steps**:
1. Create 10 transactions with same currency pair
2. Measure API calls

**Expected**:
- ✅ Only 1 API call made (first transaction)
- ✅ Remaining 9 use cache (<50ms)

### Test Case P-02: Cron Job Duration

**Steps**:
1. Trigger cron endpoint
2. Check response `durationMs` field

**Expected**:
- ✅ Duration < 10 seconds (typical: 1-5 seconds)

---

## 🐛 Known Issues / Limitations

1. **API Rate Limit**: Free tier has 1,500 req/month
   - Mitigated by 24-hour caching
   - Monitor usage via database

2. **No Historical Rates**: API provides latest rates only
   - Transactions use latest rate regardless of date
   - Manual override available if needed

3. **Triangulation Precision**: Non-USD pairs calculated via USD
   - Small rounding errors possible (< 0.01%)
   - Acceptable for personal finance tracking

---

## 🚨 Blocker Issues to Report

If you encounter these, **STOP** and report immediately:

1. ❌ Transaction creation fails with rate-related errors (no fallback)
2. ❌ Cron endpoint accessible without authentication
3. ❌ API calls made on every transaction (cache not working)
4. ❌ Database migration fails or corrupts data
5. ❌ TypeScript build errors
6. ❌ Dev server won't start due to exchange rate code

---

## 📝 Test Report Template

**Date**: [Date]
**Tester**: [Your Name]
**Environment**: Local Development / Staging / Production
**Branch**: [Git Branch]

### Summary
- Total Test Cases: X
- Passed: X
- Failed: X
- Blocked: X

### Failed Test Cases
| TC ID | Description | Expected | Actual | Severity |
|-------|-------------|----------|--------|----------|
| TC-XX | ... | ... | ... | High/Medium/Low |

### Observations
- [Any unexpected behavior]
- [Performance notes]
- [Suggestions for improvement]

### Screenshots
- [Attach relevant screenshots]

### Sign-off
- [ ] All critical tests passed
- [ ] No blocking issues found
- [ ] Ready for production deployment

---

## 📞 Support

**Backend Developer**: Available for:
- Service architecture questions
- Cache behavior issues
- API integration problems
- Error handling clarifications

**System Architect**: Available for:
- Database schema questions
- Migration issues
- Performance optimization
- RLS policy questions

---

## ✅ Definition of Done

- [ ] All HIGH priority test cases pass
- [ ] No critical/blocker bugs found
- [ ] Cron endpoint security verified
- [ ] Cache behavior confirmed (reduces API calls)
- [ ] Stale fallback tested and working
- [ ] Regression tests pass
- [ ] Performance acceptable (<10s cron, <50ms cache)
- [ ] Documentation reviewed and accurate

---

**Status**: 🟢 Ready for QA Testing

**Next Steps**:
1. Run all test cases
2. Document results
3. Report any issues
4. Sign off on completion
