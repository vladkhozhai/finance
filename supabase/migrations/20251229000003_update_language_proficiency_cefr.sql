-- Migration: Update language proficiency levels to CEFR standards
-- Date: 2025-12-29
-- Bug #73: Language Proficiency Labels Need CEFR Categories

-- ============================================================================
-- Update cv_languages proficiency constraint to use CEFR levels
-- ============================================================================

-- Step 1: Drop the existing CHECK constraint
ALTER TABLE cv_languages DROP CONSTRAINT IF EXISTS cv_languages_proficiency_check;

-- Step 2: Add new CHECK constraint with CEFR levels
ALTER TABLE cv_languages ADD CONSTRAINT cv_languages_proficiency_check
  CHECK (proficiency IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native'));

-- Step 3: Migrate existing data to CEFR standards
-- Map old values to closest CEFR equivalents:
--   'Basic' -> 'A2' (Elementary)
--   'Conversational' -> 'B1' (Pre-Intermediate)
--   'Fluent' -> 'C2' (Advanced/Fluent)
--   'Native' -> 'Native' (unchanged)

UPDATE cv_languages
SET proficiency = CASE proficiency
  WHEN 'Basic' THEN 'A2'
  WHEN 'Conversational' THEN 'B1'
  WHEN 'Fluent' THEN 'C2'
  WHEN 'Native' THEN 'Native'
  ELSE proficiency  -- Keep any already-CEFR values
END
WHERE proficiency IN ('Basic', 'Conversational', 'Fluent');

-- ============================================================================
-- Verification
-- ============================================================================

-- Verify all proficiency values are now valid CEFR levels
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM cv_languages
  WHERE proficiency NOT IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native');

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % records have invalid proficiency values', invalid_count;
  ELSE
    RAISE NOTICE 'Migration successful: All language proficiency values are now CEFR-compliant';
  END IF;
END $$;
