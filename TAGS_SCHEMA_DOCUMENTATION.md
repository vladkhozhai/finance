# Tags Schema Documentation

## Overview
The tags table provides a flexible labeling system for transactions, allowing users to classify and filter their financial data beyond rigid category structures. Tags support many-to-many relationships with transactions through the `transaction_tags` junction table.

## Table Structure

### Tags Table (`public.tags`)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | uuid_generate_v4() | Primary key |
| `user_id` | uuid | NOT NULL | - | Foreign key to auth.users (CASCADE on delete) |
| `name` | text | NOT NULL | - | Tag name (1-100 chars, trimmed, unique per user) |
| `created_at` | timestamptz | NOT NULL | now() | Timestamp of creation |
| `updated_at` | timestamptz | NOT NULL | now() | Timestamp of last update |

## Constraints

### Primary Key
- `tags_pkey`: PRIMARY KEY on `id`

### Foreign Keys
- `tags_user_id_fkey`: FOREIGN KEY (`user_id`) REFERENCES `auth.users(id)` ON DELETE CASCADE
  - When a user is deleted, all their tags are automatically deleted

### Unique Constraints
- `tags_user_id_name_key`: UNIQUE (`user_id`, `name`)
  - Each user can only have one tag with a given name
  - Prevents duplicate tag names within a user's account
  - Different users can have tags with the same name

### Check Constraints
1. `tags_name_not_empty`: `LENGTH(TRIM(name)) > 0`
   - Tag name must not be empty after trimming whitespace

2. `tags_name_max_length`: `LENGTH(name) <= 100`
   - Tag name cannot exceed 100 characters

3. `tags_name_trimmed`: `name = TRIM(name)`
   - Tag name must not have leading or trailing whitespace
   - This is enforced by the trigger, but the constraint provides an extra safety layer

## Indexes

1. `tags_pkey` (PRIMARY KEY): B-tree index on `id`
   - Provides fast lookups by tag ID

2. `tags_user_id_name_key` (UNIQUE): B-tree index on `(user_id, name)`
   - Enforces uniqueness constraint
   - Enables fast lookups of tags by user and name

3. `idx_tags_user_id`: B-tree index on `user_id`
   - Speeds up queries filtering by user_id
   - Essential for RLS policy performance

## Triggers

### 1. `trim_tag_name_trigger`
**Timing**: BEFORE INSERT OR UPDATE
**Function**: `trim_tag_name()`

**Purpose**: Automatically trims whitespace from tag names and validates non-empty constraint

**Behavior**:
- Automatically removes leading and trailing whitespace from `name`
- Raises an exception if the trimmed name is empty
- Ensures data consistency without requiring client-side validation

**Example**:
```sql
-- Input: "  travel  "
-- Stored as: "travel"

-- Input: "   "
-- Result: ERROR - Tag name cannot be empty
```

### 2. `update_tags_updated_at`
**Timing**: BEFORE UPDATE
**Function**: `update_updated_at_column()`

**Purpose**: Automatically updates the `updated_at` timestamp on every update

**Behavior**:
- Sets `updated_at = NOW()` before any update
- Provides automatic audit trail of modifications

## Row Level Security (RLS) Policies

RLS is **ENABLED** on the tags table. All policies use `auth.uid()` to ensure users can only access their own data.

### SELECT Policy: "Users can view own tags"
```sql
USING (auth.uid() = user_id)
```
- Users can only view tags where they are the owner
- Prevents cross-user data leakage

### INSERT Policy: "Users can insert own tags"
```sql
WITH CHECK (auth.uid() = user_id)
```
- Users can only create tags for themselves
- Prevents users from creating tags for other users

### UPDATE Policy: "Users can update own tags"
```sql
USING (auth.uid() = user_id)
```
- Users can only update their own tags
- Cannot modify other users' tags

### DELETE Policy: "Users can delete own tags"
```sql
USING (auth.uid() = user_id)
```
- Users can only delete their own tags
- Cannot delete other users' tags

## Relationships

### Referenced By (Parent Table)
1. **budgets** → `budgets.tag_id` references `tags.id` (CASCADE on delete)
   - When a tag is deleted, all budgets using that tag are also deleted

2. **transaction_tags** → `transaction_tags.tag_id` references `tags.id` (CASCADE on delete)
   - When a tag is deleted, all associations with transactions are removed

## TypeScript Types

```typescript
// From generated database.types.ts
type Tag = {
  id: string;              // uuid
  user_id: string;         // uuid
  name: string;            // text (1-100 chars, trimmed)
  created_at: string;      // timestamptz (ISO 8601 string)
  updated_at: string;      // timestamptz (ISO 8601 string)
};

type TagInsert = {
  id?: string;             // optional, auto-generated
  user_id: string;         // required
  name: string;            // required (will be auto-trimmed)
  created_at?: string;     // optional, defaults to NOW()
  updated_at?: string;     // optional, defaults to NOW()
};

type TagUpdate = {
  id?: string;
  user_id?: string;
  name?: string;           // will be auto-trimmed if provided
  created_at?: string;
  updated_at?: string;     // automatically set by trigger
};
```

## Usage Examples

### Creating a Tag
```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = createClient();

// Create a new tag
const { data, error } = await supabase
  .from('tags')
  .insert({
    user_id: userId,  // Required
    name: 'coffee'    // Required (will be auto-trimmed)
  })
  .select()
  .single();
```

### Retrieving User's Tags
```typescript
// Get all tags for the current user (RLS automatically filters)
const { data: tags, error } = await supabase
  .from('tags')
  .select('*')
  .order('name');  // Order alphabetically
```

### Updating a Tag
```typescript
// Rename a tag
const { error } = await supabase
  .from('tags')
  .update({ name: 'morning-coffee' })
  .eq('id', tagId);
```

### Deleting a Tag
```typescript
// Delete a tag (cascades to budgets and transaction_tags)
const { error } = await supabase
  .from('tags')
  .delete()
  .eq('id', tagId);
```

### Finding Tags by Name (Case-Insensitive)
```typescript
// Search for tags containing "trav"
const { data: tags, error } = await supabase
  .from('tags')
  .select('*')
  .ilike('name', '%trav%')
  .order('name');
```

## Validation Rules

### Client-Side Validation (Recommended)
Before submitting to the database, client code should validate:

1. **Non-empty**: Tag name must not be empty or whitespace-only
   ```typescript
   if (name.trim().length === 0) {
     throw new Error('Tag name cannot be empty');
   }
   ```

2. **Length limit**: Tag name must not exceed 100 characters
   ```typescript
   if (name.length > 100) {
     throw new Error('Tag name cannot exceed 100 characters');
   }
   ```

3. **Uniqueness**: Check if tag name already exists for user
   ```typescript
   const { data } = await supabase
     .from('tags')
     .select('id')
     .eq('name', name.trim())
     .maybeSingle();

   if (data) {
     throw new Error('A tag with this name already exists');
   }
   ```

### Server-Side Validation (Enforced)
The database enforces all validation rules automatically:
- Auto-trimming via trigger
- Non-empty constraint via check constraint
- Max length constraint via check constraint
- Uniqueness constraint via unique index
- User isolation via RLS policies

## Performance Considerations

### Indexes
- All user-specific queries benefit from `idx_tags_user_id`
- Tag lookups by name use the composite unique index `tags_user_id_name_key`
- Tag ID lookups use the primary key index `tags_pkey`

### Query Optimization Tips

1. **Filter by user_id first** (when not using RLS)
   ```sql
   -- Good: Uses idx_tags_user_id
   SELECT * FROM tags WHERE user_id = ? AND name ILIKE '%search%';
   ```

2. **Use exact matches when possible**
   ```sql
   -- Best: Uses tags_user_id_name_key (index-only scan)
   SELECT * FROM tags WHERE user_id = ? AND name = ?;
   ```

3. **Limit results** when displaying tag lists
   ```sql
   -- Good for autocomplete
   SELECT * FROM tags WHERE user_id = ? ORDER BY name LIMIT 10;
   ```

## Migration History

1. **20251210000001_initial_schema.sql**
   - Created tags table with basic structure
   - Added RLS policies (SELECT, INSERT, UPDATE, DELETE)
   - Created index on user_id
   - Added unique constraint on (user_id, name)
   - Created foreign key to auth.users with CASCADE
   - Added updated_at trigger

2. **20251216000002_add_tag_name_validation.sql**
   - Added check constraint: `tags_name_not_empty`
   - Added check constraint: `tags_name_max_length`
   - Added check constraint: `tags_name_trimmed`
   - Created `trim_tag_name()` function
   - Created `trim_tag_name_trigger` for auto-trimming
   - Added table and column comments

## Security Considerations

### RLS Protection
- **Enabled**: RLS is active on the tags table
- **User Isolation**: All policies ensure users can only access their own tags
- **No Bypass**: No policies use `SECURITY DEFINER` to bypass RLS

### Cascade Deletion
- **User Deletion**: When a user account is deleted, all their tags are automatically removed
- **Tag Deletion**: When a tag is deleted, all related budgets and transaction associations are removed
- **Data Integrity**: Foreign key constraints ensure referential integrity

### Data Validation
- **Input Sanitization**: Trigger automatically trims whitespace
- **Length Limits**: Maximum 100 characters prevents abuse
- **Non-Empty**: Cannot create meaningless empty tags
- **No SQL Injection**: Parameterized queries and type-safe Supabase client prevent injection

## Common Patterns

### Tag Autocomplete
```typescript
async function searchTags(query: string, userId: string, limit = 10) {
  const { data, error } = await supabase
    .from('tags')
    .select('id, name')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(limit);

  return data || [];
}
```

### Create Tag If Not Exists
```typescript
async function getOrCreateTag(name: string, userId: string) {
  // Try to find existing tag
  const { data: existing } = await supabase
    .from('tags')
    .select('*')
    .eq('name', name.trim())
    .maybeSingle();

  if (existing) return existing;

  // Create new tag
  const { data: newTag, error } = await supabase
    .from('tags')
    .insert({ user_id: userId, name: name.trim() })
    .select()
    .single();

  if (error) throw error;
  return newTag;
}
```

### Bulk Tag Association
```typescript
async function addTagsToTransaction(
  transactionId: string,
  tagNames: string[],
  userId: string
) {
  // Get or create all tags
  const tags = await Promise.all(
    tagNames.map(name => getOrCreateTag(name, userId))
  );

  // Create transaction_tags associations
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

## Testing

### Validation Tests
See `/Users/vladislav.khozhai/WebstormProjects/finance/test_tags_validation.sql` for comprehensive validation tests including:

1. ✅ Valid tag creation
2. ✅ Automatic whitespace trimming
3. ✅ Empty tag name rejection
4. ✅ Whitespace-only tag name rejection
5. ✅ Tag name > 100 chars rejection
6. ✅ Duplicate tag name rejection (same user)
7. ✅ Same tag name allowed for different users
8. ✅ Tag update with valid name
9. ✅ Empty tag name update rejection
10. ✅ Tag deletion
11. ✅ RLS policy enforcement

### Running Tests
```bash
# Run all validation tests
docker exec -i supabase_db_finance psql -U postgres -d postgres < test_tags_validation.sql
```

## Troubleshooting

### Common Errors

**Error**: `duplicate key value violates unique constraint "tags_user_id_name_key"`
- **Cause**: Attempting to create a tag with a name that already exists for the user
- **Solution**: Check for existing tags before creation, or use "get or create" pattern

**Error**: `Tag name cannot be empty`
- **Cause**: Attempting to create/update a tag with empty or whitespace-only name
- **Solution**: Validate input on client side before submission

**Error**: `new row violates check constraint "tags_name_max_length"`
- **Cause**: Tag name exceeds 100 characters
- **Solution**: Implement max length validation on client side

**Error**: `new row violates row-level security policy for table "tags"`
- **Cause**: Attempting to create a tag for a different user, or not authenticated
- **Solution**: Ensure `auth.uid()` matches `user_id`, verify user is authenticated

## Best Practices

1. **Always trim input**: While the trigger handles this, validate client-side for better UX
2. **Check for duplicates**: Provide immediate feedback before attempting to create
3. **Use lowercase**: Consider normalizing tag names to lowercase for consistency
4. **Limit autocomplete**: Use LIMIT in autocomplete queries to maintain performance
5. **Batch operations**: When adding multiple tags, use batch insert to reduce round trips
6. **Handle cascades**: Be aware that deleting a tag removes all budgets and transaction associations
7. **Provide confirmation**: Warn users before deleting tags with existing associations

## Future Enhancements

Potential improvements to consider:

1. **Tag usage count**: Add a function to count how many transactions use each tag
2. **Tag merging**: Function to merge two tags (update all references to one tag)
3. **Tag colors**: Add optional color field for visual distinction
4. **Tag categories**: Group tags into categories for organization
5. **Soft delete**: Add `deleted_at` field for recoverable deletion
6. **Tag suggestions**: ML-based tag suggestions based on transaction descriptions
