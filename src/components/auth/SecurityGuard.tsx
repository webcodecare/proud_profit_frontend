import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, User, Crown } from 'lucide-react';

interface SecurityGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
  requiredSubscription?: 'free' | 'basic' | 'premium' | 'pro';
  fallback?: React.ReactNode;
}

export function SecurityGuard({ 
  children, 
  requiredRole = 'user',
  requiredSubscription = 'free',
  fallback 
}: SecurityGuardProps) {
  const { user, isLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setHasAccess(false);
        return;
      }

      // Check role access
      const roleAccess = requiredRole === 'user' || user.role === requiredRole;
      
      // Check subscription access
      const subscriptionTiers = ['free', 'basic', 'premium', 'pro'];
      const userTierIndex = subscriptionTiers.indexOf(user.subscriptionTier || 'free');
      const requiredTierIndex = subscriptionTiers.indexOf(requiredSubscription);
      const subscriptionAccess = userTierIndex >= requiredTierIndex;

      // Check if subscription is active (except for free tier)
      const subscriptionActive = user.subscriptionTier === 'free' || user.subscriptionStatus === 'active';

      setHasAccess(roleAccess && subscriptionAccess && subscriptionActive);
    }
  }, [user, isLoading, requiredRole, requiredSubscription]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <div className="p-4 sm:p-6 md:p-8">
        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            Please log in to access this feature.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!hasAccess) {
    const needsRoleUpgrade = requiredRole === 'admin' && user.role !== 'admin';
    
    const subscriptionTiers = ['free', 'basic', 'premium', 'pro'];
    const userTierIndex = subscriptionTiers.indexOf(user.subscriptionTier || 'free');
    const requiredTierIndex = subscriptionTiers.indexOf(requiredSubscription);
    const needsSubscriptionUpgrade = userTierIndex < requiredTierIndex;
    
    const needsSubscriptionActivation = user.subscriptionTier !== 'free' && user.subscriptionStatus !== 'active';

    return fallback || (
      <div className="p-4 sm:p-6 md:p-8">
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
          <Shield className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {needsRoleUpgrade && (
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4" />
                <span>Admin access required for this feature.</span>
              </div>
            )}
            {needsSubscriptionUpgrade && (
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4" />
                <span>
                  {requiredSubscription.charAt(0).toUpperCase() + requiredSubscription.slice(1)} subscription required.
                  Current tier: {user.subscriptionTier || 'free'}.
                  <a href="/subscription" className="text-blue-600 hover:underline ml-1">
                    Upgrade now
                  </a>
                </span>
              </div>
            )}
            {needsSubscriptionActivation && (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>
                  Your subscription is inactive. 
                  <a href="/subscription" className="text-blue-600 hover:underline ml-1">
                    Reactivate subscription
                  </a>
                </span>
              </div>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}

export function AdminGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <SecurityGuard requiredRole="admin" fallback={fallback}>
      {children}
    </SecurityGuard>
  );
}

export function PremiumGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <SecurityGuard requiredSubscription="premium" fallback={fallback}>
      {children}
    </SecurityGuard>
  );
}