# Card #23: Test Scenarios for Budget Breakdown

## Test Scenario 1: Multi-Currency Category Budget

### Setup:
- User base currency: USD
- Budget: $500 for "Food" category (December 2024)
- Payment methods:
  - Chase Sapphire Reserve (USD)
  - Revolut EUR (EUR)
  - Mono UAH (UAH)

### Transactions:
```
Date       | Amount (Native) | Payment Method      | Converted (USD)
-----------|-----------------|---------------------|----------------
2024-12-05 | $50.00 USD      | Chase Sapphire      | $50.00
2024-12-10 | €20.00 EUR      | Revolut EUR         | $21.74
2024-12-15 | $75.00 USD      | Chase Sapphire      | $75.00
2024-12-18 | ₴1000 UAH       | Mono UAH            | $24.39
2024-12-20 | €40.00 EUR      | Revolut EUR         | $43.48
2024-12-25 | $75.00 USD      | Chase Sapphire      | $75.00
2024-12-28 | €20.00 EUR      | Revolut EUR         | $21.74
```

### Expected Response:
```json
{
  "success": true,
  "data": {
    "budget": {
      "id": "budget-food-dec",
      "name": "Food",
      "amount": 500.00,
      "currency": "USD",
      "period": "2024-12-01",
      "categoryId": "cat-food-id",
      "tagId": null
    },
    "totalSpent": 311.35,
    "breakdown": [
      {
        "paymentMethodId": "pm-chase-usd",
        "paymentMethodName": "Chase Sapphire Reserve",
        "paymentMethodCurrency": "USD",
        "amountSpent": 200.00,
        "percentage": 40.0,
        "transactionCount": 3,
        "color": "#3B82F6"
      },
      {
        "paymentMethodId": "pm-revolut-eur",
        "paymentMethodName": "Revolut EUR",
        "paymentMethodCurrency": "EUR",
        "amountSpent": 86.96,
        "percentage": 17.4,
        "transactionCount": 3,
        "color": "#10B981"
      },
      {
        "paymentMethodId": "pm-mono-uah",
        "paymentMethodName": "Mono UAH",
        "paymentMethodCurrency": "UAH",
        "amountSpent": 24.39,
        "percentage": 4.9,
        "transactionCount": 1,
        "color": "#F59E0B"
      }
    ]
  }
}
```

### Validation Checklist:
- [ ] Total spent = sum of all breakdown amounts
- [ ] Percentages calculated correctly (amount/500*100)
- [ ] Items sorted by amountSpent descending
- [ ] All amounts in USD (base currency)
- [ ] Transaction counts correct
- [ ] Colors match payment method colors

---

## Test Scenario 2: Tag Budget with Mixed Currencies

### Setup:
- User base currency: USD
- Budget: $300 for "#travel" tag (December 2024)
- Payment methods:
  - Visa (USD)
  - Revolut EUR (EUR)

### Transactions:
```
Date       | Category    | Tags    | Amount (Native) | Payment Method | Converted (USD)
-----------|-------------|---------|-----------------|----------------|----------------
2024-12-05 | Transport   | #travel | $45.00 USD      | Visa           | $45.00
2024-12-10 | Food        | #travel | €30.00 EUR      | Revolut EUR    | $32.61
2024-12-15 | Hotel       | #travel | $120.00 USD     | Visa           | $120.00
2024-12-20 | Food        | #travel | €25.00 EUR      | Revolut EUR    | $27.17
```

### Expected Response:
```json
{
  "success": true,
  "data": {
    "budget": {
      "id": "budget-travel-dec",
      "name": "#travel",
      "amount": 300.00,
      "currency": "USD",
      "period": "2024-12-01",
      "categoryId": null,
      "tagId": "tag-travel-id"
    },
    "totalSpent": 224.78,
    "breakdown": [
      {
        "paymentMethodId": "pm-visa-usd",
        "paymentMethodName": "Visa",
        "paymentMethodCurrency": "USD",
        "amountSpent": 165.00,
        "percentage": 55.0,
        "transactionCount": 2,
        "color": "#3B82F6"
      },
      {
        "paymentMethodId": "pm-revolut-eur",
        "paymentMethodName": "Revolut EUR",
        "paymentMethodCurrency": "EUR",
        "amountSpent": 59.78,
        "percentage": 19.9,
        "transactionCount": 2,
        "color": "#10B981"
      }
    ]
  }
}
```

### Validation Checklist:
- [ ] Tag name formatted with # prefix
- [ ] categoryId is null, tagId is set
- [ ] Transactions filtered by tag_id
- [ ] Junction table query works correctly

---

## Test Scenario 3: Budget with Legacy Transactions

### Setup:
- User base currency: USD
- Budget: $200 for "Entertainment" category (December 2024)
- Mix of legacy (no payment method) and new transactions

### Transactions:
```
Date       | Amount    | Payment Method | Type
-----------|-----------|----------------|-------
2024-12-05 | $50.00    | null           | legacy
2024-12-10 | $30.00    | Chase USD      | new
2024-12-15 | $40.00    | null           | legacy
2024-12-20 | $25.00    | Chase USD      | new
```

### Expected Response:
```json
{
  "success": true,
  "data": {
    "budget": {
      "id": "budget-entertainment-dec",
      "name": "Entertainment",
      "amount": 200.00,
      "currency": "USD",
      "period": "2024-12-01",
      "categoryId": "cat-entertainment-id",
      "tagId": null
    },
    "totalSpent": 145.00,
    "breakdown": [
      {
        "paymentMethodId": null,
        "paymentMethodName": "Legacy Transactions",
        "paymentMethodCurrency": "USD",
        "amountSpent": 90.00,
        "percentage": 45.0,
        "transactionCount": 2,
        "color": "#6B7280"
      },
      {
        "paymentMethodId": "pm-chase-usd",
        "paymentMethodName": "Chase Sapphire Reserve",
        "paymentMethodCurrency": "USD",
        "amountSpent": 55.00,
        "percentage": 27.5,
        "transactionCount": 2,
        "color": "#3B82F6"
      }
    ]
  }
}
```

### Validation Checklist:
- [ ] Legacy transactions grouped separately
- [ ] paymentMethodId is null for legacy
- [ ] Legacy uses gray color (#6B7280)
- [ ] Legacy currency matches user base currency
- [ ] Both groups appear in breakdown

---

## Test Scenario 4: Empty Budget (No Transactions)

### Setup:
- User base currency: USD
- Budget: $400 for "Gifts" category (December 2024)
- No transactions in period

### Expected Response:
```json
{
  "success": true,
  "data": {
    "budget": {
      "id": "budget-gifts-dec",
      "name": "Gifts",
      "amount": 400.00,
      "currency": "USD",
      "period": "2024-12-01",
      "categoryId": "cat-gifts-id",
      "tagId": null
    },
    "totalSpent": 0,
    "breakdown": []
  }
}
```

### Validation Checklist:
- [ ] totalSpent is 0
- [ ] breakdown is empty array
- [ ] No errors thrown
- [ ] Budget info still returned

---

## Test Scenario 5: Overspent Budget

### Setup:
- User base currency: USD
- Budget: $100 for "Food" category (December 2024)
- Overspending across multiple payment methods

### Transactions:
```
Date       | Amount (Native) | Payment Method | Converted (USD)
-----------|-----------------|----------------|----------------
2024-12-05 | $60.00 USD      | Visa           | $60.00
2024-12-10 | €50.00 EUR      | Revolut EUR    | $54.35
2024-12-15 | $40.00 USD      | Visa           | $40.00
```

### Expected Response:
```json
{
  "success": true,
  "data": {
    "budget": {
      "id": "budget-food-overspent",
      "name": "Food",
      "amount": 100.00,
      "currency": "USD",
      "period": "2024-12-01",
      "categoryId": "cat-food-id",
      "tagId": null
    },
    "totalSpent": 154.35,
    "breakdown": [
      {
        "paymentMethodId": "pm-visa-usd",
        "paymentMethodName": "Visa",
        "paymentMethodCurrency": "USD",
        "amountSpent": 100.00,
        "percentage": 100.0,
        "transactionCount": 2,
        "color": "#3B82F6"
      },
      {
        "paymentMethodId": "pm-revolut-eur",
        "paymentMethodName": "Revolut EUR",
        "paymentMethodCurrency": "EUR",
        "amountSpent": 54.35,
        "percentage": 54.35,
        "transactionCount": 1,
        "color": "#10B981"
      }
    ]
  }
}
```

### Validation Checklist:
- [ ] totalSpent > budget.amount
- [ ] Percentages can exceed 100%
- [ ] Sum of percentages = (totalSpent/amount)*100
- [ ] UI should highlight overspending

---

## Test Scenario 6: Single Payment Method

### Setup:
- User base currency: USD
- Budget: $250 for "Shopping" category (December 2024)
- All transactions from one payment method

### Transactions:
```
Date       | Amount    | Payment Method
-----------|-----------|---------------
2024-12-05 | $50.00    | Chase USD
2024-12-10 | $75.00    | Chase USD
2024-12-20 | $30.00    | Chase USD
```

### Expected Response:
```json
{
  "success": true,
  "data": {
    "budget": {
      "id": "budget-shopping-dec",
      "name": "Shopping",
      "amount": 250.00,
      "currency": "USD",
      "period": "2024-12-01",
      "categoryId": "cat-shopping-id",
      "tagId": null
    },
    "totalSpent": 155.00,
    "breakdown": [
      {
        "paymentMethodId": "pm-chase-usd",
        "paymentMethodName": "Chase Sapphire Reserve",
        "paymentMethodCurrency": "USD",
        "amountSpent": 155.00,
        "percentage": 62.0,
        "transactionCount": 3,
        "color": "#3B82F6"
      }
    ]
  }
}
```

### Validation Checklist:
- [ ] Single item in breakdown array
- [ ] Transaction count = 3
- [ ] Percentage calculated correctly
- [ ] No errors with single payment method

---

## Test Scenario 7: Error Cases

### Test 7a: Invalid Budget ID
```typescript
const result = await getBudgetBreakdownByPaymentMethod({
  budgetId: "invalid-uuid"
});
// Expected: { success: false, error: "Invalid UUID format" }
```

### Test 7b: Budget Not Found
```typescript
const result = await getBudgetBreakdownByPaymentMethod({
  budgetId: "00000000-0000-0000-0000-000000000000"
});
// Expected: { success: false, error: "Budget not found." }
```

### Test 7c: Unauthorized Access
```typescript
// Try to access another user's budget
const result = await getBudgetBreakdownByPaymentMethod({
  budgetId: "other-users-budget-id"
});
// Expected: { success: false, error: "Budget not found." }
// (RLS prevents access, returns not found)
```

### Test 7d: Not Logged In
```typescript
// Without authentication
const result = await getBudgetBreakdownByPaymentMethod({
  budgetId: "some-budget-id"
});
// Expected: { success: false, error: "Unauthorized. Please log in to view budget breakdown." }
```

---

## Manual Testing Checklist

### Setup Phase:
- [ ] Create test user account
- [ ] Set user base currency (USD)
- [ ] Create payment methods (USD, EUR, UAH)
- [ ] Create categories (Food, Transport, Entertainment)
- [ ] Create tags (#travel, #work)
- [ ] Create budgets for December 2024

### Test Phase:
- [ ] Run Scenario 1: Multi-currency category budget
- [ ] Run Scenario 2: Tag budget with mixed currencies
- [ ] Run Scenario 3: Budget with legacy transactions
- [ ] Run Scenario 4: Empty budget (no transactions)
- [ ] Run Scenario 5: Overspent budget
- [ ] Run Scenario 6: Single payment method
- [ ] Run Scenario 7: Error cases

### Validation Phase:
- [ ] Check all amounts in base currency
- [ ] Verify percentages calculated correctly
- [ ] Confirm sorting (highest to lowest)
- [ ] Validate legacy transaction handling
- [ ] Test RLS isolation (user A can't see user B's data)
- [ ] Verify tag junction table queries
- [ ] Check period date filtering

---

## Performance Testing

### Test with Large Dataset:
```typescript
// Create budget with 1000 transactions across 10 payment methods
// Expected: Response < 2 seconds
// Breakdown should have 10 items (grouped correctly)
```

### Validation:
- [ ] Query uses proper indexes
- [ ] Grouping done efficiently
- [ ] No N+1 query problems
- [ ] Response time acceptable

---

## Integration Testing

### Test with Existing Features:
- [ ] Budget progress view matches breakdown totals
- [ ] Payment method balances consistent
- [ ] Transaction creation updates breakdown
- [ ] Budget deletion removes breakdown data
- [ ] Currency changes handled correctly

---

## Edge Case Testing

- [ ] Budget amount = 0 (division by zero)
- [ ] Very large amounts (> $1M)
- [ ] Very small amounts (< $0.01)
- [ ] Negative percentages (shouldn't happen)
- [ ] Transaction exactly on period boundary
- [ ] Transaction before period start (excluded)
- [ ] Transaction after period end (excluded)

---

## Success Criteria

All test scenarios should:
1. Return correct data structure
2. Calculate amounts accurately
3. Handle errors gracefully
4. Respect RLS policies
5. Perform efficiently
6. Sort data correctly
7. Handle legacy transactions
8. Support both category and tag budgets

---

## Test Data Setup Script

```sql
-- Create test budget
INSERT INTO budgets (user_id, amount, period, category_id)
VALUES (auth.uid(), 500.00, '2024-12-01', '<category-id>');

-- Create test transactions
INSERT INTO transactions (user_id, category_id, amount, date, type, payment_method_id, native_amount, exchange_rate, base_currency)
VALUES
  (auth.uid(), '<category-id>', 50.00, '2024-12-05', 'expense', '<pm-usd-id>', 50.00, 1.0, 'USD'),
  (auth.uid(), '<category-id>', 21.74, '2024-12-10', 'expense', '<pm-eur-id>', 20.00, 1.087, 'USD'),
  (auth.uid(), '<category-id>', 75.00, '2024-12-15', 'expense', '<pm-usd-id>', 75.00, 1.0, 'USD');
```

---

## Debugging Tips

If tests fail, check:
1. User authentication state
2. Budget belongs to correct user
3. Transactions have correct type ('expense')
4. Transactions within period date range
5. Payment method IDs match
6. Exchange rates applied correctly
7. RLS policies enabled
8. Database indexes exist

---

## Next Steps After Testing

1. Document any bugs found
2. Create bug fix tickets if needed
3. Update test cases for edge cases
4. Provide feedback to Backend Developer
5. Begin Frontend implementation
6. Create UI components for visualization
7. Add loading states
8. Handle error messages
9. Test with real user data
10. Deploy to staging environment
