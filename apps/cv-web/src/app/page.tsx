/**
 * Root page - redirects are handled by middleware
 * This page should never be rendered as middleware redirects to /sign-in or /dashboard
 */

import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/sign-in");
}
