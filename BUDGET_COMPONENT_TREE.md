# Budget Components Tree Structure

## Component Hierarchy

```
/src/app/(dashboard)/budgets/page.tsx (Main Page)
│
├── Page Header
│   ├── Title & Description
│   └── <CreateBudgetDialog />
│       ├── Dialog Trigger (Button "Create Budget")
│       └── Dialog Content
│           ├── Target Type Selection (RadioGroup)
│           │   ├── Category (Radio)
│           │   └── Tag (Radio)
│           ├── Category Select (conditional)
│           ├── Tag Select (conditional)
│           ├── Amount Input
│           └── <PeriodPicker />
│
├── <Card> (Filters Container)
│   └── <BudgetFilters />
│       ├── Category Select Dropdown
│       ├── Tag Select Dropdown
│       ├── <PeriodPicker />
│       └── Clear Filters Button
│
└── <BudgetList />
    ├── Loading State (6x <BudgetCardSkeleton />)
    ├── Empty State (Icon + Message)
    └── Budget Cards Grid
        └── <BudgetCard /> (for each budget)
            ├── Card Header
            │   ├── Target Name (with color dot)
            │   ├── Period Display
            │   ├── Overspending Icon (conditional)
            │   └── Actions Menu (DropdownMenu)
            │       ├── Edit MenuItem
            │       └── Delete MenuItem
            ├── Card Content
            │   ├── Amount Summary (spent / limit)
            │   ├── Target Type Badge
            │   ├── <BudgetProgressBar />
            │   │   ├── <Progress /> (Shadcn/UI)
            │   │   └── Percentage Text
            │   └── Remaining/Overspent Amount
            ├── <EditBudgetDialog />
            │   ├── Target Display (read-only)
            │   ├── Info Message
            │   ├── Amount Input
            │   └── <PeriodPicker />
            └── <DeleteBudgetDialog />
                ├── Warning Icon
                ├── Budget Details Summary
                └── Confirm/Cancel Buttons
```

## Shared Components

### PeriodPicker
Used in 3 places:
1. Create Budget Dialog
2. Edit Budget Dialog
3. Budget Filters

Features:
- Month/Year navigation (prev/next buttons)
- Month dropdown (January - December)
- Year dropdown (current ± 5 years)
- Outputs: YYYY-MM-01 format
- Displays: "January 2025" format

### BudgetProgressBar
Used in:
- Budget Card

Features:
- 4-tier color coding (green/yellow/orange/red)
- Percentage display
- Caps visual progress at 100% (but calculates actual percentage)

## Data Flow

```
Page State
│
├── budgets: BudgetProgress[]
├── isLoading: boolean
└── filters: BudgetFilterValues
    ├── categoryId?: string
    ├── tagId?: string
    └── period?: string

↓ (passed to components)

BudgetList
├── budgets (prop)
├── isLoading (prop)
└── onUpdate (callback)
    │
    └── BudgetCard
        ├── budget (prop)
        ├── onUpdate (callback)
        │
        ├── EditBudgetDialog
        │   └── onSuccess → onUpdate → fetchBudgets()
        │
        └── DeleteBudgetDialog
            └── onSuccess → onUpdate → fetchBudgets()

CreateBudgetDialog
└── onSuccess → fetchBudgets()

BudgetFilters
├── filters (prop)
└── onFiltersChange (callback)
    └── Triggers fetchBudgets() via useEffect
```

## Server Actions Called

### From Page
- `getBudgetProgress()` - Fetches budgets with calculated metrics

### From CreateBudgetDialog
- `getCategories()` - Fetches expense categories
- `getTags()` - Fetches user tags
- `createBudget()` - Creates new budget

### From EditBudgetDialog
- `updateBudget()` - Updates existing budget

### From DeleteBudgetDialog
- `deleteBudget()` - Deletes budget

### From BudgetFilters
- `getCategories()` - Fetches expense categories for filter
- `getTags()` - Fetches tags for filter

## Component Communication

### Parent → Child (Props)
- Page passes `budgets` to BudgetList
- Page passes `filters` to BudgetFilters
- BudgetList passes `budget` to each BudgetCard
- BudgetCard passes `budget` to EditDialog and DeleteDialog

### Child → Parent (Callbacks)
- Dialogs call `onSuccess` → Page's `fetchBudgets()`
- BudgetFilters calls `onFiltersChange` → Page updates `filters`
- Filter change triggers `useEffect` → `fetchBudgets()`

### Sibling Communication
- Indirect via parent state
- Example: CreateDialog → Success → Page refetch → BudgetList updates

## Styling Strategy

### Responsive Breakpoints
- Mobile: `default` (< 640px) - 1 column
- Tablet: `sm:` (≥ 640px) - 2 columns
- Desktop: `lg:` (≥ 1024px) - 3 columns

### Color Coding
```
Budget Progress:
- 0-70%   → Green  (bg-green-500, text-green-600)
- 71-90%  → Yellow (bg-yellow-500, text-yellow-600)
- 91-99%  → Orange (bg-orange-500, text-orange-600)
- 100%+   → Red    (bg-red-500, text-red-600)

Overspent Card:
- Border: border-red-200
- Background: bg-red-50/50
```

### Component Patterns
- All dialogs: `max-w-md` (448px)
- Cards: Default card styling from Shadcn/UI
- Buttons: Size variants (`sm`, `lg`, `icon`)
- Inputs: Height `h-9` for compact forms

## File Locations

```
/src/
├── app/
│   └── (dashboard)/
│       └── budgets/
│           └── page.tsx (Main Page - Client Component)
│
├── components/
│   └── budgets/
│       ├── budget-card.tsx
│       ├── budget-filters.tsx
│       ├── budget-list.tsx
│       ├── budget-progress-bar.tsx
│       ├── create-budget-dialog.tsx
│       ├── delete-budget-dialog.tsx
│       ├── edit-budget-dialog.tsx
│       ├── period-picker.tsx
│       └── index.ts (Barrel Exports)
│
└── app/
    └── actions/
        ├── budgets.ts (Server Actions)
        ├── categories.ts
        └── tags.ts
```

## Testing Entry Points

### Manual Testing Routes
1. Navigate to `/budgets` page
2. Click "Create Budget" button
3. Fill form and submit
4. View budget card in list
5. Click actions menu (3 dots)
6. Select "Edit" or "Delete"
7. Test filters (category, tag, period)
8. Test responsive layouts (resize window)

### Key Test Scenarios
1. **Create Flow**: Category → Amount → Period → Submit
2. **Create Flow**: Tag → Amount → Period → Submit
3. **Edit Flow**: Change amount → Submit
4. **Edit Flow**: Change period → Submit
5. **Delete Flow**: Confirm → Verify removal
6. **Filter Flow**: Select category → Verify filtered list
7. **Filter Flow**: Select tag → Verify filtered list
8. **Filter Flow**: Select period → Verify filtered list
9. **Progress Display**: Create transaction → Verify progress updates
10. **Overspending**: Exceed budget → Verify red indicators

### Error Scenarios
1. Duplicate budget (same category + period)
2. Duplicate budget (same tag + period)
3. Invalid amount (negative, zero, text)
4. Missing category/tag selection
5. Network error during submission

## Performance Considerations

### Optimization Points
- Categories/tags fetched only when dialog opens
- Filters trigger debounced refetch (via useEffect)
- Skeleton UI for immediate feedback
- Memoized callbacks to prevent re-renders
- Conditional rendering for dialogs (mount on open)

### Potential Bottlenecks
- Large number of budgets (no pagination yet)
- Multiple rapid filter changes
- Complex progress calculations on server

### Future Optimizations
- Implement pagination (offset/limit)
- Add debounce to filter changes
- Cache categories/tags in context
- Optimistic UI updates for CRUD operations
