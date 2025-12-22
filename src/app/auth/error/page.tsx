/**
 * Auth Error Page
 *
 * Displays user-friendly error messages for authentication failures.
 * Includes options to retry or request a new confirmation email.
 */

import Link from "next/link";
import { AlertCircle, ArrowLeft, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResendConfirmationButton } from "@/components/features/auth/resend-confirmation-button";

// Force dynamic rendering
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AuthErrorPage(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;
  const error = (searchParams.error as string) || "unknown";
  const message =
    (searchParams.message as string) ||
    "An authentication error occurred. Please try again.";

  // Determine if this is an expired/invalid link error
  const isExpiredError =
    error === "otp_expired" ||
    error === "invalid_code" ||
    error === "exchange_failed" ||
    error === "verification_failed" ||
    message.toLowerCase().includes("expired") ||
    message.toLowerCase().includes("invalid");

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl">Authentication Error</CardTitle>
          <CardDescription className="text-base">{message}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isExpiredError && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-2">What happened?</p>
              <p>
                Email confirmation links expire after a certain time for
                security reasons. You can request a new confirmation email
                below.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              What would you like to do?
            </p>

            {isExpiredError && <ResendConfirmationButton />}

            <Button variant="outline" className="w-full" asChild>
              <Link href="/signup">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try signing up again
              </Link>
            </Button>

            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Link>
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2 text-center text-xs text-muted-foreground">
          <p>
            If this problem persists, please contact support with error code:{" "}
            <code className="rounded bg-muted px-1 py-0.5">{error}</code>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
