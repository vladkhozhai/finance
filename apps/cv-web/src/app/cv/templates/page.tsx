import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TemplatesPageClient } from "./templates-client";

export default async function TemplatesPage() {
  // Server-side auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?next=/cv/templates");
  }

  return <TemplatesPageClient />;
}
