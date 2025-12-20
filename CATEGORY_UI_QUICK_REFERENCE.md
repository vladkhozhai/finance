# Category Management UI - Quick Reference

## File Locations

```
src/
├── app/(dashboard)/categories/
│   └── page.tsx                          # Main categories page
├── components/categories/
│   ├── index.ts                          # Barrel exports
│   ├── category-card.tsx                 # Individual category display
│   ├── category-list.tsx                 # List with grouping by type
│   ├── color-picker.tsx                  # Color selection component
│   ├── create-category-dialog.tsx        # Create modal
│   ├── edit-category-dialog.tsx          # Edit modal
│   └── delete-category-dialog.tsx        # Delete confirmation
└── app/actions/categories.ts             # Server Actions (already existed)
```

## Component Hierarchy

```
CategoriesPage (Server Component)
└── CategoryList (Client Component)
    ├── CategoryCard (multiple)
    │   └── Edit/Delete buttons
    ├── EditCategoryDialog
    │   └── ColorPicker
    └── DeleteCategoryDialog

CategoriesPage (Server Component)
└── CreateCategoryDialog
    └── ColorPicker
```

## Usage Examples

### Import Components

```tsx
// Individual imports
import { CategoryList } from "@/components/categories/category-list";
import { CreateCategoryDialog } from "@/components/categories/create-category-dialog";

// Or use barrel import
import { CategoryList, CreateCategoryDialog } from "@/components/categories";
```

### Basic Page Setup

```tsx
import { getCategories } from "@/app/actions/categories";
import { CategoryList, CreateCategoryDialog } from "@/components/categories";

export default async function CategoriesPage() {
  const result = await getCategories();
  const categories = result.success ? result.data : [];

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Categories</h1>
        <CreateCategoryDialog />
      </div>
      <CategoryList categories={categories} />
    </div>
  );
}
```

## Server Actions API

### Get All Categories

```tsx
const result = await getCategories();
// Returns: ActionResult<Category[]>

// With type filter
const expenseResult = await getCategories("expense");
const incomeResult = await getCategories("income");
```

### Create Category

```tsx
const result = await createCategory({
  name: "Groceries",
  color: "#22C55E",
  type: "expense"
});
// Returns: ActionResult<{ id: string }>
```

### Update Category

```tsx
const result = await updateCategory({
  id: "category-uuid",
  name: "Updated Name",    // optional
  color: "#3B82F6",        // optional
  type: "income"           // optional
});
// Returns: ActionResult<{ id: string }>
```

### Delete Category

```tsx
const result = await deleteCategory({
  id: "category-uuid"
});
// Returns: ActionResult<void>
```

## Component Props

### CategoryCard

```tsx
interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

<CategoryCard
  category={category}
  onEdit={(cat) => console.log("Edit", cat)}
  onDelete={(cat) => console.log("Delete", cat)}
/>
```

### CategoryList

```tsx
interface CategoryListProps {
  categories: Category[];
}

<CategoryList categories={[...]} />
```

### ColorPicker

```tsx
interface ColorPickerProps {
  value: string;          // Current color (hex)
  onChange: (color: string) => void;
  error?: string;         // Validation error
}

<ColorPicker
  value="#3B82F6"
  onChange={(color) => setSelectedColor(color)}
  error={colorError}
/>
```

### EditCategoryDialog

```tsx
interface EditCategoryDialogProps {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

<EditCategoryDialog
  category={selectedCategory}
  open={isEditOpen}
  onOpenChange={setIsEditOpen}
/>
```

### DeleteCategoryDialog

```tsx
interface DeleteCategoryDialogProps {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

<DeleteCategoryDialog
  category={selectedCategory}
  open={isDeleteOpen}
  onOpenChange={setIsDeleteOpen}
/>
```

## Color Picker Presets

18 preset colors from Tailwind palette:

```tsx
const PRESET_COLORS = [
  "#EF4444",  // red-500
  "#F97316",  // orange-500
  "#F59E0B",  // amber-500
  "#EAB308",  // yellow-500
  "#84CC16",  // lime-500
  "#22C55E",  // green-500
  "#10B981",  // emerald-500
  "#14B8A6",  // teal-500
  "#06B6D4",  // cyan-500
  "#0EA5E9",  // sky-500
  "#3B82F6",  // blue-500 (default)
  "#6366F1",  // indigo-500
  "#8B5CF6",  // violet-500
  "#A855F7",  // purple-500
  "#D946EF",  // fuchsia-500
  "#EC4899",  // pink-500
  "#F43F5E",  // rose-500
  "#64748B",  // slate-500
];
```

## Validation Rules

### Name
- Required
- Trimmed whitespace
- Must be unique per user
- Error: "Category name is required"
- Error: "A category with this name already exists"

### Color
- Required
- Must be valid hex format: `#RRGGBB`
- Case-insensitive
- Regex: `/^#[0-9A-F]{6}$/i`
- Error: "Invalid color format. Use #RRGGBB"

### Type
- Required
- Must be "expense" or "income"
- Radio button selection

## Error Messages

### Create/Update Errors
- "Category name is required"
- "Invalid color format. Use #RRGGBB"
- "A category with this name already exists"
- "Failed to [create/update] category. Please try again."

### Delete Errors
- "Cannot delete category that is used in transactions. Please reassign transactions first."
- "Cannot delete category that is used in budgets. Please delete related budgets first."
- "Failed to delete category. Please try again."

## Toast Notifications

All operations show toast feedback:

```tsx
// Success
toast.success("Category created successfully");
toast.success("Category updated successfully");
toast.success("Category deleted successfully");

// Error
toast.error(result.error || "Failed to create category");
```

## Styling Classes

### Category Card
```tsx
// Card hover effect
"group relative overflow-hidden transition-shadow hover:shadow-md"

// Color indicator bar
"absolute left-0 top-0 bottom-0 w-1"

// Color circle
"h-10 w-10 rounded-full border-2 border-white shadow-sm"

// Action buttons (hidden until hover)
"opacity-0 transition-opacity group-hover:opacity-100"
```

### Grid Layout
```tsx
// Responsive grid
"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
```

### Type Badges
```tsx
// Expense badge
<Badge variant="destructive">
  <TrendingDown className="h-3 w-3" />
  Expense
</Badge>

// Income badge
<Badge variant="default">
  <TrendingUp className="h-3 w-3" />
  Income
</Badge>
```

## Icons Used

From Lucide React:

```tsx
import {
  Edit,           // Edit button
  Trash2,         // Delete button
  Plus,           // Create button
  TrendingDown,   // Expense indicator
  TrendingUp,     // Income indicator
  Check,          // Color picker selection
  AlertTriangle   // Delete warning
} from "lucide-react";
```

## Loading States

All async operations show loading states:

```tsx
// Button text changes
{isPending ? "Creating..." : "Create Category"}
{isPending ? "Updating..." : "Update Category"}
{isPending ? "Deleting..." : "Delete Category"}

// Buttons disabled during operation
disabled={isPending}

// Form fields disabled
disabled={isPending}
```

## Accessibility Features

- Semantic HTML elements
- ARIA labels on icon buttons: `aria-label="Edit Groceries"`
- Keyboard navigation support
- Focus management in dialogs
- Color contrast compliance
- Screen reader friendly text

## Testing Commands

```bash
# Build and check for errors
npm run build

# Lint code
npm run lint

# Format code
npm run format

# Run dev server
npm run dev
```

## Common Tasks

### Add a new preset color
Edit `color-picker.tsx`:
```tsx
const PRESET_COLORS = [
  // Add your color here
  "#YOUR_HEX_COLOR",
];
```

### Change default color
Edit `create-category-dialog.tsx`:
```tsx
const [color, setColor] = useState("#YOUR_DEFAULT_COLOR");
```

### Customize category card layout
Edit `category-card.tsx` and modify the Card structure.

### Add category filtering
Add filter state to `category-list.tsx`:
```tsx
const [filter, setFilter] = useState<string>("");
const filtered = categories.filter(cat =>
  cat.name.toLowerCase().includes(filter.toLowerCase())
);
```

## Type Definitions

```typescript
// From database.types.ts
type Category = {
  id: string;
  user_id: string;
  name: string;
  color: string;        // Hex format: #RRGGBB
  type: string;         // "expense" | "income"
  created_at: string;
  updated_at: string;
};

// ActionResult from validations/shared.ts
type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
```

## Next Steps

1. Test all CRUD operations
2. Verify mobile responsiveness
3. Test keyboard navigation
4. Check screen reader compatibility
5. Load test with many categories
6. Test error scenarios

---

**Last Updated:** December 16, 2025
**Version:** 1.0.0
