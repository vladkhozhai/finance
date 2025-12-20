# TagSelector Component

A fully-featured, accessible multi-select combobox component for managing tags in FinanceFlow. Built with Shadcn/UI Command component following the Combobox pattern.

## Features

- **Multi-Select**: Select multiple tags with visual badges
- **Search & Filter**: Quickly find tags by typing
- **On-the-Fly Creation**: Create new tags without leaving the form
- **Keyboard Navigation**: Full keyboard support (arrow keys, Enter, Escape)
- **Accessibility**: ARIA labels, screen reader support, focus management
- **Max Tags Limit**: Optionally limit the number of selectable tags
- **Loading States**: Visual feedback during tag creation
- **Disabled State**: Support for read-only views
- **Toast Notifications**: Success/error feedback for user actions

## Installation

The component is already integrated with the project's tag system. Simply import it:

```tsx
import { TagSelector } from "@/components/tags";
```

## Basic Usage

```tsx
"use client";

import { useState } from "react";
import { TagSelector } from "@/components/tags";

export function MyForm() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  return (
    <TagSelector
      value={selectedTags}
      onChange={setSelectedTags}
      placeholder="Select tags..."
    />
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `string[]` | Yes | - | Array of selected tag IDs |
| `onChange` | `(tagIds: string[]) => void` | Yes | - | Callback when selection changes |
| `disabled` | `boolean` | No | `false` | Disable the component |
| `placeholder` | `string` | No | `"Select tags..."` | Input placeholder text |
| `maxTags` | `number` | No | `undefined` | Maximum number of tags allowed |

## Advanced Examples

### With Max Tags Limit

Limit users to a specific number of tags:

```tsx
<TagSelector
  value={selectedTags}
  onChange={setSelectedTags}
  maxTags={5}
  placeholder="Select up to 5 tags..."
/>
```

### Disabled State

For read-only views or during form submission:

```tsx
<TagSelector
  value={selectedTags}
  onChange={setSelectedTags}
  disabled={isSubmitting}
/>
```

### Pre-populated Tags (Edit Forms)

Load existing tags when editing:

```tsx
const [selectedTags, setSelectedTags] = useState<string[]>(
  transaction.tags.map(tag => tag.id)
);

<TagSelector
  value={selectedTags}
  onChange={setSelectedTags}
/>
```

### In a Form with React Hook Form

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TagSelector } from "@/components/tags";

const formSchema = z.object({
  tagIds: z.array(z.string()).min(1, "At least one tag is required"),
  // ... other fields
});

export function TransactionForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tagIds: [],
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <TagSelector
        value={form.watch("tagIds")}
        onChange={(tagIds) => form.setValue("tagIds", tagIds)}
      />
      {form.formState.errors.tagIds && (
        <p className="text-sm text-red-600">
          {form.formState.errors.tagIds.message}
        </p>
      )}
      {/* ... other form fields */}
    </form>
  );
}
```

## User Interactions

### Selecting Tags

1. Click the selector button to open the dropdown
2. Type to search for tags
3. Click a tag to select/deselect it
4. Selected tags appear as badges above the input

### Creating New Tags

1. Type a tag name that doesn't exist
2. Click "Create 'tagname'" option
3. The new tag is created and automatically added to selection
4. A success toast notification appears

### Removing Tags

- Click the X button on individual badges, or
- Click "Clear all" button to remove all tags at once

### Keyboard Navigation

- `Tab`: Focus the selector
- `Enter`: Open dropdown
- `↑/↓`: Navigate through tags
- `Enter`: Select/deselect highlighted tag
- `Escape`: Close dropdown
- `Tab` (on badge): Focus next badge X button

## Accessibility

The component follows WCAG 2.1 Level AA standards:

- **Semantic HTML**: Proper button and list elements
- **ARIA Labels**: All interactive elements have descriptive labels
- **Keyboard Support**: Full keyboard navigation
- **Focus Management**: Proper focus indicators and order
- **Screen Readers**: Announces selections and changes
- **Color Contrast**: Meets minimum contrast ratios

### ARIA Attributes

- `role="combobox"` on trigger button
- `aria-expanded` to indicate dropdown state
- `aria-label` on remove buttons
- `aria-disabled` when component is disabled

## Component Architecture

### Dependencies

- **Shadcn/UI Components**:
  - `Command`: Base combobox functionality
  - `Popover`: Dropdown container
  - `Badge`: Selected tags display
  - `Button`: Trigger and actions
- **Server Actions**: `getTags()`, `createTag()`
- **Hooks**: `useToast()` for notifications

### State Management

The component is **fully controlled**:
- Parent component manages selected tag IDs
- Component fetches available tags on mount
- Tag creation updates local and server state

### Error Handling

- Failed tag fetch: Toast error notification
- Failed tag creation: Toast error notification
- Duplicate tag names: Backend returns existing tag
- Network errors: Graceful fallback with error messages

## Demo Page

Visit `/tag-selector-demo` to see live examples:

1. **Basic Usage**: Default behavior
2. **Pre-selected Tags**: Simulates edit forms
3. **Disabled State**: Toggle enabled/disabled
4. **Max Tags Limit**: Enforces 3-tag maximum

## Integration Guide

### Step 1: Import Component

```tsx
import { TagSelector } from "@/components/tags";
```

### Step 2: Add State

```tsx
const [tagIds, setTagIds] = useState<string[]>([]);
```

### Step 3: Render Component

```tsx
<TagSelector value={tagIds} onChange={setTagIds} />
```

### Step 4: Use in Form Submission

```tsx
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  const result = await createTransaction({
    // ... other fields
    tagIds: tagIds, // Pass selected tag IDs
  });

  if (result.success) {
    // Handle success
  }
};
```

## Performance Considerations

- **Debounced Search**: No debounce needed (cmdk handles filtering)
- **Optimistic Updates**: New tags appear immediately
- **Memoization**: Filtered lists are computed efficiently
- **Lazy Loading**: Tags loaded only when component mounts

## Testing

The component includes:

- **TypeScript**: Full type safety
- **Accessibility**: Keyboard and screen reader support
- **Error States**: Handles API failures gracefully
- **Loading States**: Shows feedback during async operations

Run the demo page to test all features:

```bash
npm run dev
# Navigate to http://localhost:3000/tag-selector-demo
```

## Troubleshooting

### Tags not loading

Ensure user is authenticated and has access to tags:
```tsx
// Check if getTags() Server Action is working
const result = await getTags();
console.log(result);
```

### Tag creation fails

Check validation schema in `/src/lib/validations/tag.ts`:
```tsx
// Tag name must be 1-50 characters
const name = "My Tag"; // Valid
```

### Duplicate tag handling

Backend automatically returns existing tag if name matches:
```tsx
// Creating "Food" twice returns same tag ID
const result1 = await createTag({ name: "Food" });
const result2 = await createTag({ name: "Food" });
// result1.data.id === result2.data.id
```

## Future Enhancements

Potential improvements for future versions:

- [ ] Tag colors/icons for visual categorization
- [ ] Tag usage statistics (# of transactions)
- [ ] Bulk tag operations (merge, rename)
- [ ] Tag suggestions based on transaction data
- [ ] Drag-and-drop tag reordering
- [ ] Tag hierarchies/categories

## Related Components

- **TagCard**: Display individual tag with actions
- **TagList**: List all tags with filtering
- **CreateTagDialog**: Standalone tag creation dialog
- **EditTagDialog**: Edit existing tags
- **DeleteTagDialog**: Delete tags with confirmation

## API Reference

### Server Actions Used

```typescript
// Fetch all user tags
getTags(): Promise<ActionResult<Tag[]>>

// Create new tag (or return existing)
createTag(input: CreateTagInput): Promise<ActionResult<{ id: string; name: string }>>
```

### Type Definitions

```typescript
type Tag = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

interface TagSelectorProps {
  value: string[];
  onChange: (tagIds: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  maxTags?: number;
}
```

## Support

For issues or questions:
1. Check the demo page: `/tag-selector-demo`
2. Review this documentation
3. Check Server Actions in `/src/app/actions/tags.ts`
4. Verify Supabase RLS policies for tags table
