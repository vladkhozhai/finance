/**
 * Profile API Route
 *
 * GET endpoint for fetching current user's profile data.
 * Used by the profile form to load existing data.
 */

import { NextResponse } from "next/server";
import { getProfile } from "@/actions/profile";

/**
 * GET /api/profile
 * Fetches the current user's profile data
 */
export async function GET() {
  try {
    const result = await getProfile();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({ profile: result.data }, { status: 200 });
  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
