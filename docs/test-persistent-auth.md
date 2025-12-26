# Testing Persistent Auth Sessions - Quick Reference

## Quick Test (2 minutes)

### Test 1: Basic Persistence
```bash
1. Open FinanceFlow in browser
2. Login with your credentials
3. Verify you're logged in (see dashboard)
4. Close ALL browser windows (not just tab)
5. Wait 5 seconds
6. Reopen browser
7. Navigate to FinanceFlow URL
8. ✅ PASS: You're still logged in (no login prompt)
9. ❌ FAIL: You see login page (session not persisting)
```

### Test 2: Logout Works
```bash
1. While logged in, click "Sign Out" button
2. Close browser
3. Reopen browser
4. Navigate to FinanceFlow URL
5. ✅ PASS: You see login page
6. ❌ FAIL: You're still logged in (logout didn't work)
```

## Detailed Test Suite

### Test 3: Token Refresh (Long Test - 1 hour)
```bash
1. Login to FinanceFlow
2. Note the current time
3. Keep browser open but don't use the app
4. Wait 60+ minutes
5. Perform any action (create transaction, etc.)
6. ✅ PASS: Action succeeds, no errors
7. ❌ FAIL: You're logged out or see auth errors
```

### Test 4: Multi-Device
```bash
1. Login on Computer A
2. Login on Computer B (or mobile)
3. Verify both devices show logged-in state
4. Perform action on Computer A
5. Perform action on Computer B
6. ✅ PASS: Both work independently
7. ❌ FAIL: One device logs out when other logs in
```

### Test 5: Incognito/Private Mode
```bash
1. Open incognito/private window
2. Login to FinanceFlow
3. Close incognito window
4. Reopen incognito window
5. Navigate to FinanceFlow
6. ✅ EXPECTED: You're logged out (incognito clears cookies)
   This is correct behavior - incognito is designed to not persist
```

## Browser DevTools Inspection

### Check Cookies Exist
```bash
1. Login to FinanceFlow
2. Open DevTools (F12)
3. Go to Application tab → Cookies
4. Look for cookies from your domain
5. Find cookies with names starting with "sb-"
6. ✅ PASS: Multiple Supabase cookies present
7. Check "Expires / Max-Age" column
8. ✅ PASS: Far future date (indicates persistent)
```

### Check Network Activity
```bash
1. Login to FinanceFlow
2. Open DevTools → Network tab
3. Close and reopen browser
4. Navigate to FinanceFlow
5. Watch Network tab
6. ✅ PASS: No /auth/v1/token or /auth/v1/signin requests
   (Or only one refresh request, then none)
7. ❌ FAIL: Repeated auth requests on every page load
```

### Check Local Storage
```bash
1. Login to FinanceFlow
2. Open DevTools → Application → Local Storage
3. Look for Supabase-related entries
4. Note: With @supabase/ssr, tokens stored in cookies
5. ℹ️ INFO: Local storage may be empty or minimal
   This is correct - cookies are primary storage
```

## Troubleshooting Tests

### If Test 1 Fails (Not Persisting)

**Check 1: Browser Settings**
```bash
1. Open browser settings
2. Search for "cookies"
3. Ensure cookies are enabled
4. Ensure "Clear cookies on exit" is DISABLED
5. Retry Test 1
```

**Check 2: Private/Incognito Mode**
```bash
1. Verify you're NOT in private/incognito mode
2. Private mode always clears cookies on close
3. Retry Test 1 in normal browser window
```

**Check 3: Browser Extension**
```bash
1. Disable privacy/cookie-blocking extensions
2. Examples: Privacy Badger, Ghostery, etc.
3. Retry Test 1
```

**Check 4: Development Mode**
```bash
1. Check if running on localhost vs production
2. Cookie behavior may differ
3. Test on deployed version if possible
```

### If Test 3 Fails (Token Not Refreshing)

**Check 1: Network Issues**
```bash
1. Open DevTools → Network tab
2. Filter by "token" or "refresh"
3. Look for failed requests (red)
4. Check response codes (should be 200)
```

**Check 2: Middleware Running**
```bash
1. Check middleware logs (if available)
2. Verify middleware.ts is running
3. Check for errors in server logs
```

**Check 3: Supabase Project Status**
```bash
1. Visit Supabase dashboard
2. Check project status (active/paused)
3. Verify no service disruptions
```

## Expected Behaviors

### ✅ Correct Behaviors

1. **After login**: You stay logged in
2. **After browser close**: Still logged in when reopened
3. **After logout**: Must login again
4. **After 1 hour**: Still logged in (token auto-refreshed)
5. **Multiple devices**: All stay logged in independently
6. **After inactivity**: Still logged in (no timeout configured)

### ❌ Incorrect Behaviors (Report These)

1. **Random logouts**: During normal use
2. **Login loop**: Repeatedly redirected to login
3. **Logout doesn't work**: Can't sign out
4. **Multi-device logout**: One device logs out the other
5. **Frequent auth errors**: During navigation

## Performance Checks

### Monitor These Metrics

1. **Login Frequency**: Should decrease (users stay logged in longer)
2. **Auth Errors**: Should be minimal (token refresh working)
3. **Token Refresh Rate**: Check network tab for /auth/v1/token requests
4. **Session Duration**: Average time between login and logout

### Healthy Metrics

- Login frequency: Once per week or less per user
- Auth errors: < 0.1% of requests
- Token refresh: Every ~50 minutes during active use
- Session duration: Days to weeks (until explicit logout)

## Automated Test Script (Optional)

If you want to automate testing, here's a Playwright test outline:

```typescript
// apps/finance-web/tests/auth-persistence.spec.ts
import { test, expect } from '@playwright/test';

test('session persists after browser restart', async ({ browser }) => {
  // Create context with persistent storage
  const context = await browser.newContext({
    storageState: undefined // Start fresh
  });

  const page = await context.newPage();

  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'testpassword');
  await page.click('button[type="submit"]');

  // Verify logged in
  await expect(page).toHaveURL('/');
  await expect(page.locator('text=Dashboard')).toBeVisible();

  // Save cookies
  const cookies = await context.cookies();
  const supabaseCookies = cookies.filter(c => c.name.startsWith('sb-'));
  expect(supabaseCookies.length).toBeGreaterThan(0);

  // Close and reopen (simulate browser restart)
  await context.close();

  // Create new context with saved cookies
  const newContext = await browser.newContext();
  await newContext.addCookies(cookies);
  const newPage = await newContext.newPage();

  // Navigate to app
  await newPage.goto('/');

  // Verify still logged in
  await expect(newPage).toHaveURL('/');
  await expect(newPage.locator('text=Dashboard')).toBeVisible();

  await newContext.close();
});
```

## Quick Checklist

Before marking as complete, verify:

- [ ] Test 1 passes (basic persistence)
- [ ] Test 2 passes (logout works)
- [ ] Cookies visible in DevTools
- [ ] No repeated auth requests in Network tab
- [ ] No console errors related to auth
- [ ] Documentation reviewed
- [ ] Ready for production

## Support

If tests fail or you need help:

1. Check `/docs/auth-persistent-sessions.md` - Troubleshooting section
2. Check `/docs/supabase-auth-settings-guide.md` - Dashboard settings
3. Review implementation summary: `/PERSISTENT_AUTH_IMPLEMENTATION_SUMMARY.md`
4. Check Supabase dashboard for project health
5. Review browser console for errors

## Success Criteria

✅ **Implementation is successful if**:
- Test 1 passes (persistence after browser close)
- Test 2 passes (logout works correctly)
- No auth-related errors in console
- Cookies persist in DevTools
- Users report staying logged in longer

## Date

Created: December 26, 2025
Card: #70 - Implement Persistent Auth Sessions