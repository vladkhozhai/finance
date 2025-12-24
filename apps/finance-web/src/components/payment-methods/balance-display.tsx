/**
 * BalanceDisplay Component
 *
 * Displays a formatted balance with currency symbol.
 * Color-coded based on positive/negative/zero values.
 */

"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

interface BalanceDisplayProps {
  balance: number;
  currency: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function BalanceDisplay({
  balance,
  currency,
  size = "md",
  className,
}: BalanceDisplayProps) {
  const formatted = formatCurrency(balance, currency);

  // Determine color based on balance
  const colorClass =
    balance > 0
      ? "text-green-600 dark:text-green-500"
      : balance < 0
        ? "text-red-600 dark:text-red-500"
        : "text-muted-foreground";

  // Size classes
  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  return (
    <div
      className={cn(
        "font-semibold tabular-nums",
        colorClass,
        sizeClasses[size],
        className,
      )}
    >
      {formatted}
    </div>
  );
}
