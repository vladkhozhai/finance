/**
 * CreateBudgetDialog Component
 *
 * Dialog for creating a new budget with category or tag selection.
 */

"use client";

import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { createBudget } from "@/app/actions/budgets";
import { getCategories } from "@/app/actions/categories";
import { getTags } from "@/app/actions/tags";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PeriodPicker } from "./period-picker";
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database.types";

type Category = Tables<"categories">;
type Tag = Tables<"tags">;

interface CreateBudgetDialogProps {
  onSuccess?: () => void;
}

/**
 * Gets the current month period (YYYY-MM-01).
 */
function getCurrentPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

export function CreateBudgetDialog({ onSuccess }: CreateBudgetDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Form state
  const [targetType, setTargetType] = useState<"category" | "tag">("category");
  const [categoryId, setCategoryId] = useState("");
  const [tagId, setTagId] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState(getCurrentPeriod());

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { success: showSuccess, error: showError } = useToast();

  // Fetch categories and tags
  useEffect(() => {
    const fetchData = async () => {
      if (!open) return;

      setIsLoadingData(true);

      const [categoriesResult, tagsResult] = await Promise.all([
        getCategories(),
        getTags(),
      ]);

      if (categoriesResult.success) {
        // Filter only expense categories for budgets
        const expenseCategories = (categoriesResult.data || []).filter(
          (cat) => cat.type === "expense",
        );
        setCategories(expenseCategories);
      } else {
        showError(categoriesResult.error || "Failed to load categories");
      }

      if (tagsResult.success) {
        setTags(tagsResult.data || []);
      } else {
        showError(tagsResult.error || "Failed to load tags");
      }

      setIsLoadingData(false);
    };

    fetchData();
  }, [open, showError]);

  // Clear selection when target type changes
  useEffect(() => {
    setCategoryId("");
    setTagId("");
  }, [targetType]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Amount validation
    const amountNum = Number.parseFloat(amount);
    if (!amount || Number.isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = "Amount must be a positive number";
    }

    // Target validation
    if (targetType === "category" && !categoryId) {
      newErrors.target = "Please select a category";
    } else if (targetType === "tag" && !tagId) {
      newErrors.target = "Please select a tag";
    }

    // Period validation
    if (!period || !/^\d{4}-\d{2}-01$/.test(period)) {
      newErrors.period = "Please select a valid period";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const result = await createBudget({
      amount: Number.parseFloat(amount),
      period,
      categoryId: targetType === "category" ? categoryId : undefined,
      tagId: targetType === "tag" ? tagId : undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      showSuccess("Budget created successfully");
      handleClose();
      onSuccess?.();
    } else {
      showError(result.error || "Failed to create budget");
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset form after dialog closes
    setTimeout(() => {
      setTargetType("category");
      setCategoryId("");
      setTagId("");
      setAmount("");
      setPeriod(getCurrentPeriod());
      setErrors({});
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Create Budget
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Budget</DialogTitle>
          <DialogDescription>
            Set a spending limit for a category or tag for a specific month.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Type Selection */}
          <div className="space-y-2">
            <Label>Budget Target</Label>
            <RadioGroup
              value={targetType}
              onValueChange={(v) => setTargetType(v as "category" | "tag")}
            >
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="category" id="target-category" />
                  <Label
                    htmlFor="target-category"
                    className="font-normal cursor-pointer"
                  >
                    Category
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tag" id="target-tag" />
                  <Label
                    htmlFor="target-tag"
                    className="font-normal cursor-pointer"
                  >
                    Tag
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Category Selection */}
          {targetType === "category" && (
            <div className="space-y-2">
              <Label htmlFor="category-select">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
                disabled={isLoadingData}
              >
                <SelectTrigger
                  id="category-select"
                  className={cn(errors.target && "border-destructive")}
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No expense categories found
                    </div>
                  ) : (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.target && (
                <p className="text-sm text-destructive">{errors.target}</p>
              )}
            </div>
          )}

          {/* Tag Selection */}
          {targetType === "tag" && (
            <div className="space-y-2">
              <Label htmlFor="tag-select">
                Tag <span className="text-destructive">*</span>
              </Label>
              <Select
                value={tagId}
                onValueChange={setTagId}
                disabled={isLoadingData}
              >
                <SelectTrigger
                  id="tag-select"
                  className={cn(errors.target && "border-destructive")}
                >
                  <SelectValue placeholder="Select a tag" />
                </SelectTrigger>
                <SelectContent>
                  {tags.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No tags found
                    </div>
                  ) : (
                    tags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        {tag.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.target && (
                <p className="text-sm text-destructive">{errors.target}</p>
              )}
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount-input">
              Budget Amount <span className="text-destructive">*</span>
            </Label>
            <Input
              id="amount-input"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={cn(errors.amount && "border-destructive")}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount}</p>
            )}
          </div>

          {/* Period Picker */}
          <div className="space-y-2">
            <Label>
              Period <span className="text-destructive">*</span>
            </Label>
            <PeriodPicker
              value={period}
              onChange={setPeriod}
              className={cn("w-full", errors.period && "border-destructive")}
            />
            {errors.period && (
              <p className="text-sm text-destructive">{errors.period}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Select the month you want to set the budget for
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoadingData}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Budget"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
