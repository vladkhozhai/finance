"use server";

import { createAdminClient } from "@/lib/supabase/server";

/**
 * Investigation Server Action for Bug #27 - Balance Discrepancy
 *
 * Investigates the $46.42 difference between TotalBalanceCard and BalanceSummary
 * by analyzing orphaned transactions, archived payment methods, and calculation methods.
 */

export async function investigateBalanceDiscrepancy() {
  const supabase = createAdminClient();

  try {
    // Query 1: Orphaned Transactions (No Payment Method)
    const { data: orphanedData, error: orphanedError } = await supabase.rpc(
      "investigate_orphaned_transactions",
    );

    if (orphanedError) {
      console.error("Error fetching orphaned transactions:", orphanedError);
    }

    // Query 2: Transactions with Archived Payment Methods
    const { data: archivedData, error: archivedError } = await supabase.rpc(
      "investigate_archived_payment_methods",
    );

    if (archivedError) {
      console.error(
        "Error fetching archived payment method transactions:",
        archivedError,
      );
    }

    // Query 3: Compare Both Calculation Methods
    const { data: comparisonData, error: comparisonError } = await supabase.rpc(
      "compare_balance_calculations",
    );

    if (comparisonError) {
      console.error("Error comparing balance calculations:", comparisonError);
    }

    return {
      success: true,
      data: {
        orphanedTransactions: orphanedData,
        archivedPaymentMethods: archivedData,
        balanceComparison: comparisonData,
      },
    };
  } catch (error) {
    console.error("Unexpected error in investigateBalanceDiscrepancy:", error);
    return {
      success: false,
      error: "An unexpected error occurred during investigation",
    };
  }
}

/**
 * Direct SQL query execution for investigation
 */
export async function executeInvestigationQuery(query: string) {
  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase.rpc("execute_sql", {
      query_text: query,
    });

    if (error) {
      console.error("SQL execution error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error executing SQL:", error);
    return {
      success: false,
      error: "An unexpected error occurred executing SQL",
    };
  }
}

/**
 * Get raw transaction data for manual analysis
 */
export async function getRawTransactionData() {
  const supabase = createAdminClient();

  try {
    // Get all transactions with related data
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select(
        `
        id,
        amount,
        date,
        description,
        payment_method_id,
        category:categories (
          id,
          name,
          type
        ),
        payment_method:payment_methods (
          id,
          name,
          currency,
          is_active
        )
      `,
      )
      .order("date", { ascending: false });

    if (txError) {
      console.error("Error fetching transactions:", txError);
      return { success: false, error: txError.message };
    }

    // Calculate balances using both methods
    let legacyBalance = 0;
    let modernBalance = 0;
    let orphanedBalance = 0;
    let archivedPMBalance = 0;

    const orphanedTxs = [];
    const archivedPMTxs = [];

    for (const tx of transactions) {
      const amount = tx.category?.type === "income" ? tx.amount : -tx.amount;

      // Legacy calculation (all transactions)
      legacyBalance += amount;

      // Check for orphaned transactions
      if (!tx.payment_method_id) {
        orphanedBalance += amount;
        orphanedTxs.push(tx);
      }
      // Check for archived payment method transactions
      else if (tx.payment_method && !tx.payment_method.is_active) {
        archivedPMBalance += amount;
        archivedPMTxs.push(tx);
      }
      // Modern calculation (only active payment methods)
      else if (tx.payment_method && tx.payment_method.is_active) {
        modernBalance += amount;
      }
    }

    return {
      success: true,
      data: {
        summary: {
          totalTransactions: transactions.length,
          legacyBalance,
          modernBalance,
          discrepancy: legacyBalance - modernBalance,
          orphanedBalance,
          archivedPMBalance,
          orphanedCount: orphanedTxs.length,
          archivedPMCount: archivedPMTxs.length,
        },
        orphanedTransactions: orphanedTxs,
        archivedPaymentMethodTransactions: archivedPMTxs,
      },
    };
  } catch (error) {
    console.error("Unexpected error getting raw transaction data:", error);
    return {
      success: false,
      error: "An unexpected error occurred fetching transaction data",
    };
  }
}
