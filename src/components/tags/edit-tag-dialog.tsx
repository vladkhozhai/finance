/**
 * EditTagDialog Component
 *
 * Modal dialog for editing an existing tag with pre-populated values.
 */

"use client";

import { useEffect, useState, useTransition } from "react";
import { updateTag } from "@/app/actions/tags";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/lib/hooks/use-toast";
import type { Tables } from "@/types/database.types";

type Tag = Tables<"tags">;

interface EditTagDialogProps {
  tag: Tag | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTagDialog({ tag, open, onOpenChange }: EditTagDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState("");

  // Validation errors
  const [nameError, setNameError] = useState("");

  // Pre-populate form when tag changes
  useEffect(() => {
    if (tag) {
      setName(tag.name);
      setNameError("");
    }
  }, [tag]);

  const validateForm = () => {
    let isValid = true;

    // Validate name (1-100 characters)
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Tag name is required");
      isValid = false;
    } else if (trimmedName.length < 1 || trimmedName.length > 100) {
      setNameError("Tag name must be between 1 and 100 characters");
      isValid = false;
    } else {
      setNameError("");
    }

    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!tag) return;
    if (!validateForm()) return;

    startTransition(async () => {
      const result = await updateTag({
        id: tag.id,
        name: name.trim(),
      });

      if (result.success) {
        toast.success("Tag updated successfully");
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to update tag");
      }
    });
  };

  if (!tag) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>Update the tag name.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name field */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                placeholder="e.g., coffee, travel, gift"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError("");
                }}
                disabled={isPending}
                className={nameError ? "border-destructive" : ""}
                maxLength={100}
              />
              {nameError && (
                <p className="text-sm text-destructive">{nameError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {name.length}/100 characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating..." : "Update Tag"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
