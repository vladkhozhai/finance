# Profile Section - Quick Reference

## Routes

| URL | Description | Component |
|-----|-------------|-----------|
| `/profile` | Auto-redirects to `/profile/overview` | Redirect page |
| `/profile/overview` | Account info, statistics, quick actions | Server Component |
| `/profile/payment-methods` | Manage payment methods | Embedded from main page |
| `/profile/categories` | Manage transaction categories | Embedded from main page |
| `/profile/tags` | Manage transaction tags | Embedded from main page |
| `/profile/preferences` | App preferences and currency | Server + Client Form |

## Key Files

### Layout & Navigation
- **Layout:** `/src/app/(dashboard)/profile/layout.tsx`
- **Sidebar:** `/src/components/profile/profile-sidebar.tsx`

### Pages
- **Overview:** `/src/app/(dashboard)/profile/overview/page.tsx`
- **Payment Methods:** `/src/app/(dashboard)/profile/payment-methods/page.tsx`
- **Categories:** `/src/app/(dashboard)/profile/categories/page.tsx`
- **Tags:** `/src/app/(dashboard)/profile/tags/page.tsx`
- **Preferences:** `/src/app/(dashboard)/profile/preferences/page.tsx`
- **Preferences Form:** `/src/app/(dashboard)/profile/preferences/preferences-form.tsx`

### Actions
- **Profile Actions:** `/src/app/actions/profile.ts`
  - `updateCurrency(data)`
  - `updatePreferences(data)`
  - `getUserProfile()`

## Adding a New Profile Section

### 1. Create the route directory
```bash
mkdir -p src/app/(dashboard)/profile/new-section
```

### 2. Create page.tsx
```typescript
// src/app/(dashboard)/profile/new-section/page.tsx
export default async function NewSectionPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Section</h1>
        <p className="text-muted-foreground mt-2">
          Description of new section
        </p>
      </div>

      {/* Content here */}
    </div>
  );
}
```

### 3. Add to sidebar navigation
```typescript
// src/components/profile/profile-sidebar.tsx
import { NewIcon } from "lucide-react";

const navItems = [
  // ... existing items
  {
    label: "New Section",
    href: "/profile/new-section",
    icon: NewIcon,
  },
];
```

### 4. Test the route
```bash
npm run build
# Verify route appears in build output
```

## Styling Guide

### Page Container
```tsx
<div className="space-y-8">
  {/* Header */}
  <div>
    <h1 className="text-3xl font-bold tracking-tight">Page Title</h1>
    <p className="text-muted-foreground mt-2">Page description</p>
  </div>

  {/* Content */}
</div>
```

### Section Cards
```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Section Title</CardTitle>
    <CardDescription>Section description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Statistics Card
```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Stat Name</CardTitle>
    <Icon className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{value}</div>
    <p className="text-xs text-muted-foreground mt-1">Description</p>
  </CardContent>
</Card>
```

## Common Patterns

### Fetching User Profile
```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  redirect("/login");
}

const { data: profile } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .single();
```

### Fetching Statistics
```typescript
const { count: transactionCount } = await supabase
  .from("transactions")
  .select("*", { count: "exact", head: true })
  .eq("user_id", user.id);
```

### Client Form with Server Action
```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/hooks/use-toast";

export function MyForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const { handleSubmit, ...form } = useForm({
    resolver: zodResolver(mySchema),
    defaultValues: { ... },
  });

  const onSubmit = (data) => {
    startTransition(async () => {
      const result = await myServerAction(data);

      if (result.success) {
        toast.success("Success!", { description: "..." });
        router.refresh();
      } else {
        toast.error("Error", { description: result.error });
      }
    });
  };

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
}
```

## Responsive Breakpoints

- **Mobile:** `< 768px` - Sidebar as drawer
- **Desktop:** `≥ 768px` - Fixed sidebar (240px)

## Icons Used

| Section | Icon | Import |
|---------|------|--------|
| Overview | User | `import { User } from "lucide-react"` |
| Payment Methods | CreditCard | `import { CreditCard } from "lucide-react"` |
| Categories | FolderOpen | `import { FolderOpen } from "lucide-react"` |
| Tags | Tag | `import { Tag } from "lucide-react"` |
| Preferences | Settings | `import { Settings } from "lucide-react"` |

## Toast Notifications

```typescript
import { useToast } from "@/lib/hooks/use-toast";

const { toast } = useToast();

// Success
toast.success("Title", {
  description: "Description text",
});

// Error
toast.error("Title", {
  description: "Error message",
});

// Info
toast.info("Title", {
  description: "Info message",
});

// Warning
toast.warning("Title", {
  description: "Warning message",
});
```

## Server Actions Pattern

```typescript
"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const mySchema = z.object({
  field: z.string(),
});

export async function myAction(data: z.infer<typeof mySchema>) {
  // 1. Validate
  const validated = mySchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false as const,
      error: validated.error.issues[0]?.message || "Invalid input",
    };
  }

  // 2. Check auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false as const, error: "Not authenticated" };
  }

  // 3. Perform database operation
  const { error } = await supabase
    .from("table")
    .update(validated.data)
    .eq("user_id", user.id);

  if (error) {
    return { success: false as const, error: error.message };
  }

  // 4. Revalidate cache
  revalidatePath("/profile/section");

  return { success: true as const, data: validated.data };
}
```

## Debugging Tips

### Check active route
```typescript
"use client";
import { usePathname } from "next/navigation";

const pathname = usePathname();
console.log("Current path:", pathname);
```

### Check user authentication
```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log("User:", user?.email);
```

### Check profile data
```typescript
const { data: profile } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .single();
console.log("Profile:", profile);
```

### Check build output
```bash
npm run build | grep profile
```

## Common Issues

### Issue: Route not working
**Solution:** Check that `page.tsx` exists in the route directory

### Issue: Sidebar not highlighting active route
**Solution:** Verify `usePathname()` matches the href exactly

### Issue: Form not submitting
**Solution:** Check Server Action is imported and called correctly

### Issue: Toast not showing
**Solution:** Ensure `<Toaster />` is in root layout

### Issue: Mobile sidebar not opening
**Solution:** Check Sheet component is properly implemented

## Performance Tips

1. **Use Server Components by default**
   - Only use "use client" when absolutely needed

2. **Fetch data in parallel**
   ```typescript
   const [profile, stats] = await Promise.all([
     getProfile(),
     getStats(),
   ]);
   ```

3. **Revalidate only necessary paths**
   ```typescript
   revalidatePath("/profile/section"); // Not entire site
   ```

4. **Use loading states**
   ```typescript
   <Suspense fallback={<Skeleton />}>
     <DataComponent />
   </Suspense>
   ```

## Testing Checklist

- [ ] All routes accessible
- [ ] Sidebar highlights active route
- [ ] Mobile drawer opens/closes
- [ ] Forms validate correctly
- [ ] Server Actions work
- [ ] Toast notifications show
- [ ] Data refreshes after save
- [ ] Redirects work from old URLs
- [ ] No console errors
- [ ] Build succeeds

---

**Last Updated:** 2025-12-19
**Maintained By:** Frontend Developer Team
