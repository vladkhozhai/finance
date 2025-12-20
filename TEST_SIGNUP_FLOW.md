# Test Plan: User Signup Flow

## Bug Fixed
Database error when creating new users during signup has been resolved.

## What Was Fixed
1. Removed duplicate profile creation in Server Action
2. Updated database trigger to read currency from user metadata
3. Profile is now created automatically by trigger with correct currency

## Manual Test Steps

### Test 1: Signup with Default Currency (USD)
1. Navigate to http://localhost:3000/signup
2. Fill in:
   - Email: `test1@example.com`
   - Password: `Test1234`
   - Currency: `USD` (or leave default)
3. Click "Sign Up"
4. Expected: User is created and redirected to /dashboard
5. Verify: Profile has `currency = 'USD'`

### Test 2: Signup with Custom Currency (EUR)
1. Navigate to http://localhost:3000/signup
2. Fill in:
   - Email: `test2@example.com`
   - Password: `Test1234`
   - Currency: `EUR`
3. Click "Sign Up"
4. Expected: User is created and redirected to /dashboard
5. Verify: Profile has `currency = 'EUR'`

### Test 3: Signup with Weak Password
1. Navigate to http://localhost:3000/signup
2. Fill in:
   - Email: `test3@example.com`
   - Password: `weak` (fails validation)
   - Currency: `USD`
3. Click "Sign Up"
4. Expected: Error message about password requirements
5. Verify: No user created in database

## Database Verification Commands

Check if profiles are created correctly:

```bash
docker exec -i supabase_db_finance psql -U postgres -d postgres <<'EOSQL'
SELECT
  u.email,
  p.currency,
  u.created_at
FROM auth.users u
JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 5;
EOSQL
```

## Expected E2E Test Results

After this fix, the following tests should PASS:
- All signup flow tests (31 tests)
- User can create account
- User can specify currency preference
- Profile is created with correct currency
- User is redirected to dashboard after signup
- No database errors occur

## How to Run E2E Tests

```bash
# Install Playwright (if not already installed)
npm install -D @playwright/test

# Run E2E tests
npx playwright test

# Run specific signup tests
npx playwright test --grep signup
```

## Rollback Plan

If this fix causes issues, rollback by:
1. Revert migration: Delete `/Users/vladislav.khozhai/WebstormProjects/finance/supabase/migrations/20251211000001_fix_profile_creation_trigger.sql`
2. Revert Server Action: Restore manual profile insert in `auth.ts` lines 111-121
3. Run: `npx supabase db reset`

## Additional Notes

- The trigger now properly handles currency metadata
- Server Action is simpler and more reliable
- No race conditions between trigger and Server Action
- User preferences are preserved during signup