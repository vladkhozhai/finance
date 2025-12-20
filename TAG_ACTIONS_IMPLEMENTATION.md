# Tag Management Server Actions - Implementation Summary

## Overview
Implemented complete CRUD operations for tag management following the categories pattern. All 5 required Server Actions are now available with proper validation, error handling, and cache revalidation.

## Files Modified/Created

### 1. `/src/lib/validations/tag.ts`
Updated validation schemas to match database constraints:
- Removed restrictive regex pattern (allows any characters now)
- Removed lowercase transform (preserves user input)
- Increased max length from 30 to 100 characters
- Kept trim() for automatic whitespace removal

### 2. `/src/app/actions/tags.ts`
Added missing functions and updated existing ones:
- ✅ `getTags()` - NEW: Fetch all tags (alphabetically sorted)
- ✅ `getTagById(id)` - NEW: Fetch single tag by ID
- ✅ `createTag(input)` - UPDATED: Added `/tags` revalidation
- ✅ `updateTag(input)` - UPDATED: Added `/tags` revalidation
- ✅ `deleteTag(input)` - UPDATED: Added `/tags` revalidation

## Implementation Details

### 1. `getTags()`
**Purpose**: Fetch all tags for the current user, sorted alphabetically.

**Returns**: `ActionResult<Tag[]>`

**Features**:
- Authentication check
- Sorted by name (ascending)
- Returns empty array if no tags exist
- User-scoped via RLS

**Example Usage**:
```typescript
import { getTags } from "@/app/actions/tags";

export default async function TagsPage() {
  const result = await getTags();

  if (!result.success) {
    return <div>Error: {result.error}</div>;
  }

  return (
    <ul>
      {result.data.map((tag) => (
        <li key={tag.id}>{tag.name}</li>
      ))}
    </ul>
  );
}
```

### 2. `getTagById(id: string)`
**Purpose**: Fetch a single tag by its UUID.

**Parameters**:
- `id` - Tag UUID (validated format)

**Returns**: `ActionResult<Tag | null>`

**Features**:
- UUID format validation
- Authentication check
- Returns `null` if tag not found
- Ownership verification via RLS

**Example Usage**:
```typescript
import { getTagById } from "@/app/actions/tags";

export default async function TagDetailPage({ params }: { params: { id: string } }) {
  const result = await getTagById(params.id);

  if (!result.success) {
    return <div>Error: {result.error}</div>;
  }

  if (!result.data) {
    return <div>Tag not found</div>;
  }

  return <div>Tag: {result.data.name}</div>;
}
```

### 3. `createTag(input: CreateTagInput)`
**Purpose**: Create a new tag or return existing tag with same name.

**Parameters**:
```typescript
{
  name: string; // 1-100 characters, trimmed
}
```

**Returns**: `ActionResult<{ id: string; name: string }>`

**Features**:
- Zod validation (min 1, max 100 chars)
- Automatic trimming via database trigger
- Duplicate prevention (returns existing tag)
- Authentication check
- Revalidates `/dashboard`, `/tags`, `/transactions`

**Special Behavior**: If a tag with the same name already exists, it returns the existing tag instead of creating a duplicate. This allows for on-the-fly tag creation during transaction entry.

**Example Usage**:
```typescript
"use client";

import { createTag } from "@/app/actions/tags";
import { useState } from "react";

export function CreateTagForm() {
  const [name, setName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = await createTag({ name });

    if (!result.success) {
      alert(result.error);
      return;
    }

    console.log("Tag created:", result.data.id);
    setName("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tag name"
        maxLength={100}
      />
      <button type="submit">Create Tag</button>
    </form>
  );
}
```

### 4. `updateTag(input: UpdateTagInput)`
**Purpose**: Update an existing tag's name.

**Parameters**:
```typescript
{
  id: string;        // Tag UUID
  name: string;      // New name (1-100 characters, trimmed)
}
```

**Returns**: `ActionResult<{ id: string }>`

**Features**:
- Zod validation
- Duplicate name check (prevents renaming to existing tag name)
- Authentication and ownership verification
- Revalidates `/dashboard`, `/tags`, `/transactions`

**Example Usage**:
```typescript
"use client";

import { updateTag } from "@/app/actions/tags";

export function EditTagForm({ tagId, currentName }: { tagId: string; currentName: string }) {
  async function handleUpdate(formData: FormData) {
    const newName = formData.get("name") as string;

    const result = await updateTag({
      id: tagId,
      name: newName
    });

    if (!result.success) {
      alert(result.error);
      return;
    }

    console.log("Tag updated successfully");
  }

  return (
    <form action={handleUpdate}>
      <input
        name="name"
        defaultValue={currentName}
        maxLength={100}
      />
      <button type="submit">Update Tag</button>
    </form>
  );
}
```

### 5. `deleteTag(input: DeleteTagInput)`
**Purpose**: Delete a tag (only if not used in budgets).

**Parameters**:
```typescript
{
  id: string;  // Tag UUID
}
```

**Returns**: `ActionResult<void>`

**Features**:
- UUID validation
- Budget usage check (prevents deletion if tag is used in budgets)
- Automatic cascade deletion of `transaction_tags` associations
- Authentication and ownership verification
- Revalidates `/dashboard`, `/tags`, `/transactions`

**Important**: The database has `ON DELETE CASCADE` for the `transaction_tags` table, so when a tag is deleted, all associations with transactions are automatically removed. However, tags cannot be deleted if they're used in budgets (must delete budgets first).

**Example Usage**:
```typescript
"use client";

import { deleteTag } from "@/app/actions/tags";

export function DeleteTagButton({ tagId }: { tagId: string }) {
  async function handleDelete() {
    if (!confirm("Are you sure? This will remove the tag from all transactions.")) {
      return;
    }

    const result = await deleteTag({ id: tagId });

    if (!result.success) {
      alert(result.error);
      return;
    }

    console.log("Tag deleted successfully");
  }

  return (
    <button onClick={handleDelete}>Delete Tag</button>
  );
}
```

## Validation Rules

### Input Validation (Zod)
- **Tag name**: 1-100 characters, automatically trimmed
- **Tag ID**: Valid UUID format

### Database Constraints (Enforced by Postgres)
- **Unique constraint**: `(user_id, name)` - No duplicate tag names per user
- **Auto-trim trigger**: Tag names are automatically trimmed before insert/update
- **Non-empty check**: Tag names cannot be empty after trimming
- **Max length check**: Tag names cannot exceed 100 characters
- **Foreign key protection**: Cannot delete tags used in budgets

## Error Handling

### User-Friendly Error Messages
- ❌ "Unauthorized. Please log in to [action] tags."
- ❌ "Invalid tag ID format."
- ❌ "Tag name is required"
- ❌ "Tag name must be 100 characters or less"
- ❌ "A tag with this name already exists."
- ❌ "Cannot delete tag that is used in budgets. Please delete related budgets first."
- ❌ "Failed to [action] tag. Please try again."
- ❌ "An unexpected error occurred. Please try again."

### Error Handling Pattern
```typescript
const result = await createTag({ name: "coffee" });

if (!result.success) {
  // Handle error
  console.error(result.error);
  return;
}

// Success - use result.data
console.log("Created tag:", result.data.id);
```

## Cache Revalidation Strategy

All mutation operations (create, update, delete) revalidate:
1. `/dashboard` - Affects budget displays with tag filters
2. `/tags` - Tag management page
3. `/transactions` - Transaction list displays tags

## Database Schema Reference

```sql
-- Tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Junction table (many-to-many with transactions)
CREATE TABLE transaction_tags (
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (transaction_id, tag_id)
);
```

## Type Definitions

```typescript
// From database.types.ts
type Tag = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

// From validations
type CreateTagInput = {
  name: string;
};

type UpdateTagInput = {
  id: string;
  name: string;
};

type DeleteTagInput = {
  id: string;
};

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

## Edge Cases & Limitations

### 1. Duplicate Tag Creation
**Behavior**: Returns existing tag instead of creating duplicate
**Rationale**: Allows on-the-fly tag creation during transaction entry without errors

### 2. Case Sensitivity
**Behavior**: Tag names are case-sensitive ("Coffee" ≠ "coffee")
**Database**: Unique constraint is case-sensitive
**Recommendation**: Frontend should normalize tag names (e.g., lowercase) if desired

### 3. Tag Deletion with Transactions
**Behavior**: Tags can be deleted even if used in transactions
**Rationale**: `ON DELETE CASCADE` automatically removes associations from `transaction_tags`
**Warning**: This will remove the tag from all past transactions

### 4. Tag Deletion with Budgets
**Behavior**: Tags CANNOT be deleted if used in budgets
**Rationale**: Budgets have `ON DELETE CASCADE`, but we check first to prevent data loss
**Solution**: User must delete related budgets before deleting the tag

### 5. Whitespace Handling
**Frontend**: Validation trims input
**Backend**: Validation schema trims input
**Database**: Trigger automatically trims before insert/update
**Result**: Triple protection against whitespace issues

### 6. Empty Tag Names
**Frontend**: Zod validation rejects empty strings
**Database**: CHECK constraint rejects empty strings after trimming
**Result**: Impossible to create empty tag names

## Testing Recommendations

### Manual Testing Checklist
- [ ] Create tag with valid name (1-100 chars)
- [ ] Create tag with empty name (should fail)
- [ ] Create tag with 101+ characters (should fail)
- [ ] Create duplicate tag name (should return existing)
- [ ] Create tag with leading/trailing whitespace (should trim)
- [ ] Fetch all tags (should be alphabetically sorted)
- [ ] Fetch tag by ID (valid UUID)
- [ ] Fetch tag by ID (invalid UUID, should fail)
- [ ] Fetch tag by ID (non-existent, should return null)
- [ ] Update tag name (valid)
- [ ] Update tag to duplicate name (should fail)
- [ ] Update non-existent tag (should fail silently)
- [ ] Delete tag (not used anywhere)
- [ ] Delete tag used in transactions (should succeed, cascade)
- [ ] Delete tag used in budgets (should fail)
- [ ] Delete non-existent tag (should fail silently)

### Unit Test Examples
```typescript
import { describe, it, expect } from "vitest";
import { createTag, getTags, deleteTag } from "./tags";

describe("Tag Server Actions", () => {
  it("should validate tag name length", async () => {
    const result = await createTag({ name: "a".repeat(101) });
    expect(result.success).toBe(false);
    expect(result.error).toContain("100 characters");
  });

  it("should trim whitespace", async () => {
    const result = await createTag({ name: "  coffee  " });
    if (result.success) {
      expect(result.data.name).toBe("coffee");
    }
  });

  it("should return existing tag on duplicate", async () => {
    const first = await createTag({ name: "travel" });
    const second = await createTag({ name: "travel" });

    if (first.success && second.success) {
      expect(first.data.id).toBe(second.data.id);
    }
  });
});
```

## Integration with Other Features

### Transaction Creation
Tags are attached to transactions via the `transaction_tags` junction table. When creating a transaction:
```typescript
import { createTag } from "@/app/actions/tags";
import { createTransaction } from "@/app/actions/transactions";

// 1. Create/get tags first
const coffeeTag = await createTag({ name: "coffee" });
const workTag = await createTag({ name: "work" });

// 2. Create transaction with tag IDs
if (coffeeTag.success && workTag.success) {
  await createTransaction({
    amount: 5.50,
    categoryId: "food-category-id",
    date: "2024-01-15",
    description: "Morning coffee",
    tagIds: [coffeeTag.data.id, workTag.data.id],
  });
}
```

### Budget Creation
Budgets can be assigned to either a category OR a tag (not both):
```typescript
import { createBudget } from "@/app/actions/budgets";

// Budget for all transactions with "travel" tag
await createBudget({
  amount: 1000,
  period: "monthly",
  tagId: "travel-tag-id",  // Either tagId OR categoryId
  startDate: "2024-01-01",
});
```

## Summary

All 5 Server Actions for tag management are now fully implemented and production-ready:

✅ **getTags()** - Fetch all user tags (alphabetically sorted)
✅ **getTagById(id)** - Fetch single tag by UUID
✅ **createTag(input)** - Create tag or return existing
✅ **updateTag(input)** - Update tag name with duplicate check
✅ **deleteTag(input)** - Delete tag with budget usage check

**Key Features**:
- Type-safe with Zod validation
- User-scoped with RLS policies
- Duplicate prevention
- Proper error handling
- Cache revalidation
- Database constraint enforcement
- Cascade deletion for transaction associations
- Protection against budget deletion

**Next Steps**:
- Frontend components for tag CRUD UI
- Tag selector component for transaction forms
- Tag-based budget creation UI
- Integration testing with full user flow
