/**
 * TypeBadge Component
 *
 * Displays a badge indicating transaction type (Income/Expense/Transfer) with icon.
 * - Income: Green badge with up arrow (TrendingUp)
 * - Expense: Red badge with down arrow (TrendingDown)
 * - Transfer: Blue outline badge with bidirectional arrow (ArrowRightLeft)
 */

"use client";

import { ArrowRightLeft, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TypeBadgeProps {
  type: string;
  className?: string;
  showIcon?: boolean;
}

export function TypeBadge({
  type,
  className,
  showIcon = true,
}: TypeBadgeProps) {
  const isIncome = type === "income";
  const isTransfer = type === "transfer";
  const Icon = isTransfer
    ? ArrowRightLeft
    : isIncome
      ? TrendingUp
      : TrendingDown;

  return (
    <Badge
      variant={isTransfer ? "outline" : isIncome ? "default" : "destructive"}
      className={cn(
        "gap-1",
        isTransfer &&
          "border-blue-500 text-blue-700 dark:border-blue-400 dark:text-blue-300",
        className,
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {isTransfer ? "Transfer" : isIncome ? "Income" : "Expense"}
    </Badge>
  );
}
