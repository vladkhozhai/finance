/**
 * Profile Root Page
 *
 * Redirects to /profile/overview as the default profile page.
 * Also handles legacy query param redirects (?tab=payment-methods, etc.)
 */

import { redirect } from "next/navigation";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const tab = params.tab;

  // Handle legacy query param redirects
  if (tab) {
    switch (tab) {
      case "payment-methods":
        redirect("/profile/payment-methods");
      case "categories":
        redirect("/profile/categories");
      case "tags":
        redirect("/profile/tags");
      case "preferences":
        redirect("/profile/preferences");
      case "overview":
        redirect("/profile/overview");
      default:
        redirect("/profile/overview");
    }
  }

  // Default redirect to overview
  redirect("/profile/overview");
}
