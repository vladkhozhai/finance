/**
 * TagSelector Component
 *
 * A multi-select combobox for selecting existing tags or creating new ones.
 * Built with Shadcn/UI Command component (Combobox pattern).
 *
 * Features:
 * - Search/filter tags by name
 * - Multi-select with visual badges
 * - On-the-fly tag creation
 * - Keyboard navigation support
 * - Full accessibility with ARIA labels
 * - Loading states during tag creation
 *
 * @example
 * ```tsx
 * const [selectedTags, setSelectedTags] = useState<string[]>([]);
 *
 * <TagSelector
 *   value={selectedTags}
 *   onChange={setSelectedTags}
 *   placeholder="Select tags..."
 *   maxTags={10}
 * />
 * ```
 */

"use client";

import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { createTag, getTags } from "@/app/actions/tags";
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
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database.types";

type Tag = Tables<"tags">;

export interface TagSelectorProps {
  /**
   * Array of selected tag IDs
   */
  value: string[];

  /**
   * Callback when selection changes
   */
  onChange: (tagIds: string[]) => void;

  /**
   * Disable component
   */
  disabled?: boolean;

  /**
   * Input placeholder text
   */
  placeholder?: string;

  /**
   * Maximum number of tags allowed (optional)
   */
  maxTags?: number;
}

export function TagSelector({
  value,
  onChange,
  disabled = false,
  placeholder = "Select tags...",
  maxTags,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, startCreating] = useTransition();
  const { error: showError, success: showSuccess } = useToast();

  // Fetch available tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      setIsLoading(true);
      const result = await getTags();

      if (result.success) {
        setAvailableTags(result.data || []);
      } else {
        showError(result.error || "Failed to load tags");
      }

      setIsLoading(false);
    };

    fetchTags();
  }, [showError]);

  // Get selected tags from available tags
  const selectedTags = availableTags.filter((tag) => value.includes(tag.id));

  // Check if max tags limit is reached
  const isMaxReached = maxTags !== undefined && selectedTags.length >= maxTags;

  /**
   * Toggle tag selection
   */
  const handleToggleTag = (tagId: string) => {
    const isSelected = value.includes(tagId);

    if (isSelected) {
      // Remove tag
      onChange(value.filter((id) => id !== tagId));
    } else {
      // Add tag (if not at max)
      if (!isMaxReached) {
        onChange([...value, tagId]);
      }
    }
  };

  /**
   * Remove specific tag from selection
   */
  const handleRemoveTag = (tagId: string) => {
    onChange(value.filter((id) => id !== tagId));
  };

  /**
   * Clear all selected tags
   */
  const handleClearAll = () => {
    onChange([]);
  };

  /**
   * Create new tag and add to selection
   */
  const handleCreateTag = async () => {
    if (!searchValue.trim()) return;

    startCreating(async () => {
      const result = await createTag({ name: searchValue.trim() });

      if (result.success) {
        const newTag = result.data;

        // Update available tags list
        setAvailableTags((prev) => {
          // Check if tag already exists (backend returns existing tag)
          const exists = prev.find((t) => t.id === newTag.id);
          if (exists) return prev;

          // Add new tag to list
          return [
            ...prev,
            {
              ...newTag,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              user_id: "",
            },
          ];
        });

        // Add to selection if not at max
        if (!isMaxReached) {
          onChange([...value, newTag.id]);
        }

        // Clear search
        setSearchValue("");

        // Show success message
        showSuccess(`Tag "${newTag.name}" created`);
      } else {
        showError(result.error || "Failed to create tag");
      }
    });
  };

  // Filter tags based on search value
  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchValue.toLowerCase()),
  );

  // Check if we can create a new tag (search value doesn't match existing tags)
  const canCreateTag =
    searchValue.trim() &&
    !availableTags.some(
      (t) => t.name.toLowerCase() === searchValue.toLowerCase(),
    );

  return (
    <div className="space-y-2">
      {/* Combobox trigger */}
      <Popover open={open && !disabled} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select tags"
            disabled={disabled || (isMaxReached && selectedTags.length === 0)}
            className="w-full justify-between"
          >
            <span className="truncate">
              {selectedTags.length === 0
                ? placeholder
                : `${selectedTags.length} tag${selectedTags.length === 1 ? "" : "s"} selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search or create tag..."
              value={searchValue}
              onValueChange={setSearchValue}
              disabled={isCreating}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? (
                  <div className="py-6 text-center text-sm">
                    Loading tags...
                  </div>
                ) : canCreateTag ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={handleCreateTag}
                    disabled={isCreating || isMaxReached}
                  >
                    <Plus className="h-4 w-4" />
                    <span>
                      Create &quot;{searchValue}&quot;
                      {isMaxReached && " (max reached)"}
                    </span>
                  </Button>
                ) : (
                  <div className="py-6 text-center text-sm">No tags found</div>
                )}
              </CommandEmpty>

              {filteredTags.length > 0 && (
                <CommandGroup>
                  {filteredTags.map((tag) => {
                    const isSelected = value.includes(tag.id);
                    const isDisabled = !isSelected && isMaxReached;

                    return (
                      <CommandItem
                        key={tag.id}
                        value={tag.id}
                        onSelect={() => !isDisabled && handleToggleTag(tag.id)}
                        disabled={isDisabled}
                        className={cn(
                          isDisabled && "opacity-50 cursor-not-allowed",
                        )}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span>#{tag.name}</span>
                        {isDisabled && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            Max reached
                          </span>
                        )}
                      </CommandItem>
                    );
                  })}

                  {/* Show "Create" option when filtered list is not empty but search doesn't match exactly */}
                  {canCreateTag && (
                    <>
                      <div className="my-1 h-px bg-border" />
                      <CommandItem
                        value={`create-${searchValue}`}
                        onSelect={handleCreateTag}
                        disabled={isCreating || isMaxReached}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>
                          Create &quot;{searchValue}&quot;
                          {isMaxReached && " (max reached)"}
                        </span>
                      </CommandItem>
                    </>
                  )}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected tags display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          {selectedTags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="gap-1 pr-1">
              #{tag.name}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                disabled={disabled}
                className={cn(
                  "ml-1 rounded-full hover:bg-secondary-foreground/20 p-0.5 transition-colors",
                  disabled && "opacity-50 cursor-not-allowed",
                )}
                aria-label={`Remove ${tag.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {selectedTags.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              disabled={disabled}
              className="h-6 px-2 text-xs"
            >
              Clear all
            </Button>
          )}
        </div>
      )}

      {/* Max tags indicator */}
      {maxTags !== undefined && (
        <p className="text-xs text-muted-foreground">
          {selectedTags.length} / {maxTags} tags selected
          {isMaxReached && " (maximum reached)"}
        </p>
      )}
    </div>
  );
}
