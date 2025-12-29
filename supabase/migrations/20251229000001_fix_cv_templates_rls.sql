-- Fix Bug #71: Templates Not Loading
-- Update RLS policy to allow authenticated users to view templates
-- The existing policy "Anyone can view active templates" might be too permissive
-- We need authenticated users to view templates for the CV preview feature

-- Drop the existing policy
DROP POLICY IF EXISTS "Anyone can view active templates" ON cv_templates;

-- Create new policy for authenticated users to view active templates
CREATE POLICY "Authenticated users can view active templates"
  ON cv_templates
  FOR SELECT
  USING (
    is_active = true
    AND auth.uid() IS NOT NULL
  );

-- Add comment
COMMENT ON POLICY "Authenticated users can view active templates" ON cv_templates IS
  'Authenticated users can view all active templates for CV generation.';
