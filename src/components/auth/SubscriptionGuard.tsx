import React from "react";
import { useLocation } from "wouter";
import { useHasActiveSubscription } from "@/hooks/useSubscription.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Lock,
  Crown,
  Zap,
  Star,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Activity,
  Loader2,
} from "lucide-react";

interface SubscriptionGuardProps {
  children: React.ReactNode;
  feature?: string;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
}

export default function SubscriptionGuard({
  children,
  feature,
  fallback,
  showUpgrade = true,
}: SubscriptionGuardProps) {
  const { hasActiveSubscription, isLoading, subscription } =
    useHasActiveSubscription();
  const [location] = useLocation();

  // Show loading state while checking subscription
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Checking Access...</h2>
          <p className="text-muted-foreground">
            Verifying your subscription status
          </p>
        </div>
      </div>
    );
  }

  // If user has active subscription, show the content
  if (hasActiveSubscription) {
    return <>{children}</>;
  }

  // Get page-specific information
  const getPageInfo = (path: string) => {
    switch (path) {
      case "/trading":
        return {
          title: "Buy/Sell Chart",
          description: "Advanced trading charts with real-time signals",
          icon: Activity,
          features: [
            "Real-time buy/sell signals",
            "Advanced chart analysis",
            "Multiple timeframe view",
            "Trading playground",
          ],
        };
      case "/multi-ticker":
        return {
          title: "Signals Dashboard",
          description: "Multi-ticker signal tracking and analysis",
          icon: BarChart3,
          features: [
            "Multi-ticker monitoring",
            "Advanced signal alerts",
            "Historical signal data",
            "Custom watchlists",
          ],
        };
      case "/bitcoin-analytics":
        return {
          title: "Analytics Suite",
          description: "Comprehensive cryptocurrency analytics and insights",
          icon: TrendingUp,
          features: [
            "Market cycle analysis",
            "Heatmap visualization",
            "Advanced forecasting",
            "Technical indicators",
          ],
        };
      default:
        return {
          title: "Premium Feature",
          description: "This feature requires an active subscription",
          icon: Crown,
          features: [
            "Advanced trading tools",
            "Real-time signals",
            "Premium analytics",
            "Priority support",
          ],
        };
    }
  };

  const pageInfo = getPageInfo(location);
  const IconComponent = pageInfo.icon;

  if (!showUpgrade) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-2 border-orange-200 bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 dark:from-orange-900/30 dark:via-yellow-900/30 dark:to-red-800/30 shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-gradient-to-br from-orange-500 to-red-600 shadow-lg">
              <IconComponent className="w-12 h-12 text-white" />
            </div>
          </div>
          <div className="flex justify-center mb-2">
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold px-3 py-1">
              <Crown className="w-4 h-4 mr-1" />
              Premium Feature
            </Badge>
          </div>
          <CardTitle className="text-3xl font-bold text-orange-800 dark:text-orange-100 mb-2">
            {pageInfo.title}
          </CardTitle>
          <CardDescription className="text-orange-700 dark:text-orange-300 text-lg">
            {pageInfo.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Access Denied Message */}
          <div className="text-center p-4 rounded-lg bg-white/50 dark:bg-black/20 border border-orange-200">
            <Lock className="w-8 h-8 mx-auto text-orange-600 mb-2" />
            <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-1">
              🔒 Subscription Required
            </h3>
            <p className="text-sm text-orange-600 dark:text-orange-400">
              You need an active subscription to access this feature
            </p>
          </div>

          {/* Feature List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pageInfo.features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/20"
              >
                <Star className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <span className="text-orange-800 dark:text-orange-200 font-medium text-sm">
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* Current Plan Status */}
          <div className="text-center p-4 rounded-lg bg-white/50 dark:bg-black/20 border border-orange-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-sm text-orange-600 dark:text-orange-400">
                Current Plan:
              </span>
              <Badge className="bg-slate-200 text-slate-700">
                {subscription?.planName || "Free"}
              </Badge>
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              {subscription
                ? `Status: ${subscription.status}`
                : "No active subscription"}
            </p>
          </div>

          {/* Upgrade CTA */}
          <div className="text-center space-y-4 pt-4 border-t border-orange-200">
            <h4 className="text-lg font-bold text-orange-800 dark:text-orange-100">
              🚀 Unlock Premium Features Today!
            </h4>
            <p className="text-orange-700 dark:text-orange-300">
              Get access to advanced trading tools, real-time signals, and
              comprehensive analytics
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/subscription">
                <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold shadow-lg hover:shadow-xl">
                  <Crown className="w-5 h-5 mr-2" />
                  View Subscription Plans
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>

              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  ← Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-center pt-4 border-t border-orange-200">
            <p className="text-xs text-orange-600 dark:text-orange-400">
              💡 <strong>Already subscribed?</strong> Your subscription may
              still be processing. Please refresh the page or contact support if
              the issue persists.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for feature access checking
export function useFeatureAccess(feature: string) {
  const { hasActiveSubscription, subscription } = useHasActiveSubscription();

  return {
    hasAccess: hasActiveSubscription,
    subscription,
    upgradeMessage: hasActiveSubscription
      ? "You have access to this feature"
      : "This feature requires an active subscription",
  };
}
