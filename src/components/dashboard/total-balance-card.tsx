/**
 * Total Balance Card Component
 *
 * Displays the user's total balance across all payment methods,
 * aggregated and converted to their base currency.
 *
 * Server Component - fetches data directly from Server Actions.
 */

import { getTotalBalanceInBaseCurrency } from "@/app/actions/dashboard";
import { formatCurrency } from "@/lib/utils/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export async function TotalBalanceCard() {
  const result = await getTotalBalanceInBaseCurrency();

  if (!result.success) {
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
        <CardHeader>
          <CardTitle className="text-red-900 dark:text-red-100">
            Error Loading Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700 dark:text-red-300">
            {result.error}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { totalBalance, baseCurrency } = result.data;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Total Balance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <p className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            {formatCurrency(totalBalance, baseCurrency)}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Across all payment methods
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for TotalBalanceCard.
 * Use this while data is being fetched.
 */
export function TotalBalanceCardSkeleton() {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Total Balance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
      </CardContent>
    </Card>
  );
}
