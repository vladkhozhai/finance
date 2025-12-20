# Bug Tracking - FinanceFlow

This file tracks all bugs found during E2E testing.

---

## 🔴 CRITICAL BUGS

### BUG-001: Database Error on User Signup
**Status**: 🔴 OPEN
**Priority**: P0 - CRITICAL
**Severity**: BLOCKS ALL TESTING
**Assigned To**: Backend Developer (03) + System Architect (02)
**Found By**: QA Engineer (05)
**Date Found**: 2025-12-10

**Summary**:
User signup fails with database error: "Database error saving new user"

**Environment**:
- Local development
- Supabase local instance
- Next.js 16.0.8

**Steps to Reproduce**:
1. Start dev server: `npm run dev`
2. Navigate to http://localhost:3000/signup
3. Fill out form:
   - Email: `test@example.com`
   - Password: `SecurePass123!`
   - Confirm Password: `SecurePass123!`
   - Currency: USD (default)
4. Click "Create account" button
5. Observe error toast

**Expected Behavior**:
- User account created in `auth.users` table
- Profile created in `public.profiles` table with currency
- User redirected to `/` (dashboard)
- Success toast: "Account created successfully!"

**Actual Behavior**:
- Error toast appears: "Signup failed - Database error saving new user"
- User stays on signup page
- No account created in database
- No redirect occurs

**Screenshots**:
Available in Playwright report: `playwright-report/index.html`

**Error Message**:
```
Signup failed
Database error saving new user
```

**Suspected Root Causes**:
1. Supabase local instance not running
2. `profiles` table doesn't exist
3. RLS policies block INSERT on `profiles` table
4. Foreign key constraint failing (user_id -> auth.users)
5. Trigger/function error on profile creation
6. Server Action not handling errors correctly

**Files to Check**:
- `/Users/vladislav.khozhai/WebstormProjects/finance/src/app/actions/auth.ts`
- Supabase migrations in `supabase/migrations/`
- RLS policies on `profiles` table

**Investigation Steps**:
```bash
# 1. Check if Supabase is running
curl http://127.0.0.1:54321/rest/v1/

# 2. Check Supabase Studio
open http://127.0.0.1:54323

# 3. Query profiles table
# Run in Supabase SQL Editor:
SELECT * FROM profiles;

# 4. Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

# 5. Check server logs
# Look at Next.js terminal for error details
```

**Impact**:
- ❌ Cannot create any users
- ❌ All authentication tests fail
- ❌ Cannot test any authenticated features
- ❌ Blocks entire test suite (31/37 tests blocked)

**Workaround**:
None. Must be fixed to proceed with testing.

**Related Tests**:
- All signup tests (6 tests)
- All login tests (6 tests - no users to login with)
- All dashboard tests (10 tests - requires authentication)
- All logout tests (3 tests - requires login first)

---

### BUG-002: Wrong Page Serving at Root URL
**Status**: 🔴 OPEN
**Priority**: P0 - CRITICAL
**Severity**: BLOCKS DASHBOARD ACCESS
**Assigned To**: Frontend Developer (04)
**Found By**: QA Engineer (05)
**Date Found**: 2025-12-10

**Summary**:
The root URL (`/`) serves the default Next.js template page instead of the dashboard.

**Environment**:
- Local development
- Next.js 16.0.8

**Steps to Reproduce**:
1. Start dev server: `npm run dev`
2. Navigate to http://localhost:3000/
3. Observe page content

**Expected Behavior**:
- Shows FinanceFlow dashboard with:
  - Heading: "Dashboard"
  - Balance summary component
  - Active budgets section
  - Expense chart
- If not authenticated, redirects to `/login`

**Actual Behavior**:
- Shows default Next.js welcome page
- Heading: "To get started, edit the page.tsx file."
- Links to Vercel templates and Next.js docs
- No dashboard components visible
- No authentication check

**Screenshots**:
Available in Playwright report

**Root Cause**:
Two `page.tsx` files exist at root level:

1. `/src/app/page.tsx` - Default Next.js template ❌ (Currently serving)
2. `/src/app/(dashboard)/page.tsx` - Actual dashboard ✅ (Should be serving)

Next.js prioritizes `/src/app/page.tsx` over route group pages like `/src/app/(dashboard)/page.tsx`.

**Fix**:
```bash
# Delete the default template page
rm /Users/vladislav.khozhai/WebstormProjects/finance/src/app/page.tsx
```

After deletion, the dashboard at `/src/app/(dashboard)/page.tsx` will serve at `/`.

**Verification**:
```bash
# After fix, test:
curl http://localhost:3000/ | grep "Dashboard"
# Should output: <h1>Dashboard</h1>
```

**Impact**:
- ❌ Dashboard completely inaccessible
- ❌ Users see wrong page after signup/login
- ❌ All dashboard tests fail (10 tests)
- ❌ Protected route tests fail (3 tests)
- ❌ Poor user experience

**Related Tests**:
- `tests/dashboard/dashboard.spec.ts` (all 10 tests fail)
- `tests/auth/protected-routes.spec.ts` (3/4 tests fail)
- `tests/auth/signup.spec.ts` (expects redirect to dashboard)
- `tests/auth/login.spec.ts` (expects redirect to dashboard)

**Related Files**:
- `/Users/vladislav.khozhai/WebstormProjects/finance/src/app/page.tsx` (DELETE)
- `/Users/vladislav.khozhai/WebstormProjects/finance/src/app/(dashboard)/page.tsx` (KEEP)

---

## 🟡 MEDIUM PRIORITY BUGS

### BUG-003: Missing Main Landmark (Accessibility)
**Status**: 🟡 OPEN
**Priority**: P2 - MEDIUM
**Severity**: ACCESSIBILITY VIOLATION (WCAG 2.1)
**Assigned To**: Frontend Developer (04)
**Found By**: QA Engineer (05)
**Date Found**: 2025-12-10

**Summary**:
Auth pages (login, signup) missing `<main>` landmark element required for accessibility.

**WCAG Violation**:
- Rule: `landmark-one-main`
- Level: WCAG 2.1 Level AA
- Impact: Moderate

**Steps to Reproduce**:
1. Navigate to http://localhost:3000/login
2. Run axe accessibility scanner
3. See violation: "Document does not have a main landmark"

**Expected Behavior**:
Page content wrapped in `<main>` tag for screen readers.

**Actual Behavior**:
Content wrapped in generic `<div>` only.

**Current Code**:
```tsx
// src/app/(auth)/login/page.tsx
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
      <LoginForm />
    </div>
  );
}
```

**Fix**:
```tsx
// src/app/(auth)/login/page.tsx
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
      <LoginForm />
    </main>
  );
}
```

**Affected Files**:
- `/Users/vladislav.khozhai/WebstormProjects/finance/src/app/(auth)/login/page.tsx`
- `/Users/vladislav.khozhai/WebstormProjects/finance/src/app/(auth)/signup/page.tsx`

**Impact**:
- ⚠️ Screen reader users cannot navigate properly
- ⚠️ WCAG 2.1 compliance failure
- ⚠️ 3 accessibility tests fail

**Related Tests**:
- `tests/accessibility.spec.ts › login page should have no accessibility violations`
- `tests/accessibility.spec.ts › signup page should have no accessibility violations`
- `tests/accessibility.spec.ts › dashboard should have no accessibility violations`

**Estimated Fix Time**: 5 minutes

---

### BUG-004: Missing H1 Heading (Accessibility)
**Status**: 🟡 OPEN
**Priority**: P2 - MEDIUM
**Severity**: ACCESSIBILITY VIOLATION (WCAG 2.1)
**Assigned To**: Frontend Developer (04)
**Found By**: QA Engineer (05)
**Date Found**: 2025-12-10

**Summary**:
Pages use `<h2>` or `<CardTitle>` for main heading instead of `<h1>`.

**WCAG Violation**:
- Rule: `page-has-heading-one`
- Level: WCAG 2.1 Best Practice
- Impact: Moderate

**Steps to Reproduce**:
1. Navigate to http://localhost:3000/login
2. Inspect heading structure
3. No `<h1>` element found

**Expected Behavior**:
Page title rendered as `<h1>` element.

**Actual Behavior**:
Page title rendered as `<h2>` inside `<CardTitle>` component.

**Current Code**:
```tsx
// In signup-form.tsx
<CardTitle>Create an account</CardTitle>
// CardTitle renders as <h2> by default
```

**Fix Options**:

**Option 1**: Add `asChild` prop to CardTitle and wrap in h1
```tsx
<CardTitle asChild>
  <h1>Create an account</h1>
</CardTitle>
```

**Option 2**: Configure CardTitle to use h1
```tsx
<CardTitle className="text-2xl" as="h1">
  Create an account
</CardTitle>
```

**Affected Files**:
- `/Users/vladislav.khozhai/WebstormProjects/finance/src/components/features/auth/signup-form.tsx`
- `/Users/vladislav.khozhai/WebstormProjects/finance/src/components/features/auth/login-form.tsx`
- `/Users/vladislav.khozhai/WebstormProjects/finance/src/app/(dashboard)/page.tsx`

**Impact**:
- ⚠️ Improper heading hierarchy
- ⚠️ Screen readers announce incorrect structure
- ⚠️ SEO impact (minor)

**Related Tests**:
- `tests/accessibility.spec.ts › should have proper heading hierarchy`

**Estimated Fix Time**: 10 minutes

---

## 📊 Bug Statistics

**Total Bugs**: 4
**Critical**: 2
**Medium**: 2
**Low**: 0

**By Category**:
- Authentication: 1
- Routing: 1
- Accessibility: 2

**By Status**:
- Open: 4
- In Progress: 0
- Fixed: 0
- Verified: 0

---

## Bug Resolution Process

1. **Triage**: Assign priority and agent
2. **Investigation**: Root cause analysis
3. **Fix**: Implement solution
4. **Test**: Run affected tests
5. **Verify**: QA verifies fix
6. **Close**: Mark as resolved

---

## Next Steps

**Immediate (Today)**:
1. Backend: Fix BUG-001 (database error)
2. Frontend: Fix BUG-002 (delete page.tsx)
3. Frontend: Fix BUG-003 & BUG-004 (accessibility)

**After Fixes**:
1. QA: Re-run full test suite
2. QA: Verify all 37 tests pass
3. Team: Continue with MVP feature development

---

**Last Updated**: 2025-12-10
**Tracked By**: QA Engineer (05)