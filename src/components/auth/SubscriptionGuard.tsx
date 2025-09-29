import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { hasAccess, getUpgradeMessage, getPlanBadgeColor } from "@/lib/subscriptionUtils";
import { PermissionManager } from "@/lib/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Lock, Crown, Zap, Star, ArrowRight } from "lucide-react";

interface SubscriptionGuardProps {
  children: React.ReactNode;
  feature: string;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
}

export default function SubscriptionGuard({ 
  children, 
  feature, 
  fallback, 
  showUpgrade = true 
}: SubscriptionGuardProps) {
  const { user } = useAuth();
  const userTier = user?.subscriptionTier || null;
  
  // Debug logging
  console.log(`SubscriptionGuard DEBUG: feature=${feature}, userTier=${userTier}, user=`, user);
  
  // Strict subscription-based access control - NO FALLBACK ALLOWED
  const hasFeatureAccess = hasAccess(userTier, feature as any);
  
  console.log(`SubscriptionGuard DEBUG: hasFeatureAccess=${hasFeatureAccess} for ${feature}`);
  
  // CRITICAL: Only allow access if user truly has the required subscription
  if (hasFeatureAccess) {
    return <>{children}</>;
  }
  
  // NO FALLBACK - This prevents unauthorized access to premium features
  
  if (!showUpgrade) {
    return null;
  }
  
  return (
    <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          Elite Feature
        </CardTitle>
        <CardDescription>
          {getUpgradeMessage(feature)}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">Current Plan:</span>
          <Badge className={getPlanBadgeColor(userTier)}>
            {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link href="/pricing">
              <Zap className="h-4 w-4 mr-2" />
              Upgrade Now
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/subscription">
              <Star className="h-4 w-4 mr-2" />
              View Plans
            </Link>
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Unlock this feature and many more with Elite subscription
        </p>
      </CardContent>
    </Card>
  );
}

// Hook for feature access checking
export function useFeatureAccess(feature: string) {
  const { user } = useAuth();
  const userTier = user?.subscriptionTier || null;
  
  return {
    hasAccess: hasAccess(userTier, feature as any),
    userTier,
    upgradeMessage: getUpgradeMessage(feature),
  };
}