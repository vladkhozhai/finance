/**
 * useToast Hook
 *
 * Custom hook for displaying toast notifications
 * Wraps Sonner's toast functionality
 */

"use client";

import { toast } from "sonner";

export const useToast = () => {
  return {
    toast,
    success: toast.success,
    error: toast.error,
    info: toast.info,
    warning: toast.warning,
  };
};
