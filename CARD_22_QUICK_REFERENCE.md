# Card #22 Backend - Quick Reference

**For**: Frontend Developer (Agent 04)
**Status**: ✅ Backend Complete, Ready for UI

---

## Import Statement

```typescript
// Dashboard Server Actions
import {
  getTotalBalanceInBaseCurrency,
  getPaymentMethodBalancesWithDetails,
  getTransactionsByPaymentMethod,
  type TotalBalanceResult,
  type PaymentMethodWithDetails,
  type TransactionsByPaymentMethodResult,
} from '@/app/actions/dashboard';

// Updated Transaction Filtering
import { getTransactions } from '@/app/actions/transactions';
```

---

## Server Actions At a Glance

### 1. getTotalBalanceInBaseCurrency()
**Purpose**: Show total balance across all payment methods in user's base currency

```typescript
const result = await getTotalBalanceInBaseCurrency();

// Returns:
{
  totalBalance: 1234.56,        // Total in base currency
  baseCurrency: 'USD',
  breakdown: [                  // Per payment method
    {
      paymentMethodId: 'uuid',
      paymentMethodName: 'Chase',
      currency: 'USD',
      nativeBalance: 500.00,
      exchangeRate: 1.0,
      convertedBalance: 500.00
    },
    // ... more payment methods
  ]
}
```

**Use Case**: Dashboard hero section, total balance card

---

### 2. getPaymentMethodBalancesWithDetails()
**Purpose**: Show detailed cards for each payment method with conversion info

```typescript
const result = await getPaymentMethodBalancesWithDetails();

// Returns: Array of
{
  id: 'uuid',
  name: 'Chase Sapphire',
  currency: 'USD',
  cardType: 'credit',
  color: '#0066CC',
  isDefault: true,
  nativeBalance: 500.00,        // In payment method's currency
  convertedBalance: 500.00,     // In user's base currency
  baseCurrency: 'USD',
  exchangeRate: 1.0,
  rateDate: Date | null,
  rateSource: 'fresh' | 'stale' | 'api',
  isRateStale: false,           // ⚠️ Show warning if true
  lastTransactionDate: Date | null,
  transactionCount: 45
}
```

**Use Case**: Payment method cards grid on dashboard

**Important**: Show warning if `isRateStale === true`

---

### 3. getTransactionsByPaymentMethod()
**Purpose**: Show transactions filtered by payment method

```typescript
const result = await getTransactionsByPaymentMethod('pm-uuid', {
  limit: 20,
  offset: 0
});

// Returns:
{
  paymentMethod: {
    id: 'uuid',
    name: 'Revolut EUR',
    currency: 'EUR'
  },
  totalCount: 47,
  transactions: [
    {
      id: 'tx-uuid',
      amount: 108.70,           // Base currency
      type: 'expense',
      date: '2025-12-17',
      description: 'Coffee',
      native_amount: 100.00,    // Payment method currency
      exchange_rate: 1.086957,
      category: { name: 'Food', color: '#FF6B6B' },
      transaction_tags: [{ tag: { name: 'coffee' } }],
      payment_method: { name: 'Revolut EUR', currency: 'EUR' }
    },
    // ... more transactions
  ]
}
```

**Use Case**: Transaction list per payment method

---

### 4. getTransactions() - Updated
**Purpose**: Filter all transactions (now supports payment method filter)

```typescript
const result = await getTransactions({
  paymentMethodId: 'uuid',  // ⭐ NEW
  type: 'expense',
  categoryId: 'uuid',
  dateFrom: '2025-12-01',
  dateTo: '2025-12-31',
  limit: 50,
  offset: 0
});
```

**Use Case**: Transaction page with filters

---

## Example UI Components

### Total Balance Card

```typescript
'use client';

import { getTotalBalanceInBaseCurrency } from '@/app/actions/dashboard';
import { useEffect, useState } from 'react';

export function TotalBalanceCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTotalBalanceInBaseCurrency().then((result) => {
      if (result.success) {
        setData(result.data);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-sm text-gray-600">Total Balance</h2>
      <p className="text-4xl font-bold mt-2">
        {data.totalBalance.toFixed(2)} {data.baseCurrency}
      </p>
    </div>
  );
}
```

### Payment Method Card

```typescript
'use client';

import { getPaymentMethodBalancesWithDetails } from '@/app/actions/dashboard';
import { useEffect, useState } from 'react';

export function PaymentMethodCards() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPaymentMethodBalancesWithDetails().then((result) => {
      if (result.success) {
        setPaymentMethods(result.data);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {paymentMethods.map((pm) => (
        <div key={pm.id} className="p-4 border rounded-lg">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: pm.color || '#666' }}
            />
            <h3 className="font-semibold">{pm.name}</h3>
            {pm.isDefault && (
              <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                Default
              </span>
            )}
          </div>

          <div className="mt-2">
            <p className="text-2xl font-bold">
              {pm.nativeBalance.toFixed(2)} {pm.currency}
            </p>

            {pm.currency !== pm.baseCurrency && (
              <p className="text-sm text-gray-600">
                ≈ {pm.convertedBalance.toFixed(2)} {pm.baseCurrency}
                {pm.isRateStale && (
                  <span className="ml-2 text-yellow-600">⚠️ Stale rate</span>
                )}
              </p>
            )}
          </div>

          <div className="mt-4 text-xs text-gray-500">
            <p>{pm.transactionCount} transactions</p>
            {pm.lastTransactionDate && (
              <p>Last: {new Date(pm.lastTransactionDate).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Transaction List by Payment Method

```typescript
'use client';

import { getTransactionsByPaymentMethod } from '@/app/actions/dashboard';
import { useEffect, useState } from 'react';

export function TransactionList({ paymentMethodId }: { paymentMethodId: string }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTransactionsByPaymentMethod(paymentMethodId, {
      limit: 20,
      offset: 0
    }).then((result) => {
      if (result.success) {
        setData(result.data);
      }
      setLoading(false);
    });
  }, [paymentMethodId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Transactions - {data.paymentMethod.name}</h2>
      <ul className="space-y-2">
        {data.transactions.map((tx) => (
          <li key={tx.id} className="p-3 border rounded">
            <div className="flex justify-between">
              <div>
                <p className="font-medium">{tx.description || 'No description'}</p>
                <p className="text-sm text-gray-600">{tx.category.name}</p>
              </div>
              <div className="text-right">
                <p className={tx.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                  {tx.type === 'income' ? '+' : '-'}
                  {tx.native_amount?.toFixed(2) || tx.amount.toFixed(2)}{' '}
                  {data.paymentMethod.currency}
                </p>
                <p className="text-xs text-gray-500">{tx.date}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Error Handling Pattern

```typescript
const result = await getTotalBalanceInBaseCurrency();

if (!result.success) {
  // Show error toast/message
  console.error(result.error);
  return;
}

// Use result.data
const { totalBalance, baseCurrency, breakdown } = result.data;
```

---

## Important UI Indicators

### ⚠️ Stale Exchange Rate Warning

Show this when `isRateStale === true`:

```tsx
{pm.isRateStale && (
  <div className="flex items-center gap-1 text-yellow-600 text-xs">
    <AlertTriangle className="w-4 h-4" />
    <span>Exchange rate is outdated</span>
  </div>
)}
```

### 💡 Currency Display

Always show both native and converted amounts when currencies differ:

```tsx
{pm.currency !== pm.baseCurrency && (
  <p className="text-sm text-gray-600">
    ≈ {pm.convertedBalance.toFixed(2)} {pm.baseCurrency}
  </p>
)}
```

### 🏦 Default Payment Method Badge

```tsx
{pm.isDefault && (
  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
    Default
  </span>
)}
```

---

## Testing Checklist

- [ ] Total balance displays correctly
- [ ] Breakdown shows all payment methods
- [ ] Payment method cards show correct balances
- [ ] Currency conversion displayed for non-base currencies
- [ ] Stale rate warning shows when `isRateStale === true`
- [ ] Transaction count accurate
- [ ] Last transaction date displayed
- [ ] Transaction filtering by payment method works
- [ ] Pagination works for transaction lists
- [ ] Loading states shown during data fetch
- [ ] Error messages displayed when actions fail

---

## Common Issues & Solutions

### Issue: "Unauthorized" error
**Solution**: User not logged in. Redirect to `/login`

### Issue: Empty breakdown array
**Solution**: User has no payment methods. Show empty state with "Add Payment Method" button

### Issue: Exchange rate = null
**Solution**: Rate not available. Show warning and use native balance

### Issue: isRateStale = true
**Solution**: Rate older than 24 hours. Show warning indicator but continue using rate

---

## Performance Tips

1. **Cache data in state**: Don't refetch on every render
2. **Use loading states**: Show skeleton or spinner while fetching
3. **Implement pagination**: Don't load all transactions at once
4. **Debounce filters**: Wait for user to finish typing before filtering
5. **Revalidate after mutations**: Call `revalidatePath('/dashboard')` after creating/updating transactions

---

## Full Documentation

For complete API reference with detailed explanations:

📄 **See**: `/CARD_22_BACKEND_API_DOCS.md`

---

**Ready to implement? Start with the Total Balance Card!** ✅
