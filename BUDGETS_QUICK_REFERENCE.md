# Budgets Schema - Quick Reference

**Last Updated:** December 17, 2025

---

## Table Structure

```sql
budgets {
  id              UUID          PK
  user_id         UUID          FK → auth.users
  category_id     UUID          FK → categories (nullable, XOR with tag_id)
  tag_id          UUID          FK → tags (nullable, XOR with category_id)
  amount          DECIMAL(12,2) > 0
  period          DATE          First day of month
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ
}
```

---

## Constraints Cheat Sheet

| Constraint | Rule | Example |
|------------|------|---------|
| **XOR** | category_id XOR tag_id | ✅ `cat: uuid, tag: null` ✅ `cat: null, tag: uuid` ❌ Both ❌ Neither |
| **Period** | Must be 1st day of month | ✅ `2025-01-01` ❌ `2025-01-15` |
| **Amount** | Must be positive | ✅ `500.00` ❌ `0` ❌ `-100` |
| **Unique** | One budget per cat/tag per month | ✅ First insert ❌ Duplicate |

---

## TypeScript Quick Access

```typescript
import type { Database } from '@/types/database.types';

// Budget types
type Budget = Database['public']['Tables']['budgets']['Row'];
type BudgetInsert = Database['public']['Tables']['budgets']['Insert'];
type BudgetUpdate = Database['public']['Tables']['budgets']['Update'];
type BudgetProgress = Database['public']['Views']['budget_progress']['Row'];
```

---

## Common Queries

### Create Category Budget
```typescript
const { data, error } = await supabase
  .from('budgets')
  .insert({
    user_id: userId,
    category_id: categoryId,
    amount: 500,
    period: '2025-01-01',
  });
```

### Create Tag Budget
```typescript
const { data, error } = await supabase
  .from('budgets')
  .insert({
    user_id: userId,
    tag_id: tagId,
    amount: 200,
    period: '2025-01-01',
  });
```

### Get Budget Progress
```typescript
const { data, error } = await supabase
  .from('budget_progress')
  .select(`
    *,
    categories:category_id (name, color),
    tags:tag_id (name)
  `)
  .eq('period', '2025-01-01')
  .order('spent_percentage', { ascending: false });
```

### Get Overspent Budgets
```typescript
const { data, error } = await supabase
  .from('budget_progress')
  .select('*')
  .eq('is_overspent', true);
```

---

## Helper Functions

### Normalize Date to First Day
```typescript
function getFirstDayOfMonth(date: Date): string {
  const d = new Date(date);
  d.setDate(1);
  return d.toISOString().split('T')[0];
}
```

### Calculate Spent Amount (SQL)
```sql
SELECT calculate_budget_spent(
  user_id,
  category_id,  -- Or NULL for tag budget
  tag_id,       -- Or NULL for category budget
  period        -- Any date in the month
);
```

---

## budget_progress View Fields

```typescript
{
  id: string;
  user_id: string;
  category_id: string | null;
  tag_id: string | null;
  budget_amount: number;      // The limit
  period: string;              // First day (2025-01-01)
  period_end: string;          // Last day (2025-01-31)
  spent_amount: number;        // Calculated
  spent_percentage: number;    // Calculated (0-100+)
  is_overspent: boolean;       // Calculated
  created_at: string;
  updated_at: string;
}
```

---

## Validation Rules

### Server Action Example
```typescript
export async function createBudget(data: BudgetInsert) {
  // 1. Validate XOR
  if ((data.category_id && data.tag_id) ||
      (!data.category_id && !data.tag_id)) {
    return { error: 'Budget must have either category or tag, not both' };
  }

  // 2. Normalize period
  data.period = getFirstDayOfMonth(new Date(data.period));

  // 3. Validate amount
  if (data.amount <= 0) {
    return { error: 'Amount must be positive' };
  }

  // 4. Insert
  const { data: budget, error } = await supabase
    .from('budgets')
    .insert(data)
    .select()
    .single();

  return { data: budget, error };
}
```

---

## UI Patterns

### Month Picker
```typescript
// Always set to first day of month
const [selectedMonth, setSelectedMonth] = useState(new Date());

const handleMonthChange = (date: Date) => {
  date.setDate(1);  // Force first day
  setSelectedMonth(date);
};

const periodStr = selectedMonth.toISOString().split('T')[0];
```

### Category/Tag Selector
```typescript
const [budgetType, setBudgetType] = useState<'category' | 'tag'>('category');

{budgetType === 'category' ? (
  <CategorySelect
    value={categoryId}
    onChange={setCategoryId}
  />
) : (
  <TagSelect
    value={tagId}
    onChange={setTagId}
  />
)}
```

### Progress Bar
```typescript
<ProgressBar
  value={budget.spent_amount}
  max={budget.budget_amount}
  percentage={budget.spent_percentage}
  color={budget.is_overspent ? 'red' : 'green'}
/>
```

---

## Error Messages

| Error Code | Meaning | User Message |
|------------|---------|--------------|
| `budgets_check` | XOR constraint violation | "Budget must be for a category or tag, not both" |
| `budgets_period_first_day_of_month` | Period not 1st day | "Budget period must be the first day of a month" |
| `budgets_amount_check` | Negative amount | "Budget amount must be positive" |
| `idx_budgets_unique_category_period` | Duplicate category budget | "A budget already exists for this category and month" |
| `idx_budgets_unique_tag_period` | Duplicate tag budget | "A budget already exists for this tag and month" |

---

## RLS Policies

All operations are restricted to the authenticated user:

```sql
auth.uid() = user_id
```

**Guarantees:**
- ✅ Users can only see their own budgets
- ✅ Users can only create budgets for themselves
- ✅ Users can only update their own budgets
- ✅ Users can only delete their own budgets

---

## Testing Checklist

### Constraint Tests
- [ ] Create budget with category_id only → ACCEPT
- [ ] Create budget with tag_id only → ACCEPT
- [ ] Create budget with both → REJECT
- [ ] Create budget with neither → REJECT
- [ ] Create duplicate category budget → REJECT
- [ ] Create duplicate tag budget → REJECT
- [ ] Set period to mid-month → REJECT
- [ ] Set negative amount → REJECT

### RLS Tests
- [ ] User A cannot see User B's budgets
- [ ] User A cannot modify User B's budgets
- [ ] User A can see their own budgets
- [ ] User A can modify their own budgets

### Calculation Tests
- [ ] Spent amount matches transaction totals
- [ ] Percentage calculated correctly
- [ ] is_overspent flag correct

---

## Performance Tips

1. **Use budget_progress view** instead of joining and calculating manually
2. **Filter by period** for dashboard queries: `.eq('period', currentPeriod)`
3. **Order by spent_percentage** to show critical budgets first
4. **Cache budget progress** for high-traffic dashboards

---

## Breaking Changes from Initial Schema

| Old | New | Impact |
|-----|-----|--------|
| `start_date` | `period` | Update all queries |
| `period` (TEXT) | Removed | No longer needed |
| `calculate_budget_spent(user, cat, tag, start, end)` | `calculate_budget_spent(user, cat, tag, period)` | Update RPC calls |

---

## Related Files

- **Schema Migration:** `/supabase/migrations/20251217000002_enhance_budgets_schema.sql`
- **TypeScript Types:** `/src/types/database.types.ts`
- **Full Documentation:** `/BUDGETS_SCHEMA.md`
- **Summary:** `/BUDGETS_SCHEMA_SUMMARY.md`
- **Completion Report:** `/CARD_06_COMPLETION_REPORT.md`
- **Test Suite:** `/scripts/test-budgets-constraints.ts`

---

## Need Help?

**For Schema Questions:** See `/BUDGETS_SCHEMA.md`
**For Implementation Questions:** See `/BUDGETS_SCHEMA_SUMMARY.md`
**For Testing:** Run `npx tsx scripts/test-budgets-constraints.ts`
