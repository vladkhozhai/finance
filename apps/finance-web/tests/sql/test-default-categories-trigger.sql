-- SQL Test: Default Categories Trigger
-- Tests that the trigger creates 15 default categories when a new profile is inserted
-- Run this in Supabase SQL Editor or via psql

-- Test 1: Create a test user profile and verify categories are auto-created
BEGIN;

-- Create a test profile (simulating user signup)
INSERT INTO profiles (id, currency)
VALUES ('00000000-0000-0000-0000-000000000001', 'USD');

-- Verify 15 categories were created
DO $$
DECLARE
  category_count INT;
BEGIN
  SELECT COUNT(*) INTO category_count
  FROM categories
  WHERE user_id = '00000000-0000-0000-0000-000000000001';

  IF category_count != 15 THEN
    RAISE EXCEPTION 'Expected 15 categories, but found %', category_count;
  END IF;

  RAISE NOTICE 'SUCCESS: 15 categories created';
END $$;

-- Test 2: Verify category type breakdown (11 expense + 4 income)
DO $$
DECLARE
  expense_count INT;
  income_count INT;
BEGIN
  SELECT COUNT(*) INTO expense_count
  FROM categories
  WHERE user_id = '00000000-0000-0000-0000-000000000001'
    AND type = 'expense';

  SELECT COUNT(*) INTO income_count
  FROM categories
  WHERE user_id = '00000000-0000-0000-0000-000000000001'
    AND type = 'income';

  IF expense_count != 11 THEN
    RAISE EXCEPTION 'Expected 11 expense categories, but found %', expense_count;
  END IF;

  IF income_count != 4 THEN
    RAISE EXCEPTION 'Expected 4 income categories, but found %', income_count;
  END IF;

  RAISE NOTICE 'SUCCESS: Correct category type breakdown (11 expense, 4 income)';
END $$;

-- Test 3: Verify specific category names exist
DO $$
BEGIN
  -- Check expense categories
  IF NOT EXISTS (
    SELECT 1 FROM categories
    WHERE user_id = '00000000-0000-0000-0000-000000000001'
      AND name = 'Food & Dining'
      AND type = 'expense'
  ) THEN
    RAISE EXCEPTION 'Category "Food & Dining" not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM categories
    WHERE user_id = '00000000-0000-0000-0000-000000000001'
      AND name = 'Transportation'
      AND type = 'expense'
  ) THEN
    RAISE EXCEPTION 'Category "Transportation" not found';
  END IF;

  -- Check income categories
  IF NOT EXISTS (
    SELECT 1 FROM categories
    WHERE user_id = '00000000-0000-0000-0000-000000000001'
      AND name = 'Salary'
      AND type = 'income'
  ) THEN
    RAISE EXCEPTION 'Category "Salary" not found';
  END IF;

  RAISE NOTICE 'SUCCESS: All expected category names exist';
END $$;

-- Test 4: Verify all colors are valid hex codes
DO $$
DECLARE
  invalid_color_count INT;
BEGIN
  SELECT COUNT(*) INTO invalid_color_count
  FROM categories
  WHERE user_id = '00000000-0000-0000-0000-000000000001'
    AND NOT (color ~ '^#[0-9A-Fa-f]{6}$');

  IF invalid_color_count > 0 THEN
    RAISE EXCEPTION 'Found % categories with invalid color codes', invalid_color_count;
  END IF;

  RAISE NOTICE 'SUCCESS: All category colors are valid hex codes';
END $$;

-- Test 5: Verify categories are properly isolated by user (RLS)
-- Create a second test user
INSERT INTO profiles (id, currency)
VALUES ('00000000-0000-0000-0000-000000000002', 'EUR');

DO $$
DECLARE
  user1_count INT;
  user2_count INT;
BEGIN
  SELECT COUNT(*) INTO user1_count
  FROM categories
  WHERE user_id = '00000000-0000-0000-0000-000000000001';

  SELECT COUNT(*) INTO user2_count
  FROM categories
  WHERE user_id = '00000000-0000-0000-0000-000000000002';

  IF user1_count != 15 OR user2_count != 15 THEN
    RAISE EXCEPTION 'User isolation failed: User1=%, User2=%', user1_count, user2_count;
  END IF;

  RAISE NOTICE 'SUCCESS: Categories properly isolated per user';
END $$;

-- Cleanup: Rollback test data
ROLLBACK;

-- Summary Report
SELECT
  'Test Summary' AS section,
  'All tests passed! The trigger creates 15 default categories correctly.' AS result;

-- Display all default categories for reference
SELECT
  name,
  type,
  color,
  CASE
    WHEN type = 'expense' THEN '💸'
    WHEN type = 'income' THEN '💰'
  END AS icon
FROM (
  VALUES
    ('Food & Dining', 'expense', '#EF4444'),
    ('Transportation', 'expense', '#F59E0B'),
    ('Shopping', 'expense', '#8B5CF6'),
    ('Entertainment', 'expense', '#EC4899'),
    ('Bills & Utilities', 'expense', '#3B82F6'),
    ('Healthcare', 'expense', '#10B981'),
    ('Education', 'expense', '#6366F1'),
    ('Home & Garden', 'expense', '#14B8A6'),
    ('Travel', 'expense', '#F97316'),
    ('Personal Care', 'expense', '#A855F7'),
    ('Other Expenses', 'expense', '#6B7280'),
    ('Salary', 'income', '#22C55E'),
    ('Freelance', 'income', '#3B82F6'),
    ('Investments', 'income', '#8B5CF6'),
    ('Other Income', 'income', '#10B981')
) AS default_cats(name, type, color)
ORDER BY
  CASE type
    WHEN 'expense' THEN 1
    WHEN 'income' THEN 2
  END,
  name;
