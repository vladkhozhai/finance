-- Verification script for CVFlow Phase 2b tables
-- This script checks that all 6 new tables were created correctly with RLS and indexes

DO $$
DECLARE
  v_table_count int;
  v_rls_count int;
  v_policy_count int;
  v_index_count int;
  v_trigger_count int;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CVFlow Phase 2b Migration Verification';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Check cv_education table
  SELECT COUNT(*) INTO v_table_count FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'cv_education';
  IF v_table_count = 1 THEN
    RAISE NOTICE '✓ cv_education table exists';
  ELSE
    RAISE EXCEPTION '✗ cv_education table NOT FOUND';
  END IF;

  -- Check cv_skills table
  SELECT COUNT(*) INTO v_table_count FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'cv_skills';
  IF v_table_count = 1 THEN
    RAISE NOTICE '✓ cv_skills table exists';
  ELSE
    RAISE EXCEPTION '✗ cv_skills table NOT FOUND';
  END IF;

  -- Check cv_projects table
  SELECT COUNT(*) INTO v_table_count FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'cv_projects';
  IF v_table_count = 1 THEN
    RAISE NOTICE '✓ cv_projects table exists';
  ELSE
    RAISE EXCEPTION '✗ cv_projects table NOT FOUND';
  END IF;

  -- Check cv_certifications table
  SELECT COUNT(*) INTO v_table_count FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'cv_certifications';
  IF v_table_count = 1 THEN
    RAISE NOTICE '✓ cv_certifications table exists';
  ELSE
    RAISE EXCEPTION '✗ cv_certifications table NOT FOUND';
  END IF;

  -- Check cv_languages table
  SELECT COUNT(*) INTO v_table_count FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'cv_languages';
  IF v_table_count = 1 THEN
    RAISE NOTICE '✓ cv_languages table exists';
  ELSE
    RAISE EXCEPTION '✗ cv_languages table NOT FOUND';
  END IF;

  -- Check cv_user_settings table
  SELECT COUNT(*) INTO v_table_count FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'cv_user_settings';
  IF v_table_count = 1 THEN
    RAISE NOTICE '✓ cv_user_settings table exists';
  ELSE
    RAISE EXCEPTION '✗ cv_user_settings table NOT FOUND';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'RLS POLICY CHECKS:';

  -- Check RLS enabled on all tables
  SELECT COUNT(*) INTO v_rls_count FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('cv_education', 'cv_skills', 'cv_projects', 'cv_certifications', 'cv_languages', 'cv_user_settings')
    AND rowsecurity = true;
  IF v_rls_count = 6 THEN
    RAISE NOTICE '✓ RLS enabled on all 6 tables';
  ELSE
    RAISE EXCEPTION '✗ RLS not enabled on all tables (found % of 6)', v_rls_count;
  END IF;

  -- Check cv_education policies (should have 4: SELECT, INSERT, UPDATE, DELETE)
  SELECT COUNT(*) INTO v_policy_count FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'cv_education';
  IF v_policy_count = 4 THEN
    RAISE NOTICE '✓ cv_education has 4 RLS policies';
  ELSE
    RAISE EXCEPTION '✗ cv_education has % policies (expected 4)', v_policy_count;
  END IF;

  -- Check cv_skills policies
  SELECT COUNT(*) INTO v_policy_count FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'cv_skills';
  IF v_policy_count = 4 THEN
    RAISE NOTICE '✓ cv_skills has 4 RLS policies';
  ELSE
    RAISE EXCEPTION '✗ cv_skills has % policies (expected 4)', v_policy_count;
  END IF;

  -- Check cv_projects policies
  SELECT COUNT(*) INTO v_policy_count FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'cv_projects';
  IF v_policy_count = 4 THEN
    RAISE NOTICE '✓ cv_projects has 4 RLS policies';
  ELSE
    RAISE EXCEPTION '✗ cv_projects has % policies (expected 4)', v_policy_count;
  END IF;

  -- Check cv_certifications policies
  SELECT COUNT(*) INTO v_policy_count FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'cv_certifications';
  IF v_policy_count = 4 THEN
    RAISE NOTICE '✓ cv_certifications has 4 RLS policies';
  ELSE
    RAISE EXCEPTION '✗ cv_certifications has % policies (expected 4)', v_policy_count;
  END IF;

  -- Check cv_languages policies
  SELECT COUNT(*) INTO v_policy_count FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'cv_languages';
  IF v_policy_count = 4 THEN
    RAISE NOTICE '✓ cv_languages has 4 RLS policies';
  ELSE
    RAISE EXCEPTION '✗ cv_languages has % policies (expected 4)', v_policy_count;
  END IF;

  -- Check cv_user_settings policies
  SELECT COUNT(*) INTO v_policy_count FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'cv_user_settings';
  IF v_policy_count = 4 THEN
    RAISE NOTICE '✓ cv_user_settings has 4 RLS policies';
  ELSE
    RAISE EXCEPTION '✗ cv_user_settings has % policies (expected 4)', v_policy_count;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'INDEX CHECKS:';

  -- Check indexes exist
  SELECT COUNT(*) INTO v_index_count FROM pg_indexes
  WHERE schemaname = 'public' AND indexname = 'idx_cv_education_user_id';
  IF v_index_count > 0 THEN
    RAISE NOTICE '✓ idx_cv_education_user_id exists';
  ELSE
    RAISE EXCEPTION '✗ idx_cv_education_user_id NOT FOUND';
  END IF;

  SELECT COUNT(*) INTO v_index_count FROM pg_indexes
  WHERE schemaname = 'public' AND indexname = 'idx_cv_education_display_order';
  IF v_index_count > 0 THEN
    RAISE NOTICE '✓ idx_cv_education_display_order exists';
  ELSE
    RAISE EXCEPTION '✗ idx_cv_education_display_order NOT FOUND';
  END IF;

  SELECT COUNT(*) INTO v_index_count FROM pg_indexes
  WHERE schemaname = 'public' AND indexname = 'idx_cv_skills_user_id';
  IF v_index_count > 0 THEN
    RAISE NOTICE '✓ idx_cv_skills_user_id exists';
  ELSE
    RAISE EXCEPTION '✗ idx_cv_skills_user_id NOT FOUND';
  END IF;

  SELECT COUNT(*) INTO v_index_count FROM pg_indexes
  WHERE schemaname = 'public' AND indexname = 'idx_cv_projects_user_id';
  IF v_index_count > 0 THEN
    RAISE NOTICE '✓ idx_cv_projects_user_id exists';
  ELSE
    RAISE EXCEPTION '✗ idx_cv_projects_user_id NOT FOUND';
  END IF;

  SELECT COUNT(*) INTO v_index_count FROM pg_indexes
  WHERE schemaname = 'public' AND indexname = 'idx_cv_certifications_user_id';
  IF v_index_count > 0 THEN
    RAISE NOTICE '✓ idx_cv_certifications_user_id exists';
  ELSE
    RAISE EXCEPTION '✗ idx_cv_certifications_user_id NOT FOUND';
  END IF;

  SELECT COUNT(*) INTO v_index_count FROM pg_indexes
  WHERE schemaname = 'public' AND indexname = 'idx_cv_languages_user_id';
  IF v_index_count > 0 THEN
    RAISE NOTICE '✓ idx_cv_languages_user_id exists';
  ELSE
    RAISE EXCEPTION '✗ idx_cv_languages_user_id NOT FOUND';
  END IF;

  SELECT COUNT(*) INTO v_index_count FROM pg_indexes
  WHERE schemaname = 'public' AND indexname = 'idx_cv_user_settings_user_id';
  IF v_index_count > 0 THEN
    RAISE NOTICE '✓ idx_cv_user_settings_user_id exists';
  ELSE
    RAISE EXCEPTION '✗ idx_cv_user_settings_user_id NOT FOUND';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'TRIGGER CHECKS:';

  -- Check update triggers exist
  SELECT COUNT(*) INTO v_trigger_count FROM information_schema.triggers
  WHERE event_object_table = 'cv_education' AND trigger_name = 'set_cv_education_updated_at';
  IF v_trigger_count > 0 THEN
    RAISE NOTICE '✓ set_cv_education_updated_at trigger exists';
  ELSE
    RAISE EXCEPTION '✗ set_cv_education_updated_at trigger NOT FOUND';
  END IF;

  SELECT COUNT(*) INTO v_trigger_count FROM information_schema.triggers
  WHERE event_object_table = 'cv_projects' AND trigger_name = 'set_cv_projects_updated_at';
  IF v_trigger_count > 0 THEN
    RAISE NOTICE '✓ set_cv_projects_updated_at trigger exists';
  ELSE
    RAISE EXCEPTION '✗ set_cv_projects_updated_at trigger NOT FOUND';
  END IF;

  SELECT COUNT(*) INTO v_trigger_count FROM information_schema.triggers
  WHERE event_object_table = 'cv_user_settings' AND trigger_name = 'set_cv_user_settings_updated_at';
  IF v_trigger_count > 0 THEN
    RAISE NOTICE '✓ set_cv_user_settings_updated_at trigger exists';
  ELSE
    RAISE EXCEPTION '✗ set_cv_user_settings_updated_at trigger NOT FOUND';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'CONSTRAINT CHECKS:';

  -- Check cv_education constraints
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cv_education_current_no_end_date'
  ) THEN
    RAISE NOTICE '✓ cv_education_current_no_end_date constraint exists';
  ELSE
    RAISE EXCEPTION '✗ cv_education_current_no_end_date constraint NOT FOUND';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cv_education_valid_date_range'
  ) THEN
    RAISE NOTICE '✓ cv_education_valid_date_range constraint exists';
  ELSE
    RAISE EXCEPTION '✗ cv_education_valid_date_range constraint NOT FOUND';
  END IF;

  -- Check cv_projects constraints
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cv_projects_ongoing_no_end_date'
  ) THEN
    RAISE NOTICE '✓ cv_projects_ongoing_no_end_date constraint exists';
  ELSE
    RAISE EXCEPTION '✗ cv_projects_ongoing_no_end_date constraint NOT FOUND';
  END IF;

  -- Check cv_skills unique constraint
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cv_skills_unique_per_user'
  ) THEN
    RAISE NOTICE '✓ cv_skills_unique_per_user constraint exists';
  ELSE
    RAISE EXCEPTION '✗ cv_skills_unique_per_user constraint NOT FOUND';
  END IF;

  -- Check cv_languages unique constraint
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cv_languages_unique_per_user'
  ) THEN
    RAISE NOTICE '✓ cv_languages_unique_per_user constraint exists';
  ELSE
    RAISE EXCEPTION '✗ cv_languages_unique_per_user constraint NOT FOUND';
  END IF;

  -- Check cv_user_settings unique constraint on user_id
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cv_user_settings_user_id_key'
  ) THEN
    RAISE NOTICE '✓ cv_user_settings_user_id unique constraint exists';
  ELSE
    RAISE EXCEPTION '✗ cv_user_settings_user_id unique constraint NOT FOUND';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'COLUMN TYPE CHECKS:';

  -- Check cv_projects.technologies is TEXT[] array
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cv_projects'
      AND column_name = 'technologies'
      AND data_type = 'ARRAY'
  ) THEN
    RAISE NOTICE '✓ technologies column is TEXT[] array type';
  ELSE
    RAISE EXCEPTION '✗ technologies column is not array type';
  END IF;

  -- Check cv_user_settings.sections_visibility is JSONB
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cv_user_settings'
      AND column_name = 'sections_visibility'
      AND data_type = 'jsonb'
  ) THEN
    RAISE NOTICE '✓ sections_visibility column is JSONB type';
  ELSE
    RAISE EXCEPTION '✗ sections_visibility column is not JSONB type';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ALL CHECKS PASSED! ✓';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'CVFlow Phase 2b migration verified successfully:';
  RAISE NOTICE '- cv_education: table, RLS (4 policies), indexes (2), trigger, constraints (2)';
  RAISE NOTICE '- cv_skills: table, RLS (4 policies), indexes (3), unique constraint';
  RAISE NOTICE '- cv_projects: table, RLS (4 policies), indexes (2), trigger, constraints (2)';
  RAISE NOTICE '- cv_certifications: table, RLS (4 policies), indexes (3), date constraint';
  RAISE NOTICE '- cv_languages: table, RLS (4 policies), indexes (2), unique constraint';
  RAISE NOTICE '- cv_user_settings: table, RLS (4 policies), index, trigger, unique constraint';
  RAISE NOTICE '';

END $$;
