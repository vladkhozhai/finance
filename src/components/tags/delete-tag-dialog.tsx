/**
 * DeleteTagDialog Component
 *
 * Confirmation dialog for deleting a tag.
 * Shows error if tag is used in budgets.
 */

"use client";

import { AlertTriangle } from "lucide-react";
import { useTransition } from "react";
import { deleteTag } from "@/app/actions/tags";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/lib/hooks/use-toast";
import type { Tables } from "@/types/database.types";

type Tag = Tables<"tags">;

interface DeleteTagDialogProps {
  tag: Tag | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteTagDialog({
  tag,
  open,
  onOpenChange,
}: DeleteTagDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDelete = () => {
    if (!tag) return;

    startTransition(async () => {
      const result = await deleteTag({ id: tag.id });

      if (result.success) {
        toast.success("Tag deleted successfully");
        onOpenChange(false);
      } else {
        // Show error message from server action
        toast.error(result.error || "Failed to delete tag");
      }
    });
  };

  if (!tag) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Delete Tag</DialogTitle>
          </div>
          <DialogDescription className="pt-3">
            Are you sure you want to delete the tag{" "}
            <span className="font-semibold text-foreground">#{tag.name}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
          <p>
            This action cannot be undone. This will remove the tag from all
            associated transactions. Tags used in budgets cannot be deleted.
          </p>
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
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete Tag"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
