/**
 * Tag Combobox Component
 *
 * Multi-select combobox for tags with inline creation capability.
 * Features:
 * - Search and filter existing tags
 * - Create new tags on-the-fly without leaving the form
 * - Display selected tags as removable badges
 * - Keyboard accessible
 * - Prevents duplicate tag creation
 *
 * @client component - interactive tag selection with state management
 */

"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { createTag } from "@/app/actions/tags";
import { toast } from "sonner";
import type { Tables } from "@/types/database.types";

// Type alias for Tag
type Tag = Tables<"tags">;

interface TagComboboxProps {
  availableTags: Tag[];
  selectedTags: string[]; // Array of tag IDs
  onTagsChange: (tagIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TagCombobox({
  availableTags,
  selectedTags,
  onTagsChange,
  placeholder = "Select tags...",
  disabled = false,
}: TagComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [isPending, startTransition] = React.useTransition();
  const [localTags, setLocalTags] = React.useState(availableTags);

  // Sync local tags with prop changes
  React.useEffect(() => {
    setLocalTags(availableTags);
  }, [availableTags]);

  // Get selected tag objects
  const selectedTagObjects = localTags.filter((tag) =>
    selectedTags.includes(tag.id),
  );

  // Filter available tags based on search (case-insensitive)
  const filteredTags = localTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchValue.toLowerCase()),
  );

  // Check if search value exactly matches an existing tag (case-insensitive)
  const exactMatch = filteredTags.some(
    (tag) => tag.name.toLowerCase() === searchValue.trim().toLowerCase(),
  );

  // Determine if we can create a new tag
  const canCreateTag =
    searchValue.trim().length > 0 && !exactMatch && !isPending;

  // Handle tag selection/deselection
  const handleSelect = (tagId: string) => {
    const newSelection = selectedTags.includes(tagId)
      ? selectedTags.filter((id) => id !== tagId)
      : [...selectedTags, tagId];

    onTagsChange(newSelection);
  };

  // Handle tag removal from badge
  const handleRemove = (
    tagId: string,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    onTagsChange(selectedTags.filter((id) => id !== tagId));
  };

  // Create new tag inline
  const handleCreateTag = () => {
    if (!canCreateTag) return;

    const tagName = searchValue.trim();

    startTransition(async () => {
      const result = await createTag({ name: tagName });

      if (result.success) {
        // Add new tag to local list (optimistic update)
        const newTag: Tag = {
          id: result.data.id,
          name: result.data.name,
          user_id: "", // Will be filled by server
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setLocalTags((prev) => [...prev, newTag]);

        // Automatically select the new tag
        onTagsChange([...selectedTags, result.data.id]);

        // Clear search and close dropdown
        setSearchValue("");
        setOpen(false);

        toast.success(`Tag "${result.data.name}" created`);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Selected Tags Display */}
      {selectedTagObjects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTagObjects.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="gap-1 pl-2 pr-1">
              #{tag.name}
              <button
                type="button"
                onClick={(e) => handleRemove(tag.id, e)}
                disabled={disabled}
                className="ml-1 rounded-full hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Remove ${tag.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Tag Selector Popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select tags"
            disabled={disabled}
            className="justify-between"
          >
            {selectedTags.length > 0
              ? `${selectedTags.length} tag(s) selected`
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search or create tag..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                {canCreateTag ? (
                  <button
                    type="button"
                    onClick={handleCreateTag}
                    disabled={isPending}
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    Create "{searchValue.trim()}"
                    {isPending && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        Creating...
                      </span>
                    )}
                  </button>
                ) : (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    {searchValue.trim()
                      ? "No tags found"
                      : "Start typing to create a tag"}
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup className="max-h-[300px] overflow-auto">
                {filteredTags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    value={tag.id}
                    onSelect={() => handleSelect(tag.id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedTags.includes(tag.id)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    #{tag.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
