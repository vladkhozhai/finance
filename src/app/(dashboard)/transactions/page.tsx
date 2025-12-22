/**
 * Transactions Page
 *
 * Main page for displaying and managing transactions with filtering and CRUD operations.
 */

"use client";

import { Filter } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getBalance,
  getTransactions,
  type TransactionWithRelations,
} from "@/app/actions/transactions";
import { getUserProfile } from "@/app/actions/profile";
import {
  BalanceSummary,
  CreateTransactionDialog,
  DeleteTransactionDialog,
  EditTransactionDialog,
  TransactionFilters,
  TransactionList,
  type TransactionFiltersState,
} from "@/components/transactions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Transaction = TransactionWithRelations;

interface BalanceData {
  balance: number;
  income: number;
  expense: number;
}

export default function TransactionsPage() {
  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<BalanceData>({
    balance: 0,
    income: 0,
    expense: 0,
  });
  const [currency, setCurrency] = useState<string>("USD");

  // UI state
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<TransactionFiltersState>({});

  // Dialog state
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] =
    useState<Transaction | null>(null);

  // Fetch balance
  const fetchBalance = async () => {
    setIsLoadingBalance(true);
    const result = await getBalance();

    if (result.success) {
      setBalance(result.data);
    }

    setIsLoadingBalance(false);
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    setIsLoadingTransactions(true);

    const result = await getTransactions({
      type: filters.type,
      categoryId: filters.categoryId,
      tagIds: filters.tagIds,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      limit: 50,
      offset: 0,
    });

    if (result.success) {
      setTransactions(result.data);
    }

    setIsLoadingTransactions(false);
  };

  // Fetch user profile for currency
  const fetchCurrency = async () => {
    const result = await getUserProfile();
    if (result.success) {
      setCurrency(result.data.currency || "USD");
    }
  };

  // Initial data load
  useEffect(() => {
    fetchCurrency();
    fetchBalance();
    fetchTransactions();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const handleSuccess = () => {
    fetchBalance();
    fetchTransactions();
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleDelete = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your income and expenses
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && "bg-accent")}
          >
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </Button>
          <CreateTransactionDialog onSuccess={handleSuccess} />
        </div>
      </div>

      {/* Balance Summary */}
      <BalanceSummary
        balance={balance.balance}
        income={balance.income}
        expense={balance.expense}
        currency={currency}
        isLoading={isLoadingBalance}
      />

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Transactions List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Recent Transactions
              {!isLoadingTransactions && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({transactions.length})
                </span>
              )}
            </h2>
          </div>

          <TransactionList
            transactions={transactions}
            currency={currency}
            isLoading={isLoadingTransactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        {/* Filters Sidebar (desktop) or expanded (mobile) */}
        <div
          className={cn(
            "lg:block",
            !showFilters && "hidden",
            showFilters && "block",
          )}
        >
          <div className="lg:sticky lg:top-6">
            <TransactionFilters filters={filters} onChange={setFilters} />
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <EditTransactionDialog
        transaction={editingTransaction}
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        onSuccess={handleSuccess}
      />

      {/* Delete Dialog */}
      <DeleteTransactionDialog
        transaction={deletingTransaction}
        open={!!deletingTransaction}
        onOpenChange={(open) => !open && setDeletingTransaction(null)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
