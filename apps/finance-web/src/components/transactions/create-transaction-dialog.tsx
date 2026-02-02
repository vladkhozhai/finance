/**
 * CreateTransactionDialog Component
 *
 * Dialog wrapper for the redesigned TransactionForm component.
 * Handles data fetching and dialog state management.
 */

"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { getCategories } from "@/app/actions/categories";
import { getPaymentMethods } from "@/app/actions/payment-methods";
import { getTags } from "@/app/actions/tags";
import {
  getTemplates,
  type TemplateWithRelations,
} from "@/app/actions/templates";
import { TransactionForm } from "@/components/features/transactions/transaction-form";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import { toast } from "sonner";
import type { Tables } from "@/types/database.types";

type Category = Tables<"categories">;
type Tag = Tables<"tags">;
type PaymentMethod = Tables<"payment_methods">;

interface CreateTransactionDialogProps {
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export function CreateTransactionDialog({
  onSuccess,
  children,
}: CreateTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [templates, setTemplates] = useState<TemplateWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [defaultCurrency] = useState<string>("USD"); // TODO: Get from user profile

  // Fetch all required data when dialog opens
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const [categoriesResult, tagsResult, paymentMethodsResult, templatesResult] =
        await Promise.all([
          getCategories(),
          getTags(),
          getPaymentMethods({ isActive: true, limit: 50, offset: 0 }),
          getTemplates(),
        ]);

      if (categoriesResult.success) {
        setCategories(categoriesResult.data || []);
      } else {
        toast.error(categoriesResult.error || "Failed to load categories");
      }

      if (tagsResult.success) {
        setTags(tagsResult.data || []);
      } else {
        toast.error(tagsResult.error || "Failed to load tags");
      }

      if (paymentMethodsResult.success) {
        setPaymentMethods(paymentMethodsResult.data || []);
      } else {
        toast.error(paymentMethodsResult.error || "Failed to load payment methods");
      }

      if (templatesResult.success) {
        setTemplates(templatesResult.data || []);
      } else {
        // Silently fail for templates - non-critical
        setTemplates([]);
      }

      setIsLoading(false);
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger asChild>
        {children || (
          <Button size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Add Transaction
          </Button>
        )}
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent
        className="max-w-lg h-[90vh] max-h-[90vh] p-0 flex flex-col overflow-hidden"
        showCloseButton={false}
      >
        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <TransactionForm
            categories={categories}
            tags={tags}
            paymentMethods={paymentMethods}
            templates={templates}
            defaultCurrency={defaultCurrency}
            onSuccess={handleSuccess}
          />
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
