/**
 * Transaction Form Component - Mobile-First UX Redesign
 *
 * Minimalist form for creating transactions with 3-tap workflow:
 * 1. Enter amount (auto-focused, huge input)
 * 2. Select category (quick grid)
 * 3. Save (sticky button)
 *
 * Progressive disclosure: Advanced options (tags, date, description) in collapsible section.
 * Template support: Quick-fill from favorite templates.
 *
 * @client component - uses react-hook-form and Server Actions
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, ChevronUp, CreditCard, Plus, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createTransaction } from "@/app/actions/transactions";
import { type TemplateWithRelations } from "@/app/actions/templates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  createTransactionSchema,
  type CreateTransactionInput,
  type TransactionType,
} from "@/lib/validations/transaction";
import type { Tables } from "@/types/database.types";

type Category = Tables<"categories">;
type Tag = Tables<"tags">;
type PaymentMethod = Tables<"payment_methods">;

interface TransactionFormProps {
  categories: Category[];
  tags: Tag[];
  paymentMethods: PaymentMethod[];
  templates?: TemplateWithRelations[];
  defaultCurrency: string;
  onSuccess?: () => void;
}

export function TransactionForm({
  categories,
  tags,
  paymentMethods,
  templates = [],
  defaultCurrency,
  onSuccess,
}: TransactionFormProps) {
  const [isPending, startTransition] = useTransition();
  const [transactionType, setTransactionType] =
    useState<TransactionType>("expense");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
    string | undefined
  >(undefined);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [amountDisplay, setAmountDisplay] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      type: "expense",
      date: new Date().toISOString().split("T")[0],
      tagIds: [],
    },
  });

  // Get default payment method on mount
  useEffect(() => {
    const defaultPM = paymentMethods.find((pm) => pm.is_default);
    if (defaultPM) {
      setSelectedPaymentMethodId(defaultPM.id);
      setValue("paymentMethodId", defaultPM.id);
    }
  }, [paymentMethods, setValue]);

  // Filter categories by transaction type
  const filteredCategories = categories.filter((c) => c.type === transactionType);

  // Get top 8 categories for quick access (rest behind "More" button)
  const topCategories = filteredCategories.slice(0, 8);
  const hasMoreCategories = filteredCategories.length > 8;

  // Get templates for quick access (favorites first, then recent non-favorites)
  const favoriteTemplates = templates.filter((t) => t.is_favorite).slice(0, 5);
  const displayTemplates = favoriteTemplates.length > 0
    ? favoriteTemplates
    : templates.slice(0, 5); // Fallback to first 5 templates if no favorites

  // Format amount with thousands separator
  const formatAmount = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (!numericValue) return "";
    const number = parseFloat(numericValue) / 100; // Divide by 100 for decimal places
    return number.toLocaleString("uk-UA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const numericValue = input.replace(/\D/g, "");
    if (!numericValue) {
      setAmountDisplay("");
      setValue("amount", 0);
      return;
    }
    const amount = parseFloat(numericValue) / 100;
    setAmountDisplay(formatAmount(numericValue));
    setValue("amount", amount);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setValue("categoryId", categoryId);
  };

  const handleTagToggle = (tagId: string) => {
    const newTags = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];
    setSelectedTagIds(newTags);
    setValue("tagIds", newTags);
  };

  const handleTemplateSelect = (template: TemplateWithRelations) => {
    // Pre-fill form from template
    if (template.amount) {
      const formattedAmount = (template.amount * 100).toString();
      setAmountDisplay(formatAmount(formattedAmount));
      setValue("amount", template.amount);
    }
    if (template.category_id) {
      setSelectedCategoryId(template.category_id);
      setValue("categoryId", template.category_id);
    }
    if (template.payment_method_id) {
      setSelectedPaymentMethodId(template.payment_method_id);
      setValue("paymentMethodId", template.payment_method_id);
    }
    if (template.description) {
      setValue("description", template.description);
    }
    // Set tags from template
    const templateTagIds = template.template_tags.map((tt) => tt.tag.id);
    setSelectedTagIds(templateTagIds);
    setValue("tagIds", templateTagIds);
  };

  const handlePaymentMethodChange = (pmId: string) => {
    setSelectedPaymentMethodId(pmId);
    setValue("paymentMethodId", pmId);
  };

  const onSubmit = (data: CreateTransactionInput) => {
    startTransition(async () => {
      const result = await createTransaction(data);

      if (result.success) {
        toast.success("Transaction created successfully");
        // Reset form
        reset({
          type: transactionType,
          date: new Date().toISOString().split("T")[0],
          tagIds: [],
        });
        setAmountDisplay("");
        setSelectedCategoryId("");
        setSelectedTagIds([]);
        setShowMoreOptions(false);
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    });
  };

  const selectedPaymentMethod = paymentMethods.find(
    (pm) => pm.id === selectedPaymentMethodId,
  );
  const displayCurrency =
    selectedPaymentMethod?.currency || defaultCurrency;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Fixed Header: Transaction Type Tabs */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        <Tabs
          value={transactionType}
          onValueChange={(value) => {
            setTransactionType(value as TransactionType);
            setValue("type", value as TransactionType);
            setSelectedCategoryId(""); // Reset category when type changes
          }}
        >
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="expense">Expense</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Fixed Header: Templates Row (if any templates exist) */}
      {displayTemplates.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {displayTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleTemplateSelect(template)}
                className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-full border border-border bg-background hover:bg-accent transition-colors"
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scrollable Content Area - CRITICAL: min-h-0 allows flexbox shrinking */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4">
        {/* Hero Section: Amount Input */}
        <div className="py-6 text-center">
          <div className="relative">
            <Input
              type="text"
              inputMode="decimal"
              placeholder={`0.00 ${displayCurrency}`}
              value={amountDisplay}
              onChange={handleAmountChange}
              autoFocus
              className="text-4xl md:text-5xl font-bold text-center border-none shadow-none focus-visible:ring-0 h-auto py-2 placeholder:text-muted-foreground/40"
            />
            {errors.amount && (
              <p className="text-sm text-destructive mt-1">
                {errors.amount.message}
              </p>
            )}
          </div>

          {/* Payment Method Badge (clickable to change) */}
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => {
                // TODO: Open payment method selector dialog
                const nextPM =
                  paymentMethods[
                    (paymentMethods.findIndex(
                      (pm) => pm.id === selectedPaymentMethodId,
                    ) +
                      1) %
                      paymentMethods.length
                  ];
                handlePaymentMethodChange(nextPM.id);
              }}
              className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border border-border bg-background hover:bg-accent transition-colors"
              style={
                selectedPaymentMethod?.color
                  ? { borderColor: selectedPaymentMethod.color }
                  : undefined
              }
            >
              <CreditCard className="h-3 w-3" />
              <span className="font-medium">
                {selectedPaymentMethod?.name || "Select wallet"}
              </span>
            </button>
          </div>
        </div>

        {/* Category Grid Section */}
        <div className="py-3">
          <Label className="text-xs text-muted-foreground mb-2 block">
            Category
          </Label>
          <div className="grid grid-cols-4 gap-2">
            {(showAllCategories ? filteredCategories : topCategories).map(
              (category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategorySelect(category.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                    selectedCategoryId === category.id
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full mb-1.5 flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[10px] font-medium text-center line-clamp-1">
                    {category.name}
                  </span>
                </button>
              ),
            )}
            {hasMoreCategories && !showAllCategories && (
              <button
                type="button"
                onClick={() => setShowAllCategories(true)}
                className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-dashed border-border hover:bg-accent transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-muted mb-1.5 flex items-center justify-center">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">
                  More
                </span>
              </button>
            )}
          </div>
          {errors.categoryId && (
            <p className="text-sm text-destructive mt-2">
              {errors.categoryId.message}
            </p>
          )}
        </div>

        {/* Tags Section */}
        {tags.length > 0 && (
          <div className="py-3">
            <Label className="text-xs text-muted-foreground mb-2 block">
              Tags (optional)
            </Label>
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 8).map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleTagToggle(tag.id)}
                >
                  {tag.name}
                  {selectedTagIds.includes(tag.id) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
              {tags.length > 8 && (
                <Badge variant="outline" className="cursor-pointer">
                  <Plus className="h-3 w-3 mr-1" />
                  More
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Collapsible "More Options" Section */}
        <div className="py-2">
          <button
            type="button"
            onClick={() => setShowMoreOptions(!showMoreOptions)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            {showMoreOptions ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span>More Options (Date, Note)</span>
          </button>

          {showMoreOptions && (
            <div className="mt-4 space-y-4 pb-4">
              {/* Date Input */}
              <div>
                <Label htmlFor="date" className="text-sm">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  {...register("date")}
                  className="mt-1"
                />
                {errors.date && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.date.message}
                  </p>
                )}
              </div>

              {/* Description Textarea */}
              <div>
                <Label htmlFor="description" className="text-sm">
                  Note (optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Add a note..."
                  {...register("description")}
                  className="mt-1 resize-none"
                  rows={3}
                />
                {errors.description && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* End Scrollable Content */}

      {/* Sticky Bottom Save Button */}
      <div className="flex-shrink-0 p-4 bg-background border-t border-border pb-[env(safe-area-inset-bottom,1rem)]">
        <Button
          type="submit"
          disabled={isPending || !selectedCategoryId || !amountDisplay}
          className="w-full h-12 text-base font-semibold"
        >
          {isPending ? "Saving..." : "Save Transaction"}
        </Button>
      </div>
    </form>
  );
}