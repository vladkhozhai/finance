/**
 * CategoryList Component
 *
 * Displays all categories grouped by type (Expense/Income).
 * Handles edit and delete actions.
 */

"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import type { Tables } from "@/types/database.types";
import { CategoryCard } from "./category-card";
import { DeleteCategoryDialog } from "./delete-category-dialog";
import { EditCategoryDialog } from "./edit-category-dialog";

type Category = Tables<"categories">;

interface CategoryListProps {
  categories: Category[];
}

export function CategoryList({ categories }: CategoryListProps) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null,
  );

  // Group categories by type
  const expenseCategories = categories.filter((cat) => cat.type === "expense");
  const incomeCategories = categories.filter((cat) => cat.type === "income");

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
  };

  const handleDelete = (category: Category) => {
    setDeletingCategory(category);
  };

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <TrendingDown className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
        <p className="text-muted-foreground mb-4">
          Create your first category to start organizing transactions.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Expense Categories */}
        {expenseCategories.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="h-5 w-5 text-destructive" />
              <h2 className="text-xl font-semibold">Expense Categories</h2>
              <span className="text-sm text-muted-foreground">
                ({expenseCategories.length})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expenseCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}

        {/* Income Categories */}
        {incomeCategories.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold">Income Categories</h2>
              <span className="text-sm text-muted-foreground">
                ({incomeCategories.length})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incomeCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state when one type has no categories */}
        {expenseCategories.length === 0 && incomeCategories.length > 0 && (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <TrendingDown className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No expense categories yet
            </p>
          </div>
        )}

        {incomeCategories.length === 0 && expenseCategories.length > 0 && (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No income categories yet
            </p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <EditCategoryDialog
        category={editingCategory}
        open={!!editingCategory}
        onOpenChange={(open) => {
          if (!open) setEditingCategory(null);
        }}
      />

      {/* Delete Dialog */}
      <DeleteCategoryDialog
        category={deletingCategory}
        open={!!deletingCategory}
        onOpenChange={(open) => {
          if (!open) setDeletingCategory(null);
        }}
      />
    </>
  );
}
