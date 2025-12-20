# Payment Methods Schema Documentation

## Overview
This document details the implementation of the `payment_methods` table for multi-currency support in FinanceFlow (Card #19 - Story 1).

## Implementation Date
December 18, 2025

## Migration Files
1. `/supabase/migrations/20251218000001_create_payment_methods_table.sql` - Creates payment_methods table with RLS policies
2. `/supabase/migrations/20251218000002_add_payment_method_to_transactions.sql` - Links transactions to payment methods

---

## Table Structure

### payment_methods

**Purpose**: Store user payment methods (bank cards, cash wallets, savings accounts) with multi-currency support.

#### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | NO | - | Foreign key to `auth.users` |
| `name` | TEXT | NO | - | User-defined name (e.g., "Chase Visa", "Cash Wallet") |
| `currency` | TEXT | NO | - | ISO 4217 currency code (e.g., USD, EUR, UAH) |
| `card_type` | TEXT | YES | NULL | Type: `debit`, `credit`, `cash`, `savings`, `other` |
| `color` | TEXT | YES | NULL | Hex color code for UI (e.g., `#3B82F6`) |
| `is_default` | BOOLEAN | NO | `false` | Marks default payment method for quick entry |
| `is_active` | BOOLEAN | NO | `true` | Soft delete flag (archived when false) |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update timestamp (auto-updated by trigger) |

#### Constraints

1. **chk_currency_format**: Currency must be uppercase 3-letter ISO 4217 code
   ```sql
   CHECK (currency ~ '^[A-Z]{3}$')
   ```

2. **chk_card_type**: Card type must be one of the allowed values or NULL
   ```sql
   CHECK (card_type IS NULL OR card_type IN ('debit', 'credit', 'cash', 'savings', 'other'))
   ```

3. **chk_color_format**: Color must be valid hex format if provided
   ```sql
   CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$')
   ```

4. **chk_name_length**: Name must be 1-100 characters
   ```sql
   CHECK (LENGTH(TRIM(name)) >= 1 AND LENGTH(name) <= 100)
   ```

5. **uq_user_payment_method_name**: Payment method names must be unique per user
   ```sql
   UNIQUE (user_id, name)
   ```

#### Indexes

| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `payment_methods_pkey` | `id` | PRIMARY KEY | Unique identifier lookup |
| `idx_payment_methods_user_id` | `user_id` | B-TREE | User-specific queries |
| `idx_payment_methods_user_active` | `user_id, is_active` | B-TREE (partial) | Filter active payment methods |
| `idx_payment_methods_user_default` | `user_id, is_default` | B-TREE (partial) | Quick default lookup |
| `idx_payment_methods_currency` | `currency` | B-TREE | Currency-based filtering |

---

## Row Level Security (RLS)

**RLS Enabled**: ✅ YES

### Policies

#### 1. SELECT Policy
**Name**: `Users can view their own payment methods`
```sql
CREATE POLICY "Users can view their own payment methods"
  ON payment_methods FOR SELECT
  USING (auth.uid() = user_id);
```
**Effect**: Users can only see payment methods they own.

#### 2. INSERT Policy
**Name**: `Users can create their own payment methods`
```sql
CREATE POLICY "Users can create their own payment methods"
  ON payment_methods FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```
**Effect**: Users can only create payment methods for themselves.

#### 3. UPDATE Policy
**Name**: `Users can update their own payment methods`
```sql
CREATE POLICY "Users can update their own payment methods"
  ON payment_methods FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```
**Effect**: Users can only update their own payment methods.

#### 4. DELETE Policy
**Name**: `Users can delete their own payment methods`
```sql
CREATE POLICY "Users can delete their own payment methods"
  ON payment_methods FOR DELETE
  USING (auth.uid() = user_id);
```
**Effect**: Users can only delete their own payment methods (soft delete via `is_active` is preferred).

---

## Triggers

### 1. Update Timestamp Trigger
**Name**: `update_payment_methods_updated_at`
**Function**: `update_updated_at_column()`
**Purpose**: Automatically updates `updated_at` timestamp on any row modification.

### 2. Single Default Payment Method Trigger
**Name**: `trg_ensure_single_default_payment_method`
**Function**: `ensure_single_default_payment_method()`
**Purpose**: Ensures only one payment method per user can be marked as default.
**Behavior**: When a payment method is set as default, all other payment methods for that user are automatically set to `is_default = false`.

### 3. Data Normalization Trigger
**Name**: `normalize_payment_method_data`
**Function**: `normalize_payment_method_currency()`
**Purpose**: Normalizes data before insert/update:
- Converts currency to uppercase
- Trims whitespace from name
- Converts color to uppercase hex format

---

## Helper Functions

### 1. get_payment_method_balance(UUID)
**Purpose**: Calculate current balance for a payment method by summing income and subtracting expenses.

**Signature**:
```sql
CREATE OR REPLACE FUNCTION get_payment_method_balance(p_payment_method_id UUID)
RETURNS DECIMAL(12, 2)
```

**Usage**:
```sql
SELECT get_payment_method_balance('550e8400-e29b-41d4-a716-446655440000');
-- Returns: 1250.50 (example balance)
```

**Calculation Logic**:
- Income transactions: `+amount`
- Expense transactions: `-amount`
- Returns: `SUM(income) - SUM(expense)`

### 2. get_user_active_payment_methods_count(UUID)
**Purpose**: Count active payment methods for a user.

**Signature**:
```sql
CREATE OR REPLACE FUNCTION get_user_active_payment_methods_count(p_user_id UUID)
RETURNS INTEGER
```

**Usage**:
```sql
SELECT get_user_active_payment_methods_count(auth.uid());
-- Returns: 3 (example count)
```

### 3. get_user_default_payment_method(UUID)
**Purpose**: Get the UUID of the user's default payment method.

**Signature**:
```sql
CREATE OR REPLACE FUNCTION get_user_default_payment_method(p_user_id UUID)
RETURNS UUID
```

**Usage**:
```sql
SELECT get_user_default_payment_method(auth.uid());
-- Returns: '550e8400-e29b-41d4-a716-446655440000' (example UUID)
```

### 4. get_user_balance_by_currency(UUID)
**Purpose**: Get user balances grouped by currency across all active payment methods.

**Signature**:
```sql
CREATE OR REPLACE FUNCTION get_user_balance_by_currency(p_user_id UUID)
RETURNS TABLE (
  currency TEXT,
  balance DECIMAL(12, 2)
)
```

**Usage**:
```sql
SELECT * FROM get_user_balance_by_currency(auth.uid());
-- Returns:
-- | currency | balance   |
-- |----------|-----------|
-- | EUR      | 1500.00   |
-- | UAH      | 25000.50  |
-- | USD      | 3250.75   |
```

---

## Integration with Transactions

### Modified transactions Table

**Added Column**: `payment_method_id UUID`
- **Type**: UUID
- **Nullable**: YES (for backward compatibility)
- **Foreign Key**: References `payment_methods(id)` ON DELETE RESTRICT
- **Purpose**: Links each transaction to a payment method for multi-currency tracking

### Validation Trigger
**Name**: `trg_validate_transaction_payment_method`
**Function**: `validate_transaction_payment_method()`
**Purpose**: Ensures payment method belongs to the same user as the transaction.

**Error Example**:
```sql
-- User A tries to create transaction with User B's payment method
-- Result: EXCEPTION 'Payment method does not belong to the user'
```

### Indexes on transactions
1. `idx_transactions_payment_method_id` - Efficient queries by payment method
2. `idx_transactions_user_payment_method` - Combined user + payment method queries

---

## TypeScript Types

Generated types are available in `/src/types/database.types.ts`:

```typescript
export type Database = {
  public: {
    Tables: {
      payment_methods: {
        Row: {
          id: string
          user_id: string
          name: string
          currency: string
          card_type: string | null
          color: string | null
          is_default: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          currency: string
          card_type?: string | null
          color?: string | null
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          currency?: string
          card_type?: string | null
          color?: string | null
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      // ... other tables
    }
  }
}
```

---

## Common ISO 4217 Currency Codes

| Code | Currency |
|------|----------|
| USD | United States Dollar |
| EUR | Euro |
| UAH | Ukrainian Hryvnia |
| GBP | British Pound Sterling |
| JPY | Japanese Yen |
| CNY | Chinese Yuan |
| CHF | Swiss Franc |
| CAD | Canadian Dollar |
| AUD | Australian Dollar |
| PLN | Polish Złoty |
| CZK | Czech Koruna |
| SEK | Swedish Krona |
| NOK | Norwegian Krone |
| DKK | Danish Krone |
| HUF | Hungarian Forint |
| RON | Romanian Leu |
| BGN | Bulgarian Lev |
| RUB | Russian Ruble |
| TRY | Turkish Lira |
| INR | Indian Rupee |

*Note: Full list of 170+ currencies available in ISO 4217 standard.*

---

## Usage Examples

### Example 1: Create a Payment Method
```sql
INSERT INTO payment_methods (user_id, name, currency, card_type, color, is_default)
VALUES (
  auth.uid(),
  'Chase Sapphire Reserve',
  'USD',
  'credit',
  '#0066CC',
  true
);
```

### Example 2: Get User's Active Payment Methods
```sql
SELECT id, name, currency, card_type, color, is_default
FROM payment_methods
WHERE user_id = auth.uid()
  AND is_active = true
ORDER BY is_default DESC, name ASC;
```

### Example 3: Archive a Payment Method (Soft Delete)
```sql
UPDATE payment_methods
SET is_active = false
WHERE id = '550e8400-e29b-41d4-a716-446655440000'
  AND user_id = auth.uid();
```

### Example 4: Get Balance for Each Payment Method
```sql
SELECT
  pm.id,
  pm.name,
  pm.currency,
  get_payment_method_balance(pm.id) AS balance
FROM payment_methods pm
WHERE pm.user_id = auth.uid()
  AND pm.is_active = true
ORDER BY pm.currency, pm.name;
```

### Example 5: Create Transaction with Payment Method
```sql
INSERT INTO transactions (
  user_id,
  payment_method_id,
  category_id,
  amount,
  type,
  date,
  description
) VALUES (
  auth.uid(),
  '550e8400-e29b-41d4-a716-446655440000', -- payment method ID
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890', -- category ID
  125.50,
  'expense',
  CURRENT_DATE,
  'Grocery shopping at Trader Joe''s'
);
```

---

## Testing Checklist

### ✅ Schema Tests
- [x] Table created successfully with all columns
- [x] All constraints are applied (currency format, card type, color format, name length)
- [x] All indexes are created (5 indexes)
- [x] Unique constraint on (user_id, name) works
- [x] Foreign key to auth.users is set up with CASCADE delete

### ✅ RLS Tests
- [x] RLS is enabled on payment_methods table
- [x] 4 policies created (SELECT, INSERT, UPDATE, DELETE)
- [x] Users can only see their own payment methods
- [x] Users cannot access other users' payment methods

### ✅ Trigger Tests
- [x] `updated_at` is auto-updated on modification
- [x] Only one payment method can be default per user
- [x] Currency is normalized to uppercase
- [x] Name whitespace is trimmed
- [x] Color is normalized to uppercase hex

### ✅ Function Tests
- [x] `get_payment_method_balance()` calculates correctly
- [x] `get_user_active_payment_methods_count()` counts correctly
- [x] `get_user_default_payment_method()` returns correct UUID
- [x] `get_user_balance_by_currency()` groups by currency correctly

### ✅ Integration Tests
- [x] `payment_method_id` column added to transactions table
- [x] Foreign key constraint works (ON DELETE RESTRICT)
- [x] Validation trigger prevents mismatched user/payment method
- [x] Indexes on transactions.payment_method_id created

### ✅ TypeScript Types
- [x] Types generated successfully
- [x] payment_methods types include all fields
- [x] transactions types include payment_method_id field

---

## Migration Status

| Migration | Status | Applied At |
|-----------|--------|------------|
| 20251218000001_create_payment_methods_table.sql | ✅ Applied | 2025-12-18 |
| 20251218000002_add_payment_method_to_transactions.sql | ✅ Applied | 2025-12-18 |

**Database Version**: All migrations up to `20251218000002` applied successfully.

---

## Security Considerations

### ✅ Data Isolation
- Row Level Security (RLS) ensures complete data isolation between users
- No user can access another user's payment methods through any query
- All queries are automatically filtered by `auth.uid() = user_id`

### ✅ Referential Integrity
- Foreign key constraints prevent orphaned records
- ON DELETE CASCADE on user_id ensures cleanup when user account is deleted
- ON DELETE RESTRICT on payment_method_id in transactions prevents deletion of payment methods with transactions

### ✅ Input Validation
- Currency code validated against ISO 4217 format (3 uppercase letters)
- Card type restricted to predefined set of values
- Color validated as proper hex format
- Name length restricted (1-100 characters)

### ✅ Audit Trail
- `created_at` and `updated_at` timestamps for all records
- Soft delete via `is_active` flag preserves historical data
- Transactions retain payment_method_id even if payment method is archived

---

## Performance Considerations

### Indexes
All critical query paths are indexed:
- User-specific queries: `idx_payment_methods_user_id`
- Active payment methods: `idx_payment_methods_user_active` (partial index)
- Default payment method: `idx_payment_methods_user_default` (partial index)
- Currency filtering: `idx_payment_methods_currency`

### Partial Indexes
Used for frequently filtered columns:
- `WHERE is_active = true` - Only indexes active records
- `WHERE is_default = true` - Only indexes default records
- Reduces index size and improves performance

### Function Performance
- All helper functions are marked as `STABLE` for query optimization
- `SECURITY DEFINER` used carefully to bypass RLS only when necessary
- SQL language used for simple functions (better performance than plpgsql)

---

## Future Enhancements

### Potential Improvements
1. **Payment Method Icons**: Add `icon` field for custom SVG/emoji icons
2. **Currency Exchange Rates**: Table to store historical exchange rates for multi-currency reporting
3. **Payment Method Groups**: Organize payment methods into groups (e.g., "Personal", "Business")
4. **Transaction Limits**: Daily/monthly spending limits per payment method
5. **Account Numbers**: Encrypted storage of partial account/card numbers
6. **Bank Integration**: Link to external banking APIs for automatic balance sync

### Backward Compatibility
The `payment_method_id` column in transactions is nullable to support:
1. Existing transactions created before multi-currency feature
2. Gradual migration of historical data
3. Optional payment method assignment

**To enforce payment method**: After data migration, run:
```sql
ALTER TABLE transactions
ALTER COLUMN payment_method_id SET NOT NULL;
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Duplicate Default Payment Method
**Symptom**: Multiple payment methods show `is_default = true`
**Solution**: The trigger should prevent this, but if it occurs:
```sql
-- Manually fix: Keep only the most recently updated as default
UPDATE payment_methods
SET is_default = false
WHERE user_id = auth.uid()
  AND id != (
    SELECT id FROM payment_methods
    WHERE user_id = auth.uid() AND is_default = true
    ORDER BY updated_at DESC
    LIMIT 1
  );
```

#### Issue 2: Currency Code Validation Error
**Symptom**: `new row for relation "payment_methods" violates check constraint "chk_currency_format"`
**Solution**: Ensure currency is uppercase 3-letter code:
```sql
-- Correct
INSERT INTO payment_methods (user_id, name, currency) VALUES (auth.uid(), 'Card', 'USD');

-- Incorrect (lowercase)
INSERT INTO payment_methods (user_id, name, currency) VALUES (auth.uid(), 'Card', 'usd');
```

#### Issue 3: Payment Method Doesn't Belong to User
**Symptom**: `Payment method does not belong to the user`
**Solution**: The validation trigger prevents assigning another user's payment method. Use only your own payment methods:
```sql
-- Get your payment methods
SELECT id, name FROM payment_methods WHERE user_id = auth.uid();
```

---

## Contact & Support

For questions or issues with the payment_methods schema:
- **System Architect**: Agent 02
- **Backend Developer**: Agent 03 (for Server Actions integration)
- **Frontend Developer**: Agent 04 (for UI components)

---

**Document Version**: 1.0
**Last Updated**: 2025-12-18
**Status**: ✅ Production Ready
