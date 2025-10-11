import React, { useState, Suspense, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { jwtDecode } from "jwt-decode";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SidebarWithSubscription from "@/components/layout/SidebarWithSubscription";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { SessionManager } from "@/lib/sessionManager";
import { useToast } from "@/hooks/use-toast";
import {
  Star,
  Activity,
  TrendingUp,
  Zap,
  BarChart3,
  Settings,
  LogOut,
  User,
  Home,
  Check,
} from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  tier: string;
  monthlyPrice: number;
  yearlyPrice: number | null;
  features: string[];
  maxSignals: number | null;
  maxTickers: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const getTierDescription = (tier: string) => {
  switch (tier) {
    case "basic":
      return "Perfect for getting started with crypto trading";
    case "premium":
      return "Advanced features for serious traders";
    case "pro":
      return "Everything you need for professional trading";
    case "elite":
      return "Complete solution for professional traders";
    default:
      return "Enhance your trading experience";
  }
};

const getTierCTA = (tier: string) => {
  switch (tier) {
    case "basic":
      return "Get Started";
    case "premium":
      return "Go Premium";
    case "pro":
      return "Go Pro";
    case "elite":
      return "Go Elite";
    default:
      return "Choose Plan";
  }
};

function LoadingSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-6 sm:h-8 w-48 sm:w-64" />
              <Skeleton className="h-3 sm:h-4 w-64 sm:w-96" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2">
                <Skeleton className="h-48 sm:h-64 w-full" />
              </div>
              <div className="space-y-3 sm:space-y-4">
                <Skeleton className="h-24 sm:h-32 w-full" />
                <Skeleton className="h-36 sm:h-48 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  const { user, isLoading, isAuthenticated, refreshAuthState, refreshUser } =
    useAuth();
  const [selectedTicker, setSelectedTicker] = useState<string>("BTCUSDT");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleTickerSelect = (symbol: string) => {
    setSelectedTicker(symbol);
  };

  const handleLogout = () => {
    try {
      SessionManager.clearSession();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      setLocation("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was an issue logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="text-center">
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Please log in to manage your subscriptions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has paid subscription
  const hasActivePaidSubscription =
    user &&
    user.subscriptionTier !== "free" &&
    user.subscriptionStatus === "active";

  // Admin users bypass subscription checks
  const isAdminUser = user?.role === "admin";

  // Show sidebar only for paid subscribers or admins
  const showSidebar = isAdminUser || hasActivePaidSubscription;

  // Log decoded JWT token to see user data being sent to backend
  useEffect(() => {
    const session = localStorage.getItem("crypto_session");
    let token = null;
    if (session) {
      try {
        const parsed = JSON.parse(session);
        token = parsed.token;
      } catch {
        token = session;
      }
    }
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log(
          "Decoded JWT payload (user data sent to backend):",
          decoded
        );
      } catch (err) {
        console.warn("Failed to decode JWT token:", err);
      }
    } else {
      console.log("No token found in localStorage for decoding.");
    }
  }, []);

  // Always refresh auth state on mount to ensure latest user/token
  useEffect(() => {
    refreshAuthState();

    // Also check for payment success and refresh user data
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");

    if (paymentStatus === "success") {
      console.log(
        "🔄 Payment success detected on subscription page, refreshing user data"
      );
      refreshUser();
    }
  }, [refreshAuthState, refreshUser]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionToken = params.get("session_token");
    const paymentStatus = params.get("payment");

    if (sessionToken && paymentStatus === "cancelled") {
      console.log("🔐 Restoring auth token from Stripe cancel redirect");
      localStorage.setItem("auth_token", sessionToken);
      SessionManager.createSession(sessionToken, null);

      toast({
        title: "Payment Cancelled",
        description:
          "Your payment was cancelled. Please try again when you're ready.",
        variant: "default",
      });

      window.history.replaceState({}, document.title, "/pricing");
    }
  }, [toast]);

  // Fetch subscription plans from database
  const { data: plansResponse, isLoading: plansLoading } = useQuery({
    queryKey: ["/api/subscription-plans"],
    queryFn: () => apiRequest("/api/subscription-plans"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const fallbackPlans: SubscriptionPlan[] = [
    {
      id: "basic",
      name: "Basic Plan",
      tier: "basic",
      monthlyPrice: 4700,
      yearlyPrice: null,
      features: [
        "Real-time price alerts",
        "Basic trading signals",
        "Portfolio tracking",
        "Email notifications",
        "Mobile app access",
      ],
      maxSignals: 50,
      maxTickers: 5,
      isActive: true,
    },
    {
      id: "premium",
      name: "Pro Trader",
      tier: "premium",
      monthlyPrice: 9700,
      yearlyPrice: null,
      features: [
        "All Basic features",
        "Advanced trading signals",
        "Technical analysis tools",
        "SMS notifications",
        "Priority email support",
        "Custom alerts",
        "Market insights",
      ],
      maxSignals: 200,
      maxTickers: 20,
      isActive: true,
    },
    {
      id: "pro",
      name: "Elite Trader",
      tier: "pro",
      monthlyPrice: 19700,
      yearlyPrice: null,
      features: [
        "All Pro features",
        "AI-powered signals",
        "Advanced forecasting",
        "Phone support",
        "Custom integrations",
        "White-label access",
        "Dedicated account manager",
      ],
      maxSignals: -1,
      maxTickers: -1,
      isActive: true,
    },
  ];

  const subscriptionPlans: SubscriptionPlan[] =
    plansResponse?.plans?.map((plan: any) => ({
      id: plan.id,
      name: plan.name,
      tier: plan.tier || plan.name.toLowerCase(),
      monthlyPrice: plan.price,
      yearlyPrice: plan.yearly_price || null,
      features: plan.features || [],
      maxSignals: plan.max_signals ?? -1,
      maxTickers: plan.max_tickers ?? -1,
      isActive: plan.is_active ?? true,
    })) || fallbackPlans;

  // Check if any plans support yearly billing
  const hasYearlyPlans = subscriptionPlans.some((plan) => plan.yearlyPrice);

  // Auto-switch to monthly if yearly is selected but current plans don't support yearly
  useEffect(() => {
    if (isAnnual && !hasYearlyPlans) {
      setIsAnnual(false);
    }
  }, [isAnnual, hasYearlyPlans]);

  const handleStripeCheckout = async (plan: SubscriptionPlan) => {
    // Debug: Log authentication state and token storage
    console.log("🔍 Payment attempt - Auth state:", {
      isAuthenticated,
      hasUser: !!user,
      userId: user?.id,
      sessionToken: localStorage.getItem("crypto_session")
        ? "exists"
        : "missing",
      legacyToken: localStorage.getItem("auth_token") ? "exists" : "missing",
    });

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      console.error("❌ User not authenticated for payment");
      toast({
        title: "Login Required",
        description: "Please login first to subscribe to a plan.",
        variant: "destructive",
      });
      // Redirect to login page
      setLocation("/auth");
      return;
    }

    try {
      console.log("💳 Starting Stripe checkout for plan:", plan.tier);
      setLoading(plan.id);
      const hasYearlyPrice = plan.yearlyPrice && plan.yearlyPrice > 0;
      const billingInterval = hasYearlyPrice && isAnnual ? "yearly" : "monthly";

      const data = await apiRequest("/api/create-subscription", {
        method: "POST",
        body: JSON.stringify({
          planTier: plan.tier,
          planId: plan.id,
          billingInterval,
        }),
      });
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Stripe checkout error:", error);

      // Handle unauthorized error specifically
      if (
        error?.message?.includes("401") ||
        error?.message?.toLowerCase().includes("unauthorized")
      ) {
        toast({
          title: "Authentication Required",
          description: "Your session has expired. Please login again.",
          variant: "destructive",
        });
        setLocation("/auth");
      } else {
        toast({
          title: "Payment Error",
          description:
            error?.message ||
            "Failed to start payment process. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(null);
    }
  };

  const getSavingsPercentage = (monthly: number, yearly: number) => {
    return Math.round(((monthly * 12 - yearly) / (monthly * 12)) * 100);
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(0); // Show whole dollars for pricing page
  };

  // Filter active plans only
  const activePlans = subscriptionPlans.filter((plan) => plan.isActive);

  if (plansLoading) {
    return (
      <div className="min-h-screen bg-slate-900 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // If no active plans available
  if (activePlans.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 dark:bg-slate-950">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md bg-slate-800 border-slate-600">
            <CardContent className="pt-6">
              <div className="text-center">
                <Settings className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">
                  No Plans Available
                </h3>
                <p className="text-slate-300">
                  There are currently no subscription plans available.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <div className="flex h-screen bg-background">
        {showSidebar && <SidebarWithSubscription />}
        <div
          className={`flex-1 flex flex-col overflow-hidden ${
            showSidebar ? "ml-0 lg:ml-64" : ""
          }`}
        >
          {/* Top Header with Logout */}
          <header className="bg-card border-b border-border px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/dashboard")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 text-xs"
                >
                  <Star className="h-3 w-3" />
                  {user?.subscriptionTier || "Free"} Plan
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={""} alt={user?.email} />
                        <AvatarFallback>
                          {user?.email?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        {user?.email && (
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setLocation("/dashboard")}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/pricing")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Upgrade</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="min-h-screen bg-background">
              <div className="py-20">
                <div className="container mx-auto px-4">
                  <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
                      Choose Your Trading Plan
                    </h1>
                    <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                      Unlock powerful crypto trading insights with our
                      comprehensive analytics platform
                    </p>

                    {/* Billing Toggle - Only show if there are yearly plans */}
                    {hasYearlyPlans && (
                      <div className="flex items-center justify-center gap-4 mb-12">
                        <span
                          className={`text-sm font-medium ${
                            !isAnnual ? "text-orange-400" : "text-slate-400"
                          }`}
                        >
                          Monthly
                        </span>
                        <button
                          onClick={() => setIsAnnual(!isAnnual)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                            isAnnual ? "bg-orange-500" : "bg-slate-600"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isAnnual ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                        <span
                          className={`text-sm font-medium ${
                            isAnnual ? "text-orange-400" : "text-slate-400"
                          }`}
                        >
                          Annual
                        </span>
                        {isAnnual && (
                          <Badge variant="secondary" className="ml-2">
                            Save up to 20%
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div
                    className={`grid gap-6 max-w-7xl mx-auto ${
                      activePlans.length === 1
                        ? "grid-cols-1 max-w-md justify-items-center"
                        : activePlans.length === 2
                        ? "grid-cols-1 sm:grid-cols-2 max-w-4xl justify-center"
                        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    }`}
                  >
                    {activePlans.map((plan, index) => {
                      const hasYearlyPrice =
                        plan.yearlyPrice && plan.yearlyPrice > 0;
                      const showYearlyPrice = isAnnual && hasYearlyPrice;
                      const price = showYearlyPrice
                        ? plan.yearlyPrice!
                        : plan.monthlyPrice;
                      const isPopular = plan.tier === "premium"; // Mark premium as popular
                      const description = getTierDescription(plan.tier);
                      const ctaText = getTierCTA(plan.tier);

                      return (
                        <Card
                          key={plan.id}
                          className={`relative transition-all duration-300 hover:scale-105 bg-slate-800/60 border-slate-600/40 ${
                            isPopular
                              ? "border-2 border-orange-500/60 shadow-2xl ring-2 ring-orange-500 ring-opacity-50"
                              : "hover:shadow-xl hover:border-slate-500/60"
                          }`}
                        >
                          {isPopular && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                              <Badge className="bg-orange-500 text-white px-4 py-1">
                                Most Popular
                              </Badge>
                            </div>
                          )}

                          <CardHeader className="text-center pb-6">
                            <CardTitle className="text-2xl font-bold text-white">
                              {plan.name}
                            </CardTitle>
                            <div className="mt-4">
                              <div className="flex items-baseline justify-center">
                                <span className="text-4xl font-extrabold text-white">
                                  ${formatPrice(price)}
                                </span>
                                <span className="text-slate-400 ml-1">
                                  /{showYearlyPrice ? "year" : "month"}
                                </span>
                              </div>
                              {showYearlyPrice && (
                                <div className="text-sm text-green-600 font-medium mt-2">
                                  Save{" "}
                                  {getSavingsPercentage(
                                    plan.monthlyPrice,
                                    plan.yearlyPrice!
                                  )}
                                  % annually
                                </div>
                              )}
                              {isAnnual && !hasYearlyPrice && (
                                <p className="text-xs text-slate-400 mt-1">
                                  Monthly billing only
                                </p>
                              )}
                            </div>
                            <p className="text-slate-300 mt-4">{description}</p>
                          </CardHeader>

                          <CardContent className="pb-6">
                            <ul className="space-y-3">
                              {plan.features.map((feature, index) => (
                                <li key={index} className="flex items-start">
                                  <Check className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-slate-200">
                                    {feature}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>

                          <CardFooter className="pt-6 flex flex-col gap-3">
                            <Button
                              className={`w-full ${
                                isPopular
                                  ? "bg-orange-500 hover:bg-orange-600"
                                  : "bg-slate-700 hover:bg-slate-600"
                              }`}
                              onClick={() => handleStripeCheckout(plan)}
                              disabled={loading === plan.id}
                            >
                              {loading === plan.id ? (
                                <div className="flex items-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Processing...
                                </div>
                              ) : (
                                ctaText + " - Stripe"
                              )}
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>

                  {/* FAQ Section */}
                  <div className="mt-20 max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12 text-white">
                      Frequently Asked Questions
                    </h2>
                    <div className="grid gap-8 md:grid-cols-2">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-white">
                          Can I change plans anytime?
                        </h3>
                        <p className="text-slate-300">
                          Yes, you can upgrade or downgrade your plan at any
                          time. Changes take effect immediately.
                        </p>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-white">
                          Do you offer refunds?
                        </h3>
                        <p className="text-slate-300">
                          We offer a 30-day money-back guarantee on all plans.
                          No questions asked.
                        </p>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-white">
                          Is my data secure?
                        </h3>
                        <p className="text-slate-300">
                          Absolutely. We use enterprise-grade security and never
                          share your trading data.
                        </p>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-white">
                          What payment methods do you accept?
                        </h3>
                        <p className="text-slate-300">
                          We accept all major credit cards through Stripe
                          payments.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Trust Indicators */}
                  <div className="mt-16 text-center">
                    <p className="text-sm text-slate-400 mb-4">
                      Trusted by traders worldwide
                    </p>
                    <div className="flex justify-center items-center gap-8 opacity-60">
                      <div className="text-xs">🔒 SSL Secured</div>
                      <div className="text-xs">💳 Stripe Certified</div>
                      <div className="text-xs">🛡️ SOC 2 Compliant</div>
                      <div className="text-xs">📱 Mobile Ready</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
