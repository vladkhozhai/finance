/**
 * Exchange Rate Service
 *
 * Manages currency exchange rates with caching and API integration.
 * Implements 24-hour TTL with stale-while-revalidate fallback strategy.
 *
 * Architecture:
 * - Primary: Fresh cached rates (expires_at > NOW)
 * - Fallback: Stale rates when API unavailable
 * - Pre-fetch: Daily cron job at 02:00 UTC
 * - Provider: exchangerate-api.com (1,500 req/month, no API key)
 *
 * Rate Lookup Flow:
 * 1. Check fresh cache (expires_at > NOW)
 * 2. If not found, check stale cache
 * 3. Attempt API fetch and update cache
 * 4. Use stale rate as fallback if API fails
 * 5. Return null if no rate available
 */

import {
  createClient as createServerClient,
  createAdminClient,
} from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

// Type for exchange rate API response from exchangerate-api.com
interface ExchangeRateApiResponse {
  result: "success" | "error";
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  rates: Record<string, number>;
}

// Result type for getRate() method
export interface ExchangeRateResult {
  rate: number | null;
  source: "fresh" | "stale" | "api" | "not_found";
  fetchedAt?: Date;
  expiresAt?: Date;
}

// Configuration
const API_URL =
  process.env.EXCHANGE_RATE_API_URL || "https://open.er-api.com/v6/latest/USD";
const CACHE_TTL_HOURS = Number(process.env.EXCHANGE_RATE_CACHE_TTL_HOURS) || 24;
const API_PROVIDER = "exchangerate-api.com";

/**
 * Exchange Rate Service Class
 *
 * Provides methods for fetching, caching, and managing exchange rates.
 * Singleton pattern - use the exported instance.
 */
class ExchangeRateService {
  /**
   * Get exchange rate between two currencies.
   * Uses cache-first strategy with stale fallback.
   *
   * @param fromCurrency - Source currency (ISO 4217 code)
   * @param toCurrency - Target currency (ISO 4217 code)
   * @param date - Optional date for historical rate (defaults to today)
   * @returns Exchange rate result with metadata
   *
   * @example
   * ```typescript
   * const result = await exchangeRateService.getRate('UAH', 'USD');
   * if (result.rate !== null) {
   *   console.log(`Rate: ${result.rate}, Source: ${result.source}`);
   * }
   * ```
   */
  async getRate(
    fromCurrency: string,
    toCurrency: string,
    date?: Date,
  ): Promise<ExchangeRateResult> {
    try {
      const supabase = await createServerClient();
      const targetDate = date
        ? date.toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      // 1. Check for fresh cached rate (expires_at > NOW)
      const { data: freshRate, error: freshError } = await supabase
        .from("exchange_rates")
        .select("rate, last_fetched_at, expires_at")
        .eq("from_currency", fromCurrency)
        .eq("to_currency", toCurrency)
        .lte("date", targetDate)
        .gt("expires_at", new Date().toISOString())
        .order("date", { ascending: false })
        .limit(1)
        .single();

      if (!freshError && freshRate) {
        return {
          rate: Number(freshRate.rate),
          source: "fresh",
          fetchedAt: freshRate.last_fetched_at
            ? new Date(freshRate.last_fetched_at)
            : undefined,
          expiresAt: freshRate.expires_at
            ? new Date(freshRate.expires_at)
            : undefined,
        };
      }

      // 2. Check for stale cached rate (can be used as fallback)
      const { data: staleRate, error: staleError } = await supabase
        .from("exchange_rates")
        .select("rate, last_fetched_at, expires_at")
        .eq("from_currency", fromCurrency)
        .eq("to_currency", toCurrency)
        .lte("date", targetDate)
        .eq("is_stale", true)
        .order("date", { ascending: false })
        .order("last_fetched_at", { ascending: false })
        .limit(1)
        .single();

      // Store stale rate for fallback
      const fallbackRate = staleRate && !staleError ? staleRate : null;

      // 3. Attempt to fetch from API
      try {
        const apiRate = await this.fetchRateFromApi(fromCurrency, toCurrency);

        if (apiRate !== null) {
          // Store in database with cache metadata
          await this.storeRate(fromCurrency, toCurrency, apiRate);

          return {
            rate: apiRate,
            source: "api",
            fetchedAt: new Date(),
            expiresAt: new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000),
          };
        }
      } catch (apiError) {
        console.error("API fetch failed:", apiError);
        // Continue to fallback
      }

      // 4. Use stale rate as fallback if API failed
      if (fallbackRate) {
        // Queue background refresh (fire-and-forget)
        this.queueBackgroundRefresh(fromCurrency, toCurrency).catch((err) =>
          console.error("Background refresh queue failed:", err),
        );

        return {
          rate: Number(fallbackRate.rate),
          source: "stale",
          fetchedAt: fallbackRate.last_fetched_at
            ? new Date(fallbackRate.last_fetched_at)
            : undefined,
          expiresAt: fallbackRate.expires_at
            ? new Date(fallbackRate.expires_at)
            : undefined,
        };
      }

      // 5. No rate available
      return {
        rate: null,
        source: "not_found",
      };
    } catch (error) {
      console.error("Error in getRate:", error);
      return {
        rate: null,
        source: "not_found",
      };
    }
  }

  /**
   * Fetch exchange rate from external API.
   * Handles triangulation for non-USD pairs (e.g., UAH→EUR via UAH→USD→EUR).
   *
   * @param fromCurrency - Source currency
   * @param toCurrency - Target currency
   * @returns Exchange rate or null if unavailable
   */
  private async fetchRateFromApi(
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number | null> {
    try {
      // API always returns USD as base, so we need to handle conversions
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.error(`API request failed: ${response.status}`);
        return null;
      }

      const data: ExchangeRateApiResponse = await response.json();

      if (data.result !== "success" || !data.rates) {
        console.error("API returned error or invalid data");
        return null;
      }

      const rates = data.rates;

      // Handle direct conversion from USD
      if (fromCurrency === "USD") {
        return rates[toCurrency] || null;
      }

      // Handle conversion to USD
      if (toCurrency === "USD") {
        const fromRate = rates[fromCurrency];
        return fromRate ? 1 / fromRate : null;
      }

      // Handle triangulation (fromCurrency → USD → toCurrency)
      const fromToUsd = rates[fromCurrency];
      const toFromUsd = rates[toCurrency];

      if (!fromToUsd || !toFromUsd) {
        return null;
      }

      // Calculate: (1 / fromToUsd) * toFromUsd
      // This converts from_currency to USD, then USD to to_currency
      return toFromUsd / fromToUsd;
    } catch (error) {
      console.error("Error fetching rate from API:", error);
      return null;
    }
  }

  /**
   * Store exchange rate in database with cache metadata.
   * Also stores inverse rate for bidirectional lookups.
   *
   * @param fromCurrency - Source currency
   * @param toCurrency - Target currency
   * @param rate - Exchange rate value
   */
  private async storeRate(
    fromCurrency: string,
    toCurrency: string,
    rate: number,
  ): Promise<void> {
    try {
      const supabase = createAdminClient();
      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + CACHE_TTL_HOURS * 60 * 60 * 1000,
      );
      const today = now.toISOString().split("T")[0];

      // Prepare rate data
      const rateData: Database["public"]["Tables"]["exchange_rates"]["Insert"] =
        {
          from_currency: fromCurrency,
          to_currency: toCurrency,
          rate: rate,
          date: today,
          source: "API",
          api_provider: API_PROVIDER,
          last_fetched_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          is_stale: false,
          fetch_error_count: 0,
        };

      // Upsert primary rate
      await supabase
        .from("exchange_rates")
        .upsert(rateData, {
          onConflict: "from_currency,to_currency,date",
        })
        .select()
        .single();

      // Store inverse rate for bidirectional lookups
      const inverseRateData: Database["public"]["Tables"]["exchange_rates"]["Insert"] =
        {
          from_currency: toCurrency,
          to_currency: fromCurrency,
          rate: 1 / rate,
          date: today,
          source: "API",
          api_provider: API_PROVIDER,
          last_fetched_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          is_stale: false,
          fetch_error_count: 0,
        };

      await supabase
        .from("exchange_rates")
        .upsert(inverseRateData, {
          onConflict: "from_currency,to_currency,date",
        })
        .select()
        .single();
    } catch (error) {
      console.error("Error storing rate:", error);
      throw error;
    }
  }

  /**
   * Queue background refresh for a stale rate.
   * Non-blocking - logs errors but doesn't throw.
   *
   * @param fromCurrency - Source currency
   * @param toCurrency - Target currency
   */
  private async queueBackgroundRefresh(
    fromCurrency: string,
    toCurrency: string,
  ): Promise<void> {
    try {
      // In a production system, this would queue a job in a task queue
      // For now, we just log that a refresh is needed
      console.info(
        `Background refresh needed for ${fromCurrency}→${toCurrency}`,
      );

      // Optionally, attempt immediate refresh (fire-and-forget)
      setTimeout(async () => {
        try {
          const apiRate = await this.fetchRateFromApi(fromCurrency, toCurrency);
          if (apiRate !== null) {
            await this.storeRate(fromCurrency, toCurrency, apiRate);
            console.info(
              `Background refresh completed for ${fromCurrency}→${toCurrency}`,
            );
          }
        } catch (err) {
          console.error("Background refresh failed:", err);
        }
      }, 0);
    } catch (error) {
      console.error("Error queueing background refresh:", error);
    }
  }

  /**
   * Refresh all exchange rates for active currencies.
   * Called by cron job to warm cache.
   *
   * @param currencies - Optional array of currencies to refresh (defaults to all active)
   */
  async refreshAllRates(currencies?: string[]): Promise<void> {
    try {
      const supabase = createAdminClient();

      // Get active currencies if not provided
      let targetCurrencies: string[] = currencies || [];
      if (targetCurrencies.length === 0) {
        const { data: activeCurrencies, error: currError } = await supabase.rpc(
          "get_active_currencies",
        );

        if (currError || !activeCurrencies) {
          console.error("Failed to get active currencies:", currError);
          // Fallback to common currencies
          targetCurrencies = ["USD", "EUR", "GBP", "UAH"];
        } else {
          targetCurrencies = activeCurrencies;
        }
      }

      // Always include USD as base
      if (!targetCurrencies.includes("USD")) {
        targetCurrencies.push("USD");
      }

      console.info(
        `Refreshing rates for currencies: ${targetCurrencies.join(", ")}`,
      );

      // Fetch rates for all currency pairs
      const promises: Promise<void>[] = [];

      for (const fromCurrency of targetCurrencies) {
        for (const toCurrency of targetCurrencies) {
          if (fromCurrency !== toCurrency) {
            promises.push(
              (async () => {
                try {
                  const rate = await this.fetchRateFromApi(
                    fromCurrency,
                    toCurrency,
                  );
                  if (rate !== null) {
                    await this.storeRate(fromCurrency, toCurrency, rate);
                  }
                } catch (err) {
                  console.error(
                    `Failed to refresh ${fromCurrency}→${toCurrency}:`,
                    err,
                  );
                }
              })(),
            );
          }
        }
      }

      await Promise.all(promises);

      // Mark expired rates as stale
      await supabase.rpc("mark_stale_rates");

      console.info("Rate refresh completed successfully");
    } catch (error) {
      console.error("Error refreshing rates:", error);
      throw error;
    }
  }

  /**
   * Check if cached rate is valid (not expired).
   *
   * @param fromCurrency - Source currency
   * @param toCurrency - Target currency
   * @returns True if fresh cache exists
   */
  async isCacheValid(
    fromCurrency: string,
    toCurrency: string,
  ): Promise<boolean> {
    try {
      const supabase = await createServerClient();
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("exchange_rates")
        .select("expires_at")
        .eq("from_currency", fromCurrency)
        .eq("to_currency", toCurrency)
        .lte("date", today)
        .gt("expires_at", new Date().toISOString())
        .limit(1)
        .single();

      return !error && data !== null;
    } catch (error) {
      console.error("Error checking cache validity:", error);
      return false;
    }
  }

  /**
   * Get all exchange rates for a base currency.
   * Useful for displaying multiple rates at once.
   *
   * @param baseCurrency - Base currency (ISO 4217 code)
   * @returns Record of currency codes to exchange rates
   */
  async getAllRates(baseCurrency: string): Promise<Record<string, number>> {
    try {
      const supabase = await createServerClient();
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("exchange_rates")
        .select("to_currency, rate")
        .eq("from_currency", baseCurrency)
        .lte("date", today)
        .gt("expires_at", new Date().toISOString())
        .order("date", { ascending: false });

      if (error || !data) {
        console.error("Error fetching all rates:", error);
        return {};
      }

      // Convert to record
      const rates: Record<string, number> = {};
      for (const row of data) {
        rates[row.to_currency] = Number(row.rate);
      }

      return rates;
    } catch (error) {
      console.error("Error in getAllRates:", error);
      return {};
    }
  }

  /**
   * Manually set an exchange rate (for admin overrides or user preferences).
   * Creates a permanent rate (no expiration) with source='MANUAL'.
   *
   * @param fromCurrency - Source currency
   * @param toCurrency - Target currency
   * @param rate - Exchange rate value
   */
  async setManualRate(
    fromCurrency: string,
    toCurrency: string,
    rate: number,
  ): Promise<void> {
    try {
      const supabase = createAdminClient();
      const today = new Date().toISOString().split("T")[0];

      const manualRateData: Database["public"]["Tables"]["exchange_rates"]["Insert"] =
        {
          from_currency: fromCurrency,
          to_currency: toCurrency,
          rate: rate,
          date: today,
          source: "MANUAL",
          api_provider: null,
          last_fetched_at: null,
          expires_at: null, // Manual rates don't expire
          is_stale: false,
          fetch_error_count: 0,
        };

      await supabase
        .from("exchange_rates")
        .upsert(manualRateData, {
          onConflict: "from_currency,to_currency,date",
        })
        .select()
        .single();

      console.info(`Manual rate set: ${fromCurrency}→${toCurrency} = ${rate}`);
    } catch (error) {
      console.error("Error setting manual rate:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const exchangeRateService = new ExchangeRateService();
