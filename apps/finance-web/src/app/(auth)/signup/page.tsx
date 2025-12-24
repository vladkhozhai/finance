import { SignupForm } from "@/components/features/auth/signup-form";

// Force dynamic rendering to enable Server Actions
export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
      <SignupForm />
    </main>
  );
}
