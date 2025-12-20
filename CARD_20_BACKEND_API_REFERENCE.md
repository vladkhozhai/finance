# Card #20: Backend API Reference for Frontend Developer

**Quick reference for implementing multi-currency transaction UI**

---

## Available Server Actions

All Server Actions are in `/src/app/actions/transactions.ts`

---

## 1. Create Transaction (Updated)

### Import:
```typescript
import { createTransaction } from "@/app/actions/transactions";
```

### Signature:
```typescript
createTransaction(input: {
  amount: number;              // Amount in payment method's currency (or base if no payment method)
  type: "income" | "expense";
  categoryId: string;
  date: string;                // Format: "YYYY-MM-DD"
  description?: string;
  tagIds?: string[];
  paymentMethodId?: string;    // NEW: If provided, amount is in this payment method's currency
  manualExchangeRate?: number; // NEW: Optional manual rate override
}): Promise<ActionResult<{ id: string }>>
```

### Example 1: Multi-Currency Transaction
```typescript
const result = await createTransaction({
  amount: 1000,  // ₴1000 UAH (payment method's currency)
  type: "expense",
  categoryId: "food-category-id",
  date: "2024-12-01",
  description: "Groceries",
  paymentMethodId: "uah-card-id",  // Backend will convert to USD
});

if (result.success) {
  console.log("Transaction created:", result.data.id);
  // Backend stored:
  // - amount: 24.39 (USD)
  // - native_amount: 1000.00 (UAH)
  // - exchange_rate: 0.024390
  // - base_currency: "USD"
} else {
  console.error(result.error);
}
```

### Example 2: Legacy Transaction (No Payment Method)
```typescript
const result = await createTransaction({
  amount: 50,  // $50 in base currency
  type: "expense",
  categoryId: "food-category-id",
  date: "2024-12-01",
  description: "Groceries",
  // No paymentMethodId → legacy transaction
});

if (result.success) {
  console.log("Legacy transaction created:", result.data.id);
  // Backend stored:
  // - amount: 50.00
  // - payment_method_id: NULL
  // - native_amount: NULL
  // - exchange_rate: NULL
  // - base_currency: NULL
}
```

### Example 3: Manual Exchange Rate
```typescript
const result = await createTransaction({
  amount: 100,  // €100 EUR
  type: "expense",
  categoryId: "travel-category-id",
  date: "2024-12-01",
  paymentMethodId: "eur-card-id",
  manualExchangeRate: 1.10,  // Override: 1 EUR = 1.10 USD
});

// Backend will use 1.10 instead of fetching from database
```

---

## 2. Update Transaction (Updated)

### Import:
```typescript
import { updateTransaction } from "@/app/actions/transactions";
```

### Signature:
```typescript
updateTransaction(input: {
  id: string;
  amount?: number;
  type?: "income" | "expense";
  categoryId?: string;
  date?: string;
  description?: string;
  tagIds?: string[];
  paymentMethodId?: string;    // NEW: Change payment method
  manualExchangeRate?: number; // NEW: Manual rate override
}): Promise<ActionResult<{ id: string }>>
```

### Example: Change Payment Method
```typescript
const result = await updateTransaction({
  id: "transaction-id",
  paymentMethodId: "eur-card-id",  // Switch from UAH to EUR
  // Backend will recalculate exchange rate and amounts
});
```

---

## 3. Get Transactions (Updated)

### Import:
```typescript
import { getTransactions } from "@/app/actions/transactions";
```

### Signature:
```typescript
getTransactions(filters?: {
  type?: "income" | "expense";
  categoryId?: string;
  tagIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}): Promise<ActionResult<TransactionWithRelations[]>>
```

### Return Type:
```typescript
type TransactionWithRelations = {
  id: string;
  user_id: string;
  amount: number;              // Base currency amount
  type: "income" | "expense";
  category_id: string;
  date: string;
  description: string | null;
  created_at: string;
  updated_at: string;

  // Multi-currency fields (nullable)
  payment_method_id: string | null;
  native_amount: number | null;     // Amount in payment method's currency
  exchange_rate: number | null;
  base_currency: string | null;

  // Relations
  category: {
    id: string;
    name: string;
    color: string;
    type: string;
  };
  transaction_tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
  payment_method?: {  // NEW: Can be null
    id: string;
    name: string;
    currency: string;
    color: string | null;
  } | null;
};
```

### Example:
```typescript
const result = await getTransactions({
  type: "expense",
  limit: 10,
  offset: 0,
});

if (result.success) {
  result.data.forEach((transaction) => {
    if (transaction.payment_method_id) {
      // Multi-currency transaction
      console.log(`${transaction.native_amount} ${transaction.payment_method.currency} = ${transaction.amount} ${transaction.base_currency}`);
      console.log(`Rate: ${transaction.exchange_rate}`);
    } else {
      // Legacy transaction
      console.log(`${transaction.amount} (base currency)`);
    }
  });
}
```

---

## 4. Get Payment Method Balances (NEW)

### Import:
```typescript
import { getPaymentMethodBalances } from "@/app/actions/transactions";
```

### Signature:
```typescript
getPaymentMethodBalances(): Promise<
  ActionResult<
    Array<{
      paymentMethodId: string;
      paymentMethodName: string;
      currency: string;
      balance: number;
      color: string | null;
    }>
  >
>
```

### Example:
```typescript
const result = await getPaymentMethodBalances();

if (result.success) {
  result.data.forEach((pm) => {
    console.log(`${pm.paymentMethodName}: ${pm.balance} ${pm.currency}`);
    // "Chase USD: 1234.56 USD"
    // "My EUR Card: 256.80 EUR"
    // "UAH Mono: 4100.00 UAH"
  });
}
```

### UI Example:
```tsx
const { data: balances } = await getPaymentMethodBalances();

return (
  <div className="space-y-2">
    {balances.map((pm) => (
      <div key={pm.paymentMethodId} className="flex justify-between">
        <span>{pm.paymentMethodName}</span>
        <span className="font-mono">
          {pm.balance.toFixed(2)} {pm.currency}
        </span>
      </div>
    ))}
  </div>
);
```

---

## 5. Get Total Balance in Base Currency (NEW)

### Import:
```typescript
import { getTotalBalanceInBaseCurrency } from "@/app/actions/transactions";
```

### Signature:
```typescript
getTotalBalanceInBaseCurrency(): Promise<
  ActionResult<{
    totalBalance: number;
    baseCurrency: string;
    breakdown: Array<{
      paymentMethodId: string;
      paymentMethodName: string;
      currency: string;
      balance: number;
      exchangeRate: number;
      convertedBalance: number;
    }>;
  }>
>
```

### Example:
```typescript
const result = await getTotalBalanceInBaseCurrency();

if (result.success) {
  console.log(`Total: ${result.data.totalBalance} ${result.data.baseCurrency}`);

  result.data.breakdown.forEach((item) => {
    console.log(
      `${item.paymentMethodName}: ${item.balance} ${item.currency} × ${item.exchangeRate} = ${item.convertedBalance} ${result.data.baseCurrency}`
    );
  });
}

// Output:
// Total: 1515.35 USD
// Chase USD: 1234.56 USD × 1.0 = 1234.56 USD
// My EUR Card: 256.80 EUR × 1.086957 = 279.20 USD
// UAH Mono: 4100.00 UAH × 0.024390 = 100.00 USD
```

### UI Example:
```tsx
const { data } = await getTotalBalanceInBaseCurrency();

return (
  <div>
    <h2 className="text-2xl font-bold">
      {data.totalBalance.toFixed(2)} {data.baseCurrency}
    </h2>

    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
      {data.breakdown.map((item) => (
        <div key={item.paymentMethodId}>
          {item.balance.toFixed(2)} {item.currency}
          {item.exchangeRate !== 1.0 && (
            <span> = {item.convertedBalance.toFixed(2)} {data.baseCurrency}</span>
          )}
        </div>
      ))}
    </div>
  </div>
);
```

---

## 6. Get Transaction By ID (Updated)

### Import:
```typescript
import { getTransactionById } from "@/app/actions/transactions";
```

### Signature:
```typescript
getTransactionById(id: string): Promise<ActionResult<TransactionWithRelations | null>>
```

### Example:
```typescript
const result = await getTransactionById("transaction-id");

if (result.success && result.data) {
  const transaction = result.data;

  if (transaction.payment_method_id) {
    // Multi-currency transaction
    console.log(`Native: ${transaction.native_amount} ${transaction.payment_method.currency}`);
    console.log(`Converted: ${transaction.amount} ${transaction.base_currency}`);
    console.log(`Rate: ${transaction.exchange_rate}`);
  } else {
    // Legacy transaction
    console.log(`Amount: ${transaction.amount}`);
  }
}
```

---

## UI Implementation Patterns

### Pattern 1: Transaction Form with Payment Method Selector

```tsx
"use client";

import { useState } from "react";
import { createTransaction } from "@/app/actions/transactions";

export function TransactionForm() {
  const [amount, setAmount] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState<string | undefined>();
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await createTransaction({
      amount: parseFloat(amount),
      type: "expense",
      categoryId: "...",
      date: new Date().toISOString().split("T")[0],
      paymentMethodId,  // Optional: if provided, amount is in payment method's currency
    });

    if (result.success) {
      // Success: transaction created
    } else {
      // Error: show result.error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Amount ({selectedCurrency})
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>

      <label>
        Payment Method (optional)
        <select
          value={paymentMethodId || ""}
          onChange={(e) => {
            const pmId = e.target.value || undefined;
            setPaymentMethodId(pmId);

            // Update currency based on selected payment method
            if (pmId) {
              const pm = paymentMethods.find((p) => p.id === pmId);
              setSelectedCurrency(pm?.currency || "USD");
            } else {
              setSelectedCurrency(userBaseCurrency);
            }
          }}
        >
          <option value="">None (use base currency)</option>
          {paymentMethods.map((pm) => (
            <option key={pm.id} value={pm.id}>
              {pm.name} ({pm.currency})
            </option>
          ))}
        </select>
      </label>

      <button type="submit">Create Transaction</button>
    </form>
  );
}
```

---

### Pattern 2: Display Transaction Amount

```tsx
function TransactionAmount({ transaction }: { transaction: TransactionWithRelations }) {
  if (transaction.payment_method_id && transaction.native_amount) {
    // Multi-currency transaction
    return (
      <div>
        <div className="text-lg font-semibold">
          {transaction.native_amount.toFixed(2)} {transaction.payment_method.currency}
        </div>
        <div className="text-sm text-muted-foreground">
          = {transaction.amount.toFixed(2)} {transaction.base_currency}
          <span className="ml-1">
            (rate: {transaction.exchange_rate?.toFixed(6)})
          </span>
        </div>
      </div>
    );
  }

  // Legacy transaction
  return (
    <div className="text-lg font-semibold">
      {transaction.amount.toFixed(2)} {userBaseCurrency}
    </div>
  );
}
```

---

### Pattern 3: Multi-Currency Balance Dashboard

```tsx
async function BalanceDashboard() {
  const [pmBalances, totalBalance] = await Promise.all([
    getPaymentMethodBalances(),
    getTotalBalanceInBaseCurrency(),
  ]);

  if (!pmBalances.success || !totalBalance.success) {
    return <div>Error loading balances</div>;
  }

  return (
    <div className="space-y-6">
      {/* Total Balance */}
      <div className="rounded-lg border p-6">
        <h2 className="text-sm text-muted-foreground">Total Balance</h2>
        <p className="text-3xl font-bold">
          {totalBalance.data.totalBalance.toFixed(2)} {totalBalance.data.baseCurrency}
        </p>
      </div>

      {/* Payment Method Balances */}
      <div className="space-y-2">
        <h3 className="font-semibold">By Payment Method</h3>
        {pmBalances.data.map((pm) => (
          <div key={pm.paymentMethodId} className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">{pm.paymentMethodName}</p>
              <p className="text-sm text-muted-foreground">{pm.currency}</p>
            </div>
            <p className="text-lg font-semibold">
              {pm.balance.toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Error Handling

All Server Actions return `ActionResult<T>`:

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

### Example:
```typescript
const result = await createTransaction(input);

if (result.success) {
  // result.data is available
  console.log("Transaction ID:", result.data.id);
} else {
  // result.error is available
  console.error("Error:", result.error);
  // Show error to user
}
```

### Common Errors:
- `"Unauthorized. Please log in to create transactions."`
- `"Invalid payment method. Please select a valid payment method."`
- `"Exchange rate not available for EUR to USD. Please provide a manual rate."`
- `"Invalid category. Please select a valid category."`
- `"Failed to create transaction. Please try again."`

---

## Validation

All inputs are validated with Zod schemas:

### Amount:
- Must be positive number
- Max 2 decimal places recommended

### Date:
- Format: `"YYYY-MM-DD"`
- Example: `"2024-12-01"`

### Payment Method ID:
- Must be valid UUID
- Must belong to authenticated user (enforced by RLS)

### Category ID:
- Must be valid UUID
- Must belong to authenticated user

### Exchange Rate (if manual):
- Must be positive number
- No validation on reasonableness (user responsibility)

---

## Currency Codes Supported (MVP)

Current stub rates available for:

| Code | Currency | Example Rate to USD |
|------|----------|---------------------|
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

**Note**: Card #21 will add live API rates for all currencies.

---

## Questions?

Contact **Backend Developer (Agent 03)** for:
- Server Action behavior clarifications
- Error handling questions
- Performance concerns
- New action requirements

---

**Happy coding! 🚀**
