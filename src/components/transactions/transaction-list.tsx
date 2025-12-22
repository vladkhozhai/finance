/**
 * TransactionList Component
 *
 * Displays a list of transactions with empty state and loading states.
 */

"use client";

import { Inbox } from "lucide-react";
import type { TransactionWithRelations } from "@/app/actions/transactions";
import { TransactionCard } from "./transaction-card";

interface TransactionListProps {
  transactions: TransactionWithRelations[];
  currency?: string; // ISO currency code (e.g., "USD", "EUR", "UAH")
  isLoading?: boolean;
  onEdit: (transaction: TransactionWithRelations) => void;
  onDelete: (transaction: TransactionWithRelations) => void;
}

export function TransactionList({
  transactions,
  currency = "USD",
  isLoading = false,
  onEdit,
  onDelete,
}: TransactionListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 rounded-lg border bg-card animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Empty state
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Inbox className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Get started by creating your first transaction. Track your income and
          expenses to see your financial overview.
        </p>
      </div>
    );
  }

  // Transaction list
  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <TransactionCard
          key={transaction.id}
          transaction={transaction}
          currency={currency}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
