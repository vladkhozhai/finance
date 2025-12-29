/**
 * Work Experience API Route
 *
 * GET endpoint for fetching user's work experiences
 * Used by the work experience page to load data
 */

import { NextResponse } from "next/server";
import { getWorkExperiences } from "@/actions/work-experience";

export async function GET() {
  try {
    const result = await getWorkExperiences();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === "Unauthorized" ? 401 : 500 }
      );
    }

    return NextResponse.json({ experiences: result.data });
  } catch (error) {
    console.error("API error in /api/work-experience:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
