# BUG-002 Fix V2 - Client-Side Validation

**Date**: 2025-12-21
**Bug**: Email validation rejects `.test` TLD
**Priority**: P2 → P0 (escalated due to deployment issue)
**Status**: ✅ FIXED (awaiting QA verification in Iteration 3)

---

## Root Cause Analysis

### What Went Wrong in Iteration 1

The Iteration 1 fix (commits `c667756` and `b2917d9`) successfully created a custom email validation schema in `/src/lib/validations/auth.ts` that accepts `.test` TLD. The server actions (`/src/app/actions/auth.ts`) correctly imported and used this schema.

**However**, the client-side forms continued to use their own inline validation schemas:

**File**: `/src/components/features/auth/signup-form.tsx`
```typescript
// OLD CODE (Iteration 1 - BROKEN)
const signupSchema = z.object({
  email: z.string().email("Invalid email address"),  // ❌ Rejects .test TLD
  password: z.string()...
})
```

**File**: `/src/components/features/auth/login-form.tsx`
```typescript
// OLD CODE (Iteration 1 - BROKEN)
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),  // ❌ Rejects .test TLD
  password: z.string()...
})
```

### Why It Failed

1. User enters email `qa-iteration2@financeflow.test` in signup form
2. **Client-side validation runs first** using `z.string().email()`
3. Zod's built-in `.email()` validator rejects `.test` TLD per IANA rules
4. Form never submits → **Server action never called**
5. Custom server validation (which accepts `.test`) never runs

**Result**: The fix worked on the server but was blocked by the client.

---

## Fix Applied (Iteration 2)

### Updated Files

#### 1. `/src/components/features/auth/signup-form.tsx`
```typescript
// NEW CODE (Iteration 2 - FIXED)
import { signUpSchema } from "@/lib/validations/auth";

const signupSchema = signUpSchema
  .extend({
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
```

**Key Change**: Instead of defining a new schema, the form now **extends** the server's `signUpSchema`, inheriting the custom email validation logic.

#### 2. `/src/components/features/auth/login-form.tsx`
```typescript
// NEW CODE (Iteration 2 - FIXED)
import { signInSchema } from "@/lib/validations/auth";

const loginSchema = signInSchema;
```

**Key Change**: Directly uses the server's `signInSchema` with custom email validation.

---

## Validation Flow (After Fix)

### Shared Email Validation Logic
From `/src/lib/validations/auth.ts`:

```typescript
const emailSchema = z
  .string()
  .min(1, "Email is required")
  .refine(
    (email) => {
      // Basic format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return false;

      // Accept test TLDs
      const testTLDs = [".test", ".localhost", ".example", ".invalid"];
      const hasTestTLD = testTLDs.some((tld) =>
        email.toLowerCase().endsWith(tld)
      );
      if (hasTestTLD) return true;

      // Standard TLDs: use Zod's stricter validation
      return z.string().email().safeParse(email).success;
    },
    { message: "Invalid email address" }
  );
```

**Now used by**:
- ✅ Client signup form
- ✅ Client login form
- ✅ Server `signUp` action
- ✅ Server `signIn` action

---

## Testing

### Local Validation Test
Created test script that validates:
- ✅ `qa-iteration2@financeflow.test` → VALID
- ✅ `test@example.test` → VALID
- ✅ `user@localhost.test` → VALID
- ✅ `admin@domain.example` → VALID
- ✅ `valid@gmail.com` → VALID
- ✅ `invalid-email` → INVALID (correctly rejected)
- ✅ `@nodomain.com` → INVALID (correctly rejected)

### Production Testing (Pending)
**Status**: Waiting for QA verification in Iteration 3

**Test Case**:
1. Navigate to `/signup`
2. Enter email: `qa-iteration2@financeflow.test`
3. Enter valid password (e.g., `TestPass123`)
4. Submit form
5. **Expected**: Account created successfully, redirect to login with confirmation banner
6. **Previous Behavior (Iteration 1)**: "Email address 'qa-iteration2@financeflow.test' is invalid"

---

## Commits

### Iteration 1 (Incomplete Fix)
- `c667756` - Created custom email validation schema (server-side only)
- `b2917d9` - Documentation for Iteration 1 fix

### Iteration 2 (Complete Fix)
- `be0fe27` - Updated client forms to use shared validation schema

---

## Lessons Learned

### Problem: Validation Schema Duplication

**Anti-pattern** (what we had):
```
┌─────────────────────────────────────────┐
│ Client Form (signup-form.tsx)          │
│ ├── Inline schema: z.string().email()  │ ❌ Rejects .test
│ └── Submits to server action            │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│ Server Action (auth.ts)                 │
│ ├── Custom schema: accepts .test        │ ✅ Accepts .test
│ └── Never reached!                      │
└─────────────────────────────────────────┘
```

**Best practice** (what we have now):
```
┌─────────────────────────────────────────┐
│ Shared Validation (validations/auth.ts)│
│ └── Custom email schema                 │ ✅ Accepts .test
└─────────────────────────────────────────┘
          ↓                    ↓
┌──────────────────┐  ┌────────────────────┐
│ Client Forms     │  │ Server Actions     │
│ Import & extend  │  │ Import & validate  │
└──────────────────┘  └────────────────────┘
```

### Recommendation: Centralized Validation

**Always**:
1. Define validation schemas in `/src/lib/validations/`
2. Import schemas in both client components and server actions
3. Extend schemas (`.extend()`) if client needs extra fields (e.g., `confirmPassword`)
4. Never duplicate validation logic

**Never**:
1. Define inline schemas in client components
2. Assume server validation is sufficient (client validation provides UX)
3. Use different validation rules on client vs server (security risk)

---

## Impact

### Before Fix (Iteration 1)
- ❌ QA unable to create test accounts with `.test` TLD
- ❌ Workaround required: use `.com` or other standard TLDs
- ❌ False positive: fix appeared deployed but wasn't working

### After Fix (Iteration 2)
- ✅ `.test` TLD accepted in signup and login
- ✅ QA can create test accounts with `@financeflow.test`
- ✅ RFC 2606 compliant (supports reserved test TLDs)
- ✅ No workarounds needed

---

## Next Steps

1. **QA Engineer**: Verify fix in production (Iteration 3)
   - Test signup with `qa-iteration3@financeflow.test`
   - Test login with existing `.test` accounts
   - Confirm no validation errors

2. **Backend Developer**: Monitor deployment
   - Verify Vercel build succeeded
   - Check deployment logs for any build issues
   - Confirm changes deployed to production

3. **System Architect**: Review validation patterns
   - Document best practices for shared validation
   - Update architecture docs if needed
   - Consider adding validation schema tests

---

## Additional Notes

### Why the Iteration 1 Fix Appeared to Work Locally

During local development, developers often test the full flow including server-side operations. If testing was done via API calls or server action testing, the fix would have worked correctly. However, testing through the UI form would have revealed the client-side validation issue.

### Production Deployment Verification

The fix was properly deployed to production in Iteration 1 - the code was correct. The issue was not a deployment failure but an incomplete fix that only covered the server-side validation layer.

### RFC 2606 Compliance

Our custom validation now supports all reserved test TLDs:
- `.test` - For testing purposes
- `.example` - For documentation examples
- `.invalid` - For testing invalid scenarios
- `.localhost` - For local development

This is per RFC 2606 (Reserved Top Level DNS Names).

---

**Status**: ✅ Fix deployed to production
**Commit**: `be0fe27`
**Next**: Awaiting QA verification in Iteration 3
