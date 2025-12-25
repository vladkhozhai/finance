-- CVFlow Application Schema - Phase 2
-- Creates cv_social_links and cv_work_experiences tables with Row Level Security (RLS) policies
-- Designed to coexist with FinanceFlow in the same Supabase project

-- ============================================================================
-- CV_SOCIAL_LINKS TABLE
-- ============================================================================
-- Stores user social media and online presence links
CREATE TABLE cv_social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment to table for documentation
COMMENT ON TABLE cv_social_links IS 'Social media links and online presence for CVFlow users';

-- Add comments to columns
COMMENT ON COLUMN cv_social_links.platform IS 'Platform identifier (e.g., linkedin, github, portfolio, twitter)';
COMMENT ON COLUMN cv_social_links.display_order IS 'Order for displaying links in CV (lower numbers appear first)';

-- ============================================================================
-- CV_WORK_EXPERIENCES TABLE
-- ============================================================================
-- Stores user work experience history
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

-- Add comment to table for documentation
COMMENT ON TABLE cv_work_experiences IS 'Work experience history for CVFlow users';

-- Add comments to columns
COMMENT ON COLUMN cv_work_experiences.employment_type IS 'Type of employment (e.g., full-time, part-time, contract, freelance, internship)';
COMMENT ON COLUMN cv_work_experiences.is_remote IS 'Whether the position was/is remote';
COMMENT ON COLUMN cv_work_experiences.is_current IS 'Whether this is the current position (end_date should be null)';
COMMENT ON COLUMN cv_work_experiences.achievements IS 'Array of achievement strings for this position';
COMMENT ON COLUMN cv_work_experiences.display_order IS 'Order for displaying experiences in CV (lower numbers appear first)';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - CV_SOCIAL_LINKS
-- ============================================================================
-- Enable RLS on cv_social_links
ALTER TABLE cv_social_links ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own social links
CREATE POLICY "Users can view own cv_social_links"
  ON cv_social_links FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own social links
CREATE POLICY "Users can insert own cv_social_links"
  ON cv_social_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own social links
CREATE POLICY "Users can update own cv_social_links"
  ON cv_social_links FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own social links
CREATE POLICY "Users can delete own cv_social_links"
  ON cv_social_links FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - CV_WORK_EXPERIENCES
-- ============================================================================
-- Enable RLS on cv_work_experiences
ALTER TABLE cv_work_experiences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own work experiences
CREATE POLICY "Users can view own cv_work_experiences"
  ON cv_work_experiences FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own work experiences
CREATE POLICY "Users can insert own cv_work_experiences"
  ON cv_work_experiences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own work experiences
CREATE POLICY "Users can update own cv_work_experiences"
  ON cv_work_experiences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own work experiences
CREATE POLICY "Users can delete own cv_work_experiences"
  ON cv_work_experiences FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- INDEXES
-- ============================================================================
-- Indexes for cv_social_links
CREATE INDEX idx_cv_social_links_user_id ON cv_social_links(user_id);
CREATE INDEX idx_cv_social_links_user_display_order ON cv_social_links(user_id, display_order);

-- Indexes for cv_work_experiences
CREATE INDEX idx_cv_work_experiences_user_id ON cv_work_experiences(user_id);
CREATE INDEX idx_cv_work_experiences_user_display_order ON cv_work_experiences(user_id, display_order);
CREATE INDEX idx_cv_work_experiences_dates ON cv_work_experiences(user_id, start_date DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger function: Auto-update updated_at timestamp on cv_work_experiences changes
CREATE OR REPLACE FUNCTION update_cv_work_experiences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to cv_work_experiences table
CREATE TRIGGER update_cv_work_experiences_updated_at
  BEFORE UPDATE ON cv_work_experiences
  FOR EACH ROW
  EXECUTE FUNCTION update_cv_work_experiences_updated_at();

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Ensure that if is_current is true, end_date must be null
ALTER TABLE cv_work_experiences
  ADD CONSTRAINT check_current_job_no_end_date
  CHECK (NOT is_current OR end_date IS NULL);

-- Ensure end_date is after start_date (when both are present)
ALTER TABLE cv_work_experiences
  ADD CONSTRAINT check_end_date_after_start_date
  CHECK (end_date IS NULL OR end_date >= start_date);

-- ============================================================================
-- PERMISSIONS
-- ============================================================================
-- Grant permissions for authenticated users to access these tables via RLS policies
GRANT SELECT, INSERT, UPDATE, DELETE ON cv_social_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cv_work_experiences TO authenticated;
