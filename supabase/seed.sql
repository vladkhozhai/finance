-- FinanceFlow Seed Data
-- Sample data for local development and testing

-- Note: This seed file assumes you have at least one test user created
-- You can create a test user through Supabase Studio or auth signup

-- ============================================================================
-- SEED DATA VARIABLES
-- ============================================================================
-- Replace with your test user ID from auth.users
-- You can get this by running: SELECT id FROM auth.users LIMIT 1;

DO $$
DECLARE
  v_user_id UUID;
  v_food_category_id UUID;
  v_transport_category_id UUID;
  v_home_category_id UUID;
  v_entertainment_category_id UUID;
  v_salary_category_id UUID;
  v_coffee_tag_id UUID;
  v_grocery_tag_id UUID;
  v_taxi_tag_id UUID;
  v_travel_tag_id UUID;
  v_transaction1_id UUID;
  v_transaction2_id UUID;
  v_transaction3_id UUID;
BEGIN
  -- Get the first user (or create a test user if none exists)
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at LIMIT 1;

  -- If no user exists, exit (user needs to sign up first)
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No users found. Please create a user account first through Supabase Studio or signup.';
    RETURN;
  END IF;

  RAISE NOTICE 'Seeding data for user: %', v_user_id;

  -- ============================================================================
  -- CATEGORIES
  -- ============================================================================
  INSERT INTO categories (id, user_id, name, color, type)
  VALUES
    (uuid_generate_v4(), v_user_id, 'Food & Dining', '#EF4444', 'expense'),
    (uuid_generate_v4(), v_user_id, 'Transportation', '#3B82F6', 'expense'),
    (uuid_generate_v4(), v_user_id, 'Home & Utilities', '#10B981', 'expense'),
    (uuid_generate_v4(), v_user_id, 'Entertainment', '#F59E0B', 'expense'),
    (uuid_generate_v4(), v_user_id, 'Salary', '#8B5CF6', 'income')
  ON CONFLICT (user_id, name) DO NOTHING
  RETURNING id INTO v_food_category_id;

  -- Get category IDs
  SELECT id INTO v_food_category_id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining';
  SELECT id INTO v_transport_category_id FROM categories WHERE user_id = v_user_id AND name = 'Transportation';
  SELECT id INTO v_home_category_id FROM categories WHERE user_id = v_user_id AND name = 'Home & Utilities';
  SELECT id INTO v_entertainment_category_id FROM categories WHERE user_id = v_user_id AND name = 'Entertainment';
  SELECT id INTO v_salary_category_id FROM categories WHERE user_id = v_user_id AND name = 'Salary';

  RAISE NOTICE 'Created categories';

  -- ============================================================================
  -- TAGS
  -- ============================================================================
  INSERT INTO tags (id, user_id, name)
  VALUES
    (uuid_generate_v4(), v_user_id, 'coffee'),
    (uuid_generate_v4(), v_user_id, 'grocery'),
    (uuid_generate_v4(), v_user_id, 'taxi'),
    (uuid_generate_v4(), v_user_id, 'travel'),
    (uuid_generate_v4(), v_user_id, 'subscription'),
    (uuid_generate_v4(), v_user_id, 'urgent')
  ON CONFLICT (user_id, name) DO NOTHING;

  -- Get tag IDs
  SELECT id INTO v_coffee_tag_id FROM tags WHERE user_id = v_user_id AND name = 'coffee';
  SELECT id INTO v_grocery_tag_id FROM tags WHERE user_id = v_user_id AND name = 'grocery';
  SELECT id INTO v_taxi_tag_id FROM tags WHERE user_id = v_user_id AND name = 'taxi';
  SELECT id INTO v_travel_tag_id FROM tags WHERE user_id = v_user_id AND name = 'travel';

  RAISE NOTICE 'Created tags';

  -- ============================================================================
  -- TRANSACTIONS
  -- ============================================================================
  -- Current month transactions
  INSERT INTO transactions (id, user_id, category_id, amount, date, description)
  VALUES
    (uuid_generate_v4(), v_user_id, v_salary_category_id, 5000.00, DATE_TRUNC('month', CURRENT_DATE), 'Monthly Salary'),
    (uuid_generate_v4(), v_user_id, v_food_category_id, 15.50, CURRENT_DATE - INTERVAL '1 day', 'Coffee at Starbucks'),
    (uuid_generate_v4(), v_user_id, v_food_category_id, 45.80, CURRENT_DATE - INTERVAL '2 days', 'Grocery shopping'),
    (uuid_generate_v4(), v_user_id, v_transport_category_id, 12.00, CURRENT_DATE - INTERVAL '2 days', 'Taxi to office'),
    (uuid_generate_v4(), v_user_id, v_home_category_id, 150.00, CURRENT_DATE - INTERVAL '3 days', 'Electricity bill'),
    (uuid_generate_v4(), v_user_id, v_entertainment_category_id, 25.00, CURRENT_DATE - INTERVAL '5 days', 'Netflix subscription'),
    (uuid_generate_v4(), v_user_id, v_food_category_id, 8.50, CURRENT_DATE - INTERVAL '6 days', 'Morning coffee'),
    (uuid_generate_v4(), v_user_id, v_transport_category_id, 35.00, CURRENT_DATE - INTERVAL '7 days', 'Gas station'),
    (uuid_generate_v4(), v_user_id, v_food_category_id, 65.00, CURRENT_DATE - INTERVAL '8 days', 'Restaurant dinner'),
    (uuid_generate_v4(), v_user_id, v_food_category_id, 120.50, CURRENT_DATE - INTERVAL '10 days', 'Weekly groceries')
  RETURNING id INTO v_transaction1_id;

  -- Get transaction IDs for tagging
  SELECT id INTO v_transaction1_id FROM transactions WHERE user_id = v_user_id AND description = 'Coffee at Starbucks';
  SELECT id INTO v_transaction2_id FROM transactions WHERE user_id = v_user_id AND description = 'Grocery shopping';
  SELECT id INTO v_transaction3_id FROM transactions WHERE user_id = v_user_id AND description = 'Taxi to office';

  RAISE NOTICE 'Created transactions';

  -- ============================================================================
  -- TRANSACTION TAGS
  -- ============================================================================
  INSERT INTO transaction_tags (transaction_id, tag_id)
  VALUES
    (v_transaction1_id, v_coffee_tag_id),
    (v_transaction2_id, v_grocery_tag_id),
    (v_transaction3_id, v_taxi_tag_id);

  RAISE NOTICE 'Created transaction tags';

  -- ============================================================================
  -- BUDGETS
  -- ============================================================================
  -- Set budgets for current month
  INSERT INTO budgets (user_id, category_id, tag_id, amount, period, start_date)
  VALUES
    (v_user_id, v_food_category_id, NULL, 500.00, 'monthly', DATE_TRUNC('month', CURRENT_DATE)),
    (v_user_id, v_transport_category_id, NULL, 200.00, 'monthly', DATE_TRUNC('month', CURRENT_DATE)),
    (v_user_id, v_home_category_id, NULL, 300.00, 'monthly', DATE_TRUNC('month', CURRENT_DATE)),
    (v_user_id, NULL, v_coffee_tag_id, 50.00, 'monthly', DATE_TRUNC('month', CURRENT_DATE))
  ON CONFLICT (user_id, category_id, start_date) DO NOTHING;

  RAISE NOTICE 'Created budgets';
  RAISE NOTICE 'Seed data completed successfully!';

END $$;