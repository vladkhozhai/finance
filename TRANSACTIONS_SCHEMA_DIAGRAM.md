# Transactions Schema - Entity Relationship Diagram

## Visual Schema Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FINANCEFLOW TRANSACTIONS                            │
│                         Database Schema Diagram                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   auth.users     │  (Supabase Auth - managed)
├──────────────────┤
│ id (PK)          │
│ email            │
│ ...              │
└──────────────────┘
        │
        │ CASCADE (delete user → delete all data)
        │
        ├───────────────────────────────────────────────┐
        │                                               │
        ▼                                               ▼
┌──────────────────┐                          ┌──────────────────┐
│   categories     │                          │      tags        │
├──────────────────┤                          ├──────────────────┤
│ id (PK)          │                          │ id (PK)          │
│ user_id (FK)     │◄─ CASCADE                │ user_id (FK)     │◄─ CASCADE
│ name             │                          │ name             │
│ color            │                          │ created_at       │
│ type             │   (expense/income)       │ updated_at       │
│ created_at       │                          └──────────────────┘
│ updated_at       │                                   │
└──────────────────┘                                   │
        │                                              │
        │ RESTRICT (cannot delete category           │ CASCADE
        │           if used in transactions)          │
        │                                              │
        ▼                                              │
┌──────────────────────────────────┐                  │
│        transactions              │                  │
├──────────────────────────────────┤                  │
│ id (PK)                          │                  │
│ user_id (FK) ────────────────────┼──────────┐       │
│ category_id (FK) ────────┘       │          │       │
│ amount (DECIMAL 12,2)            │          │       │
│ type (TEXT)                      │          │       │
│ date (DATE)                      │          │       │
│ description (TEXT)               │          │       │
│ created_at (TIMESTAMPTZ)         │          │       │
│ updated_at (TIMESTAMPTZ)         │          │       │
└──────────────────────────────────┘          │       │
        │                                     │       │
        │ CASCADE                             │       │
        │                                     │       │
        ▼                                     │       │
┌──────────────────────────────────┐          │       │
│      transaction_tags            │          │       │
│      (Junction Table)            │          │       │
├──────────────────────────────────┤          │       │
│ transaction_id (PK, FK) ─────────┘          │       │
│ tag_id (PK, FK) ────────────────────────────┼───────┘
│ created_at                       │          │
└──────────────────────────────────┘          │
        Composite PK prevents                 │
        duplicate tag assignments             │
                                               │
                                               ▼ CASCADE
                              All user data deleted when
                              user account is removed
```

---

## Table Relationships

### 1️⃣ User → Categories (One-to-Many)
- **Relationship**: One user can have many categories
- **Foreign Key**: `categories.user_id → auth.users.id`
- **Delete Behavior**: CASCADE (deleting user removes their categories)
- **Constraint**: UNIQUE(user_id, name) - no duplicate category names per user

### 2️⃣ User → Tags (One-to-Many)
- **Relationship**: One user can have many tags
- **Foreign Key**: `tags.user_id → auth.users.id`
- **Delete Behavior**: CASCADE (deleting user removes their tags)
- **Constraint**: UNIQUE(user_id, name) - no duplicate tag names per user

### 3️⃣ User → Transactions (One-to-Many)
- **Relationship**: One user can have many transactions
- **Foreign Key**: `transactions.user_id → auth.users.id`
- **Delete Behavior**: CASCADE (deleting user removes their transactions)
- **RLS**: Enforces user_id = auth.uid()

### 4️⃣ Category → Transactions (One-to-Many)
- **Relationship**: One category can have many transactions
- **Foreign Key**: `transactions.category_id → categories.id`
- **Delete Behavior**: RESTRICT (prevents deletion of categories with transactions)
- **Purpose**: Protects historical data integrity

### 5️⃣ Transaction ↔ Tags (Many-to-Many via Junction)
- **Relationship**: Many transactions can have many tags
- **Junction Table**: `transaction_tags`
- **Foreign Keys**:
  - `transaction_tags.transaction_id → transactions.id` (CASCADE)
  - `transaction_tags.tag_id → tags.id` (CASCADE)
- **Primary Key**: Composite (transaction_id, tag_id)
- **Uniqueness**: Prevents duplicate tag assignments

---

## Data Flow Examples

### Example 1: Creating a Transaction with Tags

```
1. User creates transaction:
   ┌──────────────────┐
   │  Transaction     │
   │  amount: 50.00   │
   │  type: expense   │
   │  category_id: X  │
   └──────────────────┘
          │
          ▼
   2. Link tags via junction table:
   ┌─────────────────────┐
   │  transaction_tags   │
   │  trans_id: T1       │
   │  tag_id: #coffee    │
   └─────────────────────┘
   ┌─────────────────────┐
   │  transaction_tags   │
   │  trans_id: T1       │
   │  tag_id: #work      │
   └─────────────────────┘
```

### Example 2: Querying Transactions with Tags

```
SELECT Query:
  transactions
    ├─ category (LEFT JOIN categories)
    └─ transaction_tags (LEFT JOIN)
         └─ tag (LEFT JOIN tags)

Result:
  {
    id: "trans-uuid",
    amount: 50.00,
    type: "expense",
    category: { name: "Food", color: "#FF0000" },
    tags: [
      { name: "coffee" },
      { name: "work" }
    ]
  }
```

### Example 3: Deleting a User (CASCADE Effect)

```
DELETE auth.users WHERE id = 'user-uuid'
    │
    ├─ CASCADE → DELETE categories WHERE user_id = 'user-uuid'
    │
    ├─ CASCADE → DELETE tags WHERE user_id = 'user-uuid'
    │                │
    │                └─ CASCADE → DELETE transaction_tags WHERE tag_id IN (...)
    │
    └─ CASCADE → DELETE transactions WHERE user_id = 'user-uuid'
                     │
                     └─ CASCADE → DELETE transaction_tags WHERE transaction_id IN (...)

Result: All user data completely removed (GDPR compliant)
```

### Example 4: Trying to Delete a Category with Transactions

```
DELETE categories WHERE id = 'category-uuid'
    │
    ├─ Check: transactions WHERE category_id = 'category-uuid'
    │
    └─ RESTRICT → ERROR: Cannot delete category with existing transactions

Result: Category deletion prevented (data integrity preserved)
User must first:
  1. Delete all transactions in the category, OR
  2. Re-assign transactions to another category
```

---

## Index Strategy Visualization

### Primary Query Pattern: List User's Recent Transactions

```sql
SELECT * FROM transactions
WHERE user_id = ?
ORDER BY date DESC
LIMIT 50
```

**Index Used**: `idx_transactions_user_date (user_id, date DESC)`

```
Composite Index Structure:
┌─────────────┬──────────────┬──────────┐
│  user_id    │     date     │ row_ptr  │
├─────────────┼──────────────┼──────────┤
│ user-1      │ 2025-12-17   │ ───────► │ Row data
│ user-1      │ 2025-12-16   │ ───────► │
│ user-1      │ 2025-12-15   │ ───────► │
│ user-2      │ 2025-12-17   │ ───────► │
│ user-2      │ 2025-12-16   │ ───────► │
└─────────────┴──────────────┴──────────┘
         │              │
         └──────┬───────┘
                │
        Quick lookup: O(log n) + O(k)
        where k = LIMIT
```

### Tag Filtering Pattern: Transactions by Tag

```sql
SELECT t.* FROM transactions t
JOIN transaction_tags tt ON t.id = tt.transaction_id
WHERE tt.tag_id = ?
ORDER BY t.date DESC
```

**Indexes Used**:
1. `idx_transaction_tags_tag_id (tag_id)` - find matching transaction IDs
2. `idx_transactions_user_date (user_id, date)` - fetch and sort results

```
Step 1: Use tag index
┌──────────┬──────────────────┐
│  tag_id  │  transaction_id  │
├──────────┼──────────────────┤
│ tag-1    │ trans-A          │
│ tag-1    │ trans-B          │
│ tag-1    │ trans-C          │
└──────────┴──────────────────┘
     │
     └───► Step 2: Fetch transactions using PK
             ┌──────────────────┐
             │  transactions    │
             │  id: trans-A     │
             │  id: trans-B     │
             │  id: trans-C     │
             └──────────────────┘
```

---

## Constraint Validation Flow

### Transaction Insert Validation

```
User submits transaction:
  amount: -50.00
  type: "EXPENSE"
  description: "..." (501 chars)
     │
     ▼
┌─────────────────────────────────────┐
│  BEFORE INSERT TRIGGER              │
│  normalize_transaction_type()       │
│  Converts "EXPENSE" → "expense"     │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  CHECK CONSTRAINTS                  │
│  ✓ transactions_amount_positive     │ ✗ FAIL: -50.00 ≤ 0
│  ✓ transactions_type_check          │ ✓ PASS: "expense" valid
│  ✓ transactions_description_length  │ ✗ FAIL: 501 > 500
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  FOREIGN KEY CONSTRAINTS            │
│  ✓ user_id → auth.users             │
│  ✓ category_id → categories         │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  ROW LEVEL SECURITY                 │
│  ✓ auth.uid() = user_id             │
└─────────────────────────────────────┘
     │
     ▼
   REJECT ✗
   Error: Constraint violations
```

---

## RLS Policy Enforcement

### SELECT Query Flow

```
User requests: SELECT * FROM transactions

Step 1: Parse query
   ↓
Step 2: Apply RLS filter
   SELECT * FROM transactions
   WHERE auth.uid() = user_id  ← Injected by RLS
   ↓
Step 3: Execute filtered query
   ↓
Step 4: Return only user's transactions

Result: Cross-user isolation guaranteed at database level
```

### Transaction_Tags RLS (Junction Table)

```
User requests: SELECT * FROM transaction_tags

Step 1: Parse query
   ↓
Step 2: Apply RLS filter (subquery)
   SELECT * FROM transaction_tags
   WHERE EXISTS (
     SELECT 1 FROM transactions
     WHERE transactions.id = transaction_tags.transaction_id
     AND transactions.user_id = auth.uid()  ← User ownership check
   )
   ↓
Step 3: Execute filtered query with JOIN
   ↓
Step 4: Return only tags for user's transactions

Result: Users cannot see or modify tags on other users' transactions
```

---

## Performance Characteristics

### Expected Query Times (with indexes)

| Query Type | Records | Time | Index Used |
|------------|---------|------|------------|
| List transactions (recent 50) | 10K | ~10ms | idx_transactions_user_date |
| List transactions (recent 50) | 100K | ~15ms | idx_transactions_user_date |
| List transactions (recent 50) | 1M | ~25ms | idx_transactions_user_date |
| Filter by category | 10K | ~20ms | idx_transactions_category_id |
| Filter by tag | 10K | ~30ms | idx_transaction_tags_tag_id |
| Get single transaction + tags | 10K | ~5ms | Primary key + junction index |

### Scale Limits

- ✅ **Excellent**: 0 - 100K transactions per user
- ✅ **Good**: 100K - 1M transactions per user
- ⚠️ **Consider partitioning**: > 1M transactions per user

---

## Security Layers

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: Application Layer (Next.js)               │
│  - Input validation                                 │
│  - Type checking                                    │
│  - Business logic                                   │
└─────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│  Layer 2: API Layer (Server Actions)                │
│  - Authentication check                             │
│  - Authorization logic                              │
│  - Supabase client with user context                │
└─────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│  Layer 3: Database Layer (PostgreSQL + RLS)         │
│  ├─ Row Level Security policies                     │
│  ├─ CHECK constraints                               │
│  ├─ Foreign key constraints                         │
│  ├─ Unique constraints                              │
│  └─ Type constraints                                │
└─────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│  Layer 4: Storage Layer (Persistent)                │
│  - Data encrypted at rest                           │
│  - Backup and replication                           │
└─────────────────────────────────────────────────────┘
```

**Defense in Depth**: Multiple layers ensure security even if one layer fails.

---

## Summary

### ✅ Schema Strengths

1. **Data Integrity**
   - Foreign keys prevent orphaned records
   - CHECK constraints validate data at insert
   - Unique constraints prevent duplicates

2. **Security**
   - RLS policies enforce user isolation
   - No cross-user data leakage possible
   - Cascade deletes protect privacy (GDPR compliant)

3. **Performance**
   - Indexes optimize common query patterns
   - Composite indexes for complex queries
   - Junction table indexes for many-to-many

4. **Maintainability**
   - Clear naming conventions
   - Audit timestamps on all tables
   - Auto-update triggers for timestamps
   - Type normalization prevents inconsistencies

5. **Flexibility**
   - Categories for broad classification
   - Tags for detailed, multi-dimensional classification
   - Extensible design for future features

---

**Schema Status**: ✅ **PRODUCTION READY**

This schema provides a solid foundation for the FinanceFlow transaction management system with excellent security, performance, and maintainability characteristics.
