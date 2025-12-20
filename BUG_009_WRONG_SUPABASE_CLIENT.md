# BUG #009: Exchange Rate Service Uses Wrong Supabase Client

**Status:** 🔴 CRITICAL (P0)
**Date:** 2025-12-18
**Tester:** QA Engineer
**Card:** #21 - Exchange Rate Management
**Related:** BUG #008 (API field name fix)

---

## Executive Summary

After the P0 bug fix for API field names (`rates` vs `conversion_rates`), a **NEW P0 bug** was discovered during re-testing. The exchange rate service successfully fetches rates from the API but **fails to store them in the database** due to using the wrong Supabase client type.

**Root Cause:** The service uses `createServerClient()` (ANON KEY) instead of `createAdminClient()` (SERVICE ROLE KEY), causing Row Level Security (RLS) policies to block unauthenticated inserts.

---

## Bug Details

### Severity: P0 - Critical
**Impact:**
- ❌ Cron endpoint returns "success" but stores **ZERO rates**
- ❌ All exchange rate functionality broken (no rates in database)
- ❌ Transactions with non-USD currencies will fail or use stale fallback
- ❌ Silent failure - no error messages, appears to work

### Affected Component
- **File:** `/src/lib/services/exchange-rate-service.ts`
- **Method:** `refreshAllRates()`, `storeRate()`, `getRate()`
- **Line 361:** `const supabase = await createServerClient();`

### Environment
- Next.js 16.0.8 (Turbopack)
- Supabase local instance (127.0.0.1:54321)
- RLS enabled on `exchange_rates` table

---

## Reproduction Steps

### 1. Clear existing API rates
```bash
npx tsx scripts/clear-api-rates.ts
```

**Expected:** 0 API-sourced rates in database

### 2. Trigger cron endpoint
```bash
curl -X GET http://localhost:3000/api/cron/refresh-rates \
  -H "Authorization: Bearer RY3OPh1KrHcnyChQlMhh+WTv5+WKS50dAtOb/3oe1H0="
```

**Expected:**
```json
{
  "success": true,
  "message": "Exchange rates refreshed successfully",
  "timestamp": "2025-12-18T12:59:44.860Z",
  "durationMs": 130
}
```

### 3. Verify rates in database
```bash
npx tsx scripts/verify-exchange-rates.ts
```

**Actual Result:**
```
✅ Total API-sourced rates: 0
❌ BUG NOT FIXED: No rates found with source='API'
```

**Expected Result:**
```
✅ Total API-sourced rates: 6 (or more)
✅ BUG FIXED: Rates are being fetched from API!
```

---

## Technical Analysis

### 1. The Two Supabase Clients

#### createServerClient() (CURRENTLY USED - ❌ WRONG)
```typescript
// /src/lib/supabase/server.ts
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // ❌ ANON KEY
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: { /* cookie management */ }
  });
}
```

**Characteristics:**
- Uses **ANON KEY** (public, restricted permissions)
- Requires authenticated user session (from cookies)
- **Respects RLS policies** (user-based access control)
- ❌ Fails when no user session exists (like cron jobs)

#### createAdminClient() (SHOULD USE - ✅ CORRECT)
```typescript
// /src/lib/supabase/server.ts
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // ✅ SERVICE ROLE

  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
```

**Characteristics:**
- Uses **SERVICE ROLE KEY** (secret, full permissions)
- No user session required
- **Bypasses RLS policies** (trusted operations)
- ✅ Perfect for background jobs, cron, system operations

---

### 2. RLS Policies on exchange_rates Table

```sql
-- From migration: 20251218113344_add_multi_currency_to_transactions.sql

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view exchange rates"
  ON exchange_rates FOR SELECT
  TO authenticated -- ❌ Requires authenticated user
  USING (true);

CREATE POLICY "Authenticated users can insert exchange rates"
  ON exchange_rates FOR INSERT
  TO authenticated -- ❌ Requires authenticated user
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update exchange rates"
  ON exchange_rates FOR UPDATE
  TO authenticated -- ❌ Requires authenticated user
  USING (true)
  WITH CHECK (true);
```

**Problem:**
- All policies require `TO authenticated` role
- Cron endpoint has **NO authenticated session**
- ANON KEY client → **RLS blocks all inserts/updates**
- Result: Silent failure, zero rates stored

---

### 3. Proof: Manual Test with SERVICE ROLE KEY

When using SERVICE ROLE KEY directly (bypassing the service):

```bash
# My test script using SERVICE ROLE KEY
npx tsx scripts/test-store-rate.ts
```

**Result:**
```
✅ UPSERT SUCCEEDED:
   Stored rate: { id: '1013f467-...', from_currency: 'USD', to_currency: 'EUR', ... }
✅ VERIFICATION SUCCEEDED:
   Found rate in database
```

**Conclusion:** Database schema is correct, RLS policies work as intended, but service uses wrong client type.

---

## Impact Assessment

### Critical User-Facing Issues
1. **No exchange rates available** → Transactions fail or use outdated fallback rates
2. **Silent failure** → Users/admins think system is working (cron returns "success")
3. **Data staleness** → Even with daily cron, rates never refresh
4. **API waste** → Cron fetches rates but discards them (API quota wasted)

### Affected Acceptance Criteria
| AC | Requirement | Status | Notes |
|----|-------------|--------|-------|
| AC1 | Fetch rates from API | ✅ PASS | API fetch works (Bug #008 fixed) |
| AC2 | Cache rates for 24 hours | ❌ FAIL | No rates stored → no cache |
| AC5 | Store rate with transaction | ❌ BLOCKED | No rates available |
| AC7 | Error handling with fallback | ❌ BLOCKED | Stale fallback untested |
| AC8 | Auto-refresh after 24h | ❌ FAIL | Refresh stores zero rates |
| AC9 | Admin manual refresh (cron) | ❌ FAIL | Cron fails silently |

**Pass Rate:** 1/6 backend ACs (17%)
**Blockers:** 5 critical ACs blocked by this bug

---

## Fix Required

### Location
`/src/lib/services/exchange-rate-service.ts`

### Changes Needed

**Line 361 (current):**
```typescript
const supabase = await createServerClient(); // ❌ WRONG
```

**Line 361 (should be):**
```typescript
const supabase = createAdminClient(); // ✅ CORRECT
```

**Also check these methods:**
- ❌ `refreshAllRates()` - Line 361
- ❌ `storeRate()` - Line 257
- ✅ `getRate()` - Line 81 (OK to use createServerClient for reads)
- ✅ `isCacheValid()` - Line 440 (OK, read-only)
- ✅ `getAllRates()` - Line 469 (OK, read-only)
- ❌ `setManualRate()` - Line 512 (should use admin for writes)

**Read operations** (SELECT) can use `createServerClient()` since RLS allows authenticated users to view rates.
**Write operations** (INSERT/UPDATE/DELETE) **MUST** use `createAdminClient()` to bypass RLS for system operations.

---

## Verification Steps (After Fix)

1. **Clear database:**
   ```bash
   npx tsx scripts/clear-api-rates.ts
   # Expected: 0 API rates
   ```

2. **Trigger cron:**
   ```bash
   curl -X GET http://localhost:3000/api/cron/refresh-rates \
     -H "Authorization: Bearer RY3OPh1KrHcnyChQlMhh+WTv5+WKS50dAtOb/3oe1H0="
   ```

3. **Verify rates stored:**
   ```bash
   npx tsx scripts/verify-exchange-rates.ts
   # Expected: 6+ API-sourced rates (EUR↔USD, UAH↔USD, EUR↔UAH)
   ```

4. **Check freshness:**
   ```sql
   SELECT from_currency, to_currency, rate, last_fetched_at
   FROM exchange_rates
   WHERE source = 'API'
   ORDER BY last_fetched_at DESC
   LIMIT 10;
   -- All timestamps should be within last few minutes
   ```

---

## Logs & Evidence

### Server Logs (Silent Failure)
```
Starting scheduled exchange rate refresh...
Refreshing rates for currencies: EUR, UAH, USD
Rate refresh completed successfully
Exchange rate refresh completed in 130ms
```

**No error messages, but zero rates stored.**

### Database State Before Fix
```bash
$ npx tsx scripts/verify-exchange-rates.ts
✅ Total API-sourced rates: 0
❌ BUG NOT FIXED: No rates found with source='API'
```

### Test Script Success (with SERVICE ROLE)
```bash
$ npx tsx scripts/simulate-refresh-all.ts
3. Results:
   ✅ Success: 6 rates
   ❌ Failed: 0 rates

5. Final verification:
   Total API-sourced rates in DB: 6
```

---

## Related Issues

- **Bug #008:** API field name mismatch (`rates` vs `conversion_rates`)
  **Status:** ✅ FIXED (confirmed working in test scripts)

- **This Bug (#009):** Wrong Supabase client prevents storing rates
  **Status:** 🔴 OPEN (discovered during Bug #008 re-testing)

---

## Recommendations

1. **Immediate Fix:**
   - Change `createServerClient()` → `createAdminClient()` in write methods
   - Estimated time: 5 minutes
   - Risk: Low (only affects system operations, not user-facing code)

2. **Add Error Handling:**
   - Log actual error details in `refreshAllRates()` catch blocks
   - Currently errors are caught but not surfaced
   - Return `ratesUpdated` count in cron response

3. **Improve Monitoring:**
   - Cron should return count of rates updated: `{ success: true, ratesUpdated: 6 }`
   - Add alerting if `ratesUpdated === 0` after cron runs
   - Log each successful rate insertion (not just errors)

4. **Add Integration Test:**
   - Test cron endpoint → verify rates in DB
   - Catch this class of bugs earlier
   - Part of CI/CD pipeline

---

## Priority Justification

**Why P0 (Critical)?**
- 🚨 **Complete feature failure** - Zero exchange rates stored
- 🚨 **Silent failure** - No visible errors, appears to work
- 🚨 **Blocks all multi-currency** - Cannot test transactions with UAH/EUR
- 🚨 **Affects production** - Will fail in deployed environment
- 🚨 **Simple fix** - 1-line change, high confidence

**Recommendation:** ❌ **REJECT for release**

This bug MUST be fixed before proceeding with frontend implementation or release. The exchange rate feature is completely non-functional despite appearing to work.

---

## Assignee
**Backend Developer (Agent 03)** - Service implementation issue

## Next Steps
1. Backend Developer: Apply fix to `exchange-rate-service.ts`
2. QA Engineer: Re-test all acceptance criteria
3. QA Engineer: Run full integration test suite
4. Final approval for Card #21 completion
