/**
 * Toast Provider Component
 *
 * Wrapper for Sonner toast notifications
 * Provides toast functionality throughout the app
 *
 * @client component - uses Sonner library
 */

"use client";

import { Toaster } from "@/components/ui/sonner";

export function ToastProvider() {
  return <Toaster />;
}
