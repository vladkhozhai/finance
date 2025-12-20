# FinanceFlow - Architecture Diagrams

Visual representations of the system architecture for quick understanding.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT BROWSER                             │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      Next.js Frontend                           │ │
│  │                                                                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │ │
│  │  │   Client     │  │   Server     │  │   Server Components  │ │ │
│  │  │  Components  │  │   Actions    │  │   (SSR + RSC)        │ │ │
│  │  │              │  │              │  │                      │ │ │
│  │  │  - Forms     │  │  - Mutations │  │  - Data Fetching     │ │ │
│  │  │  - Realtime  │  │  - Validate  │  │  - Auth Checks       │ │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘ │ │
│  │         │                  │                      │             │ │
│  └─────────┼──────────────────┼──────────────────────┼─────────────┘ │
│            │                  │                      │               │
└────────────┼──────────────────┼──────────────────────┼───────────────┘
             │                  │                      │
             │ (1)              │ (2)                  │ (3)
             │ Browser Client   │ Server Client        │ Server Client
             │                  │                      │
        ┌────▼──────────────────▼──────────────────────▼────┐
        │                                                    │
        │             Supabase Backend                       │
        │                                                    │
        │  ┌──────────────┐  ┌──────────────────────────┐  │
        │  │              │  │                          │  │
        │  │   Auth       │  │   PostgreSQL Database    │  │
        │  │   (RLS)      │  │                          │  │
        │  │              │  │   ┌──────────────────┐   │  │
        │  │  - Users     │  │   │  Row Level       │   │  │
        │  │  - Sessions  │◄─┼───┤  Security (RLS)  │   │  │
        │  │  - auth.uid()│  │   │                  │   │  │
        │  │              │  │   │  WHERE user_id   │   │  │
        │  └──────────────┘  │   │  = auth.uid()    │   │  │
        │                    │   └──────────────────┘   │  │
        │                    │                          │  │
        │                    │   Tables:                │  │
        │                    │   - profiles             │  │
        │                    │   - categories           │  │
        │                    │   - tags                 │  │
        │                    │   - transactions         │  │
        │                    │   - transaction_tags     │  │
        │                    │   - budgets              │  │
        │                    └──────────────────────────┘  │
        │                                                    │
        └────────────────────────────────────────────────────┘

Legend:
(1) Browser Client - Used in Client Components for client-side queries
(2) Server Client - Used in Server Actions for mutations
(3) Server Client - Used in Server Components for SSR data fetching
```

---

## Data Flow Architecture

### Read Operation (Server Component)

```
User navigates to /dashboard/transactions
            │
            ▼
┌───────────────────────────┐
│  Server Component         │
│  (transactions/page.tsx)  │
│                           │
│  1. Call createServerClient()
│  2. Fetch transactions    │
│  3. Render with data      │
└───────────┬───────────────┘
            │
            ▼
┌───────────────────────────┐
│  Supabase PostgreSQL      │
│                           │
│  1. Verify auth.uid()     │
│  2. Apply RLS policy      │
│  3. Return filtered data  │
└───────────┬───────────────┘
            │
            ▼
┌───────────────────────────┐
│  HTML Response            │
│  (Server-rendered)        │
└───────────────────────────┘
```

### Write Operation (Server Action)

```
User submits form
      │
      ▼
┌─────────────────────────┐
│  Client Component       │
│  (transaction-form.tsx) │
│                         │
│  <form action={...}>    │
└──────────┬──────────────┘
           │
           ▼
┌──────────────────────────┐
│  Server Action           │
│  (actions/transactions)  │
│                          │
│  1. Get auth.uid()       │
│  2. Validate with Zod    │
│  3. Insert to DB         │
│  4. revalidatePath()     │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  Supabase PostgreSQL     │
│                          │
│  1. Check RLS policy     │
│  2. Verify user_id       │
│  3. INSERT/UPDATE/DELETE │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  Next.js Cache           │
│  (Revalidated)           │
│                          │
│  UI automatically updates│
└──────────────────────────┘
```

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      /src/components/                            │
│                                                                   │
│  ┌─────────────────┐  ┌────────────────────┐  ┌──────────────┐ │
│  │   ui/           │  │   features/        │  │   layout/    │ │
│  │   (Primitives)  │  │   (Business Logic) │  │              │ │
│  │                 │  │                    │  │              │ │
│  │  - button       │  │  transactions/     │  │  - header    │ │
│  │  - card         │◄─┼──  - form          │  │  - sidebar   │ │
│  │  - dialog       │  │    - list          │  │  - nav       │ │
│  │  - input        │  │    - card          │  │              │ │
│  │  - progress     │  │                    │  │              │ │
│  │  - select       │  │  budgets/          │  │              │ │
│  │  - toast        │  │    - card          │  │              │ │
│  │                 │  │    - form          │  │              │ │
│  │  (Shadcn/UI)    │  │    - progress      │  │              │ │
│  │  (Radix UI)     │  │    - list          │  │              │ │
│  │                 │  │                    │  │              │ │
│  │                 │  │  categories/       │  │              │ │
│  │                 │  │    - select        │  │              │ │
│  │                 │  │    - badge         │  │              │ │
│  │                 │  │    - form          │  │              │ │
│  │                 │  │                    │  │              │ │
│  │                 │  │  tags/             │  │              │ │
│  │                 │  │    - input         │  │              │ │
│  │                 │  │    - badge         │  │              │ │
│  │                 │  │    - form          │  │              │ │
│  └─────────────────┘  └────────────────────┘  └──────────────┘ │
│                                                                   │
│  Composition Pattern:                                             │
│  UI Primitives (reusable) ← Feature Components (business logic)  │
└───────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Relationships

```
┌──────────────────┐
│   auth.users     │
│   (Supabase)     │
└────────┬─────────┘
         │ 1:1
         │
         ▼
┌──────────────────┐
│    profiles      │
│                  │
│  - id (FK)       │
│  - currency      │
└────────┬─────────┘
         │ 1:N
         │
         ├─────────────────────┬─────────────────────┬─────────────────┐
         │                     │                     │                 │
         ▼                     ▼                     ▼                 ▼
┌────────────────┐   ┌────────────────┐   ┌────────────────┐   ┌───────────────┐
│  categories    │   │      tags      │   │  transactions  │   │    budgets    │
│                │   │                │   │                │   │               │
│  - id          │   │  - id          │   │  - id          │   │  - id         │
│  - user_id     │   │  - user_id     │   │  - user_id     │   │  - user_id    │
│  - name        │   │  - name        │   │  - category_id │──►│  - category_id│
│  - color       │   │  - created_at  │   │  - amount      │   │  - tag_id     │
│  - type        │   │                │   │  - date        │   │  - amount     │
│  - created_at  │   │                │   │  - description │   │  - period     │
└────────┬───────┘   └────────┬───────┘   └────────┬───────┘   └───────────────┘
         │                    │                    │
         │                    │                    │
         └────────────────────┴────────────────────┘
                              │
                              ▼
                  ┌────────────────────────┐
                  │   transaction_tags     │
                  │   (Junction Table)     │
                  │                        │
                  │  - transaction_id (FK) │
                  │  - tag_id (FK)         │
                  │  PK: (transaction_id,  │
                  │       tag_id)          │
                  └────────────────────────┘

Relationships:
- User → Profiles (1:1)
- User → Categories (1:N)
- User → Tags (1:N)
- User → Transactions (1:N)
- User → Budgets (1:N)
- Transaction → Category (N:1)
- Transaction → Tags (N:N via transaction_tags)
- Budget → Category (N:1, nullable)
- Budget → Tag (N:1, nullable)

Constraints:
- Budget: Either category_id OR tag_id (XOR constraint)
- Categories/Tags: Unique (user_id, name)
```

---

## RLS Policy Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      User Request                                 │
│                   (Authenticated)                                 │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Supabase Auth Layer                             │
│                                                                    │
│  1. Verify JWT token                                              │
│  2. Extract user UUID → auth.uid()                                │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                   PostgreSQL Query                                │
│                                                                    │
│  SELECT * FROM transactions WHERE ...                             │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                   RLS Policy Check                                │
│                                                                    │
│  Policy: "Users can view own transactions"                        │
│  USING (auth.uid() = user_id)                                     │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  IF auth.uid() = transaction.user_id:                       │ │
│  │    ✅ Return row                                             │ │
│  │  ELSE:                                                       │ │
│  │    ❌ Hide row                                               │ │
│  └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Filtered Results                                │
│                                                                    │
│  Only rows where user_id = auth.uid() are returned                │
└──────────────────────────────────────────────────────────────────┘

Security Guarantee:
- Users can ONLY see their own data
- Enforced at database level (can't be bypassed)
- No application code required for filtering
```

---

## File Structure Hierarchy

```
finance/
│
├── Configuration Files (Root Level)
│   ├── .env.local (local secrets)
│   ├── .env.example (template)
│   ├── biome.json (linting)
│   ├── next.config.ts (Next.js)
│   ├── tsconfig.json (TypeScript)
│   └── middleware.ts (auth middleware)
│
├── Documentation
│   ├── ARCHITECTURE.md (technical reference)
│   ├── ARCHITECTURE_SUMMARY.md (executive summary)
│   ├── ARCHITECTURE_DIAGRAM.md (this file)
│   ├── DIRECTORY_STRUCTURE.md (file organization)
│   ├── QUICK_REFERENCE.md (cheat sheet)
│   ├── PRD.md (product requirements)
│   └── CLAUDE.md (AI instructions)
│
├── supabase/ (Database)
│   ├── config.toml
│   ├── seed.sql
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_add_rls_policies.sql
│       └── 003_create_functions.sql
│
└── src/ (Application Code)
    │
    ├── app/ (Next.js App Router)
    │   ├── layout.tsx (root layout)
    │   ├── page.tsx (homepage)
    │   ├── (auth)/ (login/signup)
    │   ├── (dashboard)/ (protected routes)
    │   └── actions/ (Server Actions)
    │       ├── transactions.ts
    │       ├── budgets.ts
    │       ├── categories.ts
    │       └── tags.ts
    │
    ├── components/ (React Components)
    │   ├── ui/ (Shadcn primitives)
    │   ├── features/ (business logic)
    │   ├── layout/ (header, sidebar, nav)
    │   └── providers/ (context providers)
    │
    ├── lib/ (Utilities)
    │   ├── supabase/ (clients)
    │   │   ├── client.ts (browser)
    │   │   ├── server.ts (server)
    │   │   └── middleware.ts (auth)
    │   ├── utils/ (helpers)
    │   ├── validations/ (Zod schemas)
    │   ├── constants/ (app constants)
    │   └── hooks/ (React hooks)
    │
    └── types/ (TypeScript)
        ├── database.types.ts (generated)
        └── index.ts (app types)
```

---

## Supabase Client Selection Flowchart

```
                     START
                       │
                       ▼
              ┌─────────────────┐
              │  Where is code  │
              │   executing?    │
              └────────┬─────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │ Client  │   │ Server  │   │ Middle- │
   │Component│   │Component│   │  ware   │
   └────┬────┘   └────┬────┘   └────┬────┘
        │             │              │
        ▼             ▼              ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │  "use   │   │  async  │   │ Middle- │
   │ client" │   │function │   │ ware.ts │
   └────┬────┘   └────┬────┘   └────┬────┘
        │             │              │
        ▼             ▼              ▼
   ┌──────────────────────────────────┐
   │  Import Appropriate Client       │
   └──────────────────────────────────┘
        │             │              │
        ▼             ▼              ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │ client  │   │ server  │   │middle-  │
   │   .ts   │   │   .ts   │   │ ware.ts │
   └─────────┘   └─────────┘   └─────────┘

Usage Examples:

Client Component:
┌─────────────────────────────┐
│ 'use client'                │
│                             │
│ import { createClient }     │
│ from '@/lib/supabase/client'│
│                             │
│ const supabase = createClient()
│ // Use for client-side queries
└─────────────────────────────┘

Server Component/Action:
┌─────────────────────────────────┐
│ import { createServerClient }  │
│ from '@/lib/supabase/server'    │
│                                 │
│ const supabase =                │
│   await createServerClient()    │
│ // Use for SSR or mutations     │
└─────────────────────────────────┘

Middleware:
┌─────────────────────────────────┐
│ import { updateSession }        │
│ from '@/lib/supabase/middleware'│
│                                 │
│ export async function           │
│   middleware(request)           │
│ // Use for auth checks          │
└─────────────────────────────────┘
```

---

## Security Layer Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                        Security Layers                          │
└────────────────────────────────────────────────────────────────┘

Layer 1: Client-Side Validation
┌────────────────────────────────────────────────────────────────┐
│  User Input → Zod Schema Validation                             │
│  - Type checking                                                │
│  - Format validation                                            │
│  - Required fields                                              │
└────────────────────────┬───────────────────────────────────────┘
                         │ (If valid)
                         ▼
Layer 2: Server Action Validation
┌────────────────────────────────────────────────────────────────┐
│  Server Action                                                  │
│  - Re-validate with Zod (don't trust client)                    │
│  - Verify authenticated user (auth.uid())                       │
│  - Check business logic constraints                             │
└────────────────────────┬───────────────────────────────────────┘
                         │ (If authorized)
                         ▼
Layer 3: Database RLS Policies
┌────────────────────────────────────────────────────────────────┐
│  PostgreSQL Row Level Security                                  │
│  - Enforce auth.uid() = user_id                                 │
│  - Apply on SELECT, INSERT, UPDATE, DELETE                      │
│  - Cannot be bypassed by application code                       │
└────────────────────────┬───────────────────────────────────────┘
                         │ (If policy passes)
                         ▼
Layer 4: Database Constraints
┌────────────────────────────────────────────────────────────────┐
│  PostgreSQL Constraints                                         │
│  - Foreign key constraints                                      │
│  - Unique constraints                                           │
│  - Check constraints (e.g., budget XOR constraint)              │
│  - NOT NULL constraints                                         │
└────────────────────────┬───────────────────────────────────────┘
                         │ (If constraints met)
                         ▼
                   ┌────────────┐
                   │  Success   │
                   │  Operation │
                   │  Complete  │
                   └────────────┘

Security Principle: Defense in Depth
- Multiple layers of validation
- Never trust client input
- Enforce security at database level
- RLS is the ultimate security boundary
```

---

## Development Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   Development Workflow                           │
└─────────────────────────────────────────────────────────────────┘

Local Development Setup (One-time)
───────────────────────────────────
1. Clone repository
         │
         ▼
2. Install dependencies
   $ npm install
         │
         ▼
3. Copy environment template
   $ cp .env.example .env.local
         │
         ▼
4. Start local Supabase
   $ npx supabase start
         │
         ▼
5. Apply migrations
   $ npx supabase db reset
         │
         ▼
6. Generate types
   $ npx supabase gen types typescript --local > src/types/database.types.ts
         │
         ▼
7. Start dev server
   $ npm run dev


Feature Development Cycle
──────────────────────────

   ┌─────────────────────────────────────────────┐
   │  1. Create database migration (if needed)   │
   │     $ npx supabase migration new feature    │
   └───────────────────┬─────────────────────────┘
                       │
                       ▼
   ┌─────────────────────────────────────────────┐
   │  2. Write SQL in migration file             │
   │     /supabase/migrations/XXX_feature.sql    │
   └───────────────────┬─────────────────────────┘
                       │
                       ▼
   ┌─────────────────────────────────────────────┐
   │  3. Apply migration locally                 │
   │     $ npx supabase db reset                 │
   └───────────────────┬─────────────────────────┘
                       │
                       ▼
   ┌─────────────────────────────────────────────┐
   │  4. Generate types                          │
   │     $ npx supabase gen types typescript...  │
   └───────────────────┬─────────────────────────┘
                       │
                       ▼
   ┌─────────────────────────────────────────────┐
   │  5. Implement Backend                       │
   │     - Server Actions                        │
   │     - Zod validations                       │
   └───────────────────┬─────────────────────────┘
                       │
                       ▼
   ┌─────────────────────────────────────────────┐
   │  6. Implement Frontend                      │
   │     - Components                            │
   │     - Pages                                 │
   └───────────────────┬─────────────────────────┘
                       │
                       ▼
   ┌─────────────────────────────────────────────┐
   │  7. Test locally                            │
   │     - Manual testing                        │
   │     - Playwright tests                      │
   └───────────────────┬─────────────────────────┘
                       │
                       ▼
   ┌─────────────────────────────────────────────┐
   │  8. Push to production                      │
   │     $ npx supabase db push                  │
   │     $ git push                              │
   └─────────────────────────────────────────────┘
```

---

## Budget Progress Calculation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│               Budget Progress Calculation                        │
└─────────────────────────────────────────────────────────────────┘

Input: Budget object
┌───────────────────────┐
│  Budget               │
│  - amount: 500        │
│  - category_id: X     │
│  - tag_id: NULL       │
│  - period: monthly    │
└──────────┬────────────┘
           │
           ▼
┌───────────────────────────────────────────────────────────────┐
│  Determine Filter Type                                         │
│  IF category_id IS NOT NULL → Filter by category              │
│  IF tag_id IS NOT NULL → Filter by tag                        │
└──────────┬────────────────────────────────────────────────────┘
           │
           ▼
┌───────────────────────────────────────────────────────────────┐
│  Calculate Date Range                                          │
│  period = 'monthly' → Start: 2025-01-01, End: 2025-01-31      │
└──────────┬────────────────────────────────────────────────────┘
           │
           ▼
┌───────────────────────────────────────────────────────────────┐
│  Call SQL Function                                             │
│  calculate_budget_spent(                                       │
│    p_user_id: current_user.id,                                 │
│    p_category_id: X,                                           │
│    p_tag_id: NULL,                                             │
│    p_start_date: '2025-01-01',                                 │
│    p_end_date: '2025-01-31'                                    │
│  )                                                             │
└──────────┬────────────────────────────────────────────────────┘
           │
           ▼
┌───────────────────────────────────────────────────────────────┐
│  SQL Calculation (Category)                                    │
│  SELECT COALESCE(SUM(amount), 0)                               │
│  FROM transactions                                             │
│  WHERE user_id = p_user_id                                     │
│    AND category_id = p_category_id                             │
│    AND date BETWEEN p_start_date AND p_end_date                │
│  → Returns: 350.00                                             │
└──────────┬────────────────────────────────────────────────────┘
           │
           ▼
┌───────────────────────────────────────────────────────────────┐
│  Calculate Progress Metrics                                    │
│  - spent: 350.00                                               │
│  - budget: 500.00                                              │
│  - remaining: 150.00 (500 - 350)                               │
│  - percentage: 70% (350 / 500 * 100)                           │
│  - isOverspent: false (350 <= 500)                             │
└──────────┬────────────────────────────────────────────────────┘
           │
           ▼
┌───────────────────────────────────────────────────────────────┐
│  Render Budget Card                                            │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Groceries                                               │ │
│  │  $350.00 / $500.00                                       │ │
│  │  ██████████████░░░░░░ 70%                                │ │
│  │  $150.00 remaining                                       │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘

Visual Indicators:
- Green progress bar: percentage < 90%
- Yellow progress bar: 90% <= percentage < 100%
- Red progress bar: percentage >= 100%
```

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Authentication Flow                         │
└─────────────────────────────────────────────────────────────────┘

User Signup
───────────
User fills signup form
         │
         ▼
Submit to Server Action
         │
         ▼
┌────────────────────────┐
│  Supabase Auth         │
│  .signUp()             │
│  - Create user         │
│  - Send email verify   │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Database Trigger      │
│  - Create profile      │
│  - Set default currency│
└────────┬───────────────┘
         │
         ▼
User created, email verification sent


User Login
──────────
User enters credentials
         │
         ▼
Submit to Server Action
         │
         ▼
┌────────────────────────┐
│  Supabase Auth         │
│  .signInWithPassword() │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Set auth cookies      │
│  - Access token        │
│  - Refresh token       │
└────────┬───────────────┘
         │
         ▼
Redirect to /dashboard


Protected Route Access
──────────────────────
User navigates to /dashboard/transactions
         │
         ▼
┌────────────────────────┐
│  Middleware            │
│  (middleware.ts)       │
│  - Check cookies       │
│  - Verify session      │
└────────┬───────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  Valid    Invalid
    │         │
    │         ▼
    │    Redirect to /login
    │
    ▼
Allow access
    │
    ▼
┌────────────────────────┐
│  Server Component      │
│  - Get auth.uid()      │
│  - Fetch user data     │
│  - RLS enforces filter │
└────────────────────────┘
```

---

## Type Generation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Type Generation Flow                          │
└─────────────────────────────────────────────────────────────────┘

1. Database Schema
┌────────────────────────┐
│  PostgreSQL Tables     │
│  - transactions        │
│  - categories          │
│  - tags                │
│  - budgets             │
│  - profiles            │
└──────────┬─────────────┘
           │
           ▼
2. Supabase Introspection
┌─────────────────────────────────┐
│  $ npx supabase gen types...    │
│  - Reads schema                 │
│  - Generates TypeScript types   │
└──────────┬──────────────────────┘
           │
           ▼
3. Generated Types File
┌─────────────────────────────────┐
│  /src/types/database.types.ts   │
│                                 │
│  export interface Database {    │
│    public: {                    │
│      Tables: {                  │
│        transactions: {          │
│          Row: { ... }           │
│          Insert: { ... }        │
│          Update: { ... }        │
│        }                        │
│      }                          │
│    }                            │
│  }                              │
└──────────┬──────────────────────┘
           │
           ▼
4. Application Types
┌────────────────────────────────────┐
│  /src/types/index.ts               │
│                                    │
│  type Transaction =                │
│    Database['public']['Tables']   │
│      ['transactions']['Row']      │
│                                    │
│  type TransactionInsert =          │
│    Database['public']['Tables']   │
│      ['transactions']['Insert']   │
└──────────┬─────────────────────────┘
           │
           ▼
5. Used in Components
┌────────────────────────────────────┐
│  import type { Transaction }       │
│  from '@/types'                    │
│                                    │
│  interface Props {                 │
│    transaction: Transaction        │
│  }                                 │
└────────────────────────────────────┘

Benefits:
✅ Type safety from DB to UI
✅ Auto-complete in IDE
✅ Compile-time error checking
✅ Automatic sync with schema changes
```

---

## Summary

These diagrams provide visual representations of:
1. System architecture and component relationships
2. Data flow for read and write operations
3. Component composition patterns
4. Database schema and relationships
5. RLS policy enforcement flow
6. Security layers (defense in depth)
7. Development workflow
8. Budget calculation logic
9. Authentication flow
10. Type generation process

For detailed explanations, refer to `ARCHITECTURE.md` and `QUICK_REFERENCE.md`.

---

**Diagram Version**: 1.0
**Last Updated**: 2025-12-09
**Maintained By**: System Architect Agent