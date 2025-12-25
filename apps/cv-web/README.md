# CVFlow - Professional CV Generator

A modern web application for creating, managing, and exporting professional CVs/resumes. Built with Next.js 15, Supabase, and React PDF.

## Features

- **User Authentication** - Secure sign-up, sign-in, and password reset via Supabase Auth
- **Profile Management** - Comprehensive forms for all CV sections:
  - Personal Information & Contact Details
  - Social Links (LinkedIn, GitHub, etc.)
  - Work Experience with achievements
  - Education history
  - Skills with proficiency levels
  - Projects with technologies
  - Certifications
  - Languages
- **CV Templates** - Three professional templates:
  - **Modern** - Two-column layout with blue accents
  - **Professional** - Traditional single-column, formal style
  - **Creative** - Colorful design with gradient header
- **PDF Export** - High-quality PDF generation with proper formatting
- **Real-time Preview** - See changes instantly as you edit
- **Mobile Responsive** - Full mobile support with hamburger navigation

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4, Shadcn/UI components
- **Backend**: Supabase (PostgreSQL, Auth)
- **PDF Generation**: @react-pdf/renderer
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

## Project Structure

```
apps/cv-web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Main dashboard
│   │   ├── profile/            # Profile editing sections
│   │   │   ├── personal/       # Personal info
│   │   │   ├── experience/     # Work experience
│   │   │   ├── education/      # Education
│   │   │   ├── skills/         # Skills
│   │   │   ├── projects/       # Projects
│   │   │   ├── certifications/ # Certifications
│   │   │   ├── languages/      # Languages
│   │   │   └── social/         # Social links
│   │   ├── cv/
│   │   │   ├── preview/        # CV preview with zoom
│   │   │   └── templates/      # Template selection
│   │   ├── api/cv/pdf/         # PDF generation API
│   │   ├── sign-in/            # Authentication
│   │   ├── sign-up/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   │
│   ├── components/
│   │   ├── ui/                 # Shadcn/UI components
│   │   ├── cv-templates/       # Web preview templates
│   │   └── cv-pdf-templates/   # PDF export templates
│   │
│   ├── actions/                # Server Actions
│   ├── lib/                    # Utilities & Supabase client
│   └── types/                  # TypeScript types
│
└── public/                     # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase account (or local Supabase instance)

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

```bash
# From the monorepo root
pnpm install

# Run development server
pnpm dev

# Or run only cv-web
cd apps/cv-web
pnpm dev
```

The app will be available at `http://localhost:3001` (or next available port).

### Build

```bash
# Build all apps
pnpm build

# Build only cv-web
cd apps/cv-web
pnpm build
```

## Database Schema

CVFlow uses the following Supabase tables (all prefixed with `cv_`):

| Table | Description |
|-------|-------------|
| `cv_profiles` | Personal information (name, title, summary) |
| `cv_social_links` | Social media and portfolio links |
| `cv_work_experiences` | Work history with achievements |
| `cv_education` | Education history |
| `cv_skills` | Skills with proficiency levels |
| `cv_projects` | Project portfolio |
| `cv_certifications` | Professional certifications |
| `cv_languages` | Language proficiencies |
| `cv_templates` | Available CV templates |
| `cv_user_settings` | User preferences (selected template) |

All tables have Row Level Security (RLS) policies ensuring users can only access their own data.

## API Routes

### PDF Generation

```
GET /api/cv/pdf?template=modern|professional|creative
```

Returns a PDF file of the user's CV using the specified template.

## Key Components

### CV Templates

Located in `src/components/cv-templates/`:
- `ModernTemplate.tsx` - Web preview for modern style
- `ProfessionalTemplate.tsx` - Web preview for professional style
- `CreativeTemplate.tsx` - Web preview for creative style

### PDF Templates

Located in `src/components/cv-pdf-templates/`:
- `ModernPDF.tsx` - PDF export for modern style
- `ProfessionalPDF.tsx` - PDF export for professional style
- `CreativePDF.tsx` - PDF export for creative style

### Server Actions

Located in `src/actions/`:
- `profile.ts` - Profile CRUD operations
- `cv-preview.ts` - Template and CV data fetching
- `auth.ts` - Authentication actions

## Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation support
- ARIA labels on interactive elements
- Focus indicators
- Screen reader friendly

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Ensure build passes: `pnpm build`
4. Create a pull request

## License

Private - All rights reserved
