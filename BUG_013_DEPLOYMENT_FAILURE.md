# BUG-013: BUG-006 Fix Not Deployed to Production

**Severity**: P0 - Critical
**Status**: New
**Assigned To**: Backend Developer + System Architect
**Created**: 2025-12-21 10:35 UTC
**Reporter**: QA Engineer

---

## Problem Summary

Commit `3284c80` ("fix: remove overly restrictive email validation (BUG-006)") has been pushed to `origin/main`, but production (Vercel) is still serving the old validation code that rejects `@example.com` emails.

---

## Evidence

### Repository State
```bash
$ git log --oneline -1
3284c80 fix: remove overly restrictive email validation (BUG-006)

$ git status
On branch main
Your branch is up to date with 'origin/main'.
```

Commit IS pushed to remote.

### Local Code (Correct)
```typescript
// /src/lib/validations/auth.ts:25
export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"), // Uses standard Zod validator
  password: z.string()...
});
```

### Production Behavior (Incorrect)
```bash
POST https://financeflow-brown.vercel.app/signup
Request: {"email":"qa-iteration5@example.com","password":"TestPassword123!","currency":"USD"}
Response: {"success":false,"error":"Email address \"qa-iteration5@example.com\" is invalid"}
```

Production REJECTS `@example.com` emails, meaning old regex validation is still running.

### Verification Test
To confirm this is a deployment issue (not Supabase):
- Tested with `qa-iteration5@financeflow.com` (different domain)
- Signup SUCCEEDED
- This proves server actions work, but validation code is outdated

---

## Root Cause

Vercel deployment pipeline did not deploy commit `3284c80` to production. Possible causes:

1. Auto-deploy didn't trigger after git push
2. Build failed silently
3. Deployment is stuck/pending
4. Vercel cache not invalidated

---

## Impact

BLOCKS PRODUCTION APPROVAL

- Users cannot sign up with RFC 2606 reserved test domains (@example.com)
- QA cannot verify BUG-006 fix in production
- Iteration 5 smoke testing FAILED

---

## Action Required (Backend Developer)

1. Login to Vercel dashboard
2. Navigate to FinanceFlow project deployments
3. Check latest deployment status for commit `3284c80`
4. If deployment failed:
   - Review build logs
   - Fix build issues
   - Retry deployment
5. If deployment pending:
   - Trigger manual deployment
6. If deployment succeeded but serving old code:
   - Clear Vercel cache
   - Redeploy with cache bypass
7. Verify production after deployment:
   ```bash
   curl -X POST https://financeflow-brown.vercel.app/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!"}'
   # Should NOT return validation error
   ```
8. Report deployment status in BUG-013 ticket

---

## Testing After Fix

Once deployment is confirmed, QA will perform Iteration 6 verification:
1. Test signup with `qa-iteration6@example.com`
2. Verify email validation passes
3. Verify all regression tests still pass
4. Approve production if all tests pass

---

## Related Issues

- **BUG-006**: Original email validation issue (fixed in code, not deployed)
- **QA_ITERATION_5_FINAL_REPORT.md**: Full test report

---

## Recommendations

### Immediate (Backend Developer)
- Investigate and resolve Vercel deployment issue
- Notify QA when deployment is confirmed

### Long-term (System Architect)
- Set up Vercel deployment notifications (Slack/email)
- Add deployment health checks to CI/CD pipeline
- Implement automated deployment verification tests
- Document manual deployment procedures for emergencies

---

## Deployment Verification Checklist

Before closing this bug, verify:

- [ ] Commit `3284c80` visible in Vercel dashboard
- [ ] Build logs show successful compilation
- [ ] Deployment status shows "Ready" (not "Error" or "Building")
- [ ] Production API returns 200 for POST /signup with @example.com email
- [ ] No validation error for @example.com domain
- [ ] QA confirmed in Iteration 6 testing

---

**Next Action**: Backend Developer to investigate Vercel deployment status and report findings.
