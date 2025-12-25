-- CVFlow Phase 2b: Education, Skills, Projects, Certifications, Languages, and CV Settings
-- This migration creates 6 new tables with RLS policies, indexes, and triggers

-- ============================================================================
-- 1. CV_EDUCATION TABLE
-- ============================================================================
CREATE TABLE cv_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_name text NOT NULL,
  degree text NOT NULL,
  field_of_study text NOT NULL,
  location text,
  start_date date NOT NULL,
  end_date date,
  is_current boolean DEFAULT false,
  gpa text,
  description text,
  display_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraint: current education cannot have end_date
  CONSTRAINT cv_education_current_no_end_date
    CHECK ((is_current = true AND end_date IS NULL) OR is_current = false),

  -- Constraint: end_date must be after start_date
  CONSTRAINT cv_education_valid_date_range
    CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Enable RLS
ALTER TABLE cv_education ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cv_education
CREATE POLICY "Users can view own education"
  ON cv_education FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own education"
  ON cv_education FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own education"
  ON cv_education FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own education"
  ON cv_education FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for cv_education
CREATE INDEX idx_cv_education_user_id ON cv_education(user_id);
CREATE INDEX idx_cv_education_display_order ON cv_education(user_id, display_order);

-- Updated_at trigger for cv_education
CREATE TRIGGER set_cv_education_updated_at
  BEFORE UPDATE ON cv_education
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. CV_SKILLS TABLE
-- ============================================================================
CREATE TABLE cv_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  proficiency_level text CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  category text CHECK (category IN ('Technical', 'Soft Skills', 'Languages', 'Tools')),
  display_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Prevent duplicate skills per user
  CONSTRAINT cv_skills_unique_per_user UNIQUE(user_id, skill_name)
);

-- Enable RLS
ALTER TABLE cv_skills ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cv_skills
CREATE POLICY "Users can view own skills"
  ON cv_skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own skills"
  ON cv_skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skills"
  ON cv_skills FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own skills"
  ON cv_skills FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for cv_skills
CREATE INDEX idx_cv_skills_user_id ON cv_skills(user_id);
CREATE INDEX idx_cv_skills_display_order ON cv_skills(user_id, display_order);
CREATE INDEX idx_cv_skills_category ON cv_skills(user_id, category);

-- ============================================================================
-- 3. CV_PROJECTS TABLE
-- ============================================================================
CREATE TABLE cv_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name text NOT NULL,
  role text,
  start_date date,
  end_date date,
  is_ongoing boolean DEFAULT false,
  description text,
  technologies text[],
  project_url text,
  display_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraint: ongoing projects cannot have end_date
  CONSTRAINT cv_projects_ongoing_no_end_date
    CHECK ((is_ongoing = true AND end_date IS NULL) OR is_ongoing = false),

  -- Constraint: end_date must be after start_date
  CONSTRAINT cv_projects_valid_date_range
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

-- Enable RLS
ALTER TABLE cv_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cv_projects
CREATE POLICY "Users can view own projects"
  ON cv_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON cv_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON cv_projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON cv_projects FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for cv_projects
CREATE INDEX idx_cv_projects_user_id ON cv_projects(user_id);
CREATE INDEX idx_cv_projects_display_order ON cv_projects(user_id, display_order);

-- Updated_at trigger for cv_projects
CREATE TRIGGER set_cv_projects_updated_at
  BEFORE UPDATE ON cv_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. CV_CERTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE cv_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certification_name text NOT NULL,
  issuing_organization text NOT NULL,
  issue_date date NOT NULL,
  expiration_date date,
  credential_id text,
  credential_url text,
  display_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Constraint: expiration_date must be after issue_date
  CONSTRAINT cv_certifications_valid_date_range
    CHECK (expiration_date IS NULL OR expiration_date >= issue_date)
);

-- Enable RLS
ALTER TABLE cv_certifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cv_certifications
CREATE POLICY "Users can view own certifications"
  ON cv_certifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own certifications"
  ON cv_certifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own certifications"
  ON cv_certifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own certifications"
  ON cv_certifications FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for cv_certifications
CREATE INDEX idx_cv_certifications_user_id ON cv_certifications(user_id);
CREATE INDEX idx_cv_certifications_display_order ON cv_certifications(user_id, display_order);
CREATE INDEX idx_cv_certifications_issue_date ON cv_certifications(user_id, issue_date DESC);

-- ============================================================================
-- 5. CV_LANGUAGES TABLE
-- ============================================================================
CREATE TABLE cv_languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language_name text NOT NULL,
  proficiency text NOT NULL CHECK (proficiency IN ('Native', 'Fluent', 'Conversational', 'Basic')),
  display_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Prevent duplicate languages per user
  CONSTRAINT cv_languages_unique_per_user UNIQUE(user_id, language_name)
);

-- Enable RLS
ALTER TABLE cv_languages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cv_languages
CREATE POLICY "Users can view own languages"
  ON cv_languages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own languages"
  ON cv_languages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own languages"
  ON cv_languages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own languages"
  ON cv_languages FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for cv_languages
CREATE INDEX idx_cv_languages_user_id ON cv_languages(user_id);
CREATE INDEX idx_cv_languages_display_order ON cv_languages(user_id, display_order);

-- ============================================================================
-- 6. CV_USER_SETTINGS TABLE
-- ============================================================================
CREATE TABLE cv_user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_template_id uuid,
  theme_color text,
  font_family text,
  sections_visibility jsonb DEFAULT '{"projects": true, "certifications": true, "languages": true}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE cv_user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cv_user_settings
CREATE POLICY "Users can view own settings"
  ON cv_user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own settings"
  ON cv_user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON cv_user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON cv_user_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Index for cv_user_settings
CREATE INDEX idx_cv_user_settings_user_id ON cv_user_settings(user_id);

-- Updated_at trigger for cv_user_settings
CREATE TRIGGER set_cv_user_settings_updated_at
  BEFORE UPDATE ON cv_user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE cv_education IS 'Stores educational background for CV profiles';
COMMENT ON TABLE cv_skills IS 'Stores skills with proficiency levels and categories';
COMMENT ON TABLE cv_projects IS 'Stores personal/professional projects for CV';
COMMENT ON TABLE cv_certifications IS 'Stores professional certifications and credentials';
COMMENT ON TABLE cv_languages IS 'Stores language proficiencies for CV';
COMMENT ON TABLE cv_user_settings IS 'Stores user preferences for CV customization';

COMMENT ON COLUMN cv_education.is_current IS 'When true, end_date must be NULL (enforced by constraint)';
COMMENT ON COLUMN cv_projects.is_ongoing IS 'When true, end_date must be NULL (enforced by constraint)';
COMMENT ON COLUMN cv_projects.technologies IS 'Array of technology names used in the project';
COMMENT ON COLUMN cv_user_settings.sections_visibility IS 'JSON object controlling which CV sections are visible';
