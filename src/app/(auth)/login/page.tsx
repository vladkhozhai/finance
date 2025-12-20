import { LoginForm } from "@/components/features/auth/login-form";
import { EmailConfirmationBanner } from "@/components/features/auth/email-confirmation-banner";

// Force dynamic rendering to enable Server Actions
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function LoginPage(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;
  const showConfirmation = searchParams.confirmed === "pending";

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
      <div className="w-full max-w-md space-y-4">
        {showConfirmation && <EmailConfirmationBanner />}
        <LoginForm />
      </div>
    </main>
  );
}
