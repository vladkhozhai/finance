/**
 * Dashboard Redirect Page
 *
 * Redirects /dashboard to / (the actual dashboard location)
 * This handles the case where users try to access /dashboard directly
 */

import { redirect } from "next/navigation";

export default function DashboardRedirect() {
  redirect("/");
}
