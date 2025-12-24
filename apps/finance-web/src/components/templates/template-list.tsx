/**
 * TemplateList Component
 *
 * Displays a grid of transaction templates with empty state handling.
 * Responsive grid layout: 3-4 columns on desktop, 1 column on mobile.
 */

"use client";

import { useState, useTransition } from "react";
import {
  deleteTemplate,
  toggleFavorite,
  type TemplateWithRelations,
} from "@/app/actions/templates";
import { useToast } from "@/lib/hooks/use-toast";
import { DeleteTemplateDialog } from "./delete-template-dialog";
import { TemplateCard } from "./template-card";
import { TemplateEmptyState } from "./template-empty-state";
import { TemplateFormDialog } from "./template-form-dialog";
import { UseTemplateDialog } from "./use-template-dialog";

interface TemplateListProps {
  templates: TemplateWithRelations[];
  currency?: string;
  onTemplateCreated?: () => void;
}

export function TemplateList({
  templates,
  currency = "USD",
  onTemplateCreated,
}: TemplateListProps) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateWithRelations | null>(null);
  const [dialogMode, setDialogMode] = useState<
    "edit" | "delete" | "use" | null
  >(null);
  const [isPending, startTransition] = useTransition();
  const { success: showSuccess, error: showError } = useToast();

  // Handle template actions
  const handleUseTemplate = (template: TemplateWithRelations) => {
    setSelectedTemplate(template);
    setDialogMode("use");
  };

  const handleEditTemplate = (template: TemplateWithRelations) => {
    setSelectedTemplate(template);
    setDialogMode("edit");
  };

  const handleDeleteTemplate = (template: TemplateWithRelations) => {
    setSelectedTemplate(template);
    setDialogMode("delete");
  };

  const handleToggleFavorite = (template: TemplateWithRelations) => {
    startTransition(async () => {
      const result = await toggleFavorite({ id: template.id });

      if (result.success) {
        showSuccess(
          result.data.isFavorite
            ? "Added to favorites"
            : "Removed from favorites",
        );
      } else {
        showError(result.error || "Failed to update favorite status");
      }
    });
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTemplate) return;

    const result = await deleteTemplate({ id: selectedTemplate.id });

    if (result.success) {
      showSuccess("Template deleted successfully");
      setDialogMode(null);
      setSelectedTemplate(null);
    } else {
      showError(result.error || "Failed to delete template");
    }
  };

  const handleDialogClose = () => {
    setDialogMode(null);
    setSelectedTemplate(null);
  };

  // Show empty state if no templates
  if (templates.length === 0) {
    return <TemplateEmptyState />;
  }

  return (
    <>
      {/* Template grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            currency={currency}
            onUse={handleUseTemplate}
            onEdit={handleEditTemplate}
            onDelete={handleDeleteTemplate}
            onToggleFavorite={handleToggleFavorite}
          />
        ))}
      </div>

      {/* Edit template dialog */}
      {dialogMode === "edit" && selectedTemplate && (
        <TemplateFormDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) handleDialogClose();
          }}
          template={selectedTemplate}
          onSuccess={() => {
            handleDialogClose();
            onTemplateCreated?.();
          }}
        />
      )}

      {/* Delete template dialog */}
      {dialogMode === "delete" && selectedTemplate && (
        <DeleteTemplateDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) handleDialogClose();
          }}
          templateName={selectedTemplate.name}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {/* Use template dialog */}
      {dialogMode === "use" && selectedTemplate && (
        <UseTemplateDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) handleDialogClose();
          }}
          template={selectedTemplate}
          onSuccess={handleDialogClose}
        />
      )}
    </>
  );
}
