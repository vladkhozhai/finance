/**
 * Categories Page
 *
 * Manages expense and income categories.
 * Allows creating, editing, and deleting categories with color customization.
 */

import { getCategories } from "@/app/actions/categories";
import { CategoryList } from "@/components/categories/category-list";
import { CreateCategoryDialog } from "@/components/categories/create-category-dialog";

export default async function CategoriesPage() {
  // Fetch all categories
  const result = await getCategories();
  const categories = result.success ? result.data : [];

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Categories
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Organize your transactions with custom categories.
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
