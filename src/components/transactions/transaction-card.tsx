/**
 * TransactionCard Component
 *
 * Displays a single transaction with date, description, amount, category, tags, and action buttons.
 */

"use client";

import {
  ArrowRightLeft,
  Calendar,
  CreditCard,
  Edit,
  Trash2,
} from "lucide-react";
import type { TransactionWithRelations } from "@/app/actions/transactions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import { TypeBadge } from "./type-badge";

interface TransactionCardProps {
  transaction: TransactionWithRelations;
  currency?: string; // ISO currency code (e.g., "USD", "EUR", "UAH")
  onEdit: (transaction: TransactionWithRelations) => void;
  onDelete: (transaction: TransactionWithRelations) => void;
}

export function TransactionCard({
  transaction,
  currency = "USD",
  onEdit,
  onDelete,
}: TransactionCardProps) {
  const isIncome = transaction.type === "income";
  const isTransfer = transaction.type === "transfer";
  const hasPaymentMethod =
    !!transaction.payment_method_id && !!transaction.payment_method;
  const isMultiCurrency =
    hasPaymentMethod && transaction.native_amount !== null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      {/* Color indicator bar on the left */}
      {!isTransfer && transaction.category && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: transaction.category.color }}
        />
      )}
      {isTransfer && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
      )}

      <CardHeader className="pl-6 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isTransfer ? (
                <ArrowRightLeft className="h-4 w-4 text-blue-500 shrink-0" />
              ) : (
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className="text-sm text-muted-foreground">
                {formatDate(transaction.date)}
              </span>
            </div>

            {isTransfer && transaction.payment_method ? (
              <p className="text-sm text-foreground font-medium">
                {/* Determine direction from description: "Transfer to X" = withdrawal, "Transfer from X" = deposit */}
                {transaction.description?.toLowerCase().includes("transfer to")
                  ? "Transfer: To"
                  : "Transfer: From"}{" "}
                {transaction.payment_method.name}
              </p>
            ) : (
              transaction.description && (
                <p className="text-sm text-foreground line-clamp-2 break-words">
                  {transaction.description}
                </p>
              )
            )}
          </div>

          {/* Amount */}
          <div className="text-right shrink-0">
            {isMultiCurrency &&
            transaction.native_amount &&
            transaction.payment_method ? (
              <div className="space-y-1">
                {/* Native amount in payment method's currency */}
                <div
                  className={cn(
                    "text-2xl font-bold",
                    isTransfer
                      ? "text-blue-600"
                      : isIncome
                        ? "text-green-600"
                        : "text-red-600",
                  )}
                >
                  {!isTransfer && (isIncome ? "+" : "-")}
                  {formatCurrency(
                    Math.abs(transaction.native_amount),
                    transaction.payment_method.currency,
                  )}
                </div>
                {/* Converted amount in base currency */}
                <div className="text-xs text-muted-foreground">
                  ≈ {!isTransfer && (isIncome ? "+" : "-")}
                  {formatCurrency(Math.abs(transaction.amount), currency)}
                </div>
                {/* Exchange rate for transfers */}
                {isTransfer &&
                  transaction.exchange_rate &&
                  transaction.exchange_rate !== 1.0 && (
                    <div className="text-xs text-muted-foreground">
                      Rate: {transaction.exchange_rate.toFixed(4)}
                    </div>
                  )}
              </div>
            ) : (
              <div
                className={cn(
                  "text-2xl font-bold",
                  isTransfer
                    ? "text-blue-600"
                    : isIncome
                      ? "text-green-600"
                      : "text-red-600",
                )}
              >
                {!isTransfer && (isIncome ? "+" : "-")}
                {formatCurrency(Math.abs(transaction.amount), currency)}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pl-6 pt-0 pb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type Badge */}
            <TypeBadge type={transaction.type} />

            {/* Payment Method Badge */}
            {hasPaymentMethod && transaction.payment_method && (
              <Badge
                variant="outline"
                className="gap-1.5"
                style={
                  transaction.payment_method.color
                    ? {
                        borderColor: transaction.payment_method.color,
                        color: transaction.payment_method.color,
                      }
                    : undefined
                }
              >
                <CreditCard className="h-3 w-3" />
                {transaction.payment_method.name}
              </Badge>
            )}

            {/* Category Badge (not for transfers) */}
            {!isTransfer && transaction.category && (
              <Badge
                variant="outline"
                className="gap-1.5"
                style={{
                  borderColor: transaction.category.color,
                  color: transaction.category.color,
                }}
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: transaction.category.color }}
                />
                {transaction.category.name}
              </Badge>
            )}

            {/* Tags (not for transfers) */}
            {!isTransfer &&
              transaction.transaction_tags?.map(({ tag }) => (
                <Badge key={tag.id} variant="secondary" className="text-xs">
                  #{tag.name}
                </Badge>
              ))}
          </div>

          {/* Action buttons - hidden by default, shown on hover */}
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {/* Hide edit button for transfers (transfers cannot be edited) */}
            {!isTransfer && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => onEdit(transaction)}
                aria-label={`Edit transaction`}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(transaction)}
              aria-label={`Delete ${isTransfer ? "transfer" : "transaction"}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
