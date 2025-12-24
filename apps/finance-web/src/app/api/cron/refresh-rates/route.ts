/**
 * Cron Endpoint: Refresh Exchange Rates
 *
 * Scheduled endpoint for refreshing exchange rates from external API.
 * Runs daily at 02:00 UTC via Vercel Cron or external scheduler.
 *
 * Security:
 * - Requires Authorization header with secret token
 * - Only GET requests allowed
 * - Returns detailed error messages for debugging
 *
 * Configuration:
 * - EXCHANGE_RATE_CRON_SECRET: Secret token for authentication
 * - Configure cron schedule in vercel.json or external service
 *
 * Usage:
 * ```bash
 * curl -X GET https://your-app.vercel.app/api/cron/refresh-rates \
 *   -H "Authorization: Bearer YOUR_SECRET_TOKEN"
 * ```
 */

import { type NextRequest, NextResponse } from "next/server";
import { exchangeRateService } from "@/lib/services/exchange-rate-service";

/**
 * GET handler for cron-triggered rate refresh.
 * Fetches latest rates from API and updates cache.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const expectedAuth = `Bearer ${process.env.EXCHANGE_RATE_CRON_SECRET}`;

    if (!process.env.EXCHANGE_RATE_CRON_SECRET) {
      console.error("EXCHANGE_RATE_CRON_SECRET not configured");
      return NextResponse.json(
        {
          error: "Server misconfiguration",
          details: "Cron secret not configured",
        },
        { status: 500 },
      );
    }

    if (authHeader !== expectedAuth) {
      console.warn("Unauthorized cron attempt:", {
        receivedHeader: authHeader ? "present" : "missing",
      });

      return NextResponse.json(
        {
          error: "Unauthorized",
          details: "Invalid or missing authorization token",
        },
        { status: 401 },
      );
    }

    // 2. Refresh all rates
    console.info("Starting scheduled exchange rate refresh...");
    const startTime = Date.now();

    await exchangeRateService.refreshAllRates();

    const duration = Date.now() - startTime;
    console.info(`Exchange rate refresh completed in ${duration}ms`);

    // 3. Return success response
    return NextResponse.json({
      success: true,
      message: "Exchange rates refreshed successfully",
      timestamp: new Date().toISOString(),
      durationMs: duration,
    });
  } catch (error) {
    console.error("Cron refresh failed:", error);

    // Return error details for debugging
    return NextResponse.json(
      {
        error: "Refresh failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

/**
 * Reject all other HTTP methods.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET" } },
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET" } },
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET" } },
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET" } },
  );
}
