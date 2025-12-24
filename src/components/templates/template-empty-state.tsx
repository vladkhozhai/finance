/**
 * TemplateEmptyState Component
 *
 * Empty state shown when user has no transaction templates.
 * Provides guidance and a call-to-action to create the first template.
 */

"use client";

import { FileText, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TemplateFormDialog } from "./template-form-dialog";

interface TemplateEmptyStateProps {
  onTemplateCreated?: () => void;
}

export function TemplateEmptyState({
  onTemplateCreated,
}: TemplateEmptyStateProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>

          <h3 className="text-lg font-semibold mb-2">No Templates Yet</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Create templates for recurring transactions to save time. Templates
            can have fixed or variable amounts, and include categories, payment
            methods, and tags.
          </p>

          <Button onClick={() => setShowCreateDialog(true)} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Create Your First Template
          </Button>

          {/* Examples */}
          <div className="mt-8 max-w-md text-left">
            <p className="text-sm font-medium mb-3">Example use cases:</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  <strong>Coffee Shop:</strong> Fixed amount template for your
                  daily coffee
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  <strong>Grocery Shopping:</strong> Variable amount template for
                  weekly groceries
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  <strong>Monthly Rent:</strong> Fixed amount template with
                  recurring payment details
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Create template dialog */}
      <TemplateFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          setShowCreateDialog(false);
          onTemplateCreated?.();
        }}
      />
    </>
  );
}
