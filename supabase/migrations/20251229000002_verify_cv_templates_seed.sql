-- Verification script for Bug #71: Ensure CV templates are seeded
-- This script checks if templates exist and re-seeds if necessary

DO $$
DECLARE
  template_count INTEGER;
  rec RECORD;
BEGIN
  -- Check if templates exist
  SELECT COUNT(*) INTO template_count FROM cv_templates;

  RAISE NOTICE 'Current template count: %', template_count;

  -- If no templates exist, seed them
  IF template_count = 0 THEN
    RAISE NOTICE 'No templates found. Seeding templates...';

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

    RAISE NOTICE 'Templates seeded successfully!';
  ELSE
    RAISE NOTICE 'Templates already exist. Skipping seed.';
  END IF;

  -- Display all templates
  RAISE NOTICE 'Current templates:';
  FOR rec IN SELECT t.template_name FROM cv_templates t
  LOOP
    RAISE NOTICE '  - %', rec.template_name;
  END LOOP;
END $$;

-- Verify templates are accessible
SELECT
  id,
  template_name,
  template_slug,
  category,
  is_active
FROM cv_templates
ORDER BY template_name;
