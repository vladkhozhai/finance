# Backend Quick Start Guide

## Setup Checklist

- [x] Install Supabase dependencies (@supabase/supabase-js, @supabase/ssr)
- [x] Create Supabase client files (client.ts, server.ts, middleware.ts)
- [x] Create validation schemas (shared, transaction, budget, category, tag)
- [x] Create Server Actions (transactions, budgets, categories, tags)
- [x] Create root middleware
- [x] Create database type definitions (placeholder)
- [x] Create environment variable validation

## Before You Start

1. **Set Up Supabase Project**
   ```bash
   # Visit https://app.supabase.com and create a new project
   # Copy the Project URL and API Keys
   ```

2. **Configure Environment Variables**
   ```bash
   # Copy .env.example to .env.local
   cp .env.example .env.local

   # Edit .env.local and add your Supabase credentials:
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Restart Development Server**
   ```bash
   npm run dev
   ```

## Usage Examples

### 1. Using Supabase Clients

#### Client Component (Browser)
```typescript
"use client";

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function MyClientComponent() {
  const supabase = createClient();
  const [data, setData] = useState(null);

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .limit(10);
      setData(data);
    }
    loadData();
  }, []);

  return <div>{/* render data */}</div>;
}
```

#### Server Component
```typescript
import { createClient } from '@/lib/supabase/server';

export default async function MyServerComponent() {
  const supabase = await createClient();

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, category:categories(*)')
    .order('date', { ascending: false })
    .limit(10);

  return (
    <div>
      {transactions?.map((tx) => (
        <div key={tx.id}>{tx.amount}</div>
      ))}
    </div>
  );
}
```

### 2. Calling Server Actions

#### From a Client Component
```typescript
"use client";

import { createTransaction } from '@/app/actions/transactions';
import { useState } from 'react';
import { toast } from 'sonner';

export default function TransactionForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);

    const result = await createTransaction({
      amount: Number(formData.get('amount')),
      categoryId: formData.get('categoryId') as string,
      date: formData.get('date') as string,
      description: formData.get('description') as string,
      tagIds: [], // Add tag IDs if needed
    });

    setLoading(false);

    if (result.success) {
      toast.success('Transaction created successfully!');
      // Reset form or navigate
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form action={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Transaction'}
      </button>
    </form>
  );
}
```

#### With React Hook Form
```typescript
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTransactionSchema } from '@/lib/validations/transaction';
import { createTransaction } from '@/app/actions/transactions';
import { toast } from 'sonner';

export default function TransactionFormWithRHF() {
  const form = useForm({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      amount: 0,
      categoryId: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      tagIds: [],
    },
  });

  async function onSubmit(data: any) {
    const result = await createTransaction(data);

    if (result.success) {
      toast.success('Transaction created!');
      form.reset();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* form fields with form.register() */}
    </form>
  );
}
```

### 3. Working with Validation Schemas

#### Validating Data
```typescript
import { createTransactionSchema } from '@/lib/validations/transaction';

// Valid data
const validData = {
  amount: 50.00,
  categoryId: '123e4567-e89b-12d3-a456-426614174000',
  date: '2024-01-15',
  description: 'Coffee',
  tagIds: [],
};

const result = createTransactionSchema.safeParse(validData);

if (result.success) {
  console.log('Valid data:', result.data);
} else {
  console.log('Validation errors:', result.error.errors);
}
```

#### Using ActionResult Type
```typescript
import { type ActionResult } from '@/lib/validations/shared';

async function handleAction() {
  const result: ActionResult<{ id: string }> = await createTransaction(data);

  if (result.success) {
    // TypeScript knows result.data exists and has type { id: string }
    console.log('Created ID:', result.data.id);
  } else {
    // TypeScript knows result.error exists and is a string
    console.log('Error:', result.error);
  }
}
```

### 4. Creating Custom Server Actions

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { success, error, type ActionResult } from "@/lib/validations/shared";

// 1. Define schema
const myActionSchema = z.object({
  field: z.string().min(1),
});

// 2. Define input type
type MyActionInput = z.infer<typeof myActionSchema>;

// 3. Implement action
export async function myAction(
  input: MyActionInput
): Promise<ActionResult<{ result: string }>> {
  try {
    // Validate
    const validated = myActionSchema.safeParse(input);
    if (!validated.success) {
      return error(validated.error.errors[0].message);
    }

    // Check auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized");
    }

    // Perform operations
    // ...

    // Revalidate
    revalidatePath('/path');

    return success({ result: 'done' });
  } catch (err) {
    console.error("Error in myAction:", err);
    return error("An unexpected error occurred");
  }
}
```

## Common Patterns

### Pattern 1: Loading Data in Server Components
```typescript
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Load user-specific data
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  return <div>{/* render categories */}</div>;
}
```

### Pattern 2: Handling Optimistic Updates
```typescript
"use client";

import { useOptimistic } from 'react';
import { deleteTransaction } from '@/app/actions/transactions';

export default function TransactionList({ transactions }) {
  const [optimisticTransactions, removeOptimistic] = useOptimistic(
    transactions,
    (state, id) => state.filter((t) => t.id !== id)
  );

  async function handleDelete(id: string) {
    // Update UI optimistically
    removeOptimistic(id);

    // Call server action
    const result = await deleteTransaction({ id });

    if (!result.success) {
      // Handle error - data will be reverted automatically
      toast.error(result.error);
    }
  }

  return (
    <div>
      {optimisticTransactions.map((tx) => (
        <div key={tx.id}>
          {tx.amount}
          <button onClick={() => handleDelete(tx.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

### Pattern 3: Real-time Subscriptions
```typescript
"use client";

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function RealtimeTransactions() {
  const supabase = createClient();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    // Load initial data
    supabase
      .from('transactions')
      .select('*')
      .then(({ data }) => setTransactions(data || []));

    // Subscribe to changes
    const channel = supabase
      .channel('transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTransactions((prev) => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setTransactions((prev) =>
              prev.map((t) => (t.id === payload.new.id ? payload.new : t))
            );
          } else if (payload.eventType === 'DELETE') {
            setTransactions((prev) =>
              prev.filter((t) => t.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return <div>{/* render transactions */}</div>;
}
```

## Available Server Actions

### Transactions
```typescript
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/app/actions/transactions';

// Create
await createTransaction({
  amount: 100,
  categoryId: 'uuid',
  date: '2024-01-01',
  description: 'Optional',
  tagIds: ['uuid1', 'uuid2'], // Optional
});

// Update
await updateTransaction({
  id: 'uuid',
  amount: 150, // Optional
  categoryId: 'new-uuid', // Optional
  // ... other optional fields
});

// Delete
await deleteTransaction({ id: 'uuid' });
```

### Budgets
```typescript
import {
  createBudget,
  updateBudget,
  deleteBudget,
} from '@/app/actions/budgets';

// Create (category-based)
await createBudget({
  amount: 1000,
  period: 'monthly',
  categoryId: 'uuid',
});

// Create (tag-based)
await createBudget({
  amount: 500,
  period: 'monthly',
  tagId: 'uuid',
});

// Update
await updateBudget({
  id: 'uuid',
  amount: 1200,
});

// Delete
await deleteBudget({ id: 'uuid' });
```

### Categories
```typescript
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/app/actions/categories';

// Create
await createCategory({
  name: 'Groceries',
  color: '#4CAF50',
  type: 'expense',
});

// Update
await updateCategory({
  id: 'uuid',
  name: 'Food & Groceries',
  color: '#66BB6A',
});

// Delete
await deleteCategory({ id: 'uuid' });
```

### Tags
```typescript
import {
  createTag,
  updateTag,
  deleteTag,
} from '@/app/actions/tags';

// Create (returns existing if already exists)
await createTag({ name: 'coffee' });

// Update
await updateTag({ id: 'uuid', name: 'espresso' });

// Delete
await deleteTag({ id: 'uuid' });
```

## Debugging Tips

### Check Authentication
```typescript
const supabase = await createClient();
const { data: { user }, error } = await supabase.auth.getUser();
console.log('Current user:', user);
console.log('Auth error:', error);
```

### Test Validation
```typescript
import { createTransactionSchema } from '@/lib/validations/transaction';

const result = createTransactionSchema.safeParse(yourData);
console.log('Valid:', result.success);
console.log('Errors:', result.success ? null : result.error.errors);
```

### Check RLS Policies
```sql
-- Run in Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'transactions';
```

### View Server Logs
```bash
# Development console shows Server Action errors
npm run dev
# Check browser console for client-side errors
# Check terminal for server-side errors
```

## Next Steps

1. **Set up database schema** in Supabase
2. **Generate types**: `npx supabase gen types typescript --project-id <id> > src/types/database.types.ts`
3. **Test Server Actions** with sample data
4. **Build UI components** that call the actions
5. **Add authentication** flows (login, signup, logout)

## Resources

- [BACKEND_SETUP_SUMMARY.md](./BACKEND_SETUP_SUMMARY.md) - Complete documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture details
- [.env.example](./.env.example) - Environment variable template
- [Supabase Docs](https://supabase.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Zod Documentation](https://zod.dev)