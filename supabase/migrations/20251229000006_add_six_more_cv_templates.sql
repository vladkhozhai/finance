-- Add 6 more CV templates to reach 12 total
-- Templates: Simple, Compact, Corporate, Academic, Elegant, Designer

INSERT INTO cv_templates (template_name, template_slug, description, category, is_active)
VALUES
  (
    'Simple',
    'simple',
    'Ultra-minimal monochrome design with maximum readability and clean typography',
    'minimal',
    true
  ),
  (
    'Compact',
    'compact',
    'Dense single-page layout with two-column design for content-rich CVs',
    'modern',
    true
  ),
  (
    'Corporate',
    'corporate',
    'Traditional business format with conservative navy blue styling, ATS-compatible',
    'professional',
    true
  ),
  (
    'Academic',
    'academic',
    'Research and education focused design with deep blue colors and serif-friendly typography',
    'professional',
    true
  ),
  (
    'Elegant',
    'elegant',
    'Sophisticated serif design with gold accents and generous spacing for refined professionals',
    'professional',
    true
  ),
  (
    'Designer',
    'designer',
    'Bold visual design with vibrant gradients and skill bars for creative professionals',
    'creative',
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
