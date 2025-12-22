# Transfer Schema Design Documentation

## Overview

This document describes the database schema changes for Card #43: Payment Account Transfers.

**Migration File**: `/supabase/migrations/20251222000002_add_transfer_support.sql`

---

## Architecture Decision: Linked Transactions Approach

### Why Two Transactions Instead of One?

We chose to create **TWO linked transactions** for each transfer rather than a single "transfer" transaction.

### Benefits

1. **Currency Separation**: Each transaction maintains its native currency (cleaner data model)
2. **Automatic Balance**: Balance calculations work automatically (sum of transactions per payment method)
3. **Preserves Logic**: Existing transaction logic remains intact
4. **UI Flexibility**: Can display as unified "Transfer" in UI while maintaining data integrity
5. **Clean Conversion**: Easier to handle currency conversion (each side in its own currency)
6. **Backward Compatible**: No breaking changes to existing code

### Example Transfer

**Scenario**: User transfers $100 from USD Credit Card to EUR Savings (rate: 1 USD = 0.925 EUR)

```sql
-- Transaction 1 (Withdrawal from USD Credit Card)
INSERT INTO transactions (
  user_id,
  payment_method_id,
  amount,
  native_amount,
  base_currency,
  exchange_rate,
  type,
  linked_transaction_id,
  description,
  date
) VALUES (
  'user-uuid',
  'usd-card-uuid',
  -100.00,                    -- Negative = withdrawal
  -100.00,                    -- Native amount in USD
  'USD',                      -- User's base currency
  1.00,                       -- No conversion needed (USD to USD)
  'transfer',
  'transaction-2-uuid',       -- Links to deposit transaction
  'Transfer to EUR Savings',
  '2025-12-22'
);

-- Transaction 2 (Deposit to EUR Savings)
INSERT INTO transactions (
  user_id,
  payment_method_id,
  amount,
  native_amount,
  base_currency,
  exchange_rate,
  type,
  linked_transaction_id,
  description,
  date
) VALUES (
  'user-uuid',
  'eur-savings-uuid',
  92.50,                      -- Positive = deposit (converted to USD)
  92.50,                      -- Native amount in EUR
  'EUR',                      -- Payment method currency
  1.08,                       -- EUR to USD conversion rate
  'transfer',
  'transaction-1-uuid',       -- Links to withdrawal transaction
  'Transfer from USD Credit Card',
  '2025-12-22'
);
```

**Result**:
- USD Credit Card balance: -$100.00
- EUR Savings balance: +€92.50
- Overall user balance (in USD): $0.00 (because -100 + 92.50*1.08 ≈ 0)

---

## Schema Changes

### 1. Extended Transaction Type Enum

**Before**: `type` could only be `'income'` or `'expense'`

**After**: `type` can be `'income'`, `'expense'`, or `'transfer'`

```sql
ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_type_check
  CHECK (LOWER(type) IN ('income', 'expense', 'transfer'));
```

### 2. Added `linked_transaction_id` Column

**Purpose**: Links the two sides of a transfer together

```sql
ALTER TABLE transactions
  ADD COLUMN linked_transaction_id UUID
    REFERENCES transactions(id) ON DELETE CASCADE;

CREATE INDEX idx_transactions_linked_transaction_id
  ON transactions(linked_transaction_id)
  WHERE linked_transaction_id IS NOT NULL;
```

**Cascade Delete**: If one side of a transfer is deleted, the other side is automatically deleted to maintain data integrity.

### 3. Made `category_id` Nullable

**Before**: `category_id` was `NOT NULL` (required for all transactions)

**After**: `category_id` is nullable for transfers

```sql
ALTER TABLE transactions
  ALTER COLUMN category_id DROP NOT NULL;
```

### 4. Added Category Validation Constraint

**Rule**: Transfers must NOT have a category, income/expense MUST have a category

```sql
ALTER TABLE transactions
  ADD CONSTRAINT check_category_by_type
  CHECK (
    (type = 'transfer' AND category_id IS NULL) OR
    (type IN ('income', 'expense') AND category_id IS NOT NULL)
  );
```

---

## Database Functions Updated

### 1. `calculate_budget_spent()`

**Change**: Excludes transfer transactions from budget calculations

**Why**: Transfers move money between accounts and shouldn't count toward spending budgets

```sql
-- Before: Counted all transactions
SELECT SUM(amount) FROM transactions WHERE category_id = p_category_id;

-- After: Excludes transfers
SELECT SUM(amount) FROM transactions
WHERE category_id = p_category_id
  AND type != 'transfer';  -- NEW
```

### 2. `get_user_balance()`

**Change**: Handles transfer transactions based on amount sign

**Why**: Transfers don't have categories, so we use the amount directly

```sql
-- Added case for transfers
CASE
  WHEN t.type = 'income' THEN t.amount
  WHEN t.type = 'expense' THEN -t.amount
  WHEN t.type = 'transfer' THEN t.amount  -- NEW: Use amount as-is
  ELSE 0
END
```

### 3. `budget_progress` View

**Change**: Excludes transfer transactions from budget calculations

**Why**: Transfers shouldn't affect budget tracking

```sql
-- All queries now include: AND t.type != 'transfer'
```

---

## TypeScript Type Updates Needed

**File**: `/src/types/database.types.ts`

### Expected Changes After Type Generation

```typescript
// Transaction type in Row, Insert, Update
type: string;  // Will accept 'income' | 'expense' | 'transfer'

// category_id becomes nullable
category_id: string | null;  // Changed from: string

// New field
linked_transaction_id: string | null;  // Added

// Relationships will include self-reference
Relationships: [
  // ... existing relationships ...
  {
    foreignKeyName: "transactions_linked_transaction_id_fkey";
    columns: ["linked_transaction_id"];
    isOneToOne: false;
    referencedRelation: "transactions";
    referencedColumns: ["id"];
  }
]
```

### Application-Level Types

Create custom types for working with transfers:

```typescript
// src/types/transfer.ts
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface TransferPair {
  id: string; // ID of source transaction
  sourceTransaction: Transaction;
  destinationTransaction: Transaction;
  sourcePaymentMethod: PaymentMethod;
  destinationPaymentMethod: PaymentMethod;
  sourceAmount: number; // Always negative
  destinationAmount: number; // Always positive
  exchangeRate: number;
  date: string;
  description?: string;
}

export interface CreateTransferInput {
  sourcePaymentMethodId: string;
  destinationPaymentMethodId: string;
  amount: number; // Amount in source currency (positive)
  date: string;
  description?: string;
}
```

---

## Row Level Security (RLS)

**No Changes Needed**: Existing RLS policies cover transfers automatically.

**Why**: Transfers are still user-owned transactions, so existing policies apply:

```sql
-- Existing policy works for all transaction types
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Same for INSERT, UPDATE, DELETE
```

---

## Validation Rules

### Database Level (Enforced)

✅ **Type validation**: Only 'income', 'expense', or 'transfer' allowed
✅ **Category validation**: Transfers have NULL category, others require category
✅ **Foreign key**: `linked_transaction_id` must reference valid transaction
✅ **Cascade delete**: Deleting one side deletes the other
✅ **RLS**: Users can only access their own transactions

### Application Level (Backend Validation Needed)

❌ **Source/destination must differ**: Can't transfer to same payment method
❌ **Linked pair validation**: Both transactions must exist and link to each other
❌ **Amount signs**: Source must be negative, destination must be positive
❌ **User ownership**: Both payment methods must belong to the user
❌ **Currency conversion**: Exchange rates must be valid and match payment method currencies

---

## Migration Rollback Plan

If issues arise, run this SQL to revert changes:

```sql
-- 1. Drop new constraint
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS check_category_by_type;

-- 2. Remove linked_transaction_id
ALTER TABLE transactions DROP COLUMN IF EXISTS linked_transaction_id;

-- 3. Revert type constraint to original
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions
  ADD CONSTRAINT transactions_type_check
  CHECK (LOWER(type) IN ('income', 'expense'));

-- 4. Make category_id NOT NULL again
UPDATE transactions SET category_id = (
  SELECT id FROM categories WHERE user_id = transactions.user_id LIMIT 1
)
WHERE category_id IS NULL;

ALTER TABLE transactions ALTER COLUMN category_id SET NOT NULL;

-- 5. Restore original functions (re-run previous migration)
```

---

## Testing Checklist

### Database Tests

- [ ] Create transfer with two linked transactions
- [ ] Verify cascade delete (deleting one deletes the other)
- [ ] Verify check constraint (transfer with category fails)
- [ ] Verify check constraint (income/expense without category fails)
- [ ] Verify type enum (invalid type fails)
- [ ] Verify RLS (user can't see other user's transfers)
- [ ] Verify budget calculations exclude transfers
- [ ] Verify balance calculations include transfers correctly

### Edge Cases

- [ ] Same payment method source/destination (should fail at app level)
- [ ] Orphaned linked_transaction_id (one side deleted manually)
- [ ] Circular linked_transaction_id references
- [ ] Transfer with tags (allowed or disallowed?)
- [ ] Transfer amount validation (source negative, destination positive)
- [ ] Currency conversion accuracy

### Integration Tests

- [ ] Create transfer via Server Action
- [ ] Display transfer in transaction list
- [ ] Filter out transfers from budget progress
- [ ] Calculate payment method balances correctly
- [ ] Delete transfer (both sides deleted)
- [ ] Update transfer (update both sides)

---

## Next Steps

1. **Apply Migration** (System Architect - YOU)
   - [x] Create migration file
   - [ ] Test locally with `npx supabase db reset`
   - [ ] Verify with `npx supabase db diff`
   - [ ] Apply to production with `npx supabase db push`
   - [ ] Generate TypeScript types
   - [ ] Run security advisors

2. **Backend Implementation** (Backend Developer - Agent 03)
   - [ ] Create `createTransfer` Server Action
   - [ ] Create `deleteTransfer` Server Action
   - [ ] Create `getTransferById` function
   - [ ] Create `getUserTransfers` function
   - [ ] Add validation logic
   - [ ] Handle currency conversion

3. **Frontend Implementation** (Frontend Developer - Agent 04)
   - [ ] Create Transfer Form UI
   - [ ] Add transfer type to transaction list
   - [ ] Display linked transfers as single item
   - [ ] Update transaction filters
   - [ ] Show transfer details

4. **QA Testing** (QA Engineer - Agent 05)
   - [ ] Write Playwright tests
   - [ ] Test transfer creation flow
   - [ ] Test transfer deletion
   - [ ] Test budget calculations
   - [ ] Test edge cases

---

## Performance Considerations

### Indexes Created

```sql
-- Index for linked transaction lookups (partial index, only non-null values)
CREATE INDEX idx_transactions_linked_transaction_id
  ON transactions(linked_transaction_id)
  WHERE linked_transaction_id IS NOT NULL;
```

**Why Partial Index**: Most transactions are NOT transfers, so we only index the small subset that are.

### Query Performance

**Before**: Budget calculations scanned all transactions
**After**: Budget calculations filter out transfers (uses type index)

**Impact**: Minimal - transfers are expected to be a small percentage of total transactions

---

## Documentation Updates Needed

- [ ] Update API documentation with transfer endpoints
- [ ] Update user documentation with transfer feature
- [ ] Update schema diagram in ARCHITECTURE.md
- [ ] Add transfer examples to EXAMPLE_USAGE.md

---

## Questions for Product Manager

1. **Transfer Tags**: Should transfers support tags? Currently allowed by schema but unclear if desired.
2. **Transfer History**: Should transfers have a separate history view or mixed with regular transactions?
3. **Transfer Reversal**: Do we need a "reverse transfer" feature?
4. **Transfer Limits**: Should there be daily/monthly transfer limits?
5. **Transfer Fees**: Do we need to handle transfer fees between accounts?

---

## Version History

- **2025-12-22**: Initial design and migration created
