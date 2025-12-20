# Bug #26 - QA Test Plan: Profile Query Parameter Redirects

## 🎯 Test Objective
Verify that old profile URLs with `?tab=*` query parameters correctly redirect to new nested routes.

## 📋 Prerequisites
- Development server running: `npm run dev`
- Valid test user account
- Browser with developer tools open (to check network redirects)

## 🧪 Test Cases

### Test Case 1: Payment Methods Tab Redirect
**Test URL**: `http://localhost:3000/profile?tab=payment-methods`

**Steps**:
1. Log in to the application
2. Navigate to the test URL (paste in address bar)
3. Press Enter

**Expected Results**:
- ✅ URL changes to: `http://localhost:3000/profile/payment-methods`
- ✅ Payment Methods page content displays
- ✅ "Payment Methods" tab is highlighted in sidebar
- ✅ No console errors
- ✅ Browser history shows the redirect

**Actual Results**:
- [ ] Pass
- [ ] Fail (describe issue): ________________

---

### Test Case 2: Categories Tab Redirect
**Test URL**: `http://localhost:3000/profile?tab=categories`

**Steps**:
1. While logged in, navigate to the test URL
2. Observe the redirect behavior

**Expected Results**:
- ✅ URL changes to: `http://localhost:3000/profile/categories`
- ✅ Categories page content displays
- ✅ Category list is visible
- ✅ "Categories" tab is highlighted in sidebar
- ✅ No console errors

**Actual Results**:
- [ ] Pass
- [ ] Fail (describe issue): ________________

---

### Test Case 3: Tags Tab Redirect
**Test URL**: `http://localhost:3000/profile?tab=tags`

**Steps**:
1. While logged in, navigate to the test URL
2. Observe the redirect behavior

**Expected Results**:
- ✅ URL changes to: `http://localhost:3000/profile/tags`
- ✅ Tags page content displays
- ✅ Tag list is visible
- ✅ "Tags" tab is highlighted in sidebar
- ✅ No console errors

**Actual Results**:
- [ ] Pass
- [ ] Fail (describe issue): ________________

---

### Test Case 4: Preferences Tab Redirect
**Test URL**: `http://localhost:3000/profile?tab=preferences`

**Steps**:
1. While logged in, navigate to the test URL
2. Observe the redirect behavior

**Expected Results**:
- ✅ URL changes to: `http://localhost:3000/profile/preferences`
- ✅ Preferences page content displays
- ✅ Currency and theme settings visible
- ✅ "Preferences" tab is highlighted in sidebar
- ✅ No console errors

**Actual Results**:
- [ ] Pass
- [ ] Fail (describe issue): ________________

---

### Test Case 5: Overview Tab Redirect (Explicit)
**Test URL**: `http://localhost:3000/profile?tab=overview`

**Steps**:
1. While logged in, navigate to the test URL
2. Observe the redirect behavior

**Expected Results**:
- ✅ URL changes to: `http://localhost:3000/profile/overview`
- ✅ Overview page content displays
- ✅ Profile information visible
- ✅ "Overview" tab is highlighted in sidebar
- ✅ No console errors

**Actual Results**:
- [ ] Pass
- [ ] Fail (describe issue): ________________

---

### Test Case 6: Unknown Tab (Fallback Behavior)
**Test URL**: `http://localhost:3000/profile?tab=nonexistent`

**Steps**:
1. While logged in, navigate to the test URL with an invalid tab name
2. Observe the fallback behavior

**Expected Results**:
- ✅ URL changes to: `http://localhost:3000/profile/overview`
- ✅ Overview page content displays (default fallback)
- ✅ No error messages shown to user
- ✅ No console errors

**Actual Results**:
- [ ] Pass
- [ ] Fail (describe issue): ________________

---

### Test Case 7: No Tab Parameter (Default Behavior)
**Test URL**: `http://localhost:3000/profile`

**Steps**:
1. While logged in, navigate to `/profile` without any query parameters
2. Observe the default behavior

**Expected Results**:
- ✅ URL changes to: `http://localhost:3000/profile/overview`
- ✅ Overview page content displays (default page)
- ✅ "Overview" tab is highlighted in sidebar
- ✅ No console errors

**Actual Results**:
- [ ] Pass
- [ ] Fail (describe issue): ________________

---

### Test Case 8: Unauthenticated User Redirect
**Test URL**: `http://localhost:3000/profile?tab=payment-methods`

**Steps**:
1. Log out of the application (or open in incognito/private window)
2. Navigate to the test URL
3. Log in when prompted
4. Observe final destination

**Expected Results**:
- ✅ Initially redirected to: `http://localhost:3000/login`
- ✅ After successful login, should reach payment methods page
- ✅ Final URL: `http://localhost:3000/profile/payment-methods`
- ✅ No console errors

**Actual Results**:
- [ ] Pass
- [ ] Fail (describe issue): ________________

---

### Test Case 9: Bookmarked URL (Simulated)
**Test URL**: `http://localhost:3000/profile?tab=categories`

**Steps**:
1. Copy the URL to clipboard
2. Open a new browser tab
3. Paste the URL and press Enter
4. Observe behavior (should work identically to direct navigation)

**Expected Results**:
- ✅ Redirects correctly even from bookmarked/copied URL
- ✅ URL changes to: `http://localhost:3000/profile/categories`
- ✅ Categories page displays
- ✅ No console errors

**Actual Results**:
- [ ] Pass
- [ ] Fail (describe issue): ________________

---

### Test Case 10: Browser Back/Forward Navigation
**Test URL**: Sequential navigation testing

**Steps**:
1. Navigate to: `http://localhost:3000/profile?tab=payment-methods`
2. Observe redirect to `/profile/payment-methods`
3. Navigate to: `http://localhost:3000/profile?tab=tags`
4. Observe redirect to `/profile/tags`
5. Click browser Back button
6. Click browser Forward button

**Expected Results**:
- ✅ Back button returns to payment methods page
- ✅ Forward button returns to tags page
- ✅ URLs maintain correct format (nested routes, not query params)
- ✅ No broken navigation
- ✅ No console errors

**Actual Results**:
- [ ] Pass
- [ ] Fail (describe issue): ________________

---

## 🔍 Developer Tools Checks

### Network Tab Verification
1. Open browser Developer Tools (F12)
2. Go to Network tab
3. Navigate to a test URL with `?tab=*` parameter
4. Check the redirect chain:

**Expected Network Behavior**:
- Request to `/profile?tab=payment-methods` → Status 307 (Temporary Redirect)
- Redirect location header points to `/profile/payment-methods`
- Final request to `/profile/payment-methods` → Status 200 (OK)

**Verification**:
- [ ] Redirect status codes are correct (307 or 308)
- [ ] Redirect happens server-side (not client-side)
- [ ] No multiple redirect loops
- [ ] Final page loads successfully

### Console Tab Verification
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Navigate to each test URL
4. Check for errors or warnings

**Expected Console Behavior**:
- ✅ No red error messages
- ✅ No warning messages about routing
- ✅ No React hydration errors
- ✅ No unhandled Promise rejections

**Verification**:
- [ ] Console is clean (no errors)
- [ ] No unexpected warnings
- [ ] Application functions normally

---

## 🌐 Cross-Browser Testing

### Chrome
- [ ] Test Case 1-10: All Pass
- [ ] No browser-specific issues

### Firefox
- [ ] Test Case 1-10: All Pass
- [ ] No browser-specific issues

### Safari
- [ ] Test Case 1-10: All Pass
- [ ] No browser-specific issues

### Edge
- [ ] Test Case 1-10: All Pass
- [ ] No browser-specific issues

---

## 📱 Mobile Testing (Optional)

### Mobile Chrome (Android/iOS)
- [ ] Query param redirects work on mobile
- [ ] No mobile-specific routing issues

### Mobile Safari (iOS)
- [ ] Query param redirects work on mobile
- [ ] No mobile-specific routing issues

---

## ✅ Regression Testing

Verify that normal navigation still works:

### Sidebar Navigation
- [ ] Click "Overview" in sidebar → Works correctly
- [ ] Click "Payment Methods" in sidebar → Works correctly
- [ ] Click "Categories" in sidebar → Works correctly
- [ ] Click "Tags" in sidebar → Works correctly
- [ ] Click "Preferences" in sidebar → Works correctly

### Direct URL Navigation (New Format)
- [ ] Navigate to `/profile/overview` directly → Works
- [ ] Navigate to `/profile/payment-methods` directly → Works
- [ ] Navigate to `/profile/categories` directly → Works
- [ ] Navigate to `/profile/tags` directly → Works
- [ ] Navigate to `/profile/preferences` directly → Works

---

## 📊 Test Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC1: Payment Methods | ⏳ Pending | |
| TC2: Categories | ⏳ Pending | |
| TC3: Tags | ⏳ Pending | |
| TC4: Preferences | ⏳ Pending | |
| TC5: Overview | ⏳ Pending | |
| TC6: Unknown Tab | ⏳ Pending | |
| TC7: No Tab | ⏳ Pending | |
| TC8: Unauthenticated | ⏳ Pending | |
| TC9: Bookmarked URL | ⏳ Pending | |
| TC10: Back/Forward | ⏳ Pending | |

**Overall Status**: ⏳ Testing Not Started

**Pass Rate**: 0/10 (0%)

---

## 🐛 Bug Report Template

If any test fails, use this template to report:

```
**Bug Title**: Query param redirect fails for [specific tab]

**Test Case**: TC# - [Test Case Name]

**Steps to Reproduce**:
1. Navigate to [URL]
2. Observe behavior

**Expected Behavior**:
[Describe expected outcome]

**Actual Behavior**:
[Describe what actually happened]

**Browser**: [Browser name and version]
**OS**: [Operating system]
**Screenshot**: [Attach if applicable]
**Console Errors**: [Copy any errors from console]
```

---

## ✍️ Sign-Off

**Tested By**: _________________________
**Date**: _________________________
**Test Environment**: Development / Staging / Production
**Final Status**: ✅ All Tests Passed / ❌ Issues Found

**QA Notes**:
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

---

**Next Steps After Testing**:
1. If all tests pass: Mark Trello Card #26 as "Done"
2. If tests fail: Report bugs using template above
3. Update bug status in Trello with test results
4. Notify Frontend Developer if fixes are needed
