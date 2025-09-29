// Session Management for Authentication Flow
export interface SessionData {
  token: string;
  user: any;
  loginTime: number;
  lastActivity: number;
  expiresAt: number;
}

export class SessionManager {
  private static readonly SESSION_KEY = 'crypto_session';
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
      expiresAt: now + this.SESSION_TIMEOUT
    };
    
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    this.startActivityTracking();
    return session;
  }

  // Get current session
  static getSession(): SessionData | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
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
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      
      return session;
    } catch (error) {
      console.error('Error reading session:', error);
      this.clearSession();
      return null;
    }
  }

  // Update session activity
  static updateActivity(): void {
    const session = this.getSession();
    if (session) {
      session.lastActivity = Date.now();
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    }
  }

  // Clear session
  static clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem('auth_token'); // Clear legacy token
    sessionStorage.removeItem('redirectAfterLogin');
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
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    }
  }

  // Start activity tracking
  private static startActivityTracking(): void {
    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const activityHandler = () => this.updateActivity();
    
    events.forEach(event => {
      document.addEventListener(event, activityHandler, true);
    });

    // Check session validity periodically
    const sessionCheckInterval = setInterval(() => {
      if (!this.isValidSession()) {
        clearInterval(sessionCheckInterval);
        // Store current path for redirect after login
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/auth' && currentPath !== '/') {
          sessionStorage.setItem('redirectAfterLogin', currentPath);
        }
        window.location.href = '/login';
      }
    }, 60000); // Check every minute

    // Store interval ID for cleanup
    (window as any).sessionCheckInterval = sessionCheckInterval;
  }

  // Stop activity tracking
  private static stopActivityTracking(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const activityHandler = () => this.updateActivity();
    
    events.forEach(event => {
      document.removeEventListener(event, activityHandler, true);
    });

    // Clear session check interval
    if ((window as any).sessionCheckInterval) {
      clearInterval((window as any).sessionCheckInterval);
      delete (window as any).sessionCheckInterval;
    }
  }

  // Get session info for display
  static getSessionInfo(): { loginTime: Date; lastActivity: Date; expiresAt: Date } | null {
    const session = this.getSession();
    if (!session) return null;

    return {
      loginTime: new Date(session.loginTime),
      lastActivity: new Date(session.lastActivity),
      expiresAt: new Date(session.expiresAt)
    };
  }
}