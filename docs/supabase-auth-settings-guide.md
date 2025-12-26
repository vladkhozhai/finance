# Supabase Auth Settings Guide (Card #70)

## Dashboard Configuration for Persistent Sessions

### Accessing Auth Settings

1. Navigate to your Supabase project dashboard
2. Go to **Authentication** → **Settings**
3. URL format: `https://supabase.com/dashboard/project/ylxeutefnnagksmaagvy/settings/auth`

### Recommended Settings for Persistent Sessions

#### JWT Settings (Required)

Located in **Authentication** → **Settings** → **General Settings**

| Setting | Recommended Value | Purpose |
|---------|------------------|---------|
| **JWT Expiry** | `3600` (1 hour) | Access token lifetime in seconds. Balance between security and UX. |

#### Advanced Auth Settings (Optional)

Located in **Authentication** → **Settings** → **Advanced Settings**

| Setting | Recommended Value | Notes |
|---------|------------------|--------|
| **Refresh Token Rotation** | `Enabled` (default) | Each refresh generates new token pair. Enhanced security. |
| **Refresh Token Reuse Detection** | `Enabled` (default) | Detects and terminates sessions if token reuse detected. |
| **Time-box user sessions** | `Disabled` or `7-30 days` | Optional max session lifetime. Leave disabled for true persistence. |
| **Inactivity timeout** | `Disabled` or `30+ days` | Optional timeout after no activity. Leave disabled for true persistence. |
| **Single session per user** | `Disabled` | Allow multiple devices. Enable only if single-device requirement exists. |

### Current Production Settings

**Project**: financeflow-prod (ylxeutefnnagksmaagvy)

To verify current settings, visit:
- https://supabase.com/dashboard/project/ylxeutefnnagksmaagvy/settings/auth

**Default Supabase Settings (if unchanged)**:
- JWT Expiry: 3600 seconds (1 hour)
- Refresh Token Rotation: Enabled
- Refresh Token Reuse Detection: Enabled
- Time-box sessions: Disabled (unlimited)
- Inactivity timeout: Disabled (no timeout)
- Single session: Disabled (multiple sessions allowed)

These defaults are **perfect for persistent auth** - no changes needed!

### How These Settings Work Together

```
User Login:
├─ Access Token issued (expires in 1 hour)
├─ Refresh Token issued (long-lived, no expiration by default)
└─ Both stored in browser cookies (persistSession: true)

After Browser Close & Reopen:
├─ Cookies still present (persistent storage)
├─ Middleware validates access token
├─ If expired: automatically refresh using refresh token
├─ New access + refresh token pair issued
└─ User stays logged in

After 1 Week of Inactivity:
├─ Access token long expired
├─ Refresh token still valid (no timeout configured)
├─ User opens app
├─ Middleware triggers refresh
└─ New tokens issued, user logged in automatically
```

### Adjusting for Stricter Security

If you need stricter security policies:

#### Option 1: Maximum Session Lifetime
Set **Time-box user sessions** to force re-authentication after X days:
- 7 days: Very strict, good for financial apps
- 14 days: Balanced
- 30 days: Lenient but still has limit

#### Option 2: Inactivity Timeout
Set **Inactivity timeout** to expire sessions after no activity:
- 7 days: Users must use app weekly
- 30 days: Users must use app monthly
- 90 days: Very lenient

#### Option 3: Single Device Only
Enable **Single session per user** to:
- Allow only one active session
- Previous sessions terminated on new login
- Good for preventing account sharing

### Verifying Settings Work

After configuring, test these scenarios:

1. **Basic Test**: Login → Close browser → Reopen → Still logged in ✓
2. **Token Refresh Test**: Wait 1+ hour → Perform action → No logout ✓
3. **Multi-Device Test**: Login on desktop → Login on mobile → Both work ✓

### Troubleshooting

#### Users Getting Logged Out Unexpectedly

**Check**:
1. JWT Expiry not too short (should be >= 3600 seconds)
2. Time-box sessions not too short (or disabled)
3. Inactivity timeout not too short (or disabled)
4. Single session not enabled (unless desired)

**How to Check**:
```bash
# Check auth settings via Supabase MCP (if available)
# Or visit dashboard URL directly
```

#### Token Refresh Failing

**Check**:
1. Refresh token rotation enabled
2. Middleware running on all routes
3. Network tab for 401/403 errors
4. Browser cookies not being cleared

## Implementation Status

- ✅ Client configured with `persistSession: true`
- ✅ Client configured with `autoRefreshToken: true`
- ✅ Middleware refreshes sessions on every request
- ✅ Cookies persist across browser sessions
- ✅ Documentation created

## Testing Checklist

- [ ] Manual test: Login → Close browser → Reopen (expect: still logged in)
- [ ] Manual test: Login → Wait 1+ hour → Use app (expect: no logout)
- [ ] Manual test: Login → Explicit logout → Reopen browser (expect: logged out)
- [ ] Check: Browser DevTools → Application → Cookies (verify Supabase cookies present)
- [ ] Check: Network tab during app use (verify no repeated login requests)

## References

- [Supabase Auth Sessions Docs](https://supabase.com/docs/guides/auth/sessions)
- [Supabase Dashboard - Auth Settings](https://supabase.com/dashboard/project/ylxeutefnnagksmaagvy/settings/auth)
- Implementation docs: `/docs/auth-persistent-sessions.md`