/**
 * TagList Component
 *
 * Displays all tags in a responsive grid layout.
 * Handles edit and delete actions.
 */

"use client";

import { Tag as TagIcon } from "lucide-react";
import { useState } from "react";
import type { Tables } from "@/types/database.types";
import { DeleteTagDialog } from "./delete-tag-dialog";
import { EditTagDialog } from "./edit-tag-dialog";
import { TagCard } from "./tag-card";

type Tag = Tables<"tags">;

interface TagListProps {
  tags: Tag[];
}

export function TagList({ tags }: TagListProps) {
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
  };

  const handleDelete = (tag: Tag) => {
    setDeletingTag(tag);
  };

  if (tags.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <TagIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No tags yet</h3>
        <p className="text-muted-foreground mb-4">
          Create your first tag to flexibly organize transactions.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header with count */}
        <div className="flex items-center gap-2">
          <TagIcon className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">All Tags</h2>
          <span className="text-sm text-muted-foreground">
            ({tags.length} {tags.length === 1 ? "tag" : "tags"})
          </span>
        </div>

        {/* Tag grid - responsive: 1 col mobile, 2 cols tablet, 3 cols desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map((tag) => (
            <TagCard
              key={tag.id}
              tag={tag}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>

      {/* Edit Dialog */}
      <EditTagDialog
        tag={editingTag}
        open={!!editingTag}
        onOpenChange={(open) => {
          if (!open) setEditingTag(null);
        }}
      />

      {/* Delete Dialog */}
      <DeleteTagDialog
        tag={deletingTag}
        open={!!deletingTag}
        onOpenChange={(open) => {
          if (!open) setDeletingTag(null);
        }}
      />
    </>
  );
}
