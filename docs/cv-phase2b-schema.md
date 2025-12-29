# CVFlow Phase 2b Database Schema Documentation

## Overview
This document describes the CVFlow Phase 2b database schema covering Education, Skills, Projects, Certifications, Languages, and CV Settings tables.

## Migration Files
- **Main Migration**: `/supabase/migrations/20251225000004_create_cv_phase2b_education_skills_etc.sql`
- **Verification**: `/supabase/migrations/20251225000005_verify_cv_phase2b.sql`
- **TypeScript Types**: `/apps/cv-web/src/types/database.types.ts`

## Tables Created

### 1. cv_education
Stores educational background information for CV profiles.

**Columns:**
- `id` (uuid, PK, auto-generated)
- `user_id` (uuid, FK to auth.users, NOT NULL)
- `institution_name` (text, NOT NULL) - School/University name
- `degree` (text, NOT NULL) - Degree type (e.g., Bachelor's, Master's)
- `field_of_study` (text, NOT NULL) - Major/Field name
- `location` (text, nullable) - City/Country of institution
- `start_date` (date, NOT NULL)
- `end_date` (date, nullable)
- `is_current` (boolean, DEFAULT false) - Currently studying
- `gpa` (text, nullable) - Grade Point Average
- `description` (text, nullable) - Additional details
- `display_order` (int, DEFAULT 0) - Order for UI display
- `created_at` (timestamptz, auto)
- `updated_at` (timestamptz, auto)

**Constraints:**
- `cv_education_current_no_end_date`: Current education (is_current=true) cannot have end_date
- `cv_education_valid_date_range`: end_date must be >= start_date

**Indexes:**
- `idx_cv_education_user_id` on (user_id)
- `idx_cv_education_display_order` on (user_id, display_order)

**RLS Policies:** 4 policies (SELECT, INSERT, UPDATE, DELETE) - user can only access own records

**Triggers:**
- `set_cv_education_updated_at` - Auto-update updated_at on row modification

---

### 2. cv_skills
Stores skills with proficiency levels and categories.

**Columns:**
- `id` (uuid, PK, auto-generated)
- `user_id` (uuid, FK to auth.users, NOT NULL)
- `skill_name` (text, NOT NULL)
- `proficiency_level` (text, nullable) - CHECK: 'beginner', 'intermediate', 'advanced', 'expert'
- `category` (text, nullable) - CHECK: 'Technical', 'Soft Skills', 'Languages', 'Tools'
- `display_order` (int, DEFAULT 0)
- `created_at` (timestamptz, auto)

**Constraints:**
- `cv_skills_unique_per_user`: UNIQUE(user_id, skill_name) - no duplicate skills per user

**Indexes:**
- `idx_cv_skills_user_id` on (user_id)
- `idx_cv_skills_display_order` on (user_id, display_order)
- `idx_cv_skills_category` on (user_id, category)

**RLS Policies:** 4 policies (SELECT, INSERT, UPDATE, DELETE)

---

### 3. cv_projects
Stores personal or professional projects.

**Columns:**
- `id` (uuid, PK, auto-generated)
- `user_id` (uuid, FK to auth.users, NOT NULL)
- `project_name` (text, NOT NULL)
- `role` (text, nullable) - User's role in the project
- `start_date` (date, nullable)
- `end_date` (date, nullable)
- `is_ongoing` (boolean, DEFAULT false) - Project still in progress
- `description` (text, nullable)
- `technologies` (text[], nullable) - Array of technology names
- `project_url` (text, nullable) - Link to project/demo
- `display_order` (int, DEFAULT 0)
- `created_at` (timestamptz, auto)
- `updated_at` (timestamptz, auto)

**Constraints:**
- `cv_projects_ongoing_no_end_date`: Ongoing projects (is_ongoing=true) cannot have end_date
- `cv_projects_valid_date_range`: end_date must be >= start_date

**Indexes:**
- `idx_cv_projects_user_id` on (user_id)
- `idx_cv_projects_display_order` on (user_id, display_order)

**RLS Policies:** 4 policies (SELECT, INSERT, UPDATE, DELETE)

**Triggers:**
- `set_cv_projects_updated_at` - Auto-update updated_at on row modification

---

### 4. cv_certifications
Stores professional certifications and credentials.

**Columns:**
- `id` (uuid, PK, auto-generated)
- `user_id` (uuid, FK to auth.users, NOT NULL)
- `certification_name` (text, NOT NULL)
- `issuing_organization` (text, NOT NULL) - Certifying body
- `issue_date` (date, NOT NULL)
- `expiration_date` (date, nullable)
- `credential_id` (text, nullable) - Certificate ID/number
- `credential_url` (text, nullable) - Link to verify certificate
- `display_order` (int, DEFAULT 0)
- `created_at` (timestamptz, auto)

**Constraints:**
- `cv_certifications_valid_date_range`: expiration_date must be >= issue_date

**Indexes:**
- `idx_cv_certifications_user_id` on (user_id)
- `idx_cv_certifications_display_order` on (user_id, display_order)
- `idx_cv_certifications_issue_date` on (user_id, issue_date DESC)

**RLS Policies:** 4 policies (SELECT, INSERT, UPDATE, DELETE)

---

### 5. cv_languages
Stores language proficiencies.

**Columns:**
- `id` (uuid, PK, auto-generated)
- `user_id` (uuid, FK to auth.users, NOT NULL)
- `language_name` (text, NOT NULL)
- `proficiency` (text, NOT NULL) - CHECK: 'Native', 'Fluent', 'Conversational', 'Basic'
- `display_order` (int, DEFAULT 0)
- `created_at` (timestamptz, auto)

**Constraints:**
- `cv_languages_unique_per_user`: UNIQUE(user_id, language_name) - no duplicate languages per user

**Indexes:**
- `idx_cv_languages_user_id` on (user_id)
- `idx_cv_languages_display_order` on (user_id, display_order)

**RLS Policies:** 4 policies (SELECT, INSERT, UPDATE, DELETE)

---

### 6. cv_user_settings
Stores user preferences for CV customization (one record per user).

**Columns:**
- `id` (uuid, PK, auto-generated)
- `user_id` (uuid, FK to auth.users, UNIQUE, NOT NULL)
- `selected_template_id` (uuid, nullable) - ID of selected CV template
- `theme_color` (text, nullable) - Primary color for CV theme
- `font_family` (text, nullable) - Font choice for CV
- `sections_visibility` (jsonb, DEFAULT '{"projects": true, "certifications": true, "languages": true}') - Controls which sections are visible
- `updated_at` (timestamptz, auto)

**Constraints:**
- `cv_user_settings_user_id_key`: UNIQUE(user_id) - one settings record per user

**Indexes:**
- `idx_cv_user_settings_user_id` on (user_id)

**RLS Policies:** 4 policies (SELECT, INSERT, UPDATE, DELETE)

**Triggers:**
- `set_cv_user_settings_updated_at` - Auto-update updated_at on row modification

---

## Security (Row Level Security)

All tables have RLS enabled with the standard pattern:
- **SELECT**: `auth.uid() = user_id` - Users can only view their own records
- **INSERT**: `auth.uid() = user_id` - Users can only create records for themselves
- **UPDATE**: `auth.uid() = user_id` - Users can only update their own records
- **DELETE**: `auth.uid() = user_id` - Users can only delete their own records

## Performance Optimization

### Indexes Strategy:
1. **user_id indexes**: Fast filtering by user (all tables)
2. **display_order indexes**: Efficient ordering for UI display (all tables)
3. **Composite indexes**: Combined (user_id, display_order) for optimal query performance
4. **Specialized indexes**:
   - `cv_skills`: category index for filtering by skill category
   - `cv_certifications`: issue_date DESC for chronological ordering

### Best Practices:
- Use `display_order` for custom sorting in UI
- Leverage array columns (`technologies` in cv_projects) for flexible data storage
- Use JSONB (`sections_visibility`) for extensible settings without schema changes

## Data Integrity

### Constraints Summary:
1. **Date Logic**: is_current/is_ongoing records cannot have end_date
2. **Date Ranges**: end_date must be >= start_date
3. **Unique Constraints**: Prevent duplicate skills and languages per user
4. **User Isolation**: All data tied to user_id with cascading deletes

### Foreign Key Cascades:
- All tables have `ON DELETE CASCADE` for `user_id` FK
- When a user is deleted, all their CV data is automatically removed

## TypeScript Types

All tables are fully typed in `/apps/cv-web/src/types/database.types.ts`:

```typescript
// Example: cv_education type
type CvEducation = Database['public']['Tables']['cv_education']['Row']
type CvEducationInsert = Database['public']['Tables']['cv_education']['Insert']
type CvEducationUpdate = Database['public']['Tables']['cv_education']['Update']
```

## Migration Verification

Run verification script:
```sql
-- Located at: /supabase/migrations/20251225000005_verify_cv_phase2b.sql
-- Checks:
-- ✓ All 6 tables created
-- ✓ RLS enabled (24 policies total: 4 per table)
-- ✓ Indexes created (15 indexes total)
-- ✓ Triggers created (3 total)
-- ✓ Constraints enforced (6 total)
-- ✓ Column types correct (TEXT[], JSONB)
```

## Complete CV Schema (All Phases)

**Phase 2a:**
1. cv_profiles - Basic profile info
2. cv_social_links - Social media links
3. cv_work_experiences - Work history

**Phase 2b (This Migration):**
4. cv_education - Educational background
5. cv_skills - Skills and proficiencies
6. cv_projects - Personal/professional projects
7. cv_certifications - Certifications and credentials
8. cv_languages - Language proficiencies
9. cv_user_settings - CV customization preferences

**Total:** 9 CV tables with full RLS, indexes, and constraints

## Usage Examples

### Query Examples:

```typescript
// Get all education records for current user (ordered)
const { data: education } = await supabase
  .from('cv_education')
  .select('*')
  .order('display_order', { ascending: true })
  .order('start_date', { ascending: false });

// Get skills by category
const { data: technicalSkills } = await supabase
  .from('cv_skills')
  .select('*')
  .eq('category', 'Technical')
  .order('proficiency_level');

// Get ongoing projects
const { data: currentProjects } = await supabase
  .from('cv_projects')
  .select('*')
  .eq('is_ongoing', true);

// Get current education (still studying)
const { data: currentEducation } = await supabase
  .from('cv_education')
  .select('*')
  .eq('is_current', true);

// Get user CV settings (upsert pattern)
const { data: settings } = await supabase
  .from('cv_user_settings')
  .select('*')
  .single();
```

## Notes for Backend Developer (Agent 03)

When implementing Server Actions for these tables:

1. **Education & Projects**: Handle is_current/is_ongoing logic - clear end_date when setting to true
2. **Skills & Languages**: Check for duplicates before insert (unique constraints)
3. **User Settings**: Use upsert pattern (only one record per user)
4. **Display Order**: Implement drag-and-drop reordering by updating display_order
5. **Validation**:
   - Check proficiency_level enums for cv_skills
   - Check proficiency enums for cv_languages
   - Validate date ranges before insert/update

## Notes for Frontend Developer (Agent 04)

UI Considerations:

1. **Drag-and-Drop**: All tables have display_order for reordering
2. **Forms**: Conditional fields based on is_current/is_ongoing checkboxes
3. **Array Fields**: cv_projects.technologies needs multi-input component
4. **JSONB Settings**: sections_visibility needs toggle switches
5. **Proficiency Badges**: Use visual indicators for skill/language levels
6. **Date Pickers**: Handle nullable end_dates properly

---

**Migration Status**: ✅ Applied Successfully
**Verification**: ✅ All Tests Passed
**TypeScript Types**: ✅ Generated and Updated
**Created**: 2025-12-25
