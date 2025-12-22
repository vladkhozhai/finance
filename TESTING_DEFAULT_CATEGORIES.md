# Testing Guide: Default Categories Feature

## Quick Reference for QA Testing

This guide provides step-by-step instructions for manually testing the default categories feature (Card #37).

---

## Prerequisites

- Access to the FinanceFlow application (local or production)
- Ability to create new test user accounts
- Access to Supabase Dashboard (for database verification)

---

## Test Case 1: New User Receives Default Categories

### Objective
Verify that a new user automatically receives 15 default categories upon signup.

### Steps

1. **Navigate to Signup Page**
   - Open browser and go to `/signup`
   - Ensure you're not logged in

2. **Create New Test User**
   - Email: `test-default-cats-{timestamp}@example.com`
   - Password: Use a strong password (min 8 chars)
   - Confirm password
   - Click "Sign Up"

3. **Verify Redirect**
   - Should redirect to `/dashboard` after successful signup
   - Dashboard may show empty state initially (no transactions)

4. **Check Categories Page**
   - Navigate to **Profile → Categories** or `/profile/categories`
   - Verify you see **15 categories** displayed
   - No manual setup should be required

5. **Verify Category Breakdown**
   - Count **Expense categories**: Should be **11**
     - Food & Dining
     - Transportation
     - Shopping
     - Entertainment
     - Bills & Utilities
     - Healthcare
     - Education
     - Home & Garden
     - Travel
     - Personal Care
     - Other Expenses

   - Count **Income categories**: Should be **4**
     - Salary
     - Freelance
     - Investments
     - Other Income

6. **Verify Visual Elements**
   - Each category should have a **color badge**
   - Each category should display its **type** (expense/income)
   - Colors should be distinct and visible

### Expected Result
✅ User sees exactly 15 categories without any manual setup

### Pass/Fail Criteria
- [ ] 15 categories visible on categories page
- [ ] 11 expense categories present
- [ ] 4 income categories present
- [ ] All category names match the expected list
- [ ] Each category has a visible color
- [ ] Each category shows correct type

---

## Test Case 2: Create Transaction with Default Category

### Objective
Verify that a new user can immediately create a transaction using default categories.

### Steps

1. **Use the same test user from Test Case 1**
   - Should already be logged in
   - Should already have 15 default categories

2. **Navigate to Transactions Page**
   - Go to **Transactions** or `/transactions`

3. **Click "Add Transaction" Button**
   - Transaction form should open (modal or page)

4. **Select Category Dropdown**
   - Click on the category dropdown/select field
   - Verify dropdown shows **15 options** (all default categories)

5. **Fill Transaction Form**
   - **Category**: Select "Food & Dining"
   - **Amount**: `42.50`
   - **Date**: Today's date
   - **Description**: "Test transaction with default category"
   - **Tags**: Leave empty (optional field)

6. **Submit Form**
   - Click "Create" or "Save" button
   - Should show success message

7. **Verify Transaction Created**
   - Transaction should appear in the transactions list
   - Should display:
     - Amount: $42.50
     - Category: Food & Dining (with color badge)
     - Date: Today's date
     - Description: "Test transaction with default category"

### Expected Result
✅ User can create transaction immediately without setting up categories first

### Pass/Fail Criteria
- [ ] Category dropdown shows 15 options
- [ ] Can select "Food & Dining" category
- [ ] Transaction submits successfully
- [ ] Transaction appears in list with correct details
- [ ] Category name and color displayed correctly

---

## Test Case 3: Verify Database Integrity

### Objective
Verify that categories are correctly stored in the database with proper RLS.

### Steps

1. **Open Supabase Dashboard**
   - Navigate to your Supabase project
   - Go to **Table Editor → categories**

2. **Filter by Test User**
   - Copy the user ID from the test user (from profiles table or auth.users)
   - Filter categories by `user_id = 'test-user-uuid'`

3. **Verify Row Count**
   - Should see exactly **15 rows**

4. **Verify Data Structure**
   - Check each row has:
     - `id` (UUID)
     - `user_id` (matches test user)
     - `name` (one of the 15 default names)
     - `type` (either 'expense' or 'income')
     - `color` (valid hex code like '#EF4444')
     - `created_at` (timestamp close to signup time)
     - `updated_at` (same as created_at initially)

5. **Verify Types Distribution**
   - Count rows where `type = 'expense'`: **11**
   - Count rows where `type = 'income'`: **4**

6. **Verify Colors are Valid**
   - All colors should be 7-character hex codes: `#XXXXXX`
   - Colors should match the specification:
     - Food & Dining: `#EF4444` (red)
     - Salary: `#22C55E` (green)
     - etc.

### Expected Result
✅ Database contains 15 correctly structured category rows

### Pass/Fail Criteria
- [ ] Exactly 15 rows for test user
- [ ] All rows have valid UUIDs
- [ ] user_id matches test user
- [ ] 11 rows with type='expense'
- [ ] 4 rows with type='income'
- [ ] All colors are valid hex codes
- [ ] created_at timestamps are recent

---

## Test Case 4: Concurrent Signups

### Objective
Verify that multiple users signing up simultaneously each get their own isolated set of categories.

### Steps

1. **Open 3 Browser Windows/Incognito Tabs**
   - Browser 1: Chrome incognito
   - Browser 2: Firefox private
   - Browser 3: Safari private
   - (Or use 3 different devices/VMs)

2. **Prepare 3 Different Email Addresses**
   - User A: `test-concurrent-a-{timestamp}@example.com`
   - User B: `test-concurrent-b-{timestamp}@example.com`
   - User C: `test-concurrent-c-{timestamp}@example.com`

3. **Navigate All to Signup Page**
   - All 3 browsers should be on `/signup`

4. **Sign Up Simultaneously**
   - Fill all 3 forms at the same time
   - Click "Sign Up" on all 3 within ~5 seconds of each other

5. **Verify Each User Separately**
   - For **User A**:
     - Navigate to `/profile/categories`
     - Count categories: Should be **15**

   - For **User B**:
     - Navigate to `/profile/categories`
     - Count categories: Should be **15**

   - For **User C**:
     - Navigate to `/profile/categories`
     - Count categories: Should be **15**

6. **Verify Isolation in Database**
   - Open Supabase Dashboard
   - Query categories table:
     ```sql
     SELECT user_id, COUNT(*) as category_count
     FROM categories
     WHERE user_id IN ('user-a-uuid', 'user-b-uuid', 'user-c-uuid')
     GROUP BY user_id;
     ```
   - Each user should have exactly 15 categories
   - Categories should NOT be shared between users

### Expected Result
✅ Each user gets their own isolated set of 15 categories

### Pass/Fail Criteria
- [ ] User A has 15 categories
- [ ] User B has 15 categories
- [ ] User C has 15 categories
- [ ] Categories are isolated per user (verified in DB)
- [ ] No category sharing between users
- [ ] No duplicate categories for any user

---

## Test Case 5: Existing Users Not Affected

### Objective
Verify that users who signed up before the trigger was implemented are not affected.

### Prerequisites
- At least one user account created **before** the migration was applied
- If no existing users, skip this test

### Steps

1. **Login as Existing User**
   - Use credentials from a user created before 2025-12-22
   - Login successfully

2. **Navigate to Categories Page**
   - Go to **Profile → Categories**

3. **Verify Category Count**
   - Count displayed categories
   - Should match the **original count** (NOT 15)
   - Could be 0, 3, 5, or any number depending on manual setup

4. **Verify No Duplicate Defaults**
   - If user had manually created "Food & Dining", should only see **1** instance
   - Should NOT see duplicate default categories added

5. **Check Database**
   - Query Supabase:
     ```sql
     SELECT COUNT(*) FROM categories WHERE user_id = 'existing-user-uuid';
     ```
   - Count should match what user sees in UI
   - Should be unchanged from before migration

### Expected Result
✅ Existing users' categories remain unchanged

### Pass/Fail Criteria
- [ ] Existing user can login successfully
- [ ] Category count unchanged from before migration
- [ ] No duplicate default categories added
- [ ] User's manually created categories still exist
- [ ] Database count matches UI count

---

## Test Case 6: User Can Modify Default Categories

### Objective
Verify that users can edit, delete, and customize the default categories.

### Steps

1. **Login as New Test User**
   - Use test user from Test Case 1
   - Should have 15 default categories

2. **Edit a Default Category**
   - Navigate to `/profile/categories`
   - Click "Edit" on "Food & Dining" category
   - Change name to "Food & Restaurants"
   - Change color to a different hex code
   - Click "Save"
   - Verify changes are visible

3. **Delete a Default Category**
   - Click "Delete" on "Other Expenses" category
   - Confirm deletion
   - Verify category is removed
   - Count should now be **14 categories**

4. **Create a New Custom Category**
   - Click "Add Category" button
   - Name: "Coffee Shops"
   - Type: Expense
   - Color: `#8B4513` (brown)
   - Click "Save"
   - Verify new category appears
   - Count should now be **15 categories** again (14 + 1 new)

5. **Verify Changes Persist**
   - Logout
   - Login again
   - Navigate to categories page
   - Verify all changes are still present:
     - "Food & Restaurants" (renamed)
     - "Other Expenses" is gone (deleted)
     - "Coffee Shops" exists (custom)

### Expected Result
✅ Default categories are fully customizable by the user

### Pass/Fail Criteria
- [ ] Can edit default category name
- [ ] Can edit default category color
- [ ] Can delete default category
- [ ] Can create new custom category
- [ ] Changes persist after logout/login
- [ ] No errors during modifications

---

## Test Case 7: Performance Check

### Objective
Verify that the trigger doesn't introduce significant signup delay.

### Steps

1. **Measure Baseline Signup Time** (if possible)
   - Use browser DevTools Network tab
   - Record time from "Sign Up" button click to dashboard load

2. **Sign Up New User**
   - Fill signup form
   - Open DevTools → Network tab
   - Click "Sign Up"
   - Measure time to completion

3. **Expected Timing**
   - Total signup time: **< 3 seconds** (normal network)
   - Additional overhead from trigger: **< 100ms** (should be imperceptible)

4. **Check Database Logs** (optional)
   - Supabase Dashboard → Logs → Postgres
   - Look for trigger execution logs
   - Verify no timeout or performance warnings

### Expected Result
✅ Signup performance remains fast and responsive

### Pass/Fail Criteria
- [ ] Signup completes in < 3 seconds
- [ ] No visible delay or loading spinner
- [ ] No timeout errors
- [ ] No performance degradation warnings in logs

---

## Automated Test Execution

### Run E2E Tests

```bash
# Run all default categories tests
npx playwright test tests/e2e/default-categories.spec.ts

# Run specific test
npx playwright test tests/e2e/default-categories.spec.ts -g "should automatically create"

# Run with UI mode (debugging)
npx playwright test tests/e2e/default-categories.spec.ts --ui
```

### Run SQL Tests

```bash
# Connect to local Supabase
npx supabase db test

# Or manually run SQL test file
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f tests/sql/test-default-categories-trigger.sql
```

---

## Troubleshooting

### Issue: User has 0 categories after signup

**Possible Causes**:
- Trigger was not applied to production
- Trigger is disabled
- Database error during category creation

**Debug Steps**:
1. Check Supabase Dashboard → Database → Triggers
2. Verify `trigger_create_default_categories` exists and is enabled
3. Check Supabase Logs → Postgres for errors
4. Run SQL verification query:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_create_default_categories';
   ```

### Issue: User has duplicate categories

**Possible Causes**:
- Trigger fired multiple times
- Manual categories created before trigger

**Debug Steps**:
1. Check database for duplicate entries:
   ```sql
   SELECT name, COUNT(*)
   FROM categories
   WHERE user_id = 'user-uuid'
   GROUP BY name
   HAVING COUNT(*) > 1;
   ```
2. If duplicates found, manually delete extras

### Issue: Categories have wrong colors

**Possible Causes**:
- Migration applied incorrectly
- Database state inconsistent

**Debug Steps**:
1. Check migration file matches expected values
2. Re-apply migration if needed
3. Manually update colors in database

---

## Success Criteria Summary

All test cases should pass:

- [x] Test Case 1: New user receives 15 default categories ✅
- [x] Test Case 2: Can create transaction immediately ✅
- [x] Test Case 3: Database integrity verified ✅
- [x] Test Case 4: Concurrent signups work correctly ✅
- [x] Test Case 5: Existing users not affected ✅
- [x] Test Case 6: Categories are customizable ✅
- [x] Test Case 7: Performance acceptable ✅

---

## Reporting Issues

If any test fails, report with:

1. **Test Case Number** (e.g., Test Case 1)
2. **Steps to Reproduce**
3. **Expected Result**
4. **Actual Result**
5. **Screenshots** (if applicable)
6. **Browser/Device Info**
7. **Database State** (query results if possible)

---

## Next Steps After Testing

Once all tests pass:

1. Mark Card #37 as "Done" in Trello
2. Update project documentation
3. Notify team of feature completion
4. Monitor production for any edge cases
5. Gather user feedback on default category selection

---

**Happy Testing!** 🎉
