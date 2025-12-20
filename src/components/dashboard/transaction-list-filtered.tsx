/**
 * Transaction List Filtered Component
 *
 * Displays transactions for a specific payment method.
 * Shows native amounts in payment method's currency.
 *
 * Client Component - handles pagination and loading states.
 */

"use client";

import { useEffect, useState } from "react";
import { getTransactionsByPaymentMethod } from "@/app/actions/dashboard";
import type { TransactionsByPaymentMethodResult } from "@/app/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/currency";
import { Calendar, Tag, X, ChevronLeft, ChevronRight } from "lucide-react";

interface TransactionListFilteredProps {
  paymentMethodId: string;
  onClose?: () => void;
}

export function TransactionListFiltered({
  paymentMethodId,
  onClose,
}: TransactionListFilteredProps) {
  const [data, setData] = useState<TransactionsByPaymentMethodResult | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      setError(null);

      const result = await getTransactionsByPaymentMethod(paymentMethodId, {
        limit,
        offset,
      });

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }

      setLoading(false);
    }

    fetchTransactions();
  }, [paymentMethodId, offset]);

  if (loading && !data) {
    return <TransactionListSkeleton />;
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
        <CardHeader>
          <CardTitle className="text-red-900 dark:text-red-100">
            Error Loading Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.transactions.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{data?.paymentMethod.name || "Transactions"}</CardTitle>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
            No transactions found for this payment method.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { transactions, totalCount, paymentMethod } = data;
  const totalPages = Math.ceil(totalCount / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-xl">
            {paymentMethod.name} Transactions
          </CardTitle>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {totalCount} total transactions in {paymentMethod.currency}
          </p>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-start justify-between">
                {/* Left: Description and Category */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50 truncate">
                    {transaction.description || "No description"}
                  </p>

                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        color: transaction.category.color || undefined,
                        borderColor: transaction.category.color || undefined,
                      }}
                    >
                      {transaction.category.name}
                    </Badge>

                    {transaction.transaction_tags &&
                      transaction.transaction_tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {transaction.transaction_tags.map((tt) => (
                            <Badge
                              key={tt.tag.id}
                              variant="secondary"
                              className="text-xs"
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {tt.tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                  </div>

                  <div className="flex items-center gap-1 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(transaction.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Right: Amount */}
                <div className="text-right ml-4">
                  <p
                    className={`text-lg font-bold ${
                      transaction.type === "income"
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(
                      transaction.native_amount ?? transaction.amount,
                      paymentMethod.currency,
                    )}
                  </p>

                  {transaction.native_amount &&
                    transaction.exchange_rate &&
                    transaction.base_currency !== paymentMethod.currency && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        ≈{" "}
                        {formatCurrency(
                          transaction.amount,
                          transaction.base_currency || "USD",
                        )}
                      </p>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Page {currentPage} of {totalPages}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0 || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= totalCount || loading}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TransactionListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32 mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-3 rounded-lg border border-zinc-200">
            <div className="flex justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
