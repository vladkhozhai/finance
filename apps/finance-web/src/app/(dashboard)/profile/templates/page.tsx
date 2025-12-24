/**
 * Profile - Templates Page
 *
 * Manages transaction templates for the user.
 * Displays all templates in a grid with create, edit, delete, and use actions.
 */

import { getTemplates } from "@/app/actions/templates";
import { TemplatesPageClient } from "./templates-page-client";

export default async function ProfileTemplatesPage() {
  // Fetch all templates
  const result = await getTemplates();
  const templates = result.success ? result.data : [];

  return <TemplatesPageClient initialTemplates={templates} />;
}
