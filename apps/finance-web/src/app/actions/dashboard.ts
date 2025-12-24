"use server";

/**
 * Dashboard Server Actions
 *
 * Aggregated multi-currency financial data for dashboard UI.
 * Provides user-friendly consumption-ready data with currency conversions.
 *
 * Features:
 * - Total balance calculation across all payment methods
 * - Payment method balances with exchange rate details
 * - Transaction filtering by payment method
 * - Exchange rate staleness detection (>24 hours)
 * - Comprehensive error handling
 *
 * @module actions/dashboard
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult, error, success } from "@/lib/validations/shared";
import { uuidSchema } from "@/lib/validations/shared";
import { getExchangeRate } from "@/lib/utils/currency-conversion";
import type { Database } from "@/types/database.types";
import { exchangeRateService } from "@/lib/services/exchange-rate-service";

// Type aliases
type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"];
type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type Tag = Database["public"]["Tables"]["tags"]["Row"];

/**
 * Transaction with full relations for display.
 */
export type TransactionWithRelations = Transaction & {
  category: Category;
  transaction_tags: Array<{
    tag: Tag;
  }>;
  payment_method?: PaymentMethod | null;
};

/**
 * Breakdown of payment method balance with conversion details.
 */
export interface PaymentMethodBreakdown {
  paymentMethodId: string;
  paymentMethodName: string;
  currency: string;
  nativeBalance: number;
  exchangeRate: number;
  convertedBalance: number;
}

/**
 * Result of getTotalBalanceInBaseCurrency().
 */
export interface TotalBalanceResult {
  totalBalance: number;
  baseCurrency: string;
  breakdown: PaymentMethodBreakdown[];
}

/**
 * Payment method with detailed balance and conversion information.
 */
export interface PaymentMethodWithDetails {
  id: string;
  name: string;
  currency: string;
  cardType: string | null;
  color: string | null;
  isDefault: boolean;
  nativeBalance: number;
  convertedBalance: number;
  baseCurrency: string;
  exchangeRate: number;
  rateDate: Date | null;
  rateSource: string | null;
  isRateStale: boolean;
  lastTransactionDate: Date | null;
  transactionCount: number;
}

/**
 * Result of getTransactionsByPaymentMethod().
 */
export interface TransactionsByPaymentMethodResult {
  transactions: TransactionWithRelations[];
  totalCount: number;
  paymentMethod: {
    id: string;
    name: string;
    currency: string;
  };
}

/**
 * Get total balance in user's base currency.
 * Aggregates balances from all active payment methods and converts to base currency.
 *
 * Logic:
 * 1. Fetch user's base currency from profile
 * 2. Query all active payment methods
 * 3. Calculate balance for each payment method (income - expenses)
 * 4. Get latest exchange rate for each currency
 * 5. Convert balances to base currency
 * 6. Sum all converted balances
 *
 * @returns ActionResult with total balance and breakdown by payment method
 *
 * @example
 * ```typescript
 * const result = await getTotalBalanceInBaseCurrency();
 * if (result.success) {
 *   console.log(`Total: ${result.data.totalBalance} ${result.data.baseCurrency}`);
 *   result.data.breakdown.forEach(pm => {
 *     console.log(`${pm.paymentMethodName}: ${pm.nativeBalance} ${pm.currency}`);
 *   });
 * }
 * ```
 */
export async function getTotalBalanceInBaseCurrency(): Promise<
  ActionResult<TotalBalanceResult>
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

    // 2. Get user's base currency from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("currency")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return error("Failed to fetch user profile. Please try again.");
    }

    const baseCurrency = profile.currency;

    // 3. Get all active payment methods
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
      // User has no payment methods
      return success({
        totalBalance: 0,
        baseCurrency,
        breakdown: [],
      });
    }

    // 4. Calculate balance for each payment method and convert to base currency
    const breakdownPromises = paymentMethods.map(async (pm) => {
      // Calculate native balance using database function
      const { data: balance, error: balanceError } = await supabase.rpc(
        "get_payment_method_balance",
        {
          p_payment_method_id: pm.id,
        },
      );

      const nativeBalance = balance ?? 0;

      // Get exchange rate to base currency
      let exchangeRate = 1.0;
      let convertedBalance = nativeBalance;

      if (pm.currency !== baseCurrency) {
        const rate = await getExchangeRate(pm.currency, baseCurrency);

        if (rate !== null) {
          exchangeRate = rate;
          convertedBalance = Math.round(nativeBalance * rate * 100) / 100;
        } else {
          console.warn(
            `Exchange rate not available for ${pm.currency} to ${baseCurrency}. Using native balance.`,
          );
          // Keep native balance if rate unavailable
          convertedBalance = nativeBalance;
        }
      }

      return {
        paymentMethodId: pm.id,
        paymentMethodName: pm.name,
        currency: pm.currency,
        nativeBalance,
        exchangeRate,
        convertedBalance,
      };
    });

    const breakdown = await Promise.all(breakdownPromises);

    // 5. Calculate total balance
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
 * Get detailed balance information for all payment methods.
 * Includes conversion details, exchange rate metadata, and transaction statistics.
 *
 * Logic:
 * 1. Query all active payment methods
 * 2. For each payment method:
 *    - Calculate native currency balance
 *    - Get latest exchange rate to base currency
 *    - Calculate converted balance
 *    - Find last transaction date
 *    - Count transactions
 *    - Check if rate is stale (>24 hours)
 * 3. Return enriched payment method data
 *
 * @returns ActionResult with array of payment methods with detailed balance info
 *
 * @example
 * ```typescript
 * const result = await getPaymentMethodBalancesWithDetails();
 * if (result.success) {
 *   result.data.forEach(pm => {
 *     console.log(`${pm.name}: ${pm.nativeBalance} ${pm.currency}`);
 *     if (pm.isRateStale) {
 *       console.warn(`Exchange rate is stale!`);
 *     }
 *   });
 * }
 * ```
 */
export async function getPaymentMethodBalancesWithDetails(): Promise<
  ActionResult<PaymentMethodWithDetails[]>
> {
  try {
    // 1. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("Unauthorized. Please log in to view payment methods.");
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

    // 3. Get all active payment methods
    const { data: paymentMethods, error: pmError } = await supabase
      .from("payment_methods")
      .select("*")
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

    // 4. Enrich each payment method with balance and conversion details
    const detailsPromises = paymentMethods.map(async (pm) => {
      // Calculate native balance
      const { data: balance, error: balanceError } = await supabase.rpc(
        "get_payment_method_balance",
        {
          p_payment_method_id: pm.id,
        },
      );

      const nativeBalance = balance ?? 0;

      // Get exchange rate details
      let exchangeRate = 1.0;
      let convertedBalance = nativeBalance;
      let rateDate: Date | null = null;
      let rateSource: string | null = null;
      let isRateStale = false;

      if (pm.currency !== baseCurrency) {
        const rateResult = await exchangeRateService.getRate(
          pm.currency,
          baseCurrency,
        );

        if (rateResult.rate !== null) {
          exchangeRate = rateResult.rate;
          convertedBalance =
            Math.round(nativeBalance * exchangeRate * 100) / 100;
          rateDate = rateResult.fetchedAt ?? null;
          rateSource = rateResult.source;

          // Check if rate is stale (>24 hours)
          if (rateResult.fetchedAt) {
            const ageInHours =
              (Date.now() - rateResult.fetchedAt.getTime()) / (1000 * 60 * 60);
            isRateStale = ageInHours > 24 || rateResult.source === "stale";
          } else {
            isRateStale = rateResult.source === "stale";
          }
        } else {
          // No rate available
          console.warn(
            `No exchange rate available for ${pm.currency} to ${baseCurrency}`,
          );
          convertedBalance = nativeBalance;
        }
      }

      // Get last transaction date and count
      const { data: transactionStats } = await supabase
        .from("transactions")
        .select("date")
        .eq("payment_method_id", pm.id)
        .order("date", { ascending: false })
        .limit(1);

      const lastTransactionDate =
        transactionStats && transactionStats.length > 0
          ? new Date(transactionStats[0].date)
          : null;

      // Get transaction count
      const { count: transactionCount } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("payment_method_id", pm.id);

      return {
        id: pm.id,
        name: pm.name,
        currency: pm.currency,
        cardType: pm.card_type,
        color: pm.color,
        isDefault: pm.is_default,
        nativeBalance,
        convertedBalance,
        baseCurrency,
        exchangeRate,
        rateDate,
        rateSource,
        isRateStale,
        lastTransactionDate,
        transactionCount: transactionCount ?? 0,
      };
    });

    const details = await Promise.all(detailsPromises);

    return success(details);
  } catch (err) {
    console.error(
      "Unexpected error in getPaymentMethodBalancesWithDetails:",
      err,
    );
    return error("An unexpected error occurred. Please try again.");
  }
}

/**
 * Get transactions filtered by payment method.
 * Returns transactions with full relations (category, tags, payment method).
 *
 * Logic:
 * 1. Validate payment method ID
 * 2. Verify payment method belongs to user
 * 3. Query transactions for that payment method
 * 4. Include category and tags relations
 * 5. Support pagination
 *
 * @param paymentMethodId - Payment method UUID to filter by
 * @param options - Optional pagination parameters
 * @returns ActionResult with transactions and payment method info
 *
 * @example
 * ```typescript
 * const result = await getTransactionsByPaymentMethod('uuid-here', {
 *   limit: 20,
 *   offset: 0
 * });
 * if (result.success) {
 *   console.log(`Found ${result.data.totalCount} transactions`);
 *   result.data.transactions.forEach(t => console.log(t.description));
 * }
 * ```
 */
export async function getTransactionsByPaymentMethod(
  paymentMethodId: string,
  options?: {
    limit?: number;
    offset?: number;
  },
): Promise<ActionResult<TransactionsByPaymentMethodResult>> {
  try {
    // 1. Validate payment method ID
    const validated = uuidSchema.safeParse(paymentMethodId);
    if (!validated.success) {
      return error("Invalid payment method ID format.");
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

    // 3. Verify payment method belongs to user
    const { data: paymentMethod, error: pmError } = await supabase
      .from("payment_methods")
      .select("id, name, currency")
      .eq("id", paymentMethodId)
      .eq("user_id", user.id)
      .single();

    if (pmError || !paymentMethod) {
      return error("Payment method not found or access denied.");
    }

    // 4. Set pagination defaults
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    // 5. Get total count
    const { count: totalCount } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("payment_method_id", paymentMethodId)
      .eq("user_id", user.id);

    // 6. Query transactions with relations
    const { data: transactions, error: fetchError } = await supabase
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
      .eq("payment_method_id", paymentMethodId)
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      console.error("Transactions fetch error:", fetchError);
      return error("Failed to fetch transactions. Please try again.");
    }

    return success({
      transactions: (transactions ?? []) as TransactionWithRelations[],
      totalCount: totalCount ?? 0,
      paymentMethod: {
        id: paymentMethod.id,
        name: paymentMethod.name,
        currency: paymentMethod.currency,
      },
    });
  } catch (err) {
    console.error("Unexpected error in getTransactionsByPaymentMethod:", err);
    return error("An unexpected error occurred. Please try again.");
  }
}
