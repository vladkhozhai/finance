# Card #23: Budget Payment Method Breakdown - Frontend Quick Reference

## Component Location

```typescript
import { BudgetPaymentBreakdown } from "@/components/budgets/budget-payment-breakdown";
```

---

## Usage

### In Budget Card
```typescript
<BudgetPaymentBreakdown
  budgetId={budget.id}
  currency="$"
  defaultExpanded={false}
/>
```

### Props Interface
```typescript
interface BudgetPaymentBreakdownProps {
  budgetId: string;          // UUID of the budget
  currency: string;          // Display currency symbol (e.g., "$")
  defaultExpanded?: boolean; // Start expanded? Default: false
}
```

---

## Component Behavior

### Collapsed State (Default)
- Shows button: "View Payment Method Breakdown"
- No data loaded yet (lazy loading)
- Takes minimal space in card

### Expanded State
1. **Loading**: Spinner while fetching data
2. **Success**: Shows breakdown list with progress bars
3. **Empty**: "No transactions yet" message
4. **Error**: Error message with alert icon

---

## Visual Elements

### Breakdown Item Row
```
🔵 Chase Sapphire Reserve    $200.00  [40%]
████████████████░░░░░░░░░░░░
```

Components:
- **Colored Dot**: Payment method color from database
- **Name**: Payment method name (truncates if long)
- **Currency Badge**: Shows if different from base currency
- **Amount**: Spent in base currency
- **Percentage Badge**: Of total budget (red if >100%)
- **Progress Bar**: Visual indicator with payment method color

### Summary Banner
```
Total spent across 3 payment methods: $333.00
```

### Tooltip (on hover)
```
Chase Sapphire Reserve
──────────────────────
Currency:       USD
Amount Spent:   $200.00
Of Budget:      40.0%
Transactions:   5
```

---

## States Handled

### 1. Empty Budget
```typescript
{
  totalSpent: 0,
  breakdown: []
}
```
**Display**: "No transactions yet for this budget period"

### 2. Legacy Transactions
```typescript
{
  paymentMethodId: null,
  paymentMethodName: "Legacy Transactions",
  paymentMethodCurrency: "USD",
  color: "#6B7280"
}
```
**Display**: Gray row with note at bottom

### 3. Multi-Currency
```typescript
{
  paymentMethodName: "Revolut EUR",
  paymentMethodCurrency: "EUR",
  amountSpent: 109.00  // Already converted to USD
}
```
**Display**: EUR badge next to name, amount in base currency

### 4. Over-Contributing
```typescript
{
  percentage: 150.0  // > 100%
}
```
**Display**: Red destructive badge variant

---

## Integration Points

### Fetches Data Via
```typescript
import { getBudgetBreakdownByPaymentMethod } from "@/app/actions/budgets";

const result = await getBudgetBreakdownByPaymentMethod({ budgetId });
```

### Used In
- `/src/components/budgets/budget-card.tsx`
- Appears at bottom of card content
- After "remaining/overspent" message

### Exported From
- `/src/components/budgets/index.ts`

---

## Styling

### Colors
- **Payment Methods**: Use `color` field from database (inline style)
- **Legacy**: Gray `#6B7280`
- **Over Budget**: Red destructive variant
- **Borders**: `border-zinc-200` (light) / `border-zinc-800` (dark)

### Layout
- **Mobile**: Full width, single column
- **Tablet+**: Maintains same layout (in grid card)
- **Progress Bars**: 2px height, rounded

### Dark Mode
- All text colors have dark mode variants
- Borders adjusted for dark backgrounds
- Progress bars remain visible in dark mode

---

## Key Files

### Component
`/src/components/budgets/budget-payment-breakdown.tsx` (~340 lines)

### Integration
`/src/components/budgets/budget-card.tsx` (modified)

### Export
`/src/components/budgets/index.ts` (modified)

---

## Accessibility

- ✅ Keyboard navigable (button focusable)
- ✅ ARIA labels on icons
- ✅ Tooltip accessible via keyboard focus
- ✅ Screen reader friendly loading states
- ✅ Semantic HTML (`<button>`, `<div>`)

---

## Performance

- **Lazy Loading**: Data fetched only when expanded
- **Single Request**: One API call per budget
- **Cached**: Data stored in component state
- **Fast Collapse**: Instant (no API call)

---

## Example Response Data

```json
{
  "success": true,
  "data": {
    "budget": {
      "id": "abc-123",
      "name": "Food Budget",
      "amount": 500.00,
      "currency": "USD",
      "period": "2024-12-01"
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
      }
    ]
  }
}
```

---

## Testing

### Manual Tests
1. Click "View Payment Method Breakdown" button
2. Verify loading spinner appears
3. Confirm breakdown displays correctly
4. Hover over items to see tooltips
5. Click collapse to hide
6. Test with empty budget (no transactions)
7. Test with multi-currency budget
8. Test with legacy transactions

### Edge Cases
- Budget with 0 transactions
- Budget with only legacy transactions
- Budget with 10+ payment methods
- Over-spent budget (>100%)
- Foreign currency payment methods
- Very long payment method names

---

## Quick Troubleshooting

### Breakdown not loading?
- Check budget ID is valid UUID
- Verify user is authenticated
- Check network tab for API errors
- Review Server Action response

### Colors not showing?
- Confirm payment methods have `color` field set
- Check inline style is applied: `style={{ backgroundColor: color }}`
- Verify color is valid hex code

### Tooltip not appearing?
- Ensure TooltipProvider wraps component
- Check tooltip content is not empty
- Verify hover/focus events work

### Empty state always shows?
- Check if budget has transactions in current period
- Verify date filtering in Server Action
- Confirm transactions have `payment_method_id`

---

## Quick Customization

### Change default expanded state:
```typescript
<BudgetPaymentBreakdown
  defaultExpanded={true}  // ← Start expanded
/>
```

### Adjust progress bar height:
```typescript
// In budget-payment-breakdown.tsx, line ~120:
<div className="relative h-3 ...">  // ← Change h-2 to h-3
```

### Modify summary text:
```typescript
// In budget-payment-breakdown.tsx, line ~180:
<span className="text-muted-foreground">
  Total spent across {breakdown.breakdown.length} payment methods
</span>
```

---

## Dependencies

### Shadcn/UI Components
- `Badge` - Currency and percentage indicators
- `Button` - Expand/collapse action
- `Card`, `CardContent` - Structural layout
- `Tooltip` - Hover details

### Icons (Lucide React)
- `CreditCard` - Section icon
- `ChevronDown` / `ChevronUp` - Expand/collapse
- `Loader2` - Loading spinner
- `AlertCircle` - Error icon
- `DollarSign` - Empty state icon

### Utilities
- `cn` from `@/lib/utils` - Class name merging

---

## Related Documentation

- **Backend API**: `/CARD_23_BACKEND_SUMMARY.md`
- **Server Action**: `/CARD_23_QUICK_REFERENCE.md` (backend)
- **Full Implementation**: `/CARD_23_FRONTEND_SUMMARY.md`

---

## Summary

**Component**: `BudgetPaymentBreakdown`
**Purpose**: Show how payment methods contribute to budget spending
**Type**: Client Component (`"use client"`)
**Location**: Integrated into budget cards
**State**: Collapsible, lazy-loaded
**Data**: Fetched via `getBudgetBreakdownByPaymentMethod` Server Action

**Status**: ✅ Production Ready
