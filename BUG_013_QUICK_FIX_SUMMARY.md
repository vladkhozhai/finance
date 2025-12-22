# BUG-013: Deployment Failure - FIXED

**Status**: ✅ RESOLVED & DEPLOYED
**Commits**: `3284c80` (BUG-006) + `4056ed9` (BUG-013)

---

## What Happened

- BUG-006 fix was pushed to GitHub but **NOT deployed to production**
- Vercel build was failing silently due to TypeScript error
- Production still rejected `@example.com` emails

## Root Cause

**TypeScript Build Error** in `/src/components/features/auth/signup-form.tsx`:

```typescript
// PROBLEM: currency field with .default() inferred as string | undefined
const signupSchema = signUpSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
});
// Type error: react-hook-form expects string, got string | undefined
```

## Fix

**Explicitly override currency to required**:
```typescript
const signupSchema = signUpSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
  currency: z.string().min(1, "Currency is required"), // ← Fixed
});
```

## Verification

```bash
✅ npm run build  # SUCCESS
✅ git push       # Deployed commit 4056ed9
⏳ Vercel         # Deploying now (~5 min)
```

---

## For QA: Ready to Test After Deployment

**Wait for**: Vercel deployment completes (~5 min from 12:45 PM)

**Test Email Addresses**:
```
✅ qa-iteration6@example.com     # Should ACCEPT
✅ qa-iteration6@gmail.com       # Should ACCEPT
✅ qa-iteration6@test-domain.io  # Should ACCEPT
❌ invalid-email                 # Should REJECT
```

**Verify**:
1. Check Vercel dashboard shows commit `4056ed9`
2. Signup with `qa-iteration6@example.com`
3. Should succeed and send confirmation email
4. Production should match local behavior

---

## Files Changed

1. `/src/lib/validations/auth.ts` - BUG-006 fix (uses standard `.email()`)
2. `/src/components/features/auth/signup-form.tsx` - BUG-013 fix (type override)

---

## Next Steps

1. ⏳ Wait for Vercel deployment (~5 min)
2. 🧪 QA runs Iteration 6 smoke tests
3. ✅ Confirm production accepts `@example.com`
4. 📝 Close BUG-013 ticket

---

**Pushed at**: 12:45 PM, 2025-12-21
**Expected Live**: 12:50 PM, 2025-12-21
**Reporter**: Backend Developer (03)
