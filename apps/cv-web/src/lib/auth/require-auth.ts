import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side auth check that redirects to sign-in if not authenticated.
 * Use this in server components/pages that require authentication.
 *
 * @param redirectPath - The path to redirect back to after sign-in
 * @returns The authenticated user
 */
export async function requireAuth(redirectPath?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const nextParam = redirectPath ? `?next=${encodeURIComponent(redirectPath)}` : "";
    redirect(`/sign-in${nextParam}`);
  }

  return user;
}
