# BUG-006: Email Validation Rejects Valid Domains

**Reported By**: QA Engineer (Agent 05)
**Date**: December 21, 2025
**Severity**: 🔴 **CRITICAL**
**Status**: ❌ **OPEN** (Blocks Production)
**Affected Agent**: Backend Developer (Agent 03)

---

## Summary

The application's email validation is rejecting legitimate email domains including `@example.com`, preventing users from signing up. This validation is more restrictive than Supabase Auth's actual requirements.

---

## Impact

### User Impact: 🔴 Critical
- **Primary**: Blocks legitimate user signups
- **Secondary**: Creates poor user experience with misleading error messages
- **Tertiary**: Hinders QA testing with standard test email formats

### Business Impact
- Users cannot register accounts with certain valid email domains
- Potential loss of customers who encounter this error
- Negative brand perception ("Why doesn't your app accept my email?")

---

## Reproduction Steps

1. Navigate to `https://financeflow-brown.vercel.app/signup`
2. Fill in form:
   - Email: `qa-iteration4@example.com`
   - Password: `TestPassword123!`
   - Confirm Password: `TestPassword123!`
   - Currency: USD (default)
3. Click "Create account"
4. **Expected**: Form submits successfully, redirect to `/login?confirmed=pending`
5. **Actual**: Error message "Email address 'qa-iteration4@example.com' is invalid"

---

## Technical Details

### Request/Response

**Request URL**: `POST https://financeflow-brown.vercel.app/signup`

**Request Headers**:
```
Content-Type: text/plain;charset=UTF-8
next-action: 409a390ae38df5ab67b416683b3611bbd6cf0d88e5
```

**Request Body**:
```json
[{"email":"qa-iteration4@example.com","password":"TestPassword123!","currency":"USD"}]
```

**Response Status**: `200 OK`

**Response Body** (excerpt):
```
1:{"success":false,"error":"Email address \"qa-iteration4@example.com\" is invalid"}
```

### Root Cause Analysis

The error is coming from the **application's validation logic**, not from Supabase Auth API. This is evident because:

1. The response comes immediately (no Supabase API call delay)
2. The error format matches our application's error handling
3. When testing with `@gmail.com`, Supabase accepts the signup

**Suspected Location**:
- `/src/app/actions/auth.ts` - Server Action signup function
- Possibly using an overly restrictive email regex or validation library

### What Should Happen

Email validation should:
1. ✅ Reject malformed emails (no @, missing domain, etc.)
2. ✅ Reject emails with invalid characters
3. ✅ Reject `.test` TLD (Supabase limitation - documented in BUG-002)
4. ❌ **NOT** reject valid domains like `@example.com`

---

## Evidence

### Test Results

| Email Tested | Expected | Actual | Status |
|--------------|----------|--------|--------|
| `qa-iteration4@example.com` | ✅ Accept | ❌ Reject | **FAIL** |
| `qa.iteration4@gmail.com` | ✅ Accept | ✅ Accept | PASS |

### Screenshot

Login page after successful signup with @gmail.com (showing the flow SHOULD work):
- "Check your email" banner displayed
- Redirect to `/login?confirmed=pending`
- Success message visible

Error displayed for @example.com:
- "Email address 'qa-iteration4@example.com' is invalid"
- No Supabase API error (application-level rejection)

---

## Additional Domains to Test

Once fixed, the following domains should be tested:

| Domain | Should Work | Reason |
|--------|-------------|--------|
| `@example.com` | ✅ Yes | RFC 2606 reserved domain |
| `@example.org` | ✅ Yes | RFC 2606 reserved domain |
| `@test.com` | ✅ Yes | Valid domain |
| `@test.test` | ❌ No | Supabase rejects `.test` TLD |
| `@localhost.localdomain` | ❌ No | Invalid domain |
| `@gmail.com` | ✅ Yes | Common provider |
| `@yahoo.com` | ✅ Yes | Common provider |
| `@outlook.com` | ✅ Yes | Common provider |

---

## Comparison with BUG-002

### BUG-002: `.test` TLD Rejection
- **Source**: Supabase Auth API (GoTrue)
- **Behavior**: API returns error after attempting to create user
- **Status**: External limitation (cannot be fixed)

### BUG-006: `@example.com` Rejection
- **Source**: Application validation code
- **Behavior**: Error returned before calling Supabase API
- **Status**: Application bug (can and must be fixed)

**Key Difference**: BUG-002 is an external API limitation we must work around. BUG-006 is our own code being too restrictive.

---

## Recommended Fix

### Investigation Steps

1. **Locate the validation code**:
   ```bash
   # Search for email validation
   grep -r "is invalid" src/app/actions/auth.ts
   grep -r "email.*validation" src/app/actions/
   ```

2. **Review validation logic**:
   - Check for regex patterns that reject valid domains
   - Look for domain whitelisting/blacklisting
   - Verify Zod schema if using validation library

3. **Identify the issue**:
   - Overly restrictive regex? (e.g., only allowing specific TLDs)
   - Domain blacklist including `example.com`?
   - Validation library with incorrect configuration?

### Code Fix (Example)

**Current (suspected - too restrictive)**:
```typescript
// Bad: Only allows specific domains
const emailSchema = z.string()
  .email()
  .regex(/^[^@]+@(gmail|yahoo|outlook)\.com$/, "Email must be from a supported provider");
```

**Fixed (correct)**:
```typescript
// Good: Standard email validation + Supabase .test TLD restriction
const emailSchema = z.string()
  .email("Invalid email format")
  .refine(
    (email) => !email.endsWith('.test'),
    "Emails with .test domain are not supported"
  );
```

### Testing the Fix

After implementing the fix, test with:
```bash
# Test cases to verify
✅ qa-iteration4@example.com
✅ test@example.org
✅ user@gmail.com
✅ admin@custom-domain.io
❌ invalid@domain.test (should reject - Supabase limitation)
❌ notanemail (should reject - malformed)
❌ @nodomain.com (should reject - malformed)
```

---

## Related Bugs

- **BUG-002**: Supabase `.test` TLD rejection (External limitation)
- **BUG-003**: Error display (Fixed - validation errors now visible)

---

## Acceptance Criteria for Fix

- [ ] Signup accepts `test@example.com`
- [ ] Signup accepts `test@example.org`
- [ ] Signup accepts valid email formats from any reasonable domain
- [ ] Signup still rejects `.test` TLD (Supabase limitation)
- [ ] Signup still rejects malformed emails
- [ ] Error messages remain clear and helpful
- [ ] Existing functionality (login, logout) still works
- [ ] No regression in BUG-001, 003, 004, 005 fixes

---

## Priority Justification

**Why Critical?**

1. **Blocks Core Functionality**: Users cannot register accounts
2. **No Workaround for End Users**: Regular users won't know to try different email domains
3. **Production Blocker**: Cannot deploy with broken signup
4. **Poor User Experience**: Misleading error message ("your email is invalid" when it's actually valid)

**Business Risk**: Every hour this bug exists in production means lost potential customers who encounter the signup error and leave.

---

## Timeline

- **Discovered**: December 21, 2025 - 10:15 UTC (Iteration 4 testing)
- **Reported**: December 21, 2025 - 10:30 UTC
- **Assigned To**: Backend Developer (Agent 03)
- **Target Fix**: Before next deployment
- **Verification**: QA Engineer (Agent 05) will re-test after fix

---

## Communication

### To Backend Developer

The email validation in the signup Server Action is too restrictive. It's rejecting `@example.com` emails before even calling Supabase. Please:

1. Review the email validation logic in `/src/app/actions/auth.ts`
2. Relax the validation to accept standard email formats
3. Keep the `.test` TLD restriction (that's a Supabase limitation)
4. Test with multiple domains before deploying

### To Product Manager

FYI: Final QA testing found a critical bug in email validation that blocks user signups. All previously reported bugs are fixed, but this new issue must be addressed before production deployment. Estimated fix time: 1-2 hours.

---

## Workaround (Temporary - QA Testing Only)

For QA testing purposes, use common email provider domains:
- `@gmail.com` ✅
- `@yahoo.com` ✅
- `@outlook.com` ✅

**Note**: This workaround does NOT solve the production issue. The bug must be fixed.

---

## References

- **BUG-002 Analysis**: `/Users/vladislav.khozhai/WebstormProjects/finance/BUG_002_ITERATION_4_SERVER_FIX.md`
- **Test Report**: `/Users/vladislav.khozhai/WebstormProjects/finance/ITERATION_4_FINAL_APPROVAL.md`
- **Production URL**: https://financeflow-brown.vercel.app/signup

---

**Status**: ❌ OPEN - Blocking Production
**Assigned**: Backend Developer (Agent 03)
**Priority**: P0 - Critical

*Bug report filed by QA Engineer (Agent 05) on December 21, 2025*
