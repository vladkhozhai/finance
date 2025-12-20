/**
 * EditTransactionDialog Component
 *
 * Dialog for editing an existing transaction with pre-filled form data.
 */

"use client";

import { Calendar as CalendarIcon, CreditCard, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  updateTransaction,
  type TransactionWithRelations,
} from "@/app/actions/transactions";
import { getCategories } from "@/app/actions/categories";
import { getPaymentMethods } from "@/app/actions/payment-methods";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Textarea } from "@/components/ui/textarea";
import { TagSelector } from "@/components/tags";
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/lib/utils/currency";
import type { Tables } from "@/types/database.types";

type Category = Tables<"categories">;
type PaymentMethod = Tables<"payment_methods">;

interface EditTransactionDialogProps {
  transaction: TransactionWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditTransactionDialog({
  transaction,
  open,
  onOpenChange,
  onSuccess,
}: EditTransactionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true);

  // Form state
  const [type, setType] = useState<string>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [description, setDescription] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
  const [baseCurrency] = useState<string>("USD"); // TODO: Get from user profile

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { success: showSuccess, error: showError } = useToast();

  // Load transaction data when dialog opens
  useEffect(() => {
    if (transaction && open) {
      setType(transaction.type);
      // For multi-currency transactions, show native amount
      const displayAmount = transaction.native_amount ?? transaction.amount;
      setAmount(displayAmount.toString());
      setCategoryId(transaction.category.id);
      setDate(new Date(transaction.date));
      setDescription(transaction.description || "");
      setSelectedTagIds(transaction.transaction_tags.map((tt) => tt.tag.id));
      setPaymentMethodId(transaction.payment_method_id || "");

      // Set currency based on payment method
      if (transaction.payment_method_id && transaction.payment_method) {
        setSelectedCurrency(transaction.payment_method.currency);
      } else {
        setSelectedCurrency(baseCurrency);
      }

      setErrors({});
    }
  }, [transaction, open, baseCurrency]);

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

  // Filter categories by type
  const filteredCategories = categories.filter(
    (category) => category.type === type,
  );

  // Reset category when type changes if it doesn't match
  useEffect(() => {
    if (categoryId && !filteredCategories.find((c) => c.id === categoryId)) {
      setCategoryId("");
    }
  }, [type, categoryId, filteredCategories]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Amount validation
    const amountNum = Number.parseFloat(amount);
    if (!amount || Number.isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = "Amount must be a positive number";
    }

    // Category validation
    if (!categoryId) {
      newErrors.categoryId = "Category is required";
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

    if (!transaction || !validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const result = await updateTransaction({
      id: transaction.id,
      amount: Number.parseFloat(amount),
      type: type as "income" | "expense",
      categoryId,
      date: date.toISOString().split("T")[0],
      description: description.trim() || null,
      tagIds: selectedTagIds,
      paymentMethodId:
        paymentMethodId === "none" || !paymentMethodId
          ? undefined
          : paymentMethodId,
    });

    setIsSubmitting(false);

    if (result.success) {
      showSuccess("Transaction updated successfully");
      onOpenChange(false);
      onSuccess?.();
    } else {
      showError(result.error || "Failed to update transaction");
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>
            Update the details of your transaction.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selection */}
          <div className="space-y-2">
            <Label>Type</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as any)}>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="edit-type-income" />
                  <Label
                    htmlFor="edit-type-income"
                    className="font-normal cursor-pointer"
                  >
                    Income
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expense" id="edit-type-expense" />
                  <Label
                    htmlFor="edit-type-expense"
                    className="font-normal cursor-pointer"
                  >
                    Expense
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <Label htmlFor="edit-payment-method">
              Payment Method (optional)
            </Label>
            <Select
              value={paymentMethodId || "none"}
              onValueChange={handlePaymentMethodChange}
              disabled={isLoadingPaymentMethods}
            >
              <SelectTrigger id="edit-payment-method">
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

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="edit-amount">
              Amount in {selectedCurrency}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="edit-amount"
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
            {selectedCurrency !== baseCurrency &&
              amount &&
              !Number.isNaN(Number.parseFloat(amount)) && (
                <p className="text-xs text-muted-foreground">
                  Amount will be converted to {baseCurrency} automatically based
                  on current exchange rate
                </p>
              )}
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="edit-category">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              disabled={isLoadingCategories}
            >
              <SelectTrigger
                id="edit-category"
                className={cn(errors.categoryId && "border-destructive")}
              >
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((category) => (
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
            {errors.categoryId && (
              <p className="text-sm text-destructive">{errors.categoryId}</p>
            )}
          </div>

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
            <Label htmlFor="edit-description">Description (optional)</Label>
            <Textarea
              id="edit-description"
              placeholder="Add a note about this transaction..."
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

          <DialogFooter>
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
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
