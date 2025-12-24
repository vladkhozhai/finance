/**
 * CreateCategoryDialog Component
 *
 * Modal dialog for creating a new category with name, color, and type.
 */

"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { createCategory } from "@/app/actions/categories";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/lib/hooks/use-toast";
import { ColorPicker } from "./color-picker";

export function CreateCategoryDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6"); // Default blue
  const [type, setType] = useState<"expense" | "income">("expense");

  // Validation errors
  const [nameError, setNameError] = useState("");
  const [colorError, setColorError] = useState("");

  const resetForm = () => {
    setName("");
    setColor("#3B82F6");
    setType("expense");
    setNameError("");
    setColorError("");
  };

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

    if (!validateForm()) {
      return;
    }

    startTransition(async () => {
      const result = await createCategory({
        name: name.trim(),
        color: color.toUpperCase(),
        type,
      });

      if (result.success) {
        toast.success("Category created successfully");
        setOpen(false);
        resetForm();
      } else {
        toast.error(result.error || "Failed to create category");
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Category
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
            <DialogDescription>
              Add a new category to organize your transactions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Name field */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
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
                  <RadioGroupItem value="expense" id="expense" />
                  <Label
                    htmlFor="expense"
                    className="font-normal cursor-pointer"
                  >
                    Expense
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="income" />
                  <Label
                    htmlFor="income"
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
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
