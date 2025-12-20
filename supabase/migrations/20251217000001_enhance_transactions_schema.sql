-- Enhancement migration for transactions and transaction_tags tables
-- Adds missing requirements from PRD Card #5

-- ============================================================================
-- TRANSACTIONS TABLE ENHANCEMENTS
-- ============================================================================

-- 1. Add type column (income/expense) to transactions
ALTER TABLE transactions
ADD COLUMN type TEXT NOT NULL DEFAULT 'expense'
CHECK (LOWER(type) IN ('income', 'expense'));

-- 2. Add amount validation constraint (must be positive)
ALTER TABLE transactions
ADD CONSTRAINT transactions_amount_positive CHECK (amount > 0);

-- 3. Add description length constraint (max 500 characters)
ALTER TABLE transactions
ADD CONSTRAINT transactions_description_length CHECK (
  description IS NULL OR LENGTH(description) <= 500
);

-- 4. Update the updated_at trigger to normalize type to lowercase
CREATE OR REPLACE FUNCTION normalize_transaction_type()
RETURNS TRIGGER AS $$
BEGIN
  -- Convert type to lowercase for consistent storage
  NEW.type = LOWER(NEW.type);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalize_transactions_type
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION normalize_transaction_type();

-- ============================================================================
-- TRANSACTION_TAGS TABLE ENHANCEMENTS
-- ============================================================================

-- Current structure uses composite primary key (transaction_id, tag_id)
-- which already ensures uniqueness. Adding UPDATE policy as specified in PRD.

-- Add UPDATE policy for transaction_tags
CREATE POLICY "Users can update own transaction tags"
  ON transaction_tags FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = transaction_tags.transaction_id
      AND transactions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = transaction_tags.transaction_id
      AND transactions.user_id = auth.uid()
    )
  );

-- ============================================================================
-- UPDATE BALANCE CALCULATION FUNCTION
-- ============================================================================
-- Update get_user_balance function to use transaction.type instead of category.type

CREATE OR REPLACE FUNCTION get_user_balance(p_user_id UUID)
RETURNS DECIMAL(12, 2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance DECIMAL(12, 2);
BEGIN
  SELECT COALESCE(
    SUM(
      CASE
        WHEN t.type = 'income' THEN t.amount
        WHEN t.type = 'expense' THEN -t.amount
        ELSE 0
      END
    ), 0
  )
  INTO v_balance
  FROM transactions t
  WHERE t.user_id = p_user_id;

  RETURN v_balance;
END;
$$;

-- ============================================================================
-- INDEXES VERIFICATION
-- ============================================================================
-- All required indexes already exist from initial schema:
-- - idx_transactions_user_date (user_id, date DESC) ✓
-- - idx_transactions_category_id (category_id) ✓
-- - idx_transaction_tags_transaction_id (transaction_id) ✓
-- - idx_transaction_tags_tag_id (tag_id) ✓

-- Add index on transaction type for filtering
CREATE INDEX idx_transactions_type ON transactions(type);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE transactions IS 'Income and expense transactions with categorization and tagging support';
COMMENT ON COLUMN transactions.type IS 'Transaction type: income or expense (stored as lowercase)';
COMMENT ON COLUMN transactions.amount IS 'Transaction amount (must be positive, 2 decimal places)';
COMMENT ON COLUMN transactions.date IS 'Transaction date (defaults to current date)';
COMMENT ON COLUMN transactions.description IS 'Optional description (max 500 characters)';
COMMENT ON COLUMN transactions.category_id IS 'Category FK (ON DELETE RESTRICT prevents deletion of used categories)';

COMMENT ON TABLE transaction_tags IS 'Many-to-many junction table linking transactions to tags';
COMMENT ON COLUMN transaction_tags.transaction_id IS 'Transaction FK (ON DELETE CASCADE)';
COMMENT ON COLUMN transaction_tags.tag_id IS 'Tag FK (ON DELETE CASCADE)';
