/**
 * CreateTransferDialog Component
 *
 * Dialog for creating a transfer between payment accounts with multi-currency support.
 */

"use client";

import {
  ArrowRightLeft,
  Calendar as CalendarIcon,
  CreditCard,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getPaymentMethods } from "@/app/actions/payment-methods";
import { createTransfer } from "@/app/actions/transfers";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/currency";
import { getExchangeRate } from "@/app/actions/exchange-rates";
import type { Tables } from "@/types/database.types";

type PaymentMethod = Tables<"payment_methods">;

interface CreateTransferDialogProps {
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export function CreateTransferDialog({
  onSuccess,
  children,
}: CreateTransferDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true);

  // Form state
  const [sourcePaymentMethodId, setSourcePaymentMethodId] = useState("");
  const [destinationPaymentMethodId, setDestinationPaymentMethodId] =
    useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [description, setDescription] = useState("");

  // Exchange rate preview state
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [destinationAmount, setDestinationAmount] = useState<number | null>(
    null,
  );

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { success: showSuccess, error: showError } = useToast();

  // Fetch payment methods
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingPaymentMethods(true);

      const paymentMethodsResult = await getPaymentMethods({
        isActive: true,
        limit: 50,
        offset: 0,
      });

      if (paymentMethodsResult.success) {
        setPaymentMethods(paymentMethodsResult.data || []);
      } else {
        showError(
          paymentMethodsResult.error || "Failed to load payment methods",
        );
      }

      setIsLoadingPaymentMethods(false);
    };

    if (open) {
      fetchData();
    }
  }, [open, showError]);

  // Get source and destination payment methods
  const sourcePaymentMethod = paymentMethods.find(
    (pm) => pm.id === sourcePaymentMethodId,
  );
  const destinationPaymentMethod = paymentMethods.find(
    (pm) => pm.id === destinationPaymentMethodId,
  );

  // Fetch exchange rate when currencies differ
  useEffect(() => {
    const fetchExchangeRate = async () => {
      // Reset rate preview
      setExchangeRate(null);
      setDestinationAmount(null);

      // Validate inputs
      if (
        !sourcePaymentMethod ||
        !destinationPaymentMethod ||
        !amount ||
        Number.isNaN(Number.parseFloat(amount))
      ) {
        return;
      }

      const amountNum = Number.parseFloat(amount);
      if (amountNum <= 0) {
        return;
      }

      // Same currency - no conversion needed
      if (sourcePaymentMethod.currency === destinationPaymentMethod.currency) {
        setExchangeRate(1.0);
        setDestinationAmount(amountNum);
        return;
      }

      // Different currencies - fetch exchange rate
      setIsLoadingRate(true);

      try {
        const result = await getExchangeRate({
          from: sourcePaymentMethod.currency,
          to: destinationPaymentMethod.currency,
          date: date.toISOString().split("T")[0],
        });

        if (result.success && result.data) {
          setExchangeRate(result.data);
          setDestinationAmount(Math.round(amountNum * result.data * 100) / 100);
        } else {
          setExchangeRate(null);
          setDestinationAmount(null);
          if (result.error) {
            console.error("Exchange rate error:", result.error);
          }
        }
      } catch (err) {
        console.error("Exchange rate fetch error:", err);
        setExchangeRate(null);
        setDestinationAmount(null);
      }

      setIsLoadingRate(false);
    };

    fetchExchangeRate();
  }, [sourcePaymentMethod, destinationPaymentMethod, amount, date]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Amount validation
    const amountNum = Number.parseFloat(amount);
    if (!amount || Number.isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = "Amount must be a positive number";
    }

    // Source payment method validation
    if (!sourcePaymentMethodId) {
      newErrors.sourcePaymentMethodId = "Source payment method is required";
    }

    // Destination payment method validation
    if (!destinationPaymentMethodId) {
      newErrors.destinationPaymentMethodId =
        "Destination payment method is required";
    }

    // Source ≠ destination validation
    if (
      sourcePaymentMethodId &&
      destinationPaymentMethodId &&
      sourcePaymentMethodId === destinationPaymentMethodId
    ) {
      newErrors.destinationPaymentMethodId =
        "Source and destination must be different";
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

    const result = await createTransfer({
      sourcePaymentMethodId,
      destinationPaymentMethodId,
      amount: Number.parseFloat(amount),
      date: date.toISOString().split("T")[0],
      description: description.trim() || undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      showSuccess("Transfer created successfully");
      handleClose();
      onSuccess?.();
    } else {
      showError(result.error || "Failed to create transfer");
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset form after dialog closes
    setTimeout(() => {
      setSourcePaymentMethodId("");
      setDestinationPaymentMethodId("");
      setAmount("");
      setDate(new Date());
      setDescription("");
      setExchangeRate(null);
      setDestinationAmount(null);
      setErrors({});
    }, 200);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const showExchangePreview =
    sourcePaymentMethod &&
    destinationPaymentMethod &&
    sourcePaymentMethod.currency !== destinationPaymentMethod.currency;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="lg" variant="outline">
            <ArrowRightLeft className="h-5 w-5 mr-2" />
            New Transfer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Transfer</DialogTitle>
          <DialogDescription>
            Transfer money between your payment accounts
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="create-source-payment-method">
              From (Source) <span className="text-destructive">*</span>
            </Label>
            <Select
              value={sourcePaymentMethodId}
              onValueChange={setSourcePaymentMethodId}
              disabled={isLoadingPaymentMethods}
            >
              <SelectTrigger
                id="create-source-payment-method"
                className={cn(
                  errors.sourcePaymentMethodId && "border-destructive",
                )}
              >
                <SelectValue placeholder="Select source account" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((pm) => (
                  <SelectItem
                    key={pm.id}
                    value={pm.id}
                    disabled={pm.id === destinationPaymentMethodId}
                  >
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
            {errors.sourcePaymentMethodId && (
              <p className="text-sm text-destructive">
                {errors.sourcePaymentMethodId}
              </p>
            )}
          </div>

          {/* Destination Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="create-destination-payment-method">
              To (Destination) <span className="text-destructive">*</span>
            </Label>
            <Select
              value={destinationPaymentMethodId}
              onValueChange={setDestinationPaymentMethodId}
              disabled={isLoadingPaymentMethods}
            >
              <SelectTrigger
                id="create-destination-payment-method"
                className={cn(
                  errors.destinationPaymentMethodId && "border-destructive",
                )}
              >
                <SelectValue placeholder="Select destination account" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((pm) => (
                  <SelectItem
                    key={pm.id}
                    value={pm.id}
                    disabled={pm.id === sourcePaymentMethodId}
                  >
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
            {errors.destinationPaymentMethodId && (
              <p className="text-sm text-destructive">
                {errors.destinationPaymentMethodId}
              </p>
            )}
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="create-amount">
              Amount
              {sourcePaymentMethod && ` in ${sourcePaymentMethod.currency}`}
              <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="create-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder={`0.00 ${sourcePaymentMethod ? getCurrencySymbol(sourcePaymentMethod.currency) : ""}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={cn("pr-12", errors.amount && "border-destructive")}
              />
              {sourcePaymentMethod && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  {getCurrencySymbol(sourcePaymentMethod.currency)}
                </div>
              )}
            </div>
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount}</p>
            )}
          </div>

          {/* Exchange Rate Preview */}
          {showExchangePreview && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ArrowRightLeft className="h-4 w-4" />
                Currency Conversion
              </div>
              {isLoadingRate ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Fetching exchange rate...
                </div>
              ) : exchangeRate !== null && destinationAmount !== null ? (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Exchange Rate:
                    </span>
                    <span className="font-medium">
                      1 {sourcePaymentMethod?.currency} ={" "}
                      {exchangeRate.toFixed(6)}{" "}
                      {destinationPaymentMethod?.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Destination Amount:
                    </span>
                    <span className="font-medium">
                      {destinationPaymentMethod &&
                        formatCurrency(
                          destinationAmount,
                          destinationPaymentMethod.currency,
                        )}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-destructive">
                  Exchange rate not available. Please try again later.
                </p>
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="create-description">Description (optional)</Label>
            <Textarea
              id="create-description"
              placeholder="Add a note about this transfer..."
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
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
                "Create Transfer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
