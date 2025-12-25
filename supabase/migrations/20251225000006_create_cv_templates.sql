-- Phase 3: CV Templates System
-- This migration creates the template management infrastructure for CVFlow

-- ============================================================================
-- 1. CREATE CV_TEMPLATES TABLE
-- ============================================================================
-- System table storing predefined CV template configurations
-- Templates are pre-seeded and managed by administrators only

CREATE TABLE IF NOT EXISTS cv_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  template_slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('modern', 'professional', 'creative', 'technical')),
  thumbnail_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comment for documentation
COMMENT ON TABLE cv_templates IS 'System table for CV template definitions. Managed by administrators only.';
COMMENT ON COLUMN cv_templates.template_slug IS 'Unique URL-safe identifier for template routing';
COMMENT ON COLUMN cv_templates.category IS 'Template style category: modern, professional, creative, technical';
COMMENT ON COLUMN cv_templates.is_active IS 'Flag to enable/disable templates without deletion';

-- Create index on slug for fast lookups
CREATE INDEX idx_cv_templates_slug ON cv_templates(template_slug);
CREATE INDEX idx_cv_templates_category ON cv_templates(category);
CREATE INDEX idx_cv_templates_active ON cv_templates(is_active) WHERE is_active = true;

-- ============================================================================
-- 2. SEED INITIAL TEMPLATES
-- ============================================================================
-- Insert 3 predefined templates for MVP

INSERT INTO cv_templates (template_name, template_slug, description, category, is_active)
VALUES
  (
    'Modern',
    'modern',
    'Clean two-column layout with minimal design',
    'modern',
    true
  ),
  (
    'Professional',
    'professional',
    'Traditional single-column corporate style',
    'professional',
    true
  ),
  (
    'Creative',
    'creative',
    'Colorful header with unique layout',
    'creative',
    true
  );

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE cv_templates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CREATE RLS POLICIES
-- ============================================================================

-- Public read access - anyone can view active templates
CREATE POLICY "Anyone can view active templates"
  ON cv_templates
  FOR SELECT
  USING (is_active = true);

-- No INSERT/UPDATE/DELETE policies for regular users
-- System table is managed through direct database access or admin functions only
COMMENT ON POLICY "Anyone can view active templates" ON cv_templates IS
  'Public read-only access. Templates are system-managed and cannot be modified by users.';

-- ============================================================================
-- 5. UPDATE CV_SETTINGS TABLE
-- ============================================================================
-- Add selected_template_id column to cv_settings if the table exists

DO $$
BEGIN
  -- Check if cv_settings table exists before attempting to alter it
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'cv_settings'
  ) THEN
    -- Add selected_template_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'cv_settings'
      AND column_name = 'selected_template_id'
    ) THEN
      ALTER TABLE cv_settings
        ADD COLUMN selected_template_id UUID REFERENCES cv_templates(id);

      COMMENT ON COLUMN cv_settings.selected_template_id IS
        'Foreign key to cv_templates. Determines which template to use for CV rendering.';

      -- Create index for FK lookups
      CREATE INDEX idx_cv_settings_template_id ON cv_settings(selected_template_id);

      RAISE NOTICE 'Added selected_template_id column to cv_settings table';
    ELSE
      RAISE NOTICE 'selected_template_id column already exists in cv_settings';
    END IF;
  ELSE
    RAISE NOTICE 'cv_settings table does not exist yet - skipping column addition';
  END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - cv_templates table created with 4 category types
-- - 3 seed templates inserted (modern, professional, creative)
-- - RLS enabled with public read-only access
-- - cv_settings.selected_template_id added (if cv_settings exists)
-- - Indexes created for performance optimization
