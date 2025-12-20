/**
 * Investigation Script for Bug #27 - Balance Discrepancy
 *
 * Run with: npx tsx scripts/investigate-bug-27.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(__dirname, "../.env.local") });

import { getRawTransactionData } from "../src/app/actions/investigate-balance";

async function main() {
  console.log("=".repeat(80));
  console.log("Bug #27 Investigation: Balance Discrepancy Analysis");
  console.log("=".repeat(80));
  console.log();

  console.log("Fetching transaction data...");
  const result = await getRawTransactionData();

  if (!result.success) {
    console.error("Error:", result.error);
    process.exit(1);
  }

  const { summary, orphanedTransactions, archivedPaymentMethodTransactions } =
    result.data;

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
  if (orphanedTransactions.length > 0) {
    console.log("\n🔴 ORPHANED TRANSACTIONS (No Payment Method)");
    console.log("-".repeat(80));
    for (const tx of orphanedTransactions) {
      const amount = tx.category?.type === "income" ? tx.amount : -tx.amount;
      console.log(
        `[${tx.date}] ${tx.category?.name || "Unknown"} (${tx.category?.type || "unknown"}): $${amount.toFixed(2)} - ${tx.description || "No description"}`,
      );
    }
  }

  // Archived PM Transactions Detail
  if (archivedPaymentMethodTransactions.length > 0) {
    console.log("\n🟡 ARCHIVED PAYMENT METHOD TRANSACTIONS");
    console.log("-".repeat(80));
    for (const tx of archivedPaymentMethodTransactions) {
      const amount = tx.category?.type === "income" ? tx.amount : -tx.amount;
      console.log(
        `[${tx.date}] ${tx.payment_method?.name} (${tx.payment_method?.currency}) - ${tx.category?.name}: $${amount.toFixed(2)} - ${tx.description || "No description"}`,
      );
    }
  }

  // Recommendations
  console.log("\n💡 RECOMMENDATIONS");
  console.log("-".repeat(80));

  if (orphanedTransactions.length > 0) {
    console.log("1. Orphaned Transactions:");
    console.log("   - Create a default 'Cash/Unspecified' payment method");
    console.log(
      "   - Migrate orphaned transactions to this default payment method",
    );
    console.log(
      "   - Update transaction creation to require payment_method_id",
    );
  }

  if (archivedPaymentMethodTransactions.length > 0) {
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
