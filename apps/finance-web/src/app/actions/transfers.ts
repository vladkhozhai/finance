"use server";

/**
 * Transfer Server Actions
 *
 * Server-side logic for transfer operations between payment methods.
 * Each transfer creates TWO linked transactions:
 * - Source transaction (withdrawal, positive amount)
 * - Destination transaction (deposit, positive amount)
 *
 * IMPORTANT: Both transactions store amounts as POSITIVE values due to database
 * constraints (CHECK amount > 0, CHECK native_amount > 0). Direction is determined
 * by payment_method_id relationship (source vs destination).
 *
 * Features:
 * - Multi-currency support with automatic exchange rate conversion
 * - Atomic operations (both transactions succeed or both fail)
 * - Cascade deletion (delete one side deletes both)
 * - Full RLS security
 * - Type validation (transfers have no category)
 *
 * Card #43: Transfer Between Payment Accounts
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult, error, success } from "@/lib/validations/shared";
import {
  type CreateTransferInput,
  createTransferSchema,
  type DeleteTransferInput,
  deleteTransferSchema,
  type GetTransferByIdInput,
  getTransferByIdSchema,
} from "@/lib/validations/transfer";
import {
  calculateBaseAmount,
  getExchangeRate,
} from "@/lib/utils/currency-conversion";
import type { TransferPair } from "@/types/transfer";
import type { Tables } from "@/types/database.types";

type Transaction = Tables<"transactions">;
type PaymentMethod = Tables<"payment_methods">;

/**
 * Creates a transfer between two payment methods.
 *
 * Process:
 * 1. Validate inputs (source ≠ destination, amount > 0)
 * 2. Verify both payment methods exist and belong to user
 * 3. Get exchange rate if currencies differ
 * 4. Create withdrawal transaction (source, positive amount)
 * 5. Create deposit transaction (destination, positive amount, converted)
 * 6. Link both transactions together
 *
 * Multi-currency handling:
 * - If currencies differ, fetches exchange rate and converts amount
 * - Stores native amounts and exchange rates for both sides
 * - Uses user's base currency for consistent reporting
 *
 * Amount storage:
 * - Both withdrawal and deposit amounts are stored as POSITIVE values
 * - Direction is determined by payment_method_id (source vs destination)
 * - Database constraints enforce amount > 0 and native_amount > 0
 *
 * @param input - Transfer data (source, destination, amount, date, description)
 * @returns ActionResult with transfer details (both transaction IDs)
 */
export async function createTransfer(input: CreateTransferInput): Promise<
  ActionResult<{
    sourceTransactionId: string;
    destinationTransactionId: string;
    exchangeRate: number;
  }>
> {
  try {
    // 1. Validate input
    const validated = createTransferSchema.safeParse(input);
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
      return error("Unauthorized. Please log in to create transfers.");
    }

    // 3. Fetch user's base currency from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("currency")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return error("Failed to fetch user profile. Please try again.");
    }

    const baseCurrency = profile.currency;

    // 4. Verify both payment methods exist and belong to user
    const { data: paymentMethods, error: pmError } = await supabase
      .from("payment_methods")
      .select("id, name, currency, is_active")
      .eq("user_id", user.id)
      .in("id", [
        validated.data.sourcePaymentMethodId,
        validated.data.destinationPaymentMethodId,
      ]);

    if (pmError) {
      console.error("Payment methods fetch error:", pmError);
      return error("Failed to fetch payment methods. Please try again.");
    }

    if (!paymentMethods || paymentMethods.length !== 2) {
      return error(
        "One or both payment methods not found. Please select valid payment methods.",
      );
    }

    // Find source and destination payment methods
    const sourcePaymentMethod = paymentMethods.find(
      (pm) => pm.id === validated.data.sourcePaymentMethodId,
    );
    const destinationPaymentMethod = paymentMethods.find(
      (pm) => pm.id === validated.data.destinationPaymentMethodId,
    );

    if (!sourcePaymentMethod || !destinationPaymentMethod) {
      return error("Invalid payment methods. Please try again.");
    }

    // Check if payment methods are active
    if (!sourcePaymentMethod.is_active || !destinationPaymentMethod.is_active) {
      return error(
        "One or both payment methods are inactive. Please activate them in Settings.",
      );
    }

    // 5. Calculate amounts and exchange rate
    const sourceAmount = validated.data.amount;
    let destinationAmount = validated.data.amount;
    let exchangeRate = 1.0;

    // Get exchange rate if currencies differ
    if (sourcePaymentMethod.currency !== destinationPaymentMethod.currency) {
      const rate = await getExchangeRate(
        sourcePaymentMethod.currency,
        destinationPaymentMethod.currency,
        validated.data.date,
      );

      if (rate === null) {
        return error(
          `Exchange rate not available for ${sourcePaymentMethod.currency} to ${destinationPaymentMethod.currency}. Please try again later or contact support.`,
        );
      }

      exchangeRate = rate;
      destinationAmount = calculateBaseAmount(sourceAmount, exchangeRate);
    }

    // 6. Calculate base currency amounts for both transactions
    // Source transaction
    const sourceExchangeRateToBase =
      sourcePaymentMethod.currency !== baseCurrency
        ? await getExchangeRate(
            sourcePaymentMethod.currency,
            baseCurrency,
            validated.data.date,
          )
        : 1.0;

    if (sourceExchangeRateToBase === null) {
      return error(
        `Exchange rate not available for ${sourcePaymentMethod.currency} to ${baseCurrency}. Please try again later.`,
      );
    }

    const sourceBaseAmount = calculateBaseAmount(
      sourceAmount,
      sourceExchangeRateToBase,
    );

    // Destination transaction
    const destExchangeRateToBase =
      destinationPaymentMethod.currency !== baseCurrency
        ? await getExchangeRate(
            destinationPaymentMethod.currency,
            baseCurrency,
            validated.data.date,
          )
        : 1.0;

    if (destExchangeRateToBase === null) {
      return error(
        `Exchange rate not available for ${destinationPaymentMethod.currency} to ${baseCurrency}. Please try again later.`,
      );
    }

    const destinationBaseAmount = calculateBaseAmount(
      destinationAmount,
      destExchangeRateToBase,
    );

    // 7. Create withdrawal transaction (source, positive amount)
    const withdrawalDescription =
      validated.data.description ||
      `Transfer to ${destinationPaymentMethod.name}`;

    const { data: withdrawalTransaction, error: withdrawalError } =
      await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          payment_method_id: validated.data.sourcePaymentMethodId,
          amount: Math.abs(sourceBaseAmount), // Positive (constraint requirement)
          native_amount: Math.abs(sourceAmount), // Positive (constraint requirement)
          exchange_rate: sourceExchangeRateToBase,
          base_currency: baseCurrency,
          type: "transfer",
          category_id: null, // Transfers have no category
          linked_transaction_id: null, // Will update after deposit created
          date: validated.data.date,
          description: withdrawalDescription,
        })
        .select("id")
        .single();

    if (withdrawalError || !withdrawalTransaction) {
      console.error("Withdrawal transaction error:", withdrawalError);
      return error(
        "Failed to create withdrawal transaction. Please try again.",
      );
    }

    // 8. Create deposit transaction (destination, positive amount)
    const depositDescription =
      validated.data.description || `Transfer from ${sourcePaymentMethod.name}`;

    const { data: depositTransaction, error: depositError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        payment_method_id: validated.data.destinationPaymentMethodId,
        amount: Math.abs(destinationBaseAmount), // Positive (constraint requirement)
        native_amount: Math.abs(destinationAmount), // Positive (constraint requirement)
        exchange_rate: destExchangeRateToBase,
        base_currency: baseCurrency,
        type: "transfer",
        category_id: null, // Transfers have no category
        linked_transaction_id: withdrawalTransaction.id, // Link to withdrawal
        date: validated.data.date,
        description: depositDescription,
      })
      .select("id")
      .single();

    if (depositError || !depositTransaction) {
      console.error("Deposit transaction error:", depositError);
      // Rollback: Delete the withdrawal transaction
      await supabase
        .from("transactions")
        .delete()
        .eq("id", withdrawalTransaction.id);
      return error("Failed to create deposit transaction. Please try again.");
    }

    // 9. Update withdrawal transaction with linked_transaction_id
    const { error: updateError } = await supabase
      .from("transactions")
      .update({ linked_transaction_id: depositTransaction.id })
      .eq("id", withdrawalTransaction.id);

    if (updateError) {
      console.error("Link update error:", updateError);
      // Rollback: Delete both transactions
      await supabase
        .from("transactions")
        .delete()
        .in("id", [withdrawalTransaction.id, depositTransaction.id]);
      return error("Failed to link transfer transactions. Please try again.");
    }

    // 10. Revalidate affected paths
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/payment-methods");

    return success({
      sourceTransactionId: withdrawalTransaction.id,
      destinationTransactionId: depositTransaction.id,
      exchangeRate,
    });
  } catch (err) {
    console.error("Unexpected error in createTransfer:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Deletes a transfer by deleting both linked transactions.
 *
 * Process:
 * 1. Fetch the transaction by ID
 * 2. Verify it's a transfer transaction
 * 3. Delete the transaction (CASCADE will delete the linked transaction)
 *
 * Note: Due to ON DELETE CASCADE on linked_transaction_id,
 * deleting one transaction automatically deletes the linked one.
 *
 * @param input - Transaction ID (either side of the transfer)
 * @returns ActionResult with success status
 */
export async function deleteTransfer(
  input: DeleteTransferInput,
): Promise<ActionResult<void>> {
  try {
    // 1. Validate input
    const validated = deleteTransferSchema.safeParse(input);
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
      return error("Unauthorized. Please log in to delete transfers.");
    }

    // 3. Fetch the transaction to verify it exists and is a transfer
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("id, type, user_id")
      .eq("id", validated.data.transactionId)
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return error(
          "Transfer not found or you do not have permission to delete it.",
        );
      }
      console.error("Transaction fetch error:", fetchError);
      return error("Failed to fetch transfer. Please try again.");
    }

    if (!transaction) {
      return error("Transfer not found.");
    }

    // Verify it's a transfer transaction
    if (transaction.type !== "transfer") {
      return error("This transaction is not a transfer.");
    }

    // 4. Delete the transaction (CASCADE will delete the linked transaction)
    const { error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", validated.data.transactionId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Transfer delete error:", deleteError);
      return error("Failed to delete transfer. Please try again.");
    }

    // 5. Revalidate affected paths
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/payment-methods");

    return success(undefined);
  } catch (err) {
    console.error("Unexpected error in deleteTransfer:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Fetches a complete transfer by transaction ID.
 *
 * Returns both sides of the transfer with payment method details.
 * Accepts either the source or destination transaction ID.
 *
 * @param input - Transaction ID (either side of the transfer)
 * @returns ActionResult with TransferPair object or null if not found
 */
export async function getTransferById(
  input: GetTransferByIdInput,
): Promise<ActionResult<TransferPair | null>> {
  try {
    // 1. Validate input
    const validated = getTransferByIdSchema.safeParse(input);
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
      return error("Unauthorized. Please log in to view transfers.");
    }

    // 3. Fetch the transaction with linked transaction and payment methods
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select(
        `
        *,
        payment_method:payment_methods!transactions_payment_method_id_fkey(
          id, name, currency, color, is_active
        ),
        linked_transaction:transactions!transactions_linked_transaction_id_fkey(
          *,
          payment_method:payment_methods!transactions_payment_method_id_fkey(
            id, name, currency, color, is_active
          )
        )
      `,
      )
      .eq("id", validated.data.transactionId)
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return success(null);
      }
      console.error("Transfer fetch error:", fetchError);
      return error("Failed to fetch transfer. Please try again.");
    }

    if (!transaction) {
      return success(null);
    }

    // Verify it's a transfer transaction
    if (transaction.type !== "transfer") {
      return error("This transaction is not a transfer.");
    }

    if (!transaction.linked_transaction) {
      return error("Transfer is incomplete (missing linked transaction).");
    }

    // 4. Determine which transaction is source (withdrawal) and which is destination (deposit)
    // The source transaction is created first (has smaller ID or earlier created_at)
    // Since amounts are now always positive, we use creation order to determine direction
    const transactionCreatedFirst = transaction.created_at <= (transaction.linked_transaction as any).created_at;
    const sourceTransaction = (transactionCreatedFirst
      ? transaction
      : transaction.linked_transaction) as unknown as Transaction & {
      payment_method: PaymentMethod;
    };
    const destinationTransaction = (transactionCreatedFirst
      ? transaction.linked_transaction
      : transaction) as unknown as Transaction & {
      payment_method: PaymentMethod;
    };

    // 5. Build TransferPair object
    const sourcePaymentMethod = sourceTransaction.payment_method;
    const destinationPaymentMethod = destinationTransaction.payment_method;

    // Calculate exchange rate between source and destination currencies
    const exchangeRate =
      sourcePaymentMethod.currency !== destinationPaymentMethod.currency
        ? Math.abs(
            destinationTransaction.native_amount ||
              destinationTransaction.amount,
          ) /
          Math.abs(sourceTransaction.native_amount || sourceTransaction.amount)
        : 1.0;

    const transferPair: TransferPair = {
      id: sourceTransaction.id,
      sourceTransaction: sourceTransaction as unknown as Transaction,
      destinationTransaction: destinationTransaction as unknown as Transaction,
      sourcePaymentMethod,
      destinationPaymentMethod,
      sourceAmount: sourceTransaction.native_amount || sourceTransaction.amount,
      destinationAmount:
        destinationTransaction.native_amount || destinationTransaction.amount,
      exchangeRate: Math.round(exchangeRate * 1000000) / 1000000, // Round to 6 decimals
      date: sourceTransaction.date,
      description: sourceTransaction.description || undefined,
    };

    return success(transferPair);
  } catch (err) {
    console.error("Unexpected error in getTransferById:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Gets all transfers for the authenticated user.
 *
 * Returns only source (withdrawal) transactions to avoid duplicates.
 * Each transfer is returned with its linked deposit transaction and payment method details.
 *
 * Note: Since both transactions now store positive amounts, we fetch all transfers
 * and deduplicate by only returning the transaction created first in each pair.
 *
 * @returns ActionResult with array of TransferPair objects
 */
export async function getUserTransfers(): Promise<
  ActionResult<TransferPair[]>
> {
  try {
    // 1. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized. Please log in to view transfers.");
    }

    // 2. Fetch all transfer transactions with their linked pairs
    // We'll filter to only source (first-created) transactions to avoid duplicates
    const { data: transactions, error: fetchError } = await supabase
      .from("transactions")
      .select(
        `
        *,
        payment_method:payment_methods!transactions_payment_method_id_fkey(
          id, name, currency, color, is_active
        ),
        linked_transaction:transactions!transactions_linked_transaction_id_fkey(
          *,
          payment_method:payment_methods!transactions_payment_method_id_fkey(
            id, name, currency, color, is_active
          )
        )
      `,
      )
      .eq("user_id", user.id)
      .eq("type", "transfer")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Transfers fetch error:", fetchError);
      return error("Failed to fetch transfers. Please try again.");
    }

    if (!transactions || transactions.length === 0) {
      return success([]);
    }

    // 3. Build TransferPair objects
    // Filter to only include transactions created first (source) to avoid duplicates
    const transfers: TransferPair[] = transactions
      .filter((t) => {
        if (!t.linked_transaction) return false; // Only include complete transfers
        // Only include if this transaction was created first (is the source/withdrawal)
        return t.created_at <= (t.linked_transaction as any).created_at;
      })
      .map((tx) => {
        const sourceTx = tx as unknown as Transaction & {
          payment_method: PaymentMethod;
          linked_transaction: Transaction & { payment_method: PaymentMethod };
        };
        const destinationTransaction = sourceTx.linked_transaction;
        const sourcePaymentMethod = sourceTx.payment_method;
        const destinationPaymentMethod = destinationTransaction.payment_method;

        // Calculate exchange rate between source and destination currencies
        const exchangeRate =
          sourcePaymentMethod.currency !== destinationPaymentMethod.currency
            ? Math.abs(
                destinationTransaction.native_amount ||
                  destinationTransaction.amount,
              ) / Math.abs(sourceTx.native_amount || sourceTx.amount)
            : 1.0;

        return {
          id: sourceTx.id,
          sourceTransaction: sourceTx as unknown as Transaction,
          destinationTransaction:
            destinationTransaction as unknown as Transaction,
          sourcePaymentMethod,
          destinationPaymentMethod,
          sourceAmount: Math.abs(sourceTx.native_amount || sourceTx.amount),
          destinationAmount: Math.abs(
            destinationTransaction.native_amount ||
              destinationTransaction.amount,
          ),
          exchangeRate: Math.round(exchangeRate * 1000000) / 1000000, // Round to 6 decimals
          date: sourceTx.date,
          description: sourceTx.description || undefined,
        };
      });

    return success(transfers);
  } catch (err) {
    console.error("Unexpected error in getUserTransfers:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}
