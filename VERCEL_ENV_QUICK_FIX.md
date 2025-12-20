# QUICK FIX: Copy These Values to Vercel

## 🚨 IMMEDIATE ACTION REQUIRED

Go to Vercel → Settings → Environment Variables and update:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://ylxeutefnnagksmaagvy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ppVxqJvUUoYsUivAGGduRQ_TJcCbqIo
```

## Additional Variables (If Missing)

```bash
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
EXCHANGE_RATE_API_URL=https://open.er-api.com/v6/latest/USD
EXCHANGE_RATE_CACHE_TTL_HOURS=24
EXCHANGE_RATE_CRON_SECRET=RY3OPh1KrHcnyChQlMhh+WTv5+WKS50dAtOb/3oe1H0=
```

## Get Service Role Key

1. Go to: https://supabase.com/dashboard/project/ylxeutefnnagksmaagvy/settings/api
2. Copy the **service_role** secret key
3. Add to Vercel as: `SUPABASE_SERVICE_ROLE_KEY`

## After Updating

1. Click "Save" in Vercel
2. Redeploy: Deployments → Redeploy
3. Test login at: https://your-app.vercel.app/login

✅ **Done!** Auth should work in production.
