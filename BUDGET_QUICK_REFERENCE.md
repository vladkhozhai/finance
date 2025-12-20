# Budget Server Actions - Quick Reference

## Import
```typescript
import {
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgets,
  getBudgetById,
  getBudgetProgress,
} from "@/app/actions/budgets";
```

## 1. Create Budget

### Category Budget
```typescript
const result = await createBudget({
  amount: 500,
  period: "2025-01-01",  // First day of month
  categoryId: "category-uuid",
});
```

### Tag Budget
```typescript
const result = await createBudget({
  amount: 300,
  period: "2025-01",  // Auto-normalized to 2025-01-01
  tagId: "tag-uuid",
});
```

## 2. Update Budget

```typescript
// Update amount
const result = await updateBudget({
  id: "budget-uuid",
  amount: 600,
});

// Update period
const result = await updateBudget({
  id: "budget-uuid",
  period: "2025-02-01",
});

// Update both
const result = await updateBudget({
  id: "budget-uuid",
  amount: 700,
  period: "2025-03-01",
});
```

**Note**: Cannot change category/tag. Delete and recreate instead.

## 3. Delete Budget

```typescript
const result = await deleteBudget({
  id: "budget-uuid",
});
```

## 4. Get Budgets (List)

### All budgets
```typescript
const result = await getBudgets();
```

### Filter by category
```typescript
const result = await getBudgets({
  categoryId: "category-uuid",
});
```

### Filter by tag
```typescript
const result = await getBudgets({
  tagId: "tag-uuid",
});
```

### Filter by month
```typescript
const result = await getBudgets({
  month: "2025-01",  // January 2025
});
```

### With pagination
```typescript
const result = await getBudgets({
  limit: 20,
  offset: 0,
});
```

## 5. Get Budget by ID

```typescript
const result = await getBudgetById({
  id: "budget-uuid",
});

if (result.success) {
  const budget = result.data;
  console.log(budget.category?.name);  // Category name (if category budget)
  console.log(budget.tag?.name);       // Tag name (if tag budget)
}
```

## 6. Get Budget Progress

### Current month (default)
```typescript
const result = await getBudgetProgress();
```

### Specific month
```typescript
const result = await getBudgetProgress({
  month: "2025-01",
});
```

### Filter by category
```typescript
const result = await getBudgetProgress({
  categoryId: "category-uuid",
});
```

### Result structure
```typescript
if (result.success) {
  for (const progress of result.data) {
    console.log(progress.budget_amount);    // Budget limit
    console.log(progress.spent_amount);     // Amount spent
    console.log(progress.spent_percentage); // Percentage (0-100+)
    console.log(progress.is_overspent);     // Boolean
    console.log(progress.period);           // "2025-01-01"
    console.log(progress.period_end);       // "2025-01-31"
  }
}
```

## Response Format

All actions return:
```typescript
ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }
```

### Success Example
```typescript
{
  success: true,
  data: { id: "budget-uuid" }
}
```

### Error Example
```typescript
{
  success: false,
  error: "A budget already exists for this category or tag in the specified period."
}
```

## Period Format

**Input**: Accepts multiple formats, auto-normalized to YYYY-MM-01
- `"2025-01-01"` → `"2025-01-01"` (unchanged)
- `"2025-01"` → `"2025-01-01"` (adds day)
- `"2025-01-15"` → `"2025-01-01"` (replaces day with 01)

**Storage**: Always stored as DATE in database (first day of month)

## Validation Rules

### Amount
- ✅ Must be positive number
- ❌ Cannot be zero or negative
- ❌ Cannot be infinite

### Period
- ✅ Must be YYYY-MM-01 format (or auto-normalizable)
- ❌ Invalid formats rejected

### Category/Tag (XOR Constraint)
- ✅ Must have exactly ONE of: categoryId OR tagId
- ❌ Cannot have both
- ❌ Cannot have neither

### Duplicates
- ❌ Cannot create duplicate budget (same user + category/tag + period)
- ✅ Can have same category in different periods
- ✅ Can have different categories in same period

## Error Messages

| Error | Reason |
|-------|--------|
| "Unauthorized. Please log in..." | User not authenticated |
| "Budget must have either a categoryId OR a tagId, not both" | XOR constraint violation |
| "Period must be the first day of a month (YYYY-MM-01 format)" | Invalid period format |
| "Amount must be positive" | Zero or negative amount |
| "A budget already exists for this category or tag in the specified period." | Duplicate budget |
| "Budget not found." | Invalid budget ID or not owned by user |
| "Failed to create/update/delete budget. Please try again." | Generic database error |
| "An unexpected error occurred. Please try again." | Unexpected server error |

## Common Patterns

### Creating budget from form
```typescript
const handleSubmit = async (formData) => {
  const result = await createBudget({
    amount: formData.amount,
    period: formData.period,  // From date picker
    categoryId: formData.type === 'category' ? formData.id : undefined,
    tagId: formData.type === 'tag' ? formData.id : undefined,
  });

  if (result.success) {
    toast.success("Budget created!");
    router.push("/budgets");
  } else {
    toast.error(result.error);
  }
};
```

### Displaying budget progress bar
```typescript
const BudgetCard = ({ progress }) => {
  const percentage = Math.min(progress.spent_percentage, 100);
  const color = progress.is_overspent ? "red" : "green";

  return (
    <div>
      <h3>{progress.category?.name || progress.tag?.name}</h3>
      <p>${progress.spent_amount} / ${progress.budget_amount}</p>
      <ProgressBar
        value={percentage}
        color={color}
      />
      {progress.is_overspent && (
        <Alert variant="danger">
          Budget exceeded by ${progress.spent_amount - progress.budget_amount}
        </Alert>
      )}
    </div>
  );
};
```

### Loading budgets in component
```typescript
"use client";

import { useEffect, useState } from "react";
import { getBudgets } from "@/app/actions/budgets";

export default function BudgetList() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBudgets() {
      const result = await getBudgets();
      if (result.success) {
        setBudgets(result.data);
      }
      setLoading(false);
    }
    loadBudgets();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {budgets.map(budget => (
        <BudgetItem key={budget.id} budget={budget} />
      ))}
    </div>
  );
}
```

## Cache Revalidation

After mutations (create, update, delete), the following paths are automatically revalidated:
- `/dashboard`
- `/budgets`

No manual cache invalidation needed.

## Type Definitions

### BudgetWithRelations
```typescript
interface BudgetWithRelations {
  id: string;
  user_id: string;
  amount: number;
  period: string;
  category_id: string | null;
  tag_id: string | null;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    color: string;
    type: "expense" | "income";
  } | null;
  tag?: {
    id: string;
    name: string;
  } | null;
}
```

### BudgetProgress
```typescript
interface BudgetProgress {
  id: string;
  user_id: string;
  category_id: string | null;
  tag_id: string | null;
  budget_amount: number;
  period: string;
  period_end: string;
  spent_amount: number;
  spent_percentage: number;
  is_overspent: boolean;
  created_at: string;
  updated_at: string;
  category?: { ... } | null;
  tag?: { ... } | null;
}
```
