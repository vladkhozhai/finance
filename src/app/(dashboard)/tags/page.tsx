/**
 * Tags Page
 *
 * Manages flexible tags for transaction organization.
 * Allows creating, editing, and deleting tags.
 */

import { getTags } from "@/app/actions/tags";
import { CreateTagDialog } from "@/components/tags/create-tag-dialog";
import { TagList } from "@/components/tags/tag-list";

export default async function TagsPage() {
  // Fetch all tags
  const result = await getTags();
  const tags = result.success ? result.data : [];

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Tags
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Create flexible tags to organize your transactions beyond
            categories.
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
