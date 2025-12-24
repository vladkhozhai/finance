/**
 * MultiCurrencyBalance Component
 *
 * Dashboard widget showing balances across all payment methods with multi-currency support.
 * Displays each payment method's balance in its native currency and total in base currency.
 */

"use client";

import { CreditCard, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getPaymentMethodBalances,
  getTotalBalanceInBaseCurrency,
} from "@/app/actions/transactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/currency";

interface PaymentMethodBalance {
  paymentMethodId: string;
  paymentMethodName: string;
  currency: string;
  balance: number;
  color: string | null;
}

interface TotalBalanceData {
  totalBalance: number;
  baseCurrency: string;
  breakdown: Array<{
    paymentMethodId: string;
    paymentMethodName: string;
    currency: string;
    balance: number;
    exchangeRate: number;
    convertedBalance: number;
  }>;
}

export function MultiCurrencyBalance() {
  const [pmBalances, setPmBalances] = useState<PaymentMethodBalance[]>([]);
  const [totalBalance, setTotalBalance] = useState<TotalBalanceData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const { error: showError } = useToast();

  useEffect(() => {
    const fetchBalances = async () => {
      setIsLoading(true);

      const [pmResult, totalResult] = await Promise.all([
        getPaymentMethodBalances(),
        getTotalBalanceInBaseCurrency(),
      ]);

      if (pmResult.success) {
        setPmBalances(pmResult.data || []);
      } else {
        showError(pmResult.error || "Failed to load payment method balances");
      }

      if (totalResult.success) {
        setTotalBalance(totalResult.data);
      } else {
        showError(totalResult.error || "Failed to load total balance");
      }

      setIsLoading(false);
    };

    fetchBalances();
  }, [showError]);

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Multi-Currency Balances
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state - no payment methods
  if (pmBalances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Multi-Currency Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-4 mb-3">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No payment methods configured yet. Add a payment method to track
              multi-currency balances.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isNegativeBalance = totalBalance && totalBalance.totalBalance < 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Multi-Currency Balances
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Balance in Base Currency */}
        {totalBalance && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Total Balance</span>
            </div>
            <div
              className={cn(
                "text-3xl font-bold",
                isNegativeBalance ? "text-destructive" : "text-foreground",
              )}
            >
              {formatCurrency(
                Math.abs(totalBalance.totalBalance),
                totalBalance.baseCurrency,
              )}
              {isNegativeBalance && (
                <span className="ml-2 text-lg font-normal text-destructive">
                  (deficit)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Payment Method Balances */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            By Payment Method
          </h4>
          <div className="space-y-2">
            {pmBalances.map((pm) => {
              const breakdown = totalBalance?.breakdown.find(
                (b) => b.paymentMethodId === pm.paymentMethodId,
              );
              const showConversion =
                totalBalance &&
                pm.currency !== totalBalance.baseCurrency &&
                breakdown;

              return (
                <Card
                  key={pm.paymentMethodId}
                  className="border-muted"
                  style={
                    pm.color
                      ? { borderLeftWidth: "3px", borderLeftColor: pm.color }
                      : undefined
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {pm.paymentMethodName}
                          </p>
                          {showConversion && breakdown && (
                            <p className="text-xs text-muted-foreground">
                              ≈{" "}
                              {formatCurrency(
                                breakdown.convertedBalance,
                                totalBalance.baseCurrency,
                              )}{" "}
                              <span className="text-[10px]">
                                (Rate: {breakdown.exchangeRate.toFixed(6)})
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={cn(
                            "text-lg font-bold font-mono",
                            pm.balance >= 0
                              ? "text-foreground"
                              : "text-destructive",
                          )}
                        >
                          {formatCurrency(pm.balance, pm.currency)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Exchange Rate Info */}
        {totalBalance && totalBalance.breakdown.length > 1 && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              Total is calculated by converting all balances to{" "}
              {totalBalance.baseCurrency} using current exchange rates.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
