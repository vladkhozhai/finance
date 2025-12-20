# FinanceFlow - Quick Reference Guide

**TL;DR**: Essential patterns and decisions for rapid development

---

## Project Stack at a Glance

```
Framework:   Next.js 16+ (App Router)
Language:    TypeScript (strict mode)
Styling:     Tailwind CSS v4 + Shadcn/UI
Backend:     Supabase (PostgreSQL + Auth + Realtime)
Mutations:   Server Actions
State:       Server Components (default) + Client Components (explicit)
Validation:  Zod schemas
```

---

## Core Architectural Decisions

### 1. Data Fetching Strategy

**Pattern**: Server Components by default, Client Components only when needed

```typescript
// ✅ PREFERRED: Server Component (default)
// File: /src/app/(dashboard)/transactions/page.tsx
import { createServerClient } from '@/lib/supabase/server'

export default async function TransactionsPage() {
  const supabase = await createServerClient()
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, categories(*)')

  return <TransactionList transactions={transactions} />
}

// ⚠️ USE SPARINGLY: Client Component (when interactivity needed)
// File: /src/components/features/transactions/transaction-form.tsx
'use client'

import { createTransaction } from '@/app/actions/transactions'

export function TransactionForm() {
  async function handleSubmit(formData: FormData) {
    await createTransaction(formData)
  }

  return <form action={handleSubmit}>...</form>
}
```

### 2. Data Mutation Pattern

**Pattern**: Always use Server Actions for CREATE/UPDATE/DELETE

```typescript
// File: /src/app/actions/transactions.ts
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { transactionSchema } from '@/lib/validations/transaction'
import { revalidatePath } from 'next/cache'

export async function createTransaction(formData: FormData) {
  // 1. Get authenticated user
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 2. Validate input with Zod
  const validated = transactionSchema.parse({
    category_id: formData.get('category_id'),
    amount: Number(formData.get('amount')),
    date: formData.get('date'),
    description: formData.get('description'),
  })

  // 3. Insert with explicit user_id (RLS will enforce)
  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...validated, user_id: user.id })
    .select()
    .single()

  if (error) throw error

  // 4. Revalidate cache to refresh UI
  revalidatePath('/transactions')

  return data
}
```

### 3. RLS Security Pattern

**Pattern**: Enable RLS on all user tables, use auth.uid() in policies

```sql
-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only create data for themselves
CREATE POLICY "Users can create own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 4. Type Safety Pattern

**Pattern**: Generate types from Supabase schema, extend as needed

```typescript
// /src/types/database.types.ts - Generated (DO NOT EDIT)
export interface Database { ... }

// /src/types/index.ts - Application types
import type { Database } from './database.types'

export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']

// Extended types with relations
export type TransactionWithCategory = Transaction & {
  category: Category
}
```

---

## Quick Decision Matrix

### When to use what?

| Task | Solution | Import |
|------|----------|--------|
| Fetch data server-side | Server Component | `@/lib/supabase/server` |
| Fetch data client-side | Client Component + useEffect | `@/lib/supabase/client` |
| Create/Update/Delete | Server Action | `@/lib/supabase/server` |
| Validate form input | Zod schema | `@/lib/validations/*` |
| Protect routes | Middleware | `@/lib/supabase/middleware` |
| Format currency | Utility function | `@/lib/utils/currency` |
| Reusable UI component | Shadcn/UI | `@/components/ui/*` |
| Business logic component | Feature component | `@/components/features/*` |

### Which Supabase client should I use?

| Context | Client File | When to Use |
|---------|-------------|-------------|
| Server Component | `@/lib/supabase/server` | Default data fetching |
| Server Action | `@/lib/supabase/server` | Mutations (CREATE/UPDATE/DELETE) |
| Client Component | `@/lib/supabase/client` | Client-side queries, Realtime |
| Middleware | `@/lib/supabase/middleware` | Auth checks, route protection |

---

## Essential Commands

```bash
# Development
npm run dev                   # Start dev server (http://localhost:3000)
npm run lint                  # Check code quality with Biome
npm run format                # Format code with Biome

# Supabase
npx supabase start            # Start local Supabase
npx supabase stop             # Stop local Supabase
npx supabase db reset         # Reset local DB and apply migrations
npx supabase db push          # Push migrations to remote
npx supabase gen types typescript --local > src/types/database.types.ts  # Generate types

# Database
npx supabase migration new description    # Create new migration
npx supabase db diff -f migration_name   # Generate migration from schema diff
```

---

## Common Patterns Cheat Sheet

### 1. Creating a Protected Page

```typescript
// /src/app/(dashboard)/transactions/page.tsx
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function TransactionsPage() {
  const supabase = await createServerClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch data (RLS enforces user_id = auth.uid())
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, categories(*)')
    .order('date', { ascending: false })

  return <TransactionList transactions={transactions} />
}
```

### 2. Creating a Form with Server Action

```typescript
// /src/components/features/transactions/transaction-form.tsx
'use client'

import { createTransaction } from '@/app/actions/transactions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function TransactionForm({ categories }) {
  return (
    <form action={createTransaction}>
      <Input name="amount" type="number" required />
      <Input name="date" type="date" required />
      <Input name="description" />
      <select name="category_id" required>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
      <Button type="submit">Create Transaction</Button>
    </form>
  )
}
```

### 3. Budget Card with Progress Bar

```typescript
// /src/components/features/budgets/budget-card.tsx
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'

interface BudgetCardProps {
  budget: {
    amount: number
    category?: { name: string }
    tag?: { name: string }
  }
  spent: number
}

export function BudgetCard({ budget, spent }: BudgetCardProps) {
  const percentage = (spent / budget.amount) * 100
  const isOverspent = spent > budget.amount

  return (
    <Card>
      <h3>{budget.category?.name || budget.tag?.name}</h3>
      <p>${spent.toFixed(2)} / ${budget.amount.toFixed(2)}</p>
      <Progress
        value={percentage}
        className={isOverspent ? 'bg-red-500' : 'bg-green-500'}
      />
    </Card>
  )
}
```

### 4. Tag Multi-Select Input

```typescript
// /src/components/features/tags/tag-input.tsx
'use client'

import { useState } from 'react'
import { createTag } from '@/app/actions/tags'

export function TagInput({ availableTags, selectedTagIds, onChange }) {
  const [inputValue, setInputValue] = useState('')

  async function handleCreateTag() {
    const newTag = await createTag({ name: inputValue })
    onChange([...selectedTagIds, newTag.id])
    setInputValue('')
  }

  return (
    <div>
      {/* Render selected tags */}
      {availableTags
        .filter(tag => selectedTagIds.includes(tag.id))
        .map(tag => (
          <span key={tag.id}>{tag.name}</span>
        ))}

      {/* Input for new/existing tags */}
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <button onClick={handleCreateTag}>Create "{inputValue}"</button>
    </div>
  )
}
```

---

## Database Query Patterns

### Basic CRUD

```typescript
// SELECT with RLS (only returns user's data)
const { data } = await supabase
  .from('transactions')
  .select('*')

// SELECT with relations
const { data } = await supabase
  .from('transactions')
  .select('*, categories(*), transaction_tags(tags(*))')

// INSERT
const { data } = await supabase
  .from('transactions')
  .insert({ user_id: user.id, category_id, amount, date })
  .select()
  .single()

// UPDATE
const { data } = await supabase
  .from('transactions')
  .update({ amount: 100 })
  .eq('id', transactionId)
  .select()
  .single()

// DELETE
const { error } = await supabase
  .from('transactions')
  .delete()
  .eq('id', transactionId)
```

### Budget Spent Calculation

```typescript
// Call SQL function for budget spent amount
const { data: spent } = await supabase
  .rpc('calculate_budget_spent', {
    p_user_id: user.id,
    p_category_id: budget.category_id,
    p_tag_id: budget.tag_id,
    p_start_date: '2025-01-01',
    p_end_date: '2025-01-31',
  })
```

---

## Component Composition Pattern

### UI Primitives + Feature Components

```typescript
// ❌ DON'T: Put business logic in UI components
// /src/components/ui/transaction-card.tsx
export function TransactionCard({ transaction }) {
  // ❌ Avoid fetching data or business logic here
}

// ✅ DO: Compose UI components in feature components
// /src/components/features/transactions/transaction-card.tsx
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/currency'

export function TransactionCard({ transaction }) {
  return (
    <Card>
      <h3>{transaction.description}</h3>
      <p>{formatCurrency(transaction.amount)}</p>
      <Badge color={transaction.category.color}>
        {transaction.category.name}
      </Badge>
    </Card>
  )
}
```

---

## Environment Variables Quick Reference

```bash
# Public (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Private (server-only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
DATABASE_URL=postgresql://postgres:password@localhost:54322/postgres
```

**Access Rules**:
- `NEXT_PUBLIC_*` - Accessible in both server and client
- No prefix - Server-side only (Server Components, Server Actions)

---

## Debugging Checklist

### Auth Issues
- [ ] Check if user is authenticated: `const { data: { user } } = await supabase.auth.getUser()`
- [ ] Verify RLS policies are enabled: `ALTER TABLE x ENABLE ROW LEVEL SECURITY`
- [ ] Check if `user_id` is set correctly in INSERT operations

### Data Not Showing
- [ ] Verify RLS policies allow SELECT for current user
- [ ] Check if `auth.uid()` matches `user_id` in database
- [ ] Use Supabase Studio to test queries with user context

### Type Errors
- [ ] Regenerate types: `npx supabase gen types typescript --local > src/types/database.types.ts`
- [ ] Check if schema changes have been applied
- [ ] Verify import paths are correct (`@/types`)

### Server Action Not Working
- [ ] Ensure file has `'use server'` directive at top
- [ ] Verify `revalidatePath()` is called after mutations
- [ ] Check if Zod validation is passing
- [ ] Confirm user is authenticated

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `/src/lib/supabase/client.ts` | Browser Supabase client |
| `/src/lib/supabase/server.ts` | Server Supabase client |
| `/src/app/actions/*.ts` | Server Actions (mutations) |
| `/src/types/database.types.ts` | Generated DB types (DO NOT EDIT) |
| `/src/types/index.ts` | Application types |
| `/supabase/migrations/*.sql` | Database migrations |
| `middleware.ts` | Auth middleware (route protection) |
| `.env.local` | Environment variables (gitignored) |

---

## Migration Workflow Summary

```bash
# 1. Create migration
npx supabase migration new add_column_to_transactions

# 2. Edit migration file
# /supabase/migrations/20250109123456_add_column_to_transactions.sql
ALTER TABLE transactions ADD COLUMN notes TEXT;

# 3. Apply migration locally
npx supabase db reset

# 4. Generate types
npx supabase gen types typescript --local > src/types/database.types.ts

# 5. Push to production
npx supabase db push
```

---

## Testing RLS Policies

```sql
-- In Supabase SQL Editor

-- 1. Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- 2. Test as specific user
SET request.jwt.claim.sub = 'user-uuid-here';

-- 3. Run query (should only return that user's data)
SELECT * FROM transactions;

-- 4. Reset context
RESET request.jwt.claim.sub;
```

---

## File Structure Summary

```
src/
├── app/
│   ├── (auth)/              # Login, signup pages
│   ├── (dashboard)/         # Protected routes
│   └── actions/             # Server Actions (mutations)
├── components/
│   ├── ui/                  # Shadcn/UI primitives
│   ├── features/            # Business logic components
│   ├── layout/              # Header, sidebar, nav
│   └── providers/           # React Context providers
├── lib/
│   ├── supabase/            # Supabase clients
│   ├── utils/               # Helper functions
│   ├── validations/         # Zod schemas
│   ├── constants/           # App constants
│   └── hooks/               # Custom React hooks
└── types/
    ├── database.types.ts    # Generated from schema
    └── index.ts             # Application types
```

---

**Quick Reference Version**: 1.0
**Last Updated**: 2025-12-09
**For Full Details**: See `ARCHITECTURE.md`