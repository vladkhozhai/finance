-- Migration: Create transaction_templates and template_tags tables
-- Story: Transaction Templates (Card #46)
-- This enables users to save frequently used transaction patterns for quick entry

-- ============================================================================
-- TRANSACTION_TEMPLATES TABLE
-- ============================================================================
-- Reusable templates for common transactions (e.g., "Morning Coffee", "Monthly Rent")

CREATE TABLE transaction_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(12,2),  -- NULL for variable price templates
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
  description TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- 1. Name length validation
ALTER TABLE transaction_templates
ADD CONSTRAINT chk_template_name_length
CHECK (LENGTH(TRIM(name)) >= 1 AND LENGTH(name) <= 100);

-- 2. Amount must be positive if provided
ALTER TABLE transaction_templates
ADD CONSTRAINT chk_template_amount_positive
CHECK (amount IS NULL OR amount > 0);

-- 3. Unique constraint: template names must be unique per user
ALTER TABLE transaction_templates
ADD CONSTRAINT uq_user_template_name
UNIQUE (user_id, name);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index on user_id for efficient user queries
CREATE INDEX idx_transaction_templates_user_id ON transaction_templates(user_id);

-- Composite index for filtering favorite templates
CREATE INDEX idx_transaction_templates_user_favorite ON transaction_templates(user_id, is_favorite)
WHERE is_favorite = true;

-- Index on category_id for filtering templates by category
CREATE INDEX idx_transaction_templates_category_id ON transaction_templates(category_id)
WHERE category_id IS NOT NULL;

-- Index on payment_method_id for filtering templates by payment method
CREATE INDEX idx_transaction_templates_payment_method_id ON transaction_templates(payment_method_id)
WHERE payment_method_id IS NOT NULL;

-- Index on created_at for sorting templates by creation date
CREATE INDEX idx_transaction_templates_created_at ON transaction_templates(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on transaction_templates table
ALTER TABLE transaction_templates ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: Users can only view their own templates
CREATE POLICY "Users can view their own transaction templates"
  ON transaction_templates FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT Policy: Users can only create templates for themselves
CREATE POLICY "Users can create their own transaction templates"
  ON transaction_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy: Users can only update their own templates
CREATE POLICY "Users can update their own transaction templates"
  ON transaction_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE Policy: Users can only delete their own templates
CREATE POLICY "Users can delete their own transaction templates"
  ON transaction_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TEMPLATE_TAGS TABLE (Junction Table)
-- ============================================================================
-- Many-to-many relationship between transaction templates and tags

CREATE TABLE template_tags (
  template_id UUID NOT NULL REFERENCES transaction_templates(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (template_id, tag_id)
);

-- ============================================================================
-- INDEXES FOR TEMPLATE_TAGS
-- ============================================================================

-- Index on template_id for efficient template tag queries
CREATE INDEX idx_template_tags_template_id ON template_tags(template_id);

-- Index on tag_id for efficient tag-based template queries
CREATE INDEX idx_template_tags_tag_id ON template_tags(tag_id);

-- ============================================================================
-- ROW LEVEL SECURITY FOR TEMPLATE_TAGS
-- ============================================================================

-- Enable RLS on template_tags table
ALTER TABLE template_tags ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: Users can view tags on their own templates
CREATE POLICY "Users can view their own template tags"
  ON template_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM transaction_templates
      WHERE transaction_templates.id = template_tags.template_id
        AND transaction_templates.user_id = auth.uid()
    )
  );

-- INSERT Policy: Users can only add tags to their own templates
CREATE POLICY "Users can add tags to their own templates"
  ON template_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transaction_templates
      WHERE transaction_templates.id = template_tags.template_id
        AND transaction_templates.user_id = auth.uid()
    )
  );

-- DELETE Policy: Users can only remove tags from their own templates
CREATE POLICY "Users can delete tags from their own templates"
  ON template_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM transaction_templates
      WHERE transaction_templates.id = template_tags.template_id
        AND transaction_templates.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update updated_at timestamp on template modification
CREATE TRIGGER update_transaction_templates_updated_at
  BEFORE UPDATE ON transaction_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Normalize template name by trimming whitespace
CREATE OR REPLACE FUNCTION normalize_template_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Trim whitespace from name
  NEW.name = TRIM(NEW.name);

  -- Trim whitespace from description if provided
  IF NEW.description IS NOT NULL THEN
    NEW.description = TRIM(NEW.description);
    -- Set to NULL if empty after trimming
    IF NEW.description = '' THEN
      NEW.description = NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalize_transaction_template_data
  BEFORE INSERT OR UPDATE ON transaction_templates
  FOR EACH ROW
  EXECUTE FUNCTION normalize_template_name();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Get user's favorite templates count
CREATE OR REPLACE FUNCTION get_user_favorite_templates_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM transaction_templates
  WHERE user_id = p_user_id
    AND is_favorite = true;
$$;

-- Function: Create transaction from template
-- Returns the newly created transaction ID
CREATE OR REPLACE FUNCTION create_transaction_from_template(
  p_template_id UUID,
  p_user_id UUID,
  p_amount DECIMAL(12,2) DEFAULT NULL,  -- Override amount if template has NULL amount
  p_date DATE DEFAULT CURRENT_DATE,
  p_description TEXT DEFAULT NULL  -- Override description if needed
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_template RECORD;
  v_transaction_id UUID;
  v_final_amount DECIMAL(12,2);
  v_final_description TEXT;
BEGIN
  -- Fetch template data
  SELECT * INTO v_template
  FROM transaction_templates
  WHERE id = p_template_id
    AND user_id = p_user_id;

  -- Verify template exists and belongs to user
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found or access denied';
  END IF;

  -- Determine final amount (use override if template amount is NULL)
  IF v_template.amount IS NOT NULL THEN
    v_final_amount := v_template.amount;
  ELSIF p_amount IS NOT NULL THEN
    v_final_amount := p_amount;
  ELSE
    RAISE EXCEPTION 'Amount is required for variable price templates';
  END IF;

  -- Determine final description (use override if provided)
  v_final_description := COALESCE(p_description, v_template.description);

  -- Verify category exists (required for transactions)
  IF v_template.category_id IS NULL THEN
    RAISE EXCEPTION 'Template must have a category to create transaction';
  END IF;

  -- Create transaction
  INSERT INTO transactions (
    user_id,
    category_id,
    payment_method_id,
    amount,
    date,
    description
  ) VALUES (
    p_user_id,
    v_template.category_id,
    v_template.payment_method_id,
    v_final_amount,
    p_date,
    v_final_description
  ) RETURNING id INTO v_transaction_id;

  -- Copy tags from template to transaction
  INSERT INTO transaction_tags (transaction_id, tag_id)
  SELECT v_transaction_id, tag_id
  FROM template_tags
  WHERE template_id = p_template_id;

  RETURN v_transaction_id;
END;
$$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE transaction_templates IS 'Reusable transaction templates for quick entry of common transactions';
COMMENT ON COLUMN transaction_templates.id IS 'Unique identifier for the template';
COMMENT ON COLUMN transaction_templates.user_id IS 'Foreign key to auth.users (owner of the template)';
COMMENT ON COLUMN transaction_templates.name IS 'User-defined name for the template (e.g., "Morning Coffee", "Monthly Rent")';
COMMENT ON COLUMN transaction_templates.amount IS 'Default amount for the template (NULL for variable price templates)';
COMMENT ON COLUMN transaction_templates.category_id IS 'Default category for transactions created from this template';
COMMENT ON COLUMN transaction_templates.payment_method_id IS 'Default payment method for transactions created from this template';
COMMENT ON COLUMN transaction_templates.description IS 'Default description for transactions created from this template';
COMMENT ON COLUMN transaction_templates.is_favorite IS 'Flag indicating if this template should be shown in quick access/favorites';
COMMENT ON COLUMN transaction_templates.created_at IS 'Timestamp when the template was created';
COMMENT ON COLUMN transaction_templates.updated_at IS 'Timestamp when the template was last updated (auto-updated by trigger)';

COMMENT ON TABLE template_tags IS 'Junction table linking transaction templates to tags (many-to-many relationship)';
COMMENT ON COLUMN template_tags.template_id IS 'Foreign key to transaction_templates';
COMMENT ON COLUMN template_tags.tag_id IS 'Foreign key to tags';
COMMENT ON COLUMN template_tags.created_at IS 'Timestamp when the tag was added to the template';

COMMENT ON FUNCTION get_user_favorite_templates_count(UUID) IS 'Count the number of favorite templates for a user';
COMMENT ON FUNCTION create_transaction_from_template(UUID, UUID, DECIMAL, DATE, TEXT) IS 'Create a new transaction from a template with optional overrides for amount, date, and description';
COMMENT ON FUNCTION normalize_template_name() IS 'Trigger function normalizing template name and description by trimming whitespace';
