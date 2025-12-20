/**
 * Profile - Tags Page (Nested Route)
 *
 * Embeds the full Tags functionality within the Profile section.
 * Uses the existing Tags components.
 */

import { getTags } from "@/app/actions/tags";
import { CreateTagDialog } from "@/components/tags/create-tag-dialog";
import { TagList } from "@/components/tags/tag-list";

export default async function ProfileTagsPage() {
  // Fetch all tags
  const result = await getTags();
  const tags = result.success ? result.data : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
          <p className="text-muted-foreground mt-2">
            Create flexible tags to organize your transactions beyond categories
          </p>
        </div>

        {/* Create button */}
        <CreateTagDialog />
      </div>

      {/* Tag list */}
      <TagList tags={tags} />
    </div>
  );
}
