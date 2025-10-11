# Google Login Redirect Fix - Implementation Summary

## Problem Identified

After Google social login, users were not being properly redirected to the dashboard according to their role. The auth state showed:

- `isAuthenticated: false`
- `isLoading: false`
- `hasUser: false`

This indicated that the `useAuth` hook was not properly recognizing the authenticated state after OAuth callback.

## Root Cause

1. **Session Creation vs Auth State**: The auth-callback page was creating a session in SessionManager and tokenStorage, but the already-mounted `useAuth` context wasn't picking up the new session.
2. **Timing Issue**: The `useAuth` hook initializes once on mount, but OAuth callback happens later and needs to update the existing auth context.
3. **Missing Integration**: The auth-callback wasn't properly integrating with the existing auth flow used by regular login.

## Solution Implemented

### 1. Enhanced useAuth Hook (`/src/hooks/useAuth.tsx`)

**Added `refreshAuthState` function:**

```typescript
// Function to refresh auth state (useful for external auth flows like OAuth)
const refreshAuthState = () => {
  console.log("🔄 Refreshing auth state...");
  const newToken = SessionManager.getToken() || tokenStorage.get();

  if (newToken && newToken !== token) {
    console.log("✅ Found new token, updating auth state");
    setToken(newToken);
    queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
  }
};
```

**Enhanced debugging output** to better track session initialization and token detection.

### 2. Improved Auth Callback (`/src/pages/auth-callback.tsx`)

**Key improvements:**

- Stores session in both SessionManager AND legacy tokenStorage for compatibility
- Uses role-based redirect via `AuthUtils.getPostAuthRedirect()` (same as regular login)
- Uses `window.location.href` for full page reload to ensure auth state is properly initialized
- Includes user sync call for Google/social login users
- Enhanced logging for debugging

**Updated flow:**

```typescript
// After successful OAuth
SessionManager.createSession(session.access_token, user);
tokenStorage.set(session.access_token); // Ensure useAuth picks it up
await syncUserWithDatabaseSafe(session.access_token); // Sync user to database

// Role-based redirect (same as regular login)
const targetUrl = AuthUtils.getPostAuthRedirect(user, storedRedirect);
window.location.href = targetUrl; // Full page reload
```

### 3. Enhanced Session Detection

**Improved initialization logging:**

```typescript
if (session) {
  console.log("🔧 Session details:", {
    hasToken: !!session.token,
    hasUser: !!session.user,
    userId: session.user?.id,
    userRole: session.user?.role,
    isValid: SessionManager.isValidSession(),
  });
}
```

## How It Works Now

### Google Login Flow:

1. User clicks "Login with Google"
2. Redirected to Google OAuth
3. Google redirects back to `/auth/callback`
4. Auth callback:
   - Extracts user data from Supabase session
   - Creates session in SessionManager
   - Stores token in legacy storage
   - Calls user sync endpoint
   - Determines redirect URL based on user role
   - Uses `window.location.href` for full page reload
5. App loads with new session data
6. `useAuth` hook detects the session and sets authenticated state
7. User is properly authenticated and on correct page

### Regular Login Flow:

- Unchanged - still works as before
- Also includes user sync after successful login

## Expected Console Output

**During OAuth callback:**

```
🔧 Google login user data: { userId: "...", email: "...", role: "user" }
✅ Session and token stored for Google login
🔄 Syncing user with database...
✅ User sync completed successfully
🔧 Google login redirect: { storedRedirect: null, targetUrl: "/dashboard", userRole: "user" }
```

**During app initialization after redirect:**

```
🔧 Initializing auth session on mount
🔧 Session details: { hasToken: true, hasUser: true, userId: "...", userRole: "user", isValid: true }
🔧 ✅ Valid session found, setting token
```

## Files Modified

1. **`/src/hooks/useAuth.tsx`** - Added `refreshAuthState` function and enhanced debugging
2. **`/src/pages/auth-callback.tsx`** - Complete overhaul for better integration with auth flow
3. **User sync functionality** - Works for both regular and social login

## Testing Steps

1. Clear browser storage
2. Try Google login
3. Check console for proper logging
4. Verify redirect to correct role-based URL
5. Verify authenticated state is properly set
6. Test that user sync endpoint is called

The implementation now ensures that Google/social login works exactly like regular login with proper role-based redirects and authentication state management.
