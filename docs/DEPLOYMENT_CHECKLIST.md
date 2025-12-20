# Deployment Checklist

Comprehensive pre and post-deployment checklist for FinanceFlow.

## Pre-Deployment Checklist

### 1. Code Quality

- [ ] All tests pass locally: `npm run test`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] No linting errors: `npm run lint`
- [ ] Code formatted consistently: `npm run format`
- [ ] No console.log statements in production code
- [ ] All TODO comments resolved or documented
- [ ] Code reviewed by at least one team member

### 2. Build Verification

- [ ] Production build succeeds: `npm run build`
- [ ] Build completes in < 5 minutes
- [ ] No build warnings (or documented as acceptable)
- [ ] Bundle sizes within limits (< 250 KB first load JS)
- [ ] All dynamic routes compile successfully
- [ ] Source maps disabled for production
- [ ] Environment-specific code works correctly

### 3. Database

- [ ] All migrations tested locally
- [ ] Migrations run successfully: `npx supabase db push`
- [ ] No breaking schema changes (or migration plan documented)
- [ ] RLS policies tested and verified
- [ ] Database backup taken (production only)
- [ ] Seed data prepared (if fresh database)
- [ ] Database connection pooling configured

### 4. Environment Variables

- [ ] All required variables documented in `.env.example`
- [ ] Production variables set in Vercel
- [ ] Preview variables set (if using separate preview DB)
- [ ] No hardcoded secrets in code
- [ ] `SUPABASE_SERVICE_ROLE_KEY` marked as secret
- [ ] `CRON_SECRET` generated and set
- [ ] All JWTs valid and not expired

### 5. Security

- [ ] Dependencies audited: `npm audit`
- [ ] No critical vulnerabilities
- [ ] Authentication tested (signup, login, logout)
- [ ] RLS policies prevent unauthorized access
- [ ] CORS configured correctly
- [ ] Security headers enabled (in `vercel.json`)
- [ ] Rate limiting considered (if applicable)
- [ ] Input validation on all forms

### 6. Features

- [ ] All acceptance criteria met
- [ ] Core user flows tested:
  - [ ] User signup/login
  - [ ] Create transaction
  - [ ] Create budget
  - [ ] View dashboard
  - [ ] Manage categories
  - [ ] Manage tags
- [ ] Edge cases handled gracefully
- [ ] Error messages user-friendly
- [ ] Loading states implemented
- [ ] Empty states designed

### 7. Performance

- [ ] Lighthouse score > 90 (performance)
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] Bundle size optimized
- [ ] Images optimized (WebP, proper sizes)
- [ ] Fonts self-hosted (Geist Sans/Mono)
- [ ] API response times < 500ms

### 8. Accessibility

- [ ] Lighthouse accessibility score = 100
- [ ] Keyboard navigation works
- [ ] Screen reader tested (VoiceOver/NVDA)
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Focus indicators visible
- [ ] Semantic HTML used
- [ ] ARIA labels where needed
- [ ] Forms have proper labels

### 9. Browser/Device Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)
- [ ] Tablet (iPad/Android)
- [ ] Responsive breakpoints tested

### 10. Documentation

- [ ] README.md updated
- [ ] CHANGELOG.md updated
- [ ] API documentation current
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Rollback procedure documented

### 11. Monitoring & Observability

- [ ] Error tracking configured (Sentry, optional)
- [ ] Logging implemented
- [ ] Health check endpoint works: `/api/health`
- [ ] Uptime monitoring configured (optional)
- [ ] Performance monitoring enabled (Vercel Analytics)
- [ ] Alert thresholds set

### 12. Version Control

- [ ] All changes committed
- [ ] Commit messages follow convention
- [ ] Feature branch up-to-date with main
- [ ] No merge conflicts
- [ ] PR approved by reviewers
- [ ] CI pipeline passing

---

## Deployment Process

### Step 1: Final Pre-Deployment Check

```bash
# 1. Pull latest main
git checkout main
git pull origin main

# 2. Ensure feature branch is up-to-date
git checkout feature/your-branch
git merge main
# Resolve conflicts if any

# 3. Run full test suite
npm run test
npm run lint
npm run build

# 4. Verify health check works locally
npm run dev
# Open http://localhost:3000/api/health
# Expected: {"status": "healthy", ...}
```

### Step 2: Create Pull Request

1. Push feature branch: `git push origin feature/your-branch`
2. Open PR on GitHub
3. Fill PR description with changes and testing notes
4. Request reviews from team
5. Wait for CI to pass
6. Wait for preview deployment
7. Test preview deployment (see `PREVIEW_DEPLOYMENT_TESTING.md`)

### Step 3: Merge to Main

1. Address review feedback
2. Ensure all checks pass
3. Squash and merge (or merge strategy per team)
4. Delete feature branch

### Step 4: Monitor Production Deployment

1. Watch Vercel deployment in real-time
2. Check build logs for errors
3. Wait for "Deployment Ready" message
4. Note deployment URL

---

## Post-Deployment Verification

### Immediate Checks (Within 5 minutes)

- [ ] **Health Check**: `curl https://your-app.vercel.app/api/health`
  - Expected: HTTP 200, `{"status": "healthy"}`
- [ ] **Homepage Loads**: Visit `https://your-app.vercel.app`
  - Expected: No errors, page renders
- [ ] **Authentication**: Test signup/login
  - Expected: Can create account and log in
- [ ] **Database Connection**: Create test transaction
  - Expected: Data saves successfully

### Detailed Verification (Within 30 minutes)

- [ ] **All Routes Accessible**:
  - [ ] `/` - Dashboard
  - [ ] `/transactions`
  - [ ] `/budgets`
  - [ ] `/categories`
  - [ ] `/tags`
  - [ ] `/profile`
  - [ ] `/login`
  - [ ] `/signup`

- [ ] **Core Functionality**:
  - [ ] Create transaction (income/expense)
  - [ ] Edit transaction
  - [ ] Delete transaction
  - [ ] Create budget
  - [ ] View budget progress
  - [ ] Create category
  - [ ] Create tag
  - [ ] Update profile settings

- [ ] **Console Errors**: Open browser DevTools
  - [ ] No JavaScript errors
  - [ ] No 404 errors for assets
  - [ ] No CORS errors

- [ ] **Performance**:
  - [ ] Page loads < 3 seconds
  - [ ] API responses < 500ms
  - [ ] No memory leaks (check DevTools Memory)

- [ ] **Database**:
  - [ ] Migrations applied successfully
  - [ ] No foreign key errors
  - [ ] RLS policies working (can't access other user's data)

### Monitoring (Within 24 hours)

- [ ] Check error tracking dashboard (if configured)
- [ ] Review Vercel deployment logs
- [ ] Monitor uptime (should be 100%)
- [ ] Check performance metrics (Lighthouse/Web Vitals)
- [ ] Review user feedback/bug reports

---

## Rollback Procedure

If critical issues are found post-deployment:

### Option 1: Instant Rollback (Vercel)

1. Go to Vercel Dashboard
2. Find previous working deployment
3. Click "..." → "Promote to Production"
4. Confirm promotion
5. Previous version restored in < 1 minute

### Option 2: Git Revert

```bash
# Find commit hash of bad deployment
git log --oneline

# Revert the merge commit
git revert -m 1 <merge-commit-hash>

# Push revert
git push origin main

# Vercel auto-deploys reverted version
```

### Option 3: Fix Forward

```bash
# Create hotfix branch
git checkout -b hotfix/critical-bug

# Make minimal fix
# ... edit files ...

# Fast-track deployment
git add .
git commit -m "hotfix: resolve critical bug"
git push origin hotfix/critical-bug

# Create PR with "HOTFIX" label
# Skip some review steps if critical
# Merge immediately after CI passes
```

---

## Emergency Contacts

Document team contacts for deployment emergencies:

| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| Tech Lead | [Name] | [Email/Phone] | 24/7 |
| DevOps | [Name] | [Email/Phone] | 9am-5pm |
| Database Admin | [Name] | [Email/Phone] | On-call |
| Product Manager | [Name] | [Email] | Business hours |

---

## Deployment Frequency

**Recommended schedule**:
- **Hotfixes**: As needed (immediate)
- **Features**: 1-2 times per week
- **Major releases**: Once per month
- **Database migrations**: During low-traffic windows

**Low-traffic windows**:
- 2am-6am local time
- Weekends (Saturday mornings)
- Avoid Monday mornings and Friday afternoons

---

## Post-Deployment Communication

### Internal Team

- [ ] Notify team in Slack/Discord: "Deployed v1.2.0 to production"
- [ ] Share deployment notes and changes
- [ ] Document any known issues
- [ ] Update project management board (move tasks to "Done")

### External Users (if applicable)

- [ ] Update status page (if maintenance was scheduled)
- [ ] Send changelog email (for major features)
- [ ] Update documentation site
- [ ] Announce new features on social media

---

## Deployment Metrics to Track

- **Deployment frequency**: How often you deploy
- **Lead time**: Time from commit to production
- **Mean time to recovery (MTTR)**: Time to fix production issues
- **Change failure rate**: % of deployments causing issues

**Target metrics**:
- Deployment frequency: Daily to weekly
- Lead time: < 1 hour
- MTTR: < 1 hour
- Change failure rate: < 15%

---

## Continuous Improvement

After each deployment, consider:

1. What went well?
2. What could be improved?
3. Were there any unexpected issues?
4. How can we prevent similar issues?
5. Should we update this checklist?

**Document lessons learned** in team wiki or retro notes.

---

## Tools and Resources

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **GitHub Repository**: [Your repo URL]
- **CI/CD Pipeline**: `.github/workflows/ci.yml`
- **Health Check**: `https://your-app.vercel.app/api/health`
- **Error Tracking**: [Sentry URL, if configured]
- **Uptime Monitor**: [StatusPage URL, if configured]

---

## Next Steps

1. Print this checklist or keep digital copy handy
2. Customize for your team's specific needs
3. Review and update after each deployment
4. Train all team members on deployment process
5. Automate as many steps as possible

**Need Help?** See `DEPLOYMENT_TROUBLESHOOTING.md` for common deployment issues.
