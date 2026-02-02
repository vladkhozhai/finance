/**
 * BudgetFilters Component
 *
 * Filter controls for budgets list with category, tag, and period filters.
 */

"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { getCategories } from "@/app/actions/categories";
import { getTags } from "@/app/actions/tags";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PeriodPicker } from "./period-picker";
import type { Tables } from "@/types/database.types";

type Category = Tables<"categories">;
type Tag = Tables<"tags">;

export interface BudgetFilterValues {
  categoryId?: string;
  tagId?: string;
  period?: string;
}

interface BudgetFiltersProps {
  filters: BudgetFilterValues;
  onFiltersChange: (filters: BudgetFilterValues) => void;
}

export function BudgetFilters({
  filters,
  onFiltersChange,
}: BudgetFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch categories and tags
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const [categoriesResult, tagsResult] = await Promise.all([
        getCategories(),
        getTags(),
      ]);

      if (categoriesResult.success) {
        // Filter only expense categories
        const expenseCategories = (categoriesResult.data || []).filter(
          (cat) => cat.type === "expense",
        );
        setCategories(expenseCategories);
      }

      if (tagsResult.success) {
        setTags(tagsResult.data || []);
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  const handleCategoryChange = (value: string) => {
    onFiltersChange({
      ...filters,
      categoryId: value === "all" ? undefined : value,
      tagId: undefined, // Clear tag when category is selected
    });
  };

  const handleTagChange = (value: string) => {
    onFiltersChange({
      ...filters,
      tagId: value === "all" ? undefined : value,
      categoryId: undefined, // Clear category when tag is selected
    });
  };

  const handlePeriodChange = (value: string) => {
    onFiltersChange({
      ...filters,
      period: value,
    });
  };

  const handleClearFilters = () => {
    // Reset to current month instead of clearing all filters
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    onFiltersChange({ period: currentMonth });
  };

  // Check if filters are active (excluding current month period)
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  };
  const isCurrentMonth = filters.period === getCurrentMonth();
  const hasActiveFilters =
    filters.categoryId || filters.tagId || (filters.period && !isCurrentMonth);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-8 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Category Filter */}
        <div className="space-y-2">
          <Label htmlFor="filter-category" className="text-xs">
            Category
          </Label>
          <Select
            value={filters.categoryId || "all"}
            onValueChange={handleCategoryChange}
            disabled={isLoading || !!filters.tagId}
          >
            <SelectTrigger id="filter-category" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tag Filter */}
        <div className="space-y-2">
          <Label htmlFor="filter-tag" className="text-xs">
            Tag
          </Label>
          <Select
            value={filters.tagId || "all"}
            onValueChange={handleTagChange}
            disabled={isLoading || !!filters.categoryId}
          >
            <SelectTrigger id="filter-tag" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {tags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Period Filter */}
        <div className="space-y-2">
          <Label className="text-xs">Period</Label>
          <PeriodPicker
            value={filters.period || ""}
            onChange={handlePeriodChange}
            placeholder="All periods"
            className="h-9 w-full"
          />
        </div>
      </div>

      {filters.categoryId && filters.tagId && (
        <p className="text-xs text-muted-foreground">
          Note: Only one filter (Category or Tag) can be active at a time.
        </p>
      )}
    </div>
  );
}
