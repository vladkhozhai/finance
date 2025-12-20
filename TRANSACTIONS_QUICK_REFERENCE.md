# Transaction Server Actions - Quick Reference

**File**: `/src/app/actions/transactions.ts`
**Updated**: 2025-12-17

---

## Import Statement

```typescript
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactions,
  getTransactionById,
  getBalance,
  type TransactionWithRelations,
} from "@/app/actions/transactions";
```

---

## Quick Function Reference

### 1. Create Transaction
```typescript
const result = await createTransaction({
  amount: 50.00,              // Required: positive number
  type: "expense",            // Required: "income" | "expense"
  categoryId: "uuid",         // Required: valid category UUID
  date: "2025-12-17",         // Required: YYYY-MM-DD
  description: "Optional",    // Optional: max 500 chars
  tagIds: ["uuid1", "uuid2"]  // Optional: array of tag UUIDs
});
// Returns: { success: true, data: { id: string } } | { success: false, error: string }
```

### 2. Update Transaction
```typescript
const result = await updateTransaction({
  id: "uuid",                 // Required: transaction UUID
  amount: 75.00,              // Optional: new amount
  type: "income",             // Optional: new type
  categoryId: "uuid",         // Optional: new category
  date: "2025-12-18",         // Optional: new date
  description: "Updated",     // Optional: new description
  tagIds: ["uuid"]            // Optional: replaces ALL tags
});
// Returns: { success: true, data: { id: string } } | { success: false, error: string }
```

### 3. Delete Transaction
```typescript
const result = await deleteTransaction({ id: "uuid" });
// Returns: { success: true, data: undefined } | { success: false, error: string }
```

### 4. Get Transactions (with filtering)
```typescript
const result = await getTransactions({
  type: "expense",            // Optional: filter by type
  categoryId: "uuid",         // Optional: filter by category
  tagIds: ["uuid1", "uuid2"], // Optional: filter by tags (AND)
  dateFrom: "2025-12-01",     // Optional: start date
  dateTo: "2025-12-31",       // Optional: end date
  limit: 50,                  // Optional: max results (default 50)
  offset: 0                   // Optional: skip results (default 0)
});
// Returns: { success: true, data: TransactionWithRelations[] } | { success: false, error: string }
```

### 5. Get Single Transaction
```typescript
const result = await getTransactionById("uuid");
// Returns: { success: true, data: TransactionWithRelations | null } | { success: false, error: string }
```

### 6. Get Balance
```typescript
const result = await getBalance();
// Returns: { success: true, data: { balance: number, income: number, expense: number } } | { success: false, error: string }
```

---

## TransactionWithRelations Type

```typescript
type TransactionWithRelations = {
  // Transaction fields
  id: string;
  user_id: string;
  amount: number;
  type: "income" | "expense";
  category_id: string;
  date: string;                 // YYYY-MM-DD
  description: string | null;
  created_at: string;
  updated_at: string;

  // Related data
  category: {
    id: string;
    name: string;
    color: string;              // Hex color
    type: string;
  };
  transaction_tags: Array<{
    tag: {
      id: string;
      name: string;
    }
  }>;
};
```

---

## Common Patterns

### Check Result Success
```typescript
const result = await someAction(input);

if (result.success) {
  // TypeScript knows result.data exists
  console.log(result.data);
} else {
  // TypeScript knows result.error exists
  alert(result.error);
}
```

### Pagination
```typescript
const page = 0;
const limit = 20;

const result = await getTransactions({
  limit,
  offset: page * limit
});
```

### Date Range Filter
```typescript
const startOfMonth = "2025-12-01";
const endOfMonth = "2025-12-31";

const result = await getTransactions({
  dateFrom: startOfMonth,
  dateTo: endOfMonth
});
```

### Filter by Multiple Tags (AND logic)
```typescript
// Transaction must have BOTH tags
const result = await getTransactions({
  tagIds: ["coffee-tag-uuid", "work-tag-uuid"]
});
```

### Update Only Amount
```typescript
// Other fields remain unchanged
const result = await updateTransaction({
  id: "transaction-uuid",
  amount: 100.00
});
```

### Remove All Tags
```typescript
const result = await updateTransaction({
  id: "transaction-uuid",
  tagIds: []  // Empty array removes all tags
});
```

---

## Error Handling

```typescript
const result = await createTransaction(input);

if (!result.success) {
  // Common errors to handle:
  if (result.error.includes("Amount must be positive")) {
    // Validation error
  } else if (result.error.includes("Unauthorized")) {
    // Redirect to login
  } else if (result.error.includes("Invalid category")) {
    // Business logic error
  } else {
    // Generic error
    console.error(result.error);
  }
}
```

---

## React Component Example

```typescript
"use client";

import { useState } from "react";
import { createTransaction } from "@/app/actions/transactions";

export function QuickTransactionForm() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createTransaction({
      amount: Number(formData.get("amount")),
      type: formData.get("type") as "income" | "expense",
      categoryId: formData.get("categoryId") as string,
      date: formData.get("date") as string,
      description: formData.get("description") as string,
    });

    if (result.success) {
      alert("Transaction created!");
      e.currentTarget.reset();
    } else {
      alert(result.error);
    }

    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="number" name="amount" required />
      <select name="type" required>
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>
      <input type="text" name="categoryId" required />
      <input type="date" name="date" required />
      <textarea name="description" />
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
```

---

## Validation Rules

| Field | Rule |
|-------|------|
| amount | Must be positive (> 0) |
| type | Must be "income" or "expense" |
| categoryId | Must be valid UUID, must exist and belong to user |
| date | Must be YYYY-MM-DD format |
| description | Max 500 characters, optional |
| tagIds | All must be valid UUIDs, must exist and belong to user |

---

## Cache Revalidation

After mutations (create/update/delete), these paths are automatically revalidated:
- `/dashboard` - Balance and recent transactions
- `/transactions` - Transaction list
- `/budgets` - Budget progress (depends on transactions)

---

## Performance Tips

1. **Use pagination** for large datasets:
   ```typescript
   const result = await getTransactions({ limit: 50, offset: 0 });
   ```

2. **Apply filters server-side**:
   ```typescript
   // Good: Server-side filtering
   const result = await getTransactions({ type: "expense", categoryId: "uuid" });

   // Bad: Fetch all then filter client-side
   const all = await getTransactions({ limit: 10000 });
   const filtered = all.data.filter(t => t.type === "expense");
   ```

3. **Use getBalance()** instead of calculating manually:
   ```typescript
   // Good: Optimized DB function
   const result = await getBalance();

   // Bad: Fetch all and calculate
   const all = await getTransactions({ limit: 10000 });
   const balance = all.data.reduce((sum, t) => ...);
   ```

---

## Common Errors

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Amount must be positive" | Negative or zero amount | Use positive number |
| "Unauthorized. Please log in..." | User not authenticated | Redirect to login |
| "Invalid category..." | Category doesn't exist or belong to another user | Select valid category |
| "Invalid tags..." | One or more tags don't exist or belong to another user | Select valid tags |
| "Failed to create transaction..." | Database error | Retry or contact support |

---

## Full Documentation

For complete documentation with examples, see:
- `/TRANSACTIONS_ACTIONS_DOCUMENTATION.md` - Comprehensive guide
- `/TRANSACTIONS_ACTIONS_SUMMARY.md` - Implementation summary
- `/TRANSACTIONS_SCHEMA_SUMMARY.md` - Database schema reference
