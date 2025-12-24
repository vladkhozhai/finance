/**
 * SaveAsTemplateDialog Component
 *
 * Dialog for saving an existing transaction as a template.
 * Pre-fills the template form with transaction data.
 */

"use client";

import { useState } from "react";
import type { TransactionWithRelations } from "@/app/actions/transactions";
import { TemplateFormDialog } from "@/components/templates/template-form-dialog";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { FileText } from "lucide-react";

interface SaveAsTemplateDialogProps {
  transaction: TransactionWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Creates a template object from transaction data for pre-filling the form.
 * This adapts the transaction structure to match the TemplateWithRelations type.
 */
function createTemplateFromTransaction(
  transaction: TransactionWithRelations,
): any {
  return {
    id: "", // Empty ID since we're creating a new template
    user_id: "",
    name: transaction.description || "Unnamed Template",
    amount: transaction.type !== "transfer" ? transaction.amount : null,
    category_id: transaction.category_id,
    payment_method_id: transaction.payment_method_id,
    description: transaction.description || "",
    is_favorite: false,
    created_at: "",
    updated_at: "",
    category: transaction.category,
    payment_method: transaction.payment_method || null,
    template_tags: transaction.transaction_tags.map(({ tag }) => ({
      tag,
    })),
  };
}

export function SaveAsTemplateDialog({
  transaction,
  open,
  onOpenChange,
  onSuccess,
}: SaveAsTemplateDialogProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isTemplateFormOpen, setIsTemplateFormOpen] = useState(false);

  // Skip transfers - they cannot be saved as templates
  if (transaction.type === "transfer") {
    return null;
  }

  const templateData = createTemplateFromTransaction(transaction);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setShowConfirmation(false);
      setIsTemplateFormOpen(false);
    }
    onOpenChange(newOpen);
  };

  const handleProceed = () => {
    setShowConfirmation(false);
    setIsTemplateFormOpen(true);
  };

  const handleTemplateFormSuccess = () => {
    setIsTemplateFormOpen(false);
    onOpenChange(false);
    onSuccess?.();
  };

  // Show confirmation dialog first
  if (open && !isTemplateFormOpen) {
    return (
      <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Save as Template
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Create a reusable template from this transaction. You can use it
              to quickly create similar transactions in the future.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-medium">
                The following data will be copied:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                {transaction.amount && (
                  <li>Amount: {Math.abs(transaction.amount).toFixed(2)}</li>
                )}
                {transaction.category && (
                  <li>Category: {transaction.category.name}</li>
                )}
                {transaction.payment_method && (
                  <li>Payment Method: {transaction.payment_method.name}</li>
                )}
                {transaction.transaction_tags.length > 0 && (
                  <li>
                    Tags:{" "}
                    {transaction.transaction_tags
                      .map(({ tag }) => tag.name)
                      .join(", ")}
                  </li>
                )}
                {transaction.description && (
                  <li>Description: {transaction.description}</li>
                )}
              </ul>
            </div>

            <p className="text-sm text-muted-foreground">
              You can modify any of these fields in the next step.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleProceed}>Continue</Button>
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    );
  }

  // Show template form dialog
  return (
    <TemplateFormDialog
      open={isTemplateFormOpen}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          handleOpenChange(false);
        }
      }}
      template={templateData}
      onSuccess={handleTemplateFormSuccess}
    />
  );
}
