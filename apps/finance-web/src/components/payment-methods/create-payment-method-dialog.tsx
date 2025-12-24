/**
 * CreatePaymentMethodDialog Component
 *
 * Modal dialog for creating a new payment method.
 * Includes currency selection, card type, color picker, and default option.
 */

"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { createPaymentMethod } from "@/app/actions/payment-methods";
import { ColorPicker } from "@/components/categories/color-picker";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/lib/hooks/use-toast";
import { getAllCurrencies } from "@/lib/utils/currency";
import { CURRENCY_CODES } from "@/lib/validations/payment-method";

const CARD_TYPES = [
  { value: "debit", label: "Debit Card" },
  { value: "credit", label: "Credit Card" },
  { value: "cash", label: "Cash" },
  { value: "savings", label: "Savings Account" },
  { value: "other", label: "Other" },
];

export function CreatePaymentMethodDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<string>("");
  const [cardType, setCardType] = useState<string | undefined>(undefined);
  const [color, setColor] = useState("#3B82F6"); // Default blue
  const [isDefault, setIsDefault] = useState(false);

  // Validation errors
  const [nameError, setNameError] = useState("");
  const [currencyError, setCurrencyError] = useState("");
  const [colorError, setColorError] = useState("");

  const currencies = getAllCurrencies();

  const resetForm = () => {
    setName("");
    setCurrency("");
    setCardType(undefined);
    setColor("#3B82F6");
    setIsDefault(false);
    setNameError("");
    setCurrencyError("");
    setColorError("");
  };

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

    // Validate currency
    if (!currency) {
      setCurrencyError("Currency is required");
      isValid = false;
    } else if (
      !CURRENCY_CODES.includes(currency as (typeof CURRENCY_CODES)[number])
    ) {
      setCurrencyError("Invalid currency code");
      isValid = false;
    } else {
      setCurrencyError("");
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
      const result = await createPaymentMethod({
        name: name.trim(),
        currency: currency as (typeof CURRENCY_CODES)[number],
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
        toast.success("Payment method created successfully");
        setOpen(false);
        resetForm();
      } else {
        toast.error(result.error || "Failed to create payment method");
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
          Add Payment Method
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Create a new payment method to track your multi-currency
              transactions.
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
                placeholder="e.g., Main Bank Card, Cash Wallet"
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

            {/* Currency selector */}
            <div className="space-y-2">
              <Label htmlFor="currency">
                Currency <span className="text-destructive">*</span>
              </Label>
              <Select
                value={currency}
                onValueChange={(value) => {
                  setCurrency(value);
                  setCurrencyError("");
                }}
                disabled={isPending}
              >
                <SelectTrigger
                  id="currency"
                  className={currencyError ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.code} - {curr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currencyError && (
                <p className="text-sm text-destructive">{currencyError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Currency cannot be changed after creation
              </p>
            </div>

            {/* Card type selector (optional) */}
            <div className="space-y-2">
              <Label htmlFor="card-type">Card Type (Optional)</Label>
              <Select
                value={cardType}
                onValueChange={setCardType}
                disabled={isPending}
              >
                <SelectTrigger id="card-type">
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
                id="is-default"
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                disabled={isPending}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label
                htmlFor="is-default"
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
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Payment Method"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
