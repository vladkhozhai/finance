"use client";

/**
 * Resend Confirmation Button
 *
 * Allows users to request a new email confirmation link.
 * Shows a form to enter email and handles the resend action.
 */

import { useState } from "react";
import { Mail, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resendConfirmationEmail } from "@/app/actions/auth";

export function ResendConfirmationButton() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResend = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await resendConfirmationEmail(email);

      if (!result.success) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Failed to send confirmation email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-800 dark:text-green-200">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          <p className="font-medium">Confirmation email sent!</p>
        </div>
        <p className="mt-1 text-xs">
          Please check your inbox and spam folder for the new confirmation link.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="resend-email" className="text-sm">
          Email address
        </Label>
        <Input
          id="resend-email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      <Button
        onClick={handleResend}
        disabled={isLoading || !email}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Mail className="mr-2 h-4 w-4" />
            Resend confirmation email
          </>
        )}
      </Button>
    </div>
  );
}
