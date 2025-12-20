# Card #7 Visual Guide - Budget Tooltips & Sort Controls

## Feature 1: Budget Card Tooltips

### Before (Card #6)
```
┌─────────────────────────────────────┐
│ 🍕 Food Budget    ⚠️                │
│ January 2025                        │
│                                     │
│ $850.00 of $1,000.00      category  │
│ ████████████████░░░░░░░░ 85%        │
│ $150.00 remaining                   │
└─────────────────────────────────────┘
```

### After (Card #7) - On Hover
```
┌─────────────────────────────────────┐
│ 🍕 Food Budget    ⚠️                │  ┌────────────────────────────┐
│ January 2025                        │  │ Food Budget - January 2025 │
│                                     │  │ ───────────────────────────│
│ $850.00 of $1,000.00      category  │  │ Limit:        $1,000.00    │
│ ████████████████░░░░░░░░ 85%        │  │ Spent:        $850.00      │
│ $150.00 remaining                   │  │ Remaining:    $150.00      │
└─────────────────────────────────────┘  │ Progress:     85.0%        │
       Card with cursor-help                └────────────────────────────┘
       (shadow appears on hover)                   Tooltip
```

### Over Budget Example
```
┌─────────────────────────────────────┐
│ 🚗 Transport    ⚠️                  │  ┌────────────────────────────┐
│ December 2025                       │  │ Transport - December 2025  │
│ (card has red border & background)  │  │ ───────────────────────────│
│                                     │  │ Limit:        $500.00      │
│ $620.00 of $500.00          category│  │ Spent:        $620.00 🔴   │
│ ████████████████████████ 124%       │  │ Over budget:  $120.00 🔴   │
│ Over budget by $120.00 🔴           │  │ Progress:     124.0%       │
└─────────────────────────────────────┘  └────────────────────────────┘
```

## Feature 2: Sort Controls

### UI Layout
```
╔═══════════════════════════════════════════════════════════════╗
║                          Budgets                              ║
║  Set spending limits and track your budget progress.          ║
║                                                   [+ Create Budget] ║
╚═══════════════════════════════════════════════════════════════╝

┌───────────────────────────────────────────────────────────────┐
│ Filters:                                                      │
│                                                               │
│ Category:  [All Categories     ▼]                            │
│ Tag:       [All Tags           ▼]                            │
│ Period:    [All Periods        ▼]                            │
│ ───────────────────────────────────────────────────────────── │
│ Sort by:   [Default (by period) ▼]                           │
└───────────────────────────────────────────────────────────────┘
```

### Sort Dropdown Options
```
┌─────────────────────────────┐
│ Sort by: [▼]                │
│                             │
│ ┌─────────────────────────┐ │
│ │ ✓ Default (by period)   │ │  ← Currently selected
│ │   Most Overspent        │ │
│ │   Percentage (High/Low) │ │
│ │   Percentage (Low/High) │ │
│ │   Amount (High to Low)  │ │
│ │   Amount (Low to High)  │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### Sort Examples

#### 1. Default (by period)
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Food            │  │ Transport       │  │ Food            │
│ February 2025   │  │ February 2025   │  │ January 2025    │
│ $200/$1000  20% │  │ $150/$500  30%  │  │ $850/$1000  85% │
└─────────────────┘  └─────────────────┘  └─────────────────┘
     Newest period       Newest period       Previous period
```

#### 2. Most Overspent
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Transport 🔴    │  │ Food            │  │ Transport       │
│ December 2025   │  │ January 2025    │  │ February 2025   │
│ $620/$500  124% │  │ $850/$1000  85% │  │ $150/$500  30%  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
   OVER 124%          Within budget 85%    Within budget 30%
```

#### 3. Percentage (High to Low)
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Transport 🔴    │  │ Food            │  │ Transport       │
│ December 2025   │  │ January 2025    │  │ February 2025   │
│ $620/$500  124% │  │ $850/$1000  85% │  │ $150/$500  30%  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
       124%                 85%                  30%
```

#### 4. Amount (High to Low)
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Food            │  │ Transport       │  │ Food            │
│ February 2025   │  │ February 2025   │  │ January 2025    │
│ $200/$1000  20% │  │ $150/$500  30%  │  │ $850/$1000  85% │
└─────────────────┘  └─────────────────┘  └─────────────────┘
    $1000 limit          $500 limit         $1000 limit
```

## Responsive Behavior

### Desktop (>640px)
```
┌──────────────────────────────────────────────────┐
│ Category:  [All Categories ▼]  Tag: [All Tags ▼]│
│ Period:    [All Periods    ▼]                    │
│ ──────────────────────────────────────────────── │
│ Sort by:   [Default (by period)     ▼]           │
└──────────────────────────────────────────────────┘
          Sort dropdown is 240px wide
```

### Mobile (<640px)
```
┌────────────────────────────────┐
│ Category:                      │
│ [All Categories            ▼]  │
│                                │
│ Tag:                           │
│ [All Tags                  ▼]  │
│                                │
│ Period:                        │
│ [All Periods               ▼]  │
│ ────────────────────────────── │
│ Sort by:                       │
│ [Default (by period)       ▼]  │
└────────────────────────────────┘
    All controls stack vertically
    Dropdowns take full width
```

## User Interaction Flow

### Tooltip Interaction
```
1. User hovers over budget card
   → Card shadow appears (visual feedback)
   → Cursor changes to "help" icon

2. Tooltip appears after brief delay
   → Shows detailed breakdown
   → Positioned above card (or below if no space)

3. User moves mouse away
   → Tooltip disappears
   → Card returns to normal state

Keyboard:
- Tab to focus on card
- Tooltip appears on focus
- Tab away to dismiss
```

### Sort Interaction
```
1. User clicks "Sort by" dropdown
   → Dropdown opens with 6 options
   → Current selection is checked

2. User selects new sort option
   → Dropdown closes
   → Budget list re-renders with new order
   → No page reload or API call

3. User applies filters
   → Filtered budgets are sorted
   → Sort order is preserved
```

## Color Coding Guide

### Tooltip Colors
- **White text on dark background** - All labels and normal values
- **Red text (#ef4444)** - Overspent amounts and "Over budget" label
- **Green text (#22c55e)** - Remaining amount (when not overspent)
- **Border** - Subtle separator line (#71717a)

### Budget Card States
- **Normal** - White background, gray border
- **Overspent** - Red tint background (#fef2f2), red border (#fecaca)
- **Hover** - Elevated shadow, cursor-help

### Progress Bar Colors (from Card #6)
- **0-50%** - Green (#22c55e)
- **51-75%** - Yellow (#eab308)
- **76-99%** - Orange (#f97316)
- **100%+** - Red (#ef4444)

## Accessibility Features

### Tooltips
- ✅ Keyboard accessible (shows on focus)
- ✅ Screen reader compatible (uses ARIA attributes)
- ✅ High contrast text (WCAG AA compliant)
- ✅ Clear visual indicator (cursor-help)

### Sort Controls
- ✅ Proper label association (`htmlFor="sort-by"`)
- ✅ Keyboard navigable (Tab + Arrow keys)
- ✅ Clear option labels
- ✅ Focus states visible

## Technical Implementation Notes

### Tooltip Component
```typescript
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Card className="cursor-help hover:shadow-md">
        {/* Budget card content */}
      </Card>
    </TooltipTrigger>
    <TooltipContent side="top">
      {/* Detailed breakdown */}
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Sort Logic
```typescript
const sortedBudgets = useMemo(
  () => sortBudgets(budgets, sortBy),
  [budgets, sortBy]
);
// Memoized to prevent unnecessary re-computations
```

## Performance Impact

### Tooltips
- **Render Cost:** Minimal (only renders on trigger)
- **Memory:** Low (uses context for state management)
- **Initial Load:** No impact (component loaded lazily)

### Sort Controls
- **Computation:** O(n log n) for sorting ~50 budgets
- **Re-render:** Only when sortBy changes (memoized)
- **User Experience:** Instant (client-side sorting)

## User Benefits

### Tooltips
1. **Quick Reference** - See all budget details without navigation
2. **Context Awareness** - Understand budget status at a glance
3. **Reduced Clicks** - No need to open modal for basic info

### Sort Controls
1. **Priority Management** - Quickly identify budgets needing attention
2. **Budget Planning** - Review budgets by size or usage
3. **Flexible View** - Organize data to match mental model
4. **Efficiency** - Find specific budgets faster

## Future Enhancement Ideas

### Tooltips
- Add transaction count (requires backend changes)
- Show top 3 transaction categories contributing to spend
- Display trend indicator (up/down arrow compared to last month)

### Sort Controls
- Add custom sort presets (save user preferences)
- Multi-level sorting (primary + secondary criteria)
- Sort direction indicator (arrows next to label)
- Quick-sort buttons (icons for common sorts)

## Conclusion

These two features significantly enhance the budget management experience:
- **Tooltips** provide instant access to detailed information
- **Sort controls** enable flexible data organization

Both features are accessible, performant, and integrate seamlessly with existing UI components.
