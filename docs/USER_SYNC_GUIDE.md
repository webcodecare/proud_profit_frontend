# User Sync Implementation Guide

This document explains how the user sync functionality has been implemented in the frontend to ensure users are properly synced with the database after any login method.

## Overview

The user sync functionality ensures that after every successful login or signup (including Google/social logins), the user data is properly synchronized with the backend database. This prevents issues where users might exist in Supabase Auth but not in the application's user table.

## API Endpoint

**Endpoint:** `POST /api/auth/sync-user`

**Purpose:** Creates the user in the `users` table if missing, or does nothing if already present.

**Headers Required:**

- `Authorization: Bearer <token>` (or credentials via cookies)
- `Content-Type: application/json`

**Usage:**

```javascript
await fetch("/api/auth/sync-user", {
  method: "POST",
  credentials: "include", // ensures cookies/session are sent
});
```

## Implementation Details

### 1. Auth API Integration

The sync functionality has been added to the `authAPI` in `/src/lib/auth.ts`:

```typescript
async syncUser(): Promise<void> {
  return await apiRequest("/api/auth/sync-user", {
    method: "POST",
    headers: {
      // Credentials will be automatically included via cookies/session
      // Token will be added by apiRequest function
    },
  });
}
```

### 2. Utility Functions

A dedicated utility module has been created at `/src/lib/userSync.ts`:

```typescript
import { syncUserWithDatabase, syncUserWithDatabaseSafe } from "@/lib/userSync";

// Throws error if sync fails
await syncUserWithDatabase(token);

// Safe version - doesn't throw errors
const success = await syncUserWithDatabaseSafe(token);
```

### 3. Integration Points

#### Regular Login/Signup (useAuth hook)

The `useAuth` hook automatically calls user sync after successful authentication:

```typescript
// In login mutation onSuccess
await syncUserWithDatabaseSafe();

// In registration mutation onSuccess
await syncUserWithDatabaseSafe();
```

#### Google/Social Login (auth-callback.tsx)

The auth callback page calls user sync after processing OAuth redirects:

```typescript
// After creating session from Supabase auth
await syncUserWithDatabaseSafe(session.access_token);
```

## Usage in New Components

### For Manual Login/Signup Forms

If you create custom login/signup components, make sure to call the sync function:

```typescript
import { syncUserWithDatabaseSafe } from "@/lib/userSync";

const handleLogin = async () => {
  try {
    // Your login logic here
    const result = await customLoginFunction();

    // Sync user with database
    await syncUserWithDatabaseSafe(result.token);

    // Continue with post-login logic
  } catch (error) {
    console.error("Login failed:", error);
  }
};
```

### For Social Login Integrations

When adding new social login providers:

```typescript
import { syncUserWithDatabaseSafe } from "@/lib/userSync";

const handleSocialLogin = async (provider: string) => {
  try {
    // Your social login logic here
    const session = await socialLoginFunction(provider);

    // Sync user with database
    await syncUserWithDatabaseSafe(session.access_token);

    // Redirect or continue flow
  } catch (error) {
    console.error("Social login failed:", error);
  }
};
```

## Error Handling

The sync functionality is designed to be non-blocking:

- Uses `syncUserWithDatabaseSafe()` by default to prevent authentication failures
- Logs warnings if sync fails but doesn't break the user flow
- Can use `syncUserWithDatabase()` if you want to handle sync failures explicitly

## Testing

To test the sync functionality:

1. Check browser console for sync logs during login
2. Verify user exists in database after social login
3. Test with existing and new users
4. Verify sync doesn't break login flow if backend is unavailable

## Console Output

Look for these log messages to verify sync is working:

```
🔄 Syncing user with database...
✅ User sync completed successfully
⚠️ User sync failed, but continuing: [error details]
```

## Best Practices

1. **Always use safe sync**: Use `syncUserWithDatabaseSafe()` unless you specifically need to handle sync failures
2. **Don't block UI**: Sync happens in background and doesn't affect user experience
3. **Log appropriately**: Sync failures are logged as warnings, not errors
4. **Test thoroughly**: Verify sync works with all authentication methods

## Future Enhancements

Consider these enhancements:

1. **Retry logic**: Implement automatic retries for failed syncs
2. **Offline sync**: Queue sync requests when offline
3. **Batch sync**: Sync multiple users if needed
4. **Health checks**: Monitor sync success rates
