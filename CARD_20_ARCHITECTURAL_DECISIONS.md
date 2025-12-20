# Card #20 - Architectural Decision Record (ADR)

**Story**: Currency-Aware Transaction Creation
**Date**: 2025-12-18
**Architect**: System Architect (Agent 02)
**Status**: ✅ Approved and Implemented

---

## Decision Summary

| Decision Area | Chosen Approach | Alternative Considered | Rationale |
|--------------|-----------------|------------------------|-----------|
| **Data Integrity** | Application-level validation | Database CHECK constraints | More flexible, better error messages, easier to modify |
| **Exchange Rate Pairs** | Store reverse pairs | Calculate inverse on-the-fly | Faster queries, predictable behavior, minimal overhead |
| **Helper Functions** | Create DB functions | Application-layer only | Centralized logic, reusable, encapsulated |
| **RLS for Rates** | Public read (authenticated) | Private per-user | Global data, no sensitive info, needed by all |
| **Identity Rates** | Function handles (not stored) | Store in table | Avoids violating CHECK constraint, cleaner data |

---

## ADR-001: Application-Level Validation

### Context
We need to ensure that when a `payment_method_id` is provided, the associated multi-currency fields (`native_amount`, `exchange_rate`, `base_currency`) are also provided. This could be enforced at the database level via CHECK constraints or at the application level.

### Decision
**Chosen**: Application-level validation (Option A)

### Reasoning

**Pros**:
- ✅ More flexible for future requirements (e.g., optional payment methods, hybrid scenarios)
- ✅ Easier to modify validation logic without schema migrations
- ✅ Better error messages from application layer (context-aware)
- ✅ Consistent with existing validation (payment method ownership via trigger)
- ✅ Allows for gradual enforcement if business rules change

**Cons**:
- ❌ Not enforced at database level (data integrity relies on application)
- ❌ Multiple applications could introduce inconsistencies (mitigated by single backend)

### Implementation
```typescript
// Server Action validation
if (formData.paymentMethodId) {
  if (!formData.nativeAmount || !exchangeRate || !baseCurrency) {
    throw new Error('Multi-currency fields required when payment method specified');
  }
}
```

### Future Considerations
If strict enforcement becomes necessary, we can add a CHECK constraint:
```sql
ALTER TABLE transactions
ADD CONSTRAINT chk_multicurrency_fields
CHECK (
  (payment_method_id IS NULL) OR
  (native_amount IS NOT NULL AND exchange_rate IS NOT NULL AND base_currency IS NOT NULL)
);
```

---

## ADR-002: Exchange Rate Storage Strategy

### Context
Exchange rates can be stored as single directional pairs (e.g., only EUR→USD) or as bidirectional pairs (EUR→USD and USD→EUR). Single directional requires calculation for inverse rates.

### Decision
**Chosen**: Store reverse pairs in seed data

### Reasoning

**Pros**:
- ✅ Simpler and faster lookups (no calculation needed)
- ✅ More predictable behavior (explicit rates)
- ✅ Helper function still provides fallback for inverse calculation
- ✅ Minimal storage overhead (~28 rows for 10 currencies)
- ✅ Easier to audit and debug

**Cons**:
- ❌ Slightly more storage space (~2x rows)
- ❌ Requires maintaining consistency (mitigated by API integration in Card #21)

### Implementation
```sql
-- Direct rate
INSERT INTO exchange_rates (from_currency, to_currency, rate)
VALUES ('EUR', 'USD', 1.086957);

-- Reverse rate (also stored)
INSERT INTO exchange_rates (from_currency, to_currency, rate)
VALUES ('USD', 'EUR', 0.920000);
```

### Fallback Logic
The `get_exchange_rate()` function still handles inverse calculation:
1. Try direct lookup (EUR→USD)
2. If not found, try inverse (USD→EUR) and return `1 / rate`

---

## ADR-003: Database Helper Functions

### Context
Currency conversion logic can live in the database (SQL functions) or purely in the application layer (TypeScript). Database functions provide centralized logic but reduce flexibility.

### Decision
**Chosen**: Create `get_exchange_rate()` and `convert_amount()` functions

### Reasoning

**Pros**:
- ✅ Encapsulates conversion logic in one place
- ✅ Reusable across multiple queries, triggers, and functions
- ✅ Can be called from SQL queries directly
- ✅ Provides fallback to inverse rate calculation
- ✅ Future-proof for API integration (Card #21 can update function logic)

**Cons**:
- ❌ Requires migration to modify logic (mitigated by `SECURITY DEFINER`)
- ❌ Harder to test in isolation (mitigated by verification scripts)

### Implementation
```sql
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
  -- Implementation in migration file
$$;
```

### Alternative (Application-Only)
Could be implemented as TypeScript utility:
```typescript
export async function getExchangeRate(fromCurrency: string, toCurrency: string) {
  // Query exchange_rates table
  // Handle identity and inverse logic
}
```

**Why database function is better**:
- Can be used in SQL queries (e.g., budget calculations)
- Single source of truth for conversion logic
- Performance optimization opportunities (caching, indexes)

---

## ADR-004: RLS Policy for Exchange Rates

### Context
Exchange rates can be treated as global data (accessible to all users) or user-specific data (each user has their own rates). Global data simplifies implementation but lacks customization.

### Decision
**Chosen**: Public read access for all authenticated users

### Reasoning

**Pros**:
- ✅ Exchange rates are global data, not user-specific
- ✅ No sensitive information in rates
- ✅ All authenticated users need access for currency conversion
- ✅ Simpler implementation (no user_id FK needed)
- ✅ Allows for future manual rate adjustments (INSERT/UPDATE policies)

**Cons**:
- ❌ Users cannot have custom rates (acceptable for MVP, can be added later)

### Implementation
```sql
-- SELECT: All authenticated users can read
CREATE POLICY "Authenticated users can view exchange rates"
  ON exchange_rates FOR SELECT
  TO authenticated
  USING (true);

-- INSERT/UPDATE: Allow manual rate additions
CREATE POLICY "Authenticated users can insert exchange rates"
  ON exchange_rates FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- DELETE: Service role only (prevent accidental deletion)
CREATE POLICY "Service role can delete exchange rates"
  ON exchange_rates FOR DELETE
  TO service_role
  USING (true);
```

### Future Enhancement (User-Specific Rates)
If custom rates become necessary:
1. Add `user_id` column (nullable) to `exchange_rates`
2. Modify `get_exchange_rate()` to prioritize user-specific rates
3. Update RLS policies to filter by `user_id IS NULL OR user_id = auth.uid()`

---

## ADR-005: Identity Rate Storage

### Context
Identity conversions (USD→USD) can be stored in the `exchange_rates` table or handled programmatically by the `get_exchange_rate()` function. Storing them violates the CHECK constraint preventing same-currency conversions.

### Decision
**Chosen**: Handle identity rates in `get_exchange_rate()` function, do NOT store in table

### Reasoning

**Pros**:
- ✅ Avoids violating `chk_exchange_rate_different_currencies` constraint
- ✅ Cleaner data (no redundant rows)
- ✅ Consistent behavior (identity always returns 1.0)
- ✅ Easier to maintain (no need to seed identity rates for every currency)

**Cons**:
- ❌ Function must handle special case (acceptable, simple logic)

### Implementation
```sql
CREATE OR REPLACE FUNCTION get_exchange_rate(...)
RETURNS NUMERIC(10, 6)
AS $$
BEGIN
  -- Handle identity conversion first
  IF p_from_currency = p_to_currency THEN
    RETURN 1.000000;
  END IF;

  -- Then proceed with lookups
  ...
END;
$$;
```

### Constraint Enforcement
```sql
ALTER TABLE exchange_rates
ADD CONSTRAINT chk_exchange_rate_different_currencies
CHECK (from_currency != to_currency);
```

This ensures clean data and forces identity handling to be explicit in code.

---

## ADR-006: Backward Compatibility Strategy

### Context
Existing transactions do not have multi-currency data. We need a strategy to handle legacy transactions without breaking existing functionality or requiring data migration.

### Decision
**Chosen**: All new columns nullable, treat NULL as legacy behavior

### Reasoning

**Pros**:
- ✅ Zero breaking changes to existing code
- ✅ No data migration required
- ✅ Existing transactions continue to work
- ✅ Gradual adoption of multi-currency features
- ✅ Legacy transactions can be identified by `payment_method_id IS NULL`

**Cons**:
- ❌ NULL checks required in queries (mitigated by indexes)
- ❌ Mixed data model (acceptable for transition period)

### Implementation

**Schema**:
```sql
ALTER TABLE transactions
ADD COLUMN payment_method_id UUID,        -- NULL for legacy
ADD COLUMN native_amount NUMERIC(12, 2), -- NULL for legacy
ADD COLUMN exchange_rate NUMERIC(10, 6), -- NULL for legacy
ADD COLUMN base_currency TEXT;           -- NULL for legacy
```

**Query Logic**:
```sql
-- Include legacy transactions in balance calculation
SELECT COALESCE(SUM(...), 0)
FROM transactions
WHERE user_id = p_user_id
  AND (
    base_currency IS NULL  -- Legacy transaction
    OR base_currency = v_user_currency  -- Multi-currency transaction
  );
```

**Application Logic**:
```typescript
function getDisplayAmount(transaction: Transaction) {
  if (transaction.payment_method_id === null) {
    // Legacy transaction: use 'amount' as base currency
    return {
      amount: transaction.amount,
      currency: userBaseCurrency
    };
  } else {
    // Multi-currency transaction: use 'native_amount' as original
    return {
      amount: transaction.native_amount,
      currency: paymentMethod.currency,
      convertedAmount: transaction.amount,
      convertedCurrency: transaction.base_currency
    };
  }
}
```

---

## ADR-007: Exchange Rate Precision

### Context
Exchange rates require decimal precision. Too few decimals cause rounding errors; too many waste storage.

### Decision
**Chosen**: `NUMERIC(10, 6)` for exchange rates (6 decimal places)

### Reasoning

**Pros**:
- ✅ Sufficient for most currency pairs (e.g., 1.086957)
- ✅ Handles high-precision rates (e.g., JPY: 0.006711)
- ✅ Prevents floating-point errors (NUMERIC is exact)
- ✅ Standard precision for financial calculations

**Examples**:
- EUR→USD: 1.086957 ✅ (6 decimals)
- JPY→USD: 0.006711 ✅ (6 decimals, ~149 yen = $1)
- UAH→USD: 0.024390 ✅ (6 decimals, ~41 hryvnia = $1)

### Implementation
```sql
CREATE TABLE exchange_rates (
  rate NUMERIC(10, 6) NOT NULL,  -- 10 digits total, 6 after decimal
  ...
);
```

### Amount Precision
Transaction amounts use `NUMERIC(12, 2)`:
- 12 digits total (supports up to 9,999,999,999.99)
- 2 decimal places (standard for currency amounts)

---

## ADR-008: Index Strategy

### Context
Multi-currency queries need efficient filtering by currency, payment method, and date. Indexes improve performance but increase write overhead.

### Decision
**Chosen**: Partial indexes for multi-currency data, composite indexes for common queries

### Reasoning

**Partial Indexes** (transactions):
```sql
-- Index only transactions with multi-currency data
CREATE INDEX idx_transactions_base_currency
ON transactions(base_currency)
WHERE base_currency IS NOT NULL;

-- Index legacy transactions separately
CREATE INDEX idx_transactions_legacy
ON transactions(user_id)
WHERE payment_method_id IS NULL;
```

**Pros**:
- ✅ Smaller index size (only relevant rows)
- ✅ Faster writes (fewer indexes to update for legacy transactions)
- ✅ Efficient queries for both legacy and multi-currency

**Composite Indexes** (exchange_rates):
```sql
-- Optimized for rate lookups
CREATE INDEX idx_exchange_rates_lookup
ON exchange_rates(from_currency, to_currency, date DESC);

-- Optimized for reverse lookups
CREATE INDEX idx_exchange_rates_reverse_lookup
ON exchange_rates(to_currency, from_currency, date DESC);
```

**Pros**:
- ✅ Covers common query patterns
- ✅ Supports ORDER BY date DESC (most recent rate first)
- ✅ Enables index-only scans

---

## ADR-009: Source Tracking for Rates

### Context
Exchange rates come from different sources: stubbed data (MVP), manual entries (user corrections), or API (Card #21). We need to track the source for debugging and auditing.

### Decision
**Chosen**: Add `source` column with values: 'STUB', 'MANUAL', 'API', 'SYSTEM'

### Reasoning

**Pros**:
- ✅ Easy to identify stub rates vs real rates
- ✅ Allows filtering by source (e.g., show only API rates)
- ✅ Auditing: track when rates were manually adjusted
- ✅ Future-proof for multiple rate providers

**Implementation**:
```sql
CREATE TABLE exchange_rates (
  source TEXT NOT NULL DEFAULT 'STUB',
  CONSTRAINT chk_exchange_rate_source
  CHECK (source IN ('STUB', 'MANUAL', 'API', 'SYSTEM'))
);
```

**Usage**:
```sql
-- Find all stub rates (to be replaced by API)
SELECT * FROM exchange_rates WHERE source = 'STUB';

-- Find manually adjusted rates
SELECT * FROM exchange_rates WHERE source = 'MANUAL';
```

---

## ADR-010: Updated Balance Calculation

### Context
The existing `get_user_balance()` function sums all transactions in the user's base currency. With multi-currency support, we need to decide: sum only base currency transactions, or convert all transactions?

### Decision
**Chosen**: Sum only base currency transactions, handle multi-currency aggregation in application

### Reasoning

**Pros**:
- ✅ Database function remains simple and fast
- ✅ Avoids complex cross-currency calculations in SQL
- ✅ Application can cache exchange rates for batch conversions
- ✅ Supports per-payment-method balance display (more useful than total)

**Implementation**:

**Database function** (sum base currency only):
```sql
CREATE OR REPLACE FUNCTION get_user_balance(p_user_id UUID)
RETURNS DECIMAL(12, 2)
AS $$
  SELECT COALESCE(SUM(...), 0)
  FROM transactions
  WHERE user_id = p_user_id
    AND (
      base_currency IS NULL  -- Legacy
      OR base_currency = v_user_currency  -- Base currency
    );
$$;
```

**Application layer** (aggregate multi-currency):
```typescript
async function getTotalBalanceInBaseCurrency(userId: string) {
  // Get balances per payment method (native currency)
  const pmBalances = await getPaymentMethodBalances(userId);

  // Convert all to base currency
  const convertedBalances = await Promise.all(
    pmBalances.map(async (pm) => {
      if (pm.currency === userBaseCurrency) return pm.balance;
      return await convertAmount(pm.balance, pm.currency, userBaseCurrency);
    })
  );

  return convertedBalances.reduce((sum, val) => sum + val, 0);
}
```

---

## Decisions Not Made (Deferred)

### DEC-X: Live Exchange Rate API Provider
**Deferred to**: Card #21
**Reason**: MVP uses stubbed rates, API integration is next story

### DEC-Y: Rate Caching Strategy
**Deferred to**: Card #21
**Reason**: Not critical for MVP with stub rates

### DEC-Z: Historical Rate Archival
**Deferred to**: Future enhancement
**Reason**: Current design stores all historical rates, archival not needed yet

---

## Review and Approval

**Reviewed By**: System Architect (Agent 02)
**Approved By**: Product Manager (Agent 01) *(implicit via PRD approval)*
**Implementation Date**: 2025-12-18
**Status**: ✅ Implemented and Verified

---

## Related Documents

- **PRD**: Card #20 - Currency-Aware Transaction Creation
- **Schema Design**: `MULTI_CURRENCY_SCHEMA_DESIGN.md`
- **Handoff Document**: `CARD_20_SCHEMA_HANDOFF.md`
- **Migration File**: `supabase/migrations/20251218113344_add_multi_currency_to_transactions.sql`

---

## Changelog

| Date | Change | Reason |
|------|--------|--------|
| 2025-12-18 | Initial ADR created | Document all architectural decisions for Card #20 |
| 2025-12-18 | ADR-005 updated | Identity rates NOT stored in table (violates CHECK constraint) |

---

**End of Architectural Decision Record**
