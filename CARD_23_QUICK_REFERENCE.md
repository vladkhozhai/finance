# Card #23: Budget Breakdown by Payment Method - Quick Reference

## Server Action Signature

```typescript
import { getBudgetBreakdownByPaymentMethod } from "@/app/actions/budgets";

// Call the action
const result = await getBudgetBreakdownByPaymentMethod({
  budgetId: string
});
```

---

## Response Type

```typescript
type Result =
  | { success: true; data: BudgetBreakdownResponse }
  | { success: false; error: string }

interface BudgetBreakdownResponse {
  budget: {
    id: string;
    name: string;              // "Food Budget" or "#travel"
    amount: number;            // 500.00
    currency: string;          // "USD"
    period: string;            // "2024-12-01"
    categoryId: string | null;
    tagId: string | null;
  };
  totalSpent: number;          // 333.00 (in base currency)
  breakdown: BudgetBreakdownItem[];
}

interface BudgetBreakdownItem {
  paymentMethodId: string | null;     // null for legacy
  paymentMethodName: string;          // "Chase Sapphire Reserve"
  paymentMethodCurrency: string;      // "USD"
  amountSpent: number;                // 200.00 (in base currency!)
  percentage: number;                 // 40.0
  transactionCount: number;           // 5
  color: string;                      // "#3B82F6"
}
```

---

## Example Response

```json
{
  "success": true,
  "data": {
    "budget": {
      "id": "abc-123",
      "name": "Food Budget",
      "amount": 500.00,
      "currency": "USD",
      "period": "2024-12-01",
      "categoryId": "food-id",
      "tagId": null
    },
    "totalSpent": 333.00,
    "breakdown": [
      {
        "paymentMethodId": "pm-1",
        "paymentMethodName": "Chase Sapphire Reserve",
        "paymentMethodCurrency": "USD",
        "amountSpent": 200.00,
        "percentage": 40.0,
        "transactionCount": 5,
        "color": "#3B82F6"
      },
      {
        "paymentMethodId": "pm-2",
        "paymentMethodName": "Revolut EUR",
        "paymentMethodCurrency": "EUR",
        "amountSpent": 109.00,
        "percentage": 21.8,
        "transactionCount": 3,
        "color": "#10B981"
      },
      {
        "paymentMethodId": null,
        "paymentMethodName": "Legacy Transactions",
        "paymentMethodCurrency": "USD",
        "amountSpent": 24.00,
        "percentage": 4.8,
        "transactionCount": 2,
        "color": "#6B7280"
      }
    ]
  }
}
```

---

## Key Features

1. **All amounts in base currency** - No conversion needed in frontend
2. **Pre-calculated percentages** - Just display them
3. **Sorted by amount** - Highest spending first
4. **Legacy support** - Old transactions show as "Legacy Transactions"
5. **Color-coded** - Use `color` field for visualization
6. **Transaction count** - Show in tooltips or details

---

## Frontend Example

```typescript
"use client";

export function BudgetBreakdownCard({ budgetId }: { budgetId: string }) {
  const [data, setData] = useState<BudgetBreakdownResponse | null>(null);

  useEffect(() => {
    async function load() {
      const result = await getBudgetBreakdownByPaymentMethod({ budgetId });
      if (result.success) {
        setData(result.data);
      }
    }
    load();
  }, [budgetId]);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h3>{data.budget.name}</h3>
      <p>
        {data.budget.currency} {data.totalSpent.toFixed(2)} / {data.budget.amount.toFixed(2)}
      </p>

      {data.breakdown.map(item => (
        <div key={item.paymentMethodId || 'legacy'}>
          <span style={{ color: item.color }}>●</span>
          <span>{item.paymentMethodName}</span>
          <span>{data.budget.currency} {item.amountSpent.toFixed(2)}</span>
          <span>({item.percentage.toFixed(1)}%)</span>
          <span>{item.transactionCount} transactions</span>
        </div>
      ))}
    </div>
  );
}
```

---

## Visualization Ideas

### Pie Chart
```typescript
<PieChart>
  {data.breakdown.map(item => (
    <Cell
      value={item.percentage}
      color={item.color}
      label={item.paymentMethodName}
    />
  ))}
</PieChart>
```

### Stacked Progress Bar
```typescript
<div style={{ display: 'flex', width: '100%' }}>
  {data.breakdown.map(item => (
    <div
      style={{
        width: `${item.percentage}%`,
        backgroundColor: item.color
      }}
      title={`${item.paymentMethodName}: ${item.amountSpent}`}
    />
  ))}
</div>
```

### Table
```typescript
<table>
  <thead>
    <tr>
      <th>Payment Method</th>
      <th>Amount</th>
      <th>% of Budget</th>
      <th>Transactions</th>
    </tr>
  </thead>
  <tbody>
    {data.breakdown.map(item => (
      <tr key={item.paymentMethodId || 'legacy'}>
        <td>
          <span style={{ color: item.color }}>●</span>
          {item.paymentMethodName}
        </td>
        <td>{data.budget.currency} {item.amountSpent.toFixed(2)}</td>
        <td>{item.percentage.toFixed(1)}%</td>
        <td>{item.transactionCount}</td>
      </tr>
    ))}
  </tbody>
</table>
```

---

## Edge Cases

### No Transactions
```json
{
  "totalSpent": 0,
  "breakdown": []
}
```

### Only Legacy Transactions
```json
{
  "breakdown": [
    {
      "paymentMethodId": null,
      "paymentMethodName": "Legacy Transactions",
      "paymentMethodCurrency": "USD",
      "amountSpent": 150.00,
      "percentage": 30.0,
      "transactionCount": 8,
      "color": "#6B7280"
    }
  ]
}
```

### Overspent Budget
```json
{
  "budget": { "amount": 100.00 },
  "totalSpent": 150.00,
  "breakdown": [
    {
      "amountSpent": 150.00,
      "percentage": 150.0  // > 100%!
    }
  ]
}
```

---

## Error Handling

```typescript
const result = await getBudgetBreakdownByPaymentMethod({ budgetId });

if (!result.success) {
  // Show error message
  toast.error(result.error);
  return;
}

// Use result.data
```

---

## Important Notes

1. **Currency Conversion Already Done** - `amountSpent` is already in user's base currency
2. **No Native Amounts** - This action uses converted amounts only
3. **Sorted Data** - Breakdown is pre-sorted by amount (highest first)
4. **RLS Protected** - User can only see their own budget data
5. **Tag Budgets Work** - Handles both category and tag budgets correctly

---

## Testing

```typescript
// Test with multi-currency budget
const result = await getBudgetBreakdownByPaymentMethod({
  budgetId: "your-budget-id"
});

console.log("Total spent:", result.data.totalSpent);
console.log("Breakdown items:", result.data.breakdown.length);
console.log("First payment method:", result.data.breakdown[0].paymentMethodName);
```

---

## Files

- **Server Action**: `/src/app/actions/budgets.ts`
- **Validation**: `/src/lib/validations/budget.ts`
- **Documentation**: `/CARD_23_BACKEND_SUMMARY.md`
