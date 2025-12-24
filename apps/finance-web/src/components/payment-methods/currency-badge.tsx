/**
 * CurrencyBadge Component
 *
 * Displays a currency badge with symbol and optional name.
 * Used to show currency information for payment methods.
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { getCurrencyName, getCurrencySymbol } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

interface CurrencyBadgeProps {
  currency: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

export function CurrencyBadge({
  currency,
  size = "md",
  showName = false,
  className,
}: CurrencyBadgeProps) {
  const symbol = getCurrencySymbol(currency);
  const name = getCurrencyName(currency);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <Badge
      variant="secondary"
      className={cn("font-mono font-semibold", sizeClasses[size], className)}
    >
      {symbol} {currency}
      {showName && ` - ${name}`}
    </Badge>
  );
}
