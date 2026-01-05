/**
 * Certifications API Route
 *
 * GET /api/certifications - Returns user's certifications
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch certifications
    const { data: certifications, error: fetchError } = await supabase
      .from("cv_certifications")
      .select("*")
      .eq("user_id", user.id)
      .order("display_order", { ascending: true })
      .order("issue_date", { ascending: false });

    if (fetchError) {
      console.error("Certifications fetch error:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch certifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({ certifications: certifications || [] });
  } catch (error) {
    console.error("Unexpected error in certifications API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
