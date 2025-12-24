/**
 * EditPaymentMethodDialog Component
 *
 * Modal dialog for editing an existing payment method.
 * Note: Currency field is READ-ONLY after creation for data integrity.
 */

"use client";

import { useEffect, useState, useTransition } from "react";
import { updatePaymentMethod } from "@/app/actions/payment-methods";
import { ColorPicker } from "@/components/categories/color-picker";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/lib/hooks/use-toast";
import { getCurrencyName, getCurrencySymbol } from "@/lib/utils/currency";
import type { Tables } from "@/types/database.types";

type PaymentMethod = Tables<"payment_methods">;

const CARD_TYPES = [
  { value: "debit", label: "Debit Card" },
  { value: "credit", label: "Credit Card" },
  { value: "cash", label: "Cash" },
  { value: "savings", label: "Savings Account" },
  { value: "other", label: "Other" },
];

interface EditPaymentMethodDialogProps {
  paymentMethod: PaymentMethod | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPaymentMethodDialog({
  paymentMethod,
  open,
  onOpenChange,
}: EditPaymentMethodDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState("");
  const [cardType, setCardType] = useState<string | undefined>(undefined);
  const [color, setColor] = useState("#3B82F6");
  const [isDefault, setIsDefault] = useState(false);

  // Validation errors
  const [nameError, setNameError] = useState("");
  const [colorError, setColorError] = useState("");

  // Populate form when payment method changes
  useEffect(() => {
    if (paymentMethod) {
      setName(paymentMethod.name);
      setCardType(paymentMethod.card_type || undefined);
      setColor(paymentMethod.color || "#3B82F6");
      setIsDefault(paymentMethod.is_default);
      setNameError("");
      setColorError("");
    }
  }, [paymentMethod]);

  const validateForm = () => {
    let isValid = true;

    // Validate name
    if (!name.trim()) {
      setNameError("Payment method name is required");
      isValid = false;
    } else if (name.trim().length > 100) {
      setNameError("Name must be 100 characters or less");
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

    if (!paymentMethod || !validateForm()) {
      return;
    }

    startTransition(async () => {
      const result = await updatePaymentMethod({
        id: paymentMethod.id,
        name: name.trim(),
        cardType: (cardType || undefined) as
          | "debit"
          | "credit"
          | "cash"
          | "savings"
          | "other"
          | null,
        color: color.toUpperCase(),
        isDefault,
      });

      if (result.success) {
        toast.success("Payment method updated successfully");
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to update payment method");
      }
    });
  };

  if (!paymentMethod) {
    return null;
  }

  const currencySymbol = getCurrencySymbol(paymentMethod.currency);
  const currencyName = getCurrencyName(paymentMethod.currency);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Payment Method</DialogTitle>
            <DialogDescription>
              Update the details of your payment method.
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
                placeholder="e.g., Main Bank Card"
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

            {/* Currency field (READ-ONLY) */}
            <div className="space-y-2">
              <Label htmlFor="edit-currency">Currency</Label>
              <Input
                id="edit-currency"
                value={`${currencySymbol} ${paymentMethod.currency} - ${currencyName}`}
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <div className="mt-0.5">
                  <svg
                    className="h-4 w-4 text-blue-600 dark:text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    role="img"
                    aria-label="Information icon"
                  >
                    <title>Information</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Currency cannot be changed after creation. To use a different
                  currency, create a new payment method.
                </p>
              </div>
            </div>

            {/* Card type selector */}
            <div className="space-y-2">
              <Label htmlFor="edit-card-type">Card Type (Optional)</Label>
              <Select
                value={cardType}
                onValueChange={setCardType}
                disabled={isPending}
              >
                <SelectTrigger id="edit-card-type">
                  <SelectValue placeholder="Select type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {CARD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            {/* Default checkbox */}
            <div className="flex items-center space-x-2">
              <input
                id="edit-is-default"
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                disabled={isPending}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label
                htmlFor="edit-is-default"
                className="text-sm font-normal cursor-pointer"
              >
                Set as my default payment method
              </Label>
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
              {isPending ? "Updating..." : "Update Payment Method"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
