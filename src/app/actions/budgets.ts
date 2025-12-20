"use server";

/**
 * Budget Server Actions
 *
 * Server-side logic for budget-related operations.
 * All functions are async and can be called from Client Components.
 *
 * Features:
 * - Period normalization to first day of month (DATE format)
 * - XOR constraint enforcement (category OR tag)
 * - Duplicate detection with proper unique constraints
 * - Progress calculation using budget_progress view
 * - Efficient joins for related data
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  type BudgetFilters,
  type BudgetProgressFilters,
  budgetFiltersSchema,
  budgetProgressFiltersSchema,
  type CreateBudgetInput,
  createBudgetSchema,
  type DeleteBudgetInput,
  deleteBudgetSchema,
  type GetBudgetByIdInput,
  getBudgetByIdSchema,
  type GetBudgetBreakdownInput,
  getBudgetBreakdownSchema,
  type UpdateBudgetInput,
  updateBudgetSchema,
} from "@/lib/validations/budget";
import { type ActionResult, error, success } from "@/lib/validations/shared";

/**
 * Budget with related data (category or tag info).
 */
export interface BudgetWithRelations {
  id: string;
  user_id: string;
  amount: number;
  period: string;
  category_id: string | null;
  tag_id: string | null;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    color: string;
    type: "expense" | "income";
  } | null;
  tag?: {
    id: string;
    name: string;
  } | null;
}

/**
 * Budget progress data from the budget_progress view.
 */
export interface BudgetProgress {
  id: string;
  user_id: string;
  category_id: string | null;
  tag_id: string | null;
  budget_amount: number;
  period: string;
  period_end: string;
  spent_amount: number;
  spent_percentage: number;
  is_overspent: boolean;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    color: string;
    type: "expense" | "income";
  } | null;
  tag?: {
    id: string;
    name: string;
  } | null;
}

/**
 * Normalizes a date string to the first day of the month.
 * Accepts YYYY-MM-DD or YYYY-MM format.
 *
 * @param dateStr - Date string to normalize
 * @returns First day of month in YYYY-MM-01 format
 */
function normalizeToFirstDayOfMonth(dateStr: string): string {
  // If already in YYYY-MM-01 format, return as-is
  if (/^\d{4}-\d{2}-01$/.test(dateStr)) {
    return dateStr;
  }

  // If in YYYY-MM format, append -01
  if (/^\d{4}-\d{2}$/.test(dateStr)) {
    return `${dateStr}-01`;
  }

  // If in YYYY-MM-DD format, replace day with 01
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr.replace(/-\d{2}$/, "-01");
  }

  throw new Error("Invalid date format");
}

/**
 * Creates a new budget for either a category or a tag.
 *
 * @param input - Budget data to create
 * @returns ActionResult with created budget ID
 */
export async function createBudget(
  input: CreateBudgetInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // 1. Validate input
    const validated = createBudgetSchema.safeParse(input);
    if (!validated.success) {
      return error(validated.error.issues[0].message);
    }

    // 2. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized. Please log in to create budgets.");
    }

    // 3. Normalize period to first day of month
    const normalizedPeriod = normalizeToFirstDayOfMonth(validated.data.period);

    // 4. Check for duplicate budget
    // The unique indexes will prevent duplicates, but we check explicitly for better error messages
    const existingBudgetQuery = supabase
      .from("budgets")
      .select("id")
      .eq("user_id", user.id)
      .eq("period", normalizedPeriod);

    if (validated.data.categoryId) {
      existingBudgetQuery.eq("category_id", validated.data.categoryId);
    } else if (validated.data.tagId) {
      existingBudgetQuery.eq("tag_id", validated.data.tagId);
    }

    const { data: existingBudget } = await existingBudgetQuery.maybeSingle();

    if (existingBudget) {
      return error(
        "A budget already exists for this category or tag in the specified period.",
      );
    }

    // 5. Insert budget
    const { data: budget, error: insertError } = await supabase
      .from("budgets")
      .insert({
        user_id: user.id,
        amount: validated.data.amount,
        period: normalizedPeriod,
        category_id: validated.data.categoryId || null,
        tag_id: validated.data.tagId || null,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Budget insert error:", insertError);

      // Check for unique constraint violation
      if (insertError.code === "23505") {
        return error(
          "A budget already exists for this category or tag in the specified period.",
        );
      }

      return error("Failed to create budget. Please try again.");
    }

    // 6. Revalidate affected paths
    revalidatePath("/dashboard");
    revalidatePath("/budgets");

    return success({ id: budget.id });
  } catch (err) {
    console.error("Unexpected error in createBudget:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Updates an existing budget.
 * Note: Category/tag cannot be changed (delete and recreate instead).
 *
 * @param input - Budget data to update
 * @returns ActionResult with success status
 */
export async function updateBudget(
  input: UpdateBudgetInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // 1. Validate input
    const validated = updateBudgetSchema.safeParse(input);
    if (!validated.success) {
      return error(validated.error.issues[0].message);
    }

    // 2. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized. Please log in to update budgets.");
    }

    // 3. Build update object (only include provided fields)
    const updateData: {
      amount?: number;
      period?: string;
    } = {};

    if (validated.data.amount !== undefined) {
      updateData.amount = validated.data.amount;
    }

    if (validated.data.period !== undefined) {
      updateData.period = normalizeToFirstDayOfMonth(validated.data.period);
    }

    // 4. Check if update would create duplicate
    if (updateData.period) {
      // Get existing budget to check category_id/tag_id
      const { data: existingBudget, error: fetchError } = await supabase
        .from("budgets")
        .select("category_id, tag_id")
        .eq("id", validated.data.id)
        .eq("user_id", user.id)
        .single();

      if (fetchError) {
        console.error("Budget fetch error:", fetchError);
        return error("Budget not found.");
      }

      // Check for duplicate with new period
      const duplicateQuery = supabase
        .from("budgets")
        .select("id")
        .eq("user_id", user.id)
        .eq("period", updateData.period)
        .neq("id", validated.data.id); // Exclude current budget

      if (existingBudget.category_id) {
        duplicateQuery.eq("category_id", existingBudget.category_id);
      } else if (existingBudget.tag_id) {
        duplicateQuery.eq("tag_id", existingBudget.tag_id);
      }

      const { data: duplicate } = await duplicateQuery.maybeSingle();

      if (duplicate) {
        return error(
          "A budget already exists for this category or tag in the specified period.",
        );
      }
    }

    // 5. Update budget (RLS ensures user can only update their own)
    const { error: updateError } = await supabase
      .from("budgets")
      .update(updateData)
      .eq("id", validated.data.id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Budget update error:", updateError);

      // Check for unique constraint violation
      if (updateError.code === "23505") {
        return error(
          "A budget already exists for this category or tag in the specified period.",
        );
      }

      return error("Failed to update budget. Please try again.");
    }

    // 6. Revalidate affected paths
    revalidatePath("/dashboard");
    revalidatePath("/budgets");

    return success({ id: validated.data.id });
  } catch (err) {
    console.error("Unexpected error in updateBudget:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Deletes a budget.
 *
 * @param input - Budget ID to delete
 * @returns ActionResult with success status
 */
export async function deleteBudget(
  input: DeleteBudgetInput,
): Promise<ActionResult<void>> {
  try {
    // 1. Validate input
    const validated = deleteBudgetSchema.safeParse(input);
    if (!validated.success) {
      return error(validated.error.issues[0].message);
    }

    // 2. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized. Please log in to delete budgets.");
    }

    // 3. Delete budget
    const { error: deleteError } = await supabase
      .from("budgets")
      .delete()
      .eq("id", validated.data.id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Budget delete error:", deleteError);
      return error("Failed to delete budget. Please try again.");
    }

    // 4. Revalidate affected paths
    revalidatePath("/dashboard");
    revalidatePath("/budgets");

    return success(undefined);
  } catch (err) {
    console.error("Unexpected error in deleteBudget:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Gets all budgets for the current user with optional filters.
 * Includes related category and tag data via joins.
 *
 * @param filters - Optional filters for budgets
 * @returns ActionResult with array of budgets
 */
export async function getBudgets(
  filters?: BudgetFilters,
): Promise<ActionResult<BudgetWithRelations[]>> {
  try {
    // 1. Validate filters
    const validated = filters
      ? budgetFiltersSchema.safeParse(filters)
      : { success: true as const, data: {} };

    if (!validated.success) {
      return error(validated.error.issues[0].message);
    }

    // 2. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized. Please log in to view budgets.");
    }

    // 3. Build query with joins
    let query = supabase
      .from("budgets")
      .select(
        `
        id,
        user_id,
        amount,
        period,
        category_id,
        tag_id,
        created_at,
        updated_at,
        category:categories (
          id,
          name,
          color,
          type
        ),
        tag:tags (
          id,
          name
        )
      `,
      )
      .eq("user_id", user.id)
      .order("period", { ascending: false });

    // 4. Apply filters
    const filterData = validated.data;

    if (filterData.categoryId) {
      query = query.eq("category_id", filterData.categoryId);
    }

    if (filterData.tagId) {
      query = query.eq("tag_id", filterData.tagId);
    }

    // Only apply period filter if a valid date value is provided
    // Empty strings are converted to undefined by validation schema
    if (filterData.period) {
      const normalizedPeriod = normalizeToFirstDayOfMonth(filterData.period);
      query = query.eq("period", normalizedPeriod);
    } else if (filterData.month) {
      const normalizedPeriod = normalizeToFirstDayOfMonth(filterData.month);
      query = query.eq("period", normalizedPeriod);
    }
    // When no period/month filter is provided, return all periods

    if (filterData.limit) {
      query = query.limit(filterData.limit);
    }

    if (filterData.offset) {
      query = query.range(
        filterData.offset,
        filterData.offset + (filterData.limit || 20) - 1,
      );
    }

    // 5. Execute query
    const { data: budgets, error: fetchError } = await query;

    if (fetchError) {
      console.error("Budgets fetch error:", fetchError);
      return error("Failed to fetch budgets. Please try again.");
    }

    return success(budgets as BudgetWithRelations[]);
  } catch (err) {
    console.error("Unexpected error in getBudgets:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Gets a single budget by ID with all details.
 * Includes category/tag info and calculated spent amount.
 *
 * @param input - Budget ID
 * @returns ActionResult with budget details
 */
export async function getBudgetById(
  input: GetBudgetByIdInput,
): Promise<ActionResult<BudgetWithRelations>> {
  try {
    // 1. Validate input
    const validated = getBudgetByIdSchema.safeParse(input);
    if (!validated.success) {
      return error(validated.error.issues[0].message);
    }

    // 2. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized. Please log in to view budgets.");
    }

    // 3. Fetch budget with relations
    const { data: budget, error: fetchError } = await supabase
      .from("budgets")
      .select(
        `
        id,
        user_id,
        amount,
        period,
        category_id,
        tag_id,
        created_at,
        updated_at,
        category:categories (
          id,
          name,
          color,
          type
        ),
        tag:tags (
          id,
          name
        )
      `,
      )
      .eq("id", validated.data.id)
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      console.error("Budget fetch error:", fetchError);
      return error("Budget not found.");
    }

    return success(budget as BudgetWithRelations);
  } catch (err) {
    console.error("Unexpected error in getBudgetById:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Gets budget progress data using the budget_progress view.
 * Includes calculated spent amounts, percentages, and overspent indicators.
 *
 * @param filters - Optional filters for budget progress
 * @returns ActionResult with array of budget progress data
 */
export async function getBudgetProgress(
  filters?: BudgetProgressFilters,
): Promise<ActionResult<BudgetProgress[]>> {
  try {
    // 1. Validate filters
    const validated = filters
      ? budgetProgressFiltersSchema.safeParse(filters)
      : { success: true as const, data: {} };

    if (!validated.success) {
      return error(validated.error.issues[0].message);
    }

    // 2. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized. Please log in to view budget progress.");
    }

    // 3. Build query on budget_progress view with joins
    let query = supabase
      .from("budget_progress")
      .select(
        `
        id,
        user_id,
        category_id,
        tag_id,
        budget_amount,
        period,
        period_end,
        spent_amount,
        spent_percentage,
        is_overspent,
        created_at,
        updated_at,
        category:categories (
          id,
          name,
          color,
          type
        ),
        tag:tags (
          id,
          name
        )
      `,
      )
      .eq("user_id", user.id)
      .order("period", { ascending: false });

    // 4. Apply filters
    const filterData = validated.data;

    if (filterData.categoryId) {
      query = query.eq("category_id", filterData.categoryId);
    }

    if (filterData.tagId) {
      query = query.eq("tag_id", filterData.tagId);
    }

    // Apply period filter if provided
    // If no period is provided, return all periods (do not default to current month)
    if (filterData.period) {
      const normalizedPeriod = normalizeToFirstDayOfMonth(filterData.period);
      query = query.eq("period", normalizedPeriod);
    } else if (filterData.month) {
      const normalizedPeriod = normalizeToFirstDayOfMonth(filterData.month);
      query = query.eq("period", normalizedPeriod);
    }
    // When no period filter is provided, return all periods

    if (filterData.limit) {
      query = query.limit(filterData.limit);
    }

    if (filterData.offset) {
      query = query.range(
        filterData.offset,
        filterData.offset + (filterData.limit || 20) - 1,
      );
    }

    // 5. Execute query
    const { data: budgetProgress, error: fetchError } = await query;

    if (fetchError) {
      console.error("Budget progress fetch error:", fetchError);
      return error("Failed to fetch budget progress. Please try again.");
    }

    return success(budgetProgress as BudgetProgress[]);
  } catch (err) {
    console.error("Unexpected error in getBudgetProgress:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Budget breakdown item by payment method.
 */
export interface BudgetBreakdownItem {
  paymentMethodId: string | null;
  paymentMethodName: string;
  paymentMethodCurrency: string;
  amountSpent: number;
  percentage: number;
  transactionCount: number;
  color: string;
}

/**
 * Budget breakdown response with budget details and spending by payment method.
 */
export interface BudgetBreakdownResponse {
  budget: {
    id: string;
    name: string;
    amount: number;
    currency: string;
    period: string;
    categoryId: string | null;
    tagId: string | null;
  };
  totalSpent: number;
  breakdown: BudgetBreakdownItem[];
}

/**
 * Gets budget spending breakdown by payment method and currency.
 * Shows how much of a budget's spending came from each payment method.
 * All amounts are in the user's base currency (already converted).
 *
 * @param input - Budget ID to analyze
 * @returns ActionResult with budget breakdown data
 */
export async function getBudgetBreakdownByPaymentMethod(
  input: GetBudgetBreakdownInput,
): Promise<ActionResult<BudgetBreakdownResponse>> {
  try {
    // 1. Validate input
    const validated = getBudgetBreakdownSchema.safeParse(input);
    if (!validated.success) {
      return error(validated.error.issues[0].message);
    }

    // 2. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized. Please log in to view budget breakdown.");
    }

    // 3. Get user's base currency from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("currency")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return error("User profile not found.");
    }

    const userBaseCurrency = profile.currency || "USD";

    // 4. Fetch budget with relations
    const { data: budget, error: fetchError } = await supabase
      .from("budgets")
      .select(
        `
        id,
        amount,
        period,
        category_id,
        tag_id,
        category:categories (
          id,
          name,
          color,
          type
        ),
        tag:tags (
          id,
          name
        )
      `,
      )
      .eq("id", validated.data.budgetId)
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      console.error("Budget fetch error:", fetchError);
      return error("Budget not found.");
    }

    // 5. Calculate period start and end dates
    const periodDate = new Date(budget.period);
    const periodStart = new Date(
      periodDate.getFullYear(),
      periodDate.getMonth(),
      1,
    )
      .toISOString()
      .split("T")[0];
    const periodEnd = new Date(
      periodDate.getFullYear(),
      periodDate.getMonth() + 1,
      0,
    )
      .toISOString()
      .split("T")[0];

    // 6. Build query for transactions based on category or tag
    let transactionsQuery;

    if (budget.category_id) {
      // Category-based budget
      transactionsQuery = supabase
        .from("transactions")
        .select(
          `
          id,
          amount,
          payment_method_id,
          payment_method:payment_methods (
            id,
            name,
            currency,
            color
          )
        `,
        )
        .eq("user_id", user.id)
        .eq("category_id", budget.category_id)
        .eq("type", "expense")
        .gte("date", periodStart)
        .lte("date", periodEnd);
    } else if (budget.tag_id) {
      // Tag-based budget - need to join through transaction_tags
      transactionsQuery = supabase
        .from("transaction_tags")
        .select(
          `
          transaction:transactions!inner (
            id,
            amount,
            user_id,
            payment_method_id,
            date,
            type,
            payment_method:payment_methods (
              id,
              name,
              currency,
              color
            )
          )
        `,
        )
        .eq("tag_id", budget.tag_id)
        .eq("transaction.user_id", user.id)
        .eq("transaction.type", "expense")
        .gte("transaction.date", periodStart)
        .lte("transaction.date", periodEnd);
    } else {
      return error("Budget must have either a category or tag.");
    }

    // 7. Execute query
    const { data: transactionsData, error: transactionsError } =
      await transactionsQuery;

    if (transactionsError) {
      console.error("Transactions fetch error:", transactionsError);
      return error("Failed to fetch transactions. Please try again.");
    }

    // 8. Extract transactions from the result
    // For tag-based budgets, transactions are nested in transaction_tags
    const transactions = budget.tag_id
      ? (transactionsData || []).map((item: any) => item.transaction)
      : transactionsData || [];

    // 9. Group transactions by payment method
    const paymentMethodGroups = new Map<
      string,
      {
        name: string;
        currency: string;
        color: string;
        amount: number;
        count: number;
      }
    >();

    let totalSpent = 0;

    for (const transaction of transactions) {
      const amount = Math.abs(transaction.amount); // Use absolute value for expenses
      totalSpent += amount;

      const pmId = transaction.payment_method_id || "legacy";
      const pmName = transaction.payment_method?.name || "Legacy Transactions";
      const pmCurrency =
        transaction.payment_method?.currency || userBaseCurrency;
      const pmColor = transaction.payment_method?.color || "#6B7280"; // Gray for legacy

      if (paymentMethodGroups.has(pmId)) {
        const group = paymentMethodGroups.get(pmId)!;
        group.amount += amount;
        group.count += 1;
      } else {
        paymentMethodGroups.set(pmId, {
          name: pmName,
          currency: pmCurrency,
          color: pmColor,
          amount,
          count: 1,
        });
      }
    }

    // 10. Convert to breakdown array and calculate percentages
    const breakdown: BudgetBreakdownItem[] = Array.from(
      paymentMethodGroups.entries(),
    )
      .map(([pmId, group]) => ({
        paymentMethodId: pmId === "legacy" ? null : pmId,
        paymentMethodName: group.name,
        paymentMethodCurrency: group.currency,
        amountSpent: group.amount,
        percentage:
          budget.amount > 0 ? (group.amount / budget.amount) * 100 : 0,
        transactionCount: group.count,
        color: group.color,
      }))
      .sort((a, b) => b.amountSpent - a.amountSpent); // Sort by amount descending

    // 11. Prepare budget name (category or tag name)
    const budgetName = budget.category
      ? budget.category.name
      : budget.tag
        ? `#${budget.tag.name}`
        : "Unknown";

    // 12. Return response
    return success({
      budget: {
        id: budget.id,
        name: budgetName,
        amount: budget.amount,
        currency: userBaseCurrency,
        period: budget.period,
        categoryId: budget.category_id,
        tagId: budget.tag_id,
      },
      totalSpent,
      breakdown,
    });
  } catch (err) {
    console.error(
      "Unexpected error in getBudgetBreakdownByPaymentMethod:",
      err,
    );
    return error("An unexpected error occurred. Please try again.");
  }
}
