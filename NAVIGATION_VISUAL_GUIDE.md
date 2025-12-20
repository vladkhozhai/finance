# Navigation Visual Guide

## Desktop Layout (≥768px)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  [FinanceFlow]  Dashboard  Transactions  Budgets  👤 Profile      [➕ Add Transaction]  [User ▼]  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**Components:**
- Logo: Brand identity
- 4 Navigation Links: Dashboard, Transactions, Budgets, Profile
- Quick Action Button: Large prominent "Add Transaction" button
- User Menu: Dropdown with logout

---

## Mobile Layout (<768px)

### Screen
```
┌────────────────────────────────┐
│                                │
│    Page Content                │
│                                │
│                                │
│                                │
└────────────────────────────────┘
```

### Bottom Navigation Bar
```
┌────────┬────────┬────────┬────────┬────────┐
│   📊   │   💳   │        │   🎯   │   👤   │
│        │        │   ➕   │        │        │
│Dashbrd │ Trans  │        │ Budget │Profile │
│        │        │  Add   │        │        │
└────────┴────────┴────────┴────────┴────────┘
                     ↑
              Elevated FAB
              (56px circle)
```

**Components:**
- 4 Regular Tabs: Dashboard, Transactions, Budgets, Profile
- 1 Center FAB: Quick Action "Add Transaction" button

---

## Profile Page Structure

```
Profile & Settings
────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│ [Overview] [Payment Methods] [Categories] [Tags] [Preferences] │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Tab Content                                                    │
│                                                                 │
│  • Overview: User info, Quick links                            │
│  • Payment Methods: Link to /payment-methods                   │
│  • Categories: Link to /categories                             │
│  • Tags: Link to /tags                                         │
│  • Preferences: Theme, Language settings                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Navigation Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        Main Navigation                           │
├──────────┬──────────────┬──────────┬───────────┬────────────────┤
│          │              │          │           │                │
│ Dashboard│ Transactions │  Budgets │  Profile  │ Add Transaction│
│    /     │ /transactions│ /budgets │ /profile  │   (Dialog)     │
│          │              │          │           │                │
└──────────┴──────────────┴──────────┴────┬──────┴────────────────┘
                                          │
                    ┌─────────────────────┴──────────────────────┐
                    │         Profile Page Tabs                  │
                    ├──────────┬──────────┬──────┬────┬─────────┤
                    │          │          │      │    │         │
                    │ Overview │ Payment  │ Cat. │Tags│ Pref.   │
                    │          │ Methods  │      │    │         │
                    │          │          │      │    │         │
                    └──────────┴────┬─────┴──┬───┴──┬─┴─────────┘
                                    │        │      │
                         ┌──────────┴──┐  ┌──┴───┐ │
                         │             │  │      │ │
                   /payment-methods  /categories │
                         │             │    /tags│
                         │             │         │
                    (Full Pages)   (Full Pages)  │
                                              (Future)
```

---

## Quick Action Button States

### Desktop Button
```
Normal State:
┌──────────────────────┐
│  ➕  Add Transaction │
└──────────────────────┘

Hover State:
┌──────────────────────┐
│  ➕  Add Transaction │  ← Slightly dimmed (opacity: 0.9)
└──────────────────────┘
```

### Mobile FAB
```
Normal State:
      ╭─────╮
      │  ➕  │  ← Elevated above nav (-16px)
      ╰─────╯
       Add

Active/Pressed State:
      ╭─────╮
      │  ➕  │  ← Scaled down (0.95)
      ╰─────╯
       Add
```

---

## URL Structure

```
Domain/
├── /                           → Dashboard
├── /transactions               → Transactions List
├── /budgets                    → Budget Tracking
├── /profile                    → Profile & Settings (Overview tab)
│   ├── ?tab=overview          → Account Info (default)
│   ├── ?tab=payment-methods   → Payment Methods
│   ├── ?tab=categories        → Categories
│   ├── ?tab=tags              → Tags
│   └── ?tab=preferences       → Preferences
│
└── Legacy Routes (Redirected):
    ├── /payment-methods       → /profile?tab=payment-methods
    ├── /categories            → /profile?tab=categories
    └── /tags                  → /profile?tab=tags
```

---

## Before vs After Comparison

### Desktop Navigation

**BEFORE (6 items):**
```
[Logo] [Dashboard] [Transactions] [Budgets] [Payment] [Categories] [Tags] [User▼]
```

**AFTER (4 items + Quick Action):**
```
[Logo] [Dashboard] [Transactions] [Budgets] [👤Profile]   [➕Add Transaction] [User▼]
                                                           ↑
                                              Quick Action Button
```

### Mobile Navigation

**BEFORE (6 tabs):**
```
┌──────┬──────┬──────┬──────┬──────┬──────┐
│Dashbrd│Trans │Budget│Paymt │ Cat. │ Tags │
└──────┴──────┴──────┴──────┴──────┴──────┘
```

**AFTER (5 positions with FAB):**
```
┌──────┬──────┬──────┬──────┬──────┐
│Dashbrd│Trans │      │Budget│Profle│
│      │      │  ➕  │      │      │
│      │      │ Add  │      │      │
└──────┴──────┴──────┴──────┴──────┘
                ↑
           Elevated FAB
```

---

## Responsive Breakpoint Behavior

### At 767px (Mobile)
- Header navigation: **HIDDEN**
- Bottom navigation: **VISIBLE**
- Quick Action: **FAB style** (elevated circle)
- Content padding-bottom: **80px** (space for nav)

### At 768px+ (Desktop/Tablet)
- Header navigation: **VISIBLE**
- Bottom navigation: **HIDDEN**
- Quick Action: **Button style** (rectangular)
- Content padding-bottom: **0px**

```
Mobile (<768px)                Desktop (≥768px)
────────────────              ────────────────
                              ┌─ Header ─────┐
┌───────────────┐            │ Nav + Button  │
│               │            └───────────────┘
│   Content     │            ┌───────────────┐
│               │            │               │
│               │            │   Content     │
└───────────────┘            │               │
┌─ Bottom Nav ─┐            │               │
│  [FAB]        │            └───────────────┘
└───────────────┘
```

---

## Component Hierarchy

```
App Layout (dashboard)
├── AppHeader (Desktop ≥768px)
│   ├── Logo
│   ├── Navigation Links (4)
│   │   ├── Dashboard
│   │   ├── Transactions
│   │   ├── Budgets
│   │   └── Profile (with User icon)
│   ├── QuickActionButton (variant="desktop")
│   └── UserMenu
│
├── Main Content Area
│   └── Page Content (with bottom padding on mobile)
│
└── MainNav (Mobile <768px)
    ├── NavItem: Dashboard
    ├── NavItem: Transactions
    ├── QuickActionButton (variant="mobile")
    ├── NavItem: Budgets
    └── NavItem: Profile
```

---

## Color & Style Guide

### Desktop Quick Action Button
- **Background**: `bg-primary` (brand color)
- **Text**: `text-primary-foreground` (white/contrast)
- **Size**: `h-10` (40px height), `px-6` padding
- **Shadow**: `shadow`
- **Hover**: `opacity-90`

### Mobile Quick Action FAB
- **Shape**: `rounded-full` (perfect circle)
- **Size**: `h-14 w-14` (56px × 56px)
- **Position**: `absolute -top-4` (-16px above nav)
- **Background**: `bg-primary`
- **Shadow**: `shadow-lg` (elevated appearance)
- **Icon Size**: `h-7 w-7` (28px)
- **Hover**: `opacity-90`
- **Active**: `scale-95` (press feedback)

### Navigation Items
- **Active**: `text-primary`, underline indicator
- **Inactive**: `text-muted-foreground`
- **Hover**: `text-primary`, `bg-accent`
- **Icon Size**: `h-5 w-5` (20px)

---

## User Journey Examples

### Create a Transaction (Desktop)
1. User clicks "Add Transaction" button in header
2. Dialog opens with transaction form
3. User fills form and submits
4. Dialog closes, page refreshes with new transaction

### Create a Transaction (Mobile)
1. User taps elevated FAB button in center of nav
2. Dialog opens with transaction form
3. User fills form and submits
4. Dialog closes, page refreshes with new transaction

### Access Categories (Legacy URL)
1. User visits `/categories` (old URL)
2. Middleware intercepts request
3. Redirects to `/profile?tab=categories`
4. Profile page opens with Categories tab active
5. User clicks "View Full Categories Page" button
6. Navigates to full `/categories` page

### Browse Settings
1. User clicks "Profile" in navigation
2. Profile page opens (Overview tab by default)
3. User sees account info and quick links
4. User clicks "Categories" tab or quick link
5. Categories tab content displays with link to full page
6. URL updates to `/profile?tab=categories`

---

## Accessibility Navigation Tree

```
Main Navigation (role="navigation" aria-label="Main navigation")
├── Link: Dashboard (aria-current="page" when active)
├── Link: Transactions
├── Link: Budgets
├── Link: Profile (with User icon, aria-hidden="true" on icon)
├── Button: Add Transaction (type="button" aria-label="Add transaction")
└── Menu: User Menu

Tab Navigation (role="tablist")
├── Tab: Overview (role="tab" aria-selected="true/false")
├── Tab: Payment Methods
├── Tab: Categories
├── Tab: Tags
└── Tab: Preferences

Tab Panel (role="tabpanel" for each tab content)
```

---

## Key Design Principles

1. **Simplification**: Reduced from 6 to 4 main nav items
2. **Consolidation**: Settings grouped under Profile
3. **Prominence**: Quick Action button stands out visually
4. **Consistency**: Icons used consistently across mobile/desktop
5. **Accessibility**: Full keyboard navigation and screen reader support
6. **Progressive Enhancement**: FAB only on mobile where it's effective
7. **Backward Compatibility**: Legacy URLs redirect seamlessly

---

## Implementation Files Reference

### Core Navigation
- `/src/components/layout/app-header.tsx` - Desktop header (80 lines)
- `/src/components/layout/main-nav.tsx` - Mobile bottom nav (133 lines)
- `/src/components/layout/quick-action-button.tsx` - Quick Action button (58 lines)

### Profile Pages
- `/src/app/(dashboard)/profile/page.tsx` - Server Component (81 lines)
- `/src/app/(dashboard)/profile/profile-client.tsx` - Client Component (255 lines)

### Supporting Changes
- `/src/lib/supabase/middleware.ts` - Redirects (97 lines, added ~20 lines)
- `/src/components/transactions/create-transaction-dialog.tsx` - Children prop (1 line change)

### UI Components Used
- `@/components/ui/tabs` - Shadcn/UI Tabs (Radix UI)
- `@/components/ui/card` - Shadcn/UI Card
- `@/components/ui/button` - Shadcn/UI Button
- `@/components/ui/label` - Shadcn/UI Label

---

## Summary

This visual guide demonstrates the complete navigation restructuring implemented in Card #25. The changes create a cleaner, more intuitive navigation experience while maintaining full backward compatibility and accessibility standards.
