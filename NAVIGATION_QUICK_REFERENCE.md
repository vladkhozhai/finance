# Navigation Quick Reference

## Navigation Structure (After Card #25)

### Desktop Navigation (Header)
```
[FinanceFlow Logo] [Dashboard] [Transactions] [Budgets] [👤 Profile] [➕ Add Transaction] [User Menu ▼]
```

### Mobile Navigation (Bottom Bar)
```
┌─────────┬─────────┬──────┬─────────┬─────────┐
│Dashboard│Transact │  ➕  │ Budgets │ Profile │
│    📊   │   💳    │      │   🎯    │   👤    │
└─────────┴─────────┴──────┴─────────┴─────────┘
                       ↑
                  (FAB Button)
```

## URL Routes

### Main Pages
- `/` - Dashboard (home)
- `/transactions` - Transaction list and management
- `/budgets` - Budget tracking with progress bars
- `/profile` - Profile & Settings (new!)

### Profile Tabs (via `/profile?tab=...`)
- `/profile` or `/profile?tab=overview` - Account info
- `/profile?tab=payment-methods` - Payment methods management
- `/profile?tab=categories` - Categories management
- `/profile?tab=tags` - Tags management
- `/profile?tab=preferences` - App preferences

### Legacy Routes (Redirected)
- `/payment-methods` → `/profile?tab=payment-methods`
- `/categories` → `/profile?tab=categories`
- `/tags` → `/profile?tab=tags`

## Quick Action Button

### Desktop
- **Location**: Header, between main nav and user menu
- **Appearance**: Large button with icon + text "Add Transaction"
- **Behavior**: Opens Create Transaction dialog

### Mobile
- **Location**: Center position of bottom navigation (3rd of 5 tabs)
- **Appearance**: Elevated circular FAB (Floating Action Button)
- **Size**: 56px × 56px, elevated -16px above nav bar
- **Behavior**: Opens Create Transaction dialog

## Component Files

### Navigation Components
- `/src/components/layout/app-header.tsx` - Desktop header navigation
- `/src/components/layout/main-nav.tsx` - Mobile bottom navigation
- `/src/components/layout/quick-action-button.tsx` - Quick Action button (both variants)

### Profile Components
- `/src/app/(dashboard)/profile/page.tsx` - Profile page (Server Component)
- `/src/app/(dashboard)/profile/profile-client.tsx` - Profile tabs (Client Component)

## Usage Examples

### Linking to Profile Tabs

```tsx
import Link from "next/link";

// Link to Overview (default)
<Link href="/profile">Profile</Link>

// Link to specific tab
<Link href="/profile?tab=categories">Manage Categories</Link>
<Link href="/profile?tab=payment-methods">Payment Methods</Link>
<Link href="/profile?tab=tags">Tags</Link>
<Link href="/profile?tab=preferences">Preferences</Link>
```

### Programmatic Navigation

```tsx
"use client";

import { useRouter } from "next/navigation";

function MyComponent() {
  const router = useRouter();

  const goToCategories = () => {
    router.push("/profile?tab=categories");
  };

  return <button onClick={goToCategories}>Go to Categories</button>;
}
```

### Using Quick Action Button

```tsx
import { QuickActionButton } from "@/components/layout/quick-action-button";

// Desktop version
<QuickActionButton variant="desktop" />

// Mobile version
<QuickActionButton variant="mobile" />
```

## Navigation Item Counts

### Before (Card #25)
- Desktop: 6 items (Dashboard, Transactions, Budgets, Payment Methods, Categories, Tags)
- Mobile: 6 tabs

### After (Card #25)
- Desktop: 4 items + Quick Action (Dashboard, Transactions, Budgets, Profile + Add Transaction button)
- Mobile: 4 tabs + Quick Action FAB (5 total positions)

## Responsive Breakpoints

- **Mobile**: < 768px (bottom navigation, FAB Quick Action)
- **Desktop**: ≥ 768px (header navigation, button Quick Action)

## Icons Used (Lucide React)

- Dashboard: `LayoutDashboard`
- Transactions: `Receipt`
- Budgets: `Target`
- Profile: `User`
- Quick Action (mobile): `Plus`
- Quick Action (desktop): `PlusCircle`
- Payment Methods (tab): `CreditCard`
- Categories (tab): `FolderOpen`
- Tags (tab): `Tag`
- Preferences (tab): `Settings`

## Accessibility Notes

- All buttons have `type="button"` to prevent form submission
- All icon-only buttons have `aria-label`
- Decorative icons have `aria-hidden="true"`
- Active navigation states use `aria-current="page"`
- Tab navigation follows Radix UI accessibility patterns
- Keyboard navigation fully supported

## Common Tasks

### Add Settings to a New Tab

1. Add tab trigger in `profile-client.tsx`:
```tsx
<TabsTrigger value="my-settings" className="gap-2">
  <MyIcon className="h-4 w-4" aria-hidden="true" />
  <span>My Settings</span>
</TabsTrigger>
```

2. Add tab content:
```tsx
<TabsContent value="my-settings" className="space-y-6">
  <Card>
    <CardHeader>
      <CardTitle>My Settings</CardTitle>
      <CardDescription>Description here</CardDescription>
    </CardHeader>
    <CardContent>
      {/* Your content */}
    </CardContent>
  </Card>
</TabsContent>
```

### Change Navigation Items

Edit the `navItems` array in respective components:
- Desktop: `/src/components/layout/app-header.tsx`
- Mobile: `/src/components/layout/main-nav.tsx`

```tsx
const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: Receipt },
  // Add new items here
];
```

### Customize Quick Action Button

Edit `/src/components/layout/quick-action-button.tsx`:
- Change button text/icon
- Modify styling (colors, size)
- Replace dialog with custom action

## Testing Checklist

- [ ] Desktop navigation displays 4 items + Quick Action
- [ ] Mobile navigation displays 5 positions (4 tabs + FAB)
- [ ] Quick Action button opens Create Transaction dialog
- [ ] Profile page loads with Overview tab
- [ ] All profile tabs are accessible
- [ ] URL updates when switching tabs
- [ ] Legacy routes redirect correctly
- [ ] Responsive design works at 768px breakpoint
- [ ] Keyboard navigation works
- [ ] Screen readers announce navigation correctly
