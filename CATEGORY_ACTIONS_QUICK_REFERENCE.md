# Category Server Actions - Quick Reference

## Implementation Complete

All category CRUD operations have been successfully implemented and are production-ready.

---

## Server Actions Overview

| Function | Purpose | Input | Output |
|----------|---------|-------|--------|
| `getCategories()` | Fetch all user categories | `type?: 'expense' \| 'income'` | `ActionResult<Category[]>` |
| `getCategoryById()` | Fetch single category | `id: string` | `ActionResult<Category \| null>` |
| `createCategory()` | Create new category | `{ name, color, type }` | `ActionResult<{ id: string }>` |
| `updateCategory()` | Update existing category | `{ id, name?, color?, type? }` | `ActionResult<{ id: string }>` |
| `deleteCategory()` | Delete category | `{ id }` | `ActionResult<void>` |

---

## Quick Import

```typescript
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '@/app/actions/categories';
```

---

## ActionResult Pattern

All Server Actions return consistent result objects:

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

**Usage**:
```typescript
const result = await createCategory({ name: 'Food', color: '#FF0000', type: 'expense' });

if (result.success) {
  console.log('Created category ID:', result.data.id);
} else {
  console.error('Error:', result.error);
}
```

---

## Validation Rules

### Category Name
- Required
- 1-50 characters
- Automatically trimmed
- Must be unique per user

### Color
- Required
- Hex format: `#RRGGBB` (e.g., `#4CAF50`)
- Case-insensitive

### Type
- Required (for create)
- Must be `'expense'` or `'income'`

### Category ID
- Must be valid UUID format
- Automatically validated

---

## Common Use Cases

### 1. Fetch All Categories
```typescript
const result = await getCategories();
if (result.success) {
  const categories = result.data; // Category[]
}
```

### 2. Fetch Only Expense Categories
```typescript
const result = await getCategories('expense');
```

### 3. Create Category
```typescript
const result = await createCategory({
  name: 'Groceries',
  color: '#4CAF50',
  type: 'expense'
});
```

### 4. Update Category (Partial)
```typescript
// Update only color
const result = await updateCategory({
  id: 'category-uuid',
  color: '#FF5722'
});
```

### 5. Delete Category
```typescript
const result = await deleteCategory({ id: 'category-uuid' });
```

---

## Error Messages

### Authentication Errors
- `"Unauthorized. Please log in to..."`

### Validation Errors
- `"Category name is required"`
- `"Category name must be 50 characters or less"`
- `"Color must be a valid hex code (e.g., #FF5733)"`
- `"Invalid UUID format"`
- `"Invalid category ID format"`

### Constraint Errors
- `"A category with this name already exists."`
- `"Cannot delete category that is used in transactions. Please reassign transactions first."`
- `"Cannot delete category that is used in budgets. Please delete related budgets first."`

### Generic Errors
- `"Failed to create category. Please try again."`
- `"Failed to update category. Please try again."`
- `"Failed to delete category. Please try again."`
- `"Failed to fetch categories. Please try again."`
- `"An unexpected error occurred. Please try again."`

---

## Security Features

1. **Authentication**: All actions verify user is logged in
2. **Row Level Security (RLS)**: Database enforces user isolation
3. **Input Validation**: Zod schemas validate all inputs
4. **SQL Injection Protection**: TypeScript types + Supabase client
5. **User Isolation**: All queries explicitly filter by `user_id`

---

## Cache Revalidation

After mutations (create/update/delete), these paths are automatically revalidated:
- `/dashboard`
- `/settings`
- `/transactions`

**What this means**: Any UI components on these pages will automatically refresh to show updated data.

---

## TypeScript Types

### Category Type
```typescript
import type { Tables } from '@/types/database.types';
type Category = Tables<'categories'>;

// Category shape:
{
  id: string;              // UUID
  user_id: string;         // UUID
  name: string;            // 1-50 chars
  color: string;           // #RRGGBB
  type: string;            // 'expense' | 'income'
  created_at: string;      // ISO timestamp
  updated_at: string;      // ISO timestamp
}
```

### Input Types
```typescript
// From @/lib/validations/category
type CreateCategoryInput = {
  name: string;
  color: string;
  type: 'expense' | 'income';
};

type UpdateCategoryInput = {
  id: string;
  name?: string;
  color?: string;
  type?: 'expense' | 'income';
};

type DeleteCategoryInput = {
  id: string;
};
```

---

## Performance Notes

- **getCategories()**: Single query, returns all user categories (typically < 100 items)
- **getCategoryById()**: Single query with `.single()` modifier
- **createCategory()**: 2 queries (duplicate check + insert)
- **updateCategory()**: 2 queries (duplicate check + update)
- **deleteCategory()**: 3 queries (transactions check + budgets check + delete)

All queries use database indexes for optimal performance.

---

## Testing Checklist

### Basic Operations
- [ ] Create category with valid data
- [ ] Create category with duplicate name (should fail)
- [ ] Fetch all categories
- [ ] Fetch categories filtered by type
- [ ] Update category name
- [ ] Update category color
- [ ] Update category type
- [ ] Delete unused category

### Edge Cases
- [ ] Create category with whitespace in name (should trim)
- [ ] Create category with invalid color format (should fail)
- [ ] Create category with invalid type (should fail)
- [ ] Update category to duplicate name (should fail)
- [ ] Delete category with transactions (should fail)
- [ ] Delete category with budgets (should fail)
- [ ] Fetch category with invalid UUID (should fail gracefully)
- [ ] Fetch non-existent category (should return null)

### Security
- [ ] Try to access another user's categories (should fail with RLS)
- [ ] Try to create category without authentication (should fail)
- [ ] Try to update another user's category (should fail with RLS)
- [ ] Try to delete another user's category (should fail with RLS)

---

## Related Documentation

- **Full Implementation Details**: `/CATEGORY_SERVER_ACTIONS_SUMMARY.md`
- **Frontend Usage Examples**: `/CATEGORY_ACTIONS_USAGE_EXAMPLES.md`
- **Validation Schemas**: `/src/lib/validations/category.ts`
- **Server Actions**: `/src/app/actions/categories.ts`
- **Database Types**: `/src/types/database.types.ts`

---

## Support

For questions or issues:
1. Check the full documentation in `CATEGORY_SERVER_ACTIONS_SUMMARY.md`
2. Review usage examples in `CATEGORY_ACTIONS_USAGE_EXAMPLES.md`
3. Consult System Architect (02) for database schema questions
4. Contact Backend Developer (03) for Server Action implementation questions

---

## Status: Production Ready

- All CRUD operations implemented
- Input validation with Zod schemas
- Comprehensive error handling
- Type-safe with TypeScript
- Security enforced with RLS
- Cache revalidation configured
- Build successful with no errors
- Linting passed with no warnings

**Last Updated**: 2025-12-16
**Version**: 1.0.0
