# Deployment Troubleshooting Guide

Common deployment issues and solutions for FinanceFlow.

## Quick Diagnostic Commands

Run these first to identify the issue:

```bash
# Check build locally
npm run build

# Check health endpoint
curl https://your-app.vercel.app/api/health

# Check environment variables
vercel env ls

# View recent logs
vercel logs
```

---

## Build Issues

### Issue: "Failed to compile" - TypeScript Errors

**Symptoms**:
```
Failed to compile.

./src/components/transactions/create-transaction-dialog.tsx:185:7
Type error: Type 'string | undefined' is not assignable to type 'string'.
```

**Causes**:
- TypeScript strict mode violations
- Missing type definitions
- Incompatible library versions

**Solutions**:

1. **Fix locally first**:
   ```bash
   npm run build
   # Fix all TypeScript errors
   npx tsc --noEmit
   ```

2. **Common fixes**:
   ```typescript
   // Problem: Optional value assigned to required field
   paymentMethodId: paymentMethodId || undefined

   // Solution: Make field optional or provide default
   paymentMethodId: paymentMethodId || null
   // or update type definition to accept undefined
   ```

3. **Check tsconfig.json**:
   ```json
   {
     "compilerOptions": {
       "strict": true  // Ensure consistent
     }
   }
   ```

---

### Issue: Environment Validation Failed

**Symptoms**:
```
Error: Environment validation failed:

Errors:
  - NEXT_PUBLIC_SUPABASE_ANON_KEY is not a valid JWT token
  - SUPABASE_SERVICE_ROLE_KEY is not a valid JWT token
```

**Causes**:
- Missing environment variables
- Invalid JWT format
- Placeholder values in production
- Variables not scoped to correct environment

**Solutions**:

1. **Verify variables in Vercel**:
   - Go to Project Settings → Environment Variables
   - Check all required variables are set
   - Verify scope (Production/Preview/Development)

2. **Required variables**:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Get correct values**:
   - Go to Supabase Dashboard → Settings → API
   - Copy exact values (entire JWT token)
   - Ensure no extra spaces or newlines

4. **Re-deploy after fixing**:
   ```bash
   # Trigger re-deployment
   git commit --allow-empty -m "chore: trigger re-deploy"
   git push origin main
   ```

---

### Issue: Build Fails on Vercel but Succeeds Locally

**Symptoms**:
- Local: `npm run build` ✅ Success
- Vercel: Build fails ❌

**Common Causes**:

1. **Environment variable mismatch**:
   - Local uses `.env.local`
   - Vercel uses different values

2. **Node version mismatch**:
   - Check `package.json` engines field
   - Vercel uses Node 20.x by default

3. **Missing dependencies**:
   ```bash
   # Verify package-lock.json is committed
   git add package-lock.json
   git commit -m "fix: add package-lock.json"
   git push
   ```

4. **Case-sensitive file paths**:
   - Vercel: Linux (case-sensitive)
   - macOS/Windows: Case-insensitive

   ```typescript
   // ❌ Fails on Vercel (wrong case)
   import Button from '@/Components/ui/button';

   // ✅ Works (correct case)
   import Button from '@/components/ui/button';
   ```

**Solutions**:

1. **Match Node versions**:
   ```json
   // package.json
   {
     "engines": {
       "node": "20.x"
     }
   }
   ```

2. **Test with production env locally**:
   ```bash
   # Use Vercel CLI to pull env vars
   vercel env pull .env.production
   npm run build
   ```

3. **Check build logs**:
   - Vercel Dashboard → Deployments → Click deployment → View logs
   - Look for first error (subsequent errors often cascading)

---

### Issue: "Module not found" Error

**Symptoms**:
```
Error: Cannot find module '@/components/ui/button'
or its corresponding type declarations.
```

**Causes**:
- Path alias misconfiguration
- Missing file
- Incorrect import path

**Solutions**:

1. **Verify tsconfig.json**:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

2. **Check file exists**:
   ```bash
   ls -la src/components/ui/button.tsx
   ```

3. **Fix import path**:
   ```typescript
   // Correct
   import { Button } from '@/components/ui/button';

   // Incorrect
   import { Button } from '@/components/ui/Button'; // Wrong case
   import { Button } from 'components/ui/button'; // Missing @/
   ```

---

## Runtime Issues

### Issue: "Database connection failed"

**Symptoms**:
- App loads but shows database error
- Health endpoint returns 503
- Transactions fail to save

**Causes**:
- Supabase project paused
- Invalid connection credentials
- RLS policies too restrictive
- Network/firewall issues

**Solutions**:

1. **Check Supabase project status**:
   - Go to Supabase Dashboard
   - Verify project is active (not paused)
   - Restart if needed

2. **Verify connection string**:
   ```bash
   # Test connection
   curl https://your-project.supabase.co/rest/v1/

   # Expected: {"message": "ok"} or 401 (auth required, but connection works)
   # Unexpected: Timeout or connection refused
   ```

3. **Check environment variables**:
   ```bash
   # In Vercel
   vercel env ls

   # Verify SUPABASE_SERVICE_ROLE_KEY is set and correct
   ```

4. **Test RLS policies**:
   - Go to Supabase SQL Editor
   - Run test query as authenticated user:
     ```sql
     SELECT * FROM transactions WHERE user_id = auth.uid();
     ```

5. **Check Vercel logs**:
   ```bash
   vercel logs --follow
   # Look for Supabase connection errors
   ```

---

### Issue: Authentication Not Working

**Symptoms**:
- Cannot login/signup
- Session not persisting
- "Unauthorized" errors

**Causes**:
- Incorrect Supabase keys
- CORS issues
- Cookie configuration
- Middleware misconfiguration

**Solutions**:

1. **Verify Supabase keys**:
   ```bash
   # Check anon key is public, not service key
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

   # Should start with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **Check Supabase auth settings**:
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add Vercel domain to Site URL and Redirect URLs:
     ```
     https://your-app.vercel.app
     https://your-app.vercel.app/**
     ```

3. **Verify middleware configuration**:
   ```typescript
   // middleware.ts
   export const config = {
     matcher: [
       '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
     ],
   };
   ```

4. **Check browser console**:
   - Open DevTools → Console
   - Look for auth errors
   - Check Network tab for failed auth requests

---

### Issue: "CORS Error" in Browser Console

**Symptoms**:
```
Access to fetch at 'https://xxx.supabase.co/auth/v1/token'
has been blocked by CORS policy
```

**Causes**:
- Supabase not configured for Vercel domain
- Incorrect API URL
- Missing redirect URLs

**Solutions**:

1. **Add domain to Supabase**:
   - Go to Supabase → Authentication → URL Configuration
   - Add to Redirect URLs:
     ```
     https://your-app.vercel.app
     https://your-app.vercel.app/**
     https://*.vercel.app  (for previews)
     ```

2. **Verify NEXT_PUBLIC_SUPABASE_URL**:
   - Must start with `https://`
   - Must be exact Supabase project URL
   - No trailing slash

3. **Check custom domain**:
   - If using custom domain, add it to Supabase as well

---

## Performance Issues

### Issue: Slow Page Loads (> 5 seconds)

**Symptoms**:
- App takes long to load
- Slow API responses
- Poor Lighthouse score

**Causes**:
- Large bundle size
- Unoptimized images
- Slow database queries
- Missing caching

**Solutions**:

1. **Check bundle size**:
   ```bash
   npm run build
   # Review bundle sizes in output
   ```

2. **Analyze with Lighthouse**:
   ```bash
   npx lighthouse https://your-app.vercel.app --view
   ```

3. **Optimize images**:
   ```tsx
   // Use Next.js Image component
   import Image from 'next/image';

   <Image
     src="/logo.png"
     width={200}
     height={50}
     alt="Logo"
   />
   ```

4. **Check database queries**:
   - Review slow queries in Supabase Dashboard → Database → Query Performance
   - Add indexes for frequently queried columns
   - Use `.select()` to limit columns

5. **Enable caching**:
   ```typescript
   // Server Component
   export const revalidate = 60; // Cache for 60 seconds

   export default async function Page() {
     // ...
   }
   ```

---

## Deployment Issues

### Issue: Deployment Stuck on "Building"

**Symptoms**:
- Vercel deployment pending for > 10 minutes
- Build never completes

**Causes**:
- Infinite loop in build script
- Memory exhaustion
- Network timeout

**Solutions**:

1. **Cancel and retry**:
   - Go to Vercel Dashboard
   - Find deployment
   - Click "..." → "Cancel Deployment"
   - Retry

2. **Check build script**:
   ```json
   // package.json
   {
     "scripts": {
       "build": "next build"  // Should be simple
     }
   }
   ```

3. **Increase timeout** (if needed):
   ```json
   // vercel.json
   {
     "builds": [{
       "src": "package.json",
       "use": "@vercel/next",
       "config": {
         "maxDuration": 300
       }
     }]
   }
   ```

---

### Issue: "Deployment Failed" with No Error

**Symptoms**:
- Vercel shows "Deployment Failed"
- No clear error message in logs

**Causes**:
- Out of memory
- Timeout
- Vercel service issue

**Solutions**:

1. **Check Vercel status**:
   - Visit https://www.vercel-status.com/
   - Check for ongoing incidents

2. **Review full build logs**:
   - Vercel Dashboard → Deployment → "View Function Logs"
   - Look for OOM (Out of Memory) errors

3. **Contact Vercel support**:
   - If no clear cause, contact support with deployment URL

---

## Migration Issues

### Issue: Migration Fails During Deployment

**Symptoms**:
```
Error: npx supabase db push failed
Migration 20241220_add_column.sql failed
```

**Causes**:
- Syntax error in SQL
- Conflicting migrations
- Database locked
- Permission issues

**Solutions**:

1. **Test migration locally**:
   ```bash
   # Start local Supabase
   npx supabase start

   # Apply migration
   npx supabase db push

   # Check for errors
   ```

2. **Check migration syntax**:
   ```sql
   -- Verify SQL is valid
   -- Use transactions for safety
   BEGIN;

   ALTER TABLE transactions ADD COLUMN IF NOT EXISTS new_field TEXT;

   COMMIT;
   ```

3. **Skip migration temporarily** (emergency only):
   ```json
   // vercel.json
   {
     "buildCommand": "npm run build"  // Remove db push
   }
   ```

4. **Run migration manually**:
   ```bash
   # Connect to production database
   psql $DATABASE_URL

   # Run migration SQL directly
   \i supabase/migrations/20241220_add_column.sql
   ```

---

## Preview Deployment Issues

### Issue: Preview Deployment Uses Production Database

**Symptoms**:
- Preview changes affect production data

**Causes**:
- Preview environment variables not set
- Variables scoped to wrong environment

**Solutions**:

1. **Check environment scopes**:
   - Vercel → Settings → Environment Variables
   - Ensure preview variables scoped to "Preview" only
   - Uncheck "Production" and "Development"

2. **Set preview-specific Supabase**:
   ```bash
   # Preview environment (Vercel UI)
   NEXT_PUBLIC_SUPABASE_URL=https://preview-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (preview key)
   SUPABASE_SERVICE_ROLE_KEY=eyJ... (preview key)
   ```

3. **Verify in preview deployment**:
   - Open preview URL
   - Open DevTools → Application → Local Storage
   - Check `sb-xxx-auth-token` uses preview project ID

---

### Issue: Preview Deployment 404

**Symptoms**:
- Preview URL returns 404 Not Found

**Causes**:
- Deployment still in progress
- Deployment failed
- Branch deleted

**Solutions**:

1. **Wait for deployment**:
   - Check PR for Vercel comment
   - Wait 2-5 minutes for initial deployment

2. **Check deployment status**:
   - Vercel Dashboard → Deployments
   - Find preview deployment
   - Check status (Ready/Failed/Building)

3. **Verify branch exists**:
   ```bash
   git branch -r | grep feature-branch
   ```

---

## Health Check Issues

### Issue: Health Endpoint Returns 503

**Symptoms**:
```bash
curl https://your-app.vercel.app/api/health
# Returns: {"status": "unhealthy", "database": {"status": "error"}}
```

**Causes**:
- Database connection failed
- Supabase project paused
- Invalid credentials

**Solutions**:

1. **Check Supabase project**:
   - Verify active (not paused)
   - Check connection pooling limits

2. **Test database connection**:
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

3. **Review health endpoint code**:
   ```typescript
   // src/app/api/health/route.ts
   // Check for any custom validation logic
   ```

4. **Check Vercel logs**:
   ```bash
   vercel logs --follow
   # Look for database connection errors
   ```

---

## Emergency Procedures

### Immediate Rollback

**When**: Critical bug in production, users affected

**Steps**:
1. **Instant rollback via Vercel**:
   - Go to Vercel Dashboard → Deployments
   - Find last working deployment
   - Click "..." → "Promote to Production"
   - Confirm (restores in < 1 minute)

2. **Notify team**:
   - Alert team in Slack/Discord
   - Document issue for post-mortem

3. **Fix forward**:
   - Create hotfix branch
   - Fix bug
   - Fast-track deployment

---

### Complete System Down

**When**: Vercel down, cannot deploy

**Options**:

1. **Check Vercel status**: https://www.vercel-status.com/
2. **If Vercel issue**: Wait for resolution
3. **If project issue**:
   - Roll back via Git
   - Deploy to alternative platform (emergency only)

---

## Diagnostic Checklist

When troubleshooting, check in this order:

1. **Build**:
   - [ ] Does `npm run build` succeed locally?
   - [ ] Any TypeScript errors?
   - [ ] Any linting errors?

2. **Environment**:
   - [ ] Are all required env vars set?
   - [ ] Are env vars scoped correctly?
   - [ ] Are JWT tokens valid?

3. **Database**:
   - [ ] Is Supabase project active?
   - [ ] Do migrations succeed?
   - [ ] Are RLS policies correct?

4. **Network**:
   - [ ] Does health endpoint respond?
   - [ ] Are there CORS errors?
   - [ ] Are requests timing out?

5. **Code**:
   - [ ] Did recent changes introduce bugs?
   - [ ] Are all dependencies installed?
   - [ ] Are imports case-correct?

---

## Getting Help

### 1. Search Documentation

- This guide
- Vercel documentation
- Supabase documentation
- Next.js documentation

### 2. Check Logs

```bash
# Vercel logs
vercel logs --follow

# Local logs
npm run dev
# Check console output
```

### 3. Vercel Support

- Free tier: Community support
- Pro tier: Email support
- Enterprise: Dedicated support

### 4. Supabase Support

- Discord: https://discord.supabase.com
- GitHub Discussions: https://github.com/supabase/supabase/discussions

### 5. Team

- Create incident ticket
- Tag relevant team members
- Document issue for knowledge base

---

## Prevention

### Automate Testing

- Run tests before deployment
- Use preview deployments
- Implement health checks
- Monitor error rates

### Monitor Proactively

- Set up uptime monitoring
- Configure error tracking
- Watch performance metrics
- Review logs regularly

### Document Issues

- Add to this troubleshooting guide
- Update runbooks
- Share learnings with team
- Conduct post-mortems

---

## Resources

- [Vercel Deployment Issues](https://vercel.com/docs/concepts/deployments/troubleshoot-a-build)
- [Next.js Debugging](https://nextjs.org/docs/advanced-features/debugging)
- [Supabase Troubleshooting](https://supabase.com/docs/guides/troubleshooting)

---

**Still Stuck?** Contact your team's DevOps lead or open a support ticket with reproduction steps.
