/**
 * Tag Selector Demo Page
 *
 * Demonstrates the TagSelector component with various configurations:
 * - Basic usage
 * - Pre-selected tags
 * - Disabled state
 * - Max tags limit
 */

"use client";

import { useState } from "react";
import { TagSelector } from "@/components/tags";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function TagSelectorDemoPage() {
  // Basic usage state
  const [basicTags, setBasicTags] = useState<string[]>([]);

  // Pre-selected tags state (will be populated when tags are loaded)
  const [preselectedTags, setPreselectedTags] = useState<string[]>([]);

  // Disabled state
  const [disabledTags, setDisabledTags] = useState<string[]>([]);
  const [isDisabled, setIsDisabled] = useState(true);

  // Max tags limit state
  const [limitedTags, setLimitedTags] = useState<string[]>([]);
  const maxTagsLimit = 3;

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Tag Selector Component Demo
        </h1>
        <p className="text-muted-foreground mt-2">
          Interactive demonstrations of the TagSelector component with various
          configurations.
        </p>
      </div>

      {/* Demo 1: Basic Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Usage</CardTitle>
          <CardDescription>
            Default TagSelector with no restrictions. Search for tags or create
            new ones.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="basic-selector">Select Tags</Label>
            <TagSelector
              value={basicTags}
              onChange={setBasicTags}
              placeholder="Select or create tags..."
            />
          </div>

          {/* Display selected tag IDs */}
          <div className="p-4 bg-muted rounded-md">
            <p className="text-sm font-medium mb-2">Selected Tag IDs:</p>
            <code className="text-xs">
              {basicTags.length === 0
                ? "[]"
                : JSON.stringify(basicTags, null, 2)}
            </code>
          </div>

          <Button
            variant="outline"
            onClick={() => setBasicTags([])}
            disabled={basicTags.length === 0}
          >
            Clear Selection
          </Button>
        </CardContent>
      </Card>

      {/* Demo 2: Pre-selected Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Pre-selected Tags</CardTitle>
          <CardDescription>
            TagSelector with tags already selected (useful for edit forms).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preselected-selector">Tags</Label>
            <TagSelector
              value={preselectedTags}
              onChange={setPreselectedTags}
              placeholder="Modify selected tags..."
            />
          </div>

          <div className="p-4 bg-muted rounded-md">
            <p className="text-sm font-medium mb-2">Current Selection:</p>
            <code className="text-xs">
              {preselectedTags.length === 0
                ? "[]"
                : JSON.stringify(preselectedTags, null, 2)}
            </code>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPreselectedTags([])}
              disabled={preselectedTags.length === 0}
            >
              Clear All
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                // Simulate loading tags with IDs (in real usage, you'd fetch actual tag IDs)
                // For demo purposes, we'll just show the concept
                alert(
                  "In a real app, you would set actual tag IDs here from your data source",
                );
              }}
            >
              Simulate Pre-selection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Demo 3: Disabled State */}
      <Card>
        <CardHeader>
          <CardTitle>Disabled State</CardTitle>
          <CardDescription>
            TagSelector in disabled state (useful for read-only views or during
            form submission).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="disabled-selector">Tags (Disabled)</Label>
            <TagSelector
              value={disabledTags}
              onChange={setDisabledTags}
              disabled={isDisabled}
              placeholder="Disabled selector..."
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDisabled(!isDisabled)}
            >
              {isDisabled ? "Enable" : "Disable"} Selector
            </Button>
            <Button
              variant="outline"
              onClick={() => setDisabledTags([])}
              disabled={disabledTags.length === 0}
            >
              Clear Selection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Demo 4: Max Tags Limit */}
      <Card>
        <CardHeader>
          <CardTitle>Max Tags Limit</CardTitle>
          <CardDescription>
            TagSelector with a maximum of {maxTagsLimit} tags (useful for
            enforcing business rules).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="limited-selector">
              Select Tags (Max: {maxTagsLimit})
            </Label>
            <TagSelector
              value={limitedTags}
              onChange={setLimitedTags}
              maxTags={maxTagsLimit}
              placeholder="Select up to 3 tags..."
            />
          </div>

          <div className="p-4 bg-muted rounded-md">
            <p className="text-sm font-medium mb-2">
              Selected: {limitedTags.length} / {maxTagsLimit}
            </p>
            <code className="text-xs">
              {limitedTags.length === 0
                ? "[]"
                : JSON.stringify(limitedTags, null, 2)}
            </code>
          </div>

          {limitedTags.length >= maxTagsLimit && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Maximum tag limit reached. Remove a tag to add a new one.
              </p>
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => setLimitedTags([])}
            disabled={limitedTags.length === 0}
          >
            Clear Selection
          </Button>
        </CardContent>
      </Card>

      {/* Usage Example Code */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Example</CardTitle>
          <CardDescription>
            Basic code example for integrating TagSelector in your forms.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="p-4 bg-muted rounded-md overflow-x-auto">
            <code className="text-xs">{`import { useState } from "react";
import { TagSelector } from "@/components/tags";

export function MyForm() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Selected tags:", selectedTags);
    // Process form with selectedTags
  };

  return (
    <form onSubmit={handleSubmit}>
      <TagSelector
        value={selectedTags}
        onChange={setSelectedTags}
        placeholder="Select tags..."
        maxTags={10}
      />
      <button type="submit">Submit</button>
    </form>
  );
}`}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Component Props Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Component Props</CardTitle>
          <CardDescription>
            Available props for the TagSelector component.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">value: string[]</h4>
              <p className="text-sm text-muted-foreground">
                Array of selected tag IDs. Required.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">
                onChange: (tagIds: string[]) =&gt; void
              </h4>
              <p className="text-sm text-muted-foreground">
                Callback function when selection changes. Required.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">disabled?: boolean</h4>
              <p className="text-sm text-muted-foreground">
                Disable the component. Optional, defaults to false.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">placeholder?: string</h4>
              <p className="text-sm text-muted-foreground">
                Input placeholder text. Optional, defaults to &quot;Select
                tags...&quot;
              </p>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">maxTags?: number</h4>
              <p className="text-sm text-muted-foreground">
                Maximum number of tags allowed. Optional, no limit by default.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
