# CI/CD Quick Reference Card

Quick reference for developers working with the FinanceFlow CI/CD pipeline.

## Pipeline Overview

```
Push to main → CI (3-5min) → Vercel Deploy (2-3min) → Production ✅
Pull Request → CI (3-5min) → Preview Deploy → Ready for QA ✅
```

---

## Common Commands

### Local Development

```bash
# Apply migrations locally
npx supabase db reset

# Create new migration
npx supabase migration new add_feature_name

# Check for migration conflicts
npx supabase db diff --use-migra

# Run tests locally
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

### Deployment

```bash
# View recent deployments
vercel ls

# View deployment logs
vercel logs production --follow

# Rollback to previous version
vercel promote [deployment-url] --yes

# Check production health
curl https://financeflow.vercel.app/api/health
```

### Debugging CI

```bash
# View CI runs
gh run list --workflow=ci.yml

# View specific run logs
gh run view [run-id] --log

# Re-run failed jobs
gh run rerun [run-id]
```

---

## CI Jobs (4 parallel jobs, ~3-5 min total)

| Job | Duration | Purpose | Failure Action |
|-----|----------|---------|----------------|
| Lint & Type Check | ~30-60s | Code quality | Fix locally with `npm run format` |
| Build | ~1-2min | Build validation | Check TypeScript errors |
| E2E Tests | ~2-4min | Functional validation | Check test logs in CI |
| Migration Validation | ~30-60s | DB safety | Fix migration syntax |

---

## Environment Variables

### Required Secrets (GitHub Actions)

```bash
TEST_SUPABASE_URL                 # Test instance for CI
TEST_SUPABASE_ANON_KEY            # Test anon key
TEST_SUPABASE_SERVICE_ROLE_KEY    # Test service key
SUPABASE_ACCESS_TOKEN             # CLI token for migrations
SUPABASE_PROJECT_REF              # Production project ref
```

**Setup**: Repository Settings > Secrets and Variables > Actions

### Required Variables (Vercel)

**Production**:
```bash
NEXT_PUBLIC_SUPABASE_URL          # Production Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Production anon key
SUPABASE_SERVICE_ROLE_KEY         # Production service key (encrypted)
```

**Preview**:
```bash
NEXT_PUBLIC_SUPABASE_URL          # Test Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Test anon key
SUPABASE_SERVICE_ROLE_KEY         # Test service key (encrypted)
```

**Setup**: Vercel Dashboard > Project > Settings > Environment Variables

---

## Migration Checklist

Before committing migrations:

- [ ] Named correctly: `YYYYMMDDHHMMSS_descriptive_name.sql`
- [ ] Idempotent (uses `IF NOT EXISTS`, `IF EXISTS`, etc.)
- [ ] RLS policies included for new tables
- [ ] Tested locally with `npx supabase db reset`
- [ ] Run twice to verify idempotency
- [ ] Check conflicts: `npx supabase db diff --use-migra`
- [ ] Check RLS: `npx supabase db advisors --security`
- [ ] App tests pass with new schema

---

## Deployment Workflows

### Production Deployment

```
1. Merge PR to main
2. CI runs automatically (3-5 min)
3. All jobs pass ✅
4. Vercel deploys to production (2-3 min)
   - Runs migrations: npx supabase db push
   - Builds app: npm run build
   - Deploys with zero downtime
5. Health check runs
6. ✅ Deployment complete
```

### Preview Deployment

```
1. Open Pull Request
2. CI runs automatically (3-5 min)
3. All jobs pass ✅
4. Vercel creates preview (1-2 min)
   - No migrations (uses test DB)
   - Builds app: npm run build
   - Deploys to unique URL
5. Vercel bot comments preview URL on PR
6. ✅ Preview ready for QA
```

---

## Rollback Procedures

### Application Rollback (<1 minute)

**Automatic**: Vercel rolls back on failure

**Manual via Dashboard**:
1. Vercel Dashboard > Project > Deployments
2. Find last good deployment
3. Click "..." > "Promote to Production"

**Manual via CLI**:
```bash
vercel ls                          # List deployments
vercel promote [deployment-url] --yes
```

### Database Rollback (5-10 minutes)

**Forward Fix (Preferred)**:
```bash
npx supabase migration new fix_issue
# Write reverse SQL in generated file
git add supabase/migrations/
git commit -m "fix: rollback problematic migration"
git push origin main
```

**Manual Rollback (Emergency)**:
```sql
-- Connect to production
psql $DATABASE_URL

-- Run reverse SQL
ALTER TABLE transactions DROP COLUMN problematic_column;

-- Update migration history
DELETE FROM supabase_migrations.schema_migrations
WHERE version = '20251220000001';
```

---

## Common Issues & Solutions

### CI Failure: Lint Errors

```bash
# Fix locally
npm run format
npm run lint
git add .
git commit -m "fix: format code"
git push
```

### CI Failure: TypeScript Errors

```bash
# Check errors
npx tsc --noEmit

# Fix errors in code
# Then commit and push
```

### CI Failure: E2E Tests

```bash
# Run tests locally
npm run test

# Debug specific test
npm run test:debug

# If test Supabase is down, notify team
```

### Deployment Failure: Build Error

```bash
# Check Vercel logs
vercel logs [deployment-url]

# Common causes:
# - Missing env vars → Add in Vercel dashboard
# - Migration failure → Check Supabase connection
# - Build timeout → Contact DevOps
```

### Production Issue After Deploy

```bash
# Check health
curl https://financeflow.vercel.app/api/health

# Check logs
vercel logs production --follow

# Rollback if critical
vercel promote [previous-deployment-url] --yes

# Notify team
```

---

## Monitoring & Health Checks

### Health Check Endpoint

```bash
# Check production health
curl https://financeflow.vercel.app/api/health

# Expected response (200 OK)
{
  "status": "healthy",
  "database": { "status": "connected", "latency_ms": 15 },
  "migrations": { "status": "up-to-date" }
}

# Unhealthy response (503)
{
  "status": "unhealthy",
  "database": { "status": "error", "error": "Connection refused" }
}
```

### Dashboard URLs

- **GitHub Actions**: https://github.com/[org]/[repo]/actions
- **Vercel Dashboard**: https://vercel.com/[org]/financeflow
- **Supabase Dashboard**: https://app.supabase.com/project/[ref]

---

## Branch Protection Rules

Required for `main` branch:

- Require pull request reviews (1 approver)
- Require status checks to pass: `CI Pipeline Success`
- Require branches to be up to date
- Require linear history

**Setup**: Repository Settings > Branches > Add rule

---

## File Locations

```
.github/workflows/ci.yml          # CI pipeline definition
.env.example                       # Environment variable template
DEPLOYMENT.md                      # Comprehensive deployment guide
MIGRATION_AUTOMATION.md            # Migration execution details
vercel.json                        # Vercel configuration
CI_CD_ARCHITECTURE_SUMMARY.md     # Architecture overview
CI_CD_QUICK_REFERENCE.md          # This file
```

---

## Migration Patterns

### Add Table

```sql
CREATE TABLE IF NOT EXISTS table_name (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own records"
  ON table_name FOR SELECT
  USING (auth.uid() = user_id);
```

### Add Column

```sql
-- Nullable column (safe)
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name text;

-- Non-nullable (requires backfill)
-- Migration 1: Add nullable
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS status text;
-- Migration 2: Backfill + make required
UPDATE table_name SET status = 'default' WHERE status IS NULL;
ALTER TABLE table_name ALTER COLUMN status SET NOT NULL;
```

### Add Index

```sql
CREATE INDEX IF NOT EXISTS idx_table_column
  ON table_name(user_id, created_at DESC);
```

---

## Contact & Escalation

**Questions About**:
- Architecture → System Architect (Agent 02)
- Backend/APIs → Backend Developer (Agent 03)
- Deployment → Frontend Developer (Agent 04)
- Testing → QA Engineer (Agent 05)
- Planning → Product Manager (Agent 01)

**Service Status**:
- Vercel: https://vercel-status.com
- Supabase: https://status.supabase.com
- GitHub: https://githubstatus.com

**Emergency**: #engineering-alerts (Slack/Discord)

---

## Key Metrics

| Metric | Target | Current |
|--------|--------|---------|
| CI Duration | <5 min | 3-5 min ✅ |
| Deployment Duration | <3 min | 2-3 min ✅ |
| Total Pipeline | <10 min | 5-8 min ✅ |
| Deployment Frequency | Daily | TBD |
| MTTR (Mean Time to Recovery) | <15 min | TBD |
| Change Failure Rate | <15% | TBD |

---

**Version**: 1.0.0
**Last Updated**: 2025-12-20
**For**: Development Team
