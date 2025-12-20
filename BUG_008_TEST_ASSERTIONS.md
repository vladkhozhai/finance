# BUG #8: Test Assertions Don't Match Actual UI Text

**Status**: 🔴 CRITICAL - OPEN
**Date Discovered**: 2025-12-11
**Discovered By**: QA Engineer (Agent 05)
**Category**: Test Code Bug
**Severity**: CRITICAL (blocks entire test suite)

---

## Summary
All authentication and dashboard E2E tests (27/37) are failing because test assertions expect UI text that doesn't match the actual implementation. Tests were written based on assumed text ("Sign up", "Log in") but the actual UI uses different text ("Create an account", "Welcome back").

---

## Impact
- **27 tests failing** (73% failure rate)
- **Cannot verify auth flows** (signup, login, logout)
- **Cannot verify dashboard** (depends on successful login)
- **Blocks production deployment** (cannot confirm app works)

---

## Root Cause

### Test Code Issue
Tests use hard-coded text assertions that don't match the implemented UI:

**Signup Page:**
- **Test expects**: Heading with text matching regex `/sign up/i`
- **Actual UI**: `<h1>Create an account</h1>`
- **Mismatch**: "sign up" ≠ "create an account"

**Login Page:**
- **Test expects**: Heading with text matching regex `/log.*in|sign.*in/i`
- **Actual UI**: `<h1>Welcome back</h1>`
- **Mismatch**: "log in" or "sign in" ≠ "welcome back"

---

## Evidence

### Error Output
```
Error: expect(locator).toBeVisible() failed
Locator: locator('h1, h2').filter({ hasText: /sign up/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found
```

### Page Snapshot (from test failure)
```yaml
- heading "Create an account" [level=1] [ref=e5]
- generic: Get started with FinanceFlow and take control of your finances
```

### Source Code Evidence

**Signup Form** (`src/components/features/auth/signup-form.tsx:111`):
```typescript
<CardTitle as="h1">Create an account</CardTitle>
```

**Login Form** (`src/components/features/auth/login-form.tsx:71`):
```typescript
<CardTitle as="h1">Welcome back</CardTitle>
```

**Test Code** (`tests/auth/signup.spec.ts:17`):
```typescript
await expect(
  page.locator("h1, h2").filter({ hasText: /sign up/i }),
).toBeVisible();
```

---

## Affected Files

### Test Files (Need Fixes)
1. `/Users/vladislav.khozhai/WebstormProjects/finance/tests/auth/signup.spec.ts`
   - Line 17: Wrong heading assertion
   - All 5 signup tests fail

2. `/Users/vladislav.khozhai/WebstormProjects/finance/tests/auth/login.spec.ts`
   - Multiple lines: Wrong heading assertion
   - All 6 login tests fail

3. `/Users/vladislav.khozhai/WebstormProjects/finance/tests/auth/logout.spec.ts`
   - beforeEach hook: Depends on login (which fails)
   - All 3 logout tests fail

4. `/Users/vladislav.khozhai/WebstormProjects/finance/tests/dashboard/dashboard.spec.ts`
   - beforeEach hook: Depends on login (which fails)
   - All 9 dashboard tests fail

5. `/Users/vladislav.khozhai/WebstormProjects/finance/tests/accessibility.spec.ts`
   - Line 27+: Dashboard accessibility test depends on login
   - 1 accessibility test fails

---

## Affected Tests (27 total)

### Login Tests (6 failures)
- ❌ should successfully login with valid credentials
- ❌ should show error with incorrect password
- ❌ should show error with non-existent email
- ❌ should show error when email field is empty
- ❌ should show error when password field is empty
- ❌ should have link to signup page

### Signup Tests (5 failures)
- ❌ should successfully sign up with valid credentials
- ❌ should show error when passwords do not match
- ❌ should show error with invalid email format
- ❌ should show error with weak password
- ❌ should show error when required fields are empty
- ❌ should not allow signup with existing email

### Logout Tests (3 failures)
- ❌ should successfully logout and redirect to login page
- ❌ should not be able to access protected routes after logout
- ❌ should clear session after logout

### Dashboard Tests (9 failures)
- ❌ should load dashboard after successful login
- ❌ should display balance summary component
- ❌ should display active budgets section
- ❌ should display expense chart
- ❌ should show empty state for new user
- ❌ should have navigation elements
- ❌ should be responsive on mobile viewport
- ❌ should load without console errors
- ❌ should fetch data from Supabase successfully
- ❌ should display user-specific data only (RLS check)

### Accessibility Tests (1 failure)
- ❌ dashboard should have no accessibility violations

### Protected Routes Tests (2 failures)
- ❌ should redirect to login when accessing transactions without auth
- ❌ should redirect to login when accessing budgets without auth

**Note**: Protected routes failures might be a separate issue (routes don't exist yet).

---

## Fix Required

### File: `tests/auth/signup.spec.ts`

**Line 17 - Current (WRONG):**
```typescript
await expect(
  page.locator("h1, h2").filter({ hasText: /sign up/i }),
).toBeVisible();
```

**Fix:**
```typescript
await expect(
  page.locator("h1, h2").filter({ hasText: /create an account/i }),
).toBeVisible();
```

### File: `tests/auth/login.spec.ts`

**Find all instances matching `/log.*in|sign.*in/i` and replace with:**
```typescript
await expect(
  page.locator("h1, h2").filter({ hasText: /welcome back/i }),
).toBeVisible();
```

### Alternative Fix (RECOMMENDED): Use Role-Based Selectors

Instead of text matching, use semantic selectors:

**Better approach:**
```typescript
// Verify heading exists (don't care about exact text)
await expect(page.locator('h1')).toBeVisible();

// OR use data-testid
await expect(page.getByTestId('signup-heading')).toBeVisible();
```

**Why better?**
- Tests don't break when UI copy changes
- More resilient to localization
- Focuses on structure, not content

---

## Additional Issues Found

### Issue #2: Protected Routes Tests Timeout
Tests for `/transactions` and `/budgets` routes timeout at navigation step:

```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
waiting for navigation to "/transactions" until "load"
```

**Possible causes:**
1. Routes don't exist yet (feature not implemented)
2. Middleware redirect loop
3. Test expectation wrong

**Action Required**: Check if these routes exist:
- `/Users/vladislav.khozhai/WebstormProjects/finance/src/app/(protected)/transactions/page.tsx`
- `/Users/vladislav.khozhai/WebstormProjects/finance/src/app/(protected)/budgets/page.tsx`

If they don't exist, mark tests as `test.skip()` until features are implemented.

---

## Recommended Improvements

### 1. Add data-testid Attributes
Update UI components to include test IDs:

**src/components/features/auth/signup-form.tsx:**
```typescript
<CardTitle as="h1" data-testid="signup-heading">
  Create an account
</CardTitle>
```

**src/components/features/auth/login-form.tsx:**
```typescript
<CardTitle as="h1" data-testid="login-heading">
  Welcome back
</CardTitle>
```

### 2. Create Test Constants File
`tests/helpers/ui-text.ts`:
```typescript
export const UI_TEXT = {
  signup: {
    heading: "Create an account",
    submitButton: "Create account",
  },
  login: {
    heading: "Welcome back",
    submitButton: "Sign in",
  },
};
```

### 3. Use Helper Functions
`tests/helpers/page-objects.ts`:
```typescript
export class AuthPage {
  async verifySignupPage() {
    // Use role-based selector instead of text
    await expect(this.page.locator('h1')).toBeVisible();
    await expect(this.page.locator('button[type="submit"]')).toBeVisible();
  }
}
```

---

## Test Quality Issues

### Root Problem
Tests were written **before** the UI was implemented, with assumed text that doesn't match the actual design decisions.

### Prevention Strategy
1. **Write tests AFTER UI is designed** (or use design docs)
2. **Use semantic selectors** (roles, labels) instead of text
3. **Add data-testid** to all interactive elements
4. **Document UI text** in shared constants
5. **Review tests** with Frontend Developer before committing

---

## Acceptance Criteria for Fix

### Must Pass
- [ ] All 6 login tests pass
- [ ] All 5 signup tests pass
- [ ] All 3 logout tests pass
- [ ] All 9 dashboard tests pass
- [ ] Dashboard accessibility test passes
- [ ] Overall pass rate ≥ 95% (35+/37 tests)

### Nice to Have
- [ ] Tests use data-testid instead of text matching
- [ ] Test constants file created for UI text
- [ ] Page Object Model updated with semantic selectors
- [ ] Test documentation updated with actual UI text

---

## Time Estimate
- **Quick Fix** (update regex only): 30 minutes
- **Proper Fix** (add data-testid, refactor): 2-3 hours
- **Re-run tests**: 5 minutes
- **Generate final report**: 15 minutes

**Total**: 3-4 hours for complete resolution

---

## Priority
🔴 **CRITICAL** - Must fix before production deployment

This bug blocks verification of:
- ✅ Authentication flows (signup, login, logout)
- ✅ Dashboard functionality
- ✅ User session management
- ✅ RLS policies
- ✅ End-to-end user journeys

**Next Action**: QA Engineer must fix test code immediately and re-run suite.

---

**Report Created**: 2025-12-11
**Assigned To**: QA Engineer (Agent 05)
**Status**: OPEN - FIX IN PROGRESS
