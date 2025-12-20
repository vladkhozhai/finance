# Environment Variable Setup Guide

Comprehensive guide for configuring environment variables across all deployment environments for FinanceFlow.

## Overview

FinanceFlow requires different environment variables for different contexts:
- **Local Development** - `.env.local` file
- **CI/CD (GitHub Actions)** - Repository secrets
- **Production (Vercel)** - Vercel environment variables
- **Preview (Vercel)** - Preview-specific environment variables

## Required Environment Variables

### Core Supabase Configuration

These variables are **REQUIRED** for the application to function:

| Variable | Description | Format | Example |
|----------|-------------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (safe for client) | JWT | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only, SECRET) | JWT | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### Optional Variables

| Variable | Description | Default | When Required |
|----------|-------------|---------|---------------|
| `NEXT_PUBLIC_APP_URL` | Application base URL | Auto-detected | Production, preview URLs |
| `CRON_SECRET` | Secret for cron job authentication | None | Exchange rate cron job |
| `DATABASE_URL` | Direct Postgres connection | None | Direct DB access, migrations |
| `NODE_ENV` | Environment mode | `development` | Auto-set by platform |

## Environment-Specific Setup

### 1. Local Development

#### Setup `.env.local`

Create `.env.local` in project root:

```bash
# Supabase Configuration (Local Supabase)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Application URL (Local)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database URL (Local Supabase)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

#### Start Local Supabase

```bash
# Start Supabase (creates .env.local if needed)
npx supabase start

# Apply migrations
npx supabase db push

# Verify connection
npm run dev
# Visit http://localhost:3000
```

#### Security Best Practices

- ⚠️ **NEVER** commit `.env.local` to Git (already in `.gitignore`)
- ✅ Use local Supabase keys (safe, not production)
- ✅ Reference `.env.example` for required variables

---

### 2. CI/CD (GitHub Actions)

Environment variables for automated testing and validation.

#### Setup GitHub Repository Secrets

1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add the following secrets:

##### Test Environment Secrets

```bash
# Test Supabase Instance (Separate from Production)
TEST_SUPABASE_URL=https://test-project.supabase.co
TEST_SUPABASE_ANON_KEY=eyJ... (test anon key)
TEST_SUPABASE_SERVICE_ROLE_KEY=eyJ... (test service key)

# Test Application URL
TEST_APP_URL=http://localhost:3000
```

##### Why Separate Test Database?

- ✅ Isolated test data doesn't affect production
- ✅ Can reset/seed test data freely
- ✅ Multiple CI jobs can run in parallel
- ⚠️ Additional Supabase project (free tier available)

#### GitHub Actions Usage

Variables are automatically injected into CI workflow (see `.github/workflows/ci.yml`):

```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_ROLE_KEY }}
```

#### Placeholder Values for Build

For build-only validation (no runtime), use placeholder values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder
```

---

### 3. Production (Vercel)

Production environment variables for live application.

#### Setup Vercel Environment Variables

1. Go to Vercel Project → Settings → Environment Variables
2. Add variables with scope: **Production**

```bash
# Production Supabase Instance
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (production anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (production service key - KEEP SECRET!)

# Production Application URL
NEXT_PUBLIC_APP_URL=https://financeflow.vercel.app
# Or custom domain: https://app.financeflow.com

# Cron Job Secret (for exchange rate updates)
CRON_SECRET=$(openssl rand -base64 32)

# Database URL (if needed)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
```

#### Where to Find Production Values

**Supabase Dashboard** → Settings → API:
1. **Project URL** → Copy to `NEXT_PUBLIC_SUPABASE_URL`
2. **Project API keys**:
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ SECRET!

**Database URL** → Settings → Database → Connection string (Transaction mode)

#### Security Checklist

- ✅ Mark `SUPABASE_SERVICE_ROLE_KEY` as secret (eye icon)
- ✅ Mark `CRON_SECRET` as secret
- ✅ Mark `DATABASE_URL` as secret
- ✅ Never expose service keys in client-side code
- ✅ Use `NEXT_PUBLIC_*` prefix ONLY for public values
- ⚠️ Rotate keys if exposed

---

### 4. Preview (Vercel Pull Requests)

Preview deployments for testing pull requests before merge.

#### Strategy Options

##### Option A: Share Production Database
- **Pros**: Simple setup, no extra cost
- **Cons**: Preview data mixes with production

##### Option B: Separate Preview Database (Recommended)
- **Pros**: Clean isolation, safe testing
- **Cons**: Extra Supabase project

#### Setup Preview Variables

1. Go to Vercel Project → Settings → Environment Variables
2. Add variables with scope: **Preview**

##### Option B Configuration (Separate Preview DB)

```bash
# Preview Supabase Instance
NEXT_PUBLIC_SUPABASE_URL=https://preview-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (preview anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (preview service key)

# Preview Application URL (auto-generated by Vercel)
NEXT_PUBLIC_APP_URL=https://financeflow-git-branch-user.vercel.app
```

##### Option A Configuration (Shared Production DB)

Use same values as production, but scope to "Preview" only.

#### Preview Workflow

1. Create feature branch: `feature/new-ui`
2. Push to GitHub
3. Open Pull Request
4. Vercel auto-deploys preview
5. Preview URL: `https://financeflow-git-feature-new-ui-user.vercel.app`
6. Test on preview URL
7. Merge → Deploys to production

---

## Variable Validation

FinanceFlow validates environment variables on startup.

### Validation Rules

| Variable | Rule |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Must be valid URL starting with `http://` or `https://` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Must be valid JWT format |
| `SUPABASE_SERVICE_ROLE_KEY` | Must be valid JWT format |

### Bypass Validation (Build Time)

During `npm run build`, validation is skipped to allow placeholder values in CI.

Validation runs at:
- ✅ **Runtime** (server starts)
- ❌ **Build time** (skipped)

### Health Check Endpoint

Verify environment configuration:

```bash
curl https://your-app.vercel.app/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": {
    "status": "connected",
    "latency_ms": 45
  },
  "version": {
    "app": "0.1.0",
    "commit": "abc123",
    "environment": "production"
  }
}
```

---

## Security Best Practices

### DO ✅

- Use environment variables for all secrets
- Use `.env.local` for local development
- Use `NEXT_PUBLIC_*` prefix ONLY for public values
- Rotate keys regularly (every 90 days)
- Use separate databases for production/preview/test
- Mark sensitive values as "secret" in Vercel
- Enable MFA on Vercel and Supabase accounts

### DON'T ❌

- Commit `.env.local` to Git
- Expose `SUPABASE_SERVICE_ROLE_KEY` in client code
- Use production database for testing
- Share environment variables via Slack/email (use password managers)
- Use same secrets across environments
- Hardcode secrets in source code

---

## Testing Environment Variables

### Local Testing

```bash
# Test that all required variables are set
npm run dev

# Check console for validation errors
# Should see: "Environment validation passed"
```

### Production Testing

```bash
# Test health endpoint
curl https://your-app.vercel.app/api/health

# Expected: HTTP 200, {"status": "healthy", ...}
```

### Common Issues

#### Error: "NEXT_PUBLIC_SUPABASE_URL is required"

**Solution**: Ensure variable is set in the appropriate environment:
- Local: Add to `.env.local`
- Vercel: Add in Project Settings → Environment Variables
- CI: Add as GitHub Secret

#### Error: "is not a valid JWT token"

**Solution**:
1. Verify you copied the complete key (JWT tokens are long)
2. Check for extra spaces or newlines
3. Regenerate key from Supabase dashboard

#### Error: "Database connection failed"

**Solution**:
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
2. Check Supabase project is active (not paused)
3. Verify network/firewall allows connections

---

## Reference: All Variables

### Production Configuration

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... # SECRET

# Optional
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
CRON_SECRET=your-secret # SECRET
DATABASE_URL=postgresql://... # SECRET
NODE_ENV=production # Auto-set
```

### Preview Configuration

```bash
# Required (if using separate preview DB)
NEXT_PUBLIC_SUPABASE_URL=https://preview-xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... # SECRET

# Optional
NEXT_PUBLIC_APP_URL=https://preview-xxx.vercel.app
```

### Local Development Configuration

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (local Supabase key)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (local Supabase key)

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

---

## Resources

- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs#environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

## Next Steps

1. Set up all environments (local → CI → preview → production)
2. Test each environment independently
3. Document any custom variables your team adds
4. Set calendar reminder for key rotation (90 days)

---

**Need Help?** See `DEPLOYMENT_TROUBLESHOOTING.md` for common environment variable issues.
