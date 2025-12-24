/**
 * TransactionFilters Component
 *
 * Filter controls for transactions: type, category, tags, and date range.
 */

"use client";

import { Calendar as CalendarIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getCategories } from "@/app/actions/categories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagSelector } from "@/components/tags";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database.types";

type Category = Tables<"categories">;

export interface TransactionFiltersState {
  type?: "income" | "expense";
  categoryId?: string;
  tagIds?: string[];
  dateFrom?: string;
  dateTo?: string;
}

interface TransactionFiltersProps {
  filters: TransactionFiltersState;
  onChange: (filters: TransactionFiltersState) => void;
  onApply?: () => void;
}

export function TransactionFilters({
  filters,
  onChange,
  onApply,
}: TransactionFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    filters.dateFrom ? new Date(filters.dateFrom) : undefined,
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    filters.dateTo ? new Date(filters.dateTo) : undefined,
  );

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      const result = await getCategories();

      if (result.success) {
        setCategories(result.data || []);
      }

      setIsLoadingCategories(false);
    };

    fetchCategories();
  }, []);

  // Update filters when date changes
  useEffect(() => {
    onChange({
      ...filters,
      dateFrom: dateFrom?.toISOString().split("T")[0],
      dateTo: dateTo?.toISOString().split("T")[0],
    });
  }, [dateFrom, dateTo]);

  const handleTypeChange = (value: string) => {
    onChange({
      ...filters,
      type: value === "all" ? undefined : (value as "income" | "expense"),
    });
  };

  const handleCategoryChange = (value: string) => {
    onChange({
      ...filters,
      categoryId: value === "all" ? undefined : value,
    });
  };

  const handleTagsChange = (tagIds: string[]) => {
    onChange({
      ...filters,
      tagIds: tagIds.length > 0 ? tagIds : undefined,
    });
  };

  const handleClearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    onChange({});
  };

  const hasActiveFilters =
    filters.type ||
    filters.categoryId ||
    (filters.tagIds && filters.tagIds.length > 0) ||
    filters.dateFrom ||
    filters.dateTo;

  const formatDateRange = (from?: Date, to?: Date) => {
    if (!from && !to) return "Select dates";

    const format = (date: Date) =>
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);

    if (from && to) {
      return `${format(from)} - ${format(to)}`;
    }
    if (from) {
      return `From ${format(from)}`;
    }
    return `Until ${format(to!)}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 px-2 text-xs"
            >
              <X className="h-4 w-4 mr-1" />
              Clear all
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Type Filter */}
        <div className="space-y-2">
          <Label>Type</Label>
          <RadioGroup
            value={filters.type || "all"}
            onValueChange={handleTypeChange}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="type-all" />
              <Label htmlFor="type-all" className="font-normal cursor-pointer">
                All
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="income" id="type-income" />
              <Label
                htmlFor="type-income"
                className="font-normal cursor-pointer"
              >
                Income
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="expense" id="type-expense" />
              <Label
                htmlFor="type-expense"
                className="font-normal cursor-pointer"
              >
                Expense
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <Label htmlFor="category-filter">Category</Label>
          <Select
            value={filters.categoryId || "all"}
            onValueChange={handleCategoryChange}
            disabled={isLoadingCategories}
          >
            <SelectTrigger id="category-filter">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span>{category.name}</span>
                    <Badge
                      variant={
                        category.type === "expense" ? "destructive" : "default"
                      }
                      className="ml-auto text-xs"
                    >
                      {category.type}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tags Filter */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <TagSelector
            value={filters.tagIds || []}
            onChange={handleTagsChange}
            placeholder="Filter by tags..."
          />
          {filters.tagIds && filters.tagIds.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Showing transactions with ALL selected tags
            </p>
          )}
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label>Date Range</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateFrom && !dateTo && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateRange(dateFrom, dateTo)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    disabled={(date) => (dateFrom ? date < dateFrom : false)}
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setDateFrom(undefined);
                      setDateTo(undefined);
                    }}
                  >
                    Clear dates
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Apply button (optional) */}
        {onApply && (
          <Button onClick={onApply} className="w-full">
            Apply Filters
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
