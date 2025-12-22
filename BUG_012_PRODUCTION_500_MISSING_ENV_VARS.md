# BUG-012: Production 500 Error - Missing Environment Variables ❌🚨

## Severity: **CRITICAL P0** - Production Down

**Status**: 🚨 **BLOCKING PRODUCTION**
**Discovered**: 2025-12-20
**Environment**: Production (https://financeflow-brown.vercel.app)
**Assigned To**: System Architect (Backend Developer)

---

## Summary

Production deployment is completely inaccessible, returning a **500 Internal Server Error** on all pages. The application cannot load because **required environment variables are not configured on Vercel**.

## Impact

- ⛔ **100% production downtime** - No pages accessible
- 🚫 All users blocked from accessing the application
- 🔴 Every request returns 500 error
- ⏱️ Issue started: Immediately after deployment `544d9fd`

## Root Cause

The environment validation module (`src/lib/env-validation.ts`) **throws a fatal error in production** (line 206) when required environment variables are missing or invalid:

```typescript
// Line 206 in env-validation.ts
if (process.env.NODE_ENV === "production") {
  throw error; // ⚠️ THIS THROWS AND CRASHES THE APP
}
```

This validation runs in the **root layout** (`src/app/layout.tsx` line 6), which executes before any page can render. If validation fails, the entire application crashes with a 500 error.

## Evidence

### 1. Browser Error
```
500: Internal Server Error
```

### 2. Network Request
```
GET https://financeflow-brown.vercel.app/ => [500]
```

### 3. Console Error
```
[ERROR] Failed to load resource: the server responded with a status of 500 ()
```

### 4. Build Logs
✅ Build completed successfully (no errors)
✅ Deployment marked as READY
❌ Runtime crashes due to missing environment variables

### 5. Screenshot
![Production 500 Error](/.playwright-mcp/production-500-error.png)

## Required Environment Variables

The following environment variables **MUST** be configured in Vercel Project Settings:

### **Critical (Required)**:
1. `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/publishable key
3. `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)

### **Recommended**:
4. `NEXT_PUBLIC_APP_URL` - Application base URL (e.g., https://financeflow-brown.vercel.app)

### **Optional**:
5. `EXCHANGE_RATE_API_URL` - Exchange rate API endpoint (defaults to free tier)
6. `EXCHANGE_RATE_CACHE_TTL_HOURS` - Cache TTL in hours (defaults to 24)
7. `EXCHANGE_RATE_CRON_SECRET` - Secret for cron job authentication

## How to Fix (Immediate Action Required)

### Step 1: Access Vercel Project Settings
1. Go to: https://vercel.com/dashboard
2. Select project: **financeflow**
3. Navigate to: **Settings** > **Environment Variables**

### Step 2: Add Required Variables

For **Production** environment, add:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_[YOUR-KEY] # or JWT format
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[YOUR-KEY]

# Application URL
NEXT_PUBLIC_APP_URL=https://financeflow-brown.vercel.app

# Exchange Rate API (optional, uses defaults if not set)
EXCHANGE_RATE_API_URL=https://open.er-api.com/v6/latest/USD
EXCHANGE_RATE_CACHE_TTL_HOURS=24
EXCHANGE_RATE_CRON_SECRET=[GENERATE_WITH: openssl rand -base64 32]
```

### Step 3: Get Supabase Credentials

Visit your Supabase project dashboard:
1. Go to: https://app.supabase.com/project/_/settings/api
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon/Public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ KEEP SECRET!)

### Step 4: Redeploy
After adding environment variables:
1. Go to **Deployments** tab
2. Click **Redeploy** on latest deployment
3. Or push a new commit to trigger automatic deployment

### Step 5: Verify
```bash
# Test production URL loads
curl https://financeflow-brown.vercel.app
# Should return HTML (not 500 error)
```

## Reproduction Steps

1. Deploy application to Vercel **without** configuring environment variables
2. Access production URL: https://financeflow-brown.vercel.app
3. Observe: 500 Internal Server Error on all pages
4. Check build logs: ✅ Build succeeds
5. Check runtime: ❌ Application crashes on startup

## Expected Behavior

- Application should load homepage
- Unauthenticated users should be redirected to `/login`
- Environment validation should pass without errors

## Actual Behavior

- All pages return 500 Internal Server Error
- Application crashes before any page can render
- Environment validation throws fatal error

## Technical Details

### Error Location
```typescript
// src/lib/env-validation.ts (lines 193-210)
if (
  typeof window === "undefined" &&
  process.env.NEXT_PHASE !== "phase-production-build"
) {
  try {
    validateEnvironmentOrThrow(); // ⚠️ Throws if env vars missing
    const summary = getEnvironmentSummary();
    console.log("Environment validation passed:", summary);
  } catch (error) {
    console.error(error);
    // Only throw in production runtime to prevent blocking local development
    if (process.env.NODE_ENV === "production") {
      throw error; // 🚨 THIS CRASHES THE APP IN PRODUCTION
    }
  }
}
```

### Imported In
```typescript
// src/app/layout.tsx (line 6)
import "@/lib/env-validation"; // Runs on every page load
```

## Files Involved

1. `/src/lib/env-validation.ts` - Environment validation logic
2. `/src/app/layout.tsx` - Imports validation on startup
3. `/.env.example` - Template showing required variables
4. `/vercel.json` - Vercel configuration (no env vars defined here)

## Related Issues

- **BUG-011**: Dashboard 500 (FIXED) - Different issue (dynamic rendering)
- **BUG-010**: Signup 405 (NOT A BUG) - Testing methodology issue

## Prevention

### For Future Deployments:
1. ✅ Use Vercel's preview deployments to test with production env vars before promoting to production
2. ✅ Create `.env.production.example` with required variables for documentation
3. ✅ Add deployment checklist to verify environment variables are configured
4. ⚠️ Consider making validation non-blocking in production (log errors instead of throwing)

## Testing Checklist (After Fix)

- [ ] Verify production URL loads without 500 error
- [ ] Homepage redirects to `/login` for unauthenticated users
- [ ] Login page renders correctly
- [ ] Signup page renders correctly
- [ ] Dashboard loads after authentication
- [ ] All pages load without console errors
- [ ] Environment validation passes with configured variables

## Additional Notes

- The deployment itself is successful (build passes, files deployed)
- The issue is **runtime configuration**, not code
- This is a **deployment/infrastructure issue**, not a code bug
- Once environment variables are added, no code changes or redeployment are needed (Vercel applies env vars to existing deployment)

## Assignee Actions Required

**System Architect** or **DevOps** should:
1. Access Vercel project settings
2. Add required environment variables (see Step 2 above)
3. Verify Supabase credentials are correct
4. Redeploy or wait for automatic environment variable application
5. Test production URL to confirm resolution
6. Update deployment documentation with environment variable checklist

---

**Priority**: 🚨 **URGENT** - Fix immediately to restore production access
