# Tag Server Actions - Usage Examples

Quick reference guide for using the tag management Server Actions.

## Import Statement

```typescript
import {
  getTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag
} from "@/app/actions/tags";
```

## 1. Display All Tags (Server Component)

```typescript
// app/tags/page.tsx
import { getTags } from "@/app/actions/tags";

export default async function TagsPage() {
  const result = await getTags();

  if (!result.success) {
    return <div className="text-red-600">Error: {result.error}</div>;
  }

  if (result.data.length === 0) {
    return <div className="text-gray-500">No tags yet. Create your first tag!</div>;
  }

  return (
    <div>
      <h1>Your Tags</h1>
      <ul className="space-y-2">
        {result.data.map((tag) => (
          <li key={tag.id} className="flex items-center justify-between">
            <span>{tag.name}</span>
            <span className="text-sm text-gray-500">
              Created: {new Date(tag.created_at).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 2. Tag Detail Page (Server Component)

```typescript
// app/tags/[id]/page.tsx
import { getTagById } from "@/app/actions/tags";
import { notFound } from "next/navigation";

export default async function TagDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const result = await getTagById(params.id);

  if (!result.success) {
    return <div className="text-red-600">Error: {result.error}</div>;
  }

  if (!result.data) {
    notFound();
  }

  const tag = result.data;

  return (
    <div>
      <h1>Tag: {tag.name}</h1>
      <dl className="mt-4 space-y-2">
        <dt className="font-semibold">ID:</dt>
        <dd className="text-sm text-gray-600">{tag.id}</dd>
        <dt className="font-semibold">Created:</dt>
        <dd className="text-sm text-gray-600">
          {new Date(tag.created_at).toLocaleString()}
        </dd>
        <dt className="font-semibold">Last Updated:</dt>
        <dd className="text-sm text-gray-600">
          {new Date(tag.updated_at).toLocaleString()}
        </dd>
      </dl>
    </div>
  );
}
```

## 3. Create Tag Form (Client Component)

```typescript
// components/forms/create-tag-form.tsx
"use client";

import { createTag } from "@/app/actions/tags";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateTagForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await createTag({ name });

      if (!result.success) {
        setError(result.error);
        return;
      }

      // Success
      setName("");
      router.refresh(); // Refresh server components
      alert(`Tag "${result.data.name}" created successfully!`);
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Tag Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., coffee, travel, groceries"
          maxLength={100}
          required
          className="mt-1 block w-full rounded border px-3 py-2"
          disabled={isSubmitting}
        />
        <p className="mt-1 text-sm text-gray-500">
          {name.length}/100 characters
        </p>
      </div>

      {error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !name.trim()}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? "Creating..." : "Create Tag"}
      </button>
    </form>
  );
}
```

## 4. Update Tag Form (Client Component)

```typescript
// components/forms/edit-tag-form.tsx
"use client";

import { updateTag } from "@/app/actions/tags";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function EditTagForm({
  tagId,
  currentName,
}: {
  tagId: string;
  currentName: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await updateTag({ id: tagId, name });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.refresh();
      alert("Tag updated successfully!");
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasChanged = name !== currentName;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Tag Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          required
          className="mt-1 block w-full rounded border px-3 py-2"
          disabled={isSubmitting}
        />
      </div>

      {error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting || !hasChanged || !name.trim()}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => setName(currentName)}
          disabled={isSubmitting || !hasChanged}
          className="rounded border px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
```

## 5. Delete Tag Button (Client Component)

```typescript
// components/buttons/delete-tag-button.tsx
"use client";

import { deleteTag } from "@/app/actions/tags";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteTagButton({
  tagId,
  tagName,
}: {
  tagId: string;
  tagName: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = confirm(
      `Are you sure you want to delete the tag "${tagName}"?\n\n` +
      "This will remove the tag from all transactions. This action cannot be undone."
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const result = await deleteTag({ id: tagId });

      if (!result.success) {
        alert(`Error: ${result.error}`);
        return;
      }

      router.push("/tags");
      router.refresh();
      alert("Tag deleted successfully!");
    } catch (err) {
      alert("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
    >
      {isDeleting ? "Deleting..." : "Delete Tag"}
    </button>
  );
}
```

## 6. Tag Selector for Transaction Form (Client Component)

```typescript
// components/forms/tag-selector.tsx
"use client";

import { getTags, createTag } from "@/app/actions/tags";
import { useState, useEffect } from "react";

export function TagSelector({
  selectedTagIds,
  onChange,
}: {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}) {
  const [tags, setTags] = useState<Array<{ id: string; name: string }>>([]);
  const [newTagName, setNewTagName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Load tags on mount
  useEffect(() => {
    async function loadTags() {
      const result = await getTags();
      if (result.success) {
        setTags(result.data);
      }
    }
    loadTags();
  }, []);

  async function handleCreateTag() {
    if (!newTagName.trim()) return;

    setIsCreating(true);
    try {
      const result = await createTag({ name: newTagName });

      if (result.success) {
        // Add to list if new
        const exists = tags.some((t) => t.id === result.data.id);
        if (!exists) {
          setTags([...tags, result.data]);
        }

        // Select the tag
        onChange([...selectedTagIds, result.data.id]);
        setNewTagName("");
      } else {
        alert(result.error);
      }
    } finally {
      setIsCreating(false);
    }
  }

  function toggleTag(tagId: string) {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">Tags (optional)</label>

      {/* Existing tags */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`rounded-full px-3 py-1 text-sm ${
                isSelected
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {tag.name}
            </button>
          );
        })}
      </div>

      {/* Create new tag */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="Create new tag..."
          maxLength={100}
          className="flex-1 rounded border px-3 py-1 text-sm"
          disabled={isCreating}
        />
        <button
          type="button"
          onClick={handleCreateTag}
          disabled={isCreating || !newTagName.trim()}
          className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isCreating ? "..." : "Create"}
        </button>
      </div>
    </div>
  );
}
```

## 7. Using with React Hook Form

```typescript
// components/forms/transaction-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createTransaction } from "@/app/actions/transactions";
import { TagSelector } from "@/components/forms/tag-selector";

const schema = z.object({
  amount: z.number().positive(),
  categoryId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

type FormData = z.infer<typeof schema>;

export function TransactionForm() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tagIds: [],
    },
  });

  const tagIds = watch("tagIds") || [];

  async function onSubmit(data: FormData) {
    const result = await createTransaction(data);

    if (!result.success) {
      alert(result.error);
      return;
    }

    alert("Transaction created!");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Other fields... */}

      <TagSelector
        selectedTagIds={tagIds}
        onChange={(ids) => setValue("tagIds", ids)}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-blue-600 px-4 py-2 text-white"
      >
        {isSubmitting ? "Creating..." : "Create Transaction"}
      </button>
    </form>
  );
}
```

## 8. Server Action with Next.js Form Actions

```typescript
// app/tags/new/page.tsx
import { createTag } from "@/app/actions/tags";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export default function NewTagPage() {
  async function handleCreate(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const result = await createTag({ name });

    if (!result.success) {
      // In production, use proper error handling
      throw new Error(result.error);
    }

    revalidatePath("/tags");
    redirect("/tags");
  }

  return (
    <form action={handleCreate} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Tag Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={100}
          className="mt-1 block w-full rounded border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Create Tag
      </button>
    </form>
  );
}
```

## Error Handling Pattern

```typescript
"use client";

import { createTag } from "@/app/actions/tags";
import { useState } from "react";

export function TagForm() {
  const [status, setStatus] = useState<
    | { type: "idle" }
    | { type: "loading" }
    | { type: "error"; message: string }
    | { type: "success"; tagName: string }
  >({ type: "idle" });

  async function handleSubmit(formData: FormData) {
    setStatus({ type: "loading" });

    const name = formData.get("name") as string;
    const result = await createTag({ name });

    if (!result.success) {
      setStatus({ type: "error", message: result.error });
      return;
    }

    setStatus({ type: "success", tagName: result.data.name });
  }

  return (
    <div>
      <form action={handleSubmit}>
        <input
          name="name"
          required
          maxLength={100}
          disabled={status.type === "loading"}
        />
        <button type="submit" disabled={status.type === "loading"}>
          {status.type === "loading" ? "Creating..." : "Create Tag"}
        </button>
      </form>

      {status.type === "error" && (
        <div className="mt-2 text-red-600">{status.message}</div>
      )}

      {status.type === "success" && (
        <div className="mt-2 text-green-600">
          Tag "{status.tagName}" created successfully!
        </div>
      )}
    </div>
  );
}
```

## Tips & Best Practices

### 1. Client-Side Validation
Always validate on the client before calling Server Actions:
```typescript
if (!name.trim()) {
  setError("Tag name cannot be empty");
  return;
}

if (name.length > 100) {
  setError("Tag name too long");
  return;
}
```

### 2. Optimistic Updates
For better UX, update UI optimistically:
```typescript
// Add tag optimistically
setTags([...tags, { id: "temp", name }]);

// Call server action
const result = await createTag({ name });

if (result.success) {
  // Replace temp with real tag
  setTags((prev) =>
    prev.map((t) => (t.id === "temp" ? result.data : t))
  );
} else {
  // Remove temp on error
  setTags((prev) => prev.filter((t) => t.id !== "temp"));
}
```

### 3. Debounce Search/Filter
When filtering tags, debounce user input:
```typescript
import { useMemo, useState } from "react";

const [search, setSearch] = useState("");
const filteredTags = useMemo(
  () => tags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
  [tags, search]
);
```

### 4. Cache Management
Server Actions automatically revalidate paths. For manual refresh:
```typescript
import { useRouter } from "next/navigation";

const router = useRouter();

// After mutation
router.refresh();
```
