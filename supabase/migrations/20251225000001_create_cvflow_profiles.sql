-- CVFlow Application Schema
-- Creates cv_profiles table with Row Level Security (RLS) policies
-- Designed to coexist with FinanceFlow in the same Supabase project

-- ============================================================================
-- CV_PROFILES TABLE
-- ============================================================================
-- Stores user profile information for CV generation
-- Separate from finance app's 'profiles' table
CREATE TABLE cv_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  middle_name TEXT,
  professional_title TEXT,
  phone TEXT,
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_country TEXT,
  address_postal_code TEXT,
  professional_summary TEXT,
  profile_photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment to table for documentation
COMMENT ON TABLE cv_profiles IS 'User profile information for CVFlow application';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on cv_profiles
ALTER TABLE cv_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own cv_profile"
  ON cv_profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own cv_profile"
  ON cv_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own cv_profile"
  ON cv_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete own cv_profile"
  ON cv_profiles FOR DELETE
  USING (auth.uid() = id);

-- ============================================================================
-- INDEXES
-- ============================================================================
-- Index for faster user-specific queries
CREATE INDEX idx_cv_profiles_id ON cv_profiles(id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger function: Auto-update updated_at timestamp on row changes
CREATE OR REPLACE FUNCTION update_cv_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to cv_profiles table
CREATE TRIGGER update_cv_profiles_updated_at
  BEFORE UPDATE ON cv_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_cv_profiles_updated_at();

-- Trigger function: Auto-create cv_profile on user signup
-- Reads first_name and last_name from raw_user_meta_data
CREATE OR REPLACE FUNCTION handle_new_cv_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.cv_profiles (
    id,
    first_name,
    last_name
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULL)
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If profile already exists (e.g., created by another trigger), skip
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to auth.users table
-- This will fire on INSERT to automatically create a cv_profile
CREATE TRIGGER on_auth_user_created_cv
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_cv_user();

-- ============================================================================
-- PERMISSIONS
-- ============================================================================
-- Grant permissions to supabase_auth_admin for profile creation
-- Required because handle_new_cv_user trigger runs in auth schema context
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT INSERT ON public.cv_profiles TO supabase_auth_admin;
GRANT SELECT ON public.cv_profiles TO supabase_auth_admin;
