/**
 * Investigation Script for Bug #27 - Balance Discrepancy
 *
 * Run with: node scripts/investigate-bug-27.mjs
 */

import { createClient } from "@supabase/supabase-js";

// Supabase connection (using local instance)
const supabaseUrl = "http://127.0.0.1:54321";
const supabaseServiceRoleKey = "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log("=".repeat(80));
  console.log("Bug #27 Investigation: Balance Discrepancy Analysis");
  console.log("=".repeat(80));
  console.log();

  console.log("Fetching transaction data...");

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
    process.exit(1);
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

  const summary = {
    totalTransactions: transactions.length,
    legacyBalance,
    modernBalance,
    discrepancy: legacyBalance - modernBalance,
    orphanedBalance,
    archivedPMBalance,
    orphanedCount: orphanedTxs.length,
    archivedPMCount: archivedPMTxs.length,
  };

  // Print Summary
  console.log("\n📊 SUMMARY");
  console.log("-".repeat(80));
  console.log(`Total Transactions: ${summary.totalTransactions}`);
  console.log();
  console.log(
    `Legacy Balance (BalanceSummary):    $${summary.legacyBalance.toFixed(2)}`,
  );
  console.log(
    `Modern Balance (TotalBalanceCard):  $${summary.modernBalance.toFixed(2)}`,
  );
  console.log(
    `Discrepancy:                        $${summary.discrepancy.toFixed(2)}`,
  );
  console.log();
  console.log(
    `Orphaned Transactions (no PM):      ${summary.orphanedCount} transactions = $${summary.orphanedBalance.toFixed(2)}`,
  );
  console.log(
    `Archived PM Transactions:           ${summary.archivedPMCount} transactions = $${summary.archivedPMBalance.toFixed(2)}`,
  );
  console.log();

  // Analysis
  const explainedDiscrepancy =
    summary.orphanedBalance + summary.archivedPMBalance;
  const remainingDiscrepancy = summary.discrepancy - explainedDiscrepancy;

  console.log("\n🔍 ANALYSIS");
  console.log("-".repeat(80));
  console.log(
    `Expected Discrepancy (orphaned + archived): $${explainedDiscrepancy.toFixed(2)}`,
  );
  console.log(
    `Remaining Unexplained Discrepancy:         $${remainingDiscrepancy.toFixed(2)}`,
  );
  console.log();

  if (Math.abs(remainingDiscrepancy) < 0.01) {
    console.log(
      "✅ Discrepancy fully explained by orphaned and archived PM transactions!",
    );
  } else {
    console.log(
      "⚠️  There is an unexplained discrepancy. Further investigation needed.",
    );
  }

  // Orphaned Transactions Detail
  if (orphanedTxs.length > 0) {
    console.log("\n🔴 ORPHANED TRANSACTIONS (No Payment Method)");
    console.log("-".repeat(80));
    for (const tx of orphanedTxs) {
      const amount = tx.category?.type === "income" ? tx.amount : -tx.amount;
      console.log(
        `[${tx.date}] ${tx.category?.name || "Unknown"} (${tx.category?.type || "unknown"}): $${amount.toFixed(2)} - ${tx.description || "No description"}`,
      );
    }
  }

  // Archived PM Transactions Detail
  if (archivedPMTxs.length > 0) {
    console.log("\n🟡 ARCHIVED PAYMENT METHOD TRANSACTIONS");
    console.log("-".repeat(80));
    for (const tx of archivedPMTxs) {
      const amount = tx.category?.type === "income" ? tx.amount : -tx.amount;
      console.log(
        `[${tx.date}] ${tx.payment_method?.name} (${tx.payment_method?.currency}) - ${tx.category?.name}: $${amount.toFixed(2)} - ${tx.description || "No description"}`,
      );
    }
  }

  // Recommendations
  console.log("\n💡 RECOMMENDATIONS");
  console.log("-".repeat(80));

  if (orphanedTxs.length > 0) {
    console.log("1. Orphaned Transactions:");
    console.log("   - Create a default 'Cash/Unspecified' payment method");
    console.log(
      "   - Migrate orphaned transactions to this default payment method",
    );
    console.log(
      "   - Update transaction creation to require payment_method_id",
    );
  }

  if (archivedPMTxs.length > 0) {
    console.log("2. Archived Payment Method Transactions:");
    console.log(
      "   - Decision needed: Should archived PM transactions be included in balance?",
    );
    console.log(
      "   - Option A: Exclude them (current TotalBalanceCard behavior)",
    );
    console.log(
      "   - Option B: Include them (current BalanceSummary behavior)",
    );
    console.log(
      "   - Recommendation: Include them - archiving is for UI hiding, not deletion",
    );
  }

  console.log("\n3. General:");
  console.log("   - Remove legacy BalanceSummary component to avoid confusion");
  console.log(
    "   - Document that TotalBalanceCard only shows active payment methods",
  );
  console.log(
    "   - Consider adding a toggle to show/hide archived payment methods",
  );

  console.log("\n" + "=".repeat(80));
}

main().catch(console.error);
