# Card #22: Multi-Currency Dashboard - Backend API Documentation

**Status**: ✅ Backend Phase 1 Complete
**Date**: 2025-12-18
**For**: Frontend Developer (Agent 04)

---

## Overview

This document provides the complete API specification for the dashboard Server Actions that aggregate multi-currency financial data. These actions are ready for frontend integration in Phase 2.

---

## New Server Actions

All Server Actions are located in: `/src/app/actions/dashboard.ts`

### Import Statement

```typescript
import {
  getTotalBalanceInBaseCurrency,
  getPaymentMethodBalancesWithDetails,
  getTransactionsByPaymentMethod,
  type TotalBalanceResult,
  type PaymentMethodBreakdown,
  type PaymentMethodWithDetails,
  type TransactionsByPaymentMethodResult,
} from '@/app/actions/dashboard';
```

---

## 1. getTotalBalanceInBaseCurrency()

### Purpose
Calculate the user's total balance across all payment methods, converted to their base currency.

### Signature
```typescript
export async function getTotalBalanceInBaseCurrency(): Promise<
  ActionResult<TotalBalanceResult>
>
```

### Parameters
None (uses authenticated user from session)

### Return Type
```typescript
interface TotalBalanceResult {
  totalBalance: number;       // Sum of all balances in base currency
  baseCurrency: string;        // User's base currency (e.g., 'USD')
  breakdown: PaymentMethodBreakdown[];
}

interface PaymentMethodBreakdown {
  paymentMethodId: string;     // UUID
  paymentMethodName: string;   // e.g., 'Chase Sapphire'
  currency: string;            // e.g., 'USD', 'EUR', 'UAH'
  nativeBalance: number;       // Balance in payment method's currency
  exchangeRate: number;        // Rate used for conversion (1.0 if same currency)
  convertedBalance: number;    // Balance converted to base currency
}
```

### Response Format
```typescript
// Success
{
  success: true,
  data: {
    totalBalance: 1234.56,
    baseCurrency: 'USD',
    breakdown: [
      {
        paymentMethodId: 'uuid-1',
        paymentMethodName: 'Chase Sapphire Reserve',
        currency: 'USD',
        nativeBalance: 500.00,
        exchangeRate: 1.0,
        convertedBalance: 500.00
      },
      {
        paymentMethodId: 'uuid-2',
        paymentMethodName: 'Revolut EUR',
        currency: 'EUR',
        nativeBalance: 650.00,
        exchangeRate: 1.086957,
        convertedBalance: 706.72
      },
      {
        paymentMethodId: 'uuid-3',
        paymentMethodName: 'Mono UAH',
        currency: 'UAH',
        nativeBalance: 1145.00,
        exchangeRate: 0.024390,
        convertedBalance: 27.93
      }
    ]
  }
}

// Error
{
  success: false,
  error: 'Unauthorized. Please log in to view balance.'
}
```

### Usage Example
```typescript
'use client';

import { getTotalBalanceInBaseCurrency } from '@/app/actions/dashboard';
import { useEffect, useState } from 'react';

export function TotalBalanceCard() {
  const [balance, setBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTotalBalanceInBaseCurrency().then((result) => {
      if (result.success) {
        setBalance(result.data.totalBalance);
        setCurrency(result.data.baseCurrency);
      } else {
        console.error(result.error);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Total Balance</h2>
      <p>
        {balance?.toFixed(2)} {currency}
      </p>
    </div>
  );
}
```

### Edge Cases Handled
- ✅ User with no payment methods → Returns totalBalance = 0
- ✅ Payment method with no transactions → Returns balance = 0
- ✅ Same currency as base (USD→USD) → exchangeRate = 1.0
- ✅ Missing exchange rate → Uses native balance (logs warning)
- ✅ Stale exchange rate → Uses stale rate (logs warning)

---

## 2. getPaymentMethodBalancesWithDetails()

### Purpose
Get detailed balance information for all payment methods, including conversion metadata, exchange rate staleness, and transaction statistics.

### Signature
```typescript
export async function getPaymentMethodBalancesWithDetails(): Promise<
  ActionResult<PaymentMethodWithDetails[]>
>
```

### Parameters
None (uses authenticated user from session)

### Return Type
```typescript
interface PaymentMethodWithDetails {
  id: string;                   // Payment method UUID
  name: string;                 // e.g., 'Chase Sapphire Reserve'
  currency: string;             // ISO 4217 code (e.g., 'USD')
  cardType: string | null;      // 'credit', 'debit', 'cash', 'savings'
  color: string | null;         // Hex color (e.g., '#0066CC')
  isDefault: boolean;           // Is this the default payment method?
  nativeBalance: number;        // Balance in payment method's currency
  convertedBalance: number;     // Balance in user's base currency
  baseCurrency: string;         // User's base currency
  exchangeRate: number;         // Current exchange rate
  rateDate: Date | null;        // When rate was fetched
  rateSource: string | null;    // 'fresh', 'stale', 'api', 'not_found'
  isRateStale: boolean;         // Is rate older than 24 hours?
  lastTransactionDate: Date | null;  // Last transaction date
  transactionCount: number;     // Total transactions for this PM
}
```

### Response Format
```typescript
// Success
{
  success: true,
  data: [
    {
      id: 'uuid-1',
      name: 'Chase Sapphire Reserve',
      currency: 'USD',
      cardType: 'credit',
      color: '#0066CC',
      isDefault: true,
      nativeBalance: 500.00,
      convertedBalance: 500.00,
      baseCurrency: 'USD',
      exchangeRate: 1.0,
      rateDate: null,
      rateSource: null,
      isRateStale: false,
      lastTransactionDate: '2025-12-15T00:00:00.000Z',
      transactionCount: 45
    },
    {
      id: 'uuid-2',
      name: 'Revolut EUR',
      currency: 'EUR',
      cardType: 'debit',
      color: '#7B61FF',
      isDefault: false,
      nativeBalance: 650.00,
      convertedBalance: 706.72,
      baseCurrency: 'USD',
      exchangeRate: 1.086957,
      rateDate: '2025-12-18T10:30:00.000Z',
      rateSource: 'fresh',
      isRateStale: false,
      lastTransactionDate: '2025-12-17T00:00:00.000Z',
      transactionCount: 12
    },
    {
      id: 'uuid-3',
      name: 'Mono UAH (Stale Rate)',
      currency: 'UAH',
      cardType: 'debit',
      color: '#FF0080',
      isDefault: false,
      nativeBalance: 1145.00,
      convertedBalance: 27.93,
      baseCurrency: 'USD',
      exchangeRate: 0.024390,
      rateDate: '2025-12-16T02:00:00.000Z',
      rateSource: 'stale',
      isRateStale: true,  // ⚠️ Rate is >24 hours old
      lastTransactionDate: '2025-12-10T00:00:00.000Z',
      transactionCount: 8
    }
  ]
}

// Error
{
  success: false,
  error: 'Unauthorized. Please log in to view payment methods.'
}
```

### Usage Example
```typescript
'use client';

import { getPaymentMethodBalancesWithDetails } from '@/app/actions/dashboard';
import { useEffect, useState } from 'react';

export function PaymentMethodsGrid() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPaymentMethodBalancesWithDetails().then((result) => {
      if (result.success) {
        setPaymentMethods(result.data);
      } else {
        console.error(result.error);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading payment methods...</div>;

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
            {pm.isDefault && <span className="text-xs bg-blue-100 px-2 py-1 rounded">Default</span>}
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

### Edge Cases Handled
- ✅ No payment methods → Returns empty array
- ✅ No transactions for PM → transactionCount = 0, lastTransactionDate = null
- ✅ Same currency as base → exchangeRate = 1.0, rateDate/rateSource = null, isRateStale = false
- ✅ Rate older than 24 hours → isRateStale = true
- ✅ Missing exchange rate → Uses native balance, logs warning

---

## 3. getTransactionsByPaymentMethod()

### Purpose
Get transactions filtered by a specific payment method, with full relations (category, tags, payment method).

### Signature
```typescript
export async function getTransactionsByPaymentMethod(
  paymentMethodId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<ActionResult<TransactionsByPaymentMethodResult>>
```

### Parameters
- `paymentMethodId` (string, required): Payment method UUID
- `options.limit` (number, optional): Max transactions to return (default: 50, max: 100)
- `options.offset` (number, optional): Pagination offset (default: 0)

### Return Type
```typescript
interface TransactionsByPaymentMethodResult {
  transactions: TransactionWithRelations[];
  totalCount: number;
  paymentMethod: {
    id: string;
    name: string;
    currency: string;
  };
}

type TransactionWithRelations = Transaction & {
  category: Category;
  transaction_tags: Array<{
    tag: Tag;
  }>;
  payment_method?: PaymentMethod | null;
};
```

### Response Format
```typescript
// Success
{
  success: true,
  data: {
    paymentMethod: {
      id: 'uuid-here',
      name: 'Revolut EUR',
      currency: 'EUR'
    },
    totalCount: 47,
    transactions: [
      {
        id: 'tx-uuid-1',
        user_id: 'user-uuid',
        amount: 108.70,           // Base currency amount
        type: 'expense',
        category_id: 'cat-uuid',
        payment_method_id: 'pm-uuid',
        date: '2025-12-17',
        description: 'Coffee shop',
        native_amount: 100.00,    // Amount in EUR
        exchange_rate: 1.086957,
        base_currency: 'USD',
        created_at: '2025-12-17T10:30:00.000Z',
        category: {
          id: 'cat-uuid',
          name: 'Food & Dining',
          color: '#FF6B6B',
          type: 'expense'
        },
        transaction_tags: [
          {
            tag: {
              id: 'tag-uuid-1',
              name: 'coffee'
            }
          },
          {
            tag: {
              id: 'tag-uuid-2',
              name: 'work'
            }
          }
        ],
        payment_method: {
          id: 'pm-uuid',
          name: 'Revolut EUR',
          currency: 'EUR',
          color: '#7B61FF'
        }
      }
      // ... more transactions
    ]
  }
}

// Error
{
  success: false,
  error: 'Payment method not found or access denied.'
}
```

### Usage Example
```typescript
'use client';

import { getTransactionsByPaymentMethod } from '@/app/actions/dashboard';
import { useState, useEffect } from 'react';

export function PaymentMethodTransactions({ paymentMethodId }: { paymentMethodId: string }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTransactionsByPaymentMethod(paymentMethodId, {
      limit: 20,
      offset: 0
    }).then((result) => {
      if (result.success) {
        setData(result.data);
      } else {
        console.error(result.error);
      }
      setLoading(false);
    });
  }, [paymentMethodId]);

  if (loading) return <div>Loading transactions...</div>;
  if (!data) return <div>No data</div>;

  return (
    <div>
      <h2>Transactions for {data.paymentMethod.name}</h2>
      <p className="text-sm text-gray-600">
        Total: {data.totalCount} transactions in {data.paymentMethod.currency}
      </p>

      <ul className="mt-4 space-y-2">
        {data.transactions.map((tx) => (
          <li key={tx.id} className="p-3 border rounded">
            <div className="flex justify-between">
              <div>
                <p className="font-medium">{tx.description || 'No description'}</p>
                <p className="text-sm text-gray-600">{tx.category.name}</p>
                <div className="flex gap-1 mt-1">
                  {tx.transaction_tags.map((tt) => (
                    <span
                      key={tt.tag.id}
                      className="text-xs bg-gray-100 px-2 py-1 rounded"
                    >
                      #{tt.tag.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className={tx.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                  {tx.type === 'income' ? '+' : '-'}
                  {tx.native_amount?.toFixed(2) || tx.amount.toFixed(2)} {data.paymentMethod.currency}
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

### Edge Cases Handled
- ✅ Invalid payment method ID → Error: "Invalid payment method ID format"
- ✅ Payment method doesn't belong to user → Error: "Payment method not found or access denied"
- ✅ No transactions for PM → Returns empty array, totalCount = 0
- ✅ Pagination beyond available data → Returns empty array

---

## 4. Updated Server Action: getTransactions()

**Location**: `/src/app/actions/transactions.ts`

### What Changed
Added support for filtering by `paymentMethodId`.

### New Parameter
```typescript
filters?: {
  type?: 'income' | 'expense';
  categoryId?: string;
  paymentMethodId?: string;  // ⭐ NEW
  tagIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}
```

### Usage Example
```typescript
import { getTransactions } from '@/app/actions/transactions';

// Get all transactions for a specific payment method
const result = await getTransactions({
  paymentMethodId: 'uuid-here',
  limit: 50,
  offset: 0
});

// Combine with other filters
const result2 = await getTransactions({
  paymentMethodId: 'uuid-here',
  type: 'expense',
  categoryId: 'food-category-uuid',
  dateFrom: '2025-12-01',
  dateTo: '2025-12-31'
});
```

---

## Updated Validation Schema

**Location**: `/src/lib/validations/transaction.ts`

### Changes
```typescript
export const getTransactionsFilterSchema = z.object({
  type: transactionTypeSchema.optional(),
  categoryId: uuidSchema.optional(),
  paymentMethodId: uuidSchema.optional(),  // ⭐ NEW
  tagIds: z.array(uuidSchema).optional(),
  dateFrom: dateStringSchema.optional(),
  dateTo: dateStringSchema.optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});
```

---

## Error Handling

All Server Actions follow the standard `ActionResult<T>` pattern:

```typescript
type ActionResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
}
```

### Common Error Messages

| Error Message | Cause | Resolution |
|--------------|-------|-----------|
| `"Unauthorized. Please log in to view balance."` | User not authenticated | Redirect to login |
| `"Failed to fetch user profile. Please try again."` | Profile query failed | Retry or show error toast |
| `"Failed to fetch payment methods. Please try again."` | Database error | Retry or show error toast |
| `"Payment method not found or access denied."` | Invalid PM ID or not owned by user | Validate PM ID |
| `"Invalid payment method ID format."` | Malformed UUID | Validate input format |

---

## Exchange Rate Integration

All dashboard actions use the **Exchange Rate Service** from Card #21:

```typescript
import { exchangeRateService } from '@/lib/services/exchange-rate-service';

const rateResult = await exchangeRateService.getRate('EUR', 'USD');
```

### Exchange Rate Sources

| Source | Description | UI Indicator |
|--------|-------------|--------------|
| `fresh` | Rate fetched within last 24 hours | ✅ No indicator |
| `stale` | Rate older than 24 hours | ⚠️ Show warning |
| `api` | Just fetched from API | ✅ No indicator |
| `not_found` | No rate available | ❌ Show error |

### Rate Staleness Detection

A rate is considered stale if:
- `rateResult.source === 'stale'`
- OR `rateResult.fetchedAt` is older than 24 hours
- OR `isRateStale === true` in the response

**UI Recommendation**: Show a warning badge or icon for stale rates.

---

## Data Flow Diagram

```
User → Dashboard UI (Client Component)
         ↓
   getTotalBalanceInBaseCurrency() [Server Action]
         ↓
   [1] Fetch user's base currency from profiles
   [2] Fetch all active payment methods
   [3] For each payment method:
       → Calculate native balance (RPC function)
       → Get exchange rate (Exchange Rate Service)
       → Convert to base currency
   [4] Sum all converted balances
         ↓
   Return: { totalBalance, baseCurrency, breakdown }
         ↓
   Dashboard UI renders total balance
```

---

## Testing Scenarios

### Scenario 1: User with Multiple Currencies
**Setup**: User has USD (Chase), EUR (Revolut), UAH (Mono)
**Expected**: Total balance correctly sums all converted amounts
**Test**: Verify `breakdown` array has 3 items with correct conversions

### Scenario 2: Same Currency as Base
**Setup**: User base currency = USD, payment method = USD
**Expected**: `exchangeRate = 1.0`, no conversion
**Test**: Verify `nativeBalance === convertedBalance`

### Scenario 3: Stale Exchange Rate
**Setup**: EUR→USD rate is 48 hours old
**Expected**: `isRateStale = true`, rate still used
**Test**: Verify warning indicator shown in UI

### Scenario 4: No Transactions
**Setup**: New payment method with no transactions
**Expected**: `nativeBalance = 0`, `transactionCount = 0`
**Test**: Verify balance displays as 0.00

### Scenario 5: Payment Method Filtering
**Setup**: Filter transactions by specific payment method
**Expected**: Only transactions for that PM returned
**Test**: Verify `transactions` array only contains matching PM ID

---

## Performance Considerations

### Database Queries

1. **getTotalBalanceInBaseCurrency()**: 1 + N queries
   - 1 query for user profile
   - 1 query for all payment methods
   - N RPC calls for balances (where N = number of payment methods)

2. **getPaymentMethodBalancesWithDetails()**: 1 + 3N queries
   - 1 query for user profile
   - 1 query for all payment methods
   - N RPC calls for balances
   - N queries for transaction stats
   - N queries for transaction counts

3. **getTransactionsByPaymentMethod()**: 3 queries
   - 1 query to verify payment method
   - 1 query for count
   - 1 query for transactions with relations

### Optimization Recommendations

- ✅ Already using database RPC functions for balance calculation
- ✅ Exchange rates are cached with 24-hour TTL
- ⚠️ Consider adding Redis cache for dashboard data (future)
- ⚠️ Consider batch API for getting all PM balances in one call (future)

---

## Revalidation Paths

Dashboard Server Actions do NOT automatically revalidate paths. If you need to refresh data after mutations:

```typescript
import { revalidatePath } from 'next/cache';

// After creating/updating transactions
revalidatePath('/dashboard');

// After updating payment methods
revalidatePath('/dashboard');
revalidatePath('/payment-methods');
```

**Note**: The dashboard actions themselves are read-only queries, so they don't modify data and don't call `revalidatePath()`.

---

## Next Steps for Frontend Developer

1. ✅ Review this API documentation
2. ⏭️ Create dashboard UI components
3. ⏭️ Integrate Server Action calls
4. ⏭️ Add loading states and error handling
5. ⏭️ Implement stale rate warning indicators
6. ⏭️ Add pagination for transaction lists
7. ⏭️ Test with real multi-currency data

---

## Support & Questions

If you encounter any issues or have questions about these Server Actions:

1. Check error messages in browser console
2. Verify Supabase connection and authentication
3. Test with database data from Cards #19-21
4. Consult System Architect (Agent 02) for schema questions
5. Consult Backend Developer (Agent 03) for logic questions

---

**End of Documentation**

✅ Backend Phase 1 Complete
⏭️ Ready for Frontend Phase 2 Implementation
