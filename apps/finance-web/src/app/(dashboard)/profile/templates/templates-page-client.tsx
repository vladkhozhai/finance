/**
 * TemplatesPageClient Component
 *
 * Client component for templates page that handles state and actions.
 */

"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import type { TemplateWithRelations } from "@/app/actions/templates";
import { TemplateFormDialog } from "@/components/templates/template-form-dialog";
import { TemplateList } from "@/components/templates/template-list";
import { Button } from "@/components/ui/button";

interface TemplatesPageClientProps {
  initialTemplates: TemplateWithRelations[];
}

export function TemplatesPageClient({
  initialTemplates,
}: TemplatesPageClientProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground mt-2">
            Create templates for recurring transactions to save time. Templates
            can have fixed or variable amounts.
          </p>
        </div>

        {/* Create button - only show if templates exist */}
        {initialTemplates.length > 0 && (
          <Button size="lg" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-5 w-5 mr-2" />
            Create Template
          </Button>
        )}
      </div>

      {/* Template list */}
      <TemplateList templates={initialTemplates} currency="USD" />

      {/* Create template dialog */}
      <TemplateFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          setShowCreateDialog(false);
          // Revalidation happens automatically via server action
        }}
      />
    </div>
  );
}
