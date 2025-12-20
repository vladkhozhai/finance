# BUG FIX SUMMARY: Database Error on User Signup

## Issue
**Bug #1**: "Database error saving new user" when users try to sign up
- **Impact**: Blocked 31/37 E2E tests
- **Priority**: CRITICAL

## Root Cause
The application had a **duplicate profile creation** issue:

1. **Database Trigger**: `handle_new_user()` automatically creates a profile when a user is inserted into `auth.users`
2. **Server Action**: The `signUp()` function in `/src/app/actions/auth.ts` also tried to manually insert a profile
3. **Result**: Both attempted to insert with the same `id` (PRIMARY KEY), causing a unique constraint violation

Additionally, the trigger was hardcoded to always use 'USD' currency, ignoring the user's preference passed during signup.

## Solution

### 1. Updated Database Trigger (Migration)
**File**: `/Users/vladislav.khozhai/WebstormProjects/finance/supabase/migrations/20251211000001_fix_profile_creation_trigger.sql`

Changed the `handle_new_user()` trigger function to:
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, currency)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'currency', 'USD')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**What it does**:
- Reads the `currency` from `NEW.raw_user_meta_data->>'currency'`
- Falls back to 'USD' if no currency is specified
- Automatically creates profile when user signs up

### 2. Updated Server Action
**File**: `/Users/vladislav.khozhai/WebstormProjects/finance/src/app/actions/auth.ts`

**Removed** lines 111-121 (the manual profile insert):
```typescript
// REMOVED:
// const { error: profileError } = await supabase.from("profiles").insert({
//   id: authData.user.id,
//   currency: validated.data.currency,
// });

// ADDED:
// Note: Profile is automatically created by database trigger (handle_new_user)
// The trigger reads currency from raw_user_meta_data
```

The Server Action now:
1. Creates the user with `auth.signUp()` and passes currency in `options.data`
2. Lets the database trigger handle profile creation
3. Immediately redirects to dashboard on success

## How It Works Now

1. User submits signup form with email, password, and currency preference
2. Server Action validates input with Zod schema
3. `supabase.auth.signUp()` is called with currency in `options.data.currency`
4. Supabase stores currency in `auth.users.raw_user_meta_data` JSONB column
5. Database trigger `on_auth_user_created` fires automatically
6. Trigger function reads currency from metadata and creates profile
7. User is redirected to dashboard

## Testing

Verified the fix with direct database tests:

**Test 1: Custom Currency (EUR)**
```sql
INSERT INTO auth.users (..., raw_user_meta_data)
VALUES (..., '{"currency": "EUR"}'::jsonb);
-- Result: Profile created with currency = 'EUR' ✓
```

**Test 2: Default Currency**
```sql
INSERT INTO auth.users (..., raw_user_meta_data)
VALUES (..., '{}'::jsonb);
-- Result: Profile created with currency = 'USD' ✓
```

## Files Changed

1. `/Users/vladislav.khozhai/WebstormProjects/finance/supabase/migrations/20251211000001_fix_profile_creation_trigger.sql` (NEW)
   - Updated trigger to read currency from user metadata

2. `/Users/vladislav.khozhai/WebstormProjects/finance/src/app/actions/auth.ts` (MODIFIED)
   - Removed redundant profile insert (lines 111-121)
   - Added comment explaining trigger behavior

## Next Steps

1. Run E2E tests to verify signup flow works
2. Test with different currency values (USD, EUR, GBP, etc.)
3. Verify user profile is accessible after signup
4. Check that dashboard loads correctly after signup

## Migration Applied

The database migration was successfully applied:
```bash
npx supabase db reset
# Result: Migration 20251211000001_fix_profile_creation_trigger.sql applied ✓
```

## Expected Test Results

After this fix, the 31 failing E2E tests should now pass:
- User signup should complete without database errors
- Profile should be created with correct currency preference
- User should be redirected to /dashboard
- No duplicate key violations