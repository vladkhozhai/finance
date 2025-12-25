# CVFlow Phase 2 - Database Schema Quick Reference

## Table: cv_social_links

### Purpose
Store social media links and online presence URLs for CV generation.

### Schema
```sql
CREATE TABLE cv_social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Indexes
- `idx_cv_social_links_user_id` ON `(user_id)`
- `idx_cv_social_links_user_display_order` ON `(user_id, display_order)`

### RLS Policies
- SELECT, INSERT, UPDATE, DELETE: `auth.uid() = user_id`

### Platform Examples
- `linkedin`
- `github`
- `portfolio`
- `twitter`
- `stackoverflow`
- `medium`

### TypeScript Type
```typescript
type SocialLink = {
  id: string
  user_id: string
  platform: string
  url: string
  display_order: number | null
  created_at: string
}
```

---

## Table: cv_work_experiences

### Purpose
Store work experience history with achievements for CV generation.

### Schema
```sql
CREATE TABLE cv_work_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  employment_type TEXT,
  location TEXT,
  is_remote BOOLEAN DEFAULT FALSE,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  description TEXT,
  achievements TEXT[],
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Indexes
- `idx_cv_work_experiences_user_id` ON `(user_id)`
- `idx_cv_work_experiences_user_display_order` ON `(user_id, display_order)`
- `idx_cv_work_experiences_dates` ON `(user_id, start_date DESC)`

### RLS Policies
- SELECT, INSERT, UPDATE, DELETE: `auth.uid() = user_id`

### Constraints
- `check_current_job_no_end_date`: If `is_current = true`, then `end_date` must be NULL
- `check_end_date_after_start_date`: `end_date >= start_date` (when both present)

### Triggers
- `update_cv_work_experiences_updated_at`: Auto-updates `updated_at` on row changes

### Employment Types
- `full-time`
- `part-time`
- `contract`
- `freelance`
- `internship`

### TypeScript Type
```typescript
type WorkExperience = {
  id: string
  user_id: string
  company_name: string
  job_title: string
  employment_type: string | null
  location: string | null
  is_remote: boolean | null
  start_date: string // ISO date format YYYY-MM-DD
  end_date: string | null // ISO date format YYYY-MM-DD
  is_current: boolean | null
  description: string | null
  achievements: string[] | null
  display_order: number | null
  created_at: string
  updated_at: string
}
```

---

## Common Query Patterns

### Get all social links for current user (ordered)
```typescript
const { data, error } = await supabase
  .from('cv_social_links')
  .select('*')
  .order('display_order', { ascending: true })
```

### Get all work experiences (ordered by display_order, then date)
```typescript
const { data, error } = await supabase
  .from('cv_work_experiences')
  .select('*')
  .order('display_order', { ascending: true })
  .order('start_date', { ascending: false })
```

### Get current job
```typescript
const { data, error } = await supabase
  .from('cv_work_experiences')
  .select('*')
  .eq('is_current', true)
  .single()
```

### Add new social link
```typescript
const { data, error } = await supabase
  .from('cv_social_links')
  .insert({
    platform: 'linkedin',
    url: 'https://linkedin.com/in/username',
    display_order: 0
  })
  .select()
  .single()
```

### Add new work experience
```typescript
const { data, error } = await supabase
  .from('cv_work_experiences')
  .insert({
    company_name: 'Tech Corp',
    job_title: 'Senior Developer',
    employment_type: 'full-time',
    location: 'San Francisco, CA',
    is_remote: false,
    start_date: '2023-01-15',
    end_date: null,
    is_current: true,
    description: 'Leading development of microservices architecture',
    achievements: [
      'Reduced API latency by 40%',
      'Mentored 3 junior developers',
      'Implemented CI/CD pipeline'
    ],
    display_order: 0
  })
  .select()
  .single()
```

### Update display order
```typescript
// Social links
await supabase
  .from('cv_social_links')
  .update({ display_order: newOrder })
  .eq('id', linkId)

// Work experiences
await supabase
  .from('cv_work_experiences')
  .update({ display_order: newOrder })
  .eq('id', experienceId)
```

### Delete entries
```typescript
// Delete social link
await supabase
  .from('cv_social_links')
  .delete()
  .eq('id', linkId)

// Delete work experience
await supabase
  .from('cv_work_experiences')
  .delete()
  .eq('id', experienceId)
```

---

## Data Validation Rules

### cv_social_links
- `platform`: Required, non-empty string
- `url`: Required, valid URL format
- `display_order`: Optional integer (default 0)

### cv_work_experiences
- `company_name`: Required, non-empty string
- `job_title`: Required, non-empty string
- `employment_type`: Optional, one of: full-time, part-time, contract, freelance, internship
- `location`: Optional string
- `is_remote`: Optional boolean (default false)
- `start_date`: Required, valid date (YYYY-MM-DD)
- `end_date`: Optional, valid date (YYYY-MM-DD), must be >= start_date
- `is_current`: Optional boolean (default false), if true then end_date must be null
- `description`: Optional text
- `achievements`: Optional array of strings
- `display_order`: Optional integer (default 0)

---

## RLS Security Model

Both tables implement the same RLS pattern:

```sql
-- Users can only see their own data
CREATE POLICY "Users can view own [table]"
  ON [table] FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own data
CREATE POLICY "Users can insert own [table]"
  ON [table] FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own data
CREATE POLICY "Users can update own [table]"
  ON [table] FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own data
CREATE POLICY "Users can delete own [table]"
  ON [table] FOR DELETE
  USING (auth.uid() = user_id);
```

This ensures complete user data isolation - users cannot access, modify, or delete other users' data.

---

## Migration Files

- **Main Migration**: `/supabase/migrations/20251225000002_create_cv_social_links_and_work_experiences.sql`
- **Verification**: `/supabase/migrations/20251225000003_verify_cv_phase2.sql`
- **TypeScript Types**: `/apps/cv-web/src/types/database.types.ts`
