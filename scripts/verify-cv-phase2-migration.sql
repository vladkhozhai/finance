-- Verification script for CVFlow Phase 2 Migration
-- This script verifies that cv_social_links and cv_work_experiences tables
-- were created successfully with proper RLS policies, indexes, and constraints

-- ============================================================================
-- TABLE EXISTENCE CHECKS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CVFlow Phase 2 Migration Verification';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Check cv_social_links table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'cv_social_links'
  ) THEN
    RAISE NOTICE '✓ cv_social_links table exists';
  ELSE
    RAISE EXCEPTION '✗ cv_social_links table does NOT exist';
  END IF;

  -- Check cv_work_experiences table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'cv_work_experiences'
  ) THEN
    RAISE NOTICE '✓ cv_work_experiences table exists';
  ELSE
    RAISE EXCEPTION '✗ cv_work_experiences table does NOT exist';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS POLICY CHECKS';
  RAISE NOTICE '========================================';

  -- Check RLS is enabled on cv_social_links
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'cv_social_links'
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✓ RLS enabled on cv_social_links';
  ELSE
    RAISE EXCEPTION '✗ RLS NOT enabled on cv_social_links';
  END IF;

  -- Check RLS is enabled on cv_work_experiences
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'cv_work_experiences'
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✓ RLS enabled on cv_work_experiences';
  ELSE
    RAISE EXCEPTION '✗ RLS NOT enabled on cv_work_experiences';
  END IF;

  -- Count policies on cv_social_links (should be 4: SELECT, INSERT, UPDATE, DELETE)
  IF (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'cv_social_links') = 4 THEN
    RAISE NOTICE '✓ cv_social_links has 4 RLS policies (SELECT, INSERT, UPDATE, DELETE)';
  ELSE
    RAISE EXCEPTION '✗ cv_social_links does NOT have 4 RLS policies';
  END IF;

  -- Count policies on cv_work_experiences (should be 4)
  IF (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'cv_work_experiences') = 4 THEN
    RAISE NOTICE '✓ cv_work_experiences has 4 RLS policies (SELECT, INSERT, UPDATE, DELETE)';
  ELSE
    RAISE EXCEPTION '✗ cv_work_experiences does NOT have 4 RLS policies';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'INDEX CHECKS';
  RAISE NOTICE '========================================';

  -- Check indexes on cv_social_links
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'cv_social_links' AND indexname = 'idx_cv_social_links_user_id') THEN
    RAISE NOTICE '✓ Index idx_cv_social_links_user_id exists';
  ELSE
    RAISE EXCEPTION '✗ Index idx_cv_social_links_user_id does NOT exist';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'cv_social_links' AND indexname = 'idx_cv_social_links_user_display_order') THEN
    RAISE NOTICE '✓ Index idx_cv_social_links_user_display_order exists';
  ELSE
    RAISE EXCEPTION '✗ Index idx_cv_social_links_user_display_order does NOT exist';
  END IF;

  -- Check indexes on cv_work_experiences
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'cv_work_experiences' AND indexname = 'idx_cv_work_experiences_user_id') THEN
    RAISE NOTICE '✓ Index idx_cv_work_experiences_user_id exists';
  ELSE
    RAISE EXCEPTION '✗ Index idx_cv_work_experiences_user_id does NOT exist';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'cv_work_experiences' AND indexname = 'idx_cv_work_experiences_user_display_order') THEN
    RAISE NOTICE '✓ Index idx_cv_work_experiences_user_display_order exists';
  ELSE
    RAISE EXCEPTION '✗ Index idx_cv_work_experiences_user_display_order does NOT exist';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'cv_work_experiences' AND indexname = 'idx_cv_work_experiences_dates') THEN
    RAISE NOTICE '✓ Index idx_cv_work_experiences_dates exists';
  ELSE
    RAISE EXCEPTION '✗ Index idx_cv_work_experiences_dates does NOT exist';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TRIGGER CHECKS';
  RAISE NOTICE '========================================';

  -- Check trigger on cv_work_experiences
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_cv_work_experiences_updated_at'
  ) THEN
    RAISE NOTICE '✓ Trigger update_cv_work_experiences_updated_at exists';
  ELSE
    RAISE EXCEPTION '✗ Trigger update_cv_work_experiences_updated_at does NOT exist';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CONSTRAINT CHECKS';
  RAISE NOTICE '========================================';

  -- Check constraints on cv_work_experiences
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_current_job_no_end_date'
    AND conrelid = 'cv_work_experiences'::regclass
  ) THEN
    RAISE NOTICE '✓ Constraint check_current_job_no_end_date exists';
  ELSE
    RAISE EXCEPTION '✗ Constraint check_current_job_no_end_date does NOT exist';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_end_date_after_start_date'
    AND conrelid = 'cv_work_experiences'::regclass
  ) THEN
    RAISE NOTICE '✓ Constraint check_end_date_after_start_date exists';
  ELSE
    RAISE EXCEPTION '✗ Constraint check_end_date_after_start_date does NOT exist';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'COLUMN TYPE CHECKS';
  RAISE NOTICE '========================================';

  -- Verify achievements column is text array
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cv_work_experiences'
    AND column_name = 'achievements'
    AND data_type = 'ARRAY'
  ) THEN
    RAISE NOTICE '✓ achievements column is TEXT[] array type';
  ELSE
    RAISE EXCEPTION '✗ achievements column is NOT TEXT[] array type';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ALL CHECKS PASSED SUCCESSFULLY! ✓';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'CVFlow Phase 2 migration verified:';
  RAISE NOTICE '- cv_social_links table created with RLS and indexes';
  RAISE NOTICE '- cv_work_experiences table created with RLS, indexes, triggers, and constraints';
  RAISE NOTICE '';

END $$;
