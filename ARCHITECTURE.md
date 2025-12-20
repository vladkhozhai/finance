# FinanceFlow - Architecture Blueprint

**Author**: System Architect Agent
**Date**: 2025-12-09
**Status**: Foundation Design v1.0

---

## Table of Contents
1. [Directory Structure](#directory-structure)
2. [Supabase Client Architecture](#supabase-client-architecture)
3. [Environment Variables](#environment-variables)
4. [Database Schema Architecture](#database-schema-architecture)
5. [Type System](#type-system)
6. [Security Architecture](#security-architecture)
7. [Development Workflow](#development-workflow)

---

## Directory Structure

### Complete Project Structure
```
finance/
├── .env.local                          # Environment variables (gitignored)
├── .env.example                        # Environment template (tracked)
├── supabase/                           # Supabase project files
│   ├── config.toml                     # Supabase CLI config
│   ├── seed.sql                        # Seed data for development
│   └── migrations/                     # Database migrations
│       ├── 20250101000001_initial_schema.sql
│       ├── 20250101000002_add_rls_policies.sql
│       └── 20250101000003_create_functions.sql
├── src/
│   ├── app/                            # Next.js App Router
│   │   ├── layout.tsx                  # Root layout
│   │   ├── page.tsx                    # Homepage (dashboard)
│   │   ├── globals.css                 # Global styles
│   │   ├── (auth)/                     # Auth route group
│   │   │   ├── login/
│   │   │   │   └── page.tsx           # Login page
│   │   │   └── signup/
│   │   │       └── page.tsx           # Signup page
│   │   ├── (dashboard)/                # Protected dashboard routes
│   │   │   ├── layout.tsx             # Dashboard layout with nav
│   │   │   ├── transactions/
│   │   │   │   ├── page.tsx           # Transactions list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # Transaction detail
│   │   │   ├── budgets/
│   │   │   │   ├── page.tsx           # Budgets list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # Budget detail
│   │   │   ├── categories/
│   │   │   │   └── page.tsx           # Categories management
│   │   │   └── tags/
│   │   │       └── page.tsx           # Tags management
│   │   ├── api/                        # API routes (if needed)
│   │   │   └── webhooks/
│   │   │       └── supabase/
│   │   │           └── route.ts       # Supabase webhooks
│   │   └── actions/                    # Server Actions (data mutations)
│   │       ├── transactions.ts         # Transaction CRUD
│   │       ├── budgets.ts             # Budget CRUD
│   │       ├── categories.ts          # Category CRUD
│   │       ├── tags.ts                # Tag CRUD
│   │       └── profiles.ts            # Profile management
│   ├── components/                     # React components
│   │   ├── ui/                        # Shadcn/UI components (primitives)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── select.tsx
│   │   │   └── toast.tsx
│   │   ├── features/                  # Feature-specific components
│   │   │   ├── transactions/
│   │   │   │   ├── transaction-form.tsx
│   │   │   │   ├── transaction-list.tsx
│   │   │   │   └── transaction-card.tsx
│   │   │   ├── budgets/
│   │   │   │   ├── budget-card.tsx
│   │   │   │   ├── budget-form.tsx
│   │   │   │   ├── budget-progress.tsx
│   │   │   │   └── budget-list.tsx
│   │   │   ├── categories/
│   │   │   │   ├── category-select.tsx
│   │   │   │   ├── category-badge.tsx
│   │   │   │   └── category-form.tsx
│   │   │   ├── tags/
│   │   │   │   ├── tag-input.tsx      # Multi-select tag input
│   │   │   │   ├── tag-badge.tsx
│   │   │   │   └── tag-form.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── balance-summary.tsx
│   │   │   │   ├── active-budgets.tsx
│   │   │   │   └── expense-chart.tsx
│   │   │   └── auth/
│   │   │       ├── login-form.tsx
│   │   │       └── signup-form.tsx
│   │   ├── layout/                    # Layout components
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── nav.tsx
│   │   └── providers/                 # React context providers
│   │       ├── auth-provider.tsx      # Auth state management
│   │       └── toast-provider.tsx     # Toast notifications
│   ├── lib/                           # Utilities and configurations
│   │   ├── supabase/                  # Supabase clients
│   │   │   ├── client.ts              # Browser client (for Client Components)
│   │   │   ├── server.ts              # Server client (for Server Components)
│   │   │   └── middleware.ts          # Middleware client (for auth)
│   │   ├── utils/                     # Utility functions
│   │   │   ├── cn.ts                  # className utility (clsx + tailwind-merge)
│   │   │   ├── currency.ts            # Currency formatting
│   │   │   ├── date.ts                # Date formatting and manipulation
│   │   │   └── calculations.ts        # Budget/transaction calculations
│   │   ├── validations/               # Zod schemas for validation
│   │   │   ├── transaction.ts
│   │   │   ├── budget.ts
│   │   │   ├── category.ts
│   │   │   ├── tag.ts
│   │   │   └── profile.ts
│   │   ├── constants/                 # Application constants
│   │   │   ├── routes.ts              # Route paths
│   │   │   ├── colors.ts              # Category colors
│   │   │   └── currencies.ts          # Supported currencies
│   │   └── hooks/                     # Custom React hooks
│   │       ├── use-user.ts            # Get current user
│   │       ├── use-transactions.ts    # Transaction queries
│   │       ├── use-budgets.ts         # Budget queries
│   │       └── use-toast.ts           # Toast notifications
│   └── types/                         # TypeScript type definitions
│       ├── database.types.ts          # Generated from Supabase schema
│       ├── supabase.ts                # Supabase client types
│       └── index.ts                   # Shared types and interfaces
└── middleware.ts                      # Next.js middleware (auth checks)
```

### Directory Organization Principles

#### `/src/app/actions/` - Server Actions
- **Purpose**: Handle all data mutations (CREATE, UPDATE, DELETE)
- **Pattern**: One file per resource (transactions.ts, budgets.ts, etc.)
- **Security**: Always validate with RLS and Zod schemas
- **Example**:
  ```typescript
  'use server'

  import { createServerClient } from '@/lib/supabase/server'
  import { transactionSchema } from '@/lib/validations/transaction'
  import { revalidatePath } from 'next/cache'

  export async function createTransaction(formData: FormData) {
    const supabase = createServerClient()
    // ... validation and mutation logic
    revalidatePath('/transactions')
  }
  ```

#### `/src/components/ui/` - UI Primitives
- **Purpose**: Reusable Shadcn/UI components (Radix UI wrappers)
- **Pattern**: One component per file, lower-case-kebab naming
- **Note**: These are copied from Shadcn/UI CLI, minimal customization

#### `/src/components/features/` - Feature Components
- **Purpose**: Business logic components organized by feature domain
- **Pattern**: Grouped by feature (transactions/, budgets/, tags/, etc.)
- **Composition**: Use UI primitives from `/components/ui/`

#### `/src/lib/supabase/` - Supabase Clients
- **Purpose**: Singleton Supabase client instances for different contexts
- **Files**:
  - `client.ts` - Browser client (Client Components)
  - `server.ts` - Server client (Server Components, Server Actions)
  - `middleware.ts` - Middleware client (auth verification)

#### `/src/lib/validations/` - Zod Schemas
- **Purpose**: Type-safe validation for forms and Server Actions
- **Pattern**: One schema file per resource
- **Usage**: Validate user input before database operations

---

## Supabase Client Architecture

### Client Initialization Strategy

FinanceFlow uses three distinct Supabase client instances based on execution context:

#### 1. Browser Client (`/src/lib/supabase/client.ts`)
**Context**: Client Components (`"use client"`)
**Use Cases**: Client-side queries, Realtime subscriptions, client-side auth

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Usage Pattern**:
```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function TransactionList() {
  const supabase = createClient()
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    supabase
      .from('transactions')
      .select('*')
      .then(({ data }) => setTransactions(data))
  }, [])

  return <div>{/* render transactions */}</div>
}
```

#### 2. Server Client (`/src/lib/supabase/server.ts`)
**Context**: Server Components, Server Actions, Route Handlers
**Use Cases**: Server-side data fetching, mutations, admin operations

```typescript
import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export async function createServerClient() {
  const cookieStore = await cookies()

  return createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // Handle cookie errors in Server Components
          }
        },
      },
    }
  )
}
```

**Usage Pattern (Server Component)**:
```typescript
import { createServerClient } from '@/lib/supabase/server'

export default async function TransactionsPage() {
  const supabase = await createServerClient()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, categories(*)')
    .order('date', { ascending: false })

  return <TransactionList transactions={transactions} />
}
```

**Usage Pattern (Server Action)**:
```typescript
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteTransaction(id: string) {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)

  if (error) throw error

  revalidatePath('/transactions')
}
```

#### 3. Middleware Client (`/src/lib/supabase/middleware.ts`)
**Context**: Next.js Middleware (`middleware.ts`)
**Use Cases**: Auth verification, protected routes, session refresh

```typescript
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

### Client Selection Guide

| Context | Client | Import |
|---------|--------|--------|
| Client Component | Browser Client | `@/lib/supabase/client` |
| Server Component | Server Client | `@/lib/supabase/server` |
| Server Action | Server Client | `@/lib/supabase/server` |
| Route Handler | Server Client | `@/lib/supabase/server` |
| Middleware | Middleware Client | `@/lib/supabase/middleware` |

### RLS and auth.uid() Usage

All database tables MUST have Row Level Security (RLS) enabled. The `auth.uid()` function is used in RLS policies to ensure users can only access their own data.

**Example RLS Policy**:
```sql
-- Users can only view their own transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only create transactions for themselves
CREATE POLICY "Users can create own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Server Action Pattern with RLS**:
```typescript
export async function createTransaction(data: TransactionInput) {
  const supabase = await createServerClient()

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // RLS automatically enforces user_id = auth.uid()
  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({
      ...data,
      user_id: user.id, // Explicit user_id assignment
    })
    .select()
    .single()

  if (error) throw error
  return transaction
}
```

---

## Environment Variables

### Development Setup

#### `.env.local` (gitignored, developer-specific)
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Supabase Service Role (for admin operations, NEVER expose to client)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database Direct Connection (for migrations, local development)
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Supabase Studio Access
SUPABASE_ACCESS_TOKEN=your-access-token-here
```

#### `.env.example` (tracked in git, template for developers)
```bash
# Supabase Configuration
# Get these from: https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Supabase Service Role (for admin operations)
# WARNING: Keep this secret, never expose to client
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database Direct Connection (for migrations)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Environment Variable Usage Rules

#### Public Variables (NEXT_PUBLIC_*)
- Exposed to the browser
- Safe for client-side code
- Used in Client Components
- **Examples**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Private Variables (no prefix)
- Server-side only
- Never exposed to browser
- Used in Server Components, Server Actions, API Routes
- **Examples**: `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`

#### Variable Access Pattern
```typescript
// Client Component
'use client'
export function ClientComponent() {
  // ✅ OK - public variable
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL

  // ❌ ERROR - private variable not accessible in client
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // undefined
}

// Server Component
export default async function ServerComponent() {
  // ✅ OK - can access both public and private
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
}
```

### Production Environment Variables

For production deployments (Vercel, Netlify, etc.), configure the same variables in the hosting platform's environment settings. Ensure `NEXT_PUBLIC_APP_URL` is updated to the production domain.

---

## Database Schema Architecture

### Schema Overview

FinanceFlow uses PostgreSQL (via Supabase) with the following tables:

1. **profiles** - User preferences and settings
2. **categories** - User-defined transaction categories
3. **tags** - Flexible labeling system
4. **transactions** - Income and expense records
5. **transaction_tags** - Many-to-many junction table
6. **budgets** - Monthly spending/income limits

### Migration Strategy

**Location**: `/supabase/migrations/`
**Naming Convention**: `YYYYMMDDHHMMSS_description.sql`
**Execution Order**: Chronological by filename

#### Initial Schema Migration
**File**: `/supabase/migrations/20250101000001_initial_schema.sql`

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, name)
);

-- Tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, name)
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction Tags junction table
CREATE TABLE transaction_tags (
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (transaction_id, tag_id)
);

-- Budgets table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('monthly')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Constraint: Either category_id OR tag_id must be set (not both, not neither)
  CHECK (
    (category_id IS NOT NULL AND tag_id IS NULL) OR
    (category_id IS NULL AND tag_id IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_transaction_tags_transaction_id ON transaction_tags(transaction_id);
CREATE INDEX idx_transaction_tags_tag_id ON transaction_tags(tag_id);
```

#### RLS Policies Migration
**File**: `/supabase/migrations/20250101000002_add_rls_policies.sql`

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Categories policies
CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- Tags policies
CREATE POLICY "Users can view own tags"
  ON tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
  ON tags FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
  ON tags FOR DELETE
  USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Transaction Tags policies (inherit from transaction ownership)
CREATE POLICY "Users can manage own transaction tags"
  ON transaction_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = transaction_tags.transaction_id
        AND transactions.user_id = auth.uid()
    )
  );

-- Budgets policies
CREATE POLICY "Users can view own budgets"
  ON budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own budgets"
  ON budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON budgets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON budgets FOR DELETE
  USING (auth.uid() = user_id);
```

#### SQL Functions Migration
**File**: `/supabase/migrations/20250101000003_create_functions.sql`

```sql
-- Function to calculate budget spent amount
CREATE OR REPLACE FUNCTION calculate_budget_spent(
  p_user_id UUID,
  p_category_id UUID,
  p_tag_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS NUMERIC AS $$
BEGIN
  IF p_category_id IS NOT NULL THEN
    -- Calculate by category
    RETURN (
      SELECT COALESCE(SUM(amount), 0)
      FROM transactions
      WHERE user_id = p_user_id
        AND category_id = p_category_id
        AND date BETWEEN p_start_date AND p_end_date
    );
  ELSIF p_tag_id IS NOT NULL THEN
    -- Calculate by tag
    RETURN (
      SELECT COALESCE(SUM(t.amount), 0)
      FROM transactions t
      JOIN transaction_tags tt ON t.id = tt.transaction_id
      WHERE t.user_id = p_user_id
        AND tt.tag_id = p_tag_id
        AND t.date BETWEEN p_start_date AND p_end_date
    );
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's total balance
CREATE OR REPLACE FUNCTION get_user_balance(p_user_id UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(
      CASE
        WHEN c.type = 'income' THEN t.amount
        WHEN c.type = 'expense' THEN -t.amount
        ELSE 0
      END
    ), 0)
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Database Constraints Philosophy

1. **Foreign Key Cascades**:
   - `ON DELETE CASCADE` - For owned data (transactions own transaction_tags)
   - `ON DELETE RESTRICT` - For referenced data (prevent category deletion if in use)

2. **Unique Constraints**:
   - Enforce at DB level to prevent race conditions
   - Example: `(user_id, name)` for categories and tags

3. **Check Constraints**:
   - Validate data integrity at DB level
   - Example: Budget must have either category_id OR tag_id (exclusive)

---

## Type System

### Generated Database Types

**Location**: `/src/types/database.types.ts`
**Generation**: Automated via Supabase CLI
**Frequency**: After every schema migration

#### Generate Types Command
```bash
npx supabase gen types typescript --local > src/types/database.types.ts
```

#### Generated Type Structure
```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      transactions: {
        Row: {
          id: string
          user_id: string
          category_id: string
          amount: number
          date: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          amount: number
          date?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          amount?: number
          date?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // ... other tables
    }
    Views: {
      // ... views
    }
    Functions: {
      calculate_budget_spent: {
        Args: {
          p_user_id: string
          p_category_id: string
          p_tag_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: number
      }
      // ... other functions
    }
  }
}
```

### Application-Level Types

**Location**: `/src/types/index.ts`

```typescript
import type { Database } from './database.types'

// Database table types
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']

export type Tag = Database['public']['Tables']['tags']['Row']
export type TagInsert = Database['public']['Tables']['tags']['Insert']

export type Budget = Database['public']['Tables']['budgets']['Row']
export type BudgetInsert = Database['public']['Tables']['budgets']['Insert']

// Extended types with relations
export type TransactionWithRelations = Transaction & {
  category: Category
  tags: Tag[]
}

export type BudgetWithRelations = Budget & {
  category?: Category | null
  tag?: Tag | null
}

// UI-specific types
export type BudgetProgress = {
  budget: BudgetWithRelations
  spent: number
  remaining: number
  percentageUsed: number
  isOverspent: boolean
}
```

### Type Usage in Components

```typescript
import type { Transaction, Category, Tag } from '@/types'

interface TransactionFormProps {
  transaction?: Transaction
  categories: Category[]
  tags: Tag[]
  onSubmit: (data: TransactionInsert) => Promise<void>
}
```

---

## Security Architecture

### Authentication Flow

1. **User Signs Up**:
   - Supabase Auth creates user in `auth.users`
   - Trigger creates corresponding `profiles` row

2. **User Logs In**:
   - Supabase sets auth cookies
   - Middleware verifies session on protected routes

3. **Data Access**:
   - RLS policies check `auth.uid() = user_id`
   - Users can only see/modify their own data

### RLS Policy Testing Checklist

For each table, verify:
- [ ] SELECT: Users can only see their own records
- [ ] INSERT: Users can only create records with their own user_id
- [ ] UPDATE: Users can only modify their own records
- [ ] DELETE: Users can only delete their own records
- [ ] Junction tables: Inherit ownership from parent table

### Security Best Practices

1. **Never Trust Client Input**:
   - Always validate with Zod schemas in Server Actions
   - Use parameterized queries (Supabase handles this)

2. **Use RLS for All User Data**:
   - Enable RLS on every table with user_id
   - Test policies with multiple users

3. **Keep Service Role Key Private**:
   - Never expose in client code
   - Only use in trusted server-side operations

4. **Validate Foreign Key Ownership**:
   ```typescript
   // Before linking transaction to category, verify user owns the category
   const { data: category } = await supabase
     .from('categories')
     .select('id')
     .eq('id', categoryId)
     .eq('user_id', user.id)
     .single()

   if (!category) throw new Error('Category not found or unauthorized')
   ```

---

## Development Workflow

### Local Development Setup

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Initialize Supabase Project**:
   ```bash
   npx supabase init
   npx supabase login
   npx supabase link --project-ref your-project-ref
   ```

3. **Pull Remote Schema** (if exists):
   ```bash
   npx supabase db pull
   ```

4. **Start Local Supabase**:
   ```bash
   npx supabase start
   ```

5. **Configure Environment**:
   - Copy `.env.example` to `.env.local`
   - Update with local Supabase credentials (from `npx supabase status`)

6. **Generate Types**:
   ```bash
   npm run types:generate
   ```

### Migration Workflow

#### Creating a New Migration
```bash
# Create empty migration file
npx supabase migration new description_of_change

# OR generate from schema diff
npx supabase db diff --schema public -f description_of_change
```

#### Applying Migrations
```bash
# Apply to local database
npx supabase db reset

# Apply to remote (production)
npx supabase db push
```

#### Type Generation After Migration
```bash
# Local schema
npx supabase gen types typescript --local > src/types/database.types.ts

# Remote schema
npx supabase gen types typescript --project-id your-project-ref > src/types/database.types.ts
```

### Testing RLS Policies

Use Supabase SQL Editor to test policies:

```sql
-- Simulate user context
SELECT auth.uid(); -- Should return NULL

-- Set user context
SET request.jwt.claim.sub = 'user-uuid-here';

-- Test query as that user
SELECT * FROM transactions;
```

### Seed Data for Development

**File**: `/supabase/seed.sql`

```sql
-- Insert test user profile
INSERT INTO profiles (id, currency)
VALUES ('test-user-uuid', 'USD');

-- Insert test categories
INSERT INTO categories (user_id, name, color, type)
VALUES
  ('test-user-uuid', 'Groceries', '#10b981', 'expense'),
  ('test-user-uuid', 'Salary', '#3b82f6', 'income');

-- Insert test tags
INSERT INTO tags (user_id, name)
VALUES
  ('test-user-uuid', 'coffee'),
  ('test-user-uuid', 'travel');

-- Insert test transactions
INSERT INTO transactions (user_id, category_id, amount, date, description)
VALUES
  ('test-user-uuid', (SELECT id FROM categories WHERE name = 'Groceries' LIMIT 1), 45.50, '2025-01-01', 'Weekly groceries');
```

Apply seed data:
```bash
npx supabase db reset --seed
```

---

## Summary for Backend/Frontend Developers

### Backend Developer (Agent 03) - Key Takeaways

1. **Server Actions Location**: `/src/app/actions/[resource].ts`
2. **Always Use Server Client**: `import { createServerClient } from '@/lib/supabase/server'`
3. **Validation First**: Validate with Zod schemas from `/src/lib/validations/`
4. **RLS Enforced**: Trust RLS policies, but always set `user_id` explicitly
5. **Revalidate Paths**: Use `revalidatePath()` after mutations to refresh cache

### Frontend Developer (Agent 04) - Key Takeaways

1. **Component Organization**: Use `/src/components/features/[feature]/` for business logic
2. **UI Primitives**: Use Shadcn components from `/src/components/ui/`
3. **Client-Side Queries**: Use browser client from `@/lib/supabase/client`
4. **Types**: Import from `@/types` for type-safe props
5. **Server Actions**: Import from `@/app/actions/` for mutations

### QA Engineer (Agent 05) - Key Takeaways

1. **RLS Testing**: Verify users can't access other users' data
2. **Constraint Testing**: Test unique constraints, check constraints
3. **Foreign Key Testing**: Test cascade behaviors (delete category with transactions)
4. **Budget Calculation**: Verify spent amounts calculated correctly
5. **Tag Flexibility**: Test multi-select tag creation and assignment

---

## Next Steps

1. **Backend Developer**: Create Supabase client files and initial Server Actions
2. **Frontend Developer**: Set up Shadcn/UI components and layout structure
3. **System Architect**: Create initial database migrations and push to Supabase
4. **QA Engineer**: Prepare test scenarios for RLS policies and data integrity

---

**Document Version**: 1.0
**Last Updated**: 2025-12-09
**Maintained By**: System Architect Agent