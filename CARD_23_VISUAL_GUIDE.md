# Card #23: Budget Payment Method Breakdown - Visual Guide

## Component Preview

### 1. Collapsed State (Initial View)

```
┌────────────────────────────────────────────────────┐
│  🟢 Food Budget                          ⋮         │
│  January 2025                                      │
│                                                    │
│  $333.00 of $500.00              [category badge] │
│  ████████████████░░░░░░░░░░░ 66.6%                │
│  $167.00 remaining                                 │
│                                                    │
│  ┌────────────────────────────────────────────┐   │
│  │ 💳 View Payment Method Breakdown      ▼   │   │
│  └────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
         ↑
    Clickable button
```

**Features**:
- Takes minimal space when collapsed
- Button has credit card icon
- Chevron down indicates expandable
- No data loaded yet (lazy loading)

---

### 2. Loading State

```
┌────────────────────────────────────────────────────┐
│  🟢 Food Budget                          ⋮         │
│  January 2025                                      │
│                                                    │
│  $333.00 of $500.00              [category badge] │
│  ████████████████░░░░░░░░░░░ 66.6%                │
│  $167.00 remaining                                 │
│  ─────────────────────────────────────────────     │
│  💳 Payment Method Breakdown             ▲         │
│                                                    │
│              🔄 Loading...                         │
│            (spinner animation)                     │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Features**:
- Animated spinner icon
- "Loading..." text
- Collapse button still visible

---

### 3. Expanded State (With Multi-Currency Data)

```
┌────────────────────────────────────────────────────┐
│  🟢 Food Budget                          ⋮         │
│  January 2025                                      │
│                                                    │
│  $333.00 of $500.00              [category badge] │
│  ████████████████░░░░░░░░░░░ 66.6%                │
│  $167.00 remaining                                 │
│  ─────────────────────────────────────────────     │
│  💳 Payment Method Breakdown             ▲         │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ Total spent across 3 payment methods:        │ │
│  │ $333.00                                      │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  🔵 Chase Sapphire Reserve   $200.00    [40.0%]   │
│  ████████████████████░░░░░░░░░░░░░░░               │
│         ↑                      ↑          ↑        │
│     Color from             Amount in   Percentage  │
│     payment method         base USD    badge       │
│                                                    │
│  🟢 Revolut EUR  [EUR]       $109.00    [21.8%]   │
│  ██████████░░░░░░░░░░░░░░░░░░░░░░░░                │
│                    ↑                               │
│              Currency badge                        │
│              (foreign currency)                    │
│                                                    │
│  🟠 Mono UAH  [UAH]           $24.00     [4.8%]   │
│  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                │
│                                                    │
│  * Legacy transactions are displayed in your       │
│    base currency                                   │
└────────────────────────────────────────────────────┘
```

**Features**:
- Summary banner at top
- Each payment method as separate row
- Colored dots match payment method colors
- Currency badges for foreign currencies
- Progress bars with payment method colors
- Percentage badges (gray = normal, red = over 100%)
- Footer note for legacy transactions

---

### 4. Tooltip (On Hover)

```
┌────────────────────────────────────────────────────┐
│  🔵 Chase Sapphire Reserve   $200.00    [40.0%]   │
│  ████████████████████░░░░░░░░░░░░░░░               │
│         ↑                                          │
│         └─────────┐                                │
│                   │  ┌──────────────────────────┐  │
│                   └──│ Chase Sapphire Reserve   │  │
│                      │ ────────────────────────  │  │
│                      │ Currency:       USD      │  │
│                      │ Amount Spent:   $200.00  │  │
│                      │ Of Budget:      40.0%    │  │
│                      │ Transactions:   5        │  │
│                      └──────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

**Features**:
- Appears on hover (or keyboard focus)
- Shows detailed information
- Clean, readable layout
- Dark background for contrast

---

### 5. Empty State (No Transactions)

```
┌────────────────────────────────────────────────────┐
│  🟢 Food Budget                          ⋮         │
│  January 2025                                      │
│                                                    │
│  $0.00 of $500.00                [category badge] │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%                  │
│  $500.00 remaining                                 │
│  ─────────────────────────────────────────────     │
│  💳 Payment Method Breakdown             ▲         │
│                                                    │
│              💵                                    │
│     No transactions yet for                        │
│     this budget period                             │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Features**:
- Dollar sign icon
- Friendly message
- No harsh error styling
- Collapse button still works

---

### 6. Error State

```
┌────────────────────────────────────────────────────┐
│  🟢 Food Budget                          ⋮         │
│  January 2025                                      │
│                                                    │
│  $333.00 of $500.00              [category badge] │
│  ████████████████░░░░░░░░░░░ 66.6%                │
│  $167.00 remaining                                 │
│  ─────────────────────────────────────────────     │
│  💳 Payment Method Breakdown             ▲         │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ ⚠️  Failed to load breakdown. Please try    │ │
│  │     again.                                    │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Features**:
- Alert icon
- Red/orange error styling
- Generic error message (no technical details)
- Can retry by collapsing and expanding again

---

### 7. Legacy Transactions Only

```
┌────────────────────────────────────────────────────┐
│  🟢 Food Budget                          ⋮         │
│  January 2025                                      │
│                                                    │
│  $150.00 of $500.00              [category badge] │
│  ██████░░░░░░░░░░░░░░░░░░░ 30%                    │
│  $350.00 remaining                                 │
│  ─────────────────────────────────────────────     │
│  💳 Payment Method Breakdown             ▲         │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ Total spent across 1 payment method:         │ │
│  │ $150.00                                      │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ⚫ Legacy Transactions       $150.00    [30.0%]   │
│  ████████████░░░░░░░░░░░░░░░░░░░░░░░░              │
│    ↑                                               │
│  Gray color                                        │
│                                                    │
│  * Legacy transactions are displayed in your       │
│    base currency                                   │
└────────────────────────────────────────────────────┘
```

**Features**:
- "Legacy Transactions" label in gray
- Note at bottom explaining what legacy means
- Same functionality as regular payment methods

---

### 8. Over-Budget Payment Method

```
┌────────────────────────────────────────────────────┐
│  🟢 Food Budget                          ⋮         │
│  January 2025                                      │
│                                                    │
│  $600.00 of $500.00              [category badge] │
│  ████████████████████████████ 120%                 │
│  Over budget by $100.00                           │
│  ─────────────────────────────────────────────     │
│  💳 Payment Method Breakdown             ▲         │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ Total spent across 2 payment methods:        │ │
│  │ $600.00                                      │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  🔵 Chase Sapphire Reserve   $550.00   [110.0%]   │
│  ████████████████████████████████████████          │
│                                           ↑        │
│                                    Red badge       │
│                                    (over 100%)     │
│                                                    │
│  🟢 Revolut EUR  [EUR]        $50.00    [10.0%]   │
│  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Features**:
- Red percentage badge for over-contributing methods
- Progress bar can exceed 100% visually
- Clear indication of which payment method is the problem

---

## Responsive Behavior

### Desktop (> 1024px)

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Budget 1 │  │ Budget 2 │  │ Budget 3 │
│          │  │          │  │          │
│ [View...]│  │ [View...]│  │ [View...]│
└──────────┘  └──────────┘  └──────────┘
```
**3 columns**, side-by-side layout

### Tablet (640px - 1024px)

```
┌──────────────┐  ┌──────────────┐
│   Budget 1   │  │   Budget 2   │
│              │  │              │
│  [View...]   │  │  [View...]   │
└──────────────┘  └──────────────┘
┌──────────────┐
│   Budget 3   │
│              │
│  [View...]   │
└──────────────┘
```
**2 columns**, stacked when needed

### Mobile (< 640px)

```
┌──────────────────────┐
│      Budget 1        │
│                      │
│     [View...]        │
└──────────────────────┘
┌──────────────────────┐
│      Budget 2        │
│                      │
│     [View...]        │
└──────────────────────┘
```
**1 column**, full width, stacked vertically

**Payment method names truncate on small screens**:
```
Desktop:  Chase Sapphire Reserve
Mobile:   Chase Sapph...
```

---

## Dark Mode

### Light Mode
```
┌────────────────────────────────────────┐
│  White background                      │
│  Black text                            │
│  Gray borders                          │
│  Colored progress bars                 │
└────────────────────────────────────────┘
```

### Dark Mode
```
┌────────────────────────────────────────┐
│  Dark gray background                  │
│  White/light gray text                 │
│  Dark borders                          │
│  Colored progress bars (same)          │
└────────────────────────────────────────┘
```

**Colors adjust automatically** based on system preference or user setting.

---

## Color Palette

### Payment Method Colors (Examples)
- 🔵 Blue: `#3B82F6` (default for USD cards)
- 🟢 Green: `#10B981` (default for EUR cards)
- 🟠 Orange: `#F59E0B` (default for UAH cards)
- 🟣 Purple: `#8B5CF6`
- 🔴 Red: `#EF4444`
- ⚫ Gray: `#6B7280` (legacy transactions)

### Status Colors
- **Normal Percentage**: Gray badge `#71717a`
- **Over Budget**: Red badge `#ef4444`
- **Success**: Green `#22c55e`
- **Warning**: Orange `#f97316`
- **Error**: Red `#ef4444`

---

## Animation & Transitions

### Expand/Collapse
```
Duration: 200ms
Easing: ease-in-out
Property: height (auto)
```

### Loading Spinner
```
Duration: 1000ms
Type: Continuous rotation
Icon: Loader2 from Lucide
```

### Hover Effects
```
Button: Shadow increase on hover
Progress Bar: No animation (static)
Tooltip: Fade in 150ms
```

---

## Accessibility Features

### Keyboard Navigation
```
Tab         → Focus expand/collapse button
Enter/Space → Trigger expand/collapse
Tab         → Focus next element
Shift+Tab   → Focus previous element
```

### Screen Reader Announcements
```
Collapsed:  "View Payment Method Breakdown, button, collapsed"
Expanded:   "Payment Method Breakdown, section, expanded"
Loading:    "Loading breakdown data"
Error:      "Error: Failed to load breakdown"
Empty:      "No transactions yet for this budget period"
```

### ARIA Labels
```
Button:     aria-expanded="true|false"
Section:    role="region" aria-label="Payment Method Breakdown"
Loading:    aria-live="polite" aria-busy="true"
```

---

## Usage Patterns

### Most Common Use Case
1. User wants to see **which card** they're using most
2. Click expand
3. See breakdown
4. Identify highest contributor
5. Make decision to use different card
6. Collapse to clean up view

### Budget Planning Use Case
1. User setting up **monthly budgets**
2. Expand breakdown to see historical patterns
3. Notice they always overspend with one card
4. Set card-specific spending rules
5. Track improvement over time

### Multi-Currency Use Case
1. User traveling to **Europe**
2. Creates EUR budget for trip
3. Uses multiple cards (USD, EUR)
4. Checks breakdown to see conversion impact
5. Identifies best card for foreign transactions
6. Adjusts payment method usage

---

## Performance Considerations

### Fast Loading
- Data fetched only when expanded
- Typical response time: 200-500ms
- No blocking on initial page load

### Smooth Animations
- CSS transitions hardware-accelerated
- 60fps target for all animations
- No janky scrolling or re-layouts

### Memory Efficient
- Component unmounts when collapsed
- Data cleared on navigation
- No memory leaks detected

---

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome  | 120+    | ✅ Full support |
| Safari  | 17+     | ✅ Full support |
| Firefox | 121+    | ✅ Full support |
| Edge    | 120+    | ✅ Full support |
| Mobile Safari | 17+ | ✅ Full support |
| Chrome Mobile | 120+ | ✅ Full support |

**Requirements**:
- JavaScript enabled
- Modern browser with React 18+ support
- CSS Grid and Flexbox support

---

## Visual Design System

### Typography
- **Payment Method Name**: 14px, medium weight
- **Amounts**: 14px, semibold
- **Percentages**: 12px, medium weight
- **Tooltips**: 14px, regular
- **Summary**: 14px, regular

### Spacing
- **Card Padding**: 16px (mobile), 24px (desktop)
- **Row Gap**: 16px between payment methods
- **Icon Margin**: 8px right of icons
- **Button Padding**: 8px vertical, 12px horizontal

### Border Radius
- **Cards**: 8px
- **Buttons**: 6px
- **Progress Bars**: 9999px (fully rounded)
- **Badges**: 4px

### Shadows
- **Card**: `0 1px 3px rgba(0,0,0,0.1)`
- **Card Hover**: `0 4px 6px rgba(0,0,0,0.1)`
- **Tooltip**: `0 10px 15px rgba(0,0,0,0.2)`

---

## Component States Summary

| State | Visual | User Action | Next State |
|-------|--------|-------------|------------|
| Collapsed | Button visible | Click expand | Loading |
| Loading | Spinner | Wait | Success/Error |
| Success | Breakdown shown | View data | Expanded |
| Expanded | Full view | Click collapse | Collapsed |
| Empty | No data message | Add transactions | Success |
| Error | Error message | Retry (collapse/expand) | Loading |

---

## Best Practices for Users

### When to Use Breakdown
✅ Analyzing spending patterns
✅ Identifying dominant payment methods
✅ Understanding multi-currency impact
✅ Planning future card usage
✅ Investigating budget overruns

### When Not Needed
❌ Quick budget overview (use main progress bar)
❌ Comparing multiple budgets (collapse all)
❌ Mobile data saver mode (avoid expanding)

---

## Conclusion

The Budget Payment Method Breakdown component provides a **clean, intuitive, and powerful** way to visualize multi-currency spending across different payment methods. The design prioritizes:

1. **Clarity**: Color-coded, easy to understand
2. **Performance**: Lazy loading, fast rendering
3. **Accessibility**: Keyboard nav, screen readers
4. **Responsiveness**: Works on all devices
5. **User Control**: Expandable/collapsible

**Visual design follows** FinanceFlow's design system and integrates seamlessly with existing budget cards.

---

**For more details, see**:
- Implementation: `/CARD_23_FRONTEND_SUMMARY.md`
- Usage Guide: `/CARD_23_FRONTEND_QUICK_REFERENCE.md`
- Deployment: `/CARD_23_IMPLEMENTATION_COMPLETE.md`
