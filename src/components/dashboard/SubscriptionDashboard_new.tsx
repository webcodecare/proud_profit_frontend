import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserSubscriptionData } from "@/hooks/useSubscription.tsx";
import { useSubscription } from "@/hooks/useSubscription";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  CreditCard,
  CheckCircle,
  Crown,
  ChevronRight,
  AlertCircle,
  Star,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Zap,
  Shield,
  Clock,
  Unlock,
  Lock,
  Activity,
} from "lucide-react";
import { Link } from "wouter";
import { SubscriptionManager } from "@/lib/subscriptionPlan";
import TradingViewChart from "@/components/charts/TradingViewChart";
import MarketWidget from "@/components/widgets/MarketWidget";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalSignals: number;
  dailySignalCount: number;
  activeTickerCount: number;
  successRate: number;
}

export default function SubscriptionDashboard() {
  const { user } = useAuth();
  const { data: subscriptionData, isLoading: isLoadingSubscription } =
    useUserSubscriptionData();
  const {
    subscriptionStatus,
    canAccessFeature,
    hasReachedLimit,
    upgradeSubscription,
    isUpgrading,
  } = useSubscription();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Dashboard stats based on subscription status
  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () =>
      ({
        totalSignals: 247,
        dailySignalCount: subscriptionStatus?.limits?.usedSignals || 0,
        activeTickerCount: subscriptionStatus?.limits?.usedTickers || 0,
        successRate: 68.5,
      } as DashboardStats),
    enabled: !!subscriptionStatus,
  });

  const { data: recentSignals } = useQuery({
    queryKey: ["/api/signals/recent"],
    queryFn: async () => [
      {
        ticker: "BTCUSDT",
        type: "BUY",
        price: 119000,
        timestamp: "2 mins ago",
        confidence: 85,
      },
      {
        ticker: "ETHUSDT",
        type: "SELL",
        price: 4180,
        timestamp: "15 mins ago",
        confidence: 92,
      },
      {
        ticker: "SOLUSDT",
        type: "BUY",
        price: 245,
        timestamp: "32 mins ago",
        confidence: 78,
      },
    ],
    enabled: !!user,
  });

  if (!user || !subscriptionStatus) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  const hasActiveSubscription =
    subscriptionData && subscriptionData.status === "active";
  const userTier = subscriptionStatus.currentPlan;
  const planConfig = SubscriptionManager.getPlanConfig(userTier);
  const features = subscriptionStatus.features;

  // Format dates for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate days remaining
  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleFeatureClick = (featureName: string, hasFeature: boolean) => {
    if (!hasFeature) {
      toast({
        title: "Premium Feature",
        description: SubscriptionManager.getUpgradeMessage(featureName as any),
        variant: "default",
      });
    }
  };

  const FeatureCard = ({
    title,
    description,
    icon: Icon,
    hasFeature,
    featureName,
  }: {
    title: string;
    description: string;
    icon: any;
    hasFeature: boolean;
    featureName: string;
  }) => {
    const colorClasses = hasFeature
      ? {
          card: "border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-800/30 shadow-lg hover:shadow-xl",
          icon: "p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-md",
          iconColor: "text-white",
          title: "text-green-800 dark:text-green-100 font-bold",
          description: "text-green-700 dark:text-green-300",
          lockBg: "bg-green-200 dark:bg-green-700",
          lockIcon: "text-green-600 dark:text-green-300",
        }
      : {
          card: "border-2 border-red-200 bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/30 dark:to-pink-800/30 shadow-lg hover:shadow-xl hover:border-red-300",
          icon: "p-3 rounded-xl bg-gradient-to-br from-red-400 to-pink-500 shadow-md",
          iconColor: "text-white opacity-60",
          title: "text-red-800 dark:text-red-100 font-bold",
          description: "text-red-700 dark:text-red-300",
          lockBg: "bg-red-200 dark:bg-red-700",
          lockIcon: "text-red-600 dark:text-red-400",
        };

    return (
      <Card
        className={`cursor-pointer transition-all ${colorClasses.card}`}
        onClick={() => handleFeatureClick(featureName, hasFeature)}
      >
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={colorClasses.icon}>
                <Icon className={`w-5 h-5 ${colorClasses.iconColor}`} />
              </div>
              <div>
                <h4 className={`font-semibold text-sm ${colorClasses.title}`}>
                  {hasFeature ? "✅ " : "🔒 "}
                  {title}
                </h4>
                <p
                  className={`text-xs ${colorClasses.description} font-medium`}
                >
                  {description}
                </p>
              </div>
            </div>
            <div className={`p-2 rounded-lg ${colorClasses.lockBg}`}>
              {hasFeature ? (
                <Unlock className={`w-5 h-5 ${colorClasses.lockIcon}`} />
              ) : (
                <Lock className={`w-5 h-5 ${colorClasses.lockIcon}`} />
              )}
            </div>
          </div>
          {!hasFeature && (
            <div className="mt-3 pt-3 border-t border-red-300 dark:border-red-600">
              <p className="text-xs text-red-700 dark:text-red-300 font-bold">
                🚀 Click to upgrade and unlock this feature!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Colorful Header with Plan Status */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 p-6 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white shadow-lg">
        <div>
          <h1 className="text-3xl font-bold text-white drop-shadow-md">
            🎯 Trading Dashboard
          </h1>
          <p className="text-blue-100 font-medium">
            Welcome back! Here's your trading overview ✨
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold shadow-md">
            {hasActiveSubscription
              ? `⭐ ${subscriptionData?.planName}`
              : `⭐ ${planConfig?.name || "Free Tier"}`}
          </Badge>
          {userTier === "free" && (
            <Link href="/pricing">
              <Button
                size="sm"
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold shadow-md"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Plan 🚀
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Usage Alerts */}
      {userTier === "free" && (
        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            You're on the free tier with limited features.
            <Link href="/pricing" className="ml-1 underline font-medium">
              Upgrade now
            </Link>{" "}
            to unlock advanced analytics and unlimited signals.
          </AlertDescription>
        </Alert>
      )}

      {/* Colorful Platform Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-800/30 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                  📈 Market Data
                </p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-100">
                  Live
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-200 dark:bg-green-700">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-300" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-green-600 dark:text-green-400">
              <Activity className="w-3 h-3 mr-1" />
              Real-time pricing from Binance
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/30 dark:to-amber-800/30 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                  ⚡ Signals Source
                </p>
                <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-100">
                  TradingView
                </p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-200 dark:bg-yellow-700">
                <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-yellow-600 dark:text-yellow-400">
              <BarChart3 className="w-3 h-3 mr-1" />
              Multiple timeframe analysis
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-800/30 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  🎮 Trading Playground
                </p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-100">
                  Active
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-200 dark:bg-blue-700">
                <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-blue-600 dark:text-blue-400">
              <Activity className="w-3 h-3 mr-1" />
              Signal-based simulation
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/30 dark:to-pink-800/30 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                  👑 Plan Status
                </p>
                <p className="text-lg font-bold capitalize text-purple-800 dark:text-purple-100">
                  {userTier}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-purple-200 dark:bg-purple-700">
                <Shield className="w-6 h-6 text-purple-600 dark:text-purple-300" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-purple-600 dark:text-purple-400">
              <Clock className="w-3 h-3 mr-1" />
              {subscriptionStatus.status === "active"
                ? "✅ Active"
                : "❌ Inactive"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Colorful Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 p-1">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
          >
            📊 Overview
          </TabsTrigger>
          <TabsTrigger
            value="subscription"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
          >
            👑 Subscription
          </TabsTrigger>
          <TabsTrigger
            value="features"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white"
          >
            🎯 Features
          </TabsTrigger>
          <TabsTrigger
            value="signals"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
          >
            ⚡ Signals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Colorful Live Market Data */}
          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-800/20 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-emerald-800 dark:text-emerald-100 text-xl">
                    💰 Live Market Data
                  </CardTitle>
                  <CardDescription className="text-emerald-700 dark:text-emerald-300 font-medium">
                    Real-time cryptocurrency prices and volumes
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MarketWidget symbol="BTCUSDT" name="Bitcoin" icon="₿" />
                <MarketWidget symbol="ETHUSDT" name="Ethereum" icon="Ξ" />
                <MarketWidget symbol="SOLUSDT" name="Solana" icon="◎" />
                <MarketWidget symbol="PLSUSDT" name="PulseChain" icon="⚡" />
              </div>
            </CardContent>
          </Card>

          {/* Colorful Platform Information */}
          <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/20 dark:to-blue-800/20 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-indigo-800 dark:text-indigo-100 text-xl">
                    🚀 Trading Signals Platform
                  </CardTitle>
                  <CardDescription className="text-indigo-700 dark:text-indigo-300 font-medium">
                    Live signals from TradingView indicators
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-6 rounded-xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/30 dark:to-orange-800/30 shadow-md hover:shadow-lg transition-shadow">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 mx-auto w-fit mb-3 shadow-lg">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-yellow-800 dark:text-yellow-100">
                    ⚡ Real-time Signals
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 font-medium">
                    Live buy/sell signals across multiple timeframes
                  </p>
                </div>
                <div className="text-center p-6 rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-800/30 shadow-md hover:shadow-lg transition-shadow">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 mx-auto w-fit mb-3 shadow-lg">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-green-800 dark:text-green-100">
                    📉 OHLC Data
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-2 font-medium">
                    Historical price data for technical analysis
                  </p>
                </div>
                <div className="text-center p-6 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-800/30 shadow-md hover:shadow-lg transition-shadow">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 mx-auto w-fit mb-3 shadow-lg">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-blue-800 dark:text-blue-100">
                    💹 Live Prices
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-2 font-medium">
                    Real-time market data from Binance API
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          {/* Subscription Status */}
          {hasActiveSubscription ? (
            // Active Subscription Display
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subscription Details Card */}
              <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-800/30 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-green-800 dark:text-green-100 text-xl">
                        ✅ Active Subscription
                      </CardTitle>
                      <CardDescription className="text-green-700 dark:text-green-300 font-medium">
                        {subscriptionData?.planName} -{" "}
                        {subscriptionData?.billingCycle}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-white/50 dark:bg-black/20">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">
                          Amount
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        ${subscriptionData?.amount}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        per {subscriptionData?.billingCycle}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/50 dark:bg-black/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">
                          Next Billing
                        </span>
                      </div>
                      <p className="text-sm font-bold text-green-900 dark:text-green-100">
                        {formatDate(subscriptionData?.currentPeriodEnd || "")}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {getDaysRemaining(
                          subscriptionData?.currentPeriodEnd || ""
                        )}{" "}
                        days remaining
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-white/50 dark:bg-black/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        Status
                      </span>
                    </div>
                    <Badge className="bg-green-500 text-white">
                      {subscriptionData?.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="pt-4 border-t border-green-200 dark:border-green-700">
                    <p className="text-xs text-green-600 dark:text-green-400 mb-2">
                      <strong>Subscription ID:</strong> {subscriptionData?.id}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      <strong>Created:</strong>{" "}
                      {formatDate(subscriptionData?.createdAt || "")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Plan Features Card */}
              <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-800/30 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-blue-800 dark:text-blue-100 text-xl">
                        🎆 Plan Features
                      </CardTitle>
                      <CardDescription className="text-blue-700 dark:text-blue-300 font-medium">
                        {subscriptionData?.planDescription}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {subscriptionData?.features.map(
                      (feature: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/20"
                        >
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-blue-800 dark:text-blue-200 font-medium">
                            {feature}
                          </span>
                        </div>
                      )
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-blue-200 dark:border-blue-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-600 dark:text-blue-400">
                        Want to change your plan?
                      </span>
                      <Link href="/pricing">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          View Plans
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // No Subscription Display
            <div className="text-center py-16">
              <Card className="max-w-2xl mx-auto border-2 border-orange-200 bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 dark:from-orange-900/30 dark:via-yellow-900/30 dark:to-red-800/30 shadow-xl">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <Crown className="w-20 h-20 mx-auto text-orange-500 mb-4" />
                    <h2 className="text-3xl font-bold text-orange-800 dark:text-orange-100 mb-2">
                      No Active Subscription
                    </h2>
                    <p className="text-orange-700 dark:text-orange-300 text-lg">
                      Subscribe to a plan to unlock premium trading features and
                      signals
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="text-center p-4 rounded-lg bg-white/50 dark:bg-black/20">
                      <TrendingUp className="w-8 h-8 mx-auto text-orange-600 mb-2" />
                      <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                        Real-time Signals
                      </h3>
                      <p className="text-sm text-orange-600 dark:text-orange-400">
                        Get live buy/sell alerts
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-white/50 dark:bg-black/20">
                      <Star className="w-8 h-8 mx-auto text-orange-600 mb-2" />
                      <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                        Advanced Analytics
                      </h3>
                      <p className="text-sm text-orange-600 dark:text-orange-400">
                        Detailed market insights
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-white/50 dark:bg-black/20">
                      <CheckCircle className="w-8 h-8 mx-auto text-orange-600 mb-2" />
                      <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                        Premium Support
                      </h3>
                      <p className="text-sm text-orange-600 dark:text-orange-400">
                        Priority customer service
                      </p>
                    </div>
                  </div>

                  <Link href="/pricing">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold shadow-lg hover:shadow-xl"
                    >
                      <Crown className="w-5 h-5 mr-2" />
                      Subscribe to a Plan
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-800/20 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-purple-800 dark:text-purple-100 text-xl">
                    🎆 Available Features
                  </CardTitle>
                  <CardDescription className="text-purple-700 dark:text-purple-300 font-medium">
                    Click on locked features to see upgrade options 🚀
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-4 p-4 bg-muted/50 border rounded-lg">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Unlock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <span className="text-slate-700 dark:text-slate-300">
                      Available
                    </span>
                  </div>
                  <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-500 dark:text-slate-500" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Requires Upgrade
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FeatureCard
                  title="Real-time Data"
                  description="Live cryptocurrency prices"
                  icon={TrendingUp}
                  hasFeature={planConfig?.features.realTimeData || false}
                  featureName="realTimeData"
                />
                <FeatureCard
                  title="Buy/Sell Signals"
                  description="Trading recommendations"
                  icon={Zap}
                  hasFeature={planConfig?.features.buySellSignals || false}
                  featureName="buySellSignals"
                />
                <FeatureCard
                  title="Advanced Charts"
                  description="Technical analysis tools"
                  icon={BarChart3}
                  hasFeature={planConfig?.features.advancedCharts || false}
                  featureName="advancedCharts"
                />
                <FeatureCard
                  title="Heatmap Analyzer"
                  description="Market heatmap visualization"
                  icon={TrendingUp}
                  hasFeature={planConfig?.features.heatmapAnalyzer || false}
                  featureName="heatmapAnalyzer"
                />
                <FeatureCard
                  title="Custom Alerts"
                  description="Personalized notifications"
                  icon={AlertCircle}
                  hasFeature={planConfig?.features.customAlerts || false}
                  featureName="customAlerts"
                />
                <FeatureCard
                  title="Historical Data"
                  description="Access past market data"
                  icon={BarChart3}
                  hasFeature={planConfig?.features.historicalData || false}
                  featureName="historicalData"
                />
                <FeatureCard
                  title="Advanced Signals"
                  description="Premium signal analytics"
                  icon={Zap}
                  hasFeature={planConfig?.features.advancedSignals || false}
                  featureName="advancedSignals"
                />
                <FeatureCard
                  title="Cycle Forecasting"
                  description="Market cycle predictions"
                  icon={TrendingUp}
                  hasFeature={planConfig?.features.cycleForecasting || false}
                  featureName="cycleForecasting"
                />
                <FeatureCard
                  title="API Access"
                  description="Developer API integration"
                  icon={Shield}
                  hasFeature={planConfig?.features.apiAccess || false}
                  featureName="apiAccess"
                />
              </div>
            </CardContent>
          </Card>

          {/* Colorful Upgrade CTA */}
          {userTier === "free" && (
            <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 dark:from-orange-900/30 dark:via-yellow-900/30 dark:to-red-800/30 shadow-xl hover:shadow-2xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-orange-800 dark:text-orange-100">
                      🚀 Unlock Premium Features
                    </h3>
                    <p className="text-orange-700 dark:text-orange-300 mt-1 font-medium">
                      Get access to advanced analytics, unlimited signals, and
                      priority support ✨
                    </p>
                  </div>
                  <Link href="/pricing">
                    <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold shadow-lg hover:shadow-xl">
                      👑 View Plans
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="signals" className="space-y-6">
          {features.buySellSignals ? (
            <>
              {/* Live Trading Signals */}
              <Card className="border-2 border-cyan-400 bg-gradient-to-br from-cyan-900/80 via-blue-900/80 to-purple-900/80 shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-400 to-red-500 shadow-lg animate-pulse">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white font-bold drop-shadow-lg">
                        ⚡ Live Trading Signals 🚀
                      </CardTitle>
                      <CardDescription className="text-yellow-100 font-medium drop-shadow">
                        💻 Real-time buy/sell signals from TradingView
                        indicators 📈
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert className="border-2 border-yellow-400 bg-gradient-to-r from-orange-400/20 to-yellow-400/20 shadow-lg">
                      <AlertCircle className="w-4 h-4 text-yellow-400 animate-pulse" />
                      <AlertDescription className="text-orange-100 font-medium">
                        🔄 Signals are streamed live from TradingView across
                        multiple timeframes (30min, 1h, 4h, 8h, 12h, day, week,
                        month). ⚠️ This data is for informational purposes only
                        and should not be considered financial advice.
                      </AlertDescription>
                    </Alert>

                    {recentSignals?.map((signal, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-4 border-2 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 ${
                          signal.type === "BUY"
                            ? "border-green-400 bg-gradient-to-r from-green-500/20 to-emerald-500/20"
                            : "border-red-400 bg-gradient-to-r from-red-500/20 to-pink-500/20"
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <Badge
                            variant={
                              signal.type === "BUY" ? "default" : "destructive"
                            }
                            className={`${
                              signal.type === "BUY"
                                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 animate-pulse"
                                : "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 animate-pulse"
                            } shadow-lg font-bold`}
                          >
                            {signal.type === "BUY" ? "💹 BUY" : "📉 SELL"}
                          </Badge>
                          <div>
                            <h4 className="font-bold text-white drop-shadow">
                              🪙 {signal.ticker}
                            </h4>
                            <p className="text-sm text-cyan-200 font-semibold">
                              💰 ${signal.price.toLocaleString()} • 🕰️{" "}
                              {signal.timestamp}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-yellow-300">
                              💪 Strength:
                            </span>
                            <Badge
                              variant="outline"
                              className="border-2 border-yellow-400 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-yellow-100 font-bold"
                            >
                              {signal.confidence}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-16 bg-muted/50 rounded-lg border-2 border-dashed">
              <Zap className="w-20 h-20 mx-auto text-slate-400 dark:text-slate-500 mb-6" />
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
                Signals Access Required
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg mb-6">
                Upgrade to access live trading signals from TradingView and
                historical weekly analysis
              </p>
              <Link href="/pricing">
                <Button
                  size="lg"
                  className="bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
                >
                  View Subscription Plans
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Additional Info */}
      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          💡 <strong>Tip:</strong> Manage your billing and subscription settings
          from this dashboard. For support, contact our team at{" "}
          <a
            href="mailto:support@proudprofits.com"
            className="underline font-medium"
          >
            support@proudprofits.com
          </a>
        </AlertDescription>
      </Alert>
    </div>
  );
}
