# Category Server Actions - Frontend Usage Examples

## Quick Reference for Frontend Integration

This document provides practical examples for Frontend Developers to integrate category Server Actions into UI components.

---

## Import Statement

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

## 1. Category List Component

Display all categories with filtering by type:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getCategories } from '@/app/actions/categories';
import type { Tables } from '@/types/database.types';

type Category = Tables<'categories'>;

export function CategoryList({ type }: { type?: 'expense' | 'income' }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      setLoading(true);
      const result = await getCategories(type);

      if (result.success) {
        setCategories(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
      setLoading(false);
    }

    fetchCategories();
  }, [type]);

  if (loading) return <div>Loading categories...</div>;
  if (error) return <div>Error: {error}</div>;
  if (categories.length === 0) return <div>No categories found.</div>;

  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <div key={category.id} className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          <span>{category.name}</span>
          <span className="text-sm text-gray-500">({category.type})</span>
        </div>
      ))}
    </div>
  );
}
```

---

## 2. Create Category Form

Form component to create a new category:

```typescript
'use client';

import { useState } from 'react';
import { createCategory } from '@/app/actions/categories';

export function CreateCategoryForm({ onSuccess }: { onSuccess?: () => void }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#4CAF50');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createCategory({ name, color, type });

    if (result.success) {
      // Reset form
      setName('');
      setColor('#4CAF50');
      setType('expense');
      onSuccess?.();
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Category Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          required
          className="mt-1 block w-full rounded-md border p-2"
          placeholder="e.g., Groceries"
        />
      </div>

      <div>
        <label htmlFor="color" className="block text-sm font-medium">
          Color
        </label>
        <input
          id="color"
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="mt-1 block h-10 w-20 rounded-md border"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Type</label>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="expense"
              checked={type === 'expense'}
              onChange={(e) => setType(e.target.value as 'expense')}
              className="mr-2"
            />
            Expense
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="income"
              checked={type === 'income'}
              onChange={(e) => setType(e.target.value as 'income')}
              className="mr-2"
            />
            Income
          </label>
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Category'}
      </button>
    </form>
  );
}
```

---

## 3. Category Dropdown Selector

Dropdown for selecting a category in a transaction form:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getCategories } from '@/app/actions/categories';
import type { Tables } from '@/types/database.types';

type Category = Tables<'categories'>;

interface CategorySelectProps {
  value: string;
  onChange: (categoryId: string) => void;
  type?: 'expense' | 'income';
}

export function CategorySelect({ value, onChange, type }: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      const result = await getCategories(type);
      if (result.success) {
        setCategories(result.data);
      }
      setLoading(false);
    }
    fetchCategories();
  }, [type]);

  if (loading) {
    return <select disabled className="w-full p-2 border rounded-md">
      <option>Loading...</option>
    </select>;
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-2 border rounded-md"
      required
    >
      <option value="">Select a category</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
}
```

---

## 4. Edit Category Form

Form to update an existing category:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { getCategoryById, updateCategory } from '@/app/actions/categories';

export function EditCategoryForm({
  categoryId,
  onSuccess
}: {
  categoryId: string;
  onSuccess?: () => void;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#4CAF50');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing category data
  useEffect(() => {
    async function loadCategory() {
      const result = await getCategoryById(categoryId);

      if (result.success && result.data) {
        setName(result.data.name);
        setColor(result.data.color);
        setType(result.data.type as 'expense' | 'income');
      } else if (!result.success) {
        setError(result.error);
      }
      setLoading(false);
    }
    loadCategory();
  }, [categoryId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const result = await updateCategory({ id: categoryId, name, color, type });

    if (result.success) {
      onSuccess?.();
    } else {
      setError(result.error);
    }
    setSaving(false);
  }

  if (loading) return <div>Loading category...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Category Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          required
          className="mt-1 block w-full rounded-md border p-2"
        />
      </div>

      <div>
        <label htmlFor="color" className="block text-sm font-medium">
          Color
        </label>
        <input
          id="color"
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="mt-1 block h-10 w-20 rounded-md border"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Type</label>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="expense"
              checked={type === 'expense'}
              onChange={(e) => setType(e.target.value as 'expense')}
              className="mr-2"
            />
            Expense
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="income"
              checked={type === 'income'}
              onChange={(e) => setType(e.target.value as 'income')}
              className="mr-2"
            />
            Income
          </label>
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
```

---

## 5. Delete Category Button

Button component to delete a category with confirmation:

```typescript
'use client';

import { useState } from 'react';
import { deleteCategory } from '@/app/actions/categories';

export function DeleteCategoryButton({
  categoryId,
  categoryName,
  onSuccess
}: {
  categoryId: string;
  categoryName: string;
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDelete() {
    setLoading(true);
    setError(null);

    const result = await deleteCategory({ id: categoryId });

    if (result.success) {
      onSuccess?.();
    } else {
      setError(result.error);
      setShowConfirm(false);
    }
    setLoading(false);
  }

  if (!showConfirm) {
    return (
      <>
        <button
          onClick={() => setShowConfirm(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-md"
        >
          Delete
        </button>
        {error && (
          <div className="text-red-600 text-sm mt-2">{error}</div>
        )}
      </>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm">
        Are you sure you want to delete "{categoryName}"?
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-50"
        >
          {loading ? 'Deleting...' : 'Confirm Delete'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          className="px-4 py-2 bg-gray-300 rounded-md disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
    </div>
  );
}
```

---

## 6. Category Management Page

Complete page combining all CRUD operations:

```typescript
'use client';

import { useState } from 'react';
import { CategoryList } from './category-list';
import { CreateCategoryForm } from './create-category-form';

export default function CategoriesPage() {
  const [filter, setFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  function handleSuccess() {
    // Trigger re-fetch of categories
    setRefreshKey(prev => prev + 1);
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Categories</h1>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('expense')}
          className={`px-4 py-2 rounded-md ${
            filter === 'expense' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Expenses
        </button>
        <button
          onClick={() => setFilter('income')}
          className={`px-4 py-2 rounded-md ${
            filter === 'income' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Income
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Categories</h2>
          <CategoryList
            key={refreshKey}
            type={filter === 'all' ? undefined : filter}
          />
        </div>

        {/* Create Form */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Create New Category</h2>
          <CreateCategoryForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
}
```

---

## 7. React Hook for Categories

Custom hook for easier integration:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { getCategories } from '@/app/actions/categories';
import type { Tables } from '@/types/database.types';

type Category = Tables<'categories'>;

export function useCategories(type?: 'expense' | 'income') {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    const result = await getCategories(type);

    if (result.success) {
      setCategories(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, [type]);

  return { categories, loading, error, refresh };
}

// Usage in a component:
// const { categories, loading, error, refresh } = useCategories('expense');
```

---

## Error Handling Patterns

### Pattern 1: Display Error Message
```typescript
const result = await createCategory({ name, color, type });
if (!result.success) {
  setError(result.error); // Display to user
}
```

### Pattern 2: Toast Notification
```typescript
const result = await createCategory({ name, color, type });
if (result.success) {
  toast.success('Category created successfully!');
} else {
  toast.error(result.error);
}
```

### Pattern 3: Form Validation
```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  const result = await createCategory({ name, color, type });

  if (result.success) {
    // Reset form and show success
    setName('');
    setSuccessMessage('Category created!');
  } else {
    // Show inline error
    setFieldError(result.error);
  }
}
```

---

## Common Patterns

### 1. Loading States
Always show loading indicators during async operations:
```typescript
{loading ? <Spinner /> : <CategoryList categories={categories} />}
```

### 2. Empty States
Handle cases where no categories exist:
```typescript
{categories.length === 0 && <EmptyState message="No categories found. Create your first category!" />}
```

### 3. Optimistic Updates
Update UI immediately, then revert if error occurs:
```typescript
const optimisticCategories = [...categories, newCategory];
setCategories(optimisticCategories);

const result = await createCategory(newCategory);
if (!result.success) {
  setCategories(categories); // Revert on error
  showError(result.error);
}
```

---

## TypeScript Tips

### Import Types
```typescript
import type { Tables } from '@/types/database.types';
type Category = Tables<'categories'>;
```

### Type Guard for Action Results
```typescript
function isSuccess<T>(result: ActionResult<T>): result is { success: true; data: T } {
  return result.success;
}

const result = await getCategories();
if (isSuccess(result)) {
  // TypeScript knows result.data is Category[]
  console.log(result.data);
}
```

---

## Next Steps

1. Implement UI components using these examples
2. Add proper error handling and loading states
3. Consider implementing optimistic updates for better UX
4. Add confirmation dialogs for destructive actions
5. Integrate with toast/notification system for user feedback
