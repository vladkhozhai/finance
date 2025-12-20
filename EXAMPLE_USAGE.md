# Backend Usage Examples

Complete examples showing how to use the FinanceFlow backend infrastructure.

## Table of Contents
1. [Server Actions Usage](#server-actions-usage)
2. [Client Component Integration](#client-component-integration)
3. [Server Component Integration](#server-component-integration)
4. [Form Handling](#form-handling)
5. [Real-time Updates](#real-time-updates)

---

## Server Actions Usage

### Creating a Transaction

```typescript
"use client";

import { createTransaction } from '@/app/actions/transactions';
import { toast } from 'sonner';

export default function CreateTransactionExample() {
  async function handleCreate() {
    const result = await createTransaction({
      amount: 50.00,
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
      date: '2024-01-15',
      description: 'Morning coffee',
      tagIds: ['tag-uuid-1', 'tag-uuid-2'],
    });

    if (result.success) {
      toast.success(`Transaction created with ID: ${result.data.id}`);
    } else {
      toast.error(result.error);
    }
  }

  return <button onClick={handleCreate}>Create Transaction</button>;
}
```

### Creating a Budget

```typescript
"use client";

import { createBudget } from '@/app/actions/budgets';
import { toast } from 'sonner';

// Category-based budget
async function createCategoryBudget() {
  const result = await createBudget({
    amount: 1000,
    period: 'monthly',
    categoryId: 'category-uuid',
  });

  if (result.success) {
    toast.success('Budget created!');
  } else {
    toast.error(result.error);
  }
}

// Tag-based budget
async function createTagBudget() {
  const result = await createBudget({
    amount: 500,
    period: 'monthly',
    tagId: 'tag-uuid',
  });

  if (result.success) {
    toast.success('Budget created!');
  } else {
    toast.error(result.error);
  }
}
```

### Creating Categories and Tags

```typescript
"use client";

import { createCategory } from '@/app/actions/categories';
import { createTag } from '@/app/actions/tags';

// Create category
async function createNewCategory() {
  const result = await createCategory({
    name: 'Groceries',
    color: '#4CAF50',
    type: 'expense',
  });

  if (result.success) {
    console.log('Category ID:', result.data.id);
  }
}

// Create tag (or get existing)
async function createNewTag() {
  const result = await createTag({
    name: 'coffee', // Automatically normalized to lowercase
  });

  if (result.success) {
    console.log('Tag ID:', result.data.id);
    console.log('Tag Name:', result.data.name);
  }
}
```

---

## Client Component Integration

### Complete Transaction Form with React Hook Form

```typescript
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTransactionSchema } from '@/lib/validations/transaction';
import { createTransaction } from '@/app/actions/transactions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';

export default function TransactionForm({ categories, tags }) {
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

  async function onSubmit(data) {
    const result = await createTransaction(data);

    if (result.success) {
      toast.success('Transaction created successfully!');
      form.reset();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <select {...field}>
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Input placeholder="What was this for?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Creating...' : 'Create Transaction'}
        </Button>
      </form>
    </Form>
  );
}
```

### Transaction List with Delete

```typescript
"use client";

import { useState } from 'react';
import { deleteTransaction } from '@/app/actions/transactions';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function TransactionList({ initialTransactions }) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [deleting, setDeleting] = useState(null);

  async function handleDelete(id) {
    setDeleting(id);

    const result = await deleteTransaction({ id });

    if (result.success) {
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
      toast.success('Transaction deleted');
    } else {
      toast.error(result.error);
    }

    setDeleting(null);
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center justify-between p-4 border rounded"
        >
          <div>
            <p className="font-semibold">${tx.amount.toFixed(2)}</p>
            <p className="text-sm text-gray-500">{tx.description}</p>
            <p className="text-xs text-gray-400">{tx.date}</p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(tx.id)}
            disabled={deleting === tx.id}
          >
            {deleting === tx.id ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      ))}
    </div>
  );
}
```

---

## Server Component Integration

### Loading Transactions on Server

```typescript
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TransactionList from '@/components/transactions/transaction-list';

export default async function TransactionsPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Load transactions with related data
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      *,
      category:categories(*),
      tags:transaction_tags(tag:tags(*))
    `)
    .order('date', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error loading transactions:', error);
    return <div>Error loading transactions</div>;
  }

  return (
    <div>
      <h1>Your Transactions</h1>
      <TransactionList initialTransactions={transactions} />
    </div>
  );
}
```

### Dashboard with Budget Progress

```typescript
import { createClient } from '@/lib/supabase/server';
import { BudgetCard } from '@/components/budgets/budget-card';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Load budgets
  const { data: budgets } = await supabase
    .from('budgets')
    .select(`
      *,
      category:categories(*),
      tag:tags(*)
    `)
    .eq('period', 'monthly');

  // Calculate spent amounts for each budget
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const budgetsWithProgress = await Promise.all(
    budgets.map(async (budget) => {
      let spent = 0;

      if (budget.category_id) {
        // Sum transactions by category
        const { data } = await supabase
          .from('transactions')
          .select('amount')
          .eq('category_id', budget.category_id)
          .gte('date', `${currentMonth}-01`)
          .lt('date', `${currentMonth}-32`);

        spent = data?.reduce((sum, tx) => sum + tx.amount, 0) || 0;
      } else if (budget.tag_id) {
        // Sum transactions by tag
        const { data } = await supabase
          .from('transactions')
          .select('amount, transaction_tags!inner(tag_id)')
          .eq('transaction_tags.tag_id', budget.tag_id)
          .gte('date', `${currentMonth}-01`)
          .lt('date', `${currentMonth}-32`);

        spent = data?.reduce((sum, tx) => sum + tx.amount, 0) || 0;
      }

      return {
        ...budget,
        spent,
        percentage: (spent / budget.amount) * 100,
      };
    })
  );

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgetsWithProgress.map((budget) => (
          <BudgetCard key={budget.id} budget={budget} />
        ))}
      </div>
    </div>
  );
}
```

---

## Form Handling

### Native Form Actions (Progressive Enhancement)

```typescript
"use client";

import { createTransaction } from '@/app/actions/transactions';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create Transaction'}
    </button>
  );
}

export default function SimpleTransactionForm({ categoryId }) {
  async function handleSubmit(formData: FormData) {
    const result = await createTransaction({
      amount: Number(formData.get('amount')),
      categoryId: formData.get('categoryId') as string,
      date: formData.get('date') as string,
      description: formData.get('description') as string,
      tagIds: [],
    });

    if (result.success) {
      toast.success('Transaction created!');
      // Reset form
      const form = document.getElementById('tx-form') as HTMLFormElement;
      form?.reset();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form id="tx-form" action={handleSubmit}>
      <input
        type="number"
        name="amount"
        step="0.01"
        placeholder="Amount"
        required
      />
      <input type="hidden" name="categoryId" value={categoryId} />
      <input
        type="date"
        name="date"
        defaultValue={new Date().toISOString().split('T')[0]}
        required
      />
      <input type="text" name="description" placeholder="Description" />
      <SubmitButton />
    </form>
  );
}
```

---

## Real-time Updates

### Real-time Transaction List

```typescript
"use client";

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function RealtimeTransactions({ userId }) {
  const supabase = createClient();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    // Load initial data
    async function loadTransactions() {
      const { data } = await supabase
        .from('transactions')
        .select('*, category:categories(*)')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      setTransactions(data || []);
    }

    loadTransactions();

    // Subscribe to changes
    const channel = supabase
      .channel('user-transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch the new transaction with category data
            const { data } = await supabase
              .from('transactions')
              .select('*, category:categories(*)')
              .eq('id', payload.new.id)
              .single();

            if (data) {
              setTransactions((prev) => [data, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const { data } = await supabase
              .from('transactions')
              .select('*, category:categories(*)')
              .eq('id', payload.new.id)
              .single();

            if (data) {
              setTransactions((prev) =>
                prev.map((tx) => (tx.id === data.id ? data : tx))
              );
            }
          } else if (payload.eventType === 'DELETE') {
            setTransactions((prev) =>
              prev.filter((tx) => tx.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <div>
      {transactions.map((tx) => (
        <div key={tx.id}>
          <p>${tx.amount.toFixed(2)}</p>
          <p>{tx.category?.name}</p>
          <p>{tx.date}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Advanced Patterns

### Optimistic Updates

```typescript
"use client";

import { useOptimistic } from 'react';
import { deleteTransaction } from '@/app/actions/transactions';
import { toast } from 'sonner';

export default function OptimisticTransactionList({ transactions }) {
  const [optimisticTransactions, removeOptimistic] = useOptimistic(
    transactions,
    (state, idToRemove) => state.filter((tx) => tx.id !== idToRemove)
  );

  async function handleDelete(id) {
    // Optimistically remove from UI
    removeOptimistic(id);

    // Call server action
    const result = await deleteTransaction({ id });

    if (!result.success) {
      // Show error - UI will revert automatically
      toast.error(result.error);
    } else {
      toast.success('Transaction deleted');
    }
  }

  return (
    <div>
      {optimisticTransactions.map((tx) => (
        <div key={tx.id}>
          <p>{tx.description}</p>
          <button onClick={() => handleDelete(tx.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

### Parallel Data Loading

```typescript
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Load all data in parallel
  const [
    { data: transactions },
    { data: budgets },
    { data: categories },
    { data: tags },
  ] = await Promise.all([
    supabase.from('transactions').select('*').limit(10),
    supabase.from('budgets').select('*'),
    supabase.from('categories').select('*'),
    supabase.from('tags').select('*'),
  ]);

  return (
    <div>
      <div>Transactions: {transactions?.length}</div>
      <div>Budgets: {budgets?.length}</div>
      <div>Categories: {categories?.length}</div>
      <div>Tags: {tags?.length}</div>
    </div>
  );
}
```

---

## Error Handling Best Practices

```typescript
"use client";

import { createTransaction } from '@/app/actions/transactions';
import { useState } from 'react';
import { toast } from 'sonner';

export default function TransactionFormWithErrorHandling() {
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  async function handleSubmit(formData) {
    setLoading(true);
    setValidationErrors({});

    const result = await createTransaction(formData);

    setLoading(false);

    if (result.success) {
      toast.success('Transaction created!');
      // Reset form
    } else {
      // Show error to user
      toast.error(result.error);

      // Optionally parse validation errors
      if (result.error.includes('Amount')) {
        setValidationErrors({ amount: result.error });
      } else if (result.error.includes('Category')) {
        setValidationErrors({ categoryId: result.error });
      }
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      {validationErrors.amount && (
        <p className="text-red-500 text-sm">{validationErrors.amount}</p>
      )}
      {/* ... */}
    </form>
  );
}
```

---

## Authentication Flow Example

```typescript
"use client";

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogin(formData: FormData) {
    setLoading(true);

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged in successfully!');
      router.push('/dashboard');
      router.refresh();
    }
  }

  return (
    <form action={handleLogin}>
      <input type="email" name="email" placeholder="Email" required />
      <input type="password" name="password" placeholder="Password" required />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  );
}
```

---

These examples demonstrate all the key patterns for using the FinanceFlow backend infrastructure. Each example follows best practices and shows proper error handling, loading states, and type safety.