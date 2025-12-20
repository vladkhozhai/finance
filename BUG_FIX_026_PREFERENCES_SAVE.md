# Bug Fix Report: Card #26 - Preferences Save Failure

**Status**: ✅ FIXED
**Priority**: P0 (Blocking)
**Date**: 2025-12-19
**Fixed By**: System Architect (Agent 02)

---

## Problem Summary

The Preferences page save functionality was completely broken with the following error:

```
"Could not find the 'default_payment_method_id' column of 'profiles' in the schema cache"
```

Users were unable to save their currency preferences, making the feature unusable.

---

## Root Cause Analysis

### Investigation Steps

1. **Reviewed Server Action** (`/src/app/actions/profile.ts`)
   - Found `updatePreferences()` function attempting to update `default_payment_method_id` column
   - Schema validation included `defaultPaymentMethodId` field

2. **Checked Database Schema** (`supabase/migrations/20251210000001_initial_schema.sql`)
   - Confirmed `profiles` table only has: `id`, `currency`, `created_at`, `updated_at`
   - **No `default_payment_method_id` column exists**

3. **Examined Payment Methods Architecture** (`supabase/migrations/20251218000001_create_payment_methods_table.sql`)
   - Payment methods use `is_default` boolean flag on `payment_methods` table
   - Automatic trigger `ensure_single_default_payment_method()` manages default selection
   - Foreign key on profiles table was never part of the design

4. **Reviewed Frontend Form** (`/src/app/(dashboard)/profile/preferences/preferences-form.tsx`)
   - Form only sends `null` for `defaultPaymentMethodId` (unused/placeholder)
   - No UI element actually collects this value

### Conclusion

The `default_payment_method_id` field was added to the Server Action by mistake and does not match:
- The actual database schema
- The payment methods architecture design
- Any user story requirement

---

## Solution: Remove Non-Existent Field Reference

### Decision Rationale

**Option A (Rejected)**: Add `default_payment_method_id` column via migration
- ❌ Conflicts with existing payment methods architecture
- ❌ `is_default` flag on payment_methods table already handles this
- ❌ Would create duplicate/competing sources of truth
- ❌ No user story requires this column

**Option B (Accepted)**: Remove field reference from Server Action
- ✅ Aligns with actual database schema
- ✅ Matches payment methods architecture design
- ✅ No functionality loss (field was never used)
- ✅ Fixes the bug immediately

---

## Changes Made

### File 1: `/src/app/actions/profile.ts`

**Changed**:
1. Removed `defaultPaymentMethodId` from `updatePreferencesSchema` validation
2. Simplified update logic to only handle `currency` field

```typescript
// BEFORE
const updatePreferencesSchema = z.object({
  currency: z.string().min(3).max(3),
  defaultPaymentMethodId: z.string().uuid().optional().nullable(),
});

// Update profile
const updateData: Record<string, string | null> = {
  currency: validated.data.currency,
};
if (validated.data.defaultPaymentMethodId !== undefined) {
  updateData.default_payment_method_id = validated.data.defaultPaymentMethodId;
}

// AFTER
const updatePreferencesSchema = z.object({
  currency: z.string().min(3).max(3),
});

// Update profile
const { error } = await supabase
  .from("profiles")
  .update({ currency: validated.data.currency })
  .eq("id", user.id);
```

### File 2: `/src/app/(dashboard)/profile/preferences/preferences-form.tsx`

**Changed**:
1. Removed unused `defaultPaymentMethodId: null` parameter from `updatePreferences()` call

```typescript
// BEFORE
const result = await updatePreferences({
  currency: data.currency,
  defaultPaymentMethodId: null,
});

// AFTER
const result = await updatePreferences({
  currency: data.currency,
});
```

---

## Verification

### TypeScript Compilation
✅ **PASSED** - `npx tsc --noEmit` completed with no errors

### Architecture Alignment
✅ **CONFIRMED** - Payment method defaults managed via `is_default` flag on `payment_methods` table
✅ **CONFIRMED** - Trigger `ensure_single_default_payment_method()` ensures only one default per user
✅ **CONFIRMED** - No foreign key needed on `profiles` table

---

## How Default Payment Method SHOULD Work

For future reference, here's the correct architecture:

### Setting Default Payment Method

```typescript
// Users set a payment method as default by updating the payment_methods table
await supabase
  .from("payment_methods")
  .update({ is_default: true })
  .eq("id", paymentMethodId)
  .eq("user_id", userId);

// The trigger automatically unsets other defaults for this user
```

### Getting Default Payment Method

```typescript
// Query payment_methods table directly
const { data } = await supabase
  .from("payment_methods")
  .select("*")
  .eq("user_id", userId)
  .eq("is_default", true)
  .eq("is_active", true)
  .single();

// OR use the database function
SELECT get_user_default_payment_method(user_id);
```

---

## Database Schema Confirmation

### profiles Table (Current)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**No changes needed to database schema**

---

## Testing Recommendations for QA

1. **Test preferences save** with various currencies (USD, EUR, GBP, etc.)
2. **Verify no database errors** in console/logs
3. **Confirm currency persists** after page refresh
4. **Test rapid consecutive saves** (stress test)
5. **Verify revalidation** works correctly (router.refresh())

---

## Related Architecture Notes

### Payment Methods Architecture
- Payment methods have their own table with `is_default` flag
- Trigger ensures only one default per user automatically
- No foreign key needed on profiles table
- Separation of concerns: profiles = user settings, payment_methods = financial instruments

### Future Feature: Default Payment Method Selection in Preferences
If this feature is needed in the future:
1. Add UI in preferences form to select default payment method
2. Update `payment_methods` table (NOT profiles)
3. Use existing trigger to handle default management
4. NO migration to profiles table needed

---

## Status: READY FOR QA TESTING

The bug is fixed and ready for QA Engineer to verify in the test suite.

**Expected Result**: Users can now save currency preferences without errors.

---

**Files Modified**:
1. `/src/app/actions/profile.ts` - Removed non-existent column reference
2. `/src/app/(dashboard)/profile/preferences/preferences-form.tsx` - Removed unused parameter

**Database Changes**: None (no migration needed)
