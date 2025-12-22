/**
 * Preferences Form Component
 *
 * Client component for updating user preferences.
 * Includes currency selector, default payment method selector, and save action.
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { updatePreferences } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/lib/hooks/use-toast";
import { getAllCurrencies } from "@/lib/utils/currency";

const preferencesSchema = z.object({
  currency: z.string().min(3).max(3),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

interface PreferencesFormProps {
  currentCurrency: string;
}

export function PreferencesForm({ currentCurrency }: PreferencesFormProps) {
  // Get all supported currencies from centralized utility (40+ currencies including UAH)
  const supportedCurrencies = getAllCurrencies();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const {
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      currency: currentCurrency,
    },
  });

  const selectedCurrency = watch("currency");

  const onSubmit = (data: PreferencesFormData) => {
    startTransition(async () => {
      const result = await updatePreferences({
        currency: data.currency,
      });

      if (result.success) {
        toast.success("Preferences updated", {
          description: "Your settings have been saved successfully.",
        });
        router.refresh();
      } else {
        toast.error("Error", {
          description: result.error,
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Currency Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Default Currency</CardTitle>
          <CardDescription>
            Choose your preferred currency for transactions and budgets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={selectedCurrency}
              onValueChange={(value) => setValue("currency", value)}
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {supportedCurrencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
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

          <div className="text-sm text-muted-foreground">
            <p>
              Your default currency is used when creating new transactions and
              budgets. You can still use multiple currencies with different
              payment methods.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Preferences (Future) */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Settings</CardTitle>
          <CardDescription>More preference options coming soon</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <div className="font-medium">Theme</div>
                <div className="text-sm text-muted-foreground">
                  Choose your preferred color scheme
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                System default
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <div className="font-medium">Language</div>
                <div className="text-sm text-muted-foreground">
                  Select your preferred language
                </div>
              </div>
              <div className="text-sm text-muted-foreground">English (US)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} size="lg">
          {isPending ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </form>
  );
}
