# Card #23: Multi-Currency Budget Tracking - Executive Summary

## Overview
**Card #23** is the final story in the Multi-Currency Support Epic. This card enables budgets to work seamlessly with transactions in multiple currencies by showing spending breakdowns by payment method.

**Status:** IN PROGRESS
**Trello:** https://trello.com/c/Poqmh6Bf/23-story-5-multi-currency-budget-tracking
**Effort Estimate:** 7-9 hours
**Complexity:** Medium

---

## The Big Win

**Budget calculations ALREADY work with multi-currency transactions!**

Because Card #20 stores both `native_amount` (original currency) and `amount` (converted to base currency) on every transaction, the existing `calculate_budget_spent()` function already sums the converted amounts correctly.

**This means:** We're not fixing broken functionality—we're adding visibility into calculations that already work correctly.

---

## What This Card Delivers

### User-Facing Features
1. **Currency Breakdown in Budget Tooltips**
   - Hover over any budget card to see spending by payment method
   - Each line shows: Payment method name, native amount, converted amount
   - Example: "Monobank USD: $250.00 (≈ ₴10,250.00)"

2. **Clarified Budget Creation**
   - Budget form explains that limits are set in base currency
   - Automatic conversion from all payment methods

3. **Accurate Multi-Currency Tracking**
   - Budgets track spending across all currencies
   - Historical exchange rates preserved per transaction
   - Overspending warnings account for currency conversion

### Technical Implementation
1. **Backend:** New Server Action `getBudgetBreakdownByPaymentMethod()`
2. **Frontend:** Enhanced budget card tooltip with currency breakdown UI
3. **Database:** No changes required (existing schema supports everything)

---

## Implementation Plan

### Phase 1: Backend (3-4 hours)
**Owner:** Backend Developer (Agent 03)

**Tasks:**
1. Verify current budget calculation uses base currency amounts (1 hour)
2. Create `getBudgetBreakdownByPaymentMethod()` Server Action (2-3 hours)
   - Query transactions grouped by payment method
   - Calculate native and converted totals
   - Handle category vs tag budgets
   - Add RLS and error handling

**Deliverable:** Working Server Action that returns spending breakdown

---

### Phase 2: Frontend (4-5 hours)
**Owner:** Frontend Developer (Agent 04)

**Tasks:**
1. Update budget card tooltip component (2-3 hours)
   - Add state for breakdown data
   - Implement hover-triggered fetch
   - Design currency breakdown UI
   - Add loading/error states

2. Enhance budget creation form (1 hour, optional)
   - Add clarifying text about multi-currency behavior

3. Testing and polish (1-2 hours)
   - Manual testing with multi-currency data
   - UI/UX refinements
   - Responsive design verification

**Deliverable:** Enhanced budget cards with currency breakdown tooltips

---

### Phase 3: QA (2-3 hours)
**Owner:** QA Engineer (Agent 05)

**Tasks:**
1. Functional testing (1-2 hours)
   - Test budget calculations with multiple currencies
   - Verify tooltip displays correct data
   - Test edge cases (no transactions, archived payment methods, etc.)

2. Regression testing (1 hour)
   - Ensure single-currency budgets still work
   - Verify budget progress bars update correctly
   - Test budget creation/editing flows

**Deliverable:** Test report with pass/fail status

---

## Key Files

### To Modify
- `/src/app/actions/budgets.ts` - Add breakdown Server Action
- `/src/components/budgets/budget-card.tsx` - Update tooltip UI
- `/src/components/budgets/create-budget-dialog.tsx` - Add clarifying text (optional)

### To Reference (No Changes)
- `/supabase/migrations/20251217000002_enhance_budgets_schema.sql` - Budget calculation logic
- `/src/lib/utils/currency-conversion.ts` - Currency utilities
- `/src/app/actions/transactions.ts` - Multi-currency transaction logic

---

## Dependencies Status

### ✅ Card #19: Payment Method Management (COMPLETED)
- Payment methods table with currency field exists
- CRUD operations working
- Used for displaying payment method names in breakdown

### ✅ Card #20: Currency-Aware Transactions (COMPLETED)
- **CRITICAL DEPENDENCY:** Transactions store both native and converted amounts
- Budget calculations work because of this foundation
- Exchange rates captured at transaction time

### ✅ Card #21: Exchange Rate Management (COMPLETED)
- Live API integration providing rates
- 24-hour caching with fallback
- Budget calculations use historical rates from transactions

### ✅ Card #22: Multi-Currency Dashboard (COMPLETED)
- Dashboard shows multi-currency balance
- Similar UI patterns can be reused for budget tooltips
- Payment method cards already exist

**All dependencies complete—ready to implement!**

---

## Acceptance Criteria Checklist

### MVP Scope (Required)
- [ ] Budgets are set in user's base currency (existing - verify)
- [ ] Budget spent calculation converts all transactions to base currency (existing - verify)
- [ ] Budget card tooltips show currency breakdown on hover (NEW)
- [ ] Progress bar uses converted amounts in base currency (existing - verify)
- [ ] Budget overspending warnings account for converted amounts (existing - verify)
- [ ] Budget creation form clarifies amount is in base currency (NEW - optional)
- [ ] Historical budgets maintain original exchange rates (existing - verify)

### Future Enhancements (Optional)
- [ ] User can filter budget by specific payment method
- [ ] Budget details page with detailed breakdown
- [ ] Budget breakdown shows transaction count per payment method
- [ ] Exchange rate change notifications for budgets

---

## Risk Assessment

### Low Risk ✅
- Database schema already supports multi-currency
- Budget calculation logic already uses base currency
- All required data available via existing queries
- No breaking changes to existing features

### Medium Risk ⚠️
- Tooltip might get crowded with many payment methods
  - **Mitigation:** Limit to top 5, add "View All" link
- Breakdown query performance with many transactions
  - **Mitigation:** Add database indexes if needed

### High Risk ❌
- None identified

---

## Testing Strategy

### Manual Testing Focus
1. **Multi-Currency Budgets**
   - Create budget for category with transactions in USD, EUR, UAH
   - Verify total spent matches sum of converted amounts
   - Hover to see breakdown by payment method

2. **Edge Cases**
   - Budget with no transactions
   - Budget with single currency only
   - Budget with archived payment method
   - Budget with stale exchange rates

3. **Regression**
   - Single-currency budgets still work
   - Budget progress bars update correctly
   - Budget creation/editing flows unchanged

### Automated Testing (Future)
- E2E test for budget breakdown tooltip
- Unit tests for breakdown Server Action
- Integration tests for multi-currency calculations

---

## Success Metrics

### Definition of Done
1. ✅ Budget tooltips show currency breakdown by payment method
2. ✅ Breakdown displays both native and converted amounts
3. ✅ All acceptance criteria met
4. ✅ Manual testing completed with no critical bugs
5. ✅ Regression testing passed
6. ✅ Code reviewed and approved
7. ✅ Card moved to "Done" in Trello

### User Experience Goals
- Users understand how their budget spending breaks down by currency
- Users see transparency in currency conversions
- Users can trust budget calculations with multi-currency data
- Budget feature feels natural and intuitive with multiple currencies

---

## Communication Plan

### Daily Updates
- Backend Developer posts progress update in Trello card comment
- Frontend Developer shares screenshot of enhanced tooltip
- QA Engineer reports test results

### Handoff Points
1. Backend → Frontend: When Server Action is complete and tested
2. Frontend → QA: When UI is implemented and ready for testing
3. QA → PM: When testing is complete with pass/fail report

### Escalation
- If implementation takes >9 hours, escalate to PM for scope review
- If critical bugs found, escalate to System Architect for technical guidance

---

## Post-Implementation

### Documentation Updates
- [ ] Update PRD.md to mark multi-currency budgets as completed
- [ ] Add budget breakdown feature to user documentation
- [ ] Update ARCHITECTURE.md with new Server Action

### Future Enhancements
1. **Budget Details Page** - Dedicated page for detailed budget analysis
2. **Payment Method Filtering** - Filter budget calculations by specific payment method
3. **Budget Alerts** - Notifications when approaching limit or exchange rates change
4. **Budget Analytics** - Charts showing spending trends by currency over time

---

## Questions & Answers

**Q: Why don't we need to change the budget calculation function?**
A: Because Card #20 already stores the converted amount in the `amount` field. The `calculate_budget_spent()` function sums this field, so it's already calculating in base currency.

**Q: What if a user has 10+ payment methods?**
A: The tooltip will show the top 5 by spending amount, with a "and 5 more..." indicator. Future enhancement could add a "View All" link to a detailed page.

**Q: How do we handle transactions without a payment method (legacy data)?**
A: These transactions already have an `amount` in base currency, so they're included in the total. The breakdown will show "5 transactions without payment method" if applicable.

**Q: Do we need database indexes for the breakdown query?**
A: Current indexes on `user_id` and `category_id` should be sufficient for MVP. If performance issues arise, we can add composite indexes on `(user_id, category_id, date)` and `(user_id, payment_method_id, date)`.

---

## Conclusion

Card #23 completes the Multi-Currency Epic by adding visibility into budget calculations that already work correctly. The implementation is straightforward because the heavy lifting was done in Cards #19-22.

**Timeline:** 2-3 days (depending on team availability)
**Risk Level:** Low
**User Value:** High (transparency in multi-currency budgets)

**Ready to begin implementation with Backend Developer (Agent 03).**

---

## Resources

- **Full Handoff Document:** `/CARD_23_MULTI_CURRENCY_BUDGETS_HANDOFF.md`
- **Trello Card:** https://trello.com/c/Poqmh6Bf/23-story-5-multi-currency-budget-tracking
- **PRD Reference:** `/PRD.md` (section 3.5 - Multi-Currency Support)
- **Architecture:** `/ARCHITECTURE.md` (budget system design)
