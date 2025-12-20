/**
 * Profile - Categories Page (Nested Route)
 *
 * Embeds the full Categories functionality within the Profile section.
 * Uses the existing Categories components.
 */

import { getCategories } from "@/app/actions/categories";
import { CategoryList } from "@/components/categories/category-list";
import { CreateCategoryDialog } from "@/components/categories/create-category-dialog";

export default async function ProfileCategoriesPage() {
  // Fetch all categories
  const result = await getCategories();
  const categories = result.success ? result.data : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground mt-2">
            Organize your transactions with custom categories
          </p>
        </div>

        {/* Create button */}
        <CreateCategoryDialog />
      </div>

      {/* Category list */}
      <CategoryList categories={categories} />
    </div>
  );
}
