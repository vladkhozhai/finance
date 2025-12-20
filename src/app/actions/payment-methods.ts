"use server";

/**
 * Payment Method Server Actions
 *
 * Server-side business logic for payment method CRUD operations.
 * Handles multi-currency payment methods (bank cards, cash wallets, savings accounts).
 *
 * Key Features:
 * - Create, read, update, archive, and delete payment methods
 * - Balance calculation per payment method
 * - Multi-currency support with ISO 4217 currency codes
 * - Single default payment method enforcement (automatic via trigger)
 * - Soft delete (archive) for historical data preservation
 * - Hard delete prevention when transactions exist
 *
 * @module actions/payment-methods
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  type ActivatePaymentMethodInput,
  type ArchivePaymentMethodInput,
  activatePaymentMethodSchema,
  archivePaymentMethodSchema,
  type CreatePaymentMethodInput,
  createPaymentMethodSchema,
  type DeletePaymentMethodInput,
  deletePaymentMethodSchema,
  type GetPaymentMethodByIdInput,
  getPaymentMethodByIdSchema,
  type PaymentMethodFilters,
  paymentMethodFiltersSchema,
  type UpdatePaymentMethodInput,
  updatePaymentMethodSchema,
} from "@/lib/validations/payment-method";
import { type ActionResult, error, success } from "@/lib/validations/shared";
import type { Database } from "@/types/database.types";

// Type aliases for database types
type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"];
type PaymentMethodInsert =
  Database["public"]["Tables"]["payment_methods"]["Insert"];

/**
 * Extended payment method type with calculated balance.
 */
export type PaymentMethodWithBalance = PaymentMethod & {
  balance: number;
};

/**
 * Balance by currency type.
 */
export type BalanceByCurrency = {
  currency: string;
  balance: number;
};

/**
 * Creates a new payment method for the authenticated user.
 *
 * @param input - Payment method creation data
 * @returns ActionResult with created payment method or error
 *
 * @example
 * const result = await createPaymentMethod({
 *   name: "Chase Sapphire Reserve",
 *   currency: "USD",
 *   cardType: "credit",
 *   color: "#0066CC",
 *   isDefault: true
 * });
 */
export async function createPaymentMethod(
  input: CreatePaymentMethodInput,
): Promise<ActionResult<PaymentMethod>> {
  try {
    // 1. Validate input
    const validated = createPaymentMethodSchema.safeParse(input);
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
      return error("Unauthorized");
    }

    // 3. Check for duplicate name
    const { data: existing } = await supabase
      .from("payment_methods")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", validated.data.name)
      .maybeSingle();

    if (existing) {
      return error("A payment method with this name already exists");
    }

    // 4. Prepare insert data
    const insertData: PaymentMethodInsert = {
      user_id: user.id,
      name: validated.data.name,
      currency: validated.data.currency,
      card_type: validated.data.cardType ?? null,
      color: validated.data.color ?? null,
      is_default: validated.data.isDefault ?? false,
    };

    // 5. Insert payment method
    const { data: paymentMethod, error: insertError } = await supabase
      .from("payment_methods")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error("Payment method insert error:", insertError);
      return error("Failed to create payment method");
    }

    // 6. Revalidate paths
    revalidatePath("/dashboard");
    revalidatePath("/payment-methods");

    return success(paymentMethod);
  } catch (err) {
    console.error("Unexpected error in createPaymentMethod:", err);
    return error("An unexpected error occurred");
  }
}

/**
 * Retrieves all payment methods for the authenticated user.
 *
 * @param filters - Optional filters (isActive, currency, limit, offset)
 * @returns ActionResult with payment methods array or error
 *
 * @example
 * // Get all active payment methods
 * const result = await getPaymentMethods({ isActive: true });
 *
 * // Get EUR payment methods
 * const result = await getPaymentMethods({ currency: "EUR" });
 */
export async function getPaymentMethods(
  filters?: PaymentMethodFilters,
): Promise<ActionResult<PaymentMethod[]>> {
  try {
    // 1. Validate filters
    const validated = filters
      ? paymentMethodFiltersSchema.safeParse(filters)
      : { success: true as const, data: paymentMethodFiltersSchema.parse({}) };

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
      return error("Unauthorized");
    }

    // 3. Build query
    let query = supabase
      .from("payment_methods")
      .select("*")
      .eq("user_id", user.id);

    // Apply filters
    if (validated.data.isActive !== undefined) {
      query = query.eq("is_active", validated.data.isActive);
    }

    if (validated.data.currency) {
      query = query.eq("currency", validated.data.currency);
    }

    // Apply ordering: default first, then by name
    query = query
      .order("is_default", { ascending: false })
      .order("name", { ascending: true });

    // Apply pagination
    if (validated.data.limit) {
      query = query.limit(validated.data.limit);
    }

    if (validated.data.offset) {
      query = query.range(
        validated.data.offset,
        validated.data.offset + (validated.data.limit ?? 50) - 1,
      );
    }

    // 4. Execute query
    const { data: paymentMethods, error: queryError } = await query;

    if (queryError) {
      console.error("Error fetching payment methods:", queryError);
      return error("Failed to fetch payment methods");
    }

    return success(paymentMethods ?? []);
  } catch (err) {
    console.error("Unexpected error in getPaymentMethods:", err);
    return error("An unexpected error occurred");
  }
}

/**
 * Retrieves a single payment method by ID with calculated balance.
 *
 * @param input - Object containing payment method ID
 * @returns ActionResult with payment method and balance or error
 *
 * @example
 * const result = await getPaymentMethodById({ id: "uuid-here" });
 */
export async function getPaymentMethodById(
  input: GetPaymentMethodByIdInput,
): Promise<ActionResult<PaymentMethodWithBalance>> {
  try {
    // 1. Validate input
    const validated = getPaymentMethodByIdSchema.safeParse(input);
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
      return error("Unauthorized");
    }

    // 3. Fetch payment method (RLS ensures user ownership)
    const { data: paymentMethod, error: queryError } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("id", validated.data.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (queryError) {
      console.error("Error fetching payment method:", queryError);
      return error("Failed to fetch payment method");
    }

    if (!paymentMethod) {
      return error("Payment method not found");
    }

    // 4. Calculate balance using database function
    const { data: balance, error: balanceError } = await supabase.rpc(
      "get_payment_method_balance",
      {
        p_payment_method_id: validated.data.id,
      },
    );

    if (balanceError) {
      console.error("Error calculating balance:", balanceError);
      // Continue with balance = 0 if calculation fails
    }

    // 5. Combine payment method with balance
    const paymentMethodWithBalance: PaymentMethodWithBalance = {
      ...paymentMethod,
      balance: balance ?? 0,
    };

    return success(paymentMethodWithBalance);
  } catch (err) {
    console.error("Unexpected error in getPaymentMethodById:", err);
    return error("An unexpected error occurred");
  }
}

/**
 * Updates an existing payment method.
 * Note: Currency cannot be changed after creation for data integrity.
 *
 * @param input - Payment method update data
 * @returns ActionResult with updated payment method or error
 *
 * @example
 * const result = await updatePaymentMethod({
 *   id: "uuid-here",
 *   name: "New Name",
 *   color: "#FF5733",
 *   isDefault: true
 * });
 */
export async function updatePaymentMethod(
  input: UpdatePaymentMethodInput,
): Promise<ActionResult<PaymentMethod>> {
  try {
    // 1. Validate input
    const validated = updatePaymentMethodSchema.safeParse(input);
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
      return error("Unauthorized");
    }

    // 3. Check if payment method exists and user owns it
    const { data: existing } = await supabase
      .from("payment_methods")
      .select("id")
      .eq("id", validated.data.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      return error("Payment method not found");
    }

    // 4. Check for duplicate name if name is being updated
    if (validated.data.name) {
      const { data: duplicate } = await supabase
        .from("payment_methods")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", validated.data.name)
        .neq("id", validated.data.id)
        .maybeSingle();

      if (duplicate) {
        return error("A payment method with this name already exists");
      }
    }

    // 5. Build update data (only include provided fields)
    const updateData: Partial<PaymentMethodInsert> = {};

    if (validated.data.name !== undefined) {
      updateData.name = validated.data.name;
    }
    if (validated.data.cardType !== undefined) {
      updateData.card_type = validated.data.cardType;
    }
    if (validated.data.color !== undefined) {
      updateData.color = validated.data.color;
    }
    if (validated.data.isDefault !== undefined) {
      updateData.is_default = validated.data.isDefault;
    }

    // 6. Update payment method
    const { data: paymentMethod, error: updateError } = await supabase
      .from("payment_methods")
      .update(updateData)
      .eq("id", validated.data.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating payment method:", updateError);
      return error("Failed to update payment method");
    }

    // 7. Revalidate paths
    revalidatePath("/dashboard");
    revalidatePath("/payment-methods");

    return success(paymentMethod);
  } catch (err) {
    console.error("Unexpected error in updatePaymentMethod:", err);
    return error("An unexpected error occurred");
  }
}

/**
 * Archives a payment method (soft delete).
 * Sets is_active to false, preserving historical data.
 *
 * @param input - Object containing payment method ID
 * @returns ActionResult with success or error
 *
 * @example
 * const result = await archivePaymentMethod({ id: "uuid-here" });
 */
export async function archivePaymentMethod(
  input: ArchivePaymentMethodInput,
): Promise<ActionResult<PaymentMethod>> {
  try {
    // 1. Validate input
    const validated = archivePaymentMethodSchema.safeParse(input);
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
      return error("Unauthorized");
    }

    // 3. Check if payment method exists
    const { data: existing } = await supabase
      .from("payment_methods")
      .select("id, is_active")
      .eq("id", validated.data.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      return error("Payment method not found");
    }

    if (!existing.is_active) {
      return error("Payment method is already archived");
    }

    // 4. Archive payment method
    const { data: paymentMethod, error: updateError } = await supabase
      .from("payment_methods")
      .update({ is_active: false })
      .eq("id", validated.data.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error archiving payment method:", updateError);
      return error("Failed to archive payment method");
    }

    // 5. Revalidate paths
    revalidatePath("/dashboard");
    revalidatePath("/payment-methods");

    return success(paymentMethod);
  } catch (err) {
    console.error("Unexpected error in archivePaymentMethod:", err);
    return error("An unexpected error occurred");
  }
}

/**
 * Activates an archived payment method.
 * Sets is_active to true.
 *
 * @param input - Object containing payment method ID
 * @returns ActionResult with success or error
 *
 * @example
 * const result = await activatePaymentMethod({ id: "uuid-here" });
 */
export async function activatePaymentMethod(
  input: ActivatePaymentMethodInput,
): Promise<ActionResult<PaymentMethod>> {
  try {
    // 1. Validate input
    const validated = activatePaymentMethodSchema.safeParse(input);
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
      return error("Unauthorized");
    }

    // 3. Check if payment method exists
    const { data: existing } = await supabase
      .from("payment_methods")
      .select("id, is_active")
      .eq("id", validated.data.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      return error("Payment method not found");
    }

    if (existing.is_active) {
      return error("Payment method is already active");
    }

    // 4. Activate payment method
    const { data: paymentMethod, error: updateError } = await supabase
      .from("payment_methods")
      .update({ is_active: true })
      .eq("id", validated.data.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error activating payment method:", updateError);
      return error("Failed to activate payment method");
    }

    // 5. Revalidate paths
    revalidatePath("/dashboard");
    revalidatePath("/payment-methods");

    return success(paymentMethod);
  } catch (err) {
    console.error("Unexpected error in activatePaymentMethod:", err);
    return error("An unexpected error occurred");
  }
}

/**
 * Deletes a payment method (hard delete).
 * Only allowed if no transactions reference this payment method.
 *
 * @param input - Object containing payment method ID
 * @returns ActionResult with success or error
 *
 * @example
 * const result = await deletePaymentMethod({ id: "uuid-here" });
 */
export async function deletePaymentMethod(
  input: DeletePaymentMethodInput,
): Promise<ActionResult<void>> {
  try {
    // 1. Validate input
    const validated = deletePaymentMethodSchema.safeParse(input);
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
      return error("Unauthorized");
    }

    // 3. Check if payment method exists
    const { data: existing } = await supabase
      .from("payment_methods")
      .select("id")
      .eq("id", validated.data.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      return error("Payment method not found");
    }

    // 4. Check if there are transactions using this payment method
    const { count, error: countError } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("payment_method_id", validated.data.id);

    if (countError) {
      console.error("Error checking transactions:", countError);
      return error("Failed to verify payment method usage");
    }

    if (count && count > 0) {
      return error(
        `Cannot delete payment method with ${count} transaction(s). Archive it instead to preserve transaction history.`,
      );
    }

    // 5. Delete payment method
    const { error: deleteError } = await supabase
      .from("payment_methods")
      .delete()
      .eq("id", validated.data.id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting payment method:", deleteError);
      return error("Failed to delete payment method");
    }

    // 6. Revalidate paths
    revalidatePath("/dashboard");
    revalidatePath("/payment-methods");

    return success(undefined as undefined);
  } catch (err) {
    console.error("Unexpected error in deletePaymentMethod:", err);
    return error("An unexpected error occurred");
  }
}

/**
 * Gets the balance for a specific payment method.
 * Uses database RPC function for accurate calculation.
 *
 * @param paymentMethodId - Payment method UUID
 * @returns ActionResult with balance or error
 *
 * @example
 * const result = await getPaymentMethodBalance("uuid-here");
 */
export async function getPaymentMethodBalance(
  paymentMethodId: string,
): Promise<ActionResult<number>> {
  try {
    // 1. Validate UUID
    const validated = getPaymentMethodByIdSchema.safeParse({
      id: paymentMethodId,
    });
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
      return error("Unauthorized");
    }

    // 3. Verify user owns this payment method
    const { data: paymentMethod } = await supabase
      .from("payment_methods")
      .select("id")
      .eq("id", paymentMethodId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!paymentMethod) {
      return error("Payment method not found or access denied");
    }

    // 4. Calculate balance using database function
    const { data: balance, error: balanceError } = await supabase.rpc(
      "get_payment_method_balance",
      {
        p_payment_method_id: paymentMethodId,
      },
    );

    if (balanceError) {
      console.error("Error calculating balance:", balanceError);
      return error("Failed to calculate balance");
    }

    return success(balance ?? 0);
  } catch (err) {
    console.error("Unexpected error in getPaymentMethodBalance:", err);
    return error("An unexpected error occurred");
  }
}

/**
 * Gets balances grouped by currency for the authenticated user.
 * Sums all payment methods per currency.
 *
 * @returns ActionResult with currency balances or error
 *
 * @example
 * const result = await getBalancesByCurrency();
 * // Returns: [{ currency: "USD", balance: 1250.50 }, { currency: "EUR", balance: 800.00 }]
 */
export async function getBalancesByCurrency(): Promise<
  ActionResult<BalanceByCurrency[]>
> {
  try {
    // 1. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized");
    }

    // 2. Get balances by currency using database function
    const { data: balances, error: balanceError } = await supabase.rpc(
      "get_user_balance_by_currency",
      {
        p_user_id: user.id,
      },
    );

    if (balanceError) {
      console.error("Error getting balances by currency:", balanceError);
      return error("Failed to get balances by currency");
    }

    return success(balances ?? []);
  } catch (err) {
    console.error("Unexpected error in getBalancesByCurrency:", err);
    return error("An unexpected error occurred");
  }
}

/**
 * Gets the default payment method for the authenticated user.
 *
 * @returns ActionResult with default payment method or error
 *
 * @example
 * const result = await getDefaultPaymentMethod();
 */
export async function getDefaultPaymentMethod(): Promise<
  ActionResult<PaymentMethod | null>
> {
  try {
    // 1. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized");
    }

    // 2. Get default payment method
    const { data: paymentMethod, error: queryError } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_default", true)
      .eq("is_active", true)
      .maybeSingle();

    if (queryError) {
      console.error("Error fetching default payment method:", queryError);
      return error("Failed to fetch default payment method");
    }

    return success(paymentMethod);
  } catch (err) {
    console.error("Unexpected error in getDefaultPaymentMethod:", err);
    return error("An unexpected error occurred");
  }
}

/**
 * Sets a payment method as the default.
 * Database trigger automatically unsets other defaults.
 *
 * @param paymentMethodId - Payment method UUID
 * @returns ActionResult with updated payment method or error
 *
 * @example
 * const result = await setDefaultPaymentMethod("uuid-here");
 */
export async function setDefaultPaymentMethod(
  paymentMethodId: string,
): Promise<ActionResult<PaymentMethod>> {
  try {
    // 1. Validate UUID
    const validated = getPaymentMethodByIdSchema.safeParse({
      id: paymentMethodId,
    });
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
      return error("Unauthorized");
    }

    // 3. Check if payment method exists and is active
    const { data: existing } = await supabase
      .from("payment_methods")
      .select("id, is_active")
      .eq("id", paymentMethodId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      return error("Payment method not found");
    }

    if (!existing.is_active) {
      return error("Cannot set archived payment method as default");
    }

    // 4. Set as default (trigger will unset others automatically)
    const { data: paymentMethod, error: updateError } = await supabase
      .from("payment_methods")
      .update({ is_default: true })
      .eq("id", paymentMethodId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error setting default payment method:", updateError);
      return error("Failed to set default payment method");
    }

    // 5. Revalidate paths
    revalidatePath("/dashboard");
    revalidatePath("/payment-methods");

    return success(paymentMethod);
  } catch (err) {
    console.error("Unexpected error in setDefaultPaymentMethod:", err);
    return error("An unexpected error occurred");
  }
}
