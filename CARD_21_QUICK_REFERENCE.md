# Card #21: Exchange Rate Management - Quick Reference

## 🚀 Quick Start

### For Developers

**Get exchange rate in your code:**
```typescript
import { getExchangeRate } from '@/lib/utils/currency-conversion';

const rate = await getExchangeRate('UAH', 'USD');
if (rate !== null) {
  console.log(`1 UAH = ${rate} USD`);
}
```

**Convert amount:**
```typescript
import { convertAmount } from '@/lib/utils/currency-conversion';

const converted = await convertAmount(1000, 'UAH', 'USD');
// Returns: 24.39 (or null if rate unavailable)
```

---

## 🧪 Testing Cron Endpoint

**Valid Request:**
```bash
curl -X GET http://localhost:3000/api/cron/refresh-rates \
  -H "Authorization: Bearer RY3OPh1KrHcnyChQlMhh+WTv5+WKS50dAtOb/3oe1H0="
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Exchange rates refreshed successfully",
  "timestamp": "2024-12-18T12:00:00.000Z",
  "durationMs": 1234
}
```

---

## 🔍 Database Queries

**Check latest rates:**
```sql
SELECT from_currency, to_currency, rate, source, api_provider, expires_at
FROM exchange_rates
WHERE source = 'API'
ORDER BY last_fetched_at DESC
LIMIT 10;
```

**Check cache expiration:**
```sql
SELECT from_currency, to_currency,
       EXTRACT(EPOCH FROM (expires_at - NOW())) / 3600 as hours_until_expiration
FROM exchange_rates
WHERE expires_at > NOW()
ORDER BY expires_at;
```

**Find stale rates:**
```sql
SELECT from_currency, to_currency, rate, last_fetched_at
FROM exchange_rates
WHERE is_stale = true;
```

**Get active currencies:**
```sql
SELECT get_active_currencies();
```

---

## 📝 Environment Variables

```bash
# Required for API integration
EXCHANGE_RATE_API_URL=https://open.er-api.com/v6/latest/USD
EXCHANGE_RATE_CACHE_TTL_HOURS=24
EXCHANGE_RATE_CRON_SECRET=YOUR_SECRET_HERE
```

**Generate new secret:**
```bash
openssl rand -base64 32
```

---

## 🐛 Troubleshooting

### Rate Not Available
```typescript
// Check if cache is valid
const isValid = await exchangeRateService.isCacheValid('UAH', 'USD');
console.log('Cache valid:', isValid);

// Manually set rate if needed
await exchangeRateService.setManualRate('UAH', 'USD', 0.024390);
```

### Verify API Connectivity
```bash
curl https://open.er-api.com/v6/latest/USD | jq '.conversion_rates.UAH'
```

### Check Logs
```sql
SELECT * FROM exchange_rates
WHERE fetch_error_count > 0
ORDER BY last_fetched_at DESC;
```

---

## 🎯 Key Features

✅ **24-hour cache** - Reduces API calls
✅ **Stale-while-revalidate** - Graceful degradation
✅ **Daily pre-fetch** - Warm cache at 02:00 UTC
✅ **Triangulation** - Handles non-USD pairs
✅ **Inverse rates** - Automatic bidirectional storage

---

## 📚 Files to Know

| File | Purpose |
|------|---------|
| `/src/lib/services/exchange-rate-service.ts` | Core service logic |
| `/src/app/api/cron/refresh-rates/route.ts` | Cron endpoint |
| `/src/lib/utils/currency-conversion.ts` | Helper functions |
| `/supabase/migrations/20250118120000_enhance_exchange_rates.sql` | Database schema |

---

## 🔗 External API

**Provider**: exchangerate-api.com
**Free Tier**: 1,500 requests/month
**Endpoint**: https://open.er-api.com/v6/latest/USD

**Sample Response:**
```json
{
  "result": "success",
  "base_code": "USD",
  "conversion_rates": {
    "UAH": 41.0,
    "EUR": 0.92,
    "GBP": 0.79
  }
}
```

---

## ⚙️ Cron Schedule

**Production**: Daily at 02:00 UTC

**Vercel Configuration** (`vercel.json`):
```json
{
  "crons": [{
    "path": "/api/cron/refresh-rates",
    "schedule": "0 2 * * *"
  }]
}
```

---

## 📊 Monitoring

**Check API usage:**
```sql
SELECT COUNT(*) as api_fetches
FROM exchange_rates
WHERE source = 'API'
AND last_fetched_at >= CURRENT_DATE - INTERVAL '30 days';
```

**Check error rate:**
```sql
SELECT AVG(fetch_error_count) as avg_errors,
       MAX(fetch_error_count) as max_errors
FROM exchange_rates
WHERE source = 'API';
```

---

**For detailed documentation, see**: `CARD_21_IMPLEMENTATION_SUMMARY.md`
