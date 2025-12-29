import { redirect } from "next/navigation";
import { SignupForm } from "@/components/features/auth/signup-form";
import { createClient } from "@/lib/supabase/server";

// Force dynamic rendering to enable Server Actions
export const dynamic = "force-dynamic";

export default async function SignupPage() {
  // Check if user is already authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to dashboard if already signed in
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
      <SignupForm />
    </main>
  );
}
