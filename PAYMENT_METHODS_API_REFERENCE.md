# Payment Methods API Reference

Quick reference for Server Actions in `/src/app/actions/payment-methods.ts`

---

## Imports

```typescript
import {
  createPaymentMethod,
  getPaymentMethods,
  getPaymentMethodById,
  updatePaymentMethod,
  archivePaymentMethod,
  activatePaymentMethod,
  deletePaymentMethod,
  getPaymentMethodBalance,
  getBalancesByCurrency,
  getDefaultPaymentMethod,
  setDefaultPaymentMethod,
  type PaymentMethodWithBalance,
  type BalanceByCurrency,
} from "@/app/actions/payment-methods";
```

---

## Server Actions

### 1. createPaymentMethod

Create a new payment method.

```typescript
createPaymentMethod(input: {
  name: string;              // 1-100 chars, unique per user
  currency: string;          // ISO 4217 code (USD, EUR, UAH, etc.)
  cardType?: 'debit' | 'credit' | 'cash' | 'savings' | 'other';
  color?: string;            // Hex color #RRGGBB
  isDefault?: boolean;       // Default: false
}): Promise<ActionResult<PaymentMethod>>
```

**Example**:
```typescript
const result = await createPaymentMethod({
  name: "Chase Sapphire Reserve",
  currency: "USD",
  cardType: "credit",
  color: "#0066CC",
  isDefault: true
});
```

---

### 2. getPaymentMethods

Get list of payment methods with optional filters.

```typescript
getPaymentMethods(filters?: {
  isActive?: boolean;        // Filter by active status
  currency?: string;         // Filter by currency code
  limit?: number;            // Max 100, default 50
  offset?: number;           // For pagination, default 0
}): Promise<ActionResult<PaymentMethod[]>>
```

**Example**:
```typescript
// Get all active payment methods
const result = await getPaymentMethods({ isActive: true });

// Get EUR payment methods
const result = await getPaymentMethods({ currency: "EUR" });

// Get first 20 payment methods
const result = await getPaymentMethods({ limit: 20, offset: 0 });
```

---

### 3. getPaymentMethodById

Get single payment method with calculated balance.

```typescript
getPaymentMethodById(input: {
  id: string;                // UUID
}): Promise<ActionResult<PaymentMethodWithBalance>>
```

**Example**:
```typescript
const result = await getPaymentMethodById({ id: "uuid-here" });

if (result.success) {
  console.log(`Balance: ${result.data.balance} ${result.data.currency}`);
}
```

---

### 4. updatePaymentMethod

Update payment method details. **Currency cannot be changed**.

```typescript
updatePaymentMethod(input: {
  id: string;                // UUID, required
  name?: string;             // 1-100 chars
  cardType?: 'debit' | 'credit' | 'cash' | 'savings' | 'other' | null;
  color?: string | null;     // Hex color #RRGGBB
  isDefault?: boolean;
}): Promise<ActionResult<PaymentMethod>>
```

**Example**:
```typescript
const result = await updatePaymentMethod({
  id: "uuid-here",
  name: "New Name",
  color: "#FF5733",
  isDefault: true
});
```

---

### 5. archivePaymentMethod

Soft delete payment method (sets `is_active = false`).

```typescript
archivePaymentMethod(input: {
  id: string;                // UUID
}): Promise<ActionResult<PaymentMethod>>
```

**Example**:
```typescript
const result = await archivePaymentMethod({ id: "uuid-here" });
```

---

### 6. activatePaymentMethod

Reactivate an archived payment method.

```typescript
activatePaymentMethod(input: {
  id: string;                // UUID
}): Promise<ActionResult<PaymentMethod>>
```

**Example**:
```typescript
const result = await activatePaymentMethod({ id: "uuid-here" });
```

---

### 7. deletePaymentMethod

Hard delete payment method. **Blocked if transactions exist**.

```typescript
deletePaymentMethod(input: {
  id: string;                // UUID
}): Promise<ActionResult<void>>
```

**Example**:
```typescript
const result = await deletePaymentMethod({ id: "uuid-here" });

if (!result.success && result.error.includes("transaction")) {
  // Payment method has transactions, use archive instead
}
```

---

### 8. getPaymentMethodBalance

Get current balance for a payment method.

```typescript
getPaymentMethodBalance(
  paymentMethodId: string    // UUID
): Promise<ActionResult<number>>
```

**Example**:
```typescript
const result = await getPaymentMethodBalance("uuid-here");

if (result.success) {
  console.log(`Balance: ${result.data}`);
}
```

---

### 9. getBalancesByCurrency

Get user balances grouped by currency.

```typescript
getBalancesByCurrency(): Promise<ActionResult<BalanceByCurrency[]>>

// BalanceByCurrency = { currency: string; balance: number }
```

**Example**:
```typescript
const result = await getBalancesByCurrency();

if (result.success) {
  result.data.forEach(({ currency, balance }) => {
    console.log(`${currency}: ${balance}`);
  });
}

// Output:
// USD: 1250.50
// EUR: 800.00
// UAH: 25000.00
```

---

### 10. getDefaultPaymentMethod

Get the user's default payment method.

```typescript
getDefaultPaymentMethod(): Promise<ActionResult<PaymentMethod | null>>
```

**Example**:
```typescript
const result = await getDefaultPaymentMethod();

if (result.success && result.data) {
  console.log(`Default: ${result.data.name}`);
} else {
  console.log("No default payment method set");
}
```

---

### 11. setDefaultPaymentMethod

Set a payment method as default. **Automatically unsets others**.

```typescript
setDefaultPaymentMethod(
  paymentMethodId: string    // UUID
): Promise<ActionResult<PaymentMethod>>
```

**Example**:
```typescript
const result = await setDefaultPaymentMethod("uuid-here");
```

---

## Types

### PaymentMethod
```typescript
type PaymentMethod = {
  id: string;
  user_id: string;
  name: string;
  currency: string;          // ISO 4217 code
  card_type: string | null;  // 'debit' | 'credit' | 'cash' | 'savings' | 'other'
  color: string | null;      // Hex color #RRGGBB
  is_default: boolean;
  is_active: boolean;
  created_at: string;        // ISO timestamp
  updated_at: string;        // ISO timestamp
};
```

### PaymentMethodWithBalance
```typescript
type PaymentMethodWithBalance = PaymentMethod & {
  balance: number;           // Calculated balance in native currency
};
```

### BalanceByCurrency
```typescript
type BalanceByCurrency = {
  currency: string;          // ISO 4217 code
  balance: number;           // Total balance for this currency
};
```

### ActionResult
```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

---

## Supported Currencies (38 Total)

USD, EUR, UAH, GBP, JPY, CNY, CHF, CAD, AUD, PLN, CZK, SEK, NOK, DKK, HUF, RON, BGN, RUB, TRY, INR, BRL, MXN, ZAR, KRW, SGD, HKD, NZD, THB, MYR, IDR, PHP, VND, AED, SAR, ILS, EGP, KWD, QAR

---

## Error Messages

### Common Errors:

| Error | Cause |
|-------|-------|
| `"Unauthorized"` | User not authenticated |
| `"A payment method with this name already exists"` | Duplicate name |
| `"Payment method not found"` | Invalid ID or belongs to another user |
| `"Invalid currency code"` | Currency not in supported list |
| `"Invalid hex color"` | Color not in #RRGGBB format |
| `"Payment method is already archived"` | Trying to archive already archived |
| `"Payment method is already active"` | Trying to activate already active |
| `"Cannot set archived payment method as default"` | Trying to set archived as default |
| `"Cannot delete payment method with N transaction(s)"` | Has linked transactions |

---

## Validation Rules

### Name
- Required
- 1-100 characters
- Unique per user
- Trimmed automatically

### Currency
- Required
- Exactly 3 characters
- Uppercase ISO 4217 code
- Must be in CURRENCY_CODES list
- **Cannot be changed after creation**

### Card Type
- Optional
- One of: `debit`, `credit`, `cash`, `savings`, `other`
- Can be null

### Color
- Optional
- Hex format: `#RRGGBB`
- Case-insensitive (normalized to uppercase)
- Can be null

### Default Flag
- Optional, default: false
- Only one payment method can be default per user
- Automatically enforced by database trigger

---

## Usage Patterns

### Client Component Pattern
```typescript
"use client";

import { useState } from "react";
import { createPaymentMethod } from "@/app/actions/payment-methods";

export function PaymentMethodForm() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const result = await createPaymentMethod({
      name: formData.get("name") as string,
      currency: formData.get("currency") as string,
      cardType: formData.get("cardType") as any,
      color: formData.get("color") as string,
      isDefault: formData.get("isDefault") === "true"
    });

    if (result.success) {
      // Success: redirect or show message
    } else {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {/* Form fields */}
    </form>
  );
}
```

### Server Component Pattern
```typescript
import { getPaymentMethods } from "@/app/actions/payment-methods";

export default async function PaymentMethodsPage() {
  const result = await getPaymentMethods({ isActive: true });

  if (!result.success) {
    return <div>Error: {result.error}</div>;
  }

  return (
    <div>
      <h1>Payment Methods</h1>
      <ul>
        {result.data.map((pm) => (
          <li key={pm.id}>
            {pm.name} ({pm.currency})
            {pm.is_default && <span>⭐ Default</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### React Hook Pattern (with React Query)
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPaymentMethods, createPaymentMethod } from "@/app/actions/payment-methods";

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["paymentMethods"],
    queryFn: async () => {
      const result = await getPaymentMethods({ isActive: true });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
    },
  });
}
```

---

## Best Practices

### 1. Always Check Success
```typescript
const result = await createPaymentMethod(data);

if (result.success) {
  // Handle success
} else {
  // Handle error: result.error
}
```

### 2. Use Type Guards
```typescript
const result = await getPaymentMethodById({ id });

if (result.success) {
  // TypeScript knows result.data is PaymentMethodWithBalance
  const balance = result.data.balance;
}
```

### 3. Handle Loading States
```typescript
const [loading, setLoading] = useState(false);

async function handleAction() {
  setLoading(true);
  try {
    const result = await createPaymentMethod(data);
    // Handle result
  } finally {
    setLoading(false);
  }
}
```

### 4. Validate Before Submission
```typescript
import { createPaymentMethodSchema } from "@/lib/validations/payment-method";

const validation = createPaymentMethodSchema.safeParse(formData);

if (!validation.success) {
  setError(validation.error.issues[0].message);
  return;
}

const result = await createPaymentMethod(validation.data);
```

### 5. Cache Management
```typescript
// Manually revalidate after mutations
import { revalidatePath } from "next/cache";

// Server Actions already handle this internally
// No need to call manually unless in custom hooks
```

---

## Performance Tips

1. **Use filters** to reduce data fetched
2. **Implement pagination** for large lists
3. **Cache payment methods** (they don't change often)
4. **Use Server Components** when possible (no client JS)
5. **Batch operations** if creating multiple payment methods

---

## Security Notes

- ✅ All actions verify authentication
- ✅ RLS policies enforce user ownership
- ✅ Input validation with Zod
- ✅ No sensitive data in error messages
- ✅ Currency immutability prevents data corruption
- ✅ Transaction protection on delete

---

**Last Updated**: December 18, 2025
**Version**: 1.0
