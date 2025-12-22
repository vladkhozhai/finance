-- Migration: Create default categories trigger
-- Description: Automatically creates 15 default categories (11 expense + 4 income) when a new user profile is created
-- Author: Backend Developer
-- Date: 2025-12-22

-- Function to create default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default expense categories with thoughtful color coding
  INSERT INTO categories (user_id, name, type, color) VALUES
    (NEW.id, 'Food & Dining', 'expense', '#EF4444'),      -- Red (warm, food-related)
    (NEW.id, 'Transportation', 'expense', '#F59E0B'),     -- Amber (warning/movement)
    (NEW.id, 'Shopping', 'expense', '#8B5CF6'),           -- Violet (retail/luxury)
    (NEW.id, 'Entertainment', 'expense', '#EC4899'),      -- Pink (fun/leisure)
    (NEW.id, 'Bills & Utilities', 'expense', '#3B82F6'),  -- Blue (essential/stable)
    (NEW.id, 'Healthcare', 'expense', '#10B981'),         -- Emerald (health/wellness)
    (NEW.id, 'Education', 'expense', '#6366F1'),          -- Indigo (knowledge/learning)
    (NEW.id, 'Home & Garden', 'expense', '#14B8A6'),      -- Teal (home/nature)
    (NEW.id, 'Travel', 'expense', '#F97316'),             -- Orange (adventure/energy)
    (NEW.id, 'Personal Care', 'expense', '#A855F7'),      -- Purple (self-care)
    (NEW.id, 'Other Expenses', 'expense', '#6B7280');     -- Gray (miscellaneous)

  -- Insert default income categories
  INSERT INTO categories (user_id, name, type, color) VALUES
    (NEW.id, 'Salary', 'income', '#22C55E'),              -- Green (money/growth)
    (NEW.id, 'Freelance', 'income', '#3B82F6'),           -- Blue (professional)
    (NEW.id, 'Investments', 'income', '#8B5CF6'),         -- Violet (wealth/premium)
    (NEW.id, 'Other Income', 'income', '#10B981');        -- Emerald (positive/extra)

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS trigger_create_default_categories ON profiles;

-- Create trigger on profiles table
CREATE TRIGGER trigger_create_default_categories
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_categories();

-- Add comment for documentation
COMMENT ON FUNCTION create_default_categories() IS
  'Automatically creates 15 default categories (11 expense + 4 income) when a new user profile is created. This improves onboarding by allowing users to immediately create transactions without manual category setup.';

COMMENT ON TRIGGER trigger_create_default_categories ON profiles IS
  'Triggers default category creation for every new user profile';
