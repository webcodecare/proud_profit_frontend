import { buildApiUrl } from "@/config/api";
import { TokenManager } from "./tokenManager";

/**
 * Sync user with database after login/signup
 * Call this after successful login or signup (including Google/social)
 * to ensure the user exists in the app database.
 *
 * This will create the user in the users table if missing,
 * or do nothing if already present.
 */
export async function syncUserWithDatabase(token?: string): Promise<void> {
  try {
    console.log("🔄 Syncing user with database...");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Use provided token or get a valid token (with auto-refresh if needed)
    let authToken = token;
    if (!authToken) {
      authToken = (await TokenManager.getValidToken()) || undefined;
    }

    // Add Authorization header if token is available
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const response = await fetch(buildApiUrl("/api/auth/sync-user"), {
      method: "POST",
      credentials: "include", // ensures cookies/session are sent
      headers,
    });

    if (response.ok) {
      console.log("✅ User sync completed successfully");
    } else {
      const errorText = await response.text();
      console.warn("⚠️ User sync failed:", response.status, errorText);
      throw new Error(`User sync failed: ${response.status} ${errorText}`);
    }
  } catch (error) {
    console.error("❌ User sync error:", error);
    throw error;
  }
}

/**
 * Safe version of syncUserWithDatabase that doesn't throw errors
 * Use this when you don't want sync failures to break the user flow
 */
export async function syncUserWithDatabaseSafe(
  token?: string
): Promise<boolean> {
  try {
    await syncUserWithDatabase(token);
    return true;
  } catch (error) {
    console.warn("⚠️ User sync failed, but continuing:", error);
    return false;
  }
}
