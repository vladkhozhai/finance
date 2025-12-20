# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FinanceFlow** - A personal finance management web application built with Next.js and Supabase. The system enables comprehensive expense tracking with flexible categorization using tags and budget planning with visual progress monitoring.

### Key Features (MVP Scope)
- **Categorization & Tagging**: Transactions have one category (e.g., Food, Home) and multiple flexible tags (e.g., #coffee, #travel)
- **Budgeting**: Set monthly spending limits per category or tag with visual progress bars and overspending indicators
- **Transaction Management**: Create income/expense entries with date, amount, description, category selection, and multi-tag assignment
- **Dashboard & Analytics**: Overall balance, active budget tracking with progress bars, expense breakdown by category

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS v4, Shadcn/UI components, Radix UI primitives, Lucide React icons
- **Charts**: Recharts for budget visualization
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Data Mutations**: Next.js Server Actions with Row Level Security (RLS)
- **Linting/Formatting**: Biome (with Next.js and React domain rules enabled)

## Database Schema

### Core Tables
1. **profiles** - Extends auth.users with `currency` field
2. **categories** - `user_id`, `name`, `color`, `type` (expense/income)
3. **tags** - `user_id`, `name` (unique per user) for flexible labeling
4. **transactions** - `user_id`, `category_id` (FK), `amount`, `date`, `description`
5. **transaction_tags** - Junction table: `transaction_id`, `tag_id` (many-to-many)
6. **budgets** - `user_id`, `category_id` (nullable), `tag_id` (nullable), `amount`, `period` (monthly)
   - Constraint: Either `category_id` OR `tag_id` must be set (not both)

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Production build
npm build

# Start production server
npm start

# Lint and check code quality
npm run lint

# Format code
npm run format
```

## Project Structure

- **src/app/** - Next.js App Router pages and layouts
  - `layout.tsx` - Root layout with Geist fonts (sans & mono)
  - `page.tsx` - Homepage
  - `globals.css` - Global Tailwind styles
- **tsconfig.json** - TypeScript configuration with path alias `@/*` → `./src/*`
- **biome.json** - Biome linter/formatter config (2-space indents, auto-organize imports)
- **next.config.ts** - Next.js configuration

## Code Conventions

- Use TypeScript strict mode for all code
- Follow Biome's recommended rules for Next.js and React
- Path imports: Use `@/` alias for src directory imports (e.g., `@/components/...`)
- Formatting: 2-space indentation, automatic import organization
- Component patterns: Follow Next.js App Router conventions (Server Components by default, explicit "use client" when needed)

## UI/UX Components to Implement

- **Budget Card**: Displays category/tag name, limit amount, spent amount (calculated dynamically), and progress bar with color indicators (red for >100% overspending)
- **Tag Input**: Multi-select combobox allowing selection of existing tags or on-the-fly creation ("Create 'NewTag'")
- **Transaction Form**: Category dropdown + multi-tag selector + amount/date/description fields
- **Dashboard Layout**: Balance summary + Active budgets section + Category expense chart

## Important Architecture Notes

- **Server Actions**: Use for all data mutations (create/update/delete operations)
- **RLS Policies**: Ensure all Supabase tables have proper Row Level Security policies for user data isolation
- **Budget Calculation**: Spent amounts are calculated dynamically by summing transactions filtered by budget's category_id or tag_id within the period
- **Tag Flexibility**: Tags are user-created and reusable across transactions for flexible expense classification beyond rigid categories