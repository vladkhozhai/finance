/**
 * DeleteCategoryDialog Component
 *
 * Confirmation dialog for deleting a category.
 * Shows error if category is used in transactions or budgets.
 */

"use client";

import { AlertTriangle } from "lucide-react";
import { useTransition } from "react";
import { deleteCategory } from "@/app/actions/categories";
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

type Category = Tables<"categories">;

interface DeleteCategoryDialogProps {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteCategoryDialog({
  category,
  open,
  onOpenChange,
}: DeleteCategoryDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDelete = () => {
    if (!category) return;

    startTransition(async () => {
      const result = await deleteCategory({ id: category.id });

      if (result.success) {
        toast.success("Category deleted successfully");
        onOpenChange(false);
      } else {
        // Show error message from server action
        toast.error(result.error || "Failed to delete category");
      }
    });
  };

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Delete Category</DialogTitle>
          </div>
          <DialogDescription className="pt-3">
            Are you sure you want to delete the category{" "}
            <span className="font-semibold text-foreground">
              {category.name}
            </span>
            ?
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
          <p>
            This action cannot be undone. Categories that are used in
            transactions or budgets cannot be deleted.
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
            {isPending ? "Deleting..." : "Delete Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
