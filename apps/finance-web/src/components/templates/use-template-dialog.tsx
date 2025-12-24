/**
 * UseTemplateDialog Component
 *
 * Dialog for creating a transaction from a template.
 * For fixed-price templates: Creates immediately and shows success.
 * For variable-price templates: Shows amount input form.
 */

"use client";

import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import {
  createTransactionFromTemplate,
  type TemplateWithRelations,
} from "@/app/actions/templates";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/lib/utils/currency";

interface UseTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TemplateWithRelations;
  onSuccess?: () => void;
}

export function UseTemplateDialog({
  open,
  onOpenChange,
  template,
  onSuccess,
}: UseTemplateDialogProps) {
  const isVariablePrice = template.amount === null;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [description, setDescription] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { success: showSuccess, error: showError } = useToast();

  const displayCurrency = template.payment_method
    ? template.payment_method.currency
    : "USD";

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Amount validation (only for variable-price templates)
    if (isVariablePrice) {
      const amountNum = Number.parseFloat(amount);
      if (!amount || Number.isNaN(amountNum) || amountNum <= 0) {
        newErrors.amount = "Amount must be a positive number";
      }
    }

    // Description validation (max 500 chars)
    if (description.length > 500) {
      newErrors.description = "Description must be 500 characters or less";
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

    const result = await createTransactionFromTemplate(template.id, {
      amount: isVariablePrice ? Number.parseFloat(amount) : undefined,
      date: date.toISOString().split("T")[0],
      description: description.trim() || undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      showSuccess("Transaction created successfully from template");
      onOpenChange(false);
      onSuccess?.();
    } else {
      showError(result.error || "Failed to create transaction");
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            Use Template: {template.name}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {isVariablePrice
              ? "This template has variable pricing. Enter the amount for this transaction."
              : "Create a transaction using this template with optional overrides."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input (for variable-price templates only) */}
          {isVariablePrice && (
            <div className="space-y-2">
              <Label htmlFor="use-template-amount">
                Amount in {displayCurrency}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="use-template-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={`0.00 ${getCurrencySymbol(displayCurrency)}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                  className={cn("pr-12", errors.amount && "border-destructive")}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  {getCurrencySymbol(displayCurrency)}
                </div>
              </div>
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount}</p>
              )}
            </div>
          )}

          {/* Date Picker */}
          <div className="space-y-2">
            <Label>
              Date <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDate(date)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description Override */}
          <div className="space-y-2">
            <Label htmlFor="use-template-description">
              Description (optional override)
            </Label>
            <Textarea
              id="use-template-description"
              placeholder={
                template.description ||
                "Override the template description for this transaction..."
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              className={cn(errors.description && "border-destructive")}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{errors.description || ""}</span>
              <span>{description.length}/500</span>
            </div>
          </div>

          {/* Template Details Summary */}
          <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
            <p className="font-medium">Template Details:</p>
            {template.category && (
              <p className="text-muted-foreground">
                Category: {template.category.name}
              </p>
            )}
            {template.payment_method && (
              <p className="text-muted-foreground">
                Payment Method: {template.payment_method.name}
              </p>
            )}
            {template.template_tags && template.template_tags.length > 0 && (
              <p className="text-muted-foreground">
                Tags:{" "}
                {template.template_tags.map((tt) => `#${tt.tag.name}`).join(", ")}
              </p>
            )}
          </div>

          <ResponsiveDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Transaction"
              )}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
