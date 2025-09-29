// Authentication Utility Functions
import { SessionManager } from "./sessionManager";

export class AuthUtils {
  // Check if user has required permissions
  static hasPermission(user: any, requiredRole?: string): boolean {
    if (!user) return false;
    if (!requiredRole) return true;
    
    // Role hierarchy: superuser > admin > user
    const roleHierarchy = {
      'superuser': 3,
      'admin': 2,
      'user': 1
    };
    
    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
    
    return userLevel >= requiredLevel;
  }

  // Check if current session is valid
  static isSessionValid(): boolean {
    return SessionManager.isValidSession();
  }

  // Get user display name
  static getUserDisplayName(user: any): string {
    if (!user) return 'Anonymous';
    return user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email || 'User';
  }

  // Get user initials for avatar
  static getUserInitials(user: any): string {
    if (!user) return 'A';
    
    if (user.firstName) {
      const firstInitial = user.firstName.charAt(0).toUpperCase();
      const lastInitial = user.lastName ? user.lastName.charAt(0).toUpperCase() : '';
      return firstInitial + lastInitial;
    }
    
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return 'U';
  }

  // Format role for display
  static formatRole(role: string): string {
    switch (role) {
      case 'superuser':
        return 'Super User';
      case 'admin':
        return 'Administrator';
      case 'user':
        return 'User';
      default:
        return 'Unknown';
    }
  }

  // Check if route requires authentication
  static isProtectedRoute(path: string): boolean {
    const publicRoutes = ['/', '/auth', '/login', '/pricing', '/market-data', '/about', '/contact', '/privacy', '/terms'];
    return !publicRoutes.includes(path);
  }

  // Check if route requires admin access
  static isAdminRoute(path: string): boolean {
    return path.startsWith('/admin');
  }

  // Generate secure redirect URL
  static getSafeRedirectUrl(redirectUrl?: string): string {
    if (!redirectUrl) return '/dashboard';
    
    // Only allow internal redirects
    if (redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')) {
      return redirectUrl;
    }
    
    return '/dashboard';
  }

  // Log security events
  static logSecurityEvent(event: string, details?: any): void {
    console.log(`[Security Event] ${event}`, details);
    
    // In production, this could send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to monitoring service
    }
  }

  // Clear all authentication data
  static clearAllAuthData(): void {
    SessionManager.clearSession();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_preferences');
    sessionStorage.clear();
    
    this.logSecurityEvent('AUTH_DATA_CLEARED');
  }

  // Validate token format
  static isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    
    // Basic token validation (you can enhance this based on your token format)
    return token.length > 10 && /^[a-zA-Z0-9\-_]+$/.test(token);
  }

  // Check if user needs to update password (if implemented)
  static needsPasswordUpdate(user: any): boolean {
    if (!user || !user.lastPasswordUpdate) return false;
    
    const lastUpdate = new Date(user.lastPasswordUpdate);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    return lastUpdate < threeMonthsAgo;
  }

  // Get appropriate redirect URL after authentication based on user role
  static getPostAuthRedirect(user: any, storedRedirect?: string): string {
    // Default redirect based on user role
    const defaultTarget = user?.role === 'admin' || user?.role === 'superuser' ? '/admin' : '/dashboard';
    
    // Check if there's a stored redirect URL
    if (storedRedirect) {
      // Check if the stored redirect is an admin route
      const wantAdmin = this.isAdminRoute(storedRedirect);
      
      // Only allow admin redirects if user has admin privileges
      const hasAdminAccess = user && (user.role === 'admin' || user.role === 'superuser');
      
      // Use stored redirect if it's safe and user has appropriate access
      if (!wantAdmin || hasAdminAccess) {
        return this.getSafeRedirectUrl(storedRedirect);
      }
    }
    
    return defaultTarget;
  }

  // Generate activity tracking data
  static getActivityData(): any {
    return {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screen: {
        width: screen.width,
        height: screen.height
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }
}