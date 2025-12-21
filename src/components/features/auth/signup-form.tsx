/**
 * Signup Form Component
 *
 * User registration form
 * Includes email, password, and confirm password fields
 *
 * @client component - uses react-hook-form and Supabase auth
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { signUp } from "@/app/actions/auth";
import { signUpSchema } from "@/lib/validations/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Signup form validation schema (extends server schema with confirmPassword)
// Note: We explicitly override currency to be required (no default) for type safety
const signupSchema = signUpSchema
  .extend({
    confirmPassword: z.string().min(1, "Please confirm your password"),
    currency: z.string().min(1, "Currency is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

// Common currencies
const currencies = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "UAH", label: "UAH - Ukrainian Hryvnia" },
];

export function SignupForm() {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      currency: "USD",
    },
  });

  const currencyValue = watch("currency");

  const onSubmit = (data: SignupFormData) => {
    // Clear previous errors
    setServerError(null);

    startTransition(async () => {
      try {
        const result = await signUp({
          email: data.email,
          password: data.password,
          currency: data.currency,
        });

        if (!result.success) {
          setServerError(result.error);
          toast.error("Signup failed", {
            description: result.error,
          });
        }
        // Success case will redirect automatically
      } catch (error) {
        // Don't show error for Next.js redirects (successful signup)
        if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
          return;
        }
        const errorMessage = "An unexpected error occurred. Please try again.";
        setServerError(errorMessage);
        toast.error("Signup failed", {
          description: errorMessage,
        });
      }
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle as="h1">Create an account</CardTitle>
        <CardDescription>
          Get started with FinanceFlow and take control of your finances
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              disabled={isPending}
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password"
              autoComplete="new-password"
              disabled={isPending}
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              autoComplete="new-password"
              disabled={isPending}
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Preferred Currency</Label>
            <Select
              value={currencyValue}
              onValueChange={(value) => setValue("currency", value)}
              disabled={isPending}
            >
              <SelectTrigger id="currency" aria-invalid={!!errors.currency}>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.currency && (
              <p className="text-sm text-destructive">
                {errors.currency.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating account..." : "Create account"}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
