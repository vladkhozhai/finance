/**
 * EditCategoryDialog Component
 *
 * Modal dialog for editing an existing category with pre-populated values.
 */

"use client";

import { useEffect, useState, useTransition } from "react";
import { updateCategory } from "@/app/actions/categories";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/lib/hooks/use-toast";
import type { Tables } from "@/types/database.types";
import { ColorPicker } from "./color-picker";

type Category = Tables<"categories">;

interface EditCategoryDialogProps {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCategoryDialog({
  category,
  open,
  onOpenChange,
}: EditCategoryDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [type, setType] = useState<"expense" | "income">("expense");

  // Validation errors
  const [nameError, setNameError] = useState("");
  const [colorError, setColorError] = useState("");

  // Pre-populate form when category changes
  useEffect(() => {
    if (category) {
      setName(category.name);
      setColor(category.color);
      setType(category.type as "expense" | "income");
      setNameError("");
      setColorError("");
    }
  }, [category]);

  const validateForm = () => {
    let isValid = true;

    // Validate name
    if (!name.trim()) {
      setNameError("Category name is required");
      isValid = false;
    } else {
      setNameError("");
    }

    // Validate color (hex format)
    const hexRegex = /^#[0-9A-F]{6}$/i;
    if (!hexRegex.test(color)) {
      setColorError("Invalid color format. Use #RRGGBB");
      isValid = false;
    } else {
      setColorError("");
    }

    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!category) return;
    if (!validateForm()) return;

    startTransition(async () => {
      const result = await updateCategory({
        id: category.id,
        name: name.trim(),
        color: color.toUpperCase(),
        type,
      });

      if (result.success) {
        toast.success("Category updated successfully");
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to update category");
      }
    });
  };

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category name, color, or type.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Name field */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                placeholder="e.g., Groceries, Rent, Salary"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError("");
                }}
                disabled={isPending}
                className={nameError ? "border-destructive" : ""}
              />
              {nameError && (
                <p className="text-sm text-destructive">{nameError}</p>
              )}
            </div>

            {/* Color picker */}
            <div>
              <ColorPicker
                value={color}
                onChange={(newColor) => {
                  setColor(newColor);
                  setColorError("");
                }}
                error={colorError}
              />
            </div>

            {/* Type selector */}
            <div className="space-y-3">
              <Label>
                Type <span className="text-destructive">*</span>
              </Label>
              <RadioGroup
                value={type}
                onValueChange={(value) =>
                  setType(value as "expense" | "income")
                }
                disabled={isPending}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expense" id="edit-expense" />
                  <Label
                    htmlFor="edit-expense"
                    className="font-normal cursor-pointer"
                  >
                    Expense
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="edit-income" />
                  <Label
                    htmlFor="edit-income"
                    className="font-normal cursor-pointer"
                  >
                    Income
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating..." : "Update Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
