/**
 * FavoriteTemplates Component
 *
 * Quick access widget for favorite templates.
 * Displays favorite templates in a compact horizontal scrollable list.
 * For fixed-price templates: One-click to create transaction.
 * For variable-price templates: Opens amount dialog.
 */

"use client";

import { Plus, Star } from "lucide-react";
import { useState } from "react";
import type { TemplateWithRelations } from "@/app/actions/templates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import { UseTemplateDialog } from "./use-template-dialog";

interface FavoriteTemplatesProps {
  templates: TemplateWithRelations[];
  currency?: string;
  onTemplateUsed?: () => void;
}

export function FavoriteTemplates({
  templates,
  currency = "USD",
  onTemplateUsed,
}: FavoriteTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateWithRelations | null>(null);
  const [showUseDialog, setShowUseDialog] = useState(false);

  const handleUseTemplate = (template: TemplateWithRelations) => {
    setSelectedTemplate(template);
    setShowUseDialog(true);
  };

  // If no favorite templates, don't render anything
  if (templates.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              Favorite Templates
            </CardTitle>
            <Badge variant="secondary">{templates.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 pb-2">
              {templates.map((template) => {
                const displayCurrency = template.payment_method
                  ? template.payment_method.currency
                  : currency;

                return (
                  <button
                    key={template.id}
                    onClick={() => handleUseTemplate(template)}
                    className={cn(
                      "flex-shrink-0 w-48 p-4 rounded-lg border bg-card hover:bg-accent hover:shadow-md transition-all text-left",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    )}
                  >
                    <div className="space-y-2">
                      {/* Template name */}
                      <p className="font-semibold text-sm truncate">
                        {template.name}
                      </p>

                      {/* Amount */}
                      <p className="text-lg font-bold">
                        {template.amount !== null
                          ? formatCurrency(template.amount, displayCurrency)
                          : "Variable"}
                      </p>

                      {/* Category badge */}
                      {template.category && (
                        <Badge
                          variant="outline"
                          className="text-xs gap-1"
                          style={{
                            borderColor: template.category.color,
                            color: template.category.color,
                          }}
                        >
                          <div
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: template.category.color }}
                          />
                          {template.category.name}
                        </Badge>
                      )}

                      {/* Use button */}
                      <Button size="sm" variant="secondary" className="w-full">
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Use
                      </Button>
                    </div>
                  </button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Use template dialog */}
      {showUseDialog && selectedTemplate && (
        <UseTemplateDialog
          open={showUseDialog}
          onOpenChange={setShowUseDialog}
          template={selectedTemplate}
          onSuccess={() => {
            setShowUseDialog(false);
            setSelectedTemplate(null);
            onTemplateUsed?.();
          }}
        />
      )}
    </>
  );
}
