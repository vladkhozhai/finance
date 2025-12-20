# Deployment Quick Start

Quick reference for deploying FinanceFlow to production.

## Prerequisites

- GitHub account with repository access
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Supabase production project (credentials ready)

## 1. Deploy to Vercel (5 minutes)

### Quick Setup

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure environment variables:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
5. Click "Deploy"

**Full Guide**: See `/docs/VERCEL_SETUP_GUIDE.md`

## 2. Verify Deployment (2 minutes)

```bash
# Check health endpoint
curl https://your-app.vercel.app/api/health
# Expected: {"status": "healthy", ...}

# Visit application
open https://your-app.vercel.app
```

**Full Checklist**: See `/docs/DEPLOYMENT_CHECKLIST.md`

## 3. Configure GitHub Branch Protection (3 minutes)

1. Go to Repository Settings → Branches
2. Add protection rule for `main`:
   - ✅ Require pull request (1 approval)
   - ✅ Require status checks: `ci-success`
   - ✅ Do not allow bypassing

**Full Guide**: See `/docs/GITHUB_BRANCH_PROTECTION.md`

## Production Ready ✅

Your application is now deployed and protected!

## Documentation Index

### Getting Started
- 📖 [Vercel Setup Guide](./docs/VERCEL_SETUP_GUIDE.md) - Complete deployment walkthrough
- 🔐 [Environment Setup](./docs/ENVIRONMENT_SETUP.md) - Environment variables for all environments
- 📋 [Deployment Checklist](./docs/DEPLOYMENT_CHECKLIST.md) - Pre/post deployment verification

### Development
- 🚀 [Build Optimization](./docs/BUILD_OPTIMIZATION.md) - Build configuration and performance
- 🔍 [Build Verification Report](./docs/BUILD_VERIFICATION_REPORT.md) - Current build status
- 🌿 [Preview Deployment Testing](./docs/PREVIEW_DEPLOYMENT_TESTING.md) - Testing preview deployments

### Operations
- 🛡️ [GitHub Branch Protection](./docs/GITHUB_BRANCH_PROTECTION.md) - Branch protection rules
- 🔧 [Troubleshooting Guide](./docs/DEPLOYMENT_TROUBLESHOOTING.md) - Common issues and solutions
- 📊 [Implementation Summary](./docs/FRONTEND_CI_CD_IMPLEMENTATION_SUMMARY.md) - Complete implementation details

## Quick Commands

```bash
# Local development
npm run dev

# Production build
npm run build

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format

# Deploy via Vercel CLI (optional)
vercel --prod
```

## Common Tasks

### Deploy New Feature

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit
3. Push: `git push origin feature/my-feature`
4. Open PR on GitHub
5. Wait for CI to pass
6. Test preview deployment
7. Get approval and merge

### Rollback Deployment

1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

### Update Environment Variables

1. Go to Vercel Project → Settings → Environment Variables
2. Edit variable
3. Re-deploy: `git commit --allow-empty -m "chore: trigger redeploy" && git push`

## Support

- **Troubleshooting**: See `/docs/DEPLOYMENT_TROUBLESHOOTING.md`
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs

## Build Status

Last verified: December 20, 2024

- ✅ Build succeeds in ~2.7 seconds
- ✅ Bundle size: 180 KB first load JS
- ✅ 17 routes compiled successfully
- ✅ 0 TypeScript errors
- ✅ 0 security vulnerabilities

---

**Ready to deploy?** Start with `/docs/VERCEL_SETUP_GUIDE.md`
