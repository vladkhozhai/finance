import { LoginForm } from "@/components/features/auth/login-form";

// Force dynamic rendering to enable Server Actions
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
      <LoginForm />
    </main>
  );
}
