# Persistent Auth Sessions Implementation (Card #70)

## Overview

FinanceFlow implements persistent authentication sessions to keep users logged in across browser sessions. Users will remain authenticated without frequent re-login requirements.

## Implementation Details

### Client-Side Configuration

**File**: `/apps/finance-web/src/lib/supabase/client.ts`

The browser client is configured with:

```typescript
createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,        // Sessions persist across browser restarts
    autoRefreshToken: true,       // Automatically refresh tokens before expiry
    detectSessionInUrl: true,     // Handle OAuth callbacks
  },
});
```

#### Key Features:

1. **persistSession: true**
   - Sessions are stored in browser cookies
   - Survives browser restarts and tab closes
   - Users remain logged in until explicit logout

2. **autoRefreshToken: true**
   - Tokens are automatically refreshed before expiration
   - Prevents session interruption during active use
   - Refresh happens in the background without user interaction

3. **detectSessionInUrl: true**
   - Handles OAuth provider redirects
   - Extracts auth tokens from URL after social login

### Server-Side Session Management

**File**: `/apps/finance-web/middleware.ts`

The Next.js middleware runs on every request to:
- Verify and refresh user sessions
- Update cookies with fresh tokens
- Ensure consistent auth state between client and server

**File**: `/apps/finance-web/src/lib/supabase/middleware.ts`

The `updateSession()` function:
- Calls `supabase.auth.getUser()` to refresh session
- Updates response cookies with new tokens
- Handles session expiration gracefully

### Session Lifetime

Supabase Auth uses two types of tokens:

1. **Access Token (JWT)**
   - Default lifetime: 1 hour
   - Used for API authorization
   - Automatically refreshed before expiry

2. **Refresh Token**
   - Long-lived (can be configured to never expire by default)
   - Used to obtain new access tokens
   - Invalidated only on logout or security events

### How Persistent Sessions Work

```
User Login Flow:
1. User enters credentials → signInWithPassword()
2. Supabase returns access token + refresh token
3. Tokens stored in browser cookies (via @supabase/ssr)
4. persistSession: true ensures cookies persist after browser close

Token Refresh Flow (Automatic):
1. Client detects access token will expire soon (< 10% lifetime remaining)
2. autoRefreshToken: true triggers automatic refresh
3. Refresh token exchanged for new access + refresh token pair
4. New tokens replace old ones in cookies
5. User stays logged in without interruption

Session Restoration (Browser Restart):
1. User reopens browser
2. Cookies still present (persistSession: true)
3. Middleware calls getUser() to validate session
4. If tokens valid → user stays logged in
5. If expired but refresh token valid → auto-refresh → logged in
6. If refresh token invalid → redirect to login
```

## Security Considerations

1. **Cookie Storage**
   - Tokens stored in HTTP-only cookies (when using @supabase/ssr)
   - Not accessible to JavaScript (prevents XSS attacks)
   - Secure flag enabled in production (HTTPS only)

2. **Token Rotation**
   - Refresh tokens are single-use (Supabase default)
   - Each refresh generates new token pair
   - Prevents replay attacks

3. **Session Termination**
   - Users can explicitly logout via signOut()
   - Sessions terminate on password change
   - Can be terminated via Supabase dashboard

4. **Refresh Token Reuse Detection**
   - Supabase detects if same refresh token used twice
   - Indicates potential token theft
   - Automatically terminates session for security

## Configuration Options

### Recommended JWT Expiry Settings

Access the Supabase Dashboard → Authentication → Settings:

- **JWT Expiry Time**: 3600 seconds (1 hour) - RECOMMENDED
  - Balance between security and user experience
  - Short enough to limit exposure if token stolen
  - Long enough to avoid constant refreshes

- **Refresh Token Rotation**: Enabled (default)
  - Each refresh generates new token pair
  - Enhanced security against token theft

- **Refresh Token Reuse Detection**: Enabled (default)
  - Detects suspicious activity
  - Terminates session if token reuse detected

### Advanced Options (Optional)

For stricter security requirements:

- **Time-box user sessions**: Set max session lifetime (e.g., 7 days)
  - Users forced to re-authenticate after period
  - Useful for sensitive applications

- **Inactivity timeout**: Set session expiry on inactivity (e.g., 30 days)
  - Sessions expire if not refreshed within period
  - Balance security vs. convenience

- **Single session per user**: Only allow one active session
  - Previous sessions terminated on new login
  - Prevents session hijacking on shared devices

## Testing Persistent Sessions

### Manual Testing Steps

1. **Basic Persistence Test**
   ```
   1. Login to FinanceFlow
   2. Close browser completely (not just tab)
   3. Reopen browser and navigate to app
   4. Expected: Still logged in, no login prompt
   ```

2. **Token Refresh Test**
   ```
   1. Login to FinanceFlow
   2. Wait 50+ minutes (near token expiry)
   3. Perform an action (create transaction, navigate)
   4. Expected: Action succeeds, no logout, no errors
   ```

3. **Logout Test**
   ```
   1. Login to FinanceFlow
   2. Click logout button
   3. Close and reopen browser
   4. Navigate to app
   5. Expected: Redirected to login page
   ```

4. **Token Expiry Test**
   ```
   1. Login to FinanceFlow
   2. In Supabase Dashboard → Auth → Users → click user
   3. Click "Sign Out User"
   4. In app, try to perform action
   5. Expected: Redirected to login (session invalid)
   ```

### Automated Testing

Playwright tests should verify:
- Session persistence after page reload
- Auto-refresh doesn't interrupt user actions
- Logout properly clears session

## Troubleshooting

### Issue: Users logged out unexpectedly

**Possible Causes**:
1. JWT expiry too short (< 1 hour not recommended)
2. Refresh token reuse detection false positive
3. Cookie storage disabled in browser
4. Third-party cookie blocking

**Solutions**:
- Verify JWT expiry is 1 hour (3600s) in Supabase dashboard
- Check browser console for auth errors
- Ensure cookies enabled in browser settings
- Check middleware is running on all routes

### Issue: Token refresh fails

**Possible Causes**:
1. Network issues during refresh
2. Refresh token expired/invalid
3. Supabase project paused
4. CORS misconfiguration

**Solutions**:
- Check network tab for failed requests
- Verify Supabase project is active
- Check CORS settings in Supabase dashboard
- Review middleware logs for errors

### Issue: Session not persisting across browser restarts

**Possible Causes**:
1. Browser in incognito/private mode (cookies cleared on close)
2. Browser cookie settings (clear on exit)
3. persistSession not configured
4. Cookie domain mismatch

**Solutions**:
- Test in normal (non-incognito) browser window
- Check browser privacy settings
- Verify client.ts has persistSession: true
- Inspect cookies in DevTools (Application → Cookies)

## Monitoring

### Key Metrics to Track

1. **Session Duration**
   - Average time between login and logout
   - Track via Supabase Analytics

2. **Token Refresh Rate**
   - Frequency of token refresh operations
   - Monitor via Supabase logs

3. **Login Frequency**
   - Decrease indicates persistent sessions working
   - Track via application analytics

4. **Session Termination Events**
   - Unexpected logouts
   - Monitor error logs and user feedback

## References

- [Supabase Auth Sessions Documentation](https://supabase.com/docs/guides/auth/sessions)
- [Next.js Server-Side Auth with Supabase](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [@supabase/ssr Package](https://github.com/supabase/supabase-js/tree/master/packages/ssr)
- [JWT Best Practices](https://supabase.com/docs/guides/auth/jwts)

## Related Files

- `/apps/finance-web/src/lib/supabase/client.ts` - Browser client configuration
- `/apps/finance-web/src/lib/supabase/server.ts` - Server client configuration
- `/apps/finance-web/src/lib/supabase/middleware.ts` - Session refresh logic
- `/apps/finance-web/middleware.ts` - Next.js middleware entry point
- `/apps/finance-web/src/app/actions/auth.ts` - Auth server actions (login/logout)

## Implementation Date

Implemented: 2025-12-26
Card: #70 - Implement Persistent Auth Sessions