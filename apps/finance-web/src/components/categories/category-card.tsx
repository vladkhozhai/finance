/**
 * CategoryCard Component
 *
 * Displays a single category with color indicator, name, type badge, and action buttons.
 */

"use client";

import { Edit, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tables } from "@/types/database.types";

type Category = Tables<"categories">;

interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoryCard({
  category,
  onEdit,
  onDelete,
}: CategoryCardProps) {
  const isExpense = category.type === "expense";
  const TypeIcon = isExpense ? TrendingDown : TrendingUp;

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      {/* Color indicator bar on the left */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: category.color }}
      />

      <CardHeader className="pl-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {/* Color circle */}
            <div
              className="h-10 w-10 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: category.color }}
            />

            <div>
              <CardTitle className="text-lg font-medium">
                {category.name}
              </CardTitle>

              {/* Type badge */}
              <Badge
                variant={isExpense ? "destructive" : "default"}
                className="mt-1.5 gap-1"
              >
                <TypeIcon className="h-3 w-3" />
                {isExpense ? "Expense" : "Income"}
              </Badge>
            </div>
          </div>

          {/* Action buttons - always visible on mobile, hover-reveal on desktop */}
          <div className="flex gap-1 transition-opacity md:opacity-0 md:group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(category)}
              aria-label={`Edit ${category.name}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(category)}
              aria-label={`Delete ${category.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
