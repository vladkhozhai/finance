# Card #20 - Quick Reference for Backend Developer

**Status**: ✅ Schema Ready | **Next**: Implement Server Actions
**Documentation**: See `CARD_20_SCHEMA_HANDOFF.md` for full details

---

## Schema Cheat Sheet

### Transactions Table (Extended)

```typescript
interface Transaction {
  // Existing fields
  id: string;
  user_id: string;
  category_id: string;
  type: 'income' | 'expense';
  amount: number;              // Base currency amount
  date: string;
  description: string | null;

  // NEW: Multi-currency fields (all nullable)
  payment_method_id: string | null;
  native_amount: number | null;     // Amount in payment method's currency
  exchange_rate: number | null;     // Rate used at transaction time
  base_currency: string | null;     // User's base currency (ISO 4217)
}
```

### Exchange Rates Table (New)

```typescript
interface ExchangeRate {
  id: string;
  from_currency: string;   // ISO 4217 (e.g., 'EUR')
  to_currency: string;     // ISO 4217 (e.g., 'USD')
  rate: number;            // Conversion rate (6 decimals)
  date: string;            // Date rate is valid for
  source: 'STUB' | 'MANUAL' | 'API' | 'SYSTEM';
  created_at: string;
}
```

---

## Helper Functions (RPC Calls)

### 1. Get Exchange Rate

```typescript
const { data: rate } = await supabase.rpc('get_exchange_rate', {
  p_from_currency: 'EUR',
  p_to_currency: 'USD',
  p_date: '2024-12-01'  // Optional, defaults to today
});
// Returns: 1.086957 or null
```

### 2. Convert Amount

```typescript
const { data: converted } = await supabase.rpc('convert_amount', {
  p_amount: 100.00,
  p_from_currency: 'EUR',
  p_to_currency: 'USD',
  p_date: '2024-12-01'  // Optional
});
// Returns: 108.70 or null
```

### 3. Get User Balance (Base Currency Only)

```typescript
const { data: balance } = await supabase.rpc('get_user_balance', {
  p_user_id: userId
});
// Returns: number (balance in user's base currency)
```

### 4. Get Payment Method Balance (Native Currency)

```typescript
const { data: balance } = await supabase.rpc('get_payment_method_balance', {
  p_payment_method_id: paymentMethodId
});
// Returns: number (balance in payment method's currency)
```

---

## Implementation Patterns

### Pattern 1: Create Multi-Currency Transaction

```typescript
'use server';

export async function createTransaction(formData: TransactionFormData) {
  const supabase = createClient();

  // 1. Get payment method
  const { data: paymentMethod } = await supabase
    .from('payment_methods')
    .select('currency')
    .eq('id', formData.paymentMethodId)
    .single();

  // 2. Get user's base currency
  const { data: profile } = await supabase
    .from('profiles')
    .select('currency')
    .eq('id', userId)
    .single();

  const baseCurrency = profile?.currency || 'USD';

  // 3. Get exchange rate
  const { data: rate } = await supabase.rpc('get_exchange_rate', {
    p_from_currency: paymentMethod.currency,
    p_to_currency: baseCurrency,
    p_date: formData.date
  });

  if (!rate) {
    throw new Error('Exchange rate not available');
  }

  // 4. Calculate base amount
  const baseAmount = Math.round(formData.nativeAmount * rate * 100) / 100;

  // 5. Insert transaction
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      payment_method_id: formData.paymentMethodId,
      category_id: formData.categoryId,
      type: formData.type,
      amount: baseAmount,
      native_amount: formData.nativeAmount,
      exchange_rate: rate,
      base_currency: baseCurrency,
      date: formData.date,
      description: formData.description
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Pattern 2: Display Transaction

```typescript
function formatTransactionAmount(transaction: Transaction, paymentMethod?: PaymentMethod) {
  // Legacy transaction (no payment method)
  if (!transaction.payment_method_id || !transaction.native_amount) {
    return {
      amount: transaction.amount,
      currency: userBaseCurrency,
      isConverted: false
    };
  }

  // Multi-currency transaction
  return {
    amount: transaction.native_amount,
    currency: paymentMethod?.currency || 'USD',
    isConverted: true,
    convertedAmount: transaction.amount,
    convertedCurrency: transaction.base_currency,
    exchangeRate: transaction.exchange_rate
  };
}
```

### Pattern 3: Get Multi-Currency Balances

```typescript
'use server';

export async function getBalancesByPaymentMethod(userId: string) {
  const supabase = createClient();

  // Get all payment methods
  const { data: paymentMethods } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  // Get balance for each
  const balances = await Promise.all(
    paymentMethods.map(async (pm) => {
      const { data: balance } = await supabase.rpc('get_payment_method_balance', {
        p_payment_method_id: pm.id
      });

      return {
        paymentMethodId: pm.id,
        paymentMethodName: pm.name,
        currency: pm.currency,
        balance: balance || 0
      };
    })
  );

  return balances;
}
```

### Pattern 4: Calculate Total in Base Currency

```typescript
'use server';

export async function getTotalBalanceInBaseCurrency(userId: string) {
  const supabase = createClient();

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('currency')
    .eq('id', userId)
    .single();

  const baseCurrency = profile?.currency || 'USD';

  // Get balances by payment method
  const balances = await getBalancesByPaymentMethod(userId);

  // Convert all to base currency
  const convertedBalances = await Promise.all(
    balances.map(async (bal) => {
      if (bal.currency === baseCurrency) {
        return bal.balance;
      }

      const { data: converted } = await supabase.rpc('convert_amount', {
        p_amount: bal.balance,
        p_from_currency: bal.currency,
        p_to_currency: baseCurrency
      });

      return converted || 0;
    })
  );

  const totalBalance = convertedBalances.reduce((sum, val) => sum + val, 0);

  return {
    totalBalance,
    baseCurrency,
    byPaymentMethod: balances.map((bal, idx) => ({
      ...bal,
      convertedBalance: convertedBalances[idx]
    }))
  };
}
```

---

## Validation Rules

### Rule 1: Multi-Currency Field Co-dependency

```typescript
// If payment_method_id provided, all multi-currency fields required
if (formData.paymentMethodId) {
  if (!formData.nativeAmount) {
    throw new Error('Native amount required when payment method specified');
  }
  // exchange_rate and base_currency calculated automatically
}
```

### Rule 2: Amount Calculation

```typescript
// Base amount MUST equal native amount × exchange rate (rounded)
const calculatedBaseAmount = Math.round(nativeAmount * exchangeRate * 100) / 100;

if (Math.abs(calculatedBaseAmount - baseAmount) > 0.01) {
  throw new Error('Amount calculation mismatch');
}
```

### Rule 3: Payment Method Ownership

```typescript
// Already enforced by database trigger 'validate_transaction_payment_method'
// Transaction will fail if payment method doesn't belong to user
```

---

## Common Queries

### Get Transaction with Full Details

```typescript
const { data: transaction } = await supabase
  .from('transactions')
  .select(`
    *,
    category:categories(*),
    payment_method:payment_methods(*),
    tags:transaction_tags(tag:tags(*))
  `)
  .eq('id', transactionId)
  .single();
```

### Get Transactions by Payment Method

```typescript
const { data: transactions } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', userId)
  .eq('payment_method_id', paymentMethodId)
  .order('date', { ascending: false });
```

### Get Legacy Transactions (No Payment Method)

```typescript
const { data: legacyTransactions } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', userId)
  .is('payment_method_id', null);
```

### Get All Exchange Rates for a Currency

```typescript
const { data: rates } = await supabase
  .from('exchange_rates')
  .select('*')
  .eq('from_currency', 'EUR')
  .order('date', { ascending: false });
```

---

## Troubleshooting

### Issue: Exchange rate returns null

```typescript
// Check if rate exists
const { data: rate } = await supabase
  .from('exchange_rates')
  .select('*')
  .eq('from_currency', fromCurrency)
  .eq('to_currency', toCurrency)
  .lte('date', date)
  .order('date', { ascending: false })
  .limit(1)
  .single();

if (!rate) {
  console.error('No exchange rate found for', fromCurrency, '→', toCurrency);
}
```

### Issue: Balance calculation incorrect

```typescript
// Debug: Check which transactions are included
const { data: includedTransactions } = await supabase
  .from('transactions')
  .select('id, amount, type, base_currency')
  .eq('user_id', userId)
  .or(`base_currency.is.null,base_currency.eq.${baseCurrency}`);

console.log('Included in balance:', includedTransactions);
```

---

## Available Currencies (Stub Rates)

| Code | Currency | Sample Rate to USD |
|------|----------|-------------------|
| USD | US Dollar | 1.000000 |
| EUR | Euro | 1.086957 |
| GBP | British Pound | 1.265823 |
| UAH | Ukrainian Hryvnia | 0.024390 |
| CAD | Canadian Dollar | 0.735294 |
| AUD | Australian Dollar | 0.666667 |
| JPY | Japanese Yen | 0.006711 |
| CHF | Swiss Franc | 1.136364 |
| PLN | Polish Złoty | 0.250000 |
| CZK | Czech Koruna | 0.043478 |

**Note**: These are stub rates for MVP. Card #21 will replace with live API rates.

---

## Server Actions Checklist

### Required Actions:

- [ ] `createTransaction(formData)` - Create multi-currency transaction
- [ ] `updateTransaction(id, formData)` - Update with recalculation
- [ ] `deleteTransaction(id)` - Delete transaction
- [ ] `getTransactionById(id)` - Fetch with full details
- [ ] `getTransactions(filters)` - List with pagination
- [ ] `getPaymentMethodBalances(userId)` - Get balances per payment method
- [ ] `getTotalBalanceInBaseCurrency(userId)` - Aggregate multi-currency balance

### Optional Actions:

- [ ] `getExchangeRate(from, to, date)` - Wrapper around RPC
- [ ] `convertAmount(amount, from, to, date)` - Wrapper around RPC
- [ ] `getTransactionsByPaymentMethod(paymentMethodId)` - Filter helper

---

## Testing Strategy

### Unit Tests:

1. ✅ Create transaction with same currency (rate = 1.0)
2. ✅ Create transaction with different currency (rate fetched)
3. ✅ Create legacy transaction (no payment method)
4. ✅ Get balance with mixed currencies
5. ✅ Get payment method balance
6. ✅ Convert amount between currencies
7. ✅ Handle missing exchange rate
8. ✅ Validate payment method ownership

### Integration Tests:

1. ✅ Full transaction flow (create → read → update → delete)
2. ✅ Multi-currency balance calculation
3. ✅ Currency conversion accuracy
4. ✅ Legacy transaction backward compatibility

---

## Performance Tips

1. **Batch rate lookups** when possible:
   ```typescript
   const rates = await Promise.all(currencies.map(c => getRateFor(c)));
   ```

2. **Cache rates** in application:
   ```typescript
   const rateCache = new Map<string, number>();
   ```

3. **Use prepared statements** for repeated queries

4. **Leverage indexes**:
   - Filter by `user_id` first (always indexed)
   - Then add `base_currency` or `payment_method_id`

---

## Documentation Links

- **Full Schema Design**: `MULTI_CURRENCY_SCHEMA_DESIGN.md`
- **Handoff Document**: `CARD_20_SCHEMA_HANDOFF.md`
- **Architectural Decisions**: `CARD_20_ARCHITECTURAL_DECISIONS.md`
- **Delivery Summary**: `CARD_20_DELIVERY_SUMMARY.md`
- **Migration File**: `supabase/migrations/20251218113344_add_multi_currency_to_transactions.sql`
- **Verification Script**: `scripts/verify_multi_currency_schema.sql`

---

## Questions?

Contact **System Architect (Agent 02)** for:
- Schema clarifications
- Performance optimization
- RLS policy questions
- Helper function behavior

---

**Ready to implement! 🚀**
