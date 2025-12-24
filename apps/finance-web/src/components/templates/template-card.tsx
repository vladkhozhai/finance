/**
 * TemplateCard Component
 *
 * Displays a single transaction template with its details and actions.
 * Shows name, amount (or "Variable"), category badge, payment method, tags, and favorite star.
 */

"use client";

import { CreditCard, Edit, MoreVertical, Star, Trash2 } from "lucide-react";
import type { TemplateWithRelations } from "@/app/actions/templates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";

interface TemplateCardProps {
  template: TemplateWithRelations;
  currency?: string; // ISO currency code (e.g., "USD", "EUR")
  onUse: (template: TemplateWithRelations) => void;
  onEdit: (template: TemplateWithRelations) => void;
  onDelete: (template: TemplateWithRelations) => void;
  onToggleFavorite: (template: TemplateWithRelations) => void;
}

export function TemplateCard({
  template,
  currency = "USD",
  onUse,
  onEdit,
  onDelete,
  onToggleFavorite,
}: TemplateCardProps) {
  const hasPaymentMethod =
    !!template.payment_method_id && !!template.payment_method;
  const displayCurrency =
    hasPaymentMethod && template.payment_method
      ? template.payment_method.currency
      : currency;

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      {/* Color indicator bar on the left (if category exists) */}
      {template.category && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: template.category.color }}
        />
      )}

      <CardHeader className="pl-6 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {/* Favorite star */}
              <button
                type="button"
                onClick={() => onToggleFavorite(template)}
                className={cn(
                  "transition-colors hover:scale-110 shrink-0",
                  template.is_favorite
                    ? "text-yellow-500"
                    : "text-muted-foreground hover:text-yellow-500",
                )}
                aria-label={
                  template.is_favorite
                    ? "Remove from favorites"
                    : "Add to favorites"
                }
              >
                <Star
                  className={cn(
                    "h-5 w-5",
                    template.is_favorite && "fill-current",
                  )}
                />
              </button>

              {/* Template name */}
              <h3 className="text-lg font-semibold truncate">
                {template.name}
              </h3>
            </div>

            {/* Description (if exists) */}
            {template.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 break-words">
                {template.description}
              </p>
            )}
          </div>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                aria-label="Template actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onUse(template)}>
                Use Template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(template)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleFavorite(template)}>
                <Star className="h-4 w-4 mr-2" />
                {template.is_favorite
                  ? "Remove from Favorites"
                  : "Add to Favorites"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(template)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pl-6 pt-0 pb-4">
        <div className="space-y-3">
          {/* Amount and Category line */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Amount */}
            <span className="text-lg font-bold">
              {template.amount !== null
                ? formatCurrency(template.amount, displayCurrency)
                : "Variable"}
            </span>

            <span className="text-muted-foreground">•</span>

            {/* Category Badge */}
            {template.category && (
              <Badge
                variant="outline"
                className="gap-1.5"
                style={{
                  borderColor: template.category.color,
                  color: template.category.color,
                }}
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: template.category.color }}
                />
                {template.category.name}
              </Badge>
            )}

            {/* Payment Method Badge */}
            {hasPaymentMethod && template.payment_method && (
              <Badge
                variant="outline"
                className="gap-1.5"
                style={
                  template.payment_method.color
                    ? {
                        borderColor: template.payment_method.color,
                        color: template.payment_method.color,
                      }
                    : undefined
                }
              >
                <CreditCard className="h-3 w-3" />
                {template.payment_method.name}
              </Badge>
            )}
          </div>

          {/* Tags */}
          {template.template_tags && template.template_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {template.template_tags.map(({ tag }) => (
                <Badge key={tag.id} variant="secondary" className="text-xs">
                  #{tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => onUse(template)}
              className="flex-1"
            >
              Use
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(template)}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
