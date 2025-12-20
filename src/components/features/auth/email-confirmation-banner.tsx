/**
 * Email Confirmation Banner Component
 *
 * Displays a prominent banner after successful signup
 * informing users to check their email for confirmation.
 */

"use client";

import { Mail } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function EmailConfirmationBanner() {
  return (
    <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
      <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      <AlertTitle className="text-blue-900 dark:text-blue-100">
        Check your email
      </AlertTitle>
      <AlertDescription className="text-blue-800 dark:text-blue-200">
        Account created successfully! Please check your email to confirm your
        account before logging in.
      </AlertDescription>
    </Alert>
  );
}
