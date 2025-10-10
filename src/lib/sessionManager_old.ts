export function setSession(session: {
  token: string;
  user: any;
  expiresAt: number;
}) {
  localStorage.setItem("crypto_session", JSON.stringify(session));
}
// Returns the current user's access token from localStorage
export function getSessionToken() {
  try {
    // Try crypto_session first
    const cryptoSessionRaw = localStorage.getItem("crypto_session");
    if (cryptoSessionRaw) {
      const cryptoSession = JSON.parse(cryptoSessionRaw);
      if (cryptoSession?.token) {
        console.log(
          "[SessionManager] Using token from crypto_session:",
          cryptoSession.token
        );
        return cryptoSession.token;
      }
    }
    // Fallback to auth_token
    const authToken = localStorage.getItem("auth_token");
    if (authToken) {
      console.log("[SessionManager] Using token from auth_token:", authToken);
      return authToken;
    }
    return "";
  } catch (e) {
    console.error("[SessionManager] Error parsing session:", e);
    return "";
  }
}
import { UniversalStorage } from "./storage";

// Session Management for Authentication Flow
export interface SessionData {
  token: string;
  user: any;
  loginTime: number;
  lastActivity: number;
  expiresAt: number;
}

export class SessionManager {
  private static readonly SESSION_KEY = "crypto_session";
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly ACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours of inactivity

  // Create new session
  static createSession(token: string, user: any): SessionData {
    const now = Date.now();
    const session: SessionData = {
      token,
      user,
      loginTime: now,
      lastActivity: now,
      expiresAt: now + this.SESSION_TIMEOUT,
    };

    console.log("📝 SessionManager.createSession called with:", {
      tokenLength: token?.length,
      userId: user?.id,
      userRole: user?.role,
      storageType: UniversalStorage.getStorageType(),
    });

    try {
      const sessionString = JSON.stringify(session);
      console.log("📝 Session JSON length:", sessionString.length);
      localStorage.setItem(this.SESSION_KEY, sessionString);
      console.log("✅ Session written to localStorage");

      // Verify it was actually written
      const verification = localStorage.getItem(this.SESSION_KEY);
      console.log(
        "✅ Session verification:",
        verification ? "EXISTS" : "FAILED"
      );
    } catch (error) {
      console.error("❌ Failed to write session to storage:", error);
      throw error;
    }

    this.startActivityTracking();
    return session;
  }

  // Get current session
  static getSession(): SessionData | null {
    try {
      const sessionData = UniversalStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      const session: SessionData = JSON.parse(sessionData);
      const now = Date.now();

      // Check if session is expired
      if (now > session.expiresAt) {
        this.clearSession();
        return null;
      }

      // Check for inactivity timeout
      if (now - session.lastActivity > this.ACTIVITY_TIMEOUT) {
        this.clearSession();
        return null;
      }

      // Update last activity
      session.lastActivity = now;
      UniversalStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

      return session;
    } catch (error) {
      console.error("Error reading session:", error);
      this.clearSession();
      return null;
    }
  }

  // Update session activity
  static updateActivity(): void {
    const session = this.getSession();
    if (session) {
      session.lastActivity = Date.now();
      UniversalStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    }
  }

  // Clear session
  static clearSession(): void {
    UniversalStorage.removeItem(this.SESSION_KEY);
    UniversalStorage.removeItem("auth_token"); // Clear legacy token
    try {
      sessionStorage.removeItem("redirectAfterLogin");
    } catch (e) {
      // Ignore if sessionStorage is also blocked
    }
    this.stopActivityTracking();
  }

  // Check if session is valid
  static isValidSession(): boolean {
    return this.getSession() !== null;
  }

  // Get session token
  static getToken(): string | null {
    const session = this.getSession();
    return session?.token || null;
  }

  // Get session user
  static getUser(): any | null {
    const session = this.getSession();
    return session?.user || null;
  }

  // Extend session
  static extendSession(): void {
    const session = this.getSession();
    if (session) {
      session.expiresAt = Date.now() + this.SESSION_TIMEOUT;
      UniversalStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    }
  }

  // Start activity tracking
  private static startActivityTracking(): void {
    // Track user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    const activityHandler = () => this.updateActivity();

    events.forEach((event) => {
      document.addEventListener(event, activityHandler, true);
    });

    // Check session validity periodically
    const sessionCheckInterval = setInterval(() => {
      if (!this.isValidSession()) {
        clearInterval(sessionCheckInterval);
        // Store current path for redirect after login
        const currentPath = window.location.pathname;
        if (
          currentPath !== "/login" &&
          currentPath !== "/auth" &&
          currentPath !== "/"
        ) {
          sessionStorage.setItem("redirectAfterLogin", currentPath);
        }
        window.location.href = "/login";
      }
    }, 60000); // Check every minute

    // Store interval ID for cleanup
    (window as any).sessionCheckInterval = sessionCheckInterval;
  }

  // Stop activity tracking
  private static stopActivityTracking(): void {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    const activityHandler = () => this.updateActivity();

    events.forEach((event) => {
      document.removeEventListener(event, activityHandler, true);
    });

    // Clear session check interval
    if ((window as any).sessionCheckInterval) {
      clearInterval((window as any).sessionCheckInterval);
      delete (window as any).sessionCheckInterval;
    }
  }

  // Get session info for display
  static getSessionInfo(): {
    loginTime: Date;
    lastActivity: Date;
    expiresAt: Date;
  } | null {
    const session = this.getSession();
    if (!session) return null;

    return {
      loginTime: new Date(session.loginTime),
      lastActivity: new Date(session.lastActivity),
      expiresAt: new Date(session.expiresAt),
    };
  }
}
