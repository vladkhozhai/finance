/**
 * PaymentMethodCard Component
 *
 * Displays a single payment method with balance, type, and action buttons.
 * Includes archive/activate, edit, delete, and set as default functionality.
 */

"use client";

import {
  Archive,
  CheckCircle2,
  CreditCard,
  Edit,
  Star,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database.types";
import { BalanceDisplay } from "./balance-display";
import { CurrencyBadge } from "./currency-badge";

type PaymentMethod = Tables<"payment_methods">;

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  balance: number;
  onEdit: (paymentMethod: PaymentMethod) => void;
  onArchive: (paymentMethod: PaymentMethod) => void;
  onActivate: (paymentMethod: PaymentMethod) => void;
  onDelete: (paymentMethod: PaymentMethod) => void;
  onSetDefault: (paymentMethod: PaymentMethod) => void;
}

// Card type display names
const CARD_TYPE_LABELS: Record<string, string> = {
  debit: "Debit",
  credit: "Credit",
  cash: "Cash",
  savings: "Savings",
  other: "Other",
};

// Card type badge variants
const CARD_TYPE_VARIANTS: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  debit: "default",
  credit: "secondary",
  cash: "outline",
  savings: "default",
  other: "secondary",
};

export function PaymentMethodCard({
  paymentMethod,
  balance,
  onEdit,
  onArchive,
  onActivate,
  onDelete,
  onSetDefault,
}: PaymentMethodCardProps) {
  const isActive = paymentMethod.is_active;
  const isDefault = paymentMethod.is_default;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all hover:shadow-md",
        !isActive && "opacity-60 bg-muted/50",
      )}
    >
      {/* Color indicator bar on the left */}
      {paymentMethod.color && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: paymentMethod.color }}
        />
      )}

      <CardHeader className="pb-3 pl-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Icon */}
            <div
              className={cn(
                "mt-1 flex-shrink-0 h-10 w-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center",
                paymentMethod.color
                  ? ""
                  : "bg-gradient-to-br from-blue-500 to-purple-600",
              )}
              style={
                paymentMethod.color
                  ? { backgroundColor: paymentMethod.color }
                  : undefined
              }
            >
              <CreditCard className="h-5 w-5 text-white" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg font-medium truncate">
                  {paymentMethod.name}
                </CardTitle>
                {isDefault && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Default payment method</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-1">
                <CurrencyBadge currency={paymentMethod.currency} size="sm" />
                {paymentMethod.card_type && (
                  <Badge
                    variant={
                      CARD_TYPE_VARIANTS[paymentMethod.card_type] || "secondary"
                    }
                    className="text-xs"
                  >
                    {CARD_TYPE_LABELS[paymentMethod.card_type] ||
                      paymentMethod.card_type}
                  </Badge>
                )}
                {!isActive && (
                  <Badge variant="outline" className="text-xs">
                    Archived
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons - always visible on mobile, hover-reveal on desktop */}
          <div className="flex gap-1 transition-opacity md:opacity-0 md:group-hover:opacity-100">
            {isActive && !isDefault && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-yellow-600"
                      onClick={() => onSetDefault(paymentMethod)}
                      aria-label="Set as default"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Set as default</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => onEdit(paymentMethod)}
                    aria-label={`Edit ${paymentMethod.name}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {isActive ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-orange-600"
                      onClick={() => onArchive(paymentMethod)}
                      aria-label={`Archive ${paymentMethod.name}`}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Archive</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-green-600"
                      onClick={() => onActivate(paymentMethod)}
                      aria-label={`Activate ${paymentMethod.name}`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Activate</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(paymentMethod)}
                    aria-label={`Delete ${paymentMethod.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pl-6">
        {/* Balance display */}
        <div className="mb-2">
          <p className="text-xs text-muted-foreground mb-1">Current Balance</p>
          <BalanceDisplay
            balance={balance}
            currency={paymentMethod.currency}
            size="lg"
          />
        </div>
      </CardContent>
    </Card>
  );
}
