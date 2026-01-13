"use server";

/**
 * Transaction Server Actions
 *
 * Server-side logic for transaction-related operations.
 * All functions are async and can be called from Client Components.
 *
 * Features:
 * - CRUD operations with atomic tag management
 * - Advanced filtering (by type, category, tags, date range)
 * - Pagination support
 * - Balance calculation using database function
 * - Full RLS security
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult, error, success } from "@/lib/validations/shared";
import {
  type CreateTransactionInput,
  createTransactionSchema,
  type DeleteTransactionInput,
  deleteTransactionSchema,
  type GetTransactionsFilter,
  getTransactionsFilterSchema,
  type UpdateTransactionInput,
  updateTransactionSchema,
} from "@/lib/validations/transaction";
import {
  calculateBaseAmount,
  getExchangeRate,
} from "@/lib/utils/currency-conversion";
import type { Tables } from "@/types/database.types";

// Type aliases for Transaction with relations
type Transaction = Tables<"transactions">;
type Category = Tables<"categories">;
type Tag = Tables<"tags">;
type PaymentMethod = Tables<"payment_methods">;

export type TransactionWithRelations = Transaction & {
  category: Category;
  transaction_tags: Array<{
    tag: Tag;
  }>;
  payment_method?: PaymentMethod | null;
};

/**
 * Creates a new transaction with optional tags and multi-currency support.
 *
 * Multi-currency transactions:
 *   - amount is in payment method's currency (becomes native_amount)
 *   - backend fetches exchange rate and calculates base currency amount
 *   - stores: amount (base), native_amount, exchange_rate, base_currency
 *
 * Payment Method Resolution (Bug #36 fix):
 *   - If paymentMethodId is provided: uses that payment method
 *   - If not provided: uses user's default payment method
 *   - If no default: uses first active payment method
 *   - If no payment methods exist: auto-creates "Cash/Wallet" with user's base currency
 *
 * This ensures all transactions have a payment method (required by DB constraint)
 * while maintaining backward compatibility and providing excellent UX.
 *
 * @param input - Transaction data to create (paymentMethodId is optional)
 * @returns ActionResult with created transaction ID
 */
export async function createTransaction(
  input: CreateTransactionInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // 1. Validate input
    const validated = createTransactionSchema.safeParse(input);
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
      return error("Unauthorized. Please log in to create transactions.");
    }

    // 3. Verify category exists and belongs to user
    const { data: categoryCheck, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", validated.data.categoryId)
      .eq("user_id", user.id)
      .single();

    if (categoryError || !categoryCheck) {
      return error("Invalid category. Please select a valid category.");
    }

    // 4. Verify tags exist and belong to user (if provided)
    if (validated.data.tagIds && validated.data.tagIds.length > 0) {
      const { data: tagsCheck, error: tagsError } = await supabase
        .from("tags")
        .select("id")
        .eq("user_id", user.id)
        .in("id", validated.data.tagIds);

      if (
        tagsError ||
        !tagsCheck ||
        tagsCheck.length !== validated.data.tagIds.length
      ) {
        return error("Invalid tags. Please select valid tags.");
      }
    }

    // 5. Fetch user's base currency from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("currency")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return error("Failed to fetch user profile. Please try again.");
    }

    const baseCurrency = profile.currency;

    // 6. Resolve payment method (auto-create default if missing)
    let resolvedPaymentMethodId = validated.data.paymentMethodId;

    if (!resolvedPaymentMethodId) {
      // Check if user has a default payment method
      const { data: defaultPM, error: defaultPMError } = await supabase
        .from("payment_methods")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .eq("is_active", true)
        .maybeSingle();

      if (defaultPMError) {
        console.error("Error fetching default payment method:", defaultPMError);
        return error("Failed to fetch payment methods. Please try again.");
      }

      if (defaultPM) {
        // Use existing default payment method
        resolvedPaymentMethodId = defaultPM.id;
      } else {
        // No default payment method - check if user has ANY active payment method
        const { data: anyActivePM, error: anyPMError } = await supabase
          .from("payment_methods")
          .select("id")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        if (anyPMError) {
          console.error("Error fetching payment methods:", anyPMError);
          return error("Failed to fetch payment methods. Please try again.");
        }

        if (anyActivePM) {
          // Use first active payment method
          resolvedPaymentMethodId = anyActivePM.id;
        } else {
          // No payment methods exist - auto-create default "Cash/Wallet" payment method
          const { data: newPM, error: createPMError } = await supabase
            .from("payment_methods")
            .insert({
              user_id: user.id,
              name: "Cash/Wallet",
              currency: baseCurrency,
              is_default: true,
              is_active: true,
              color: "#10B981", // emerald-500
            })
            .select("id")
            .single();

          if (createPMError || !newPM) {
            console.error(
              "Error creating default payment method:",
              createPMError,
            );
            return error(
              "You need to create a payment method before creating transactions. Please go to Settings to add a payment method.",
            );
          }

          resolvedPaymentMethodId = newPM.id;
        }
      }
    }

    // 7. Handle multi-currency conversion
    let paymentMethod: { currency: string } | null = null;
    let finalAmount = validated.data.amount;
    let exchangeRate = 1;

    // Fetch payment method to get its currency
    const { data: pm, error: pmError } = await supabase
      .from("payment_methods")
      .select("currency")
      .eq("id", resolvedPaymentMethodId)
      .eq("user_id", user.id)
      .single();

    if (pmError || !pm) {
      return error(
        "Invalid payment method. Please select a valid payment method.",
      );
    }
    paymentMethod = pm;

    const nativeAmount = validated.data.amount; // User enters amount in payment method's currency

    // Get exchange rate (use manual rate if provided, otherwise fetch)
    if (validated.data.manualExchangeRate) {
      exchangeRate = validated.data.manualExchangeRate;
    } else if (paymentMethod.currency !== baseCurrency) {
      // Only fetch rate if currencies differ
      const fetchedRate = await getExchangeRate(
        paymentMethod.currency,
        baseCurrency,
        validated.data.date,
      );

      if (fetchedRate === null) {
        return error(
          `Exchange rate not available for ${paymentMethod.currency} to ${baseCurrency}. Please provide a manual rate or try again later.`,
        );
      }
      exchangeRate = fetchedRate;
    }

    // Calculate base currency amount
    if (paymentMethod.currency !== baseCurrency) {
      finalAmount = calculateBaseAmount(nativeAmount, exchangeRate);
    }

    // 8. Insert transaction with multi-currency fields
    const insertData = {
      user_id: user.id,
      amount: finalAmount,
      type: validated.data.type,
      category_id: validated.data.categoryId,
      date: validated.data.date,
      description: validated.data.description || null,
      payment_method_id: resolvedPaymentMethodId, // Always has a value
      native_amount: nativeAmount, // Original amount in payment method currency
      exchange_rate: exchangeRate,
      base_currency: baseCurrency,
    };

    const { data: transaction, error: insertError } = await supabase
      .from("transactions")
      .insert(insertData)
      .select("id")
      .single();

    if (insertError) {
      console.error("Transaction insert error:", insertError);
      return error("Failed to create transaction. Please try again.");
    }

    // 9. Handle tags if provided (atomic operation)
    if (validated.data.tagIds && validated.data.tagIds.length > 0) {
      const tagInserts = validated.data.tagIds.map((tagId) => ({
        transaction_id: transaction.id,
        tag_id: tagId,
      }));

      const { error: tagError } = await supabase
        .from("transaction_tags")
        .insert(tagInserts);

      if (tagError) {
        console.error("Tag insert error:", tagError);
        // If tags fail, rollback transaction
        await supabase.from("transactions").delete().eq("id", transaction.id);
        return error("Failed to assign tags to transaction. Please try again.");
      }
    }

    // 10. Revalidate affected paths
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/budgets");

    return success({ id: transaction.id });
  } catch (err) {
    console.error("Unexpected error in createTransaction:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Updates an existing transaction with multi-currency support.
 *
 * Multi-currency handling:
 *   - If paymentMethodId changes, recalculate exchange rate and amounts
 *   - If amount changes on multi-currency transaction, recalculate exchange rate
 *   - Maintains data consistency across currency fields
 *
 * @param input - Transaction data to update
 * @returns ActionResult with success status
 */
export async function updateTransaction(
  input: UpdateTransactionInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // 1. Validate input
    const validated = updateTransactionSchema.safeParse(input);
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
      return error("Unauthorized. Please log in to update transactions.");
    }

    // 3. Fetch existing transaction to check current state
    const { data: existingTransaction, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", validated.data.id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingTransaction) {
      return error(
        "Transaction not found or you do not have permission to update it.",
      );
    }

    // 4. Verify category exists and belongs to user (if updating category)
    if (validated.data.categoryId) {
      const { data: categoryCheck, error: categoryError } = await supabase
        .from("categories")
        .select("id")
        .eq("id", validated.data.categoryId)
        .eq("user_id", user.id)
        .single();

      if (categoryError || !categoryCheck) {
        return error("Invalid category. Please select a valid category.");
      }
    }

    // 5. Verify tags exist and belong to user (if updating tags)
    if (validated.data.tagIds && validated.data.tagIds.length > 0) {
      const { data: tagsCheck, error: tagsError } = await supabase
        .from("tags")
        .select("id")
        .eq("user_id", user.id)
        .in("id", validated.data.tagIds);

      if (
        tagsError ||
        !tagsCheck ||
        tagsCheck.length !== validated.data.tagIds.length
      ) {
        return error("Invalid tags. Please select valid tags.");
      }
    }

    // 6. Build update object (only include provided fields)
    const updateData: Record<string, unknown> = {};
    if (validated.data.type !== undefined)
      updateData.type = validated.data.type;
    if (validated.data.categoryId !== undefined)
      updateData.category_id = validated.data.categoryId;
    if (validated.data.date !== undefined)
      updateData.date = validated.data.date;
    if (validated.data.description !== undefined)
      updateData.description = validated.data.description;

    // 7. Handle multi-currency updates
    const paymentMethodChanged = validated.data.paymentMethodId !== undefined;
    const amountChanged = validated.data.amount !== undefined;

    if (paymentMethodChanged || amountChanged) {
      const newPaymentMethodId =
        validated.data.paymentMethodId || existingTransaction.payment_method_id;
      const newAmount = validated.data.amount || existingTransaction.amount;

      if (newPaymentMethodId) {
        // Multi-currency transaction update

        // Fetch payment method
        const { data: paymentMethod, error: pmError } = await supabase
          .from("payment_methods")
          .select("currency")
          .eq("id", newPaymentMethodId)
          .eq("user_id", user.id)
          .single();

        if (pmError || !paymentMethod) {
          return error(
            "Invalid payment method. Please select a valid payment method.",
          );
        }

        // Fetch user's base currency
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("currency")
          .eq("id", user.id)
          .single();

        if (profileError || !profile) {
          return error("Failed to fetch user profile. Please try again.");
        }

        const baseCurrency = profile.currency;
        const nativeAmount = newAmount;

        // Get exchange rate
        let exchangeRate: number | null;
        if (validated.data.manualExchangeRate) {
          exchangeRate = validated.data.manualExchangeRate;
        } else {
          exchangeRate = await getExchangeRate(
            paymentMethod.currency,
            baseCurrency,
            validated.data.date || existingTransaction.date,
          );

          if (exchangeRate === null) {
            return error(
              `Exchange rate not available for ${paymentMethod.currency} to ${baseCurrency}. Please provide a manual rate.`,
            );
          }
        }

        // Calculate base currency amount
        const finalAmount = calculateBaseAmount(nativeAmount, exchangeRate);

        // Update multi-currency fields
        updateData.amount = finalAmount;
        updateData.native_amount = nativeAmount;
        updateData.exchange_rate = exchangeRate;
        updateData.base_currency = baseCurrency;
        updateData.payment_method_id = newPaymentMethodId;
      } else {
        // Legacy transaction update (no payment method)
        if (validated.data.amount !== undefined) {
          updateData.amount = validated.data.amount;
        }
        // Ensure multi-currency fields remain NULL
        updateData.payment_method_id = null;
        updateData.native_amount = null;
        updateData.exchange_rate = null;
        updateData.base_currency = null;
      }
    }

    // 8. Update transaction (RLS ensures user can only update their own)
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from("transactions")
        .update(updateData)
        .eq("id", validated.data.id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Transaction update error:", updateError);
        return error("Failed to update transaction. Please try again.");
      }
    }

    // 9. Handle tag updates if provided (atomic operation)
    if (validated.data.tagIds !== undefined) {
      // Delete existing tags
      const { error: deleteTagsError } = await supabase
        .from("transaction_tags")
        .delete()
        .eq("transaction_id", validated.data.id);

      if (deleteTagsError) {
        console.error("Tag delete error:", deleteTagsError);
        return error("Failed to update transaction tags. Please try again.");
      }

      // Insert new tags
      if (validated.data.tagIds.length > 0) {
        const tagInserts = validated.data.tagIds.map((tagId) => ({
          transaction_id: validated.data.id,
          tag_id: tagId,
        }));

        const { error: tagInsertError } = await supabase
          .from("transaction_tags")
          .insert(tagInserts);

        if (tagInsertError) {
          console.error("Tag insert error:", tagInsertError);
          return error("Failed to update transaction tags. Please try again.");
        }
      }
    }

    // 10. Revalidate affected paths
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/budgets");

    return success({ id: validated.data.id });
  } catch (err) {
    console.error("Unexpected error in updateTransaction:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Deletes a transaction.
 *
 * @param input - Transaction ID to delete
 * @returns ActionResult with success status
 */
export async function deleteTransaction(
  input: DeleteTransactionInput,
): Promise<ActionResult<void>> {
  try {
    // 1. Validate input
    const validated = deleteTransactionSchema.safeParse(input);
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
      return error("Unauthorized. Please log in to delete transactions.");
    }

    // 3. Delete transaction (cascade will handle transaction_tags)
    const { error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", validated.data.id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Transaction delete error:", deleteError);
      return error("Failed to delete transaction. Please try again.");
    }

    // 4. Revalidate affected paths
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/budgets");

    return success(undefined);
  } catch (err) {
    console.error("Unexpected error in deleteTransaction:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Fetches transactions with advanced filtering and pagination.
 * Supports filtering by type, category, tags, and date range.
 *
 * @param filters - Optional filters for transactions
 * @returns ActionResult with array of transactions with category and tags
 */
export async function getTransactions(
  filters?: GetTransactionsFilter,
): Promise<ActionResult<TransactionWithRelations[]>> {
  try {
    // 1. Validate filters if provided
    const validated = filters
      ? getTransactionsFilterSchema.safeParse(filters)
      : { success: true as const, data: getTransactionsFilterSchema.parse({}) };

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
      return error("Unauthorized. Please log in to view transactions.");
    }

    // 3. Build base query with relations (including payment method)
    let query = supabase
      .from("transactions")
      .select(
        `
        *,
        category:categories(id, name, color, type),
        transaction_tags(
          tag:tags(id, name)
        ),
        payment_method:payment_methods(id, name, currency, color)
      `,
      )
      .eq("user_id", user.id);

    // 4. Apply filters
    const {
      type,
      categoryId,
      paymentMethodId,
      tagIds,
      dateFrom,
      dateTo,
      limit,
      offset,
    } = validated.data;

    if (type) {
      query = query.eq("type", type);
    }

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    if (paymentMethodId) {
      query = query.eq("payment_method_id", paymentMethodId);
    }

    if (dateFrom) {
      query = query.gte("date", dateFrom);
    }

    if (dateTo) {
      query = query.lte("date", dateTo);
    }

    // 5. Apply pagination and ordering
    query = query
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // 6. Execute query
    const { data: transactions, error: fetchError } = await query;

    if (fetchError) {
      console.error("Transactions fetch error:", fetchError);
      return error("Failed to fetch transactions. Please try again.");
    }

    // 7. Filter by tags if specified (post-query filtering)
    let filteredTransactions = transactions || [];

    if (tagIds && tagIds.length > 0) {
      filteredTransactions = filteredTransactions.filter((transaction) => {
        const transactionTagIds = transaction.transaction_tags.map(
          (tt) => tt.tag.id,
        );
        // Check if transaction has ALL specified tags (AND logic)
        return tagIds.every((tagId) => transactionTagIds.includes(tagId));
      });
    }

    return success(filteredTransactions as TransactionWithRelations[]);
  } catch (err) {
    console.error("Unexpected error in getTransactions:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Fetches a single transaction by ID with category and tags populated.
 *
 * @param id - Transaction ID to fetch
 * @returns ActionResult with transaction object or null if not found
 */
export async function getTransactionById(
  id: string,
): Promise<ActionResult<TransactionWithRelations | null>> {
  try {
    // 1. Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return error("Invalid transaction ID format.");
    }

    // 2. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized. Please log in to view transaction details.");
    }

    // 3. Fetch transaction with relations (RLS ensures user can only see their own)
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select(
        `
        *,
        category:categories(id, name, color, type),
        transaction_tags(
          tag:tags(id, name)
        ),
        payment_method:payment_methods(id, name, currency, color)
      `,
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      // Check if it's a "not found" error
      if (fetchError.code === "PGRST116") {
        return success(null);
      }
      console.error("Transaction fetch error:", fetchError);
      return error("Failed to fetch transaction. Please try again.");
    }

    return success(transaction as TransactionWithRelations);
  } catch (err) {
    console.error("Unexpected error in getTransactionById:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Calculates the user's current balance (income - expenses).
 * Uses the database function get_user_balance() for accurate calculation.
 *
 * @returns ActionResult with balance breakdown
 */
export async function getBalance(): Promise<
  ActionResult<{ balance: number; income: number; expense: number }>
> {
  try {
    // 1. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized. Please log in to view balance.");
    }

    // 2. Use database function for accurate calculation
    const { data: balanceData, error: balanceError } = await supabase.rpc(
      "get_user_balance",
      {
        p_user_id: user.id,
      },
    );

    if (balanceError) {
      console.error("Balance calculation error:", balanceError);
      return error("Failed to calculate balance. Please try again.");
    }

    // 3. Get income and expense totals separately
    const { data: incomeData } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", user.id)
      .eq("type", "income");

    const { data: expenseData } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", user.id)
      .eq("type", "expense");

    const totalIncome =
      incomeData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const totalExpense =
      expenseData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    return success({
      balance: balanceData || 0,
      income: totalIncome,
      expense: totalExpense,
    });
  } catch (err) {
    console.error("Unexpected error in getBalance:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Gets balances for all active payment methods in their native currencies.
 * Uses the database function get_payment_method_balance() for accurate calculation.
 *
 * @returns ActionResult with array of payment method balances
 */
export async function getPaymentMethodBalances(): Promise<
  ActionResult<
    Array<{
      paymentMethodId: string;
      paymentMethodName: string;
      currency: string;
      balance: number;
      color: string | null;
    }>
  >
> {
  try {
    // 1. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error(
        "Unauthorized. Please log in to view payment method balances.",
      );
    }

    // 2. Get all active payment methods for user
    const { data: paymentMethods, error: pmError } = await supabase
      .from("payment_methods")
      .select("id, name, currency, color")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .order("name");

    if (pmError) {
      console.error("Payment methods fetch error:", pmError);
      return error("Failed to fetch payment methods. Please try again.");
    }

    if (!paymentMethods || paymentMethods.length === 0) {
      return success([]);
    }

    // 3. Get balance for each payment method using database function
    const balancesPromises = paymentMethods.map(async (pm) => {
      const { data: balance, error: balanceError } = await supabase.rpc(
        "get_payment_method_balance",
        {
          p_payment_method_id: pm.id,
        },
      );

      if (balanceError) {
        console.error(
          `Balance calculation error for payment method ${pm.id}:`,
          balanceError,
        );
        return {
          paymentMethodId: pm.id,
          paymentMethodName: pm.name,
          currency: pm.currency,
          balance: 0,
          color: pm.color,
        };
      }

      return {
        paymentMethodId: pm.id,
        paymentMethodName: pm.name,
        currency: pm.currency,
        balance: balance || 0,
        color: pm.color,
      };
    });

    const balances = await Promise.all(balancesPromises);

    return success(balances);
  } catch (err) {
    console.error("Unexpected error in getPaymentMethodBalances:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Gets total balance converted to user's base currency.
 * Aggregates balances from all payment methods and converts to base currency.
 *
 * @returns ActionResult with total balance and breakdown by payment method
 */
export async function getTotalBalanceInBaseCurrency(): Promise<
  ActionResult<{
    totalBalance: number;
    baseCurrency: string;
    breakdown: Array<{
      paymentMethodId: string;
      paymentMethodName: string;
      currency: string;
      balance: number;
      exchangeRate: number;
      convertedBalance: number;
    }>;
  }>
> {
  try {
    // 1. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized. Please log in to view balance.");
    }

    // 2. Get user's base currency
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("currency")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return error("Failed to fetch user profile. Please try again.");
    }

    const baseCurrency = profile.currency;

    // 3. Get payment method balances
    const paymentMethodBalancesResult = await getPaymentMethodBalances();

    if (!paymentMethodBalancesResult.success) {
      return error(paymentMethodBalancesResult.error);
    }

    const paymentMethodBalances = paymentMethodBalancesResult.data;

    // 4. Convert each balance to base currency
    const breakdownPromises = paymentMethodBalances.map(async (pmBalance) => {
      let convertedBalance = pmBalance.balance;
      let exchangeRate = 1.0;

      // Only convert if currencies differ
      if (pmBalance.currency !== baseCurrency) {
        const rate = await getExchangeRate(
          pmBalance.currency,
          baseCurrency,
          new Date(),
        );

        if (rate !== null) {
          exchangeRate = rate;
          convertedBalance = calculateBaseAmount(pmBalance.balance, rate);
        } else {
          console.warn(
            `Exchange rate not available for ${pmBalance.currency} to ${baseCurrency}. Using balance as-is.`,
          );
          // Keep original balance if rate not available
        }
      }

      return {
        paymentMethodId: pmBalance.paymentMethodId,
        paymentMethodName: pmBalance.paymentMethodName,
        currency: pmBalance.currency,
        balance: pmBalance.balance,
        exchangeRate,
        convertedBalance,
      };
    });

    const breakdown = await Promise.all(breakdownPromises);

    // 5. Calculate total
    const totalBalance = breakdown.reduce(
      (sum, item) => sum + item.convertedBalance,
      0,
    );

    return success({
      totalBalance: Math.round(totalBalance * 100) / 100,
      baseCurrency,
      breakdown,
    });
  } catch (err) {
    console.error("Unexpected error in getTotalBalanceInBaseCurrency:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Gets total expenses for a given period.
 * Includes ALL expense transactions regardless of whether they have associated budgets.
 * Amounts are in the user's base currency (already converted for multi-currency transactions).
 *
 * @param period - Period to calculate expenses for (e.g., '2024-01' or '2024-01-01')
 * @returns ActionResult with total expenses and period details
 */
export async function getTotalExpensesForPeriod(period: string): Promise<
  ActionResult<{
    totalExpenses: number;
    period: { start: string; end: string };
    transactionCount: number;
  }>
> {
  try {
    // 1. Validate period format (supports YYYY-MM or YYYY-MM-DD)
    const periodRegex = /^\d{4}-\d{2}(-\d{2})?$/;
    if (!periodRegex.test(period)) {
      return error(
        "Invalid period format. Expected YYYY-MM or YYYY-MM-DD format.",
      );
    }

    // 2. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized. Please log in to view expenses.");
    }

    // 3. Calculate period start and end dates
    // Normalize to YYYY-MM-DD format
    const normalizedPeriod = period.length === 7 ? `${period}-01` : period;
    const periodDate = new Date(normalizedPeriod);

    // Start of month
    const periodStart = new Date(
      periodDate.getFullYear(),
      periodDate.getMonth(),
      1,
    )
      .toISOString()
      .split("T")[0];

    // End of month (last day)
    const periodEnd = new Date(
      periodDate.getFullYear(),
      periodDate.getMonth() + 1,
      0,
    )
      .toISOString()
      .split("T")[0];

    // 4. Query all expense transactions for the period
    // Using 'amount' field which is already in base currency for multi-currency transactions
    const { data: expenses, error: fetchError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .gte("date", periodStart)
      .lte("date", periodEnd);

    if (fetchError) {
      console.error("Expenses fetch error:", fetchError);
      return error("Failed to fetch expenses. Please try again.");
    }

    // 5. Calculate total expenses (sum of all expense amounts)
    // Expense amounts are stored as positive values in the database
    const totalExpenses =
      expenses?.reduce(
        (sum, transaction) => sum + Math.abs(transaction.amount),
        0,
      ) || 0;

    const transactionCount = expenses?.length || 0;

    // 6. Return result
    return success({
      totalExpenses: Math.round(totalExpenses * 100) / 100, // Round to 2 decimal places
      period: {
        start: periodStart,
        end: periodEnd,
      },
      transactionCount,
    });
  } catch (err) {
    console.error("Unexpected error in getTotalExpensesForPeriod:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}
