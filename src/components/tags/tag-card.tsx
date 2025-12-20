/**
 * TagCard Component
 *
 * Displays a single tag with name, created date, and action buttons.
 */

"use client";

import { Edit, Tag as TagIcon, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tables } from "@/types/database.types";

type Tag = Tables<"tags">;

interface TagCardProps {
  tag: Tag;
  onEdit: (tag: Tag) => void;
  onDelete: (tag: Tag) => void;
}

export function TagCard({ tag, onEdit, onDelete }: TagCardProps) {
  // Format created date
  const createdDate = new Date(tag.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      {/* Accent bar on the left */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />

      <CardHeader className="pl-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {/* Tag icon */}
            <div className="h-10 w-10 rounded-full border-2 border-primary/20 bg-primary/10 flex items-center justify-center">
              <TagIcon className="h-5 w-5 text-primary" />
            </div>

            <div>
              <CardTitle className="text-lg font-medium">
                <Badge variant="secondary" className="text-base font-normal">
                  #{tag.name}
                </Badge>
              </CardTitle>

              {/* Created date */}
              <p className="text-xs text-muted-foreground mt-1.5">
                Created {createdDate}
              </p>
            </div>
          </div>

          {/* Action buttons - hidden by default, shown on hover */}
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(tag)}
              aria-label={`Edit ${tag.name}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(tag)}
              aria-label={`Delete ${tag.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
