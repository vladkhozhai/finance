# GitHub Branch Protection Rules

Recommended branch protection rules for FinanceFlow to ensure code quality and prevent accidental deployments.

## Why Branch Protection?

Branch protection rules help maintain code quality by:

- ✅ Preventing direct pushes to main/production branches
- ✅ Requiring code reviews before merge
- ✅ Ensuring CI tests pass before deployment
- ✅ Enforcing linear git history
- ✅ Protecting against accidental deletions
- ✅ Maintaining deployment standards

---

## Setup Instructions

### 1. Access Branch Protection Settings

1. Go to your GitHub repository
2. Click "Settings" tab
3. Navigate to "Branches" in left sidebar
4. Click "Add branch protection rule"

### 2. Configure Main Branch Protection

Apply these settings to the `main` branch (or `master` if that's your default):

---

## Recommended Rules for `main` Branch

### General Settings

**Branch name pattern**: `main`

### Protection Rules

#### 1. Require Pull Request Reviews ✅

- [x] **Require a pull request before merging**
  - **Required approvals**: `1` (minimum)
  - **Recommended**: `2` for larger teams

- [x] **Dismiss stale pull request approvals when new commits are pushed**
  - Ensures reviewers see latest changes

- [x] **Require review from Code Owners** (optional)
  - Only if CODEOWNERS file is configured

- [ ] **Restrict who can dismiss pull request reviews** (optional)
  - Leave unchecked for smaller teams

- [x] **Require approval of the most recent reviewable push**
  - Prevents sneaky last-minute changes

**Why**: Ensures all code is reviewed before reaching production.

---

#### 2. Require Status Checks ✅

- [x] **Require status checks to pass before merging**

**Required status checks**:
- `lint` (Biome linter)
- `build` (Next.js build)
- `test` (E2E tests with Playwright)
- `validate-migrations` (Database migration validation)
- `ci-success` (Aggregated CI status)

- [x] **Require branches to be up to date before merging**
  - Ensures feature branch has latest main changes
  - Prevents integration issues

**Why**: Ensures code quality and prevents breaking builds.

---

#### 3. Require Conversation Resolution ✅

- [x] **Require conversation resolution before merging**

**Why**: Ensures all review comments are addressed.

---

#### 4. Require Signed Commits (Optional) ⚠️

- [ ] **Require signed commits**

**When to enable**:
- Large teams
- High security requirements
- Compliance needs

**When to skip**:
- Small teams
- Internal projects
- Setup complexity outweighs benefit

**Why**: Verifies commit author identity (prevents impersonation).

---

#### 5. Require Linear History ✅

- [x] **Require linear history**

**Effect**: Enforces squash merge or rebase merge (no merge commits)

**Benefits**:
- Cleaner git history
- Easier to bisect
- Simpler to revert

**Merge strategies allowed**:
- ✅ Squash and merge
- ✅ Rebase and merge
- ❌ Create a merge commit

**Why**: Maintains clean, readable git history.

---

#### 6. Require Deployments to Succeed (Optional)

- [ ] **Require deployments to succeed before merging**

**Status**: Not typically needed (Vercel deploys on merge)

**Use case**: If you want to block merge until preview deployment succeeds.

---

#### 7. Lock Branch (Emergency Only) ⚠️

- [ ] **Lock branch**

**When to enable**: During incidents or planned maintenance

**Effect**: No one can push (including admins)

**Use carefully**: Can block emergency hotfixes

---

#### 8. Restrict Push Access ✅

- [x] **Do not allow bypassing the above settings**

**Effect**: Even admins must follow rules (recommended)

- [ ] **Allow force pushes**
  - ❌ **DO NOT ENABLE** for main branch

- [ ] **Allow deletions**
  - ❌ **DO NOT ENABLE** for main branch

**Why**: Prevents accidental history rewrites or branch deletion.

---

#### 9. Restrict Who Can Push ✅

- [x] **Restrict who can push to matching branches**

**Allowed actors**:
- [ ] Repository administrators
- [ ] Organization owners
- [x] CI/CD service accounts (GitHub Actions)

**Why**: Only allow automated deployments, not manual pushes.

---

## Rules for Other Branches

### Development Branch (if using)

If you have a `develop` or `staging` branch:

**Branch name pattern**: `develop`

**Rules** (less strict than main):
- [x] Require pull request (1 approval)
- [x] Require status checks (same as main)
- [ ] Require linear history (optional)
- [x] Do not allow bypassing settings

**Why**: Allows faster iteration while maintaining quality.

---

### Release Branches

**Branch name pattern**: `release/*`

**Rules**:
- [x] Require pull request (2 approvals)
- [x] Require status checks
- [x] Require linear history
- [x] Lock branch after release

**Why**: Ensures stable releases.

---

### Hotfix Branches

**Branch name pattern**: `hotfix/*`

**Rules** (relaxed for emergencies):
- [x] Require pull request (1 approval)
- [x] Require status checks (critical only: build, lint)
- [ ] Require branches up to date (skip for speed)

**Why**: Allows fast response to production issues.

---

## Enforcement Hierarchy

### Level 1: Developers

- Cannot push directly to main
- Must create pull request
- Must pass all CI checks
- Must get approval
- Can create any feature branch

### Level 2: Maintainers

- Same as developers
- Can approve pull requests
- Can merge after approval
- Cannot bypass branch protection

### Level 3: Administrators (Optional)

- **Recommended**: Same as maintainers (no bypass)
- **Optional**: Can bypass branch protection (emergency only)

**Best Practice**: Admins follow same rules as developers.

---

## GitHub Actions Workflow Integration

Ensure your CI workflow (`.github/workflows/ci.yml`) reports status correctly:

```yaml
name: CI Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # Job names must match "Required status checks"
  lint:
    name: Lint & Type Check
    # ... steps ...

  build:
    name: Build Application
    # ... steps ...

  test:
    name: E2E Tests (Playwright)
    # ... steps ...

  validate-migrations:
    name: Validate Migrations
    # ... steps ...

  ci-success:
    name: CI Pipeline Success
    needs: [lint, build, test, validate-migrations]
    # ... aggregation step ...
```

**Important**: Job names in workflow must match required status check names in GitHub.

---

## CODEOWNERS File (Optional)

Create `.github/CODEOWNERS` to automatically request reviews:

```
# Backend code - Backend Developer reviews
/src/app/actions/ @backend-dev
/src/lib/supabase/ @backend-dev
/supabase/ @system-architect @backend-dev

# Frontend code - Frontend Developer reviews
/src/components/ @frontend-dev
/src/app/**/*.tsx @frontend-dev

# Database migrations - System Architect reviews
/supabase/migrations/ @system-architect

# CI/CD config - DevOps reviews
/.github/ @devops
/vercel.json @devops
/docs/ @frontend-dev @system-architect

# Documentation - Everyone can review
/*.md @frontend-dev @backend-dev @system-architect
```

**Effect**: Automatically requests reviews from appropriate team members.

---

## Testing Branch Protection

### Test 1: Direct Push to Main (Should Fail)

```bash
git checkout main
echo "test" >> README.md
git add README.md
git commit -m "test: direct push"
git push origin main
```

**Expected**: ❌ Push rejected

**Error message**:
```
remote: error: GH006: Protected branch update failed for refs/heads/main.
remote: error: Required status check "ci-success" is expected.
```

**Verdict**: ✅ Protection working

---

### Test 2: PR Without Approval (Should Fail)

1. Create feature branch
2. Push changes
3. Open PR
4. Try to merge without approval

**Expected**: ❌ Merge button disabled or shows "Requires approval"

**Verdict**: ✅ Protection working

---

### Test 3: PR Without CI (Should Fail)

1. Open PR
2. CI fails (e.g., linting error)
3. Try to merge

**Expected**: ❌ Merge blocked, shows "Some checks were not successful"

**Verdict**: ✅ Protection working

---

### Test 4: Valid PR (Should Succeed)

1. Create feature branch
2. Push changes
3. Open PR
4. CI passes ✅
5. Get approval ✅
6. Merge

**Expected**: ✅ Merge succeeds

**Verdict**: ✅ Protection working correctly

---

## Rollout Strategy

### Phase 1: Soft Launch (Week 1)

Enable for main branch:
- [x] Require pull requests (1 approval)
- [x] Require status checks
- [ ] Do not allow bypassing (admins can bypass)

**Goal**: Team gets used to PR workflow

---

### Phase 2: Enforcement (Week 2)

Enable additional rules:
- [x] Require conversation resolution
- [x] Require branches up to date
- [x] Require linear history

**Goal**: Establish quality standards

---

### Phase 3: Full Protection (Week 3+)

Lock down completely:
- [x] Do not allow bypassing (admins must follow rules)
- [x] Increase required approvals to 2 (for larger teams)

**Goal**: Production-grade protection

---

## Troubleshooting

### Issue: "Required status check not found"

**Symptoms**: Can't merge PR, status check shows as pending

**Solution**:
1. Check GitHub Actions workflow ran
2. Verify job name matches required check name
3. Re-run failed jobs
4. Check if check is marked as "required" in branch protection

---

### Issue: "Changes requested" blocks merge

**Symptoms**: Merge button disabled even after addressing feedback

**Solution**:
1. Reviewer must "Approve" (not just comment)
2. Or dismiss stale review if outdated

---

### Issue: Admin needs to bypass for emergency

**Symptoms**: Production down, need immediate hotfix

**Solution**:
1. Temporarily disable "Do not allow bypassing"
2. Push hotfix
3. Re-enable protection immediately
4. Document incident for post-mortem

---

### Issue: "Branch out of date" blocks merge

**Symptoms**: Main changed since branch created

**Solution**:
```bash
# Update feature branch with latest main
git checkout feature-branch
git fetch origin
git merge origin/main
# or: git rebase origin/main

# Push updated branch
git push origin feature-branch
```

---

## Best Practices

### DO ✅

- Use descriptive branch names (`feature/add-budget-ui`)
- Keep PRs small (< 500 lines changed)
- Write clear PR descriptions
- Address review comments promptly
- Update branch before merging
- Test locally before opening PR
- Use conventional commits

### DON'T ❌

- Push directly to main (even as admin)
- Force push to main
- Delete main branch
- Bypass protection rules casually
- Ignore review comments
- Merge without CI passing
- Create mega-PRs (> 1000 lines)

---

## Summary Configuration

**Quick copy-paste checklist for GitHub settings**:

**Main branch protection**:
- ✅ Require pull request (1-2 approvals)
- ✅ Require status checks: `lint`, `build`, `test`, `validate-migrations`, `ci-success`
- ✅ Require branches up to date
- ✅ Require conversation resolution
- ✅ Require linear history
- ✅ Do not allow bypassing
- ❌ Allow force pushes (DISABLED)
- ❌ Allow deletions (DISABLED)
- ✅ Restrict who can push (CI only)

---

## Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [CODEOWNERS Documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [Required Status Checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)

---

**Need Help?** See `DEPLOYMENT_TROUBLESHOOTING.md` or contact your DevOps team.
