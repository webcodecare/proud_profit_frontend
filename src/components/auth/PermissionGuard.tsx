import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { PermissionManager } from "@/lib/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Lock, Shield, AlertTriangle, ArrowRight } from "lucide-react";

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean; // true = need ALL permissions, false = need ANY permission
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
  feature?: string; // For feature-based access
}

export function PermissionGuard({ 
  children, 
  permission,
  permissions = [],
  requireAll = false,
  fallback, 
  showUpgrade = true,
  feature
}: PermissionGuardProps) {
  const { user } = useAuth();
  
  // Determine access based on permission type
  let hasAccess = false;
  let deniedReason = "";
  
  if (feature) {
    // Feature-based access check
    hasAccess = PermissionManager.canAccessFeature(user, feature);
    deniedReason = `Feature '${feature}' requires additional permissions`;
  } else if (permission) {
    // Single permission check
    hasAccess = PermissionManager.hasPermission(user, permission);
    deniedReason = `This action requires '${permission}' permission`;
  } else if (permissions.length > 0) {
    // Multiple permissions check
    hasAccess = requireAll 
      ? PermissionManager.hasAllPermissions(user, permissions)
      : PermissionManager.hasAnyPermission(user, permissions);
    deniedReason = `This action requires ${requireAll ? 'all' : 'one'} of these permissions: ${permissions.join(', ')}`;
  } else {
    // No permissions specified, allow access
    hasAccess = true;
  }
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (!showUpgrade) {
    return null;
  }
  
  return (
    <Card className="border-2 border-dashed border-destructive/20 bg-gradient-to-br from-destructive/5 to-orange/5">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-destructive" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <Lock className="h-5 w-5 text-destructive" />
          Access Restricted
        </CardTitle>
        <CardDescription>
          {deniedReason}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">Current Role:</span>
          <Badge variant="outline">
            {user?.role || 'Guest'}
          </Badge>
          <span className="text-sm text-muted-foreground">Subscription:</span>
          <Badge variant="outline">
            {user?.subscriptionTier || 'Free'}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link href="/pricing">
              <Shield className="h-4 w-4 mr-2" />
              Upgrade Subscription
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/contact">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Request Access
            </Link>
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Contact support if you believe you should have access to this feature
        </p>
      </CardContent>
    </Card>
  );
}

// Specific permission guards for common use cases
export function AdminGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard permission="admin.dashboard" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function UserManagementGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard permission="users.view" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function SignalManagementGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard permission="signals.manage" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function AdvancedAnalyticsGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard permission="analytics.advanced" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

// Hook for component-level permission checking
export function usePermissionGuard() {
  const { user } = useAuth();
  
  return {
    hasPermission: (permission: string) => PermissionManager.hasPermission(user, permission),
    hasAnyPermission: (permissions: string[]) => PermissionManager.hasAnyPermission(user, permissions),
    hasAllPermissions: (permissions: string[]) => PermissionManager.hasAllPermissions(user, permissions),
    canAccessFeature: (feature: string) => PermissionManager.canAccessFeature(user, feature),
    canAccessRoute: (route: string) => PermissionManager.canAccessRoute(user, route),
    getUserPermissions: () => PermissionManager.getUserPermissions(user),
    user,
  };
}

export default PermissionGuard;