# Payment Methods - Backend Developer Guide

## Quick Reference for Agent 03 (Backend Developer)

This guide provides everything you need to implement Server Actions for the `payment_methods` table.

---

## TypeScript Types

All types are auto-generated in `/src/types/database.types.ts`:

```typescript
import { Database } from '@/types/database.types';

// Type aliases for convenience
type PaymentMethod = Database['public']['Tables']['payment_methods']['Row'];
type PaymentMethodInsert = Database['public']['Tables']['payment_methods']['Insert'];
type PaymentMethodUpdate = Database['public']['Tables']['payment_methods']['Update'];

// Card type enum (for validation)
type CardType = 'debit' | 'credit' | 'cash' | 'savings' | 'other';
```

---

## Required Server Actions

### 1. Create Payment Method
**File**: `/src/app/actions/payment-methods.ts`

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createPaymentMethod(data: {
  name: string;
  currency: string; // ISO 4217 code (e.g., 'USD', 'EUR', 'UAH')
  cardType?: 'debit' | 'credit' | 'cash' | 'savings' | 'other';
  color?: string; // Hex color (e.g., '#3B82F6')
  isDefault?: boolean;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Validate currency format (uppercase 3 letters)
  if (!/^[A-Z]{3}$/.test(data.currency)) {
    return { success: false, error: 'Invalid currency code. Must be 3 uppercase letters (e.g., USD, EUR)' };
  }

  // Validate color format if provided
  if (data.color && !/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
    return { success: false, error: 'Invalid color format. Must be hex color (e.g., #3B82F6)' };
  }

  const { data: paymentMethod, error } = await supabase
    .from('payment_methods')
    .insert({
      user_id: user.id,
      name: data.name.trim(),
      currency: data.currency.toUpperCase(),
      card_type: data.cardType || null,
      color: data.color || null,
      is_default: data.isDefault || false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating payment method:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true, data: paymentMethod };
}
```

### 2. Get All Payment Methods
```typescript
export async function getPaymentMethods(includeInactive = false) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  let query = supabase
    .from('payment_methods')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching payment methods:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
```

### 3. Update Payment Method
```typescript
export async function updatePaymentMethod(id: string, data: {
  name?: string;
  cardType?: 'debit' | 'credit' | 'cash' | 'savings' | 'other' | null;
  color?: string | null;
  isDefault?: boolean;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Validate color format if provided
  if (data.color && !/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
    return { success: false, error: 'Invalid color format. Must be hex color (e.g., #3B82F6)' };
  }

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.cardType !== undefined) updateData.card_type = data.cardType;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.isDefault !== undefined) updateData.is_default = data.isDefault;

  const { data: paymentMethod, error } = await supabase
    .from('payment_methods')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id) // Ensure RLS - user owns this payment method
    .select()
    .single();

  if (error) {
    console.error('Error updating payment method:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true, data: paymentMethod };
}
```

### 4. Archive Payment Method (Soft Delete)
```typescript
export async function archivePaymentMethod(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Check if there are transactions using this payment method
  const { count } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('payment_method_id', id);

  if (count && count > 0) {
    // Don't allow archiving if there are transactions
    // (Keep for historical data integrity)
    return {
      success: false,
      error: `Cannot archive payment method with ${count} transaction(s). Use soft delete instead.`
    };
  }

  const { data: paymentMethod, error } = await supabase
    .from('payment_methods')
    .update({ is_active: false })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error archiving payment method:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true, data: paymentMethod };
}
```

### 5. Get Payment Method Balance
```typescript
export async function getPaymentMethodBalance(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // First verify user owns this payment method
  const { data: paymentMethod } = await supabase
    .from('payment_methods')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!paymentMethod) {
    return { success: false, error: 'Payment method not found or access denied' };
  }

  // Use the helper function
  const { data, error } = await supabase
    .rpc('get_payment_method_balance', { p_payment_method_id: id });

  if (error) {
    console.error('Error getting payment method balance:', error);
    return { success: false, error: error.message };
  }

  return { success: true, balance: data };
}
```

### 6. Get Balances by Currency
```typescript
export async function getBalancesByCurrency() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .rpc('get_user_balance_by_currency', { p_user_id: user.id });

  if (error) {
    console.error('Error getting balances by currency:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
```

### 7. Set Default Payment Method
```typescript
export async function setDefaultPaymentMethod(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // The trigger will automatically unset other defaults
  const { data: paymentMethod, error } = await supabase
    .from('payment_methods')
    .update({ is_default: true })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error setting default payment method:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true, data: paymentMethod };
}
```

---

## Integration with Transactions

### Updated Transaction Creation

When creating transactions, include `payment_method_id`:

```typescript
export async function createTransaction(data: {
  paymentMethodId: string; // NEW: Required for multi-currency
  categoryId: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  description?: string;
  tags?: string[]; // Tag IDs
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Validate payment method belongs to user (trigger will also check this)
  const { data: paymentMethod } = await supabase
    .from('payment_methods')
    .select('id, is_active')
    .eq('id', data.paymentMethodId)
    .eq('user_id', user.id)
    .single();

  if (!paymentMethod) {
    return { success: false, error: 'Invalid payment method' };
  }

  if (!paymentMethod.is_active) {
    return { success: false, error: 'Cannot use archived payment method' };
  }

  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      payment_method_id: data.paymentMethodId, // NEW
      category_id: data.categoryId,
      amount: data.amount,
      type: data.type,
      date: data.date,
      description: data.description,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating transaction:', error);
    return { success: false, error: error.message };
  }

  // Handle tags (existing logic)
  // ...

  revalidatePath('/dashboard');
  return { success: true, data: transaction };
}
```

---

## Database Helper Functions (Available via RPC)

### 1. get_payment_method_balance
**Purpose**: Calculate balance for a payment method

```typescript
const { data, error } = await supabase
  .rpc('get_payment_method_balance', {
    p_payment_method_id: 'uuid-here'
  });
// Returns: DECIMAL(12, 2) - e.g., 1250.50
```

### 2. get_user_active_payment_methods_count
**Purpose**: Count active payment methods

```typescript
const { data, error } = await supabase
  .rpc('get_user_active_payment_methods_count', {
    p_user_id: user.id
  });
// Returns: INTEGER - e.g., 3
```

### 3. get_user_default_payment_method
**Purpose**: Get default payment method UUID

```typescript
const { data, error } = await supabase
  .rpc('get_user_default_payment_method', {
    p_user_id: user.id
  });
// Returns: UUID - e.g., '550e8400-...'
```

### 4. get_user_balance_by_currency
**Purpose**: Get balances grouped by currency

```typescript
const { data, error } = await supabase
  .rpc('get_user_balance_by_currency', {
    p_user_id: user.id
  });
// Returns: Array of { currency: string, balance: number }
// Example: [
//   { currency: 'EUR', balance: 1500.00 },
//   { currency: 'USD', balance: 3250.75 }
// ]
```

---

## Validation Rules

### Client-Side Validation (for forms)

```typescript
// Zod schema example
import { z } from 'zod';

export const paymentMethodSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .transform(val => val.trim()),

  currency: z.string()
    .length(3, 'Currency must be 3 letters')
    .regex(/^[A-Z]{3}$/, 'Currency must be uppercase ISO 4217 code (e.g., USD, EUR)')
    .transform(val => val.toUpperCase()),

  cardType: z.enum(['debit', 'credit', 'cash', 'savings', 'other']).optional(),

  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be hex format (e.g., #3B82F6)')
    .optional()
    .nullable(),

  isDefault: z.boolean().optional(),
});
```

### Currency Code List
```typescript
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'PLN', name: 'Polish Złoty', symbol: 'zł' },
  // Add more as needed
] as const;
```

---

## Error Handling

### Common Errors

#### 1. Duplicate Payment Method Name
```typescript
// Error: duplicate key value violates unique constraint "uq_user_payment_method_name"
// Solution: Check if name already exists before insert
const { data: existing } = await supabase
  .from('payment_methods')
  .select('id')
  .eq('user_id', user.id)
  .eq('name', name.trim())
  .single();

if (existing) {
  return { success: false, error: 'A payment method with this name already exists' };
}
```

#### 2. Invalid Currency Code
```typescript
// Error: new row for relation "payment_methods" violates check constraint "chk_currency_format"
// Solution: Validate currency format before insert
if (!/^[A-Z]{3}$/.test(currency)) {
  return { success: false, error: 'Invalid currency code. Must be 3 uppercase letters (e.g., USD, EUR)' };
}
```

#### 3. Payment Method Not Found
```typescript
// Error: No payment method found or access denied
// Solution: Always check RLS with .eq('user_id', user.id)
const { data, error } = await supabase
  .from('payment_methods')
  .select('*')
  .eq('id', id)
  .eq('user_id', user.id) // Important for RLS
  .single();
```

---

## Testing Checklist

### Unit Tests
- [ ] Create payment method with valid data
- [ ] Create payment method with invalid currency code (should fail)
- [ ] Create payment method with invalid color format (should fail)
- [ ] Create payment method with duplicate name (should fail)
- [ ] Update payment method name
- [ ] Update payment method to set as default (should unset others)
- [ ] Archive payment method
- [ ] Get all payment methods (should only return user's own)
- [ ] Get payment method balance
- [ ] Get balances by currency

### Integration Tests
- [ ] Create transaction with payment method
- [ ] Create transaction with another user's payment method (should fail)
- [ ] Create transaction with archived payment method (should be allowed for historical data)
- [ ] Delete payment method with transactions (should fail or soft delete)

### RLS Tests
- [ ] User A cannot see User B's payment methods
- [ ] User A cannot create payment method for User B
- [ ] User A cannot update User B's payment method
- [ ] User A cannot delete User B's payment method

---

## Performance Tips

1. **Use select() sparingly**: Only select fields you need
   ```typescript
   .select('id, name, currency, is_default') // Good
   .select('*') // Acceptable, but less efficient
   ```

2. **Batch operations**: When creating multiple payment methods, consider batch insert
   ```typescript
   .insert([{ ... }, { ... }, { ... }])
   ```

3. **Cache active payment methods**: Payment methods don't change often
   ```typescript
   // Use React Query or similar caching
   const { data } = useQuery('paymentMethods', getPaymentMethods);
   ```

4. **Use RPC functions**: For complex calculations, use database functions (faster than fetching and calculating in JS)
   ```typescript
   // Good: Use RPC
   await supabase.rpc('get_payment_method_balance', { ... });

   // Bad: Fetch all transactions and calculate in JS
   const { data: transactions } = await supabase
     .from('transactions')
     .select('*')
     .eq('payment_method_id', id);
   const balance = transactions.reduce(...);
   ```

---

## Next Steps

After implementing Server Actions:
1. **Notify Frontend Developer (Agent 04)**: Share Server Action signatures
2. **Notify QA Engineer (Agent 05)**: Provide test scenarios
3. **Update API documentation**: Document all Server Actions in Swagger/OpenAPI if applicable

---

**Backend Developer**: Agent 03
**Last Updated**: 2025-12-18
**Status**: Ready for Implementation
