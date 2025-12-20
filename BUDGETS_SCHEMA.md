# Budgets Table Schema Documentation

## Overview

The `budgets` table enables users to set monthly spending limits for categories or tags. The schema enforces strict data integrity through constraints and provides efficient querying through strategic indexing.

**Migration File:** `/supabase/migrations/20251217000002_enhance_budgets_schema.sql`

## Table Structure

```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  period DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | uuid_generate_v4() | Primary key |
| `user_id` | UUID | No | - | Foreign key to auth.users |
| `category_id` | UUID | Yes | NULL | Foreign key to categories (XOR with tag_id) |
| `tag_id` | UUID | Yes | NULL | Foreign key to tags (XOR with category_id) |
| `amount` | DECIMAL(12,2) | No | - | Budget limit (must be > 0) |
| `period` | DATE | No | CURRENT_DATE | First day of budget month (e.g., 2025-01-01) |
| `created_at` | TIMESTAMPTZ | No | NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | NOW() | Last update timestamp (auto-updated) |

## Constraints

### 1. XOR Constraint (Either category_id OR tag_id)

**Purpose:** Ensures each budget is associated with exactly one category OR one tag, not both and not neither.

```sql
CHECK (
  (category_id IS NOT NULL AND tag_id IS NULL) OR
  (category_id IS NULL AND tag_id IS NOT NULL)
)
```

**Examples:**
- ✅ `category_id = <uuid>, tag_id = NULL` - Valid
- ✅ `category_id = NULL, tag_id = <uuid>` - Valid
- ❌ `category_id = <uuid>, tag_id = <uuid>` - **REJECTED**
- ❌ `category_id = NULL, tag_id = NULL` - **REJECTED**

### 2. Period First Day Constraint

**Purpose:** Ensures the period date is always the first day of a month for consistent period queries.

```sql
CHECK (EXTRACT(DAY FROM period) = 1)
```

**Examples:**
- ✅ `2025-01-01` - Valid
- ✅ `2025-12-01` - Valid
- ❌ `2025-03-15` - **REJECTED** (not first day)
- ❌ `2025-06-30` - **REJECTED** (not first day)

### 3. Positive Amount Constraint

**Purpose:** Budget amounts must be positive values.

```sql
CHECK (amount > 0)
```

**Examples:**
- ✅ `amount = 500.00` - Valid
- ✅ `amount = 0.01` - Valid
- ❌ `amount = 0` - **REJECTED**
- ❌ `amount = -100` - **REJECTED**

### 4. Unique Constraints (Duplicate Prevention)

**Purpose:** Prevents creating multiple budgets for the same category/tag in the same period.

#### Category Budget Uniqueness:
```sql
CREATE UNIQUE INDEX idx_budgets_unique_category_period
  ON budgets(user_id, category_id, period)
  WHERE category_id IS NOT NULL;
```

**Example:**
- ✅ User A, Food category, January 2025 - First budget created
- ❌ User A, Food category, January 2025 - **REJECTED** (duplicate)
- ✅ User A, Food category, February 2025 - Valid (different period)
- ✅ User B, Food category, January 2025 - Valid (different user)

#### Tag Budget Uniqueness:
```sql
CREATE UNIQUE INDEX idx_budgets_unique_tag_period
  ON budgets(user_id, tag_id, period)
  WHERE tag_id IS NOT NULL;
```

**Example:**
- ✅ User A, #coffee tag, January 2025 - First budget created
- ❌ User A, #coffee tag, January 2025 - **REJECTED** (duplicate)
- ✅ User A, #coffee tag, February 2025 - Valid (different period)

**Note:** Partial unique indexes are used because standard UNIQUE constraints in PostgreSQL don't work correctly with NULL values.

## Indexes

### Performance Indexes

```sql
-- Primary user queries
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_user_period ON budgets(user_id, period DESC);

-- Foreign key indexes
CREATE INDEX idx_budgets_category_id ON budgets(category_id);
CREATE INDEX idx_budgets_tag_id ON budgets(tag_id);

-- Period range queries
CREATE INDEX idx_budgets_period ON budgets(period DESC);

-- Filtered indexes for common patterns
CREATE INDEX idx_budgets_user_category ON budgets(user_id, category_id)
  WHERE category_id IS NOT NULL;
CREATE INDEX idx_budgets_user_tag ON budgets(user_id, tag_id)
  WHERE tag_id IS NOT NULL;
```

**Index Purpose:**
- `idx_budgets_user_id` - Fast user-specific budget queries
- `idx_budgets_user_period` - Dashboard queries for current/recent periods
- `idx_budgets_category_id` / `idx_budgets_tag_id` - JOIN performance with categories/tags
- `idx_budgets_period` - Date range filtering
- Partial indexes - Optimize category-only and tag-only queries

## Row Level Security (RLS)

### Enabled
```sql
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
```

### Policies

```sql
-- SELECT: Users can only view their own budgets
CREATE POLICY "Users can view own budgets"
  ON budgets FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can only create budgets for themselves
CREATE POLICY "Users can insert own budgets"
  ON budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own budgets
CREATE POLICY "Users can update own budgets"
  ON budgets FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE: Users can only delete their own budgets
CREATE POLICY "Users can delete own budgets"
  ON budgets FOR DELETE
  USING (auth.uid() = user_id);
```

**Security Guarantee:** Users can only access budgets where `user_id` matches their authenticated user ID (`auth.uid()`).

## Helper Functions

### get_first_day_of_month()

Returns the first day of the month for any given date.

```sql
SELECT get_first_day_of_month('2025-03-15'::DATE);
-- Returns: 2025-03-01
```

**Use Case:** Normalizing user-input dates to budget periods.

### get_last_day_of_month()

Returns the last day of the month for any given date.

```sql
SELECT get_last_day_of_month('2025-02-15'::DATE);
-- Returns: 2025-02-28 (or 2025-02-29 for leap years)
```

**Use Case:** Calculating period end dates for transaction filtering.

### calculate_budget_spent()

Calculates the total amount spent for a budget within its period.

```sql
CREATE OR REPLACE FUNCTION calculate_budget_spent(
  p_user_id UUID,
  p_category_id UUID DEFAULT NULL,
  p_tag_id UUID DEFAULT NULL,
  p_period DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(12, 2)
```

**Parameters:**
- `p_user_id` - User ID (required)
- `p_category_id` - Category ID (provide for category budgets)
- `p_tag_id` - Tag ID (provide for tag budgets)
- `p_period` - Any date in the budget month (auto-normalized to first day)

**Returns:** Total spent amount as DECIMAL(12, 2)

**Examples:**

```sql
-- Calculate spent for a category budget in January 2025
SELECT calculate_budget_spent(
  '123e4567-e89b-12d3-a456-426614174000'::UUID,
  '987fcdeb-51a2-43d1-9012-345678901234'::UUID,
  NULL,
  '2025-01-15'::DATE  -- Any date in January
);

-- Calculate spent for a tag budget in February 2025
SELECT calculate_budget_spent(
  '123e4567-e89b-12d3-a456-426614174000'::UUID,
  NULL,
  '456789ab-cdef-0123-4567-89abcdef0123'::UUID,
  '2025-02-01'::DATE
);
```

**Implementation Details:**
- Automatically calculates the full month date range
- For category budgets: Sums `transactions.amount` where `category_id` matches
- For tag budgets: Sums `transactions.amount` for transactions with matching tags (via `transaction_tags` junction)
- Returns 0 if no transactions found

## budget_progress View

A convenience view that combines budget data with calculated spending metrics.

```sql
CREATE VIEW budget_progress AS
SELECT
  b.id,
  b.user_id,
  b.category_id,
  b.tag_id,
  b.amount AS budget_amount,
  b.period,
  get_last_day_of_month(b.period) AS period_end,
  calculate_budget_spent(b.user_id, b.category_id, b.tag_id, b.period) AS spent_amount,
  ROUND(
    (calculate_budget_spent(b.user_id, b.category_id, b.tag_id, b.period) / b.amount) * 100,
    2
  ) AS spent_percentage,
  CASE
    WHEN calculate_budget_spent(b.user_id, b.category_id, b.tag_id, b.period) > b.amount
    THEN TRUE
    ELSE FALSE
  END AS is_overspent,
  b.created_at,
  b.updated_at
FROM budgets b;
```

### View Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Budget ID |
| `user_id` | UUID | User ID |
| `category_id` | UUID | Category ID (nullable) |
| `tag_id` | UUID | Tag ID (nullable) |
| `budget_amount` | DECIMAL(12,2) | Budget limit |
| `period` | DATE | Period start (first day of month) |
| `period_end` | DATE | Period end (last day of month) |
| `spent_amount` | DECIMAL(12,2) | Total spent in period |
| `spent_percentage` | NUMERIC | Percentage spent (0-100+) |
| `is_overspent` | BOOLEAN | True if spent > budget |
| `created_at` | TIMESTAMPTZ | Budget creation time |
| `updated_at` | TIMESTAMPTZ | Budget last update time |

### Example Query

```typescript
// Get all active budgets for current user with spending data
const { data: budgets } = await supabase
  .from('budget_progress')
  .select('*')
  .eq('period', '2025-01-01')
  .order('spent_percentage', { ascending: false });
```

**Sample Result:**
```json
{
  "id": "f8a85fa3-9261-449c-91ca-2acba9e8ffcc",
  "user_id": "33b0fa62-3548-43c0-8368-553d911a5d77",
  "category_id": "0bb75fbf-c85f-4b0f-a38d-b9265df4ea1a",
  "tag_id": null,
  "budget_amount": 500,
  "period": "2025-01-01",
  "period_end": "2025-01-31",
  "spent_amount": 327.45,
  "spent_percentage": 65.49,
  "is_overspent": false,
  "created_at": "2025-12-17T20:06:00.921214+00:00",
  "updated_at": "2025-12-17T20:06:00.921214+00:00"
}
```

**Security:** The view uses `security_invoker = true`, which means RLS policies from the underlying `budgets` table are enforced. Users can only see budget progress for their own budgets.

## TypeScript Types

Generated types are available in `/src/types/database.types.ts`:

```typescript
// Budget row from database
type BudgetRow = Database['public']['Tables']['budgets']['Row'];

// Budget insert payload
type BudgetInsert = Database['public']['Tables']['budgets']['Insert'];

// Budget update payload
type BudgetUpdate = Database['public']['Tables']['budgets']['Update'];
```

### Example Usage

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabase = createClient<Database>(url, key);

// Type-safe budget creation
const { data, error } = await supabase
  .from('budgets')
  .insert({
    user_id: userId,
    category_id: categoryId,
    amount: 500,
    period: '2025-01-01', // Must be first day of month
  })
  .select()
  .single();

// Type-safe budget progress query
const { data: progress } = await supabase
  .from('budget_progress')
  .select('*')
  .eq('period', '2025-01-01');
```

## Common Queries

### Create a Category Budget

```typescript
const { data, error } = await supabase
  .from('budgets')
  .insert({
    user_id: userId,
    category_id: categoryId,
    tag_id: null,
    amount: 500,
    period: '2025-01-01',
  });
```

### Create a Tag Budget

```typescript
const { data, error } = await supabase
  .from('budgets')
  .insert({
    user_id: userId,
    category_id: null,
    tag_id: tagId,
    amount: 200,
    period: '2025-01-01',
  });
```

### Get Current Month Budgets with Progress

```typescript
const currentMonth = new Date();
currentMonth.setDate(1); // First day of month
const periodStr = currentMonth.toISOString().split('T')[0];

const { data, error } = await supabase
  .from('budget_progress')
  .select(`
    *,
    categories:category_id (id, name, color, type),
    tags:tag_id (id, name)
  `)
  .eq('period', periodStr)
  .order('spent_percentage', { ascending: false });
```

### Get Overspent Budgets

```typescript
const { data, error } = await supabase
  .from('budget_progress')
  .select('*')
  .eq('is_overspent', true)
  .eq('period', '2025-01-01');
```

### Update Budget Amount

```typescript
const { data, error } = await supabase
  .from('budgets')
  .update({ amount: 600 })
  .eq('id', budgetId);
```

### Delete Budget

```typescript
const { data, error } = await supabase
  .from('budgets')
  .delete()
  .eq('id', budgetId);
```

## Migration History

1. **20251210000001_initial_schema.sql** - Initial budgets table creation
   - Basic structure with `period` (TEXT) and `start_date` (DATE)
   - XOR constraint for category_id/tag_id
   - Standard UNIQUE constraints (didn't work properly with NULLs)

2. **20251217000002_enhance_budgets_schema.sql** - Enhanced schema (current)
   - Renamed `start_date` to `period` (DATE only)
   - Added `budgets_period_first_day_of_month` constraint
   - Replaced UNIQUE constraints with partial unique indexes
   - Added performance indexes (including partial indexes)
   - Created helper functions (`get_first_day_of_month`, `get_last_day_of_month`)
   - Updated `calculate_budget_spent()` function signature
   - Created `budget_progress` view with RLS

## Testing

Run the constraint test suite:

```bash
npx tsx scripts/test-budgets-constraints.ts
```

**Tests cover:**
1. ✅ Valid budget with category_id only
2. ✅ Valid budget with tag_id only
3. ✅ Rejection of both category_id AND tag_id
4. ✅ Rejection of neither category_id nor tag_id
5. ✅ Duplicate prevention (same category + period)
6. ✅ Period validation (must be first day)
7. ✅ Amount validation (must be positive)
8. ✅ Budget progress view functionality

## Performance Considerations

1. **Indexes:** All foreign keys and frequently queried columns are indexed
2. **Partial Indexes:** Category-only and tag-only queries use specialized indexes
3. **View Calculation:** `budget_progress` view calculates spent amounts on-demand (not materialized)
4. **Function Caching:** Consider materialized views for high-traffic dashboards if performance becomes an issue

## Future Enhancements

Potential improvements for future iterations:

1. **Recurring Budgets:** Auto-create budgets for subsequent months
2. **Budget Templates:** Save and reuse budget configurations
3. **Budget History:** Track budget amount changes over time
4. **Alerts:** Trigger notifications at 80%, 90%, 100% thresholds
5. **Rollover:** Carry unused budget amounts to next month
6. **Composite Budgets:** Support multiple categories/tags in one budget

## Related Documentation

- **Full Architecture:** `/ARCHITECTURE.md`
- **Database Types:** `/src/types/database.types.ts`
- **Transaction Schema:** `/supabase/migrations/20251217000001_enhance_transactions_schema.sql`
- **Category Schema:** `/supabase/migrations/20251210000001_initial_schema.sql`
- **Tag Schema:** `/supabase/migrations/20251210000001_initial_schema.sql`
