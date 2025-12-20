# Preview Deployment Testing Guide

Complete guide for testing FinanceFlow preview deployments on Vercel.

## What are Preview Deployments?

Preview deployments are **temporary, isolated instances** of your application deployed automatically for every pull request. They allow you to:

- ✅ Test changes before merging to production
- ✅ Share work-in-progress with team members
- ✅ Catch bugs in a production-like environment
- ✅ Verify UI changes visually
- ✅ Test database migrations safely

## Preview Deployment Workflow

### 1. Create Feature Branch

```bash
# Create new branch from main
git checkout main
git pull origin main
git checkout -b feature/new-budget-ui

# Make your changes
# ... edit files ...

# Commit changes
git add .
git commit -m "feat: improve budget card UI with progress indicators"

# Push to GitHub
git push origin feature/new-budget-ui
```

### 2. Open Pull Request

1. Go to GitHub repository
2. Click "Pull requests" → "New pull request"
3. Select base: `main` ← compare: `feature/new-budget-ui`
4. Click "Create pull request"
5. Fill in PR description:
   ```markdown
   ## Changes
   - Improved budget card UI
   - Added visual progress indicators
   - Enhanced accessibility

   ## Testing
   - [ ] Manual testing on preview deployment
   - [ ] Verified with multiple budgets
   - [ ] Tested responsive design

   ## Screenshots
   [Add screenshots if applicable]
   ```

### 3. Vercel Deploys Preview

Within ~2-5 minutes, Vercel will:
1. Detect new PR
2. Clone repository at PR commit
3. Run migrations (if configured)
4. Build application
5. Deploy to unique URL
6. Comment on PR with preview URL

**Example comment**:
```
✅ Preview deployment ready!

🔍 Inspect: https://vercel.com/yourname/financeflow/abc123
🌐 Preview: https://financeflow-git-feature-new-budget-yourname.vercel.app

Latest commit: abc123
```

### 4. Test Preview Deployment

Click the preview URL and test your changes:

- [ ] App loads successfully
- [ ] Authentication works
- [ ] Database connectivity OK
- [ ] Feature changes visible
- [ ] No console errors
- [ ] No visual regressions
- [ ] Responsive design works
- [ ] Accessibility maintained

### 5. Iterate on Feedback

If issues found:
1. Make fixes on feature branch
2. Commit and push: `git push origin feature/new-budget-ui`
3. Vercel automatically re-deploys preview
4. Test again with new preview URL

### 6. Merge to Production

Once approved:
1. PR is merged to `main`
2. Vercel deploys to production
3. Preview deployment is deleted (after 7 days)

---

## Preview Database Strategy

### Option A: Shared Production Database

**Pros**:
- Simple setup (no extra configuration)
- Real data for testing

**Cons**:
- Preview data mixes with production
- Risk of data corruption
- Multiple previews share same data

**When to use**: Low-risk UI-only changes

**Configuration**: Use production environment variables for preview scope.

---

### Option B: Separate Preview Database (Recommended)

**Pros**:
- Isolated test environment
- Safe to test destructive operations
- Can seed with test data
- No impact on production

**Cons**:
- Additional Supabase project required
- Extra setup time
- Separate migration management

**When to use**: Database schema changes, destructive operations, major features

**Configuration**:

1. **Create Preview Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create new project: "financeflow-preview"
   - Note credentials

2. **Configure Preview Environment Variables** (Vercel):
   - Go to Project → Settings → Environment Variables
   - Add with scope "Preview" only:
     ```bash
     NEXT_PUBLIC_SUPABASE_URL=https://preview-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
     SUPABASE_SERVICE_ROLE_KEY=eyJ...
     ```

3. **Seed Preview Database** (optional):
   ```bash
   # Run migrations on preview DB
   export SUPABASE_URL=https://preview-project.supabase.co
   export SUPABASE_KEY=your-service-key
   npx supabase db push

   # Seed with test data
   psql $DATABASE_URL < test-data.sql
   ```

---

## Testing Checklist

### Basic Functionality

- [ ] App loads without errors
- [ ] Health endpoint returns 200: `/api/health`
- [ ] Authentication flow works (signup/login)
- [ ] Session persists across pages
- [ ] Logout works

### Feature-Specific Testing

- [ ] New feature is visible
- [ ] Feature works as expected
- [ ] Edge cases handled
- [ ] Error states display correctly
- [ ] Loading states work

### Database Testing

- [ ] CRUD operations work
- [ ] RLS policies enforced
- [ ] Migrations applied successfully
- [ ] No data leaks between users
- [ ] Transactions atomic

### UI/UX Testing

- [ ] Layout correct on desktop
- [ ] Layout correct on mobile
- [ ] Responsive design works (tablet, phone)
- [ ] Dark mode (if applicable)
- [ ] Animations smooth
- [ ] No visual regressions

### Performance Testing

- [ ] Page loads < 3 seconds
- [ ] No console errors
- [ ] No 404 errors for assets
- [ ] Images load correctly
- [ ] Fonts load correctly

### Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Proper ARIA labels
- [ ] Focus indicators visible
- [ ] Color contrast sufficient (WCAG AA)

---

## Preview URL Structure

Preview URLs follow this pattern:

```
https://[project-name]-git-[branch-name]-[team-slug].vercel.app
```

**Example**:
```
https://financeflow-git-feature-budgets-myteam.vercel.app
```

**Components**:
- `financeflow` - Project name
- `feature-budgets` - Branch name (sanitized)
- `myteam` - Team/user slug

---

## Common Preview Deployment Issues

### Issue: Preview deployment failed

**Symptoms**: PR comment shows "Deployment failed" with red X

**Solution**:
1. Click "Inspect" link in Vercel comment
2. Check build logs for errors
3. Common causes:
   - TypeScript errors
   - Missing environment variables
   - Migration failures
   - Build timeout

**Fix**:
```bash
# Fix locally and test
npm run build

# If successful, commit and push
git add .
git commit -m "fix: resolve build errors"
git push origin feature/new-budget-ui
```

---

### Issue: "Environment validation failed" on preview

**Symptoms**: Preview loads but shows error page

**Solution**:
1. Verify preview environment variables are set in Vercel
2. Check variables are scoped to "Preview"
3. Ensure all required variables present:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

### Issue: Preview uses production database

**Symptoms**: Preview changes affect production data

**Solution**:
1. Set preview-specific environment variables
2. Scope variables to "Preview" only (uncheck "Production")
3. Verify preview Supabase URL is different from production

---

### Issue: Preview URL not working (404)

**Symptoms**: Preview URL returns 404 Not Found

**Solution**:
1. Wait 2-5 minutes for deployment to complete
2. Check Vercel dashboard for deployment status
3. Verify branch was pushed to GitHub
4. Check if preview deployments are enabled:
   - Go to Project Settings → Git
   - Ensure "Deploy Previews" is "All branches"

---

### Issue: Database connection failed on preview

**Symptoms**: Preview shows "Database connection failed" error

**Solution**:
1. Verify preview Supabase project is active (not paused)
2. Check preview `SUPABASE_SERVICE_ROLE_KEY` is correct
3. Ensure migrations ran successfully (check build logs)
4. Verify RLS policies allow authenticated users

---

## Advanced Testing Techniques

### Visual Regression Testing

Use tools to catch unexpected UI changes:

**Percy** (visual diffs):
```bash
npm install --save-dev @percy/cli @percy/playwright

# Take screenshots
npx percy exec -- npm run test
```

**Playwright Screenshots**:
```typescript
// tests/visual.spec.ts
test('budget page visual', async ({ page }) => {
  await page.goto(process.env.PREVIEW_URL + '/budgets');
  await expect(page).toHaveScreenshot();
});
```

### Load Testing

Test performance under load:

```bash
# Using Apache Bench
ab -n 1000 -c 10 https://preview-url.vercel.app/api/health

# Using Artillery
npm install -g artillery
artillery quick --count 100 --num 10 https://preview-url.vercel.app/
```

### Security Testing

Check for vulnerabilities:

```bash
# Dependency audit
npm audit

# Lighthouse security audit
npx lighthouse https://preview-url.vercel.app/ --only-categories=best-practices

# OWASP ZAP scan (requires ZAP running)
zap-cli quick-scan https://preview-url.vercel.app/
```

---

## Preview Deployment Best Practices

### DO ✅

- Test on preview before merging to main
- Share preview URLs with team for feedback
- Test on real devices (mobile, tablet)
- Check browser console for errors
- Verify migrations applied successfully
- Test authentication flows thoroughly
- Check accessibility with real screen readers
- Use separate preview database for risky changes

### DON'T ❌

- Merge without testing preview
- Use production database for destructive tests
- Skip testing on mobile
- Ignore console warnings
- Share preview URLs publicly (contain project info)
- Leave sensitive data in preview database
- Forget to test edge cases

---

## Preview Deployment Lifecycle

1. **Creation**: When PR is opened
2. **Updates**: Every time PR branch is pushed
3. **Access**: Available via unique URL
4. **Expiration**: Deleted 7 days after PR is merged/closed
5. **Logs**: Available in Vercel dashboard for 30 days

---

## Automation Ideas

### Auto-comment with Test Instructions

Add to PR template (`.github/pull_request_template.md`):

```markdown
## Testing Instructions

1. Wait for preview deployment to complete
2. Click "Visit Preview" link in Vercel comment
3. Test the following:
   - [ ] Feature works as expected
   - [ ] No console errors
   - [ ] Responsive on mobile
   - [ ] No visual regressions

## Preview Database

This PR uses: [ ] Production DB [ ] Preview DB
```

### GitHub Actions Integration

Run tests against preview:

```yaml
# .github/workflows/preview-test.yml
name: Test Preview Deployment

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  test-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Wait for Vercel deployment
        uses: patrickedqvist/wait-for-vercel-preview@v1.3.1
        id: vercel
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          max_timeout: 300

      - name: Run E2E tests on preview
        run: |
          PREVIEW_URL=${{ steps.vercel.outputs.url }}
          npm run test:e2e -- --baseURL=$PREVIEW_URL
```

---

## Resources

- [Vercel Preview Deployments](https://vercel.com/docs/concepts/deployments/preview-deployments)
- [GitHub Pull Requests Best Practices](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests)
- [Supabase Branching](https://supabase.com/docs/guides/platform/branching)

---

## Next Steps

1. Create first preview deployment (open a PR)
2. Test preview thoroughly using checklist
3. Document any project-specific testing requirements
4. Set up preview database if needed
5. Train team on preview deployment workflow

**Need Help?** See `DEPLOYMENT_TROUBLESHOOTING.md` for preview deployment issues.
