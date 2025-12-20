/**
 * TypeBadge Component
 *
 * Displays a badge indicating transaction type (Income/Expense) with icon.
 */

"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
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
  const Icon = isIncome ? TrendingUp : TrendingDown;

  return (
    <Badge
      variant={isIncome ? "default" : "destructive"}
      className={cn("gap-1", className)}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {isIncome ? "Income" : "Expense"}
    </Badge>
  );
}
