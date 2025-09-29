import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { hasAccess } from "@/lib/subscriptionUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Lock, Crown, Zap, Star, ArrowRight, CreditCard, Shield } from "lucide-react";

interface PaymentRequiredGuardProps {
  children: React.ReactNode;
  requiredTier?: "basic" | "premium" | "pro";
  feature?: string;
  pageName?: string;
}

export default function PaymentRequiredGuard({ 
  children, 
  requiredTier = "basic",
  feature,
  pageName = "this feature"
}: PaymentRequiredGuardProps) {
  const { user } = useAuth();
  const userTier = user?.subscriptionTier || "free";
  const subscriptionStatus = user?.subscriptionStatus;
  
  // Check if user has access based on feature or tier
  let hasFeatureAccess = false;
  
  if (feature) {
    hasFeatureAccess = hasAccess(userTier, feature as any);
  } else {
    // Tier hierarchy: free (0) < basic (1) < premium (2) < pro (3)
    const tierLevels = { free: 0, basic: 1, premium: 2, pro: 3 };
    const userLevel = tierLevels[userTier as keyof typeof tierLevels] || 0;
    const requiredLevel = tierLevels[requiredTier];
    hasFeatureAccess = userLevel >= requiredLevel;
  }
  
  // Admin users bypass payment checks
  if (user?.role === "admin" || user?.role === "superuser") {
    return <>{children}</>;
  }
  
  // STRICT ENFORCEMENT: Only allow access with active paid subscription
  // Free tier users are blocked from ALL features
  if (userTier === "free" || !subscriptionStatus || subscriptionStatus !== "active") {
    // Block access for free users or inactive subscriptions
  } else if (hasFeatureAccess && subscriptionStatus === "active") {
    return <>{children}</>;
  }
  
  // STRICT PAYMENT WALL - Block all free users and inactive subscriptions
  const getTierIcon = (tier: string) => {
    switch(tier) {
      case "basic": return <Star className="h-5 w-5 text-blue-500" />;
      case "premium": return <Crown className="h-5 w-5 text-purple-500" />;
      case "pro": return <Zap className="h-5 w-5 text-yellow-500" />;
      default: return <Lock className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const getTierColor = (tier: string) => {
    switch(tier) {
      case "basic": return "bg-blue-50 border-blue-200 text-blue-700";
      case "premium": return "bg-purple-50 border-purple-200 text-purple-700";
      case "pro": return "bg-yellow-50 border-yellow-200 text-yellow-700";
      default: return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-primary/5 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-2 border-dashed border-primary/30 bg-gradient-to-br from-background to-secondary/20 shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-primary/20">
            <CreditCard className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3 mb-2">
            {getTierIcon(requiredTier)}
            Payment Required
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            {userTier === "free" 
              ? "Welcome! To access our premium trading features, you'll need to choose a subscription plan."
              : `Access to ${pageName} requires an active subscription. Your ${userTier} plan is currently ${subscriptionStatus || "inactive"}.`
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 ${getTierColor(requiredTier)}`}>
              {getTierIcon(requiredTier)}
              <span className="font-semibold capitalize">{requiredTier} Plan Required</span>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-700 mb-2">
                <Lock className="h-4 w-4" />
                <span className="font-medium">Current Status</span>
              </div>
              <p className="text-sm text-amber-600">
                Your current plan: <Badge variant="outline" className="text-amber-700 border-amber-300">{userTier}</Badge>
                {subscriptionStatus !== "active" && (
                  <span className="block mt-1">Subscription status: {subscriptionStatus || "None"}</span>
                )}
              </p>
            </div>
          </div>
          
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Upgrade your subscription to unlock premium trading features and advanced analytics.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/pricing">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Choose Plan
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              
              <Link href="/subscription">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Manage Subscription
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>30-day money-back guarantee</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}