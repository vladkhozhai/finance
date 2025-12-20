# FinanceFlow Deployment Architecture

This document provides a comprehensive guide to the CI/CD pipeline, deployment architecture, and operational procedures for FinanceFlow.

## Table of Contents

- [Pipeline Architecture Overview](#pipeline-architecture-overview)
- [CI/CD Pipeline Stages](#cicd-pipeline-stages)
- [Database Migration Strategy](#database-migration-strategy)
- [Environment Configuration](#environment-configuration)
- [Deployment Workflows](#deployment-workflows)
- [Rollback Procedures](#rollback-procedures)
- [Platform-Specific Setup](#platform-specific-setup)
- [Troubleshooting](#troubleshooting)

---

## Pipeline Architecture Overview

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DEVELOPER WORKFLOW                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                          ┌─────────▼──────────┐
                          │  Git Push/PR       │
                          │  (main branch)     │
                          └─────────┬──────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│                          CI PIPELINE (GitHub Actions)                    │
│  Execution Time: ~3-5 minutes (parallel jobs)                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
        ┌───────────▼────────────┐     ┌───────────▼────────────┐
        │  JOB 1: LINT           │     │  JOB 2: BUILD          │
        │  - Biome check         │     │  - Next.js build       │
        │  - TypeScript check    │     │  - Upload artifacts    │
        │  Time: ~30-60s         │     │  Time: ~1-2min         │
        └───────────┬────────────┘     └───────────┬────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    │
        ┌───────────────────────────┴───────────────────────────┐
        │                                                       │
┌───────▼────────────┐                             ┌───────────▼────────────┐
│  JOB 3: E2E TESTS  │                             │  JOB 4: MIGRATIONS     │
│  - Playwright      │                             │  - Validate syntax     │
│  - Test instance   │                             │  - Check conflicts     │
│  Time: ~2-4min     │                             │  Time: ~30-60s         │
└───────┬────────────┘                             └───────────┬────────────┘
        │                                                       │
        └───────────────────────────┬───────────────────────────┘
                                    │
                          ┌─────────▼──────────┐
                          │  CI SUCCESS CHECK  │
                          │  (All jobs pass)   │
                          └─────────┬──────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT STAGE (Vercel/Auto)                       │
│  Triggered on: Push to main (production) or PR (preview)                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
        ┌───────────▼────────────┐     ┌───────────▼────────────┐
        │  PREVIEW DEPLOYMENT    │     │  PRODUCTION DEPLOYMENT │
        │  (Pull Requests)       │     │  (Main branch)         │
        └───────────┬────────────┘     └───────────┬────────────┘
                    │                               │
        ┌───────────▼────────────┐     ┌───────────▼────────────┐
        │  1. Build Next.js      │     │  1. Run migrations     │
        │  2. Deploy preview     │     │  2. Build Next.js      │
        │  3. Comment PR w/ URL  │     │  3. Deploy production  │
        │  Time: ~2-3min         │     │  4. Health check       │
        │                        │     │  Time: ~3-5min         │
        └────────────────────────┘     └───────────┬────────────┘
                                                    │
                                          ┌─────────▼──────────┐
                                          │  POST-DEPLOY       │
                                          │  - Smoke tests     │
                                          │  - Monitor metrics │
                                          └────────────────────┘
```

### Pipeline Execution Flow

1. **Trigger**: Push to `main` branch or Pull Request creation
2. **Parallel CI Jobs**: Lint, Build, Test, Migration validation (3-5 min total)
3. **Quality Gate**: All jobs must pass before deployment
4. **Deployment**: Automatic deployment to Vercel (production or preview)
5. **Post-Deploy**: Health checks and monitoring

### Key Design Principles

- **Speed**: Parallel job execution for <5 minute CI time
- **Safety**: Multiple quality gates before production deployment
- **Reliability**: Automatic rollback on health check failures
- **Visibility**: Comprehensive artifacts and reports on failure
- **Zero-Downtime**: Blue-green deployment strategy

---

## CI/CD Pipeline Stages

### Stage 1: Lint & Type Check (~30-60 seconds)

**Purpose**: Validate code quality and TypeScript correctness

**Jobs**:
- Biome linter (`npm run lint`)
- TypeScript compiler check (`npx tsc --noEmit`)

**Failure Impact**: Blocks deployment, requires code fixes

**Configuration**:
```yaml
lint:
  runs-on: ubuntu-latest
  timeout-minutes: 5
  steps:
    - Checkout code
    - Setup Node.js (cache enabled)
    - Install dependencies (npm ci)
    - Run Biome linter
    - Run TypeScript check
```

### Stage 2: Build (~1-2 minutes)

**Purpose**: Validate successful Next.js production build

**Jobs**:
- Next.js production build (`npm run build`)
- Upload build artifacts for debugging

**Failure Impact**: Blocks deployment, indicates build-time errors

**Configuration**:
```yaml
build:
  runs-on: ubuntu-latest
  timeout-minutes: 10
  env:
    # Dummy values for CI build validation
    NEXT_PUBLIC_SUPABASE_URL: https://placeholder.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY: placeholder-key
```

**Artifacts**:
- `.next/` directory (retained 7 days)
- Build logs

### Stage 3: E2E Tests (~2-4 minutes)

**Purpose**: Validate application functionality with Playwright

**Jobs**:
- Install Playwright browsers (Chromium only for CI)
- Start Next.js dev server
- Run E2E test suite
- Upload test reports on failure

**Failure Impact**: Blocks deployment, indicates regression

**Configuration**:
```yaml
test:
  runs-on: ubuntu-latest
  timeout-minutes: 15
  env:
    # Use dedicated test Supabase instance
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
```

**Artifacts** (on failure):
- Playwright HTML report (retained 14 days)
- Screenshots and videos
- Test traces

### Stage 4: Migration Validation (~30-60 seconds)

**Purpose**: Ensure database migrations are valid and conflict-free

**Jobs**:
- Start local Supabase instance
- Validate migration file syntax
- Check for schema conflicts (`supabase db diff`)
- Ensure migrations are idempotent

**Failure Impact**: Blocks deployment, requires migration fixes

**Configuration**:
```yaml
validate-migrations:
  runs-on: ubuntu-latest
  timeout-minutes: 5
  steps:
    - Install Supabase CLI
    - Start local Supabase (applies migrations)
    - Check for conflicts with db diff
```

### Stage 5: Deployment Gate

**Purpose**: Aggregate all job results for branch protection

**Requirements**:
- All CI jobs must pass (success status)
- No merge conflicts
- Up-to-date with base branch (for PRs)

**Configuration**:
```yaml
ci-success:
  needs: [lint, build, test, validate-migrations]
  if: always()
  steps:
    - Check all job results
    - Fail if any job failed
    - Post summary to GitHub PR
```

---

## Database Migration Strategy

### Migration Execution Model

FinanceFlow uses **automatic pre-deployment migrations** for production:

```
┌──────────────────────────────────────────────────────────────────┐
│                    MIGRATION EXECUTION FLOW                       │
└──────────────────────────────────────────────────────────────────┘

  Production Deployment Triggered
           │
           ▼
  ┌─────────────────────┐
  │  Pre-Deploy Step    │  ← Runs BEFORE Next.js build
  │  Run Migrations     │
  └─────────┬───────────┘
            │
            ├─ Apply migrations: supabase db push
            ├─ Verify RLS policies: Check advisors
            ├─ Run health check: SELECT 1
            │
            ▼
  ┌─────────────────────┐
  │  Migration Success  │
  └─────────┬───────────┘
            │
            ▼
  ┌─────────────────────┐
  │  Build & Deploy App │  ← Next.js build + deployment
  └─────────┬───────────┘
            │
            ▼
  ┌─────────────────────┐
  │  Health Check       │  ← POST /api/health
  └─────────┬───────────┘
            │
    Success ├─ Complete deployment
            │
    Failure ├─ Rollback app (keep DB changes)
            └─ Alert team for manual DB rollback if needed
```

### Migration Files Organization

```
supabase/
├── migrations/
│   ├── 20251210000001_initial_schema.sql
│   ├── 20251211000001_fix_profile_creation_trigger.sql
│   ├── 20251216000001_add_category_color_validation.sql
│   └── ... (chronologically ordered by timestamp)
└── seed.sql (optional, for local development)
```

**Migration Naming Convention**:
- Format: `YYYYMMDDHHMMSS_descriptive_name.sql`
- Timestamp ensures chronological order
- Descriptive name explains purpose

### Migration Best Practices

#### 1. Idempotency

All migrations MUST be idempotent (safe to run multiple times):

```sql
-- ✅ GOOD: Idempotent migration
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL
);

-- ✅ GOOD: Check before adding column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'color'
  ) THEN
    ALTER TABLE categories ADD COLUMN color text;
  END IF;
END $$;

-- ❌ BAD: Not idempotent (fails on second run)
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);
```

#### 2. Backward Compatibility

Migrations should be backward compatible when possible:

```sql
-- ✅ GOOD: Add nullable column (no data required)
ALTER TABLE transactions ADD COLUMN notes text;

-- ✅ GOOD: Add column with default value
ALTER TABLE transactions ADD COLUMN status text DEFAULT 'pending';

-- ⚠️ CAREFUL: Add non-nullable column (requires data migration)
-- Step 1: Add nullable column
ALTER TABLE transactions ADD COLUMN category_id uuid;
-- Step 2: Backfill data
UPDATE transactions SET category_id = '...' WHERE category_id IS NULL;
-- Step 3: Make non-nullable (in separate migration)
ALTER TABLE transactions ALTER COLUMN category_id SET NOT NULL;
```

#### 3. RLS Policy Verification

After every schema change, verify RLS policies:

```sql
-- Always include RLS policies in migrations
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own records"
  ON new_table FOR SELECT
  USING (auth.uid() = user_id);
```

**Automated Verification**:
```bash
# Run after applying migrations
npx supabase db advisors --security
```

### Migration Workflow

#### Local Development

```bash
# 1. Create new migration file
npx supabase migration new add_feature_name

# 2. Write migration SQL in generated file
# supabase/migrations/YYYYMMDDHHMMSS_add_feature_name.sql

# 3. Apply migration locally
npx supabase db reset

# 4. Verify migration works
npx supabase db diff --use-migra

# 5. Test application with new schema
npm run dev

# 6. Commit migration file
git add supabase/migrations/
git commit -m "feat: add feature_name schema"
```

#### CI Validation (Automatic)

```yaml
# GitHub Actions validates:
1. Migration syntax (SQL parsing)
2. Migration conflicts (supabase db diff)
3. Idempotency (run twice, check for errors)
4. RLS policy coverage (supabase advisors)
```

#### Production Deployment

```bash
# Vercel Build Command (configured in vercel.json or dashboard):
npx supabase db push && npm run build

# Detailed steps:
# 1. Apply all pending migrations to production DB
# 2. Verify RLS policies (automated check)
# 3. Run health check (SELECT 1)
# 4. Build Next.js application
# 5. Deploy to Vercel
```

### Preview Deployments & Branches

#### Strategy: Shared Test Instance

For PR preview deployments, use a **shared test Supabase instance**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PREVIEW DEPLOYMENT STRATEGY                   │
└─────────────────────────────────────────────────────────────────┘

Production Supabase Instance
  ├─ production.supabase.co
  └─ Migrations: Applied on main branch deploy

Test/Staging Supabase Instance (Shared)
  ├─ test.supabase.co
  ├─ Used by: All PR previews + E2E tests
  └─ Migrations: Applied manually or via dedicated test pipeline

Preview Deployments (Vercel)
  ├─ PR #123: pr-123.vercel.app → test.supabase.co
  ├─ PR #124: pr-124.vercel.app → test.supabase.co
  └─ Environment: NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
```

**Advantages**:
- Cost-effective (one test instance vs. per-PR instances)
- Fast preview deployment (no DB provisioning delay)
- Consistent test data for QA

**Disadvantages**:
- Shared state (one PR may affect another)
- Manual migration management for test instance

**Alternative: Supabase Branching** (when available):
```bash
# Create preview branch per PR
npx supabase branches create pr-${PR_NUMBER}

# Deploy preview with branch URL
NEXT_PUBLIC_SUPABASE_URL=https://pr-123.supabase.co
```

### Migration Rollback Strategy

#### Automatic Rollback (Application Only)

Vercel automatically rolls back the application if:
- Build fails
- Health check endpoint returns non-200 status
- Deployment timeout (10 minutes)

**IMPORTANT**: Automatic rollback does NOT revert database migrations!

#### Manual Migration Rollback

If a migration causes issues in production:

**Option 1: Forward Fix (Preferred)**

Create a new migration to fix the issue:

```bash
# 1. Create fix migration locally
npx supabase migration new fix_issue_name

# 2. Write rollback SQL
-- Example: Remove problematic column
ALTER TABLE transactions DROP COLUMN problematic_column;

# 3. Test locally
npx supabase db reset

# 4. Deploy fix
git add supabase/migrations/
git commit -m "fix: rollback problematic migration"
git push origin main
```

**Option 2: Manual Database Rollback**

If forward fix is not possible:

```bash
# 1. Connect to production database
psql $DATABASE_URL

# 2. Manually reverse changes (write reverse SQL)
-- Check current schema
\d transactions

-- Reverse migration changes
DROP TABLE IF EXISTS problematic_table;
ALTER TABLE transactions DROP COLUMN problematic_column;

# 3. Update migration history (if needed)
DELETE FROM supabase_migrations.schema_migrations
WHERE version = '20251220000001';

# 4. Verify application works
curl https://financeflow.vercel.app/api/health

# 5. Document incident in INCIDENTS.md
```

**Option 3: Restore from Backup**

For catastrophic failures:

```bash
# 1. Identify backup point (Supabase automatic backups)
# Dashboard: Project > Database > Backups

# 2. Restore database to point-in-time before migration
# (Requires Supabase support or manual backup restore)

# 3. Re-deploy previous application version
vercel rollback

# 4. Apply corrected migrations
```

#### Rollback Decision Matrix

| Scenario | Recommended Action | Downtime |
|----------|-------------------|----------|
| Non-breaking schema change (added column) | Forward fix migration | None |
| Breaking schema change (removed column) | Application rollback + Forward fix | <1 min |
| Data corruption | Restore from backup + Forward fix | 5-15 min |
| RLS policy issue | Hotfix RLS policy via SQL console | None |
| Performance regression | Revert migration + Optimize + Reapply | <1 min |

### Migration Health Checks

Backend Developer will implement these endpoints (specification only):

**Pre-Deployment Check**:
```bash
GET /api/migrations/status
Response:
{
  "pending": ["20251220000001_add_feature.sql"],
  "applied": ["20251210000001_initial_schema.sql", ...],
  "conflicts": []
}
```

**Post-Deployment Verification**:
```bash
GET /api/health
Response:
{
  "status": "healthy",
  "database": "connected",
  "migrations": "up-to-date",
  "version": "20251220000001"
}
```

---

## Environment Configuration

### Environment Variable Matrix

| Variable | Dev | Test (CI) | Preview | Production | Exposed to Browser |
|----------|-----|-----------|---------|------------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Local | Test Instance | Test Instance | Prod Instance | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Local | Test Key | Test Key | Prod Key | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Local | Test Key | Test Key | Prod Key | ❌ No (Server-only) |
| `NEXT_PUBLIC_APP_URL` | localhost:3000 | localhost:3000 | preview-url.vercel.app | financeflow.com | ✅ Yes |
| `DATABASE_URL` | Local | N/A | N/A | Prod DB | ❌ No (Migrations only) |

### GitHub Secrets Configuration

Required secrets in **Repository Settings > Secrets and Variables > Actions**:

```bash
# Test/Staging Supabase Instance (for CI/CD)
TEST_SUPABASE_URL=https://test-project.supabase.co
TEST_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
TEST_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Production Supabase Instance (for migrations)
SUPABASE_ACCESS_TOKEN=sbp_your-access-token-here
SUPABASE_PROJECT_REF=your-production-project-ref

# Optional: Vercel deployment tokens (if not using GitHub integration)
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
```

### Vercel Environment Variables

Configure in **Vercel Dashboard > Project > Settings > Environment Variables**:

#### Production Environment

```bash
# Database Configuration
NEXT_PUBLIC_SUPABASE_URL=https://production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (ENCRYPTED)

# Application Configuration
NEXT_PUBLIC_APP_URL=https://financeflow.com
```

#### Preview Environment

```bash
# Database Configuration (Use Test Instance)
NEXT_PUBLIC_SUPABASE_URL=https://test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (ENCRYPTED)

# Application Configuration
NEXT_PUBLIC_APP_URL=https://preview-branch.vercel.app (Auto-set by Vercel)
```

#### Development Environment

Use `.env.local` file (not committed to Git):

```bash
# Local Supabase Instance
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (from npx supabase start)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (from npx supabase start)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Secret Management Best Practices

1. **Never Commit Secrets**: All `.env*` files in `.gitignore`
2. **Rotate Keys Regularly**: Regenerate Supabase keys every 90 days
3. **Use Environment-Specific Keys**: Separate keys for dev/test/prod
4. **Encrypt Service Role Keys**: Mark as sensitive in Vercel
5. **Audit Access**: Review who has access to secrets quarterly
6. **Use Supabase Vault**: Store sensitive config in Supabase Vault (future enhancement)

---

## Deployment Workflows

### Production Deployment (Main Branch)

**Trigger**: Push to `main` branch (merged PR)

**Workflow**:
```
1. Developer merges PR to main
   ↓
2. GitHub Actions CI runs (all jobs pass)
   ↓
3. Vercel detects push to main
   ↓
4. Vercel runs build command:
   - npx supabase db push (apply migrations)
   - npm run build (build Next.js)
   ↓
5. Vercel deploys to production
   ↓
6. Health check runs automatically
   ↓
7. Deployment complete (or rollback on failure)
```

**Duration**: ~5-8 minutes total
- CI: 3-5 minutes
- Build + Deploy: 2-3 minutes

**Vercel Configuration** (`vercel.json`):
```json
{
  "buildCommand": "npx supabase db push && npm run build",
  "framework": "nextjs",
  "installCommand": "npm ci",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@production-supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@production-supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@production-supabase-service-key"
  }
}
```

### Preview Deployment (Pull Request)

**Trigger**: Pull request opened or updated

**Workflow**:
```
1. Developer opens PR
   ↓
2. GitHub Actions CI runs (all jobs pass)
   ↓
3. Vercel creates preview deployment
   ↓
4. Vercel runs build command:
   - npm run build (no migrations for preview)
   ↓
5. Vercel deploys to unique preview URL
   ↓
6. Vercel bot comments on PR with preview URL
   ↓
7. QA team tests preview environment
```

**Duration**: ~4-6 minutes total
- CI: 3-5 minutes
- Build + Deploy: 1-2 minutes (faster, no migrations)

**Preview Environment**:
- URL: `https://financeflow-pr-123.vercel.app`
- Database: Shared test Supabase instance
- Branch: Feature branch code
- Lifetime: Active until PR closed

### Hotfix Deployment

**Trigger**: Critical production bug requires immediate fix

**Workflow**:
```
1. Create hotfix branch from main
   git checkout -b hotfix/critical-bug main

2. Make minimal fix

3. Push and create PR
   git push origin hotfix/critical-bug

4. Request expedited review

5. Merge to main (triggers production deploy)

6. Monitor deployment closely

7. Backport fix to development branch if needed
```

**Duration**: ~10-15 minutes (including review)

---

## Rollback Procedures

### Automatic Rollback Triggers

Vercel automatically rolls back if:

1. **Build Failure**: Next.js build command exits with non-zero code
2. **Deployment Timeout**: Deployment exceeds 10 minutes
3. **Health Check Failure**: (Requires health check configuration)

**Automatic Rollback Process**:
```
1. Deployment starts
   ↓
2. Failure detected
   ↓
3. Vercel switches traffic back to previous deployment
   ↓
4. Team notified via Vercel webhooks/email
   ↓
5. Previous version remains active (zero downtime)
```

### Manual Rollback (Application)

**Via Vercel Dashboard**:
```
1. Open Vercel Dashboard
2. Navigate to Project > Deployments
3. Find last known good deployment
4. Click "..." menu > "Promote to Production"
5. Confirm promotion
6. Verify rollback: curl https://financeflow.com/api/health
```

**Via Vercel CLI**:
```bash
# 1. List recent deployments
vercel ls

# 2. Identify last good deployment URL
# Example: financeflow-abc123.vercel.app

# 3. Promote to production
vercel promote financeflow-abc123.vercel.app --yes

# 4. Verify
curl https://financeflow.com/api/health
```

**Duration**: <1 minute (instant traffic switch)

### Manual Rollback (Database)

See [Migration Rollback Strategy](#migration-rollback-strategy) section above.

**Quick Reference**:

| Issue Type | Rollback Method | Duration |
|------------|-----------------|----------|
| Bad deployment (app code) | Vercel promote previous | <1 min |
| Breaking migration | Forward fix migration | 5-10 min |
| Data corruption | Restore backup + Forward fix | 15-30 min |
| RLS policy bug | Hotfix via Supabase SQL console | <5 min |

### Rollback Verification Checklist

After any rollback:

- [ ] Verify application loads: `curl https://financeflow.com`
- [ ] Check health endpoint: `curl https://financeflow.com/api/health`
- [ ] Test authentication: Sign in via UI
- [ ] Test critical flows: Create transaction, view dashboard
- [ ] Check database connectivity: Run test query
- [ ] Monitor error rates: Check Vercel Analytics
- [ ] Verify RLS policies: Check Supabase advisors
- [ ] Document incident: Update INCIDENTS.md
- [ ] Notify team: Post to Slack/Discord

---

## Platform-Specific Setup

### Vercel Deployment (Recommended)

**Prerequisites**:
- Vercel account linked to GitHub
- Production Supabase project created
- Environment variables prepared

**Step-by-Step Setup**:

#### 1. Connect Repository

```bash
# Via Vercel Dashboard
1. Visit https://vercel.com/new
2. Click "Import Git Repository"
3. Select FinanceFlow repository
4. Click "Import"
```

#### 2. Configure Project Settings

**Framework Preset**: Next.js

**Build & Development Settings**:
```bash
# Build Command
npx supabase db push && npm run build

# Output Directory
.next

# Install Command
npm ci

# Development Command
npm run dev
```

**Root Directory**: `./` (leave blank)

#### 3. Configure Environment Variables

**Production**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (mark as Sensitive)
NEXT_PUBLIC_APP_URL=https://financeflow.vercel.app (or custom domain)
SUPABASE_ACCESS_TOKEN=sbp_your-token (mark as Sensitive)
```

**Preview**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (mark as Sensitive)
# NEXT_PUBLIC_APP_URL auto-set by Vercel
```

#### 4. Configure Deployment Settings

**Git Integration**:
- Production Branch: `main`
- Deploy on Push: Enabled
- Auto-deploy on PR: Enabled

**Build Configuration**:
- Node.js Version: 20.x (latest LTS)
- Output Caching: Enabled

**Advanced Settings**:
- Environment Variable Inheritance: Enabled (preview inherits from production unless overridden)
- Ignored Build Step: Leave empty (deploy every push)

#### 5. Set Up Custom Domain (Optional)

```bash
1. Vercel Dashboard > Project > Settings > Domains
2. Add domain: financeflow.com
3. Configure DNS (Vercel provides instructions)
4. Wait for SSL certificate provisioning (~5 minutes)
5. Update NEXT_PUBLIC_APP_URL to use custom domain
```

#### 6. Configure Supabase CLI for Migrations

```bash
# Local machine (one-time setup)
npx supabase login

# Link project
npx supabase link --project-ref your-production-project-ref

# Test migration push
npx supabase db push --dry-run

# Verify connection
npx supabase projects list
```

#### 7. Enable Deployment Protection (Recommended)

**Branch Protection Rules** (GitHub):
```bash
1. Settings > Branches > Add rule
2. Branch name pattern: main
3. Enable:
   - Require pull request reviews (1 approver)
   - Require status checks (ci-success job)
   - Require branches to be up to date
   - Require linear history
```

**Vercel Deployment Protection**:
```bash
1. Vercel Dashboard > Project > Settings > Deployment Protection
2. Enable: Vercel Authentication (for preview deployments)
3. Enable: Protected Deployment (password for previews)
```

### Alternative: Railway Deployment

**Setup**:
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Create project
railway init

# 4. Link repository
railway link

# 5. Set environment variables
railway variables set NEXT_PUBLIC_SUPABASE_URL=...
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# 6. Deploy
railway up
```

**Build Command**: Same as Vercel
**Note**: Railway requires manual migration setup via Nixpacks or Dockerfile

### Alternative: Render Deployment

**Setup**:
```yaml
# render.yaml
services:
  - type: web
    name: financeflow
    env: node
    buildCommand: npx supabase db push && npm run build
    startCommand: npm start
    envVars:
      - key: NEXT_PUBLIC_SUPABASE_URL
        value: https://your-project.supabase.co
      - key: NEXT_PUBLIC_SUPABASE_ANON_KEY
        sync: false # Set in Render dashboard
```

---

## Troubleshooting

### Common Issues

#### 1. CI Pipeline Failures

**Issue**: Lint job fails with formatting errors

**Solution**:
```bash
# Fix locally
npm run format

# Verify
npm run lint

# Commit
git add .
git commit -m "fix: format code"
git push
```

---

**Issue**: Build job fails with TypeScript errors

**Solution**:
```bash
# Check errors locally
npx tsc --noEmit

# Fix type errors in code

# Verify build
npm run build

# Commit fixes
```

---

**Issue**: E2E tests fail intermittently

**Solution**:
```bash
# Check if test Supabase instance is running
curl https://test-project.supabase.co/rest/v1/

# Increase test timeout (playwright.config.ts)
timeout: 30 * 1000, // 30 seconds

# Add retry logic for flaky tests
test.describe.configure({ retries: 2 });
```

---

**Issue**: Migration validation fails with conflicts

**Solution**:
```bash
# Pull latest migrations
git pull origin main

# Check local Supabase state
npx supabase db diff --use-migra

# Reset local DB if needed
npx supabase db reset

# Rebase feature branch
git rebase main
```

---

#### 2. Deployment Failures

**Issue**: Vercel build fails with "Command failed"

**Solution**:
```bash
# Check Vercel build logs for specific error

# Common causes:
1. Missing environment variables → Add in Vercel dashboard
2. Migration failure → Check Supabase connection
3. Build timeout → Optimize build or increase timeout
4. Out of memory → Upgrade Vercel plan or optimize build

# Test build locally
npm run build
```

---

**Issue**: Migration fails during Vercel build

**Solution**:
```bash
# Check if Supabase is accessible from Vercel
curl https://your-project.supabase.co

# Verify SUPABASE_ACCESS_TOKEN is set in Vercel

# Check migration syntax locally
npx supabase db push --dry-run

# Manual migration (emergency)
npx supabase db push
```

---

**Issue**: Preview deployment uses production database

**Solution**:
```bash
# Verify preview environment variables in Vercel
Vercel Dashboard > Settings > Environment Variables
→ Ensure Preview uses TEST_SUPABASE_URL

# Check deployment logs for environment variable values
# (first few characters should differ from production)
```

---

#### 3. Post-Deployment Issues

**Issue**: Application shows 500 errors after deployment

**Solution**:
```bash
# 1. Check Vercel logs
Vercel Dashboard > Deployments > [Latest] > Logs

# 2. Verify environment variables are set
# 3. Test health endpoint
curl https://financeflow.vercel.app/api/health

# 4. Rollback if critical
vercel promote [previous-deployment-url]

# 5. Debug locally with production DB (careful!)
DATABASE_URL=[production] npm run dev
```

---

**Issue**: Database migration succeeded but app doesn't work

**Possible Causes**:
1. Application code doesn't match schema (stale types)
2. RLS policies blocking queries
3. Missing indexes causing timeouts

**Solution**:
```bash
# 1. Regenerate TypeScript types
npx supabase gen types typescript --project-ref [prod-ref] > src/types/database.types.ts
git add src/types/database.types.ts
git commit -m "fix: update database types"
git push

# 2. Check RLS policies
npx supabase db advisors --security

# 3. Check query performance
npx supabase db advisors --performance

# 4. Review Supabase logs
Supabase Dashboard > Logs > API
```

---

**Issue**: Rollback needed but previous deployment not found

**Solution**:
```bash
# List all deployments
vercel ls --all

# If previous deployment was deleted, redeploy from Git
git revert HEAD~1  # Revert last commit
git push origin main  # Trigger new deployment
```

---

### Debug Commands

```bash
# Check CI job status
gh run list --workflow=ci.yml

# View specific job logs
gh run view [run-id] --log

# Test Supabase connection
npx supabase projects list

# Check migration status
npx supabase db remote commit

# Validate local setup matches remote
npx supabase db diff --use-migra

# Check Vercel deployment status
vercel inspect [deployment-url]

# View real-time Vercel logs
vercel logs [deployment-url] --follow

# Test production health
curl https://financeflow.vercel.app/api/health -v
```

---

### Contact & Escalation

**Deployment Issues**:
- Check Vercel Status: https://vercel-status.com
- Vercel Support: support@vercel.com

**Database Issues**:
- Check Supabase Status: https://status.supabase.com
- Supabase Support: support@supabase.io

**GitHub Actions Issues**:
- Check GitHub Status: https://githubstatus.com

**Internal Team Escalation**:
1. Slack/Discord: #engineering-alerts
2. On-call Engineer: (Defined in PagerDuty/OpsGenie)
3. Team Lead: (Escalation path)

---

## Summary

**Pipeline Characteristics**:
- **Speed**: 3-5 minutes CI, 2-3 minutes deployment (~8 minutes total)
- **Reliability**: Parallel jobs, automatic rollback, health checks
- **Safety**: Multiple quality gates, migration validation, RLS checks
- **Zero-Downtime**: Blue-green deployment via Vercel

**Key Files**:
- `.github/workflows/ci.yml` - CI pipeline definition
- `.env.example` - Environment variable template
- `vercel.json` - Deployment configuration
- `supabase/migrations/*.sql` - Database migrations

**Required Secrets**:
- GitHub: Test Supabase credentials, Supabase access token
- Vercel: Production Supabase credentials, service role key

**Recommended Monitoring**:
- Vercel Analytics: Track deployment success rate
- Supabase Dashboard: Monitor database performance
- GitHub Actions: Track CI job duration trends

---

**Document Version**: 1.0.0
**Last Updated**: 2025-12-20
**Maintained By**: System Architect (Agent 02)
