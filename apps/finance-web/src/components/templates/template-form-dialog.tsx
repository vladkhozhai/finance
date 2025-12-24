/**
 * TemplateFormDialog Component
 *
 * Dialog for creating or editing transaction templates.
 * Supports both fixed-price and variable-price templates.
 */

"use client";

import { CreditCard, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getCategories } from "@/app/actions/categories";
import { getPaymentMethods } from "@/app/actions/payment-methods";
import {
  createTemplate,
  type TemplateWithRelations,
  updateTemplate,
} from "@/app/actions/templates";
import { TagSelector } from "@/components/tags";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/lib/utils/currency";
import type { Tables } from "@/types/database.types";

type Category = Tables<"categories">;
type PaymentMethod = Tables<"payment_methods">;

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: TemplateWithRelations; // If provided, edit mode
  onSuccess?: () => void;
}

export function TemplateFormDialog({
  open,
  onOpenChange,
  template,
  onSuccess,
}: TemplateFormDialogProps) {
  // Edit mode requires a valid template ID; otherwise it's create mode with optional pre-fill data
  const isEditMode = !!template?.id;
  const shouldPreFill = !!template;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [hasFixedAmount, setHasFixedAmount] = useState(true);
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
  const [baseCurrency] = useState<string>("USD"); // TODO: Get from user profile

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { success: showSuccess, error: showError } = useToast();

  // Fetch categories and payment methods
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingCategories(true);
      setIsLoadingPaymentMethods(true);

      const [categoriesResult, paymentMethodsResult] = await Promise.all([
        getCategories(),
        getPaymentMethods({ isActive: true, limit: 50, offset: 0 }),
      ]);

      if (categoriesResult.success) {
        setCategories(categoriesResult.data || []);
      } else {
        showError(categoriesResult.error || "Failed to load categories");
      }

      if (paymentMethodsResult.success) {
        setPaymentMethods(paymentMethodsResult.data || []);
      } else {
        showError(
          paymentMethodsResult.error || "Failed to load payment methods",
        );
      }

      setIsLoadingCategories(false);
      setIsLoadingPaymentMethods(false);
    };

    if (open) {
      fetchData();
    }
  }, [open, showError]);

  // Initialize form with template data (for edit mode or pre-fill from transaction)
  useEffect(() => {
    if (shouldPreFill && template) {
      setName(template.name);
      setAmount(template.amount !== null ? template.amount.toString() : "");
      setHasFixedAmount(template.amount !== null);
      setCategoryId(template.category_id || "");
      setPaymentMethodId(template.payment_method_id || "");
      setDescription(template.description || "");
      setSelectedTagIds(template.template_tags.map((tt) => tt.tag.id));
      setIsFavorite(template.is_favorite);

      if (template.payment_method) {
        setSelectedCurrency(template.payment_method.currency);
      } else {
        setSelectedCurrency(baseCurrency);
      }
    } else {
      // Reset form for create mode without pre-fill
      setName("");
      setAmount("");
      setHasFixedAmount(true);
      setCategoryId("");
      setPaymentMethodId("");
      setDescription("");
      setSelectedTagIds([]);
      setIsFavorite(false);
      setSelectedCurrency(baseCurrency);
    }
  }, [shouldPreFill, template, baseCurrency, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = "Template name is required";
    } else if (name.length > 100) {
      newErrors.name = "Template name must be 100 characters or less";
    }

    // Amount validation (if fixed amount)
    if (hasFixedAmount) {
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

  const handlePaymentMethodChange = (pmId: string) => {
    setPaymentMethodId(pmId);
    if (pmId === "none") {
      setSelectedCurrency(baseCurrency);
    } else {
      const pm = paymentMethods.find((p) => p.id === pmId);
      if (pm) {
        setSelectedCurrency(pm.currency);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const templateData: any = {
      name: name.trim(),
      amount: hasFixedAmount ? Number.parseFloat(amount) : undefined,
      categoryId: categoryId || undefined,
      paymentMethodId:
        paymentMethodId === "none" || !paymentMethodId
          ? undefined
          : paymentMethodId,
      description: description.trim() || undefined,
      isFavorite,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : [],
    };

    const result = isEditMode
      ? await updateTemplate(template.id, templateData)
      : await createTemplate(templateData);

    setIsSubmitting(false);

    if (result.success) {
      showSuccess(
        isEditMode
          ? "Template updated successfully"
          : "Template created successfully",
      );
      onOpenChange(false);
      onSuccess?.();
    } else {
      showError(result.error || "Failed to save template");
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        scrollable
      >
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {isEditMode ? "Edit Template" : "Create Template"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {isEditMode
              ? "Update your transaction template details."
              : "Create a template for recurring transactions. Leave amount empty for variable-price templates."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="template-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="template-name"
              placeholder="e.g., Coffee Shop, Grocery Shopping"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className={cn(errors.name && "border-destructive")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Fixed Amount Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="fixed-amount"
              checked={hasFixedAmount}
              onCheckedChange={(checked) =>
                setHasFixedAmount(checked === true)
              }
            />
            <Label htmlFor="fixed-amount" className="font-normal cursor-pointer">
              Fixed amount (uncheck for variable pricing)
            </Label>
          </div>

          {/* Amount Input (conditional) */}
          {hasFixedAmount && (
            <div className="space-y-2">
              <Label htmlFor="template-amount">
                Amount in {selectedCurrency}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="template-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={`0.00 ${getCurrencySymbol(selectedCurrency)}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={cn("pr-12", errors.amount && "border-destructive")}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  {getCurrencySymbol(selectedCurrency)}
                </div>
              </div>
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount}</p>
              )}
            </div>
          )}

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <Label htmlFor="template-payment-method">
              Payment Method (optional)
            </Label>
            <Select
              value={paymentMethodId || "none"}
              onValueChange={handlePaymentMethodChange}
              disabled={isLoadingPaymentMethods}
            >
              <SelectTrigger id="template-payment-method">
                <SelectValue placeholder="Select a payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      None (Base Currency)
                    </span>
                  </div>
                </SelectItem>
                {paymentMethods.map((pm) => (
                  <SelectItem key={pm.id} value={pm.id}>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3.5 w-3.5" />
                      {pm.name} ({getCurrencySymbol(pm.currency)})
                      {pm.is_default && (
                        <span className="text-xs text-muted-foreground">
                          (default)
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="template-category">Category (optional)</Label>
            <Select
              value={categoryId || "none"}
              onValueChange={(value) =>
                setCategoryId(value === "none" ? "" : value)
              }
              disabled={isLoadingCategories}
            >
              <SelectTrigger id="template-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">None</span>
                </SelectItem>
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="template-description">Description (optional)</Label>
            <Textarea
              id="template-description"
              placeholder="Add notes about this template..."
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

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags (optional)</Label>
            <TagSelector
              value={selectedTagIds}
              onChange={setSelectedTagIds}
              placeholder="Add tags..."
            />
          </div>

          {/* Favorite Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-favorite"
              checked={isFavorite}
              onCheckedChange={(checked) => setIsFavorite(checked === true)}
            />
            <Label htmlFor="is-favorite" className="font-normal cursor-pointer">
              Add to favorites for quick access
            </Label>
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
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : isEditMode ? (
                "Update Template"
              ) : (
                "Create Template"
              )}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
