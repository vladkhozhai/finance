# P0 BUG FIX: Vercel Environment Variables

## Root Cause Analysis

**Problem**: Production uses old JWT-based anon key causing Headers.append error
**Solution**: Update Vercel to use modern publishable key format

## Current State

### Local Environment (.env.local)
- ✅ Using **local Supabase instance** (http://127.0.0.1:54321)
- ✅ Using modern publishable key format (`sb_publishable_...`)
- ✅ **Works correctly** - No Headers.append errors

### Production (Vercel)
- ❌ Using **production Supabase** (https://ylxeutefnnagksmaagvy.supabase.co)
- ❌ Using old JWT anon key format (`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
- ❌ **Fails** - Headers.append error with JWT token

## Required Vercel Environment Variables

### Supabase Project Information
- **Project Ref**: `ylxeutefnnagksmaagvy`
- **Project URL**: `https://ylxeutefnnagksmaagvy.supabase.co`

### Keys Available from Supabase

#### Option 1: Modern Publishable Key (RECOMMENDED)
```
NEXT_PUBLIC_SUPABASE_URL=https://ylxeutefnnagksmaagvy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ppVxqJvUUoYsUivAGGduRQ_TJcCbqIo
```

#### Option 2: Legacy Anon Key (If publishable doesn't work)
```
NEXT_PUBLIC_SUPABASE_URL=https://ylxeutefnnagksmaagvy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlseGV1dGVmbm5hZ2tzbWFhZ3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDEwMDksImV4cCI6MjA4MTgxNzAwOX0.gsHM2lsBeSCV2ShzFC7U4WtI5sOFpx8RPlQgI6KLXWo
```

### Additional Required Variables
```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
EXCHANGE_RATE_API_URL=https://open.er-api.com/v6/latest/USD
EXCHANGE_RATE_CACHE_TTL_HOURS=24
EXCHANGE_RATE_CRON_SECRET=RY3OPh1KrHcnyChQlMhh+WTv5+WKS50dAtOb/3oe1H0=
```

### Service Role Key (For Server Actions)
You need to get the service role key from Supabase Dashboard:
1. Go to: https://supabase.com/dashboard/project/ylxeutefnnagksmaagvy/settings/api
2. Copy the **service_role** key (secret, not public!)
3. Add to Vercel:
```
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

## How to Update Vercel Environment Variables

### Method 1: Vercel Dashboard (Easiest)
1. Go to: https://vercel.com/your-team/finance-flow/settings/environment-variables
2. Delete the old `NEXT_PUBLIC_SUPABASE_ANON_KEY` variable
3. Add new variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://ylxeutefnnagksmaagvy.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_ppVxqJvUUoYsUivAGGduRQ_TJcCbqIo`
   - `SUPABASE_SERVICE_ROLE_KEY` = `<get-from-supabase-dashboard>`
4. Select environments: **Production**, **Preview**, **Development**
5. Click **Save**
6. Redeploy the application (Vercel → Deployments → Redeploy)

### Method 2: Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste: https://ylxeutefnnagksmaagvy.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste: sb_publishable_ppVxqJvUUoYsUivAGGduRQ_TJcCbqIo

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste: <your-service-role-key>

# Redeploy
vercel --prod
```

## Verification Steps

After updating Vercel environment variables:

1. **Check Vercel Deployment Logs**:
   - Go to Vercel → Deployments → Latest Deployment → Logs
   - Look for build logs confirming environment variables are set

2. **Test Production Authentication**:
   - Visit: https://your-app.vercel.app/login
   - Try to sign up or log in
   - ✅ Should work without Headers.append error

3. **Check Browser Console**:
   - Open DevTools → Console
   - Should see no Supabase auth errors
   - Should see successful auth state changes

4. **Test Dashboard Access**:
   - Log in successfully
   - Navigate to dashboard
   - ✅ Should load without errors

## Why This Fixes The Bug

### The Problem
The old JWT anon key format caused the Supabase client to:
1. Parse the JWT token
2. Try to append headers using `Headers.append()`
3. Fail with "Headers is not a constructor" error in browser

### The Solution
The modern publishable key format (`sb_publishable_...`):
1. Uses a simpler string format (not JWT)
2. Doesn't trigger JWT parsing logic
3. Works correctly with browser Headers API
4. Is the recommended format by Supabase

### Key Differences

| Aspect | Old JWT Key | New Publishable Key |
|--------|-------------|---------------------|
| Format | `eyJhbGci...` (JWT) | `sb_publishable_...` |
| Parsing | Requires JWT decode | Simple string |
| Headers | ❌ Causes append error | ✅ Works correctly |
| Security | ✅ Secure | ✅ Secure + Better |
| Recommended | Legacy support only | ✅ Current best practice |

## Alternative: Create New Service Role Key

If the publishable key doesn't work, you may need to regenerate the service role key:

1. Go to Supabase Dashboard → API Settings
2. Click "Reset" next to service_role key
3. Copy the new key immediately (it won't be shown again)
4. Update Vercel with the new `SUPABASE_SERVICE_ROLE_KEY`

## Post-Fix Actions

After fixing:
1. ✅ Mark Bug #009 as resolved
2. ✅ Update QA test plan to verify production auth
3. ✅ Document this fix in BUGS.md
4. ✅ Consider adding environment variable validation in `src/lib/env-validation.ts`

## Contact/Support

If issues persist:
- Check Supabase status: https://status.supabase.com/
- Check Vercel status: https://www.vercel-status.com/
- Review Supabase logs: Dashboard → Logs
- Review Vercel logs: Deployments → Function Logs

---

**Priority**: P0 CRITICAL
**Estimated Fix Time**: 5 minutes (just updating env vars)
**Expected Result**: ✅ Production auth works exactly like local
