# Auth Session Debugging Guide

## Current Issue

You're seeing user data for `elite@proudprofits.com` in the console, but you're actually logged in with `niloyroy184@gmail.com` according to the backend.

## Root Cause Analysis

This suggests there's cached/stale session data that doesn't match the current authentication state.

## Debugging Steps

### Step 1: Add Debug Component

Add the AuthDebugger component to any page to see the current auth state:

```tsx
import AuthDebugger from "@/components/debug/AuthDebugger";

// In your component JSX:
<AuthDebugger />;
```

### Step 2: Check Console Logs

After adding the debugger, check the browser console for:

- `🐛 Auth Debug Info:` - Complete auth state
- `🔍 Full Supabase session:` - OAuth callback session data
- `🔧 Session details:` - SessionManager data

### Step 3: Manual Debugging in Browser Console

Run these commands in browser console to check auth state:

```javascript
// Check Supabase current user
const {
  data: { user },
} = await supabase.auth.getUser();
console.log("Current Supabase user:", user);

// Check Supabase session
const {
  data: { session },
} = await supabase.auth.getSession();
console.log("Current Supabase session:", session);

// Check SessionManager
console.log("SessionManager data:", SessionManager.getSession());

// Check localStorage
console.log("Crypto session:", localStorage.getItem("crypto_session"));
console.log("Auth token:", localStorage.getItem("auth_token"));
```

### Step 4: Clear All Auth Data

If you find mismatched data, clear everything:

```javascript
// Clear Supabase
await supabase.auth.signOut();

// Clear SessionManager
SessionManager.clearSession();

// Clear localStorage
localStorage.removeItem("crypto_session");
localStorage.removeItem("auth_token");
localStorage.clear(); // Nuclear option

// Refresh page
window.location.reload();
```

## Expected Behavior After Fix

1. **Before Login**: All auth data should be null/empty
2. **During OAuth**: Console should show correct user email in session
3. **After Redirect**: SessionManager and Supabase should have matching user data
4. **In useAuth**: Should show correct user with `isAuthenticated: true`

## Common Issues & Solutions

### Issue 1: Cached Session Data

**Symptoms**: Wrong email in console logs
**Solution**: Clear all browser storage and try again

### Issue 2: Session Creation Timing

**Symptoms**: Session exists but useAuth shows not authenticated
**Solution**: Check if session is being created but not picked up by useAuth

### Issue 3: Multiple Supabase Projects

**Symptoms**: Session data from different project/environment
**Solution**: Verify Supabase URL/keys in .env match your intended project

### Issue 4: Browser Storage Conflicts

**Symptoms**: Inconsistent auth state across tabs
**Solution**: Use incognito mode for testing

## Testing OAuth Flow

1. **Clear all auth data** (use debugger or console)
2. **Start fresh login** with your Google account (niloyroy184@gmail.com)
3. **Check console logs** during OAuth callback
4. **Verify session data** matches your actual Google account
5. **Confirm redirect** goes to correct role-based URL

## Debug Output to Look For

### Correct OAuth Flow:

```
🧹 Clearing existing auth state before OAuth callback
🔍 URL hash: #access_token=...
🔍 Current URL: http://localhost:5173/auth/callback#access_token=...
🔍 Supabase getSession result: { hasSession: true, sessionUser: "niloyroy184@gmail.com" }
🔍 Full Supabase session: { user: { email: "niloyroy184@gmail.com", ... } }
🔧 Extracted user data for session: { email: "niloyroy184@gmail.com", ... }
✅ Session and token stored for Google login
🔧 Google login redirect: { targetUrl: "/dashboard", userRole: "user" }
```

### Problem Indicators:

```
🔍 sessionUser: "elite@proudprofits.com" // Wrong email!
🔍 Full Supabase session: { user: { email: "elite@proudprofits.com" } } // Cached data!
```

If you see the wrong email in these logs, the issue is in Supabase session data, not our app logic.
