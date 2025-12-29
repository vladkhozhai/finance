/**
 * Social Links API Route
 *
 * GET endpoint for fetching user's social links
 * Used by the social links page to load data
 */

import { NextResponse } from "next/server";
import { getSocialLinks } from "@/actions/social-links";

export async function GET() {
  try {
    const result = await getSocialLinks();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === "Unauthorized" ? 401 : 500 }
      );
    }

    return NextResponse.json({ links: result.data });
  } catch (error) {
    console.error("API error in /api/social-links:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
