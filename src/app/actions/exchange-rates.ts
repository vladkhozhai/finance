"use server";

import { exchangeRateService } from "@/lib/services/exchange-rate-service";

/**
 * Server Action: Get Exchange Rate
 *
 * Fetches exchange rate between two currencies using the exchange rate service.
 * This action maintains proper server/client boundaries by wrapping server-side
 * code that uses next/headers (Supabase server client).
 *
 * @param params - Exchange rate query parameters
 * @returns Action result with rate or error message
 */
export async function getExchangeRate(params: {
  from: string;
  to: string;
  date?: string;
}): Promise<{ success: boolean; data?: number; error?: string }> {
  try {
    // Validate input
    if (!params.from || !params.to) {
      return {
        success: false,
        error: "Both 'from' and 'to' currencies are required",
      };
    }

    // Handle identity conversion
    if (params.from === params.to) {
      return {
        success: true,
        data: 1.0,
      };
    }

    // Parse date if provided
    const targetDate = params.date ? new Date(params.date) : undefined;

    // Fetch rate from service
    const result = await exchangeRateService.getRate(
      params.from,
      params.to,
      targetDate,
    );

    if (result.rate === null) {
      return {
        success: false,
        error: `Exchange rate not found for ${params.from} to ${params.to}`,
      };
    }

    // Log stale rate warnings
    if (result.source === "stale") {
      console.warn(
        `Using stale exchange rate: ${params.from} → ${params.to} = ${result.rate}`,
      );
    }

    return {
      success: true,
      data: result.rate,
    };
  } catch (error) {
    console.error("Error in getExchangeRate action:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch exchange rate",
    };
  }
}
