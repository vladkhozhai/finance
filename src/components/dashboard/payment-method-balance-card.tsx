/**
 * Payment Method Balance Card Component
 *
 * Displays individual payment method with:
 * - Native balance in payment method's currency
 * - Converted balance in base currency (if different)
 * - Exchange rate details in tooltip
 * - Stale rate warning indicator
 * - Last transaction date
 * - Click to filter transactions
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/utils/currency";
import { AlertTriangle, Calendar, CreditCard } from "lucide-react";
import type { PaymentMethodWithDetails } from "@/app/actions/dashboard";

interface PaymentMethodBalanceCardProps {
  paymentMethod: PaymentMethodWithDetails;
  onClick?: (id: string) => void;
}

export function PaymentMethodBalanceCard({
  paymentMethod,
  onClick,
}: PaymentMethodBalanceCardProps) {
  const {
    id,
    name,
    currency,
    cardType,
    color,
    isDefault,
    nativeBalance,
    convertedBalance,
    baseCurrency,
    exchangeRate,
    rateDate,
    rateSource,
    isRateStale,
    lastTransactionDate,
    transactionCount,
  } = paymentMethod;

  const isNegativeBalance = nativeBalance < 0;
  const showConversion = currency !== baseCurrency;

  return (
    <Card
      className={`p-4 transition-all hover:shadow-md ${
        onClick ? "cursor-pointer" : ""
      } ${isNegativeBalance ? "border-red-200 dark:border-red-800" : ""}`}
      style={{
        borderLeftColor: color || undefined,
        borderLeftWidth: color ? "4px" : undefined,
      }}
      onClick={() => onClick?.(id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-4 w-4 text-zinc-500" />
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
              {name}
            </h3>
          </div>
          {cardType && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
              {cardType}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          {isDefault && (
            <Badge variant="secondary" className="text-xs">
              Default
            </Badge>
          )}
          {isRateStale && (
            <Badge
              variant="outline"
              className="text-orange-600 border-orange-500 text-xs"
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Stale Rate
            </Badge>
          )}
        </div>
      </div>

      {/* Balance */}
      <div className="space-y-2 mb-4">
        <div>
          <p
            className={`text-2xl font-bold ${
              isNegativeBalance
                ? "text-red-600 dark:text-red-400"
                : "text-zinc-900 dark:text-zinc-50"
            }`}
          >
            {formatCurrency(nativeBalance, currency)}
          </p>
        </div>

        {showConversion && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 cursor-help">
                  <span>
                    ≈ {formatCurrency(convertedBalance, baseCurrency)}
                  </span>
                  {isRateStale && (
                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1 text-xs">
                  <p className="font-semibold">Exchange Rate Details</p>
                  <p>
                    1 {currency} = {exchangeRate.toFixed(6)} {baseCurrency}
                  </p>
                  {rateDate && (
                    <p>
                      Rate Date:{" "}
                      {new Date(rateDate).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                  {rateSource && <p>Source: {rateSource}</p>}
                  {isRateStale && (
                    <p className="text-orange-500 font-medium mt-2">
                      ⚠️ Rate is stale (&gt;24 hours old)
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-3 border-t border-zinc-200 dark:border-zinc-700">
        <span>{transactionCount} transactions</span>
        {lastTransactionDate && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              Last:{" "}
              {new Date(lastTransactionDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
