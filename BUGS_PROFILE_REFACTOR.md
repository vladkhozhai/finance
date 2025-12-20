# Bugs Found - Profile UX Architecture Refactor (Card #26)

**Test Date**: 2025-12-19
**Status**: ❌ **2 CRITICAL BUGS FOUND - FIXES REQUIRED**

---

## BUG #1 - P0 (BLOCKING)

### Title: Preferences Save Error - Missing Database Column

**Severity**: P0 (Critical - Feature completely broken)

**Component**: Backend / Database Schema

**Assigned To**: Backend Developer (03) / System Architect (02)

**Error Message**:
```
Error: "Could not find the 'default_payment_method_id' column of 'profiles' in the schema cache"
```

### Steps to Reproduce

1. Navigate to `http://localhost:3000/profile/preferences`
2. Click currency dropdown
3. Select any currency (e.g., "EUR - Euro")
4. Click "Save Preferences" button
5. ❌ Error toast appears with database column error

### Expected Behavior

- Preferences save successfully
- Success toast appears: "Preferences updated successfully"
- Currency persists in database
- Overview page reflects new currency

### Actual Behavior

- Error toast displays raw database error
- Database operation fails
- Currency change NOT saved
- User cannot update preferences at all

### Root Cause

The Preferences Server Action is attempting to update a column `default_payment_method_id` in the `profiles` table, but this column does not exist in the database schema.

Possible causes:
1. Missing migration to add the column
2. Server Action referencing wrong column name
3. Supabase schema cache out of sync
4. Recent schema change not applied

### Suggested Fix

**Option A**: If column is needed:
```sql
-- Create migration to add column
ALTER TABLE profiles
ADD COLUMN default_payment_method_id UUID REFERENCES payment_methods(id);
```

**Option B**: If column is NOT needed:
```typescript
// Remove column from Server Action
// File: src/app/actions/profile.ts (or similar)

// Remove this line from update:
// default_payment_method_id: ...

// Only update currency:
await supabase
  .from('profiles')
  .update({ currency: newCurrency })
  .eq('user_id', userId);
```

### Impact

- **Users**: Cannot save any preferences (currency, etc.)
- **Blocking**: YES - Entire Preferences page non-functional
- **Workaround**: None available

### Screenshots

- Error: `/Users/vladislav.khozhai/WebstormProjects/finance/test-results/bug-preferences-save-error.png`
- Preferences Page: `/Users/vladislav.khozhai/WebstormProjects/finance/test-results/profile-preferences.png`

### Related Files

- Server Action: `src/app/actions/profile.ts` (or `src/app/(dashboard)/profile/preferences/actions.ts`)
- Migration: `supabase/migrations/` (missing migration?)
- Database: `profiles` table schema

---

## BUG #2 - P1 (HIGH)

### Title: Backward Compatibility Redirects Not Implemented

**Severity**: P1 (High - Acceptance criteria not met)

**Component**: Frontend / Profile Layout

**Assigned To**: Frontend Developer (04)

### Steps to Reproduce

1. Navigate to `http://localhost:3000/profile?tab=payment-methods`
2. ❌ URL stays at `/profile/overview` (wrong page)
3. Try `http://localhost:3000/profile?tab=categories`
4. ❌ URL stays at `/profile/overview` (wrong page)
5. Try other query params: `?tab=tags`, `?tab=preferences`
6. ❌ All stay on `/profile/overview`

### Expected Behavior

Old query parameter URLs should redirect to new nested routes:

| Old URL | New URL |
|---------|---------|
| `/profile?tab=overview` | `/profile/overview` |
| `/profile?tab=payment-methods` | `/profile/payment-methods` |
| `/profile?tab=categories` | `/profile/categories` |
| `/profile?tab=tags` | `/profile/tags` |
| `/profile?tab=preferences` | `/profile/preferences` |

Users with old bookmarks should land on the correct page.

### Actual Behavior

- All old URLs with query params redirect to `/profile/overview`
- Query parameters completely ignored
- Users with old bookmarks land on Overview (wrong page)
- Breaks existing user workflows

### Root Cause

The Profile page/layout is not checking for the `tab` query parameter and redirecting accordingly. This feature was mentioned in acceptance criteria but not implemented in the refactor.

### Suggested Fix

Add redirect logic in the Profile page component:

**File**: `src/app/(dashboard)/profile/page.tsx`

```typescript
import { redirect } from 'next/navigation';

type ProfilePageProps = {
  searchParams: { tab?: string };
};

export default function ProfilePage({ searchParams }: ProfilePageProps) {
  const { tab } = searchParams;

  // Map old tab values to new nested routes
  if (tab) {
    const tabRoutes: Record<string, string> = {
      'overview': '/profile/overview',
      'payment-methods': '/profile/payment-methods',
      'categories': '/profile/categories',
      'tags': '/profile/tags',
      'preferences': '/profile/preferences',
    };

    const redirectUrl = tabRoutes[tab];
    if (redirectUrl) {
      redirect(redirectUrl);
    }
  }

  // Default: redirect to overview
  redirect('/profile/overview');
}
```

### Impact

- **Users**: Old bookmarks and links broken
- **Blocking**: NO - New URLs work fine
- **Workaround**: Users can navigate using sidebar (but inconvenient)
- **User Experience**: Breaks backwards compatibility, users confused

### Testing After Fix

Verify these redirects work:
- [ ] `/profile?tab=overview` → `/profile/overview`
- [ ] `/profile?tab=payment-methods` → `/profile/payment-methods`
- [ ] `/profile?tab=categories` → `/profile/categories`
- [ ] `/profile?tab=tags` → `/profile/tags`
- [ ] `/profile?tab=preferences` → `/profile/preferences`
- [ ] `/profile?tab=invalid` → `/profile/overview` (fallback)
- [ ] `/profile` (no query param) → `/profile/overview` (default)

### Related Files

- Profile Page: `src/app/(dashboard)/profile/page.tsx`
- Profile Layout: `src/app/(dashboard)/profile/layout.tsx` (if redirect goes here instead)

---

## Summary

| Bug | Severity | Component | Status | Blocking? |
|-----|----------|-----------|--------|-----------|
| Preferences Save Error | P0 | Backend | Open | YES |
| Backward Compatibility | P1 | Frontend | Open | NO |

**Total Blocking Issues**: 1 (P0)
**Total High Priority**: 1 (P1)

**Estimated Fix Time**:
- Bug #1: 1-2 hours (depends on root cause investigation)
- Bug #2: 30 minutes - 1 hour (straightforward implementation)

**Total**: 2-3 hours

---

## Re-Test Checklist

After fixes are deployed, verify:

### Bug #1 (Preferences)
- [ ] Navigate to `/profile/preferences`
- [ ] Select different currency (e.g., EUR)
- [ ] Click "Save Preferences"
- [ ] ✅ Success toast appears
- [ ] ✅ No error toast
- [ ] Navigate to `/profile/overview`
- [ ] ✅ Currency updated on Overview page
- [ ] Reload page
- [ ] ✅ Currency persists (database save confirmed)

### Bug #2 (Redirects)
- [ ] Navigate to `/profile?tab=payment-methods`
- [ ] ✅ URL redirects to `/profile/payment-methods`
- [ ] ✅ Payment Methods page displays
- [ ] Navigate to `/profile?tab=categories`
- [ ] ✅ URL redirects to `/profile/categories`
- [ ] ✅ Categories page displays
- [ ] Navigate to `/profile?tab=tags`
- [ ] ✅ URL redirects to `/profile/tags`
- [ ] ✅ Tags page displays
- [ ] Navigate to `/profile?tab=preferences`
- [ ] ✅ URL redirects to `/profile/preferences`
- [ ] ✅ Preferences page displays
- [ ] Navigate to `/profile?tab=invalid`
- [ ] ✅ URL redirects to `/profile/overview` (fallback)

---

## Contact

**Reported By**: QA Engineer (Agent 05)
**Date**: 2025-12-19
**Full Test Report**: `/Users/vladislav.khozhai/WebstormProjects/finance/QA_TEST_REPORT_PROFILE_REFACTOR.md`

Please notify QA Engineer when fixes are ready for re-testing.
