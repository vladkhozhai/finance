# BUG_CARD7_001: Budget Cards Not Keyboard Focusable

**Reported By:** QA Engineer (Agent 05)
**Date:** 2025-12-17
**Severity:** P2 (Medium) - Accessibility Issue
**Status:** New
**Assigned To:** Frontend Developer (Agent 04)

---

## Summary

Budget cards wrapped in `TooltipTrigger` are not keyboard focusable, preventing keyboard-only users from accessing tooltip content and creating an accessibility barrier.

---

## Steps to Reproduce

1. Navigate to http://localhost:3000/budgets
2. Press `Tab` key repeatedly to navigate through page elements
3. Observe that budget cards are skipped in tab order
4. Tooltips cannot be triggered via keyboard

---

## Expected Behavior

- Budget cards should be in the keyboard tab order
- Pressing `Tab` should focus on budget cards
- Focused cards should display tooltips automatically
- Users should be able to access tooltip content via keyboard (WCAG 2.1 Level AA requirement)

---

## Actual Behavior

- Budget cards have no `tabIndex` attribute
- Cards are not focusable via keyboard
- Tab navigation skips over budget cards entirely
- Tooltips only work with mouse hover

---

## Technical Details

**Affected Component:** `/src/components/budgets/budget-card.tsx`

**Current Code (Line 77-82):**
```typescript
<Card
  className={cn(
    "cursor-help transition-shadow hover:shadow-md",
    isOverBudget && "border-red-200 bg-red-50/50",
  )}
>
```

**Root Cause:**
The `Card` component wrapped in `TooltipTrigger asChild` does not have a `tabIndex` prop set. While Radix UI's Tooltip component supports keyboard accessibility, the underlying trigger element (Card) needs to be focusable.

---

## Suggested Fix

Add `tabIndex={0}` to the Card component:

```typescript
<Card
  tabIndex={0}  // Add this line
  className={cn(
    "cursor-help transition-shadow hover:shadow-md",
    isOverBudget && "border-red-200 bg-red-50/50",
  )}
>
```

**Alternative Fix (More Semantic):**
Wrap the card content in a `<button>` or add `role="button"` with proper ARIA attributes:

```typescript
<Card
  role="button"
  tabIndex={0}
  aria-label={`${targetName} budget for ${formatPeriod(budget.period)}, ${budget.spent_percentage.toFixed(1)}% used`}
  className={cn(
    "cursor-help transition-shadow hover:shadow-md",
    isOverBudget && "border-red-200 bg-red-50/50",
  )}
>
```

---

## Testing Instructions

After fix is applied:

1. Navigate to http://localhost:3000/budgets
2. Press `Tab` key to navigate through elements
3. Verify budget cards receive focus (visible focus ring)
4. When card is focused, verify tooltip appears
5. Press `Tab` again to move to next card
6. Verify tooltip on previous card disappears
7. Test with screen reader (NVDA/JAWS/VoiceOver) to ensure proper announcement

---

## Accessibility Impact

**Affected Users:**
- Keyboard-only users (cannot navigate with mouse)
- Screen reader users (cannot access tooltip information)
- Users with motor disabilities relying on keyboard navigation
- Users with visual impairments using keyboard-based zoom tools

**WCAG 2.1 Criteria:**
- **2.1.1 Keyboard (Level A):** All functionality must be operable through keyboard
- **2.4.7 Focus Visible (Level AA):** Keyboard focus indicator must be visible

---

## Priority Justification

**P2 (Medium) Severity Rationale:**
- Does NOT block core functionality (users can still view budget data on cards)
- Does create accessibility barrier for keyboard users
- Tooltip information is supplementary, not critical for core tasks
- Should be fixed in next sprint to maintain WCAG compliance
- NOT a release blocker for Card #7

**If this were P0/P1:**
- Would need to block release if tooltip data was ONLY available via tooltip
- Would be critical if budget cards themselves were not accessible

---

## Related Issues

None

---

## Additional Notes

**Code Quality Observation:**
The implementation uses Radix UI's Tooltip component correctly. The issue is simply that the trigger element needs explicit focus handling. This is a common gotcha when using `asChild` with non-interactive elements like `<div>` (Card is essentially a styled `<div>`).

**Documentation Reference:**
- [Radix UI Tooltip - Accessibility](https://www.radix-ui.com/primitives/docs/components/tooltip#accessibility)
- [WCAG 2.1 - Keyboard Accessible](https://www.w3.org/WAI/WCAG21/Understanding/keyboard)

---

## Sign-Off

**Reported By:** QA Engineer (Agent 05)
**Date:** 2025-12-17
**Verification Status:** Reproducible

---

*End of Bug Report*
