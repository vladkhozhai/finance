-- Verification script for CVFlow Phase 2 Migration
-- This script verifies that cv_social_links and cv_work_experiences tables
-- were created successfully with proper RLS policies, indexes, and constraints

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
  RAISE NOTICE 'RLS POLICY CHECKS:';

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
    RAISE NOTICE '✓ cv_social_links has 4 RLS policies';
  ELSE
    RAISE EXCEPTION '✗ cv_social_links does NOT have 4 RLS policies';
  END IF;

  -- Count policies on cv_work_experiences (should be 4)
  IF (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'cv_work_experiences') = 4 THEN
    RAISE NOTICE '✓ cv_work_experiences has 4 RLS policies';
  ELSE
    RAISE EXCEPTION '✗ cv_work_experiences does NOT have 4 RLS policies';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'INDEX CHECKS:';

  -- Check indexes on cv_social_links
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'cv_social_links' AND indexname = 'idx_cv_social_links_user_id') THEN
    RAISE NOTICE '✓ idx_cv_social_links_user_id exists';
  ELSE
    RAISE EXCEPTION '✗ idx_cv_social_links_user_id does NOT exist';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'cv_social_links' AND indexname = 'idx_cv_social_links_user_display_order') THEN
    RAISE NOTICE '✓ idx_cv_social_links_user_display_order exists';
  ELSE
    RAISE EXCEPTION '✗ idx_cv_social_links_user_display_order does NOT exist';
  END IF;

  -- Check indexes on cv_work_experiences
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'cv_work_experiences' AND indexname = 'idx_cv_work_experiences_user_id') THEN
    RAISE NOTICE '✓ idx_cv_work_experiences_user_id exists';
  ELSE
    RAISE EXCEPTION '✗ idx_cv_work_experiences_user_id does NOT exist';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'cv_work_experiences' AND indexname = 'idx_cv_work_experiences_user_display_order') THEN
    RAISE NOTICE '✓ idx_cv_work_experiences_user_display_order exists';
  ELSE
    RAISE EXCEPTION '✗ idx_cv_work_experiences_user_display_order does NOT exist';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'cv_work_experiences' AND indexname = 'idx_cv_work_experiences_dates') THEN
    RAISE NOTICE '✓ idx_cv_work_experiences_dates exists';
  ELSE
    RAISE EXCEPTION '✗ idx_cv_work_experiences_dates does NOT exist';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'TRIGGER CHECKS:';

  -- Check trigger on cv_work_experiences
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_cv_work_experiences_updated_at'
  ) THEN
    RAISE NOTICE '✓ update_cv_work_experiences_updated_at trigger exists';
  ELSE
    RAISE EXCEPTION '✗ update_cv_work_experiences_updated_at trigger does NOT exist';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'CONSTRAINT CHECKS:';

  -- Check constraints on cv_work_experiences
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_current_job_no_end_date'
    AND conrelid = 'cv_work_experiences'::regclass
  ) THEN
    RAISE NOTICE '✓ check_current_job_no_end_date constraint exists';
  ELSE
    RAISE EXCEPTION '✗ check_current_job_no_end_date constraint does NOT exist';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_end_date_after_start_date'
    AND conrelid = 'cv_work_experiences'::regclass
  ) THEN
    RAISE NOTICE '✓ check_end_date_after_start_date constraint exists';
  ELSE
    RAISE EXCEPTION '✗ check_end_date_after_start_date constraint does NOT exist';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'COLUMN TYPE CHECKS:';

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
  RAISE NOTICE 'ALL CHECKS PASSED! ✓';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'CVFlow Phase 2 migration verified successfully:';
  RAISE NOTICE '- cv_social_links: table, RLS (4 policies), indexes (2)';
  RAISE NOTICE '- cv_work_experiences: table, RLS (4 policies), indexes (3), trigger (1), constraints (2)';
  RAISE NOTICE '';

END $$;
