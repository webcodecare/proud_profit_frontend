import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, ArrowUp } from "lucide-react";
import SubscriptionBadge from "./SubscriptionBadge";

interface FeatureAccessGuardProps {
  children: ReactNode;
  requiredTier: "basic" | "premium" | "pro";
  featureName: string;
  description?: string;
}

const tierHierarchy = {
  free: 0,
  basic: 1, 
  premium: 2,
  pro: 3
};

export default function FeatureAccessGuard({ 
  children, 
  requiredTier, 
  featureName,
  description 
}: FeatureAccessGuardProps) {
  const { user } = useAuth();
  
  const userTierLevel = tierHierarchy[user?.subscriptionTier as keyof typeof tierHierarchy] ?? 0;
  const requiredTierLevel = tierHierarchy[requiredTier];
  
  // Additional check for subscription status
  const hasActiveSubscription = user?.subscriptionStatus === "active" || user?.subscriptionTier === "free";
  const hasAccess = userTierLevel >= requiredTierLevel && hasActiveSubscription;

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <Card className="border-2 border-dashed border-gray-300">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-gray-100 rounded-full">
            <Lock className="h-6 w-6 text-gray-500" />
          </div>
        </div>
        <CardTitle className="text-lg">{featureName}</CardTitle>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-sm text-muted-foreground">Requires:</span>
          <SubscriptionBadge tier={requiredTier} size="sm" />
        </div>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          {description || `This feature is available for ${requiredTier} and higher subscription tiers.`}
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Your plan:</span>
          <SubscriptionBadge tier={user?.subscriptionTier as any || "free"} size="sm" />
        </div>
        <Button size="sm" className="flex items-center gap-2">
          <ArrowUp className="h-3 w-3" />
          Upgrade Plan
        </Button>
      </CardContent>
    </Card>
  );
}