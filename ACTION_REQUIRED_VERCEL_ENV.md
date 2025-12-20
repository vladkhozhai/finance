# 🚨 ACTION REQUIRED: Update Vercel Environment Variables

## TL;DR
Your production auth is broken because Vercel uses an old JWT key format. Update these environment variables to fix it.

---

## Step 1: Get Service Role Key from Supabase

1. Go to: https://supabase.com/dashboard/project/ylxeutefnnagksmaagvy/settings/api
2. Find "Project API keys" section
3. Copy the **service_role** secret key (NOT the anon key)
4. Keep it ready for Step 2

---

## Step 2: Update Vercel Environment Variables

### Option A: Vercel Dashboard (Easiest)

1. Go to your Vercel project: https://vercel.com/[your-team]/finance-flow/settings/environment-variables

2. **Delete old variable**:
   - Find `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Click "..." → Delete

3. **Add these NEW variables** (click "Add" for each):

   ```
   Name: NEXT_PUBLIC_SUPABASE_URL
   Value: https://ylxeutefnnagksmaagvy.supabase.co
   Environments: Production, Preview, Development
   ```

   ```
   Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: sb_publishable_ppVxqJvUUoYsUivAGGduRQ_TJcCbqIo
   Environments: Production, Preview, Development
   ```

   ```
   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: <paste-the-key-from-step-1>
   Environments: Production, Preview, Development
   ```

   ```
   Name: NEXT_PUBLIC_APP_URL
   Value: https://your-app.vercel.app
   Environments: Production
   ```

   ```
   Name: EXCHANGE_RATE_API_URL
   Value: https://open.er-api.com/v6/latest/USD
   Environments: Production, Preview, Development
   ```

   ```
   Name: EXCHANGE_RATE_CACHE_TTL_HOURS
   Value: 24
   Environments: Production, Preview, Development
   ```

   ```
   Name: EXCHANGE_RATE_CRON_SECRET
   Value: RY3OPh1KrHcnyChQlMhh+WTv5+WKS50dAtOb/3oe1H0=
   Environments: Production, Preview, Development
   ```

4. Click **Save**

5. Go to: Deployments → Latest Deployment → "..." → Redeploy

6. Wait for deployment to complete (2-3 minutes)

7. Test at: https://your-app.vercel.app/login

---

### Option B: Vercel CLI

```bash
# Install CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Set variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste: https://ylxeutefnnagksmaagvy.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste: sb_publishable_ppVxqJvUUoYsUivAGGduRQ_TJcCbqIo

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste: <your-service-role-key-from-step-1>

vercel env add NEXT_PUBLIC_APP_URL production
# Paste: https://your-app.vercel.app

vercel env add EXCHANGE_RATE_API_URL production
# Paste: https://open.er-api.com/v6/latest/USD

vercel env add EXCHANGE_RATE_CACHE_TTL_HOURS production
# Paste: 24

vercel env add EXCHANGE_RATE_CRON_SECRET production
# Paste: RY3OPh1KrHcnyChQlMhh+WTv5+WKS50dAtOb/3oe1H0=

# Redeploy
vercel --prod
```

---

## Step 3: Verify Fix

1. Open production app: https://your-app.vercel.app/login
2. Open browser DevTools → Console
3. Try to sign up or log in
4. ✅ Should work without errors!

---

## What This Fixes

### Before (Broken)
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- JWT format (old)
- ❌ Causes Headers.append error
- ❌ Production auth fails

### After (Working)
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ppVxqJvUUoYsUivAGGduRQ_TJcCbqIo
```
- Publishable format (modern)
- ✅ No Headers.append error
- ✅ Production auth works

---

## Quick Reference

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ylxeutefnnagksmaagvy.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_ppVxqJvUUoYsUivAGGduRQ_TJcCbqIo` |
| `SUPABASE_SERVICE_ROLE_KEY` | Get from dashboard ↑ |
| `NEXT_PUBLIC_APP_URL` | Your Vercel domain |
| `EXCHANGE_RATE_API_URL` | `https://open.er-api.com/v6/latest/USD` |
| `EXCHANGE_RATE_CACHE_TTL_HOURS` | `24` |
| `EXCHANGE_RATE_CRON_SECRET` | `RY3OPh1KrHcnyChQlMhh+WTv5+WKS50dAtOb/3oe1H0=` |

---

## Need Help?

- **Comprehensive Guide**: See `/VERCEL_ENV_FIX.md`
- **Bug Documentation**: See `/BUGS.md` (BUG-009)
- **Production Template**: See `/.env.production.template`

---

**Estimated Time**: 5 minutes
**Priority**: P0 CRITICAL
**Blocks**: Production launch

✅ **After fix**: Production auth will work exactly like local!
