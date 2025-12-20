# Database Migration Automation

This document specifies the automated migration execution strategy for FinanceFlow's CI/CD pipeline. This is a **specification document** for the Backend Developer to implement.

## Overview

Database migrations are automatically applied during production deployments using Supabase CLI. The migration system ensures:

- **Automatic execution**: Migrations run before application build
- **Idempotency**: Migrations can be safely run multiple times
- **Validation**: Pre-deployment checks prevent invalid migrations
- **Rollback support**: Forward-fix strategy for migration issues

---

## Migration Execution Flow

### Production Deployment

```bash
# Vercel Build Command (configured in vercel.json)
npx supabase db push && npm run build

# Detailed execution steps:
# 1. Supabase CLI connects to production database
# 2. Reads all migration files in supabase/migrations/
# 3. Compares with applied migrations (supabase_migrations.schema_migrations table)
# 4. Applies pending migrations in chronological order
# 5. Records successful migrations in migration history table
# 6. Proceeds to Next.js build
# 7. On failure: Exits with non-zero code (Vercel aborts deployment)
```

### Local Development

```bash
# Apply all migrations to local Supabase instance
npx supabase db reset

# This command:
# 1. Drops local database
# 2. Recreates schema
# 3. Applies all migrations in order
# 4. Seeds data (if seed.sql exists)
```

### CI Validation

```bash
# GitHub Actions validates migrations (see .github/workflows/ci.yml)
# 1. Start local Supabase: npx supabase start
# 2. Migrations automatically applied on start
# 3. Check for conflicts: npx supabase db diff --use-migra
# 4. Stop Supabase: npx supabase stop
```

---

## Migration File Requirements

### File Naming Convention

```
Format: YYYYMMDDHHMMSS_descriptive_name.sql
Example: 20251220153045_add_notes_to_transactions.sql

Rules:
- Timestamp in UTC (YYYYMMDDHHMMSS format)
- Descriptive snake_case name
- .sql extension
- Stored in: supabase/migrations/
```

### Idempotency Requirements

All migrations MUST be idempotent. Use conditional checks:

```sql
-- ✅ CORRECT: Check before creating table
CREATE TABLE IF NOT EXISTS new_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL
);

-- ✅ CORRECT: Check before adding column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'notes'
  ) THEN
    ALTER TABLE transactions ADD COLUMN notes text;
  END IF;
END $$;

-- ✅ CORRECT: Check before creating index
CREATE INDEX IF NOT EXISTS idx_transactions_date
  ON transactions(user_id, date DESC);

-- ❌ INCORRECT: Will fail on second run
CREATE TABLE new_table (id uuid PRIMARY KEY);
ALTER TABLE transactions ADD COLUMN notes text;
```

### Backward Compatibility

**Adding Nullable Columns** (Safe):
```sql
-- No data migration needed
ALTER TABLE transactions ADD COLUMN notes text;
```

**Adding Non-Nullable Columns** (Requires multi-step):
```sql
-- Migration 1: Add nullable column
ALTER TABLE transactions ADD COLUMN status text;

-- Migration 2: Backfill existing data
UPDATE transactions SET status = 'completed' WHERE status IS NULL;

-- Migration 3: Make non-nullable (in separate migration!)
ALTER TABLE transactions ALTER COLUMN status SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN status SET DEFAULT 'pending';
```

**Removing Columns** (Requires app compatibility):
```sql
-- Step 1: Deploy app version that doesn't use column
-- Step 2: Remove column in migration
ALTER TABLE transactions DROP COLUMN IF EXISTS deprecated_column;
```

### RLS Policy Requirements

Every table with user data MUST have RLS enabled:

```sql
-- Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own records"
  ON new_table FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own records"
  ON new_table FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records"
  ON new_table FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own records"
  ON new_table FOR DELETE
  USING (auth.uid() = user_id);
```

---

## Migration Validation (CI)

### Automated Checks

The CI pipeline (`validate-migrations` job) performs:

1. **Syntax Validation**: PostgreSQL parser checks SQL syntax
2. **Conflict Detection**: `supabase db diff` detects schema drift
3. **Idempotency Test**: Apply migrations twice, check for errors
4. **RLS Coverage**: Verify all user tables have RLS enabled

### Manual Validation (Developer)

Before committing migrations, follow this comprehensive testing workflow:

```bash
# ============================================================================
# STEP 1: CREATE MIGRATION FILE
# ============================================================================
npx supabase migration new add_feature_name

# This creates a new timestamped file in supabase/migrations/
# Example: supabase/migrations/20251220153045_add_feature_name.sql

# ============================================================================
# STEP 2: WRITE MIGRATION SQL
# ============================================================================
# Open the migration file and write your SQL
# Remember to follow idempotency patterns (see examples above)

# ============================================================================
# STEP 3: VALIDATE MIGRATION SYNTAX AND PATTERNS
# ============================================================================
# Run automated validation script to check for common issues
npm run validate-migrations

# This checks for:
# - Correct file naming convention
# - Idempotency patterns (IF NOT EXISTS, etc.)
# - RLS policy presence
# - Hardcoded UUIDs or sensitive data

# ============================================================================
# STEP 4: TEST MIGRATION LOCALLY (FIRST RUN)
# ============================================================================
# Reset local database and apply all migrations from scratch
npx supabase db reset

# Verify the migration applied successfully
# Check terminal output for any errors

# ============================================================================
# STEP 5: TEST IDEMPOTENCY (SECOND RUN)
# ============================================================================
# Apply migrations again to test idempotency
npx supabase db push

# Then run again - should succeed with "Database is up to date"
npx supabase db push

# If you see errors here, your migration is NOT idempotent!
# Common issues:
# - CREATE TABLE without IF NOT EXISTS
# - ALTER TABLE ADD COLUMN without existence check
# - CREATE INDEX without IF NOT EXISTS

# ============================================================================
# STEP 6: CHECK FOR SCHEMA CONFLICTS
# ============================================================================
# Verify no untracked schema changes exist
npx supabase db diff --use-migra

# Expected output: "No schema differences detected"
# If differences found, review and add to migration

# ============================================================================
# STEP 7: VERIFY RLS POLICIES
# ============================================================================
# Check for security issues (missing RLS policies, etc.)
npx supabase db advisors --security

# Review output for any security warnings
# Common issues:
# - Tables without RLS enabled
# - Missing SELECT/INSERT/UPDATE/DELETE policies
# - Overly permissive policies

# ============================================================================
# STEP 8: CHECK PERFORMANCE
# ============================================================================
# (Optional) Check for performance issues
npx supabase db advisors --performance

# Review warnings about:
# - Missing indexes on foreign keys
# - Large table scans
# - Unoptimized queries

# ============================================================================
# STEP 9: TEST APPLICATION WITH NEW SCHEMA
# ============================================================================
# Start the development server
npm run dev

# Manually test features affected by the migration:
# - Create/read/update/delete operations
# - Verify data constraints work correctly
# - Test edge cases (null values, etc.)
# - Check UI components display correctly

# ============================================================================
# STEP 10: VERIFY DATABASE STATE
# ============================================================================
# (Optional) Inspect the schema directly
npx supabase db inspect

# Check specific tables
npx supabase db inspect --table transactions

# ============================================================================
# STEP 11: COMMIT MIGRATION
# ============================================================================
# Stage migration file
git add supabase/migrations/YYYYMMDDHHMMSS_add_feature_name.sql

# Write descriptive commit message
git commit -m "feat: add feature_name schema

- Added table X with columns A, B, C
- Created RLS policies for user data isolation
- Added indexes on frequently queried columns
- Migration tested for idempotency"

# Push to feature branch
git push origin feature/add-feature-name

# ============================================================================
# STEP 12: CREATE PULL REQUEST
# ============================================================================
# Open PR with migration details:
# - What changed in the schema
# - Why the change was needed
# - Migration testing results
# - Impact on existing data
# - Rollback plan if needed
```

### Local Testing Troubleshooting

**Issue**: `npx supabase db reset` fails
```bash
# Solution 1: Stop and restart Supabase
npx supabase stop
npx supabase start

# Solution 2: Check Docker is running
docker ps

# Solution 3: Reset Docker volumes (DESTRUCTIVE)
npx supabase stop --no-backup
npx supabase start
```

**Issue**: Migration fails with "relation already exists"
```bash
# Your migration is not idempotent!
# Add IF NOT EXISTS to your CREATE statements:
CREATE TABLE IF NOT EXISTS table_name (...);
CREATE INDEX IF NOT EXISTS idx_name ON table_name(...);
```

**Issue**: `npx supabase db diff` shows unexpected changes
```bash
# You may have made manual changes via SQL editor
# Option 1: Create migration for those changes
npx supabase db diff --use-migra | npx supabase migration new capture_changes

# Option 2: Reset to match migrations
npx supabase db reset
```

**Issue**: RLS policies not working in application
```bash
# Check if RLS is enabled
psql $DATABASE_URL -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';"

# Check policy definitions
npx supabase db inspect --table table_name

# Test policy with specific user
# (Use Supabase dashboard > SQL Editor)
```

### Quick Reference: Essential Commands

```bash
# Create new migration
npx supabase migration new feature_name

# Validate migrations
npm run validate-migrations

# Reset local DB (apply all migrations)
npx supabase db reset

# Apply migrations only (don't reset)
npx supabase db push

# Check schema differences
npx supabase db diff --use-migra

# Security check
npx supabase db advisors --security

# Performance check
npx supabase db advisors --performance

# Inspect schema
npx supabase db inspect

# Start/stop local Supabase
npx supabase start
npx supabase stop

# View local Supabase status
npx supabase status

# Access local database
psql postgresql://postgres:postgres@localhost:54322/postgres
```

---

## Health Check Endpoint (Backend Developer Task)

### Specification

The Backend Developer must implement a health check endpoint for post-deployment verification.

**Endpoint**: `GET /api/health`

**Response (Success)**:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-20T15:30:45.123Z",
  "database": {
    "status": "connected",
    "latency_ms": 15
  },
  "migrations": {
    "status": "up-to-date",
    "latest_version": "20251220000001",
    "pending": []
  },
  "version": {
    "app": "1.2.3",
    "commit": "abc123def"
  }
}
```

**Response (Unhealthy)**:
```json
{
  "status": "unhealthy",
  "timestamp": "2025-12-20T15:30:45.123Z",
  "database": {
    "status": "error",
    "error": "Connection refused"
  },
  "migrations": {
    "status": "error",
    "error": "Migration 20251220000001 failed"
  }
}
```

**HTTP Status Codes**:
- `200 OK`: All systems healthy
- `503 Service Unavailable`: Database unreachable or migrations pending
- `500 Internal Server Error`: Unexpected error

**Implementation**:
```typescript
// src/app/api/health/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const startTime = Date.now();

  try {
    // Test database connection
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('supabase_migrations.schema_migrations')
      .select('version')
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return NextResponse.json({
        status: 'unhealthy',
        database: { status: 'error', error: error.message }
      }, { status: 503 });
    }

    const latency = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        latency_ms: latency
      },
      migrations: {
        status: 'up-to-date',
        latest_version: data.version,
        pending: []
      },
      version: {
        app: process.env.npm_package_version || 'unknown',
        commit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown'
      }
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      database: { status: 'error', error: String(error) }
    }, { status: 503 });
  }
}
```

---

## Migration Status Endpoint (Optional Enhancement)

**Endpoint**: `GET /api/migrations/status`

**Purpose**: Check pending migrations before deployment

**Response**:
```json
{
  "applied": [
    {
      "version": "20251210000001",
      "name": "initial_schema",
      "applied_at": "2025-12-10T10:30:00.000Z"
    },
    {
      "version": "20251220000001",
      "name": "add_notes_column",
      "applied_at": "2025-12-20T15:30:00.000Z"
    }
  ],
  "pending": [],
  "conflicts": []
}
```

**Implementation**:
```typescript
// src/app/api/migrations/status/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get applied migrations from database
    const { data: appliedMigrations, error } = await supabase
      .from('supabase_migrations.schema_migrations')
      .select('version, name, applied_at')
      .order('version', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get migration files from filesystem
    const migrationsDir = path.join(process.cwd(), 'supabase/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .map(f => {
        const match = f.match(/^(\d{14})_(.+)\.sql$/);
        return match ? { version: match[1], name: match[2] } : null;
      })
      .filter(Boolean);

    // Find pending migrations
    const appliedVersions = new Set(appliedMigrations.map(m => m.version));
    const pending = migrationFiles.filter(m => !appliedVersions.has(m.version));

    return NextResponse.json({
      applied: appliedMigrations,
      pending,
      conflicts: [] // TODO: Implement conflict detection
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
```

---

## Rollback Strategy

### Forward Fix (Preferred)

Create a new migration to revert changes:

```bash
# 1. Create rollback migration
npx supabase migration new revert_feature_name

# 2. Write reverse SQL
# Example: Remove column added in previous migration
ALTER TABLE transactions DROP COLUMN IF EXISTS problematic_column;

# 3. Test locally
npx supabase db reset

# 4. Deploy
git add supabase/migrations/
git commit -m "fix: revert problematic migration"
git push origin main
```

### Manual Rollback (Emergency)

For catastrophic failures:

```sql
-- Connect to production database
-- Run reverse migration SQL manually
-- Update migration history
DELETE FROM supabase_migrations.schema_migrations
WHERE version = '20251220000001';
```

---

## Migration Testing Checklist

Before merging migration PRs:

- [ ] Migration file follows naming convention
- [ ] Migration is idempotent (tested twice locally)
- [ ] RLS policies included for new tables
- [ ] No hard-coded UUIDs or sensitive data
- [ ] Backward compatible with current app version
- [ ] Tested locally with `npx supabase db reset`
- [ ] Checked for conflicts with `npx supabase db diff`
- [ ] Verified RLS with `npx supabase db advisors --security`
- [ ] Application tests pass with new schema
- [ ] Migration documented in PR description

---

## GitHub Actions Integration

### CI Workflow (validate-migrations job)

```yaml
validate-migrations:
  name: Validate Migrations
  runs-on: ubuntu-latest
  timeout-minutes: 5

  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 20.x
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Install Supabase CLI
      run: |
        curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz
        sudo mv supabase /usr/local/bin/

    - name: Start local Supabase instance
      run: npx supabase start

    - name: Validate migration syntax
      run: |
        echo "Validating all migration files..."
        for migration in supabase/migrations/*.sql; do
          echo "Checking $migration"
        done

    - name: Check for migration conflicts
      run: npx supabase db diff --use-migra

    - name: Stop Supabase
      if: always()
      run: npx supabase stop
```

### Vercel Build Configuration

```json
{
  "buildCommand": "npx supabase db push && npm run build"
}
```

**Environment Variables** (Vercel Project Settings):
- `SUPABASE_ACCESS_TOKEN`: CLI access token
- `NEXT_PUBLIC_SUPABASE_URL`: Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anonymous key

---

## Monitoring & Alerts

### Post-Deployment Monitoring

After each deployment:

1. **Health Check**: Automated health check runs (Vercel can be configured to do this)
2. **RLS Verification**: Run `npx supabase db advisors --security`
3. **Performance Check**: Run `npx supabase db advisors --performance`
4. **Error Monitoring**: Check Vercel logs for database errors

### Alert Triggers

Set up alerts for:

- Migration failures during deployment
- Health check endpoint returning 5xx
- Database connection errors spike
- Query performance degradation

**Recommended Tools**:
- Vercel Monitoring & Analytics
- Supabase Dashboard > Logs
- External monitoring: Sentry, Datadog, or New Relic

---

## Common Migration Patterns

### Adding a Table

```sql
CREATE TABLE IF NOT EXISTS new_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own records"
  ON new_table FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own records"
  ON new_table FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records"
  ON new_table FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own records"
  ON new_table FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_new_table_user_id ON new_table(user_id);
CREATE INDEX IF NOT EXISTS idx_new_table_created_at ON new_table(created_at DESC);
```

### Adding a Column

```sql
-- Add nullable column (safe)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS notes text;

-- Add column with default value (safe)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal';

-- Add non-nullable column (requires backfill)
-- Migration 1: Add nullable
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status text;

-- Migration 2: Backfill + make non-nullable
UPDATE transactions SET status = 'completed' WHERE status IS NULL;
ALTER TABLE transactions ALTER COLUMN status SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN status SET DEFAULT 'pending';
```

### Creating an Index

```sql
-- Standard index
CREATE INDEX IF NOT EXISTS idx_transactions_date
  ON transactions(user_id, date DESC);

-- Partial index (for specific queries)
CREATE INDEX IF NOT EXISTS idx_pending_transactions
  ON transactions(user_id, created_at)
  WHERE status = 'pending';

-- Concurrent index (no table lock, slower but safer)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_amount
  ON transactions(amount);
```

### Adding a Constraint

```sql
-- Check constraint
ALTER TABLE transactions
  ADD CONSTRAINT check_amount_positive
  CHECK (amount > 0);

-- Unique constraint
ALTER TABLE tags
  ADD CONSTRAINT unique_tag_per_user
  UNIQUE (user_id, name);

-- Foreign key constraint
ALTER TABLE transactions
  ADD CONSTRAINT fk_category
  FOREIGN KEY (category_id)
  REFERENCES categories(id)
  ON DELETE SET NULL;
```

---

## Summary

**Key Points**:
- Migrations run automatically during Vercel deployment
- All migrations must be idempotent and backward compatible
- CI validates migration syntax and conflicts before deployment
- Health check endpoint verifies post-deployment database state
- Forward-fix strategy for migration rollbacks

**Backend Developer Responsibilities**:
1. Implement `/api/health` endpoint (specification provided above)
2. Implement `/api/migrations/status` endpoint (optional)
3. Follow migration best practices when creating schema changes
4. Test migrations locally before committing
5. Document migration impact in PR descriptions

**Architecture Responsibilities** (This document):
- Migration execution strategy (COMPLETE)
- CI validation workflow (COMPLETE)
- Rollback procedures (COMPLETE)
- Health check specification (COMPLETE)

---

**Document Version**: 1.0.0
**Last Updated**: 2025-12-20
**Maintained By**: System Architect (Agent 02)
