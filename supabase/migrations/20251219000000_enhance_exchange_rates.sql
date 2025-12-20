-- Migration: Enhance exchange_rates table for live API integration
-- Story 2: Exchange Rate Management - Backend Implementation (Card #21)
-- This migration adds caching, expiration tracking, and API metadata to exchange_rates

-- ============================================================================
-- ARCHITECTURAL DECISIONS (Card #21)
-- ============================================================================

-- DECISION 1: API Provider
-- CHOSEN: exchangerate-api.com (free tier)
-- REASONING:
--   - No API key required for 1,500 req/month
--   - Reliable daily updates
--   - Simple JSON API
--   - Suitable for MVP (can switch to paid tier later)

-- DECISION 2: Caching Strategy
-- CHOSEN: 24-hour TTL with stale-while-revalidate
-- REASONING:
--   - Daily rates sufficient for personal finance tracking
--   - Reduces API calls (1,500/month limit)
--   - Fallback to stale data prevents transaction failures
--   - Background refresh improves UX

-- DECISION 3: Pre-fetching Strategy
-- CHOSEN: Daily cron job at 02:00 UTC
-- REASONING:
--   - Proactive cache warming before peak usage
--   - Off-peak time reduces user impact
--   - Aligns with API rate limits
--   - Reduces latency during transaction creation

-- ============================================================================
-- ALTER EXCHANGE_RATES TABLE - ADD CACHING & API METADATA
-- ============================================================================

-- Add expires_at: Timestamp when cached rate expires (24h after fetch)
ALTER TABLE exchange_rates
ADD COLUMN expires_at TIMESTAMPTZ;

-- Add last_fetched_at: Timestamp of last successful API fetch
ALTER TABLE exchange_rates
ADD COLUMN last_fetched_at TIMESTAMPTZ;

-- Add api_provider: Which API was used to fetch this rate
ALTER TABLE exchange_rates
ADD COLUMN api_provider TEXT;

-- Add is_stale: Flag to indicate if rate is expired but still usable
ALTER TABLE exchange_rates
ADD COLUMN is_stale BOOLEAN DEFAULT FALSE;

-- Add fetch_error_count: Track consecutive fetch failures for monitoring
ALTER TABLE exchange_rates
ADD COLUMN fetch_error_count INTEGER DEFAULT 0;

-- ============================================================================
-- UPDATE EXISTING ROWS WITH DEFAULTS
-- ============================================================================

-- Set default values for existing stub rates
UPDATE exchange_rates
SET
  expires_at = CURRENT_TIMESTAMP + INTERVAL '24 hours',
  last_fetched_at = CURRENT_TIMESTAMP,
  api_provider = 'STUB',
  is_stale = FALSE,
  fetch_error_count = 0
WHERE expires_at IS NULL;

-- ============================================================================
-- CONSTRAINTS FOR NEW COLUMNS
-- ============================================================================

-- Validate api_provider values
ALTER TABLE exchange_rates
ADD CONSTRAINT chk_exchange_rate_api_provider
CHECK (api_provider IN ('STUB', 'MANUAL', 'exchangerate-api.com', 'SYSTEM') OR api_provider IS NULL);

-- Validate fetch_error_count is non-negative
ALTER TABLE exchange_rates
ADD CONSTRAINT chk_exchange_rate_error_count_nonnegative
CHECK (fetch_error_count >= 0);

-- ============================================================================
-- INDEXES FOR CACHING QUERIES
-- ============================================================================

-- Index for finding expired rates (for cron job)
CREATE INDEX idx_exchange_rates_expires_at
ON exchange_rates(expires_at)
WHERE expires_at IS NOT NULL;

-- Composite index for cache validity checks
CREATE INDEX idx_exchange_rates_cache_lookup
ON exchange_rates(from_currency, to_currency, expires_at DESC)
WHERE expires_at IS NOT NULL;

-- Index for stale rate queries (fallback strategy)
CREATE INDEX idx_exchange_rates_stale
ON exchange_rates(from_currency, to_currency, is_stale)
WHERE is_stale = TRUE;

-- ============================================================================
-- HELPER FUNCTION: GET_EXCHANGE_RATE (ENHANCED WITH CACHING)
-- ============================================================================

-- Enhanced version with cache-aware logic
-- Prioritizes fresh rates, falls back to stale rates if API unavailable
CREATE OR REPLACE FUNCTION get_exchange_rate(
  p_from_currency TEXT,
  p_to_currency TEXT,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC(10, 6)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_rate NUMERIC(10, 6);
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Handle identity conversion (same currency)
  IF p_from_currency = p_to_currency THEN
    RETURN 1.000000;
  END IF;

  -- Try direct conversion with fresh cache (expires_at > NOW)
  SELECT rate, expires_at INTO v_rate, v_expires_at
  FROM exchange_rates
  WHERE from_currency = p_from_currency
    AND to_currency = p_to_currency
    AND date <= p_date
    AND (expires_at IS NULL OR expires_at > NOW())  -- Fresh or permanent rate
  ORDER BY date DESC
  LIMIT 1;

  -- Return if found and fresh
  IF v_rate IS NOT NULL THEN
    RETURN v_rate;
  END IF;

  -- Try inverse rate with fresh cache
  SELECT (1.0 / rate) INTO v_rate
  FROM exchange_rates
  WHERE from_currency = p_to_currency
    AND to_currency = p_from_currency
    AND date <= p_date
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY date DESC
  LIMIT 1;

  -- Return inverse rate if found
  IF v_rate IS NOT NULL THEN
    RETURN v_rate;
  END IF;

  -- FALLBACK: Try stale direct conversion (for graceful degradation)
  SELECT rate INTO v_rate
  FROM exchange_rates
  WHERE from_currency = p_from_currency
    AND to_currency = p_to_currency
    AND date <= p_date
    AND is_stale = TRUE  -- Explicitly stale rates
  ORDER BY date DESC, last_fetched_at DESC
  LIMIT 1;

  -- Return stale rate if found
  IF v_rate IS NOT NULL THEN
    RETURN v_rate;
  END IF;

  -- FALLBACK: Try stale inverse rate
  SELECT (1.0 / rate) INTO v_rate
  FROM exchange_rates
  WHERE from_currency = p_to_currency
    AND to_currency = p_from_currency
    AND date <= p_date
    AND is_stale = TRUE
  ORDER BY date DESC, last_fetched_at DESC
  LIMIT 1;

  -- Return stale inverse rate if found, otherwise NULL
  RETURN v_rate;
END;
$$;

-- ============================================================================
-- HELPER FUNCTION: MARK_STALE_RATES (FOR CRON JOB)
-- ============================================================================

-- Marks expired rates as stale (allows graceful fallback)
CREATE OR REPLACE FUNCTION mark_stale_rates()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Update rates where expires_at has passed
  UPDATE exchange_rates
  SET is_stale = TRUE
  WHERE expires_at <= NOW()
    AND is_stale = FALSE
    AND source != 'STUB';  -- Don't mark stub rates as stale

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================================
-- HELPER FUNCTION: CLEANUP_OLD_RATES (FOR MAINTENANCE)
-- ============================================================================

-- Removes very old rates (older than 90 days) to prevent table bloat
-- Keeps manual rates indefinitely
CREATE OR REPLACE FUNCTION cleanup_old_rates()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Delete rates older than 90 days (except manual rates)
  DELETE FROM exchange_rates
  WHERE date < CURRENT_DATE - INTERVAL '90 days'
    AND source NOT IN ('MANUAL', 'STUB')
    AND is_stale = TRUE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================================
-- HELPER FUNCTION: GET_ACTIVE_CURRENCIES (FOR API FETCHING)
-- ============================================================================

-- Returns list of currencies actively used in payment methods
-- Used by cron job to determine which rates to fetch
CREATE OR REPLACE FUNCTION get_active_currencies()
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT ARRAY_AGG(DISTINCT currency)
  FROM payment_methods
  WHERE is_active = TRUE;
$$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN exchange_rates.expires_at IS 'Timestamp when this cached rate expires (24h after fetch). NULL for permanent rates.';
COMMENT ON COLUMN exchange_rates.last_fetched_at IS 'Timestamp of last successful API fetch. Used for monitoring freshness.';
COMMENT ON COLUMN exchange_rates.api_provider IS 'API provider that supplied this rate (e.g., exchangerate-api.com)';
COMMENT ON COLUMN exchange_rates.is_stale IS 'True if rate has expired but can still be used as fallback';
COMMENT ON COLUMN exchange_rates.fetch_error_count IS 'Number of consecutive failed refresh attempts. Reset on success.';

COMMENT ON FUNCTION mark_stale_rates() IS 'Marks expired rates as stale for graceful degradation. Returns count of marked rates.';
COMMENT ON FUNCTION cleanup_old_rates() IS 'Removes old stale rates (>90 days) to prevent table bloat. Returns count of deleted rates.';
COMMENT ON FUNCTION get_active_currencies() IS 'Returns array of currencies used in active payment methods (for targeted API fetching)';

-- ============================================================================
-- MIGRATION SUCCESS VERIFICATION
-- ============================================================================

-- To verify this migration was successful, run:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'exchange_rates'
-- AND column_name IN ('expires_at', 'last_fetched_at', 'api_provider', 'is_stale', 'fetch_error_count')
-- ORDER BY column_name;

-- Expected output:
--   api_provider        | text                 | YES
--   expires_at          | timestamptz          | YES
--   fetch_error_count   | integer              | YES
--   is_stale            | boolean              | YES
--   last_fetched_at     | timestamptz          | YES

-- To verify helper functions:
-- SELECT proname FROM pg_proc WHERE proname IN ('mark_stale_rates', 'cleanup_old_rates', 'get_active_currencies');
-- Expected: 3 rows
