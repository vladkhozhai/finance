# Card #20 Schema Implementation - Handoff Document

**From**: System Architect (Agent 02)
**To**: Backend Developer (Agent 03)
**Date**: 2025-12-18
**Status**: ✅ READY FOR BACKEND IMPLEMENTATION

---

## Quick Summary

The database schema for **multi-currency transaction support** is complete and tested. All migrations have been applied successfully to the local Supabase instance.

### What's Ready:

✅ **4 new columns** added to `transactions` table
✅ **`exchange_rates` table** created with 28 pre-seeded currency pairs
✅ **Helper functions** for currency conversion (`get_exchange_rate`, `convert_amount`)
✅ **Performance indexes** in place
✅ **RLS policies** configured
✅ **TypeScript types** regenerated and available in `src/types/database.types.ts`
✅ **100% backward compatible** - existing transactions work as-is

---

## Files Created/Modified

### 1. Migration File
**Path**: `/Users/vladislav.khozhai/WebstormProjects/finance/supabase/migrations/20251218113344_add_multi_currency_to_transactions.sql`

**Contains**:
- Schema changes to `transactions` table
- New `exchange_rates` table
- Helper functions
- RLS policies
- Seeded exchange rate data (28 currency pairs)
- Comprehensive inline documentation

### 2. Documentation
**Path**: `/Users/vladislav.khozhai/WebstormProjects/finance/MULTI_CURRENCY_SCHEMA_DESIGN.md`

**Contains**:
- Full architectural decisions and rationale
- Schema design details
- Usage examples
- Performance considerations
- Security (RLS) documentation
- Migration verification steps

### 3. TypeScript Types
**Path**: `/Users/vladislav.khozhai/WebstormProjects/finance/src/types/database.types.ts`

**Updated with**:
- `transactions` table types (including new multi-currency fields)
- `exchange_rates` table types
- All type definitions for Insert/Update/Row

### 4. Verification Script
**Path**: `/Users/vladislav.khozhai/WebstormProjects/finance/scripts/verify_multi_currency_schema.sql`

**Use to verify**:
- Schema changes applied correctly
- Helper functions working
- Exchange rates seeded
- Indexes created
- RLS policies active

---

## Schema Changes Summary

### Extended `transactions` Table

```typescript
// New fields in Database['public']['Tables']['transactions']['Row']
interface TransactionRow {
  // ... existing fields ...
  payment_method_id: string | null;    // FK to payment_methods
  native_amount: number | null;        // Amount in payment method's currency
  exchange_rate: number | null;        // Rate used at transaction time
  base_currency: string | null;        // User's base currency (ISO 4217)
}
```

**Key Points**:
- All new fields are **nullable** (backward compatibility)
- Existing transactions have `NULL` for these fields
- Application must validate: if `payment_method_id` set, then `native_amount`, `exchange_rate`, `base_currency` must also be set

### New `exchange_rates` Table

```typescript
interface ExchangeRateRow {
  id: string;
  from_currency: string;        // ISO 4217 (e.g., 'EUR')
  to_currency: string;          // ISO 4217 (e.g., 'USD')
  rate: number;                 // Conversion rate (6 decimal precision)
  date: string;                 // Date rate is valid for
  source: string;               // 'STUB', 'MANUAL', 'API'
  created_at: string;
}
```

**Key Points**:
- 28 pre-seeded rates for common currencies (USD, EUR, GBP, UAH, CAD, AUD, JPY, CHF, PLN, CZK)
- No identity rates stored (USD→USD) - handled by helper function
- Both direct and reverse rates stored for performance

---

## Helper Functions Available

### 1. `get_exchange_rate(from_currency, to_currency, date?)`

**Purpose**: Get conversion rate between two currencies

**Returns**: `number | null` (rate with 6 decimal precision)

**Example Usage**:
```sql
-- Get current EUR to USD rate
SELECT get_exchange_rate('EUR', 'USD');
-- Returns: 1.086957

-- Get historical rate
SELECT get_exchange_rate('GBP', 'USD', '2024-12-01');
-- Returns: 1.265823

-- Identity conversion (same currency)
SELECT get_exchange_rate('USD', 'USD');
-- Returns: 1.0
```

**Fallback Logic**:
1. Identity check (same currency) → return 1.0
2. Direct lookup (from→to)
3. Inverse lookup (to→from), return 1/rate
4. Not found → return NULL

---

### 2. `convert_amount(amount, from_currency, to_currency, date?)`

**Purpose**: Convert amount from one currency to another

**Returns**: `number | null` (converted amount with 2 decimal precision)

**Example Usage**:
```sql
-- Convert €100 to USD
SELECT convert_amount(100.00, 'EUR', 'USD');
-- Returns: 108.70

-- Convert ₴1000 to USD
SELECT convert_amount(1000.00, 'UAH', 'USD');
-- Returns: 24.39
```

---

### 3. Updated `get_user_balance(user_id)`

**Changes**:
- Now filters by user's base currency
- Includes legacy transactions (NULL `base_currency` treated as base currency)
- Excludes multi-currency transactions in other currencies

**Note**: Multi-currency balance aggregation should be handled in application layer (sum all payment method balances converted to base currency).

---

### 4. Updated `get_payment_method_balance(payment_method_id)`

**Changes**:
- Returns balance in payment method's **native currency**
- Uses `native_amount` if available, falls back to `amount`

**Example**:
```sql
-- Get EUR card balance (in EUR, not USD)
SELECT get_payment_method_balance('eur-card-uuid');
-- Returns: 256.80 EUR
```

---

## Backend Implementation Guide

### Creating a Multi-Currency Transaction

**Server Action Flow**:

```typescript
// 1. Get payment method details
const paymentMethod = await supabase
  .from('payment_methods')
  .select('*')
  .eq('id', paymentMethodId)
  .single();

// 2. Get user's base currency
const profile = await supabase
  .from('profiles')
  .select('currency')
  .eq('id', userId)
  .single();

const baseCurrency = profile.data?.currency || 'USD';

// 3. Get exchange rate (if currencies differ)
let exchangeRate = 1.0;
let baseAmount = nativeAmount;

if (paymentMethod.data.currency !== baseCurrency) {
  const rateResult = await supabase
    .rpc('get_exchange_rate', {
      p_from_currency: paymentMethod.data.currency,
      p_to_currency: baseCurrency,
      p_date: transactionDate
    });

  if (rateResult.data === null) {
    throw new Error('Exchange rate not available');
  }

  exchangeRate = rateResult.data;
  baseAmount = Math.round(nativeAmount * exchangeRate * 100) / 100;
}

// 4. Create transaction with multi-currency data
const { data, error } = await supabase
  .from('transactions')
  .insert({
    user_id: userId,
    payment_method_id: paymentMethodId,
    category_id: categoryId,
    type: 'expense',
    amount: baseAmount,              // Converted to base currency
    native_amount: nativeAmount,     // Original amount
    exchange_rate: exchangeRate,     // Rate used
    base_currency: baseCurrency,     // User's base currency
    date: transactionDate,
    description: description
  })
  .select()
  .single();
```

---

### Validation Rules (Application Layer)

**Rule 1**: If `payment_method_id` is provided, then:
- `native_amount` MUST be provided
- `exchange_rate` MUST be provided
- `base_currency` MUST be provided

**Rule 2**: Payment method ownership check
- Already enforced by database trigger `validate_transaction_payment_method()`
- Trigger ensures payment method belongs to the user

**Rule 3**: Amount calculations
- `amount` = `native_amount` × `exchange_rate` (rounded to 2 decimals)
- Validate this calculation before insert

---

### Displaying Transactions

**For Legacy Transactions** (payment_method_id = null):
```typescript
if (transaction.payment_method_id === null) {
  // Display amount in user's current base currency
  displayAmount = transaction.amount;
  displayCurrency = userBaseCurrency;
}
```

**For Multi-Currency Transactions**:
```typescript
if (transaction.payment_method_id !== null) {
  // Display native amount in payment method's currency
  displayAmount = transaction.native_amount;
  displayCurrency = paymentMethod.currency;

  // Also show converted amount in tooltip/detail
  convertedAmount = transaction.amount;
  convertedCurrency = transaction.base_currency;
}
```

---

### Calculating Multi-Currency Balances

**Option 1: By Payment Method** (recommended for UI):
```typescript
// Get all payment methods with balances
const paymentMethods = await supabase
  .from('payment_methods')
  .select('*')
  .eq('user_id', userId)
  .eq('is_active', true);

const balances = await Promise.all(
  paymentMethods.data.map(async (pm) => {
    const balanceResult = await supabase
      .rpc('get_payment_method_balance', {
        p_payment_method_id: pm.id
      });

    return {
      paymentMethodName: pm.name,
      currency: pm.currency,
      balance: balanceResult.data
    };
  })
);

// Result:
// [
//   { paymentMethodName: 'Chase USD', currency: 'USD', balance: 1234.56 },
//   { paymentMethodName: 'My EUR Card', currency: 'EUR', balance: 256.80 },
//   { paymentMethodName: 'UAH Mono', currency: 'UAH', balance: 4100.00 }
// ]
```

**Option 2: Total in Base Currency**:
```typescript
// Get all balances and convert to base currency
const totalBalance = await Promise.all(
  balances.map(async (bal) => {
    if (bal.currency === userBaseCurrency) {
      return bal.balance;
    }

    const converted = await supabase.rpc('convert_amount', {
      p_amount: bal.balance,
      p_from_currency: bal.currency,
      p_to_currency: userBaseCurrency
    });

    return converted.data || 0;
  })
);

const total = totalBalance.reduce((sum, val) => sum + val, 0);
```

---

## Server Actions to Implement

### 1. `createTransaction(formData)`

**Input**:
```typescript
{
  paymentMethodId: string;
  categoryId: string;
  type: 'income' | 'expense';
  nativeAmount: number;        // Amount in payment method's currency
  date: string;
  description?: string;
  tags?: string[];
}
```

**Logic**:
1. Validate payment method belongs to user
2. Get user's base currency
3. Get payment method currency
4. Fetch exchange rate (if needed)
5. Calculate base currency amount
6. Insert transaction with all multi-currency fields
7. Handle transaction-tag associations

---

### 2. `updateTransaction(transactionId, formData)`

**Input**: Same as create + `transactionId`

**Logic**:
1. Verify transaction belongs to user
2. If payment method changed, recalculate exchange rate
3. Update transaction
4. Handle tag changes

---

### 3. `getTransactionById(transactionId)`

**Returns**:
```typescript
{
  id: string;
  amount: number;              // Base currency amount
  native_amount: number | null;
  exchange_rate: number | null;
  base_currency: string | null;
  payment_method: {
    id: string;
    name: string;
    currency: string;
  } | null;
  category: { ... };
  tags: Tag[];
  type: 'income' | 'expense';
  date: string;
  description: string | null;
}
```

---

### 4. `getPaymentMethodBalances(userId)`

**Returns**:
```typescript
Array<{
  paymentMethodId: string;
  paymentMethodName: string;
  currency: string;
  balance: number;
}>
```

---

### 5. `getTotalBalanceInBaseCurrency(userId)`

**Returns**:
```typescript
{
  totalBalance: number;
  baseCurrency: string;
  byPaymentMethod: Array<{
    name: string;
    nativeBalance: number;
    nativeCurrency: string;
    convertedBalance: number;
  }>;
}
```

---

## Testing Checklist for Backend

### Test Cases to Implement:

1. ✅ **Create transaction with payment method in base currency**
   - Should set exchange_rate = 1.0
   - native_amount = amount

2. ✅ **Create transaction with payment method in different currency**
   - Should fetch exchange rate from `get_exchange_rate()`
   - Should calculate correct base amount
   - All 4 fields populated

3. ✅ **Create legacy transaction** (no payment method)
   - payment_method_id = NULL
   - native_amount/exchange_rate/base_currency = NULL
   - Should still work

4. ✅ **Get user balance with mixed currencies**
   - Should only sum transactions in base currency
   - Legacy transactions included

5. ✅ **Get payment method balance**
   - Should return balance in payment method's native currency

6. ✅ **Update transaction with currency change**
   - Should recalculate exchange rate if payment method changed

7. ✅ **Validate payment method ownership**
   - Should reject transaction if payment method doesn't belong to user

---

## Database Queries Reference

### Get Exchange Rate
```sql
SELECT get_exchange_rate('EUR', 'USD', '2024-12-01');
```

### Convert Amount
```sql
SELECT convert_amount(100.00, 'EUR', 'USD', '2024-12-01');
```

### Get User Balance (Base Currency Only)
```sql
SELECT get_user_balance('user-uuid');
```

### Get Payment Method Balance (Native Currency)
```sql
SELECT get_payment_method_balance('payment-method-uuid');
```

### Get All Exchange Rates for a Date
```sql
SELECT * FROM exchange_rates
WHERE date <= '2024-12-01'
ORDER BY from_currency, to_currency;
```

---

## Performance Notes

### Indexes Created:

**On `transactions` table**:
- `idx_transactions_base_currency` - Filter by base currency
- `idx_transactions_user_base_currency` - User + base currency queries
- `idx_transactions_legacy` - Legacy transactions (NULL payment_method_id)
- `idx_transactions_payment_method_id` - Filter by payment method (from previous migration)

**On `exchange_rates` table**:
- `idx_exchange_rates_lookup` - Direct rate lookups (from, to, date)
- `idx_exchange_rates_reverse_lookup` - Inverse rate lookups (to, from, date)
- `idx_exchange_rates_date` - Time-based queries
- `idx_exchange_rates_source` - Filter by source

### Query Optimization Tips:

1. Use `get_exchange_rate()` function instead of direct queries
2. Batch rate lookups when possible
3. Cache rates in application for repeated conversions
4. Use partial indexes (WHERE clauses) to speed up queries

---

## Security (RLS) Summary

### `transactions` table:
- Existing RLS policies unchanged
- User can only see/modify their own transactions
- Multi-currency columns inherit same protection

### `exchange_rates` table:
- **SELECT**: All authenticated users (global data)
- **INSERT**: Authenticated users (for future manual rates)
- **UPDATE**: Authenticated users (for corrections)
- **DELETE**: Service role only

---

## Troubleshooting

### Issue: Exchange rate not found
**Symptom**: `get_exchange_rate()` returns NULL

**Solutions**:
1. Check if currency pair exists in `exchange_rates` table
2. Check if date is available (function looks for most recent rate ≤ date)
3. Check if inverse rate exists (function should handle this)
4. Add missing rate manually or wait for Card #21 API integration

### Issue: Balance calculation incorrect
**Symptom**: User balance doesn't match expected value

**Debug**:
```sql
-- Check all transactions for user
SELECT
  id, type, amount, native_amount, exchange_rate,
  base_currency, payment_method_id
FROM transactions
WHERE user_id = 'user-uuid'
ORDER BY date DESC;

-- Check which transactions are included in balance
SELECT * FROM transactions
WHERE user_id = 'user-uuid'
  AND (base_currency IS NULL OR base_currency = 'USD');
```

### Issue: Type errors in TypeScript
**Symptom**: TypeScript complains about new fields

**Solution**:
1. Regenerate types: `npx supabase gen types typescript --local > src/types/database.types.ts`
2. Restart TypeScript server in IDE
3. Check import path is correct

---

## Next Steps (Card #21)

After backend implementation is complete, Card #21 will add:
- Live exchange rate API integration
- Automatic rate updates
- Rate caching strategy
- Fallback to stub rates

**No schema changes needed** - current design supports it!

---

## Contact

If you have questions about the schema design or need clarification:

**System Architect (Agent 02)**: Ready to answer questions about:
- Schema design decisions
- Performance optimization
- RLS policy rationale
- Helper function behavior

**Documentation**:
- Full details: `MULTI_CURRENCY_SCHEMA_DESIGN.md`
- Migration file: `supabase/migrations/20251218113344_add_multi_currency_to_transactions.sql`
- Verification script: `scripts/verify_multi_currency_schema.sql`

---

## ✅ Sign-Off

Schema is complete, tested, and ready for backend implementation!

**Delivered**:
- ✅ Database schema extended
- ✅ Helper functions created
- ✅ TypeScript types generated
- ✅ Documentation complete
- ✅ Verification script provided

**Backend Developer**: You're clear to start implementing Server Actions! 🚀
