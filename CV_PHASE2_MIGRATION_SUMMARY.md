# CVFlow Phase 2 Database Migration Summary

**Date**: 2025-12-25
**Migration Files**:
- `/Users/vladislav.khozhai/WebstormProjects/finance/supabase/migrations/20251225000002_create_cv_social_links_and_work_experiences.sql`
- `/Users/vladislav.khozhai/WebstormProjects/finance/supabase/migrations/20251225000003_verify_cv_phase2.sql` (verification)

**TypeScript Types Updated**:
- `/Users/vladislav.khozhai/WebstormProjects/finance/apps/cv-web/src/types/database.types.ts`

## Overview

Created two new tables for CVFlow Phase 2, adding social media links and work experience tracking to the cv-web application. Both tables follow the same architecture patterns established in Phase 1 (cv_profiles).

## Tables Created

### 1. cv_social_links

**Purpose**: Store user social media and online presence links

**Columns**:
- `id` (UUID, PK, auto-generated)
- `user_id` (UUID, FK to auth.users, NOT NULL, CASCADE DELETE)
- `platform` (TEXT, NOT NULL) - e.g., 'linkedin', 'github', 'portfolio', 'twitter'
- `url` (TEXT, NOT NULL)
- `display_order` (INTEGER, DEFAULT 0) - Controls ordering in CV display
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())

**Indexes**:
- `idx_cv_social_links_user_id` - Fast user-specific queries
- `idx_cv_social_links_user_display_order` - Efficient ordering queries

**RLS Policies** (4 total):
- `Users can view own cv_social_links` (SELECT)
- `Users can insert own cv_social_links` (INSERT)
- `Users can update own cv_social_links` (UPDATE)
- `Users can delete own cv_social_links` (DELETE)

All policies use `auth.uid() = user_id` for user isolation.

---

### 2. cv_work_experiences

**Purpose**: Store user work experience history

**Columns**:
- `id` (UUID, PK, auto-generated)
- `user_id` (UUID, FK to auth.users, NOT NULL, CASCADE DELETE)
- `company_name` (TEXT, NOT NULL)
- `job_title` (TEXT, NOT NULL)
- `employment_type` (TEXT, nullable) - full-time, part-time, contract, freelance, internship
- `location` (TEXT, nullable)
- `is_remote` (BOOLEAN, DEFAULT false)
- `start_date` (DATE, NOT NULL)
- `end_date` (DATE, nullable)
- `is_current` (BOOLEAN, DEFAULT false)
- `description` (TEXT, nullable)
- `achievements` (TEXT[], nullable) - Array of achievement strings
- `display_order` (INTEGER, DEFAULT 0) - Controls ordering in CV display
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW())

**Indexes**:
- `idx_cv_work_experiences_user_id` - Fast user-specific queries
- `idx_cv_work_experiences_user_display_order` - Efficient ordering queries
- `idx_cv_work_experiences_dates` - Efficient date-based sorting (user_id, start_date DESC)

**RLS Policies** (4 total):
- `Users can view own cv_work_experiences` (SELECT)
- `Users can insert own cv_work_experiences` (INSERT)
- `Users can update own cv_work_experiences` (UPDATE)
- `Users can delete own cv_work_experiences` (DELETE)

All policies use `auth.uid() = user_id` for user isolation.

**Trigger**:
- `update_cv_work_experiences_updated_at` - Auto-updates `updated_at` on row modifications

**Constraints**:
- `check_current_job_no_end_date` - If `is_current = true`, `end_date` must be NULL
- `check_end_date_after_start_date` - When both dates exist, `end_date` >= `start_date`

## Architecture Decisions

### 1. Naming Convention
Used `cv_` prefix for all tables to distinguish CVFlow tables from FinanceFlow tables in the shared Supabase project.

### 2. User Isolation
All tables include `user_id` with RLS policies ensuring users can only access their own data. Foreign key relationships cascade delete to maintain data integrity when users are deleted.

### 3. Display Ordering
Both tables include `display_order` integer field (DEFAULT 0) allowing users to customize the order of items in their CV. Lower numbers appear first. Indexed for performance.

### 4. Array Type for Achievements
Used PostgreSQL TEXT[] array type for achievements to avoid creating a junction table for simple list storage. This simplifies queries and reduces complexity while maintaining normalization.

### 5. Date Range Validation
Business logic constraints enforce:
- Current jobs cannot have end dates
- End dates must be >= start dates
These are enforced at the database level for data integrity.

### 6. Timestamps
- `cv_social_links`: Only `created_at` (immutable once created)
- `cv_work_experiences`: Both `created_at` and `updated_at` with auto-update trigger

## TypeScript Type Generation

TypeScript types were regenerated using:
```bash
npx supabase gen types typescript --local > apps/cv-web/src/types/database.types.ts
```

### Generated Types (Example)

```typescript
cv_social_links: {
  Row: {
    created_at: string
    display_order: number | null
    id: string
    platform: string
    url: string
    user_id: string
  }
  Insert: {
    created_at?: string
    display_order?: number | null
    id?: string
    platform: string
    url: string
    user_id: string
  }
  Update: {
    created_at?: string
    display_order?: number | null
    id?: string
    platform?: string
    url?: string
    user_id?: string
  }
  Relationships: []
}

cv_work_experiences: {
  Row: {
    achievements: string[] | null
    company_name: string
    created_at: string
    description: string | null
    display_order: number | null
    employment_type: string | null
    end_date: string | null
    id: string
    is_current: boolean | null
    is_remote: boolean | null
    job_title: string
    location: string | null
    start_date: string
    updated_at: string
    user_id: string
  }
  // ... Insert and Update types
}
```

## Verification

A verification migration (`20251225000003_verify_cv_phase2.sql`) was created and run to confirm:

- Tables exist in public schema
- RLS is enabled on both tables
- All 4 RLS policies exist per table
- All indexes are created
- Trigger exists on cv_work_experiences
- Both constraints exist on cv_work_experiences
- achievements column is TEXT[] array type

**Result**: All checks passed successfully

## Performance Considerations

### Indexes Created
- **User-specific queries**: Both tables indexed on `user_id` for fast user data retrieval
- **Ordered queries**: Composite indexes on `(user_id, display_order)` for efficient ordering
- **Date-based sorting**: `cv_work_experiences` has additional index on `(user_id, start_date DESC)` for chronological display

### Query Patterns Optimized
```sql
-- Fast: Get all social links for a user (uses idx_cv_social_links_user_id)
SELECT * FROM cv_social_links WHERE user_id = auth.uid();

-- Fast: Get ordered work experiences (uses idx_cv_work_experiences_user_display_order)
SELECT * FROM cv_work_experiences
WHERE user_id = auth.uid()
ORDER BY display_order, start_date DESC;

-- Fast: Get current job (uses idx_cv_work_experiences_user_id)
SELECT * FROM cv_work_experiences
WHERE user_id = auth.uid() AND is_current = true;
```

## Security

### RLS Policy Pattern
Standard user-based isolation applied to all tables:
```sql
-- All operations restricted to own data
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id)
```

### Data Integrity
- Foreign keys with CASCADE DELETE ensure orphaned records are cleaned up
- Check constraints prevent invalid data states at database level
- Triggers maintain timestamp consistency

## Migration Status

- **Local Development**: Applied and verified
- **Production**: Ready to deploy with `npx supabase db push`

## Next Steps for Backend Developer (Agent 03)

1. **Create Server Actions** for CRUD operations:
   - `apps/cv-web/src/actions/social-links.ts`
   - `apps/cv-web/src/actions/work-experiences.ts`

2. **Example Server Action Pattern**:
```typescript
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSocialLink(data: {
  platform: string
  url: string
  display_order?: number
}) {
  const supabase = await createServerClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) throw new Error('Not authenticated')

  const { data: link, error } = await supabase
    .from('cv_social_links')
    .insert({
      user_id: user.user.id,
      platform: data.platform,
      url: data.url,
      display_order: data.display_order ?? 0,
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/cv-builder')
  return link
}
```

3. **Validation Schemas** (using Zod):
```typescript
import { z } from 'zod'

export const socialLinkSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  url: z.string().url('Must be a valid URL'),
  display_order: z.number().int().default(0),
})

export const workExperienceSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  job_title: z.string().min(1, 'Job title is required'),
  employment_type: z.enum([
    'full-time', 'part-time', 'contract', 'freelance', 'internship'
  ]).optional(),
  location: z.string().optional(),
  is_remote: z.boolean().default(false),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date').optional(),
  is_current: z.boolean().default(false),
  description: z.string().optional(),
  achievements: z.array(z.string()).optional(),
  display_order: z.number().int().default(0),
})
```

## Files Modified/Created

### Migration Files
1. `/Users/vladislav.khozhai/WebstormProjects/finance/supabase/migrations/20251225000002_create_cv_social_links_and_work_experiences.sql`
2. `/Users/vladislav.khozhai/WebstormProjects/finance/supabase/migrations/20251225000003_verify_cv_phase2.sql`

### Type Definitions
1. `/Users/vladislav.khozhai/WebstormProjects/finance/apps/cv-web/src/types/database.types.ts` (regenerated)

### Verification Scripts
1. `/Users/vladislav.khozhai/WebstormProjects/finance/scripts/verify-cv-phase2-migration.sql` (standalone verification)

---

**Migration Status**: COMPLETE AND VERIFIED
**Ready for**: Backend Server Actions implementation
**Testing Status**: All verification checks passed
