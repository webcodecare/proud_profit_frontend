import { User } from "./auth";

// Define granular permissions
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isDefault?: boolean;
}

// System permissions
export const PERMISSIONS: Record<string, Permission> = {
  // User Management
  'users.view': { id: 'users.view', name: 'View Users', description: 'View user profiles and information', category: 'User Management' },
  'users.create': { id: 'users.create', name: 'Create Users', description: 'Create new user accounts', category: 'User Management' },
  'users.edit': { id: 'users.edit', name: 'Edit Users', description: 'Modify user profiles and settings', category: 'User Management' },
  'users.delete': { id: 'users.delete', name: 'Delete Users', description: 'Delete user accounts', category: 'User Management' },
  'users.manage_roles': { id: 'users.manage_roles', name: 'Manage User Roles', description: 'Assign and modify user roles', category: 'User Management' },

  // Trading & Signals
  'signals.view': { id: 'signals.view', name: 'View Signals', description: 'View trading signals', category: 'Trading' },
  'signals.create': { id: 'signals.create', name: 'Create Signals', description: 'Create and send trading signals', category: 'Trading' },
  'signals.manage': { id: 'signals.manage', name: 'Manage Signals', description: 'Edit and delete trading signals', category: 'Trading' },
  'trading.playground': { id: 'trading.playground', name: 'Trading Playground', description: 'Access trading simulation', category: 'Trading' },

  // Analytics & Charts
  'analytics.basic': { id: 'analytics.basic', name: 'Basic Analytics', description: 'View basic charts and analytics', category: 'Analytics' },
  'analytics.advanced': { id: 'analytics.advanced', name: 'Advanced Analytics', description: 'Access advanced analytics features', category: 'Analytics' },
  'analytics.heatmap': { id: 'analytics.heatmap', name: 'Heatmap Analysis', description: 'View 200-week heatmap analysis', category: 'Analytics' },
  'analytics.cycle': { id: 'analytics.cycle', name: 'Cycle Forecasting', description: 'Access cycle forecasting tools', category: 'Analytics' },
  'analytics.portfolio': { id: 'analytics.portfolio', name: 'Portfolio Management', description: 'Advanced portfolio analytics', category: 'Analytics' },

  // Alerts & Notifications
  'alerts.email': { id: 'alerts.email', name: 'Email Alerts', description: 'Send and receive email alerts', category: 'Alerts' },
  'alerts.sms': { id: 'alerts.sms', name: 'SMS Alerts', description: 'Send and receive SMS alerts', category: 'Alerts' },
  'alerts.telegram': { id: 'alerts.telegram', name: 'Telegram Alerts', description: 'Send and receive Telegram alerts', category: 'Alerts' },
  'alerts.advanced': { id: 'alerts.advanced', name: 'Advanced Alerts', description: 'Create complex alert conditions', category: 'Alerts' },
  'alerts.manage': { id: 'alerts.manage', name: 'Manage Alerts', description: 'Configure alert system', category: 'Alerts' },

  // Admin Functions
  'admin.dashboard': { id: 'admin.dashboard', name: 'Admin Dashboard', description: 'Access admin dashboard', category: 'Administration' },
  'admin.logs': { id: 'admin.logs', name: 'View Logs', description: 'View system and audit logs', category: 'Administration' },
  'admin.system': { id: 'admin.system', name: 'System Settings', description: 'Modify system configuration', category: 'Administration' },
  'admin.tickers': { id: 'admin.tickers', name: 'Manage Tickers', description: 'Enable/disable trading pairs', category: 'Administration' },
  'admin.webhooks': { id: 'admin.webhooks', name: 'Manage Webhooks', description: 'Configure webhook integrations', category: 'Administration' },

  // Subscription Management
  'subscriptions.view': { id: 'subscriptions.view', name: 'View Subscriptions', description: 'View subscription information', category: 'Subscriptions' },
  'subscriptions.manage': { id: 'subscriptions.manage', name: 'Manage Subscriptions', description: 'Modify subscription tiers', category: 'Subscriptions' },
  'subscriptions.billing': { id: 'subscriptions.billing', name: 'Billing Management', description: 'Access billing and payment info', category: 'Subscriptions' },

  // API Access
  'api.basic': { id: 'api.basic', name: 'Basic API Access', description: 'Access basic API endpoints', category: 'API' },
  'api.advanced': { id: 'api.advanced', name: 'Advanced API Access', description: 'Access advanced API features', category: 'API' },
  'api.admin': { id: 'api.admin', name: 'Admin API Access', description: 'Access administrative API endpoints', category: 'API' },
};

// System roles with permissions
export const ROLES: Record<string, Role> = {
  user: {
    id: 'user',
    name: 'User',
    description: 'Standard user with basic features',
    isDefault: true,
    permissions: [
      'signals.view',
      'analytics.basic',
      'alerts.email',
      'subscriptions.view',
      'api.basic',
    ]
  },
  
  basic_user: {
    id: 'basic_user', 
    name: 'Basic User',
    description: 'Basic subscription with enhanced features',
    permissions: [
      'signals.view',
      'analytics.basic',
      'analytics.heatmap',
      'trading.playground',
      'alerts.email',
      'alerts.sms',
      'subscriptions.view',
      'api.basic',
    ]
  },

  premium_user: {
    id: 'premium_user',
    name: 'Premium User', 
    description: 'Premium subscription with advanced features',
    permissions: [
      'signals.view',
      'analytics.basic',
      'analytics.advanced',
      'analytics.heatmap',
      'analytics.cycle',
      'analytics.portfolio',
      'trading.playground',
      'alerts.email',
      'alerts.sms',
      'alerts.telegram',
      'alerts.advanced',
      'subscriptions.view',
      'subscriptions.billing',
      'api.basic',
      'api.advanced',
    ]
  },

  pro_user: {
    id: 'pro_user',
    name: 'Pro User',
    description: 'Pro subscription with all user features',
    permissions: [
      'signals.view',
      'analytics.basic',
      'analytics.advanced', 
      'analytics.heatmap',
      'analytics.cycle',
      'analytics.portfolio',
      'trading.playground',
      'alerts.email',
      'alerts.sms',
      'alerts.telegram',
      'alerts.advanced',
      'subscriptions.view',
      'subscriptions.billing',
      'api.basic',
      'api.advanced',
    ]
  },

  admin: {
    id: 'admin',
    name: 'Administrator',
    description: 'System administrator with management privileges',
    permissions: [
      // All pro user permissions
      'signals.view',
      'analytics.basic',
      'analytics.advanced', 
      'analytics.heatmap',
      'analytics.cycle',
      'analytics.portfolio',
      'trading.playground',
      'alerts.email',
      'alerts.sms',
      'alerts.telegram',
      'alerts.advanced',
      'subscriptions.view',
      'subscriptions.billing',
      'api.basic',
      'api.advanced',
      // Admin-specific permissions
      'users.view',
      'users.create',
      'users.edit',
      'users.delete',
      'users.manage_roles',
      'signals.create',
      'signals.manage',
      'alerts.manage',
      'admin.dashboard',
      'admin.logs',
      'admin.system',
      'admin.tickers',
      'admin.webhooks',
      'subscriptions.manage',
      'api.admin',
    ]
  },

  superuser: {
    id: 'superuser',
    name: 'Super User',
    description: 'Full system access with all permissions',
    permissions: [
      // All permissions manually listed to avoid Object.keys issue
      'users.view', 'users.create', 'users.edit', 'users.delete', 'users.manage_roles',
      'signals.view', 'signals.create', 'signals.manage',
      'trading.playground',
      'analytics.basic', 'analytics.advanced', 'analytics.heatmap', 'analytics.cycle', 'analytics.portfolio',
      'alerts.email', 'alerts.sms', 'alerts.telegram', 'alerts.advanced', 'alerts.manage',
      'admin.dashboard', 'admin.logs', 'admin.system', 'admin.tickers', 'admin.webhooks',
      'subscriptions.view', 'subscriptions.manage', 'subscriptions.billing',
      'api.basic', 'api.advanced', 'api.admin',
    ]
  }
};

// Permission checking functions
export class PermissionManager {
  static hasPermission(user: User | null, permission: string): boolean {
    if (!user) return false;
    
    // Get role-based permissions
    const rolePermissions = this.getRolePermissions(user.role);
    
    // Check subscription-based permissions
    const subscriptionPermissions = this.getSubscriptionPermissions(user.subscriptionTier);
    
    // Combine permissions
    const allPermissions = [...rolePermissions, ...subscriptionPermissions];
    
    return allPermissions.includes(permission);
  }

  static hasAnyPermission(user: User | null, permissions: string[]): boolean {
    if (!user) return false;
    return permissions.some(permission => this.hasPermission(user, permission));
  }

  static hasAllPermissions(user: User | null, permissions: string[]): boolean {
    if (!user) return false;
    return permissions.every(permission => this.hasPermission(user, permission));
  }

  static getRolePermissions(role: string): string[] {
    const roleObj = ROLES[role];
    if (!roleObj) return ROLES.user.permissions;
    return roleObj.permissions;
  }

  static getSubscriptionPermissions(tier: string): string[] {
    // Map subscription tiers to role-based permissions
    const tierRoleMap: Record<string, string> = {
      'free': 'user',
      'basic': 'basic_user',
      'premium': 'premium_user', 
      'pro': 'pro_user'
    };
    
    const mappedRole = tierRoleMap[tier] || 'user';
    return this.getRolePermissions(mappedRole);
  }

  static canAccessFeature(user: User | null, feature: string): boolean {
    // Map features to required permissions
    const featurePermissionMap: Record<string, string> = {
      'heatmapAnalysis': 'analytics.heatmap',
      'cycleForecasting': 'analytics.cycle',
      'advancedAnalytics': 'analytics.advanced',
      'tradingPlayground': 'trading.playground',
      'advancedAlerts': 'alerts.advanced',
      'portfolioManagement': 'analytics.portfolio',
      'smsAlerts': 'alerts.sms',
      'telegramAlerts': 'alerts.telegram',
    };
    
    const requiredPermission = featurePermissionMap[feature];
    if (!requiredPermission) return true; // Feature doesn't require special permission
    
    return this.hasPermission(user, requiredPermission);
  }

  static getUserPermissions(user: User | null): string[] {
    if (!user) return [];
    
    const rolePermissions = this.getRolePermissions(user.role);
    const subscriptionPermissions = this.getSubscriptionPermissions(user.subscriptionTier);
    
    // Combine and deduplicate
    return [...new Set([...rolePermissions, ...subscriptionPermissions])];
  }

  static canAccessRoute(user: User | null, route: string): boolean {
    // Define route access requirements
    const routePermissions: Record<string, string[]> = {
      '/admin': ['admin.dashboard'],
      '/admin/users': ['users.view'],
      '/admin/signals': ['signals.manage'],
      '/admin/tickers': ['admin.tickers'],
      '/admin/alerts': ['alerts.manage'],
      '/admin/logs': ['admin.logs'],
      '/admin/analytics': ['analytics.advanced'],
      '/trading-playground': ['trading.playground'],
      '/advanced-portfolio': ['analytics.portfolio'],
      '/advanced-alerts': ['alerts.advanced'],
    };
    
    const requiredPermissions = routePermissions[route];
    if (!requiredPermissions) return true; // Route doesn't require special permissions
    
    return this.hasAnyPermission(user, requiredPermissions);
  }
}

// Hook for permission checking
export function usePermissions() {
  return {
    PermissionManager,
    PERMISSIONS,
    ROLES,
  };
}