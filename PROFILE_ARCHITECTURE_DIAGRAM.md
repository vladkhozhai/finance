# Profile Section Architecture Diagram

## Visual Layout (Desktop)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Profile & Settings                            │
├─────────────────┬───────────────────────────────────────────────────┤
│                 │                                                     │
│  📊 Overview    │  Overview Page                                     │
│                 │  ┌──────────────────────────────────────────┐     │
│  💳 Payment     │  │ Account Information Card                 │     │
│     Methods     │  │ - Email, Currency, Account Age           │     │
│                 │  └──────────────────────────────────────────┘     │
│  📁 Categories  │                                                     │
│                 │  ┌──────────────────────────────────────────┐     │
│  🏷️  Tags       │  │ Statistics Cards (Grid)                  │     │
│                 │  │ - Total Balance                          │     │
│  ⚙️  Preferences│  │ - Total Transactions                     │     │
│                 │  │ - Categories Count                       │     │
│                 │  │ - Tags Count                             │     │
│                 │  │ - Active Budgets                         │     │
│                 │  └──────────────────────────────────────────┘     │
│                 │                                                     │
│  [Active: Left  │  ┌──────────────────────────────────────────┐     │
│   border-l-4    │  │ Quick Actions                            │     │
│   in primary]   │  │ - Manage Payment Methods →               │     │
│                 │  │ - Organize Categories →                  │     │
│                 │  │ - Manage Tags →                          │     │
│                 │  │ - Change Preferences →                   │     │
│                 │  └──────────────────────────────────────────┘     │
│                 │                                                     │
└─────────────────┴───────────────────────────────────────────────────┘
    240px wide         Flexible content area (flex-1)
```

## Route Structure

```
/profile
  ├── page.tsx (redirects to /overview)
  ├── layout.tsx (wraps all with sidebar)
  │
  ├── /overview
  │   └── page.tsx (Account info + Statistics + Quick actions)
  │
  ├── /payment-methods
  │   └── page.tsx (Embedded payment methods management)
  │
  ├── /categories
  │   └── page.tsx (Embedded categories management)
  │
  ├── /tags
  │   └── page.tsx (Embedded tags management)
  │
  └── /preferences
      ├── page.tsx (Server component wrapper)
      └── preferences-form.tsx (Client form component)
```

## Component Hierarchy

```
ProfileLayout (Server Component)
  ├── ProfileSidebar (Client Component)
  │   ├── Desktop: Fixed sidebar with nav items
  │   └── Mobile: Sheet/Drawer with hamburger menu
  │
  └── <children> (Page content)
      ├── OverviewPage (Server Component)
      │   ├── User info card
      │   ├── Statistics cards
      │   └── Quick action links
      │
      ├── PaymentMethodsPage (Server Component)
      │   └── PaymentMethodsClient
      │
      ├── CategoriesPage (Server Component)
      │   └── CategoryList
      │
      ├── TagsPage (Server Component)
      │   └── TagList
      │
      └── PreferencesPage (Server Component)
          └── PreferencesForm (Client Component)
              ├── Currency selector
              ├── Future settings
              └── Save button
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      User navigates to                          │
│                   /profile/preferences                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              PreferencesPage (Server Component)                 │
│  1. Checks authentication (redirect if needed)                  │
│  2. Fetches profile from Supabase                               │
│  3. Passes currentCurrency to PreferencesForm                   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│            PreferencesForm (Client Component)                   │
│  1. User selects new currency                                   │
│  2. Submits form                                                │
│  3. Calls updatePreferences() Server Action                     │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│         updatePreferences() Server Action                       │
│  1. Validates input with Zod                                    │
│  2. Checks authentication                                       │
│  3. Updates profiles table in Supabase                          │
│  4. Revalidates cache                                           │
│  5. Returns success/error                                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Client Component                                │
│  1. Shows success toast                                         │
│  2. Refreshes router to update UI                               │
└─────────────────────────────────────────────────────────────────┘
```

## Navigation Flow

```
Old Route (Query Params)          New Route (Nested)
─────────────────────────────────────────────────────
/profile                     →    /profile/overview
/profile?tab=overview        →    /profile/overview
/profile?tab=payment-methods →    /profile/payment-methods
/profile?tab=categories      →    /profile/categories
/profile?tab=tags            →    /profile/tags
/profile?tab=preferences     →    /profile/preferences
```

## Mobile Layout

```
┌─────────────────────────────────────┐
│  ☰  Profile & Settings              │  ← Hamburger menu opens Sheet
├─────────────────────────────────────┤
│                                     │
│  [Content Area - Full Width]       │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Page Content                  │ │
│  │                               │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘

When ☰ clicked:
┌─────────────────────────────────────┐
│  Profile & Settings          [×]    │
├─────────────────────────────────────┤
│                                     │
│  📊 Overview                        │
│  💳 Payment Methods                 │
│  📁 Categories                      │
│  🏷️  Tags                           │
│  ⚙️  Preferences                    │
│                                     │
└─────────────────────────────────────┘
     Sheet slides in from left
     Closes on navigation or [×]
```

## State Management

### Server State
- **Profile data:** Fetched in Server Components via Supabase
- **Statistics:** Calculated server-side in Overview page
- **Payment methods, Categories, Tags:** Fetched in respective pages

### Client State
- **Sidebar open/closed:** useState in ProfileSidebar (mobile only)
- **Form state:** React Hook Form in PreferencesForm
- **Active route:** usePathname() for highlighting

### Cache Revalidation
```typescript
// After successful preference update
revalidatePath("/profile/overview");
revalidatePath("/profile/preferences");
revalidatePath("/", "layout");
```

## Component Responsibilities

### ProfileSidebar
- **Display:** Navigation items with icons
- **Active state:** Highlight current route
- **Responsive:** Fixed on desktop, Sheet on mobile
- **Accessibility:** ARIA labels, semantic nav

### ProfileLayout
- **Structure:** Flex container with sidebar + content
- **Wrapping:** All profile pages
- **Styling:** Consistent spacing and layout

### OverviewPage
- **Data fetching:** User info, statistics from Supabase
- **Display:** Account cards, stats grid, quick actions
- **Server-side:** Fully rendered on server

### PreferencesForm
- **Form management:** React Hook Form + Zod
- **Validation:** Client-side validation before submit
- **Server Action:** Calls updatePreferences()
- **Feedback:** Toast notifications for success/error

## Files Created

```
src/
├── app/(dashboard)/profile/
│   ├── layout.tsx                     # Profile layout with sidebar
│   ├── page.tsx                       # Redirects to /overview
│   ├── overview/
│   │   └── page.tsx                  # Overview page with stats
│   ├── payment-methods/
│   │   └── page.tsx                  # Embedded payment methods
│   ├── categories/
│   │   └── page.tsx                  # Embedded categories
│   ├── tags/
│   │   └── page.tsx                  # Embedded tags
│   └── preferences/
│       ├── page.tsx                  # Preferences server wrapper
│       └── preferences-form.tsx      # Preferences form client
│
├── components/profile/
│   └── profile-sidebar.tsx           # Sidebar navigation component
│
└── app/actions/
    └── profile.ts                    # Profile server actions
```

## Technical Decisions

### Why Nested Routes?
- **SEO friendly:** Better URL structure
- **Shareable:** Users can bookmark specific sections
- **Navigation:** Browser back/forward works correctly
- **Modern:** Aligns with Next.js App Router conventions

### Why Vertical Sidebar?
- **Space efficient:** More vertical space for content
- **Familiar pattern:** Common in dashboard UIs
- **Scalable:** Easy to add more nav items
- **Mobile friendly:** Drawer pattern is standard

### Why Server Components?
- **Performance:** Reduce client-side JavaScript
- **Data fetching:** Fetch data close to database
- **SEO:** Fully rendered HTML on server
- **Type safety:** TypeScript across client/server boundary

### Why Client Components Only When Needed?
- **PreferencesForm:** Needs React Hook Form and form state
- **ProfileSidebar:** Needs usePathname() and Sheet state
- **Everything else:** Can be Server Components

---

**Architecture Version:** 2.0
**Last Updated:** 2025-12-19
