# Tag Server Actions - Quick Reference Card

## Import
```typescript
import { getTags, getTagById, createTag, updateTag, deleteTag } from "@/app/actions/tags";
```

## Function Signatures

### getTags()
```typescript
getTags(): Promise<ActionResult<Tag[]>>
```
**Returns**: All user tags, sorted alphabetically by name

---

### getTagById()
```typescript
getTagById(id: string): Promise<ActionResult<Tag | null>>
```
**Parameters**:
- `id` - Tag UUID

**Returns**: Single tag or `null` if not found

---

### createTag()
```typescript
createTag(input: CreateTagInput): Promise<ActionResult<{ id: string; name: string }>>
```
**Parameters**:
```typescript
{
  name: string  // 1-100 chars, trimmed
}
```
**Returns**: Created tag (or existing if duplicate)

**Special**: Returns existing tag instead of error on duplicate names

---

### updateTag()
```typescript
updateTag(input: UpdateTagInput): Promise<ActionResult<{ id: string }>>
```
**Parameters**:
```typescript
{
  id: string,    // Tag UUID
  name: string   // New name (1-100 chars, trimmed)
}
```
**Returns**: Updated tag ID

**Validates**: No duplicate names (other than current)

---

### deleteTag()
```typescript
deleteTag(input: DeleteTagInput): Promise<ActionResult<void>>
```
**Parameters**:
```typescript
{
  id: string  // Tag UUID
}
```
**Returns**: `void` on success

**Prevents**: Deletion if tag is used in budgets
**Allows**: Deletion if only used in transactions (cascade removes associations)

---

## Type Definitions

```typescript
type Tag = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

---

## Quick Examples

### Server Component (Read)
```typescript
const result = await getTags();
if (result.success) {
  result.data.forEach(tag => console.log(tag.name));
}
```

### Client Component (Create)
```typescript
"use client";
const result = await createTag({ name: "coffee" });
if (result.success) {
  console.log("Created:", result.data.id);
}
```

### Error Handling
```typescript
const result = await createTag({ name: "" });
if (!result.success) {
  console.error(result.error); // "Tag name is required"
}
```

---

## Validation Rules

| Rule | Validation |
|------|------------|
| Name required | ✅ Zod + DB |
| Min length | 1 character |
| Max length | 100 characters |
| Trimming | ✅ Auto (Zod + DB) |
| Unique per user | ✅ DB constraint |
| UUID format | ✅ Zod regex |

---

## Common Error Messages

- ❌ "Unauthorized. Please log in to [action] tags."
- ❌ "Invalid tag ID format."
- ❌ "Tag name is required"
- ❌ "Tag name must be 100 characters or less"
- ❌ "A tag with this name already exists."
- ❌ "Cannot delete tag that is used in budgets. Please delete related budgets first."
- ❌ "Failed to [action] tag. Please try again."

---

## Revalidated Paths

All mutations (create, update, delete) revalidate:
- `/dashboard`
- `/tags`
- `/transactions`

---

## Database Schema

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,  -- Max 100 chars, auto-trimmed
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, name)
);

CREATE TABLE transaction_tags (
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (transaction_id, tag_id)
);
```

---

## Cheat Sheet

### ✅ DO
- Check `result.success` before accessing `result.data`
- Trim tag names on client side for UX
- Use `router.refresh()` after mutations in Client Components
- Show loading states during async operations
- Handle all error cases

### ❌ DON'T
- Bypass validation and call Supabase directly
- Assume tags are case-insensitive (they're not)
- Delete tags without checking for budget usage
- Forget to check authentication
- Expose raw error messages to users

---

## File Locations

```
/src/app/actions/tags.ts          # Server Actions
/src/lib/validations/tag.ts       # Zod schemas
```

---

## Status: ✅ Production Ready

All functions implemented, tested, and documented.
Ready for frontend integration.
