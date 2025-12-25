# Project Name: CVFlow - Professional CV Generator

## 1. General Overview

CVFlow is a modern web application for creating, managing, and exporting professional CVs/resumes. The platform enables users to build comprehensive professional profiles with multiple customizable templates and PDF export functionality. Future expansion includes React Native mobile applications for on-the-go CV management.

## 2. Tech Stack

### Phase 1: Web Application
- **Framework:** Next.js 16+ (App Router)
- **Language:** TypeScript (strict mode enabled)
- **Styling:** Tailwind CSS v4
- **UI Components:** Shadcn/UI (base), Radix UI (primitives), Lucide React (icons)
- **Backend/DB:** Supabase (PostgreSQL, Auth, Storage)
- **PDF Generation:** react-pdf or @react-pdf/renderer
- **Data Mutations:** Next.js Server Actions with Row Level Security (RLS)
- **Linting/Formatting:** Biome (with Next.js and React domain rules enabled)

### Phase 2: Mobile Application (Future)
- **Framework:** Expo SDK 52+ with React Native 0.76+
- **Router:** Expo Router
- **Shared Packages:** @platform/ui, @platform/supabase, @platform/types, @platform/utils, @platform/hooks

### Monorepo Structure
- Leverages existing Turborepo setup
- Reuses shared packages from FinanceFlow
- Application path: `apps/cv-web/`
- Future mobile app: `apps/cv-mobile/`

## 3. Functional Requirements (MVP)

### 3.1. Authentication & User Management
- **Sign Up / Sign In:** Email + password authentication via Supabase Auth
- **Email Verification:** Confirm email before full access
- **Password Reset:** Secure password recovery flow
- **Profile Settings:** User can update email, password, and basic preferences
- **Multi-tenant:** Each user has isolated data (enforced via RLS)

### 3.2. Profile Data Management

#### 3.2.1. Personal Information
- **Full Name:** First name, last name, optional middle name
- **Contact Details:** Email, phone, address (street, city, state/province, country, postal code)
- **Professional Title:** Current job title or desired position
- **Professional Summary:** Multi-line text describing career objectives and highlights
- **Photo Upload:** Optional profile picture (stored in Supabase Storage)
- **Social Links:** LinkedIn, GitHub, Portfolio website, Twitter, etc. (optional, multiple)

#### 3.2.2. Work Experience
- **Company Name:** Name of employer
- **Job Title:** Position held
- **Employment Type:** Full-time, Part-time, Contract, Freelance, Internship
- **Location:** City and country (optional remote indicator)
- **Date Range:** Start date, end date (or "Present" for current position)
- **Description:** Rich text or bullet points describing responsibilities and achievements
- **Achievements/Highlights:** Key accomplishments, metrics, awards (optional)
- **Order:** Drag-and-drop reordering or manual position numbering
- **Multiple Entries:** User can add unlimited work experience entries

#### 3.2.3. Education
- **Institution Name:** University, college, school
- **Degree/Qualification:** Bachelor's, Master's, PhD, Diploma, Certificate, etc.
- **Field of Study:** Major, specialization
- **Date Range:** Start date, end date (or "Present" if ongoing)
- **GPA/Grade:** Optional academic performance indicator
- **Location:** City and country (optional)
- **Description:** Additional details, honors, relevant coursework (optional)
- **Order:** Chronological ordering (newest first by default)
- **Multiple Entries:** Unlimited education entries

#### 3.2.4. Skills
- **Skill Name:** e.g., JavaScript, Project Management, Public Speaking
- **Proficiency Level:** Beginner, Intermediate, Advanced, Expert (optional)
- **Category:** Technical, Soft Skills, Languages, Tools, etc. (optional)
- **Endorsements Count:** (Future: integrate endorsements)
- **Order:** User-defined ordering or automatic alphabetical
- **Multiple Entries:** Unlimited skills

#### 3.2.5. Projects (Optional Section)
- **Project Name:** Name of project
- **Role:** Your role in the project
- **Date Range:** Start and end date (or ongoing)
- **Description:** What the project is about
- **Technologies Used:** List of technologies/tools
- **Link:** URL to live project, repository, or case study
- **Multiple Entries:** Unlimited projects

#### 3.2.6. Certifications (Optional Section)
- **Certification Name:** e.g., AWS Certified Solutions Architect
- **Issuing Organization:** e.g., Amazon Web Services
- **Issue Date:** When certification was obtained
- **Expiration Date:** If applicable (or "No expiration")
- **Credential ID:** Optional identifier
- **Credential URL:** Link to verify certification
- **Multiple Entries:** Unlimited certifications

#### 3.2.7. Languages (Optional Section)
- **Language:** e.g., English, Spanish, French
- **Proficiency:** Native, Fluent, Conversational, Basic
- **Multiple Entries:** Unlimited languages

#### 3.2.8. Additional Sections (Future Enhancements)
- Volunteer Experience
- Publications
- Patents
- Awards & Honors
- Conferences/Speaking Engagements
- Hobbies & Interests

### 3.3. CV Templates
- **Template Library:** Minimum 3-5 professionally designed templates in MVP
- **Template Preview:** Visual preview of each template with sample data
- **Template Selection:** User can switch between templates with one click
- **Real-time Preview:** Changes to profile data instantly reflect in CV preview
- **Template Categories:**
  - Modern (clean, minimal design)
  - Professional (traditional, corporate style)
  - Creative (colorful, unique layouts)
  - Technical (developer-focused with skills emphasis)
- **Customization Options (Future):**
  - Color scheme selection
  - Font choice
  - Section visibility toggles
  - Layout variants (single column vs. two column)

### 3.4. PDF Export
- **Generate PDF:** User clicks "Download PDF" to generate CV as PDF file
- **File Naming:** Auto-generated filename: `{FirstName}_{LastName}_CV_{Date}.pdf`
- **Quality:** High-resolution, print-ready (300 DPI equivalent)
- **File Size:** Optimized for sharing (target < 2MB)
- **Page Layout:** Automatic pagination for multi-page CVs
- **Formatting Preservation:** Ensures consistent appearance across PDF viewers
- **Download History (Future):** Track when CVs were generated

### 3.5. CV Management (Future Enhancement)
- **Multiple CVs:** User can create multiple CV versions (e.g., "Software Engineer CV", "Product Manager CV")
- **Duplicate CV:** Clone existing CV to create variations
- **Version History:** Track changes over time
- **Share Link:** Generate public shareable link to CV (read-only web view)

### 3.6. Dashboard & Analytics (Future)
- **CV Completeness Score:** Percentage indicating profile completion
- **Last Updated:** Timestamp of last modification
- **Quick Actions:** Edit sections, download PDF, preview CV
- **Analytics (Future):**
  - Number of times CV was viewed (if shared)
  - Number of downloads
  - Most recent template used

## 4. Database Schema Design

### 4.1. Core Tables

**1. profiles** (extends auth.users)
- `id` (uuid, PK, FK to auth.users)
- `first_name` (text, required)
- `last_name` (text, required)
- `middle_name` (text, nullable)
- `professional_title` (text, nullable)
- `phone` (text, nullable)
- `address_street` (text, nullable)
- `address_city` (text, nullable)
- `address_state` (text, nullable)
- `address_country` (text, nullable)
- `address_postal_code` (text, nullable)
- `professional_summary` (text, nullable)
- `profile_photo_url` (text, nullable) - URL to Supabase Storage
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**2. social_links**
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users, required)
- `platform` (text, required) - e.g., "LinkedIn", "GitHub", "Portfolio"
- `url` (text, required)
- `display_order` (int, default 0)
- `created_at` (timestamptz)

**3. work_experiences**
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users, required)
- `company_name` (text, required)
- `job_title` (text, required)
- `employment_type` (text) - enum: full-time, part-time, contract, freelance, internship
- `location` (text, nullable)
- `is_remote` (boolean, default false)
- `start_date` (date, required)
- `end_date` (date, nullable) - null indicates "Present"
- `is_current` (boolean, default false)
- `description` (text, nullable)
- `achievements` (text[], nullable) - array of achievement strings
- `display_order` (int, default 0)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**4. education**
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users, required)
- `institution_name` (text, required)
- `degree` (text, required) - e.g., "Bachelor of Science", "Master of Arts"
- `field_of_study` (text, required)
- `location` (text, nullable)
- `start_date` (date, required)
- `end_date` (date, nullable)
- `is_current` (boolean, default false)
- `gpa` (text, nullable)
- `description` (text, nullable)
- `display_order` (int, default 0)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**5. skills**
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users, required)
- `skill_name` (text, required)
- `proficiency_level` (text, nullable) - enum: beginner, intermediate, advanced, expert
- `category` (text, nullable) - e.g., "Technical", "Soft Skills", "Languages"
- `display_order` (int, default 0)
- `created_at` (timestamptz)

**6. projects**
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users, required)
- `project_name` (text, required)
- `role` (text, nullable)
- `start_date` (date, nullable)
- `end_date` (date, nullable)
- `is_ongoing` (boolean, default false)
- `description` (text, nullable)
- `technologies` (text[], nullable) - array of technology names
- `project_url` (text, nullable)
- `display_order` (int, default 0)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**7. certifications**
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users, required)
- `certification_name` (text, required)
- `issuing_organization` (text, required)
- `issue_date` (date, required)
- `expiration_date` (date, nullable)
- `credential_id` (text, nullable)
- `credential_url` (text, nullable)
- `display_order` (int, default 0)
- `created_at` (timestamptz)

**8. languages**
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users, required)
- `language_name` (text, required)
- `proficiency` (text, required) - enum: native, fluent, conversational, basic
- `display_order` (int, default 0)
- `created_at` (timestamptz)

**9. cv_templates** (system table)
- `id` (uuid, PK)
- `template_name` (text, required)
- `template_slug` (text, required, unique)
- `description` (text, nullable)
- `category` (text) - modern, professional, creative, technical
- `thumbnail_url` (text, nullable)
- `is_active` (boolean, default true)
- `created_at` (timestamptz)

**10. user_cv_settings** (user preferences)
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users, required, unique)
- `selected_template_id` (uuid, FK to cv_templates, nullable)
- `theme_color` (text, nullable) - hex color code
- `font_family` (text, nullable)
- `sections_visibility` (jsonb, nullable) - e.g., {"projects": true, "certifications": false}
- `updated_at` (timestamptz)

### 4.2. Future Tables (Multi-CV Support)
**11. cvs** (for multiple CV versions)
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users, required)
- `cv_name` (text, required) - e.g., "Software Engineer CV"
- `template_id` (uuid, FK to cv_templates)
- `is_default` (boolean, default false)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## 5. Row Level Security (RLS) Policies

All user data tables must have RLS policies:
- **SELECT:** Users can only view their own data (`user_id = auth.uid()`)
- **INSERT:** Users can only insert data with their own user_id
- **UPDATE:** Users can only update their own data
- **DELETE:** Users can only delete their own data

**cv_templates:** Public read access, admin-only write access

## 6. UI/UX Details

### 6.1. Page Structure

**Authentication Pages:**
- `/sign-in` - Login form
- `/sign-up` - Registration form
- `/forgot-password` - Password reset request
- `/reset-password` - Set new password

**Dashboard:**
- `/dashboard` - Main landing page after login
  - CV preview card
  - Completeness score widget
  - Quick action buttons (Edit, Download, Preview)
  - Last updated timestamp

**Profile Editor (Multi-step form or tabbed interface):**
- `/profile/personal` - Personal information form
- `/profile/experience` - Work experience list with CRUD
- `/profile/education` - Education list with CRUD
- `/profile/skills` - Skills management
- `/profile/projects` - Projects list with CRUD (optional)
- `/profile/certifications` - Certifications list with CRUD (optional)
- `/profile/languages` - Languages list with CRUD (optional)

**CV Preview & Export:**
- `/cv/preview` - Full-page CV preview with selected template
- `/cv/templates` - Template gallery with preview and selection
- `/cv/download` - PDF generation and download endpoint

**Settings:**
- `/settings/account` - Account settings (email, password)
- `/settings/preferences` - App preferences

### 6.2. Key UI Components

**1. Profile Section Card:**
- Displays section title (e.g., "Work Experience")
- List of entries with edit/delete actions
- "Add New" button to create entries
- Drag handles for reordering (optional in MVP)

**2. Form Components:**
- Text inputs with validation
- Date pickers (start/end dates with "Present" option)
- Rich text editor for descriptions (or simple textarea in MVP)
- Dropdown selects for enums (employment type, proficiency level)
- File upload for profile photo
- Array input for multiple items (achievements, technologies)

**3. CV Preview Component:**
- Real-time rendering of selected template with user data
- Responsive layout (scales to fit viewport)
- Template switcher dropdown
- Print/Download button

**4. Template Card:**
- Thumbnail image of template
- Template name and category
- "Use This Template" button
- "Preview" button to see full example

**5. Completeness Progress Bar:**
- Visual indicator showing profile completion percentage
- List of missing sections with links to edit

### 6.3. User Flows

**New User Onboarding:**
1. Sign up → Email verification
2. Redirect to dashboard (empty state)
3. Prompt: "Complete your profile to generate your CV"
4. Guide user through profile sections step-by-step
5. After basic info completed → Preview CV with first template
6. User can download or continue editing

**Returning User:**
1. Sign in → Dashboard
2. See CV preview with last used template
3. Quick actions: Edit sections, Download PDF, Change template

**CV Creation Flow:**
1. Edit profile sections (can be done in any order)
2. Select template from gallery
3. Preview CV with real data
4. Download PDF

## 7. Non-Functional Requirements

### 7.1. Performance
- Page load time: < 2 seconds
- PDF generation: < 5 seconds
- Responsive on all screen sizes (mobile, tablet, desktop)

### 7.2. Security
- All authentication handled by Supabase Auth
- RLS policies enforced on all tables
- File uploads validated (image type, size limits)
- HTTPS only

### 7.3. Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Proper ARIA labels

### 7.4. Browser Support
- Chrome, Firefox, Safari, Edge (latest 2 versions)

## 8. Integration Points

### 8.1. Supabase Services
- **Auth:** User authentication and session management
- **Database:** PostgreSQL with RLS
- **Storage:** Profile photo uploads (`avatars` bucket)
- **Realtime (Future):** Live CV preview updates

### 8.2. PDF Generation
- Server-side rendering using react-pdf or Puppeteer
- Or client-side using @react-pdf/renderer
- Evaluate performance and quality trade-offs

### 8.3. Email Service (Supabase Auth)
- Email verification
- Password reset emails
- (Future) CV share notifications

## 9. Shared Package Usage

CVFlow will leverage existing platform packages:

**@platform/types:**
- User types
- Auth types
- Add CV-specific types: `CVProfile`, `WorkExperience`, `Education`, etc.

**@platform/supabase:**
- Supabase client initialization
- Auth utilities (sign in, sign up, session management)
- Type-safe query builders

**@platform/utils:**
- Date formatting utilities
- Validation schemas (Zod)
- String utilities (slugify, truncate)

**@platform/hooks:**
- useAuth hook
- useMediaQuery / useIsDesktop
- useDebounce for form inputs
- useLocalStorage for draft saving (optional)

**@platform/ui:**
- Button, Input, Card, Dialog components
- Form components with validation
- DatePicker, Select, Combobox
- ResponsiveDialog (modal/bottomsheet)

**@platform/config:**
- TypeScript, ESLint/Biome, Tailwind configurations

## 10. Success Metrics (Future Analytics)

- User registration and activation rate
- Profile completion rate (% of users with complete profiles)
- Average time to first CV download
- Number of CVs downloaded per user
- Template popularity (which templates are most used)
- User retention (weekly/monthly active users)

## 11. Future Enhancements (Post-MVP)

### Phase 2 (Web Enhancements):
- AI-powered content suggestions (describe job responsibilities)
- CV analytics (track views if shared via link)
- Multiple CV versions per user
- ATS (Applicant Tracking System) optimization score
- LinkedIn import (auto-populate from LinkedIn profile)
- Cover letter generator
- Export to Word (.docx) format

### Phase 3 (Mobile App):
- React Native app (`apps/cv-mobile/`)
- On-the-go CV editing
- Quick updates from mobile
- Mobile-optimized PDF viewing

### Phase 4 (Collaboration & Sharing):
- Share CV for feedback (with comments)
- Public portfolio page (custom subdomain: username.cvflow.com)
- QR code for CV sharing

### Phase 5 (Monetization - Optional):
- Premium templates (paid)
- Advanced customization options
- Priority support
- Unlimited CV versions
- Custom domain for portfolio

## 12. Project Estimates

### MVP Timeline (Web Only):

**Phase 1: Foundation (Week 1-2)**
- Monorepo setup for CV app
- Authentication pages
- Database schema and migrations
- Basic dashboard layout

**Phase 2: Profile Management (Week 3-5)**
- Personal information form
- Work experience CRUD
- Education CRUD
- Skills management
- Projects, certifications, languages (optional sections)

**Phase 3: Templates & Preview (Week 6-7)**
- Design and implement 3 CV templates
- Real-time preview component
- Template selection interface

**Phase 4: PDF Export (Week 8)**
- PDF generation implementation
- Download functionality
- Testing across devices and browsers

**Phase 5: Polish & Testing (Week 9-10)**
- UI/UX refinements
- Bug fixes
- Performance optimization
- Documentation

**Total Estimated Time: 10 weeks (2.5 months)**

### Mobile App (Future):
**Estimated: 4-6 weeks** after web MVP is complete

## 13. Dependencies & Risks

### Dependencies:
- Turborepo and shared packages must be stable
- Supabase Auth and Database reliability
- PDF generation library performance

### Risks:
- **PDF Generation Complexity:** Ensuring consistent rendering across different data structures and template layouts
  - Mitigation: Start with simple templates, iterate based on quality
- **Template Design:** Creating professional-looking templates requires design expertise
  - Mitigation: Use open-source CV templates as starting point, hire designer if needed
- **Data Privacy:** Sensitive personal information must be secured
  - Mitigation: Strong RLS policies, HTTPS only, regular security audits

### Assumptions:
- Users have basic familiarity with CV creation
- Majority of users will access via desktop/laptop initially
- Users prefer simple, clean templates over highly customized designs in MVP

## 14. Open Questions

1. **PDF Generation Library:** react-pdf vs. Puppeteer vs. jsPDF?
   - **Decision needed:** Performance, quality, and ease of use trade-offs
2. **Rich Text Editor:** Do we need full rich text (bold, italics, bullets) in MVP?
   - **Decision:** Start with simple textarea, upgrade to Tiptap/Lexical if needed
3. **Template Engine:** Build custom template renderer or use existing solution?
   - **Decision:** Custom React components for full control in MVP
4. **Analytics:** Track user behavior from day 1 or add later?
   - **Decision:** Basic analytics (profile completion, downloads) from start
5. **Monetization:** Free forever or introduce paid tiers eventually?
   - **Decision:** Launch as free, evaluate monetization post-launch

---

## Appendix A: Competitor Analysis

**Existing CV builders:**
- **Canva Resume Builder:** Drag-and-drop, many templates, requires Canva account
- **Resume.io:** Simple, clean, limited free features
- **Zety:** Professional templates, ATS optimization, subscription-based
- **NovoResume:** Modern templates, section guidance, freemium model

**Our Differentiation:**
- Fully open-source and self-hosted (potential)
- Tight integration with monorepo ecosystem
- Future mobile app with shared codebase
- Developer-friendly (can extend with custom sections)
- Free to start with optional premium features later

---

## Appendix B: Glossary

- **CV (Curriculum Vitae):** Document summarizing professional experience, education, and skills
- **Resume:** Often used interchangeably with CV (in US context)
- **ATS:** Applicant Tracking System - software used by employers to parse CVs
- **RLS:** Row Level Security - PostgreSQL security model
- **MVP:** Minimum Viable Product - initial version with core features
- **DPI:** Dots Per Inch - print resolution quality metric

---

**Document Version:** 1.0
**Created:** 2025-12-25
**Last Updated:** 2025-12-25
**Author:** Product Manager (Agent 01)
**Status:** DRAFT - Awaiting Review
