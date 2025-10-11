import { tokenStorage } from "./auth";
import { SessionManager } from "./sessionManager";

interface TokenRefreshResult {
  success: boolean;
  token?: string;
  error?: string;
}

/**
 * Token manager for handling Supabase token refresh
 */
export class TokenManager {
  private static refreshPromise: Promise<TokenRefreshResult> | null = null;

  /**
   * Check if the current token is expired or about to expire
   */
  static isTokenExpired(token?: string): boolean {
    if (!token) return true;

    try {
      // Decode JWT to check expiry
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

      return expiryTime - currentTime < bufferTime;
    } catch (error) {
      console.error("Error checking token expiry:", error);
      return true;
    }
  }

  /**
   * Get a valid token, refreshing if necessary
   */
  static async getValidToken(): Promise<string | null> {
    let currentToken = tokenStorage.get();

    // If token is not expired, return it
    if (currentToken && !this.isTokenExpired(currentToken)) {
      return currentToken;
    }

    // If token is expired or missing, check session storage first
    console.log("🔄 Token expired or missing, checking session...");

    // Try to get token from session
    const session = SessionManager.getSession();
    if (session?.token && !this.isTokenExpired(session.token)) {
      console.log("✅ Found valid token in session");
      tokenStorage.set(session.token);
      return session.token;
    }

    // If no valid token found, return null (user needs to login again)
    console.log("❌ No valid token found, user needs to login");
    return null;
  }

  /**
   * Refresh the Supabase token using the stored refresh token
   */
  static async refreshToken(): Promise<TokenRefreshResult> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      console.log("🔄 Token refresh already in progress, waiting...");
      return await this.refreshPromise;
    }

    this.refreshPromise = this._performRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;

    return result;
  }

  private static async _performRefresh(): Promise<TokenRefreshResult> {
    try {
      // For custom JWT auth, check if we have a valid session
      const session = SessionManager.getSession();

      if (session?.token && !this.isTokenExpired(session.token)) {
        console.log("✅ Using token from session");
        tokenStorage.set(session.token);
        return { success: true, token: session.token };
      }

      // If no valid session token, user needs to login again
      console.log("❌ No valid session found, user needs to login again");
      return { success: false, error: "Session expired, please login again" };
    } catch (error: any) {
      console.error("❌ Token refresh error:", error);
      return { success: false, error: error.message || "Token refresh failed" };
    }
  }

  /**
   * Clear all tokens and force re-authentication
   */
  static async clearTokens(): Promise<void> {
    try {
      // For custom auth, we don't need to clear Supabase
      console.log("🧹 Clearing local tokens and session");
    } catch (error) {
      console.warn("Failed to clear session:", error);
    }

    // Clear local storage tokens
    tokenStorage.remove();
    SessionManager.clearSession();

    // Clear Supabase auth token (pattern from your localStorage data)
    const supabaseKey = Object.keys(localStorage).find(
      (key) => key.startsWith("sb-") && key.endsWith("-auth-token")
    );
    if (supabaseKey) {
      localStorage.removeItem(supabaseKey);
    }

    // Clear any Google login completion flags
    localStorage.removeItem("google_login_complete");
  }

  /**
   * Check if we have a refresh token available
   */
  static hasRefreshToken(): boolean {
    try {
      const supabaseKey = Object.keys(localStorage).find(
        (key) => key.startsWith("sb-") && key.endsWith("-auth-token")
      );
      const supabaseAuth = supabaseKey
        ? localStorage.getItem(supabaseKey)
        : null;

      if (supabaseAuth) {
        const authData = JSON.parse(supabaseAuth);
        return !!authData.refresh_token;
      }

      return false;
    } catch (error) {
      console.error("Error checking refresh token:", error);
      return false;
    }
  }
}
