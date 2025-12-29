-- Fix Bug #72: cv_skills category constraint mismatch
-- The frontend uses different category values than the database constraint
-- This migration removes the restrictive constraint and allows any category value

-- Drop the existing check constraint on category
ALTER TABLE cv_skills DROP CONSTRAINT IF EXISTS cv_skills_category_check;

-- The category column will now accept any text value
-- Frontend categories: 'programming', 'frameworks', 'tools', 'soft-skills', 'languages', 'other'

-- Add comment for documentation
COMMENT ON COLUMN cv_skills.category IS 'Skill category - accepts values like: programming, frameworks, tools, soft-skills, languages, other';
