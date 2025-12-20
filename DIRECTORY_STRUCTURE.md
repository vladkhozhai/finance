# FinanceFlow Directory Structure Reference

This document provides a detailed breakdown of the project's directory structure with explanations for each directory and file's purpose.

## Visual Directory Tree

```
finance/
├── .claude/                            # Claude Code agent configurations
│   └── agents/                         # Agent role definitions
├── .git/                               # Git version control
├── .idea/                              # IDE configuration (WebStorm/IntelliJ)
├── .next/                              # Next.js build output (gitignored)
├── node_modules/                       # NPM dependencies (gitignored)
├── public/                             # Static assets served at root
│   ├── favicon.ico
│   └── images/                         # Public images
├── supabase/                           # Supabase project configuration
│   ├── .gitignore                      # Supabase-specific gitignore
│   ├── config.toml                     # Supabase CLI configuration
│   ├── seed.sql                        # Development seed data
│   └── migrations/                     # Database migrations (chronological)
│       ├── 20250101000001_initial_schema.sql
│       ├── 20250101000002_add_rls_policies.sql
│       └── 20250101000003_create_functions.sql
├── src/                                # Application source code
│   ├── app/                            # Next.js App Router
│   │   ├── favicon.ico                 # App favicon
│   │   ├── globals.css                 # Global CSS styles
│   │   ├── layout.tsx                  # Root layout (wraps all pages)
│   │   ├── page.tsx                    # Homepage route (/)
│   │   ├── (auth)/                     # Auth route group (no layout impact)
│   │   │   ├── login/
│   │   │   │   └── page.tsx           # Login page (/login)
│   │   │   └── signup/
│   │   │       └── page.tsx           # Signup page (/signup)
│   │   ├── (dashboard)/                # Protected dashboard routes
│   │   │   ├── layout.tsx             # Dashboard layout with sidebar
│   │   │   ├── page.tsx               # Dashboard home (/dashboard)
│   │   │   ├── transactions/
│   │   │   │   ├── page.tsx           # Transactions list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # Transaction detail (dynamic route)
│   │   │   ├── budgets/
│   │   │   │   ├── page.tsx           # Budgets list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # Budget detail
│   │   │   ├── categories/
│   │   │   │   └── page.tsx           # Categories management
│   │   │   └── tags/
│   │   │       └── page.tsx           # Tags management
│   │   ├── api/                        # API routes (if needed)
│   │   │   └── webhooks/
│   │   │       └── supabase/
│   │   │           └── route.ts       # Supabase webhooks handler
│   │   └── actions/                    # Server Actions (data mutations)
│   │       ├── transactions.ts         # Transaction CRUD operations
│   │       ├── budgets.ts             # Budget CRUD operations
│   │       ├── categories.ts          # Category CRUD operations
│   │       ├── tags.ts                # Tag CRUD operations
│   │       └── profiles.ts            # Profile management
│   ├── components/                     # React components
│   │   ├── ui/                        # Shadcn/UI primitives (Radix wrappers)
│   │   │   ├── button.tsx             # Button component
│   │   │   ├── card.tsx               # Card component
│   │   │   ├── dialog.tsx             # Modal dialog
│   │   │   ├── dropdown-menu.tsx      # Dropdown menu
│   │   │   ├── form.tsx               # Form wrapper (react-hook-form)
│   │   │   ├── input.tsx              # Text input
│   │   │   ├── label.tsx              # Form label
│   │   │   ├── progress.tsx           # Progress bar (for budgets)
│   │   │   ├── select.tsx             # Select dropdown
│   │   │   └── toast.tsx              # Toast notification
│   │   ├── features/                  # Feature-specific components
│   │   │   ├── transactions/
│   │   │   │   ├── transaction-form.tsx    # Create/edit transaction
│   │   │   │   ├── transaction-list.tsx    # Transaction list view
│   │   │   │   └── transaction-card.tsx    # Single transaction card
│   │   │   ├── budgets/
│   │   │   │   ├── budget-card.tsx         # Budget card with progress
│   │   │   │   ├── budget-form.tsx         # Create/edit budget
│   │   │   │   ├── budget-progress.tsx     # Progress bar component
│   │   │   │   └── budget-list.tsx         # Budget list view
│   │   │   ├── categories/
│   │   │   │   ├── category-select.tsx     # Category dropdown
│   │   │   │   ├── category-badge.tsx      # Category badge with color
│   │   │   │   └── category-form.tsx       # Create/edit category
│   │   │   ├── tags/
│   │   │   │   ├── tag-input.tsx          # Multi-select tag input
│   │   │   │   ├── tag-badge.tsx          # Tag badge
│   │   │   │   └── tag-form.tsx           # Create/edit tag
│   │   │   ├── dashboard/
│   │   │   │   ├── balance-summary.tsx     # Total balance widget
│   │   │   │   ├── active-budgets.tsx      # Active budgets section
│   │   │   │   └── expense-chart.tsx       # Expense breakdown chart
│   │   │   └── auth/
│   │   │       ├── login-form.tsx          # Login form
│   │   │       └── signup-form.tsx         # Signup form
│   │   ├── layout/                    # Layout components
│   │   │   ├── header.tsx             # App header
│   │   │   ├── sidebar.tsx            # Dashboard sidebar
│   │   │   └── nav.tsx                # Navigation menu
│   │   └── providers/                 # React context providers
│   │       ├── auth-provider.tsx      # Auth state management
│   │       └── toast-provider.tsx     # Toast notifications
│   ├── lib/                           # Utilities and configurations
│   │   ├── supabase/                  # Supabase client instances
│   │   │   ├── client.ts              # Browser client (Client Components)
│   │   │   ├── server.ts              # Server client (Server Components)
│   │   │   └── middleware.ts          # Middleware client (auth)
│   │   ├── utils/                     # Utility functions
│   │   │   ├── cn.ts                  # className utility (clsx)
│   │   │   ├── currency.ts            # Currency formatting
│   │   │   ├── date.ts                # Date formatting
│   │   │   └── calculations.ts        # Budget/transaction calculations
│   │   ├── validations/               # Zod validation schemas
│   │   │   ├── transaction.ts         # Transaction schema
│   │   │   ├── budget.ts              # Budget schema
│   │   │   ├── category.ts            # Category schema
│   │   │   ├── tag.ts                 # Tag schema
│   │   │   └── profile.ts             # Profile schema
│   │   ├── constants/                 # Application constants
│   │   │   ├── routes.ts              # Route path constants
│   │   │   ├── colors.ts              # Category color options
│   │   │   └── currencies.ts          # Supported currencies
│   │   └── hooks/                     # Custom React hooks
│   │       ├── use-user.ts            # Get current authenticated user
│   │       ├── use-transactions.ts    # Transaction queries
│   │       ├── use-budgets.ts         # Budget queries
│   │       └── use-toast.ts           # Toast notifications
│   └── types/                         # TypeScript type definitions
│       ├── database.types.ts          # Generated from Supabase schema
│       ├── supabase.ts                # Supabase client types
│       └── index.ts                   # Shared application types
├── .env.local                         # Local environment variables (gitignored)
├── .env.example                       # Environment template (tracked)
├── .gitignore                         # Git ignore rules
├── ARCHITECTURE.md                    # Architecture documentation (this file)
├── CLAUDE.md                          # Claude Code instructions
├── DIRECTORY_STRUCTURE.md             # This directory reference
├── PRD.md                             # Product Requirements Document
├── README.md                          # Project README
├── biome.json                         # Biome linter/formatter config
├── middleware.ts                      # Next.js middleware (auth checks)
├── next-env.d.ts                      # Next.js TypeScript declarations
├── next.config.ts                     # Next.js configuration
├── package.json                       # NPM dependencies and scripts
├── package-lock.json                  # NPM lock file
├── postcss.config.mjs                 # PostCSS configuration (Tailwind)
└── tsconfig.json                      # TypeScript configuration
```

## Directory Purpose Guide

### Root Level

#### Configuration Files
- **`.env.local`**: Local environment variables (never commit)
- **`.env.example`**: Environment template for developers
- **`.gitignore`**: Files/directories excluded from Git
- **`biome.json`**: Biome linter and formatter configuration
- **`next.config.ts`**: Next.js framework configuration
- **`tsconfig.json`**: TypeScript compiler options
- **`postcss.config.mjs`**: PostCSS configuration for Tailwind CSS
- **`package.json`**: Project metadata and dependencies
- **`middleware.ts`**: Next.js middleware for auth and route protection

#### Documentation
- **`README.md`**: Project overview and setup instructions
- **`PRD.md`**: Product Requirements Document
- **`CLAUDE.md`**: Instructions for Claude Code AI assistant
- **`ARCHITECTURE.md`**: System architecture and design decisions
- **`DIRECTORY_STRUCTURE.md`**: This file - directory reference

### `/supabase/` - Database and Backend

**Purpose**: Supabase project configuration, migrations, and seed data

#### Key Files
- **`config.toml`**: Supabase CLI configuration (project settings, API ports)
- **`seed.sql`**: Development seed data (test users, categories, transactions)

#### `/supabase/migrations/`
**Purpose**: Database schema migrations in chronological order
**Naming**: `YYYYMMDDHHMMSS_description.sql` (timestamp-based ordering)

**Files**:
- `20250101000001_initial_schema.sql` - Create all tables
- `20250101000002_add_rls_policies.sql` - Enable RLS and create policies
- `20250101000003_create_functions.sql` - SQL functions for calculations

### `/src/app/` - Next.js App Router

**Purpose**: Application routes, layouts, and Server Actions

#### Route Structure
- **`layout.tsx`**: Root layout (applied to all pages)
- **`page.tsx`**: Route page component
- **`(group)/`**: Route group (doesn't affect URL structure)
- **`[id]/`**: Dynamic route segment

#### Route Groups Explained
- **`(auth)/`**: Authentication routes (login, signup) - no dashboard layout
- **`(dashboard)/`**: Protected routes requiring authentication - shared sidebar layout

#### `/src/app/actions/`
**Purpose**: Server Actions for data mutations (CREATE, UPDATE, DELETE)

**Pattern**:
```typescript
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTransaction(formData: FormData) {
  const supabase = await createServerClient()
  // ... mutation logic
  revalidatePath('/transactions') // Refresh cached data
}
```

**Files**:
- `transactions.ts` - CRUD for transactions
- `budgets.ts` - CRUD for budgets
- `categories.ts` - CRUD for categories
- `tags.ts` - CRUD for tags
- `profiles.ts` - User profile management

### `/src/components/` - React Components

#### `/src/components/ui/` - UI Primitives
**Purpose**: Reusable Shadcn/UI components (Radix UI wrappers)
**Source**: Installed via `npx shadcn-ui@latest add [component]`
**Convention**: Lower-case-kebab naming, minimal customization

**Common Components**:
- `button.tsx` - Button with variants (default, outline, ghost)
- `card.tsx` - Card container with header/content/footer
- `dialog.tsx` - Modal dialog (uses Radix Dialog)
- `form.tsx` - Form wrapper (react-hook-form integration)
- `input.tsx` - Text input field
- `select.tsx` - Dropdown select
- `progress.tsx` - Progress bar (for budget visualization)
- `toast.tsx` - Toast notification system

#### `/src/components/features/` - Feature Components
**Purpose**: Business logic components organized by domain
**Pattern**: Grouped by feature (transactions/, budgets/, tags/, etc.)

**Organization**:
- Each feature has its own directory
- Components are composed using `/ui/` primitives
- Contains form components, list views, detail views

**Example Feature Directory** (`/features/transactions/`):
- `transaction-form.tsx` - Form for creating/editing transactions
- `transaction-list.tsx` - List view of transactions
- `transaction-card.tsx` - Individual transaction display card

#### `/src/components/layout/` - Layout Components
**Purpose**: App-wide layout components (header, sidebar, navigation)

**Files**:
- `header.tsx` - Top header with logo and user menu
- `sidebar.tsx` - Dashboard sidebar navigation
- `nav.tsx` - Navigation menu component

#### `/src/components/providers/` - Context Providers
**Purpose**: React Context providers for global state

**Files**:
- `auth-provider.tsx` - Authentication state management
- `toast-provider.tsx` - Toast notification system

### `/src/lib/` - Utilities and Configurations

#### `/src/lib/supabase/` - Supabase Clients
**Purpose**: Supabase client instances for different execution contexts

**Files**:
- **`client.ts`**: Browser client for Client Components
- **`server.ts`**: Server client for Server Components and Server Actions
- **`middleware.ts`**: Middleware client for auth verification

**Usage Rules**:
- Client Components: Use `client.ts`
- Server Components: Use `server.ts`
- Server Actions: Use `server.ts`
- Middleware: Use `middleware.ts`

#### `/src/lib/utils/` - Utility Functions
**Purpose**: Reusable helper functions

**Files**:
- `cn.ts` - className utility (combines clsx and tailwind-merge)
- `currency.ts` - Format amounts as currency strings
- `date.ts` - Date formatting and manipulation
- `calculations.ts` - Budget spent calculations, balance totals

#### `/src/lib/validations/` - Zod Schemas
**Purpose**: Type-safe validation schemas using Zod

**Pattern**: One schema file per resource
**Usage**: Validate user input in Server Actions before database operations

**Example** (`transaction.ts`):
```typescript
import { z } from 'zod'

export const transactionSchema = z.object({
  category_id: z.string().uuid(),
  amount: z.number().positive(),
  date: z.string().date(),
  description: z.string().optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
})

export type TransactionInput = z.infer<typeof transactionSchema>
```

#### `/src/lib/constants/` - Application Constants
**Purpose**: Centralized constant values

**Files**:
- `routes.ts` - Route path constants (avoid hardcoded strings)
- `colors.ts` - Predefined category color options
- `currencies.ts` - Supported currency codes and symbols

#### `/src/lib/hooks/` - Custom React Hooks
**Purpose**: Reusable React hooks for common operations

**Files**:
- `use-user.ts` - Get current authenticated user
- `use-transactions.ts` - Fetch and manage transactions
- `use-budgets.ts` - Fetch and manage budgets
- `use-toast.ts` - Show toast notifications

### `/src/types/` - TypeScript Types

**Purpose**: Type definitions and interfaces

**Files**:
- **`database.types.ts`**: Auto-generated from Supabase schema (DO NOT EDIT MANUALLY)
- **`supabase.ts`**: Supabase client type definitions
- **`index.ts`**: Application-level types and interfaces

**Type Organization**:
```typescript
// database.types.ts - Generated by Supabase CLI
export interface Database { ... }

// index.ts - Application types derived from database types
import type { Database } from './database.types'

export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update']
```

## File Naming Conventions

### React Components
- **UI Components**: `lower-case-kebab.tsx` (e.g., `button.tsx`, `dropdown-menu.tsx`)
- **Feature Components**: `lower-case-kebab.tsx` (e.g., `transaction-form.tsx`)
- **Page Components**: `page.tsx` (Next.js convention)
- **Layout Components**: `layout.tsx` (Next.js convention)

### TypeScript Files
- **Utilities**: `lower-case-kebab.ts` (e.g., `currency.ts`, `date.ts`)
- **Server Actions**: `lower-case-kebab.ts` (e.g., `transactions.ts`, `budgets.ts`)
- **Types**: `lower-case-kebab.types.ts` (e.g., `database.types.ts`)
- **Hooks**: `use-lower-case-kebab.ts` (e.g., `use-user.ts`, `use-transactions.ts`)

### SQL Files
- **Migrations**: `YYYYMMDDHHMMSS_snake_case.sql` (e.g., `20250101000001_initial_schema.sql`)
- **Seed Data**: `seed.sql`

## Import Path Aliases

**Configured in `tsconfig.json`**:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Usage Examples**:
```typescript
// Import components
import { Button } from '@/components/ui/button'
import { TransactionForm } from '@/components/features/transactions/transaction-form'

// Import utilities
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/currency'

// Import Supabase clients
import { createClient } from '@/lib/supabase/client'
import { createServerClient } from '@/lib/supabase/server'

// Import types
import type { Transaction, Category } from '@/types'

// Import Server Actions
import { createTransaction } from '@/app/actions/transactions'
```

## Git-Ignored Directories

These directories are automatically generated and should NOT be committed:

- **`.next/`**: Next.js build output
- **`node_modules/`**: NPM dependencies
- **`.env.local`**: Local environment variables (contains secrets)
- **`.idea/`**: IDE-specific settings (if not shared with team)
- **`supabase/.temp/`**: Temporary Supabase files

**Always commit**:
- `.env.example` - Environment template
- `supabase/config.toml` - Supabase configuration
- `supabase/migrations/` - Database migrations
- All source code in `/src/`

## Next Steps for Developers

### Backend Developer (Agent 03)
1. Create `/src/lib/supabase/` client files
2. Create `/src/app/actions/` Server Action files
3. Create `/src/lib/validations/` Zod schemas
4. Set up Supabase migrations in `/supabase/migrations/`

### Frontend Developer (Agent 04)
1. Install and configure Shadcn/UI components in `/src/components/ui/`
2. Create feature components in `/src/components/features/`
3. Create layout components in `/src/components/layout/`
4. Build pages in `/src/app/` using App Router

### System Architect (Agent 02)
1. Write database migrations in `/supabase/migrations/`
2. Generate TypeScript types: `npx supabase gen types typescript`
3. Create seed data in `/supabase/seed.sql`
4. Document RLS policies and SQL functions

---

**Document Version**: 1.0
**Last Updated**: 2025-12-09
**Maintained By**: System Architect Agent