import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserSubscriptionData } from "@/hooks/useSubscription.tsx";
import { useQuery } from "@tanstack/react-query";
import SidebarWithSubscription from "@/components/layout/SidebarWithSubscription";
import TopBar from "@/components/layout/TopBar";
import AuthGuard from "@/components/auth/AuthGuard";
import PaymentSuccessModal from "@/components/ui/PaymentSuccessModal";
import { useUserSubscriptionDetails } from "@/hooks/useUserSubscriptionDetails";
import { useToast } from "@/hooks/use-toast";
import { SessionManager } from "@/lib/sessionManager";
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
  Settings,
  LogOut,
  User,
  Home,
  Check,
  Archive,
  Code,
  Moon,
} from "lucide-react";
import { Link } from "wouter";
import MarketWidget from "@/components/widgets/MarketWidget";

interface DashboardStats {
  totalSignals: number;
  dailySignalCount: number;
  activeTickerCount: number;
  successRate: number;
}

export default function Dashboard() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { data: subscription } = useUserSubscriptionDetails();
  const { data: subscriptionData, isLoading: isLoadingSubscription } =
    useUserSubscriptionData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  console.log(subscriptionData, "subscriptionData");

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () =>
      ({
        totalSignals: 247,
        dailySignalCount: 0,
        activeTickerCount: 0,
        successRate: 68.5,
      } as DashboardStats),
    enabled: !!user,
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

  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("payment");
    url.searchParams.delete("subscription");
    window.history.replaceState({}, document.title, url.pathname);

    // Refresh user data when payment modal is closed to ensure latest subscription info
    console.log("🔄 Refreshing user data after payment modal close");
    refreshUser();
  };

  useEffect(() => {
    const session = SessionManager.getSession();
    console.log("[Dashboard] Current session after mount:", session);
    if (session && session.user) {
      console.log(
        "[Dashboard] Session user:",
        session.user.email,
        session.user.id
      );
    }

    const params = new URLSearchParams(window.location.search);
    const sessionToken = params.get("session_token");
    const paymentStatus = params.get("payment");

    if (sessionToken && paymentStatus === "success") {
      console.log("🔐 Restoring auth token from Stripe redirect");
      localStorage.setItem("auth_token", sessionToken);
      SessionManager.createSession(sessionToken, null);

      toast({
        title: "Payment Successful!",
        description: "Your subscription has been activated",
      });

      window.history.replaceState(
        {},
        document.title,
        "/dashboard?payment=success"
      );
      setShowPaymentModal(true);

      // Force refresh user data after successful payment to get updated subscription
      console.log("🔄 Refreshing user data after successful payment");
      refreshUser();
    } else if (paymentStatus === "success") {
      setShowPaymentModal(true);

      // Also refresh user data for successful payments without session token
      console.log("🔄 Refreshing user data after payment success");
      refreshUser();
    }

    // Always refresh auth state when dashboard loads
    if (window.location.pathname === "/dashboard") {
      console.log("[Dashboard] Refreshing user data on dashboard load");
      refreshUser();
    }
  }, [toast, refreshUser]);

  if (!isAuthenticated) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </AuthGuard>
    );
  }

  if (!user) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </AuthGuard>
    );
  }

  console.log(user, "user dashboard");

  // Debug: Test refresh button
  const handleTestRefresh = () => {
    console.log("🔧 Manual refresh triggered");
    refreshUser();
  };

  const hasActiveSubscription =
    subscriptionData && subscriptionData.status === "active";
  const userTier = subscriptionData?.planName || "Free";

  // Simple feature detection based on plan
  const features = {
    realTimeData: true, // Always available
    buySellSignals: hasActiveSubscription || false,
    advancedCharts: hasActiveSubscription || false,
    heatmapAnalyzer: hasActiveSubscription || false,
    customAlerts: hasActiveSubscription || false,
    historicalData: hasActiveSubscription || false,
    advancedSignals: hasActiveSubscription || false,
    cycleForecasting: hasActiveSubscription || false,
    apiAccess: hasActiveSubscription || false,
  };

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
        description: `${featureName} requires an active subscription. Upgrade to access this feature.`,
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
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <PaymentSuccessModal
          open={showPaymentModal}
          onClose={handlePaymentModalClose}
        />

        {/* Sidebar and Main Content */}
        <div className="flex h-screen bg-background">
          <SidebarWithSubscription />
          <div className="flex-1 flex flex-col overflow-hidden ml-0 md:ml-64">
            <header className="bg-card border-b border-border px-4 sm:px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  {/* Temporary debug button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestRefresh}
                    className="text-xs"
                  >
                    🔄 Refresh User Data
                  </Button>

                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 text-xs"
                  >
                    <Star className="h-3 w-3" />
                    {user?.subscriptionTier || "Free"} Plan
                  </Badge>
                </div>
              </div>
            </header>
            <div className="flex-1 flex flex-col overflow-y-auto">
              <div className="p-6 space-y-6">
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
                        : `⭐ Free Tier`}
                    </Badge>
                    {(!hasActiveSubscription || userTier === "Free") && (
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
                {(!hasActiveSubscription || userTier === "Free") && (
                  <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800 dark:text-orange-200">
                      You're on the free tier with limited features.
                      <Link
                        href="/pricing"
                        className="ml-1 underline font-medium"
                      >
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
                        {hasActiveSubscription ? "✅ Active" : "❌ Inactive"}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Colorful Main Content Tabs */}
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 p-1">
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
                          <MarketWidget
                            symbol="BTCUSDT"
                            name="Bitcoin"
                            icon="₿"
                          />
                          <MarketWidget
                            symbol="ETHUSDT"
                            name="Ethereum"
                            icon="Ξ"
                          />
                          <MarketWidget
                            symbol="SOLUSDT"
                            name="Solana"
                            icon="◎"
                          />
                          <MarketWidget
                            symbol="PLSUSDT"
                            name="PulseChain"
                            icon="⚡"
                          />
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
                                  {formatDate(
                                    subscriptionData?.currentPeriodEnd || ""
                                  )}
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
                                <strong>Subscription ID:</strong>{" "}
                                {subscriptionData?.id}
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
                              {subscriptionData?.features?.map(
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
                                    className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold shadow-md hover:from-blue-600 hover:to-indigo-600"
                                  >
                                    Upgrade Plan
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      // Inactive Subscription Display
                      <div className="grid grid-cols-1 gap-6">
                        {/* Upgrade Prompt Card */}
                        <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/30 dark:to-pink-800/30 shadow-lg">
                          <CardHeader>
                            <div className="flex items-center gap-3">
                              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 shadow-lg">
                                <Lock className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <CardTitle className="text-red-800 dark:text-red-100 text-xl">
                                  🚀 Upgrade to Premium
                                </CardTitle>
                                <CardDescription className="text-red-700 dark:text-red-300 font-medium">
                                  Unlock advanced features and signals
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 rounded-lg bg-white/50 dark:bg-black/20">
                                <div className="flex items-center gap-2 mb-2">
                                  <CreditCard className="w-4 h-4 text-red-600" />
                                  <span className="text-sm font-medium text-red-800 dark:text-red-200">
                                    Amount
                                  </span>
                                </div>
                                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                                  ${subscriptionData?.amount}
                                </p>
                                <p className="text-xs text-red-600 dark:text-red-400">
                                  per {subscriptionData?.billingCycle}
                                </p>
                              </div>
                              <div className="p-4 rounded-lg bg-white/50 dark:bg-black/20">
                                <div className="flex items-center gap-2 mb-2">
                                  <Calendar className="w-4 h-4 text-red-600" />
                                  <span className="text-sm font-medium text-red-800 dark:text-red-200">
                                    Next Billing
                                  </span>
                                </div>
                                <p className="text-sm font-bold text-red-900 dark:text-red-100">
                                  {formatDate(
                                    subscriptionData?.currentPeriodEnd || ""
                                  )}
                                </p>
                                <p className="text-xs text-red-600 dark:text-red-400">
                                  {getDaysRemaining(
                                    subscriptionData?.currentPeriodEnd || ""
                                  )}{" "}
                                  days remaining
                                </p>
                              </div>
                            </div>

                            <div className="p-4 rounded-lg bg-white/50 dark:bg-black/20">
                              <div className="flex items-center gap-2 mb-2">
                                <Star className="w-4 h-4 text-red-600" />
                                <span className="text-sm font-medium text-red-800 dark:text-red-200">
                                  Status
                                </span>
                              </div>
                              <Badge className="bg-red-500 text-white">
                                {subscriptionData?.status.toUpperCase()}
                              </Badge>
                            </div>

                            <div className="pt-4 border-t border-red-200 dark:border-red-700">
                              <p className="text-xs text-red-600 dark:text-red-400 mb-2">
                                <strong>Subscription ID:</strong>{" "}
                                {subscriptionData?.id}
                              </p>
                              <p className="text-xs text-red-600 dark:text-red-400">
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
                              {subscriptionData?.features?.map(
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
                                    className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold shadow-md hover:from-blue-600 hover:to-indigo-600"
                                  >
                                    Upgrade Plan
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="features" className="space-y-6">
                    {/* Features Overview */}
                    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/30 dark:to-pink-800/30 shadow-lg">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                            <Star className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-purple-800 dark:text-purple-100 text-xl">
                              🌟 Features Overview
                            </CardTitle>
                            <CardDescription className="text-purple-700 dark:text-purple-300 font-medium">
                              Compare plan features and upgrade options
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Feature Cards */}
                          <FeatureCard
                            title="Real-time Data"
                            description="Access to real-time cryptocurrency data"
                            icon={TrendingUp}
                            hasFeature={features.realTimeData}
                            featureName="Real-time Data"
                          />
                          <FeatureCard
                            title="Buy/Sell Signals"
                            description="Receive automated buy/sell signals"
                            icon={Zap}
                            hasFeature={features.buySellSignals}
                            featureName="Buy/Sell Signals"
                          />
                          <FeatureCard
                            title="Advanced Charts"
                            description="Unlock advanced charting tools and indicators"
                            icon={BarChart3}
                            hasFeature={features.advancedCharts}
                            featureName="Advanced Charts"
                          />
                          <FeatureCard
                            title="Heatmap Analyzer"
                            description="Visualize market sentiment with heatmaps"
                            icon={Activity}
                            hasFeature={features.heatmapAnalyzer}
                            featureName="Heatmap Analyzer"
                          />
                          <FeatureCard
                            title="Custom Alerts"
                            description="Set up custom alerts for price movements"
                            icon={Clock}
                            hasFeature={features.customAlerts}
                            featureName="Custom Alerts"
                          />
                          <FeatureCard
                            title="Historical Data"
                            description="Access to historical market data"
                            icon={Archive}
                            hasFeature={features.historicalData}
                            featureName="Historical Data"
                          />
                          <FeatureCard
                            title="Advanced Signals"
                            description="Get access to advanced trading signals"
                            icon={Star}
                            hasFeature={features.advancedSignals}
                            featureName="Advanced Signals"
                          />
                          <FeatureCard
                            title="Cycle Forecasting"
                            description="Predict market cycles and trends"
                            icon={Moon}
                            hasFeature={features.cycleForecasting}
                            featureName="Cycle Forecasting"
                          />
                          <FeatureCard
                            title="API Access"
                            description="Integrate with our API for automated trading"
                            icon={Code}
                            hasFeature={features.apiAccess}
                            featureName="API Access"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
