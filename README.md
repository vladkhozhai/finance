# FinanceFlow

A modern personal finance management web application built with Next.js and Supabase. Track expenses, manage budgets, and take control of your finances with an intuitive interface and powerful features.

![Next.js](https://img.shields.io/badge/Next.js-16+-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Latest-green?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwind-css)

## ✨ Features

- **📊 Transaction Management** - Track income and expenses with detailed categorization
- **🏷️ Flexible Tagging** - Add multiple tags to transactions for granular organization
- **💰 Budget Planning** - Set monthly spending limits per category or tag
- **📈 Visual Analytics** - Interactive charts and progress bars for budget tracking
- **🔒 Secure Authentication** - Built-in user authentication with Supabase Auth
- **⚡ Real-time Updates** - Instant data synchronization across devices
- **🎨 Modern UI** - Beautiful interface with Shadcn/UI components

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Docker Desktop installed and running
- Supabase CLI installed (automatic via script)

### Setup in 3 Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start Supabase and apply schema**
   ```bash
   # Make sure Docker Desktop is running first!
   ./scripts/setup-supabase.sh
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

Visit http://localhost:3000 and you're ready to go! 🎉

> **Tip**: Access Supabase Studio at http://127.0.0.1:54323 to create test users and view data.

## 📚 Documentation

- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Comprehensive setup guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture overview
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Code patterns and best practices
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Detailed Supabase configuration
- **[PRD.md](./PRD.md)** - Product Requirements Document

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn/UI, Radix UI primitives
- **Icons**: Lucide React
- **Charts**: Recharts

### Backend
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **API**: Next.js Server Actions
- **Validation**: Zod schemas

### Development
- **Linter/Formatter**: Biome
- **Type Safety**: TypeScript strict mode
- **Local DB**: Supabase CLI + Docker

## 📊 Database Schema

```
profiles          → User settings and preferences
categories        → Transaction categories (Food, Transport, etc.)
tags              → Flexible tags for detailed classification
transactions      → Income and expense records
transaction_tags  → Many-to-many relationship (transactions ↔ tags)
budgets           → Monthly spending limits per category or tag
```

All tables protected with Row Level Security (RLS) policies.

## 🏗️ Project Structure

```
src/
├── app/
│   ├── actions/              # Server Actions (CRUD operations)
│   ├── (auth)/              # Authentication pages
│   └── (dashboard)/         # Protected dashboard pages
├── components/
│   ├── ui/                  # Shadcn/UI primitives
│   ├── features/            # Feature-specific components
│   ├── layout/              # Layout components
│   └── providers/           # React Context providers
├── lib/
│   ├── supabase/            # Supabase clients
│   ├── validations/         # Zod validation schemas
│   ├── hooks/               # Custom React hooks
│   └── utils.ts             # Utility functions
└── types/
    └── database.types.ts    # Generated database types
```

## 🧑‍💻 Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Check code with Biome
npm run format       # Format code with Biome

# Database
supabase start       # Start local Supabase
supabase stop        # Stop local Supabase
supabase db reset    # Reset DB and apply migrations
```

### Making Database Changes

1. Create migration:
   ```bash
   supabase migration new add_new_column
   ```

2. Edit migration file in `supabase/migrations/`

3. Apply migration:
   ```bash
   supabase db reset
   ```

4. Regenerate types:
   ```bash
   supabase gen types typescript --local > src/types/database.types.ts
   ```

## 🔐 Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note**: The setup script automatically populates these values.

## 🧪 Testing

Create a test user via Supabase Studio:

1. Open http://127.0.0.1:54323
2. Go to **Authentication** → **Users**
3. Click **Add user**
4. Enter email and password
5. User is auto-confirmed in local dev

Sample seed data is automatically loaded with categories, tags, transactions, and budgets.

## 📦 Key Dependencies

- `next` - React framework
- `react` - UI library
- `@supabase/supabase-js` - Supabase client
- `@supabase/ssr` - Server-side rendering utilities
- `zod` - Schema validation
- `react-hook-form` - Form handling
- `recharts` - Data visualization
- `lucide-react` - Icon library
- `tailwindcss` - Utility-first CSS
- `date-fns` - Date manipulation

## 🏛️ Architecture Highlights

- **Server Components First** - Leverage Next.js App Router with Server Components by default
- **Server Actions** - All data mutations go through Server Actions with RLS
- **Type Safety** - End-to-end type safety with TypeScript and generated database types
- **Security** - Row Level Security (RLS) on all tables ensures data isolation
- **Performance** - Optimistic updates, caching, and minimal client-side JavaScript

## 🤝 Contributing

This is a personal project, but contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📝 License

MIT License - feel free to use this project for learning or as a starting point for your own finance tracker.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - React framework
- [Supabase](https://supabase.com) - Backend platform
- [Shadcn/UI](https://ui.shadcn.com) - UI component library
- [Vercel](https://vercel.com) - Hosting and deployment

---

**Built with ❤️ using Next.js and Supabase**

For detailed setup instructions, see [GETTING_STARTED.md](./GETTING_STARTED.md)