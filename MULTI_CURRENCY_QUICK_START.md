# Multi-Currency Transaction Management - Quick Start Guide

**For Product Manager, QA Engineer, and End Users**

---

## What's New?

FinanceFlow now supports multi-currency transactions! You can:
- Track expenses in different currencies (USD, EUR, UAH, GBP, etc.)
- Link transactions to payment methods (credit cards, bank accounts)
- View balances per payment method in their native currencies
- See automatic currency conversion to your base currency

---

## Key Features

### 1. Payment Method Selector
When creating or editing a transaction, you can now select which payment method was used:

- **Payment Methods**: Select from your configured payment methods (e.g., "Chase USD Card", "My EUR Card")
- **Base Currency**: Choose "None (Base Currency)" for transactions without a payment method
- **Default Selection**: Your default payment method is automatically pre-selected

### 2. Currency-Aware Amount Input
The amount input automatically adapts to the selected payment method's currency:

- **Label**: Shows "Amount in [Currency]" (e.g., "Amount in UAH")
- **Symbol**: Displays currency symbol on the right (e.g., "₴" for UAH)
- **Hint**: Shows conversion notice when currency differs from your base currency

### 3. Multi-Currency Transaction Display
Transaction cards now show payment method information:

- **Payment Method Badge**: Displays payment method name with credit card icon
- **Native Amount**: Primary amount in payment method's currency (large, bold)
- **Converted Amount**: Secondary amount in base currency (small, below native amount)
- **Example**:
  ```
  🏦 My UAH Card
  ₴1,000.00 UAH
  ≈ $24.39 USD
  ```

### 4. Multi-Currency Balance Widget
New dashboard widget showing all your balances:

- **Total Balance**: Aggregated balance in base currency
- **Payment Method Breakdown**: Individual balances in native currencies
- **Exchange Rate Info**: Shows conversion rates for transparency

---

## How to Use

### Creating a Multi-Currency Transaction

1. Click **"Add Transaction"** button
2. Select **Payment Method** (e.g., "My EUR Card")
3. Notice amount input changes to "Amount in EUR"
4. Enter amount in **payment method's currency** (e.g., "100.00")
5. See conversion hint: "Amount will be converted to USD automatically..."
6. Fill in other details (category, date, description, tags)
7. Click **"Create Transaction"**
8. Transaction saved with both native (EUR) and converted (USD) amounts

### Creating a Legacy Transaction (No Payment Method)

1. Click **"Add Transaction"** button
2. Select **"None (Base Currency)"** from payment method dropdown
3. Amount input shows "Amount in USD"
4. Enter amount in **base currency**
5. Fill in other details
6. Click **"Create Transaction"**
7. Transaction saved without payment method (legacy style)

### Editing a Transaction

1. Click **Edit** icon on transaction card
2. Dialog opens with current values pre-filled
3. **For multi-currency transactions**: Native amount is shown in payment method's currency
4. Change payment method if needed (currency updates automatically)
5. Update amount or other fields
6. Click **"Save Changes"**
7. Transaction updated with new currency conversion (if changed)

### Viewing Multi-Currency Balances

1. Navigate to **Dashboard**
2. Look for **"Multi-Currency Balances"** widget
3. See:
   - **Total Balance** in base currency at top
   - **Payment Method Cards** below showing:
     - Payment method name
     - Balance in native currency
     - Converted balance in base currency (if applicable)
     - Exchange rate used for conversion

---

## Supported Currencies

FinanceFlow supports **40+ major currencies** including:

| Code | Currency | Symbol |
|------|----------|--------|
| USD | US Dollar | $ |
| EUR | Euro | € |
| UAH | Ukrainian Hryvnia | ₴ |
| GBP | British Pound | £ |
| JPY | Japanese Yen | ¥ |
| CHF | Swiss Franc | CHF |
| CAD | Canadian Dollar | C$ |
| AUD | Australian Dollar | A$ |
| PLN | Polish Złoty | zł |
| CZK | Czech Koruna | Kč |

See `/src/lib/utils/currency.ts` for full list.

---

## Exchange Rates

### Current Implementation (MVP)
- **Source**: Stub exchange rates stored in database
- **Update Frequency**: Static (manually updated via database)
- **Accuracy**: Approximate rates for testing/MVP

### Supported Currency Pairs
Exchange rates available for 10 common currencies:
- USD, EUR, GBP, UAH, CAD, AUD, JPY, CHF, PLN, CZK

### Future Enhancement (Card #21)
- **Source**: Live API (e.g., exchangerate-api.com, Open Exchange Rates)
- **Update Frequency**: Daily or hourly
- **Accuracy**: Real-time market rates

---

## Payment Method Setup

Before using multi-currency transactions, you need to set up payment methods:

### Creating a Payment Method

1. Navigate to **Payment Methods** page (URL: `/payment-methods`)
2. Click **"Add Payment Method"** button
3. Fill in details:
   - **Name**: e.g., "Chase Sapphire Reserve"
   - **Currency**: e.g., "USD"
   - **Card Type**: credit, debit, cash, or savings (optional)
   - **Color**: Choose a color for visual identification (optional)
   - **Is Default**: Check to make this the default payment method
4. Click **"Create"**
5. Payment method is now available in transaction dialogs

### Setting a Default Payment Method

- Only **one payment method** can be default at a time
- Default payment method is **auto-selected** when creating transactions
- Change default by editing any payment method and checking "Is Default"

---

## User Experience Tips

### Best Practices

1. **Create Payment Methods First**: Set up your payment methods before creating transactions
2. **Use Default Payment Method**: Set your most-used payment method as default
3. **Check Currency**: Always verify the currency matches your payment method
4. **Legacy Support**: Use "None" for transactions without a specific payment method
5. **Multi-Currency Budgets**: Budgets currently track base currency only (multi-currency support coming soon)

### Common Workflows

#### Scenario 1: Traveling Abroad
1. Create payment method for local currency (e.g., "EUR Travel Card")
2. Create transactions in EUR using this payment method
3. View spending in EUR on transaction cards
4. See total impact in USD on dashboard balance widget

#### Scenario 2: Multiple Bank Accounts
1. Create payment methods for each account (e.g., "Chase USD", "Wise EUR", "Monobank UAH")
2. Select correct payment method when creating transactions
3. View per-account balances in multi-currency widget
4. Track total net worth in base currency

#### Scenario 3: Freelancer with International Clients
1. Create payment method for each currency received (e.g., "USD Invoices", "EUR Invoices")
2. Record income in native currency
3. See conversion to base currency automatically
4. Track revenue by currency using payment method filter (future feature)

---

## Troubleshooting

### Amount Shows in Wrong Currency
**Problem**: Amount input shows USD but payment method is EUR

**Solution**:
- Check payment method selector - ensure correct payment method is selected
- Currency updates automatically when payment method changes

### Legacy Transaction Not Displaying Correctly
**Problem**: Old transaction shows strange currency symbol

**Solution**:
- Legacy transactions (created before multi-currency support) should show base currency only
- If issue persists, transaction may have corrupted data (contact support)

### Exchange Rate Seems Incorrect
**Problem**: Conversion doesn't match current market rate

**Solution**:
- MVP uses stub rates, not live rates
- Rates are approximate for testing purposes
- Card #21 will add live exchange rate API
- Rates stored at transaction creation time (won't change retroactively)

### Payment Method Not Appearing in Dropdown
**Problem**: Created payment method doesn't show in transaction dialog

**Solution**:
- Check if payment method is **active** (not archived)
- Refresh the page to reload payment methods
- Only active payment methods appear in dropdown

### Can't Create Transaction Without Payment Method
**Problem**: System requires payment method selection

**Solution**:
- Select **"None (Base Currency)"** from payment method dropdown
- This creates a legacy-style transaction without payment method
- Backward compatible with old transaction format

---

## FAQ

### Q: Can I change the payment method of an existing transaction?
**A**: Yes! Edit the transaction and select a different payment method. The amount will be recalculated with the new currency.

### Q: What happens if I delete a payment method with transactions?
**A**: You cannot delete a payment method that has transactions. Archive it instead to preserve transaction history.

### Q: Can I manually set the exchange rate?
**A**: Backend supports it, but UI not yet implemented. Coming in future release.

### Q: Do budgets support multi-currency?
**A**: Not yet. Budgets currently track in base currency only. Multi-currency budget support planned for future release.

### Q: Can I export transactions with currency info?
**A**: Not yet. Export feature will be enhanced to include native currency and conversion data in future release.

### Q: What is the base currency?
**A**: Currently hardcoded to USD. Future release will allow users to set their preferred base currency in profile settings.

### Q: Will exchange rates update for old transactions?
**A**: No. Exchange rate is stored at transaction creation time and won't change. This ensures historical accuracy.

---

## Technical Details (For Developers)

### Server Actions Used

```typescript
// Create multi-currency transaction
await createTransaction({
  amount: 1000,  // In payment method's currency
  type: "expense",
  categoryId: "...",
  date: "2024-12-01",
  paymentMethodId: "...",  // Links to payment method
});

// Get payment method balances
const result = await getPaymentMethodBalances();
// Returns: [{ paymentMethodId, name, currency, balance }, ...]

// Get total balance in base currency
const result = await getTotalBalanceInBaseCurrency();
// Returns: { totalBalance, baseCurrency, breakdown: [...] }
```

### Database Fields

Multi-currency transactions have these additional fields:
- `payment_method_id`: UUID (nullable) - Links to payment method
- `native_amount`: DECIMAL (nullable) - Amount in payment method's currency
- `exchange_rate`: DECIMAL (nullable) - Conversion rate used
- `base_currency`: VARCHAR (nullable) - Base currency code (e.g., "USD")

Legacy transactions have all multi-currency fields as NULL.

### Type Definitions

```typescript
type TransactionWithRelations = {
  // ... existing fields
  payment_method_id: string | null;
  native_amount: number | null;
  exchange_rate: number | null;
  base_currency: string | null;
  payment_method?: {
    id: string;
    name: string;
    currency: string;
    color: string | null;
  } | null;
};
```

---

## Future Roadmap

Planned enhancements for multi-currency support:

### Short Term (Next 1-2 Sprints)
- [ ] Live exchange rate API integration (Card #21)
- [ ] User profile base currency setting
- [ ] Manual exchange rate override UI
- [ ] Real-time conversion preview in forms

### Medium Term (Next 3-6 Sprints)
- [ ] Multi-currency budget tracking
- [ ] Currency conversion history chart
- [ ] Export with multi-currency data
- [ ] Currency-specific reports and analytics

### Long Term (6+ Sprints)
- [ ] Multi-currency investment tracking
- [ ] Cryptocurrency support
- [ ] Advanced currency hedging insights
- [ ] Multi-language localization with currency formatting

---

## Support & Feedback

**Questions?** Contact the development team:
- **Product Manager** (Agent 01): Feature requests and business logic
- **Backend Developer** (Agent 03): Server Actions and data issues
- **Frontend Developer** (Agent 04): UI/UX improvements and bugs
- **QA Engineer** (Agent 05): Testing and bug reports

**Found a bug?** Please report with:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshot (if applicable)
5. Browser and device info

---

**Happy multi-currency tracking!** 💰🌍
