# Getting Started with FinanceFlow

Quick guide to get your development environment up and running.

## Prerequisites

- ✅ Node.js 18+ (you have v22.11.0)
- ✅ Docker Desktop (installed, needs to be running)
- ✅ Supabase CLI (installed via Homebrew)

## Quick Start

### 1. Start Docker Desktop

**Important**: Docker Desktop must be running before proceeding.

- Open Docker Desktop application
- Wait for it to fully start (whale icon in menu bar should be stable)
- Verify with: `docker ps`

### 2. Start Supabase (Automated)

Run the setup script that handles everything:

```bash
./scripts/setup-supabase.sh
```

This script will:
- Start local Supabase instance
- Extract API keys automatically
- Update `.env.local` with credentials
- Apply database migrations
- Run seed data
- Generate TypeScript types

### 3. Manual Setup (Alternative)

If you prefer to run commands manually:

```bash
# Start Supabase
supabase start

# Copy the output credentials and update .env.local manually

# Apply migrations and seed data
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > src/types/database.types.ts
```

### 4. Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

### 5. Access Supabase Studio

Open: http://127.0.0.1:54323

Here you can:
- View database tables
- Create test users (Authentication → Users)
- Run SQL queries
- Monitor real-time updates

## Create Your First User

### Option A: Via Supabase Studio (Recommended for testing)

1. Open Studio at http://127.0.0.1:54323
2. Go to **Authentication** → **Users**
3. Click **Add user** → **Create new user**
4. Enter:
   - Email: `test@example.com`
   - Password: `password123`
5. User is auto-confirmed in local development

### Option B: Via Signup Page (Once implemented)

1. Go to http://localhost:3000/signup
2. Fill in registration form
3. No email confirmation needed in local dev

## Project Structure

```
financeflow/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── actions/              # Server Actions (CRUD operations)
│   │   ├── (auth)/              # Auth pages (login, signup)
│   │   ├── (dashboard)/         # Protected dashboard pages
│   │   └── layout.tsx           # Root layout
│   ├── components/
│   │   ├── ui/                  # Shadcn/UI primitives (13 components)
│   │   ├── features/            # Feature components (18 components)
│   │   ├── layout/              # Header, sidebar, nav
│   │   └── providers/           # React Context providers
│   ├── lib/
│   │   ├── supabase/            # Supabase clients (client, server, middleware)
│   │   ├── validations/         # Zod schemas
│   │   ├── hooks/               # Custom React hooks
│   │   └── utils.ts             # Utility functions
│   └── types/
│       └── database.types.ts    # Generated from Supabase schema
├── supabase/
│   ├── migrations/              # Database migrations
│   ├── seed.sql                 # Sample data for testing
│   └── config.toml              # Supabase configuration
└── scripts/
    └── setup-supabase.sh        # Automated setup script
```

## Common Development Commands

```bash
# Development
npm run dev                      # Start Next.js dev server
npm run build                    # Build for production
npm run start                    # Start production server

# Code Quality
npm run lint                     # Run Biome linter
npm run format                   # Format code with Biome

# Supabase
supabase start                   # Start local Supabase
supabase stop                    # Stop local Supabase
supabase status                  # Check service status
supabase db reset                # Reset DB and reapply migrations

# Database Migrations
supabase migration new <name>    # Create new migration file
supabase db diff -f <name>       # Generate migration from schema changes

# Type Generation
supabase gen types typescript --local > src/types/database.types.ts
```

## What's Already Built

### ✅ Backend Infrastructure
- Supabase clients (client, server, middleware)
- Server Actions for all CRUD operations
- Zod validation schemas
- Database schema with RLS policies
- Authentication middleware

### ✅ Frontend Infrastructure
- 13 Shadcn/UI components
- 18 feature component placeholders
- Layout components (header, sidebar, nav)
- Auth provider and toast notifications
- Tailwind CSS v4 configured

### ⏳ To Be Implemented
- Page implementations (dashboard, transactions, budgets)
- Feature component logic (forms, lists, charts)
- Authentication pages (login, signup)
- Dashboard with real data

## Next Steps for Development

1. **Create Authentication Pages**
   - `/src/app/(auth)/login/page.tsx`
   - `/src/app/(auth)/signup/page.tsx`

2. **Build Dashboard Page**
   - `/src/app/(dashboard)/page.tsx`
   - Integrate balance summary, active budgets, expense chart

3. **Implement Transaction Management**
   - Transaction list page
   - Transaction form functionality
   - Tag input component

4. **Build Budget Management**
   - Budget list page
   - Budget form
   - Progress bar visualizations

5. **Implement Feature Components**
   - Connect forms to Server Actions
   - Add loading and error states
   - Implement real-time updates

## Troubleshooting

### "Cannot connect to Docker daemon"
- Ensure Docker Desktop is running
- Check Docker icon in menu bar is stable
- Restart Docker Desktop if needed

### "Port already in use"
- Check if Supabase is already running: `supabase status`
- Stop Supabase: `supabase stop`
- Kill processes on ports: `lsof -ti:54321 | xargs kill -9`

### "Type errors" after schema changes
- Regenerate types: `supabase gen types typescript --local > src/types/database.types.ts`
- Restart dev server: `npm run dev`

### "Missing environment variables"
- Check `.env.local` exists and has correct values
- Run setup script: `./scripts/setup-supabase.sh`
- Restart dev server after updating env vars

## Database Schema Overview

### Tables

1. **profiles** - User profiles extending auth.users
   - `id`, `currency`, `created_at`, `updated_at`

2. **categories** - Transaction categories
   - `id`, `user_id`, `name`, `color`, `type` (expense/income)

3. **tags** - Flexible transaction tags
   - `id`, `user_id`, `name`

4. **transactions** - Income/expense records
   - `id`, `user_id`, `category_id`, `amount`, `date`, `description`

5. **transaction_tags** - Many-to-many junction table
   - `transaction_id`, `tag_id`

6. **budgets** - Monthly spending limits
   - `id`, `user_id`, `category_id`, `tag_id`, `amount`, `period`, `start_date`
   - Constraint: Either category OR tag, not both

### Helper Functions

- `calculate_budget_spent()` - Calculate spent amount for a budget period
- `get_user_balance()` - Get user's total balance (income - expenses)

### Triggers

- Auto-update `updated_at` timestamp on all tables
- Auto-create profile when user signs up

## Useful Links

- **Local Supabase Studio**: http://127.0.0.1:54323
- **Local API**: http://127.0.0.1:54321
- **App**: http://localhost:3000
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs

## Support

- Check `SUPABASE_SETUP.md` for detailed Supabase instructions
- See `QUICK_REFERENCE.md` for code patterns and architecture
- Review `ARCHITECTURE.md` for system design details

---

**Ready to build!** 🚀

Start Docker Desktop, run `./scripts/setup-supabase.sh`, and then `npm run dev`.