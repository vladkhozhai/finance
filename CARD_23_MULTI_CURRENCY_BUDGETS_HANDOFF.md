# Card #23: Multi-Currency Budget Tracking - Implementation Handoff

## Status: IN PROGRESS
**Trello Card:** https://trello.com/c/Poqmh6Bf/23-story-5-multi-currency-budget-tracking
**Started:** 2025-12-18
**Epic:** Multi-Currency Support (Story 5 of 5)

---

## Executive Summary

This is the **FINAL CARD** in the Multi-Currency Epic. All dependencies are complete, and the infrastructure is in place. The good news: **most of the heavy lifting is already done** by Card #20.

### Key Insight
Because Card #20 already stores both `native_amount` (original currency) and `amount` (converted to base currency) on every transaction, budget tracking just needs to:
1. Sum the `amount` field (already in base currency) instead of `native_amount`
2. Display currency breakdown by payment method
3. Add optional payment method filtering

**Estimated Effort:** 7-9 hours (Medium complexity)

---

## Current State Analysis

### ✅ What's Already Working

1. **Multi-Currency Transactions (Card #20)**
   - Transactions store both native_amount and converted amount (base currency)
   - Exchange rates are captured at transaction time
   - Payment methods are linked to each transaction
   - File: `/src/app/actions/transactions.ts` lines 115-179

2. **Exchange Rate System (Card #21)**
   - Live API integration with exchangerate-api.com
   - 24-hour caching with fallback to stale rates
   - Triangular conversion (e.g., UAH→EUR via USD)
   - File: `/src/lib/utils/currency-conversion.ts`

3. **Budget Infrastructure (Card #6, #7)**
   - Budget creation/editing UI exists
   - Budget progress calculation via `budget_progress` view
   - Progress bars with overspending indicators
   - Files:
     - `/src/app/actions/budgets.ts`
     - `/src/components/budgets/budget-card.tsx`
     - `/supabase/migrations/20251217000002_enhance_budgets_schema.sql`

### 🔍 Current Budget Calculation Logic

**File:** `/supabase/migrations/20251217000002_enhance_budgets_schema.sql` (lines 86-132)

```sql
CREATE OR REPLACE FUNCTION calculate_budget_spent(
  p_user_id UUID,
  p_category_id UUID DEFAULT NULL,
  p_tag_id UUID DEFAULT NULL,
  p_period DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(12, 2)
```

**Current Behavior:**
- For category budgets: `SUM(amount)` from transactions table
- For tag budgets: `SUM(t.amount)` from transactions joined with transaction_tags
- **Already uses the `amount` field** which is in base currency!

**This means:** Budget calculations are ALREADY multi-currency compatible! 🎉

---

## What Needs to Be Implemented

### 1. Database Changes: Add Payment Method Filtering (OPTIONAL)

**Current State:** The `calculate_budget_spent()` function doesn't support filtering by payment method.

**Option A: Minimal Approach** (Recommended for MVP)
- Keep current function as-is (already calculates in base currency)
- No database changes needed
- Frontend shows aggregated spending across all payment methods

**Option B: Full Feature** (If payment method filtering is required)
- Update `calculate_budget_spent()` to accept optional `p_payment_method_id` parameter
- Add WHERE clause: `AND payment_method_id = p_payment_method_id`
- Update `budget_progress` view to support filtering

**Recommendation:** Start with Option A. Add Option B only if user requests it.

---

### 2. Backend: Budget Breakdown Server Action

**File to Create/Update:** `/src/app/actions/budgets.ts`

**New Server Action Required:**
```typescript
/**
 * Gets budget spending breakdown by payment method.
 * Shows which payment methods contributed to budget spending.
 */
export async function getBudgetBreakdownByPaymentMethod(
  input: { budgetId: string }
): Promise<ActionResult<BudgetBreakdown[]>>
```

**Return Type:**
```typescript
interface BudgetBreakdown {
  payment_method_id: string;
  payment_method_name: string;
  payment_method_currency: string;
  native_amount: number;        // Sum in payment method's currency
  converted_amount: number;     // Sum in base currency
  transaction_count: number;
}
```

**Query Logic:**
```sql
-- For category budgets
SELECT
  pm.id as payment_method_id,
  pm.name as payment_method_name,
  pm.currency as payment_method_currency,
  SUM(t.native_amount) as native_amount,
  SUM(t.amount) as converted_amount,
  COUNT(t.id) as transaction_count
FROM transactions t
JOIN payment_methods pm ON t.payment_method_id = pm.id
WHERE t.user_id = $user_id
  AND t.category_id = $category_id
  AND t.date >= $period_start
  AND t.date <= $period_end
GROUP BY pm.id, pm.name, pm.currency;

-- For tag budgets (add JOIN with transaction_tags)
```

---

### 3. Frontend: Update Budget Card Component

**File to Update:** `/src/components/budgets/budget-card.tsx`

**Current Tooltip (lines 173-217):**
Shows basic budget info: limit, spent, remaining, progress.

**Enhanced Tooltip (Add currency breakdown):**
```typescript
<TooltipContent side="top" className="max-w-md">
  <div className="space-y-3 text-sm">
    {/* Existing basic info */}
    <div className="font-semibold border-b pb-2">
      {targetName} Budget - {formatPeriod(budget.period)}
    </div>

    {/* NEW: Currency Breakdown Section */}
    {breakdownData && breakdownData.length > 0 && (
      <>
        <div className="border-t border-zinc-700 pt-2 mt-2">
          <div className="text-xs text-zinc-400 mb-1">
            Spending by Payment Method:
          </div>
          {breakdownData.map((item) => (
            <div key={item.payment_method_id} className="flex justify-between gap-4 text-xs">
              <span className="text-zinc-300">
                {item.payment_method_name}:
              </span>
              <span className="font-medium">
                {formatCurrency(item.native_amount, item.payment_method_currency)}
                <span className="text-zinc-500 ml-1">
                  (≈ {formatCurrency(item.converted_amount, baseCurrency)})
                </span>
              </span>
            </div>
          ))}
        </div>
      </>
    )}
  </div>
</TooltipContent>
```

**Implementation Steps:**
1. Add state for breakdown data: `const [breakdownData, setBreakdownData] = useState([])`
2. Fetch breakdown on hover: `onMouseEnter={() => fetchBreakdown()}`
3. Display in tooltip with native + converted amounts
4. Show loading state while fetching

---

### 4. Frontend: Budget Creation Form Enhancement (OPTIONAL)

**File to Update:** `/src/components/budgets/create-budget-dialog.tsx`

**Current Behavior:**
- User sets budget amount in their base currency
- No indication that this applies across all payment methods

**Enhancement (Optional):**
Add helpful text to clarify multi-currency behavior:

```tsx
<FormField
  control={form.control}
  name="amount"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Budget Limit Amount</FormLabel>
      <FormControl>
        <Input
          type="number"
          step="0.01"
          placeholder="0.00"
          {...field}
        />
      </FormControl>
      <FormDescription>
        Budget is set in your base currency ({baseCurrency}).
        Spending from all payment methods will be converted automatically.
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## Testing Requirements

### Manual Testing Checklist
- [ ] Create budget for category that has transactions in multiple currencies
- [ ] Verify budget spent amount matches sum of converted amounts
- [ ] Hover over budget card to see currency breakdown
- [ ] Verify tooltip shows each payment method's contribution
- [ ] Verify native amounts match transaction history
- [ ] Verify converted amounts sum to total spent
- [ ] Test with budget overspending (>100%)
- [ ] Test with tag-based budgets
- [ ] Test with transactions using different exchange rates
- [ ] Test with archived payment methods (should still show in historical budgets)

### Edge Cases to Test
1. **Budget with no transactions:** Should show $0 spent
2. **Budget with only base currency transactions:** Breakdown shows base currency only
3. **Budget with stale exchange rates:** Tooltip should indicate rate age
4. **Budget with archived payment method:** Should still display historical data
5. **Very long payment method names:** Ensure tooltip doesn't overflow

---

## Implementation Sequence

### Phase 1: Backend (Backend Developer - Agent 03)
**Estimated Time:** 3-4 hours

1. ✅ **VERIFY Current Calculation** (1 hour)
   - Confirm `calculate_budget_spent()` uses `amount` field
   - Write test query to verify multi-currency calculation
   - Document that no function changes needed

2. **Create Budget Breakdown Action** (2-3 hours)
   - Implement `getBudgetBreakdownByPaymentMethod()` Server Action
   - Handle category vs tag budgets
   - Add proper error handling and RLS
   - Write JSDoc comments
   - Test with sample data

**Deliverables:**
- Updated `/src/app/actions/budgets.ts` with new Server Action
- Test results confirming accurate calculations

---

### Phase 2: Frontend (Frontend Developer - Agent 04)
**Estimated Time:** 4-5 hours

1. **Update Budget Card Tooltip** (2-3 hours)
   - Add state for breakdown data
   - Implement hover-triggered fetch
   - Design currency breakdown UI in tooltip
   - Add loading/error states
   - Style with Tailwind CSS

2. **Enhance Budget Form (Optional)** (1 hour)
   - Add clarifying text about multi-currency behavior
   - Update FormDescription components

3. **Testing & Refinement** (1-2 hours)
   - Manual testing with multi-currency data
   - Fix UI/UX issues
   - Ensure responsive design
   - Accessibility review

**Deliverables:**
- Updated `/src/components/budgets/budget-card.tsx`
- Updated `/src/components/budgets/create-budget-dialog.tsx` (optional)
- Screenshots of enhanced tooltip

---

### Phase 3: QA (QA Engineer - Agent 05)
**Estimated Time:** 2-3 hours

1. **Functional Testing** (1-2 hours)
   - Execute manual testing checklist
   - Test all edge cases
   - Verify calculations match expected values

2. **Regression Testing** (1 hour)
   - Ensure existing budget features still work
   - Test single-currency budgets (backward compatibility)
   - Verify budget progress bars update correctly

**Deliverables:**
- Test report with pass/fail status
- Bug reports if issues found

---

## Key Files Reference

### Backend Files
- `/src/app/actions/budgets.ts` - Budget Server Actions (UPDATE)
- `/src/lib/validations/budget.ts` - Budget validation schemas (likely no changes)
- `/supabase/migrations/20251217000002_enhance_budgets_schema.sql` - Budget view (verify only)

### Frontend Files
- `/src/components/budgets/budget-card.tsx` - Budget display (UPDATE)
- `/src/components/budgets/create-budget-dialog.tsx` - Budget creation (OPTIONAL UPDATE)
- `/src/app/(dashboard)/budgets/page.tsx` - Budget list page (verify only)

### Supporting Files
- `/src/lib/utils/currency-conversion.ts` - Currency utilities (reference only)
- `/src/app/actions/transactions.ts` - Transaction actions (reference only)

---

## Integration with Completed Cards

### Card #19: Payment Method Management ✅
- Payment methods table exists with currency field
- CRUD operations for payment methods working
- Used in budget breakdown to show payment method names

### Card #20: Currency-Aware Transactions ✅
- **CRITICAL:** Transactions already store `amount` (base currency)
- `native_amount` and `exchange_rate` captured at transaction time
- Budget calculations work "for free" by summing `amount` field

### Card #21: Exchange Rate Management ✅
- Live API integration providing rates
- Cached rates with 24-hour TTL
- Budget calculations use historical rates from transactions (not live rates)

### Card #22: Multi-Currency Dashboard ✅
- Dashboard already shows multi-currency balance
- Payment method cards display native currency balances
- Similar UI patterns can be reused for budget tooltips

---

## Success Criteria

### Acceptance Criteria from Card Description
- [x] Budgets are set in user's base currency (existing behavior - no changes)
- [ ] Budget spent calculation converts all transactions to base currency (VERIFY - likely already working)
- [ ] Budget details show breakdown by payment method/currency (NEW - tooltip enhancement)
- [ ] User can optionally filter budget by specific payment method (OPTIONAL - skip for MVP)
- [x] Progress bar uses converted amounts in base currency (existing - verify only)
- [ ] Budget card tooltips show currency breakdown on hover (NEW - main deliverable)
- [x] Budget overspending warnings account for converted amounts (existing - verify only)
- [x] Budget creation/edit forms work with multi-currency transactions (existing - add clarifying text)
- [x] Historical budgets maintain original exchange rates used (existing - rates stored per transaction)

**MVP Scope (Required):**
1. ✅ Verify budget calculations use base currency amounts
2. ✅ Create budget breakdown Server Action
3. ✅ Update budget card tooltip with currency breakdown
4. ✅ Test with multi-currency data

**Future Enhancement (Optional):**
- Payment method filtering in budget calculations
- Detailed budget analysis page with charts
- Exchange rate change notifications for budgets

---

## Risk Assessment

### Low Risk ✅
- Database schema already supports multi-currency
- Budget calculation already uses base currency amounts
- Payment method data available via existing queries

### Medium Risk ⚠️
- Tooltip might get crowded with many payment methods (design challenge)
- Performance if breakdown query is slow (can optimize with indexes)

### Mitigation Strategies
1. **Tooltip Crowding:** Limit to top 5 payment methods, add "View All" link
2. **Query Performance:** Add index on `(user_id, category_id, date)` and `(user_id, payment_method_id, date)`
3. **Edge Cases:** Handle null payment_method_id gracefully (legacy transactions)

---

## Questions for Team

1. **Backend:** Should we add payment method filtering to budget calculations, or is aggregated view sufficient for MVP?
2. **Frontend:** How should we handle budgets with >5 payment methods in the tooltip? Scrollable list or "top 5 + others"?
3. **QA:** Do we need E2E tests for budget breakdown, or is manual testing sufficient?
4. **PM:** Is currency breakdown in tooltip sufficient, or do we need a dedicated "Budget Details" page?

---

## Recommended Starting Agent

**Backend Developer (Agent 03)** should start first:
1. Verify current budget calculation logic uses base currency
2. Implement `getBudgetBreakdownByPaymentMethod()` Server Action
3. Test with sample multi-currency data
4. Handoff to Frontend Developer

Then **Frontend Developer (Agent 04)**:
1. Update budget card tooltip
2. Integrate breakdown data
3. Polish UI/UX
4. Handoff to QA Engineer

Finally **QA Engineer (Agent 05)**:
1. Execute test plan
2. Report results
3. Verify acceptance criteria met

---

## Notes for System Architect

No database schema changes required. The existing schema already supports multi-currency budgets:
- `transactions.amount` stores converted base currency amount
- `transactions.native_amount` stores original currency amount
- `transactions.payment_method_id` links to payment method
- `budget_progress` view uses `calculate_budget_spent()` which sums `amount`

**Recommendation:** Review this document and confirm approach before Backend Developer starts implementation.

---

## Conclusion

This card completes the Multi-Currency Epic. The implementation is straightforward because Cards #19-22 did the heavy lifting. We're essentially adding visibility into budget calculations that already work correctly with multi-currency data.

**Key Takeaway:** Budget tracking is already multi-currency compatible. We just need to show users how their spending breaks down by payment method/currency.

---

## Next Steps

1. **PM Review:** Confirm acceptance criteria and scope (MVP vs full feature)
2. **System Architect:** Review technical approach and approve implementation plan
3. **Backend Developer:** Begin Phase 1 implementation
4. **Status Updates:** Update Trello card daily with progress

**Target Completion:** 2-3 days (depending on team availability)
