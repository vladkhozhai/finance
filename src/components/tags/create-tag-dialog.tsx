/**
 * CreateTagDialog Component
 *
 * Modal dialog for creating a new tag with name input.
 */

"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { createTag } from "@/app/actions/tags";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/hooks/use-toast";

export function CreateTagDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState("");

  // Validation errors
  const [nameError, setNameError] = useState("");

  const resetForm = () => {
    setName("");
    setNameError("");
  };

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

    if (!validateForm()) {
      return;
    }

    startTransition(async () => {
      const result = await createTag({
        name: name.trim(),
      });

      if (result.success) {
        toast.success("Tag created successfully");
        setOpen(false);
        resetForm();
      } else {
        toast.error(result.error || "Failed to create tag");
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Tag
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Tag</DialogTitle>
            <DialogDescription>
              Add a new tag to organize your transactions flexibly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name field */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
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
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Tag"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
