# Vercel Deployment Setup Guide

Complete step-by-step guide for deploying FinanceFlow to Vercel.

## Prerequisites

- ✅ GitHub repository with FinanceFlow code
- ✅ Vercel account (sign up at [vercel.com](https://vercel.com))
- ✅ Supabase project (production instance)
- ✅ GitHub account with access to push/merge

## Step 1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub" (recommended)
4. Authorize Vercel to access your GitHub repositories

## Step 2: Import GitHub Repository

### 2.1 Start Import Process

1. From Vercel Dashboard, click "Add New..." → "Project"
2. Select "Import Git Repository"
3. Choose your FinanceFlow repository from the list
4. If repository is not visible:
   - Click "Adjust GitHub App Permissions"
   - Grant Vercel access to the repository
   - Refresh the page

### 2.2 Configure Project Settings

**Framework Preset**: Next.js (auto-detected)

**Root Directory**: `.` (leave as default)

**Build Command**:
```bash
npm run build
```

**Output Directory**: `.next` (auto-detected)

**Install Command**:
```bash
npm ci
```

**Node.js Version**: 20.x (recommended)

> **Note**: The `vercel.json` file in the project root will automatically configure build commands to run migrations before build.

## Step 3: Configure Environment Variables

### 3.1 Production Environment Variables

Click "Environment Variables" section and add the following:

#### Required Variables

```bash
# Supabase Configuration (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find these values:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

#### Optional Variables

```bash
# Application URL (auto-set by Vercel, but can override)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Cron Job Secret (for exchange rate updates)
CRON_SECRET=your-random-secret-string

# Database URL (if using direct Postgres connection)
DATABASE_URL=postgresql://...
```

### 3.2 Environment Scopes

For each variable, select which environments it applies to:
- ✅ **Production** - Live environment
- ✅ **Preview** - Pull request deployments (use production or separate test Supabase)
- ❌ **Development** - Local development (uses `.env.local`)

### 3.3 Sensitive Variables

Mark these as **SECRET** (click eye icon):
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `DATABASE_URL`

## Step 4: Configure Deployment Settings

### 4.1 General Settings

- **Project Name**: `financeflow` (or your preferred name)
- **Production Branch**: `main`
- **Ignore Build Step**: Leave unchecked
- **Automatically expose System Environment Variables**: Checked (recommended)

### 4.2 Git Settings

**Branch Settings:**
- **Production Branch**: `main`
- **Deploy Previews**: All branches (recommended)
- **Ignored Build Paths**: Leave empty

**Build & Output Settings:**
- Override build command: No
- Override output directory: No

### 4.3 Domains

1. **Default Domain**: `financeflow.vercel.app` (auto-assigned)
2. **Custom Domain** (optional):
   - Click "Add Domain"
   - Enter your custom domain (e.g., `financeflow.app`)
   - Follow DNS configuration instructions
   - Wait for DNS propagation (can take up to 48 hours)

## Step 5: Deploy

1. Click "Deploy"
2. Wait for initial build (typically 2-5 minutes)
3. Watch build logs for any errors
4. Once complete, you'll see "Deployment Ready"

### 5.1 Build Process

The following steps happen automatically:
1. Git clone repository
2. Install dependencies (`npm ci`)
3. Run database migrations (`npx supabase db push` via `vercel.json`)
4. Build Next.js application (`npm run build`)
5. Deploy to CDN

### 5.2 Verify Deployment

Once deployed, verify everything works:

1. **Health Check**:
   ```bash
   curl https://your-app.vercel.app/api/health
   ```
   Should return: `{"status": "healthy", ...}`

2. **Visit Application**:
   - Open `https://your-app.vercel.app`
   - Test signup/login
   - Create a test transaction
   - Verify database connectivity

## Step 6: Configure Preview Deployments

### 6.1 Preview Environment Strategy

**Option A: Shared Test Database (Simpler)**
- Use same Supabase instance as production
- Preview deployments share test data
- Lower cost, but potential data conflicts

**Option B: Separate Preview Database (Recommended)**
- Create separate Supabase project for previews
- Set preview-specific environment variables
- Clean data, isolated testing

### 6.2 Set Preview Environment Variables

1. Go to Project Settings → Environment Variables
2. For preview-specific values, select only "Preview" checkbox
3. Example for separate preview database:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://preview-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (preview anon key)
   SUPABASE_SERVICE_ROLE_KEY=eyJ... (preview service key)
   ```

### 6.3 Preview Deployment Workflow

1. Create feature branch: `git checkout -b feature/new-budget-ui`
2. Make changes and commit
3. Push to GitHub: `git push origin feature/new-budget-ui`
4. Open Pull Request on GitHub
5. Vercel automatically deploys preview
6. Preview URL appears in PR comments
7. Test changes on preview deployment
8. Merge PR → Deploys to production

## Step 7: Configure Cron Jobs (Exchange Rates)

FinanceFlow has a cron job to refresh exchange rates daily.

### 7.1 Set CRON_SECRET

1. Generate random secret:
   ```bash
   openssl rand -base64 32
   ```
2. Add to Vercel environment variables:
   ```bash
   CRON_SECRET=your-generated-secret
   ```

### 7.2 Configure Vercel Cron

1. Go to Project Settings → Cron Jobs
2. Click "Add Cron Job"
3. Configure:
   - **Path**: `/api/cron/refresh-rates`
   - **Schedule**: `0 2 * * *` (2 AM daily)
   - **Region**: Same as your Supabase region
4. Save

Alternatively, use vercel.json (already configured):
```json
{
  "crons": [{
    "path": "/api/cron/refresh-rates",
    "schedule": "0 2 * * *"
  }]
}
```

## Step 8: Team Access (Optional)

If working with a team:

1. Go to Project Settings → Team
2. Click "Invite Member"
3. Enter email addresses
4. Select role:
   - **Viewer**: Read-only access
   - **Developer**: Can deploy and manage
   - **Owner**: Full access

## Step 9: Deployment Notifications

Configure notifications for deployment events:

### 9.1 GitHub Integration

Vercel automatically comments on:
- Pull requests with preview URLs
- Commit statuses (success/failure)

### 9.2 Slack/Discord (Optional)

1. Go to Project Settings → Integrations
2. Search for "Slack" or "Discord"
3. Click "Add Integration"
4. Follow authorization flow
5. Select channel for notifications

### 9.3 Email Notifications

1. Go to Account Settings → Notifications
2. Enable:
   - Deployment failed
   - Deployment succeeded (optional)
   - Domain configuration issues

## Step 10: Production Checklist

Before going live, verify:

- [ ] All environment variables set correctly
- [ ] Health endpoint returns 200 OK
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (auto-provisioned)
- [ ] Database migrations applied successfully
- [ ] Authentication works (signup/login)
- [ ] All features functional
- [ ] Performance acceptable (run Lighthouse)
- [ ] Error tracking configured (optional: Sentry)
- [ ] Team members have appropriate access

## Common Issues and Solutions

### Issue: Build Fails with "Environment validation failed"

**Solution**: Ensure all required environment variables are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Issue: "Database connection failed" in production

**Solution**:
1. Verify Supabase project is active (not paused)
2. Check RLS policies are configured
3. Verify service role key is correct
4. Ensure Supabase allows connections from Vercel IPs

### Issue: Migrations don't run on deployment

**Solution**:
1. Verify `vercel.json` buildCommand includes `npx supabase db push`
2. Check build logs for migration errors
3. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
4. Run migrations manually if needed: `npx supabase db push`

### Issue: Preview deployments use production database

**Solution**:
1. Set preview-specific environment variables
2. Scope variables to "Preview" only in Vercel settings
3. Use separate Supabase project for previews

### Issue: "DYNAMIC_SERVER_USAGE" errors

**Solution**: These are warnings, not errors. Routes using cookies/auth are automatically marked as dynamic. No action needed.

## Vercel CLI (Optional)

For power users, install Vercel CLI:

```bash
npm i -g vercel

# Login
vercel login

# Deploy from terminal
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls
```

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase + Vercel Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Custom Domains](https://vercel.com/docs/concepts/projects/custom-domains)

## Next Steps

After successful deployment:
1. Set up monitoring (Vercel Analytics, Sentry)
2. Configure branch protection rules (see `GITHUB_BRANCH_PROTECTION.md`)
3. Test preview deployment workflow
4. Document rollback procedures
5. Set up staging environment (optional)

---

**Need Help?** Refer to `DEPLOYMENT_TROUBLESHOOTING.md` for common issues and solutions.
