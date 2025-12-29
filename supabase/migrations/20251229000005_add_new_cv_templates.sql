-- Add 3 new CV templates: Minimal, Executive, Technical
-- These templates provide more variety for different professional contexts

INSERT INTO cv_templates (template_name, template_slug, description, category, is_active)
VALUES
  (
    'Minimal',
    'minimal',
    'Ultra-clean single column design with subtle spacing and minimal decoration',
    'modern',
    true
  ),
  (
    'Executive',
    'executive',
    'Elegant premium design with serif fonts and golden accents for senior professionals',
    'professional',
    true
  ),
  (
    'Technical',
    'technical',
    'Developer-focused design with terminal aesthetics and monospace fonts',
    'technical',
    true
  )
ON CONFLICT (template_slug) DO NOTHING;

-- Verify templates were added
DO $$
DECLARE
  template_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO template_count FROM cv_templates WHERE is_active = true;
  RAISE NOTICE 'Total active templates: %', template_count;
END $$;
