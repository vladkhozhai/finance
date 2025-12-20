# Tags Table - Quick Reference

**Card #4 - Tag Management | System Architect**

---

## Table Schema (Quick View)

```sql
CREATE TABLE tags (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL CHECK (LENGTH(TRIM(name)) > 0 AND LENGTH(name) <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);
```

---

## TypeScript Types

```typescript
import type { Database } from '@/types/database.types';

// Read operations
type Tag = Database['public']['Tables']['tags']['Row'];

// Create operations
type TagInsert = Database['public']['Tables']['tags']['Insert'];

// Update operations
type TagUpdate = Database['public']['Tables']['tags']['Update'];
```

---

## CRUD Operations (Backend)

### Create Tag
```typescript
export async function createTag(name: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('tags')
    .insert({ user_id: user.id, name })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Read Tags
```typescript
export async function getTags() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}
```

### Update Tag
```typescript
export async function updateTag(id: string, name: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('tags')
    .update({ name })
    .eq('id', id);

  if (error) throw error;
}
```

### Delete Tag
```typescript
export async function deleteTag(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
```

---

## Validation Rules

| Rule | Constraint | Error |
|------|-----------|-------|
| Non-empty | `LENGTH(TRIM(name)) > 0` | "Tag name cannot be empty" |
| Max length | `LENGTH(name) <= 100` | "Tag name too long" |
| No whitespace | `name = TRIM(name)` | Auto-trimmed by trigger |
| Unique per user | `UNIQUE(user_id, name)` | "Tag already exists" |

---

## Client-Side Validation (React)

```typescript
interface TagValidationError {
  field: 'name';
  message: string;
}

function validateTagName(
  name: string,
  existingTags: string[]
): TagValidationError | null {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { field: 'name', message: 'Tag name cannot be empty' };
  }

  if (trimmed.length > 100) {
    return { field: 'name', message: 'Tag name cannot exceed 100 characters' };
  }

  const isDuplicate = existingTags.some(
    t => t.toLowerCase() === trimmed.toLowerCase()
  );

  if (isDuplicate) {
    return { field: 'name', message: 'A tag with this name already exists' };
  }

  return null; // Valid
}
```

---

## Common Patterns

### Get or Create Tag
```typescript
export async function getOrCreateTag(name: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Try to find existing
  const { data: existing } = await supabase
    .from('tags')
    .select('*')
    .eq('name', name.trim())
    .maybeSingle();

  if (existing) return existing;

  // Create new
  const { data: newTag, error } = await supabase
    .from('tags')
    .insert({ user_id: user.id, name: name.trim() })
    .select()
    .single();

  if (error) throw error;
  return newTag;
}
```

### Tag Autocomplete
```typescript
export async function searchTags(query: string, limit = 10) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('tags')
    .select('id, name')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(limit);

  if (error) throw error;
  return data;
}
```

### Bulk Tag Creation
```typescript
export async function addTagsToTransaction(
  transactionId: string,
  tagNames: string[]
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Get or create all tags
  const tags = await Promise.all(
    tagNames.map(name => getOrCreateTag(name))
  );

  // Create associations
  const { error } = await supabase
    .from('transaction_tags')
    .insert(
      tags.map(tag => ({
        transaction_id: transactionId,
        tag_id: tag.id
      }))
    );

  if (error) throw error;
}
```

---

## Database Features

### Auto-Trimming
Tag names are automatically trimmed on insert/update:
```typescript
// Input: "  travel  "
// Stored: "travel"
```

### Cascade Deletion
- Deleting a user → deletes all their tags
- Deleting a tag → deletes associated budgets and transaction_tags

### RLS Protection
All queries automatically filtered by `user_id`:
```typescript
// No need to manually filter by user_id
// RLS handles this automatically
const { data } = await supabase.from('tags').select('*');
```

---

## Error Handling

```typescript
import { PostgrestError } from '@supabase/supabase-js';

function handleTagError(error: PostgrestError): string {
  // Duplicate tag name
  if (error.code === '23505') {
    return 'A tag with this name already exists';
  }

  // Empty tag name
  if (error.message.includes('Tag name cannot be empty')) {
    return 'Tag name cannot be empty';
  }

  // Max length exceeded
  if (error.code === '23514' && error.message.includes('max_length')) {
    return 'Tag name is too long (max 100 characters)';
  }

  // RLS violation
  if (error.code === '42501') {
    return 'You do not have permission to perform this action';
  }

  // Generic error
  return 'Failed to save tag. Please try again.';
}
```

---

## React Component Example

```typescript
'use client';

import { useState } from 'react';
import { createTag } from '@/app/actions/tags';

export function TagInput() {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate
      const trimmed = name.trim();
      if (trimmed.length === 0) {
        setError('Tag name cannot be empty');
        return;
      }
      if (trimmed.length > 100) {
        setError('Tag name cannot exceed 100 characters');
        return;
      }

      // Create
      await createTag(trimmed);
      setName(''); // Clear on success
    } catch (err: any) {
      setError(err.message || 'Failed to create tag');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={100}
        placeholder="Enter tag name"
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Tag'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}
```

---

## Testing Checklist

- [ ] Create tag with valid name
- [ ] Create tag with whitespace (auto-trimmed)
- [ ] Reject empty tag name
- [ ] Reject whitespace-only tag name
- [ ] Reject tag name > 100 characters
- [ ] Reject duplicate tag name (same user)
- [ ] Allow same tag name for different users
- [ ] Update tag name successfully
- [ ] Reject update to empty name
- [ ] Delete tag successfully
- [ ] Verify cascade deletion (budgets, transaction_tags)
- [ ] Verify RLS isolation (users can't see others' tags)

---

## Performance Tips

1. **Use indexes**: Always filter by `user_id` first (automatic with RLS)
2. **Limit results**: Use `.limit(N)` for autocomplete queries
3. **Batch operations**: Use bulk insert instead of multiple single inserts
4. **Cache tags**: Consider caching tag list in memory for frequent access

---

## Related Tables

- **transaction_tags**: Many-to-many relationship with transactions
- **budgets**: Budgets can be set per tag (instead of category)

---

## Documentation Links

- **Full Documentation**: `/Users/vladislav.khozhai/WebstormProjects/finance/TAGS_SCHEMA_DOCUMENTATION.md`
- **Implementation Summary**: `/Users/vladislav.khozhai/WebstormProjects/finance/TAGS_SCHEMA_SUMMARY.md`
- **Migration Files**: `/Users/vladislav.khozhai/WebstormProjects/finance/supabase/migrations/`
- **TypeScript Types**: `/Users/vladislav.khozhai/WebstormProjects/finance/src/types/database.types.ts`

---

**Last Updated**: 2025-12-16
**Schema Version**: 2.0 (with validation enhancements)
