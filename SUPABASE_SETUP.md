# Supabase Setup Guide

This guide will help you set up Supabase for FinanceFlow, either locally or with Supabase Cloud.

## Option 1: Local Development (Recommended)

### Prerequisites
- Docker Desktop installed and running
- Supabase CLI installed

### Install Supabase CLI (if not already installed)
```bash
# macOS
brew install supabase/tap/supabase

# Other platforms
npm install -g supabase
```

### Start Local Supabase
```bash
# Start local Supabase (will download Docker images on first run)
npx supabase start

# This will output:
# - API URL: http://127.0.0.1:54321
# - DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
# - Studio URL: http://127.0.0.1:54323
# - Anon key: eyJhbG...
# - Service Role key: eyJhbG...
```

### Create .env.local
Copy the values from the terminal output:

```bash
# Copy template
cp .env.example .env.local

# Edit .env.local with values from `npx supabase start` output:
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-terminal>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-terminal>
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Apply Migrations
```bash
# Reset database and apply all migrations
npx supabase db reset

# This will:
# 1. Drop existing database
# 2. Apply migrations from supabase/migrations/
# 3. Run seed data from supabase/seed.sql
```

### Generate TypeScript Types
```bash
# Generate types from local database
npx supabase gen types typescript --local > src/types/database.types.ts
```

### Access Supabase Studio
Open http://127.0.0.1:54323 in your browser to:
- View tables and data
- Create test users
- Test SQL queries
- Monitor real-time updates

---

## Option 2: Supabase Cloud

### 1. Create Project
1. Go to https://supabase.com
2. Sign in or create account
3. Click "New Project"
4. Fill in:
   - Project name: `financeflow`
   - Database password: (save this!)
   - Region: Choose closest to you
5. Wait for project to be created (~2 minutes)

### 2. Get API Keys
1. Go to Project Settings → API
2. Copy the values:
   - Project URL
   - Project API keys (anon/public key)
   - Service role key (keep secret!)

### 3. Create .env.local
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project-ref.supabase.co:5432/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Link Local Project to Cloud
```bash
# Login to Supabase
npx supabase login

# Link project (use project ref from dashboard URL)
npx supabase link --project-ref your-project-ref
```

### 5. Push Migrations to Cloud
```bash
# Push migrations
npx supabase db push

# Generate types from cloud database
npx supabase gen types typescript --linked > src/types/database.types.ts
```

### 6. Run Seed Data (Optional)
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/seed.sql`
3. Run the SQL
4. Or use CLI: `psql $DATABASE_URL -f supabase/seed.sql`

---

## Verify Setup

### 1. Check Environment Variables
```bash
npm run dev
```
Should start without errors about missing env vars.

### 2. Test Database Connection
Create a test page to verify:

```typescript
// src/app/test-db/page.tsx
import { createClient } from '@/lib/supabase/server';

export default async function TestPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('categories').select('*');

  return (
    <div>
      <h1>Database Test</h1>
      <pre>{JSON.stringify({ data, error }, null, 2)}</pre>
    </div>
  );
}
```

Visit http://localhost:3000/test-db

### 3. Create Test User
Option A - Supabase Studio:
1. Open Studio (local: http://127.0.0.1:54323, cloud: dashboard)
2. Go to Authentication → Users
3. Click "Add user"
4. Enter email and password
5. Confirm email (auto-confirmed in local dev)

Option B - Signup page:
1. Build signup form in your app
2. Use `supabase.auth.signUp()`

---

## Common Commands

```bash
# Local Development
npx supabase start          # Start local Supabase
npx supabase stop           # Stop local Supabase
npx supabase status         # Check status
npx supabase db reset       # Reset DB and apply migrations

# Migrations
npx supabase migration new <name>      # Create new migration
npx supabase db diff -f <name>         # Generate migration from changes

# Types
npx supabase gen types typescript --local > src/types/database.types.ts
npx supabase gen types typescript --linked > src/types/database.types.ts

# Cloud
npx supabase login          # Login to Supabase
npx supabase link           # Link local project to cloud
npx supabase db push        # Push migrations to cloud
npx supabase db pull        # Pull schema from cloud
```

---

## Troubleshooting

### "Docker is not running"
- Start Docker Desktop
- Wait for it to fully start
- Run `npx supabase start` again

### "Port already in use"
- Stop other services using ports 54321-54326
- Or change ports in `supabase/config.toml`

### "Database migration failed"
- Check SQL syntax in migration files
- Look at error logs: `npx supabase status`
- Reset and try again: `npx supabase db reset`

### "Type errors" after schema changes
- Regenerate types: `npx supabase gen types typescript --local > src/types/database.types.ts`
- Restart dev server: `npm run dev`

### "RLS policy violation"
- Check if user is authenticated
- Verify RLS policies in Supabase Studio → Database → Policies
- Test policies with different users

---

## Next Steps

Once Supabase is set up:

1. ✅ Create `.env.local` with correct values
2. ✅ Apply migrations (`npx supabase db reset`)
3. ✅ Generate TypeScript types
4. ✅ Create test user in Studio
5. ✅ Test database connection
6. 🚀 Start building features!

---

**Recommended**: Use local Supabase for development, then push to cloud for production.