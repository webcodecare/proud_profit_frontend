import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import ProtectedSidebarItem from "./ProtectedSidebarItem";
import { hasAccess, FeatureAccess } from "@/lib/subscriptionUtils";
import {
  Bitcoin,
  TrendingUp,
  Bell,
  Settings,
  SlidersHorizontal,
  Shield,
  BarChart3,
  BarChart,
  Users,
  Coins,
  Activity,
  CreditCard,
  DollarSign,
  MessageSquare,
  FileText,
  Edit,
  AlertTriangle,
  PieChart,
  Smile,
  Menu,
  X,
  LogOut,
  Star,
  Target,
  Trophy,
  UserCheck,
  Globe,
} from "lucide-react";

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
  subscription?: {
    id: string;
    planId: string;
    planName: string;
    planDescription: string;
    amount: number;
    yearlyPrice?: number | null;
    features: string[];
    status: string;
    billingCycle: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    stripePriceId: string;
    createdAt: string;
    updatedAt: string;
  };
}

export function Sidebar(props: SidebarProps) {
  const { className, subscription } = props;
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Admin users bypass subscription checks
  const isAdminUser = user?.role === "admin";

  // Check subscription tier for feature access
  const userTier = subscription?.planName?.toLowerCase() || "free";
  const isSubscriptionActive = user?.subscriptionStatus === "active";

  // Always show sidebar on /subscription and /pricing pages
  const alwaysShowPaths = ["/subscription", "/pricing"];
  const isAlwaysShowPage = alwaysShowPaths.some((p) => location.startsWith(p));

  // Hide sidebar completely for non-free users without active subscription (except admins), except on upgrade pages
  if (
    !isAdminUser &&
    userTier !== "free" &&
    !isSubscriptionActive &&
    !isAlwaysShowPage
  ) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === "/admin" && location === "/admin") return true;
    if (path !== "/admin" && location.startsWith(path)) return true;
    return location === path;
  };

  // Show 'My Plan' if user has an active paid subscription, otherwise show 'Subscription' button
  const hasActivePaidSubscription =
    subscription && subscription.status === "active";

  // Add debug logging
  console.log("🔍 Sidebar Debug Info:");
  console.log("- User:", user);
  console.log("- Subscription prop:", subscription);
  console.log("- hasActivePaidSubscription:", hasActivePaidSubscription);
  console.log("- User subscription status:", user?.subscriptionStatus);
  console.log("- User subscription tier:", user?.subscriptionTier);
  console.log("- Is admin:", isAdminUser);

  const userNavItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: TrendingUp,
      requiredFeature: "trading_dashboard" as keyof FeatureAccess,
      requiresSubscription: false, // Dashboard is always available
    },
    // Only show premium features if user has active subscription
    ...(hasActivePaidSubscription
      ? (() => {
          console.log("✅ Adding premium features to nav");
          return [
            {
              title: "Buy/Sell Chart",
              href: "/trading",
              icon: Activity,
              requiredFeature: "tradingPlayground" as keyof FeatureAccess,
              requiresSubscription: true,
            },
            {
              title: "Analytics",
              href: "/bitcoin-analytics",
              icon: Bitcoin,
              requiredFeature: "advancedAnalytics" as keyof FeatureAccess,
              requiresSubscription: true,
            },
          ];
        })()
      : (() => {
          console.log("❌ No premium features - no active subscription");
          return [];
        })()),
    // If user is NOT subscribed, show Subscription button
    // If user IS subscribed, hide the subscription button completely
    ...(!hasActivePaidSubscription
      ? [
          {
            title: "Subscription",
            href: "/subscription",
            icon: Star,
            requiredFeature: "basicSignals" as keyof FeatureAccess,
          },
        ]
      : []),
  ];

  const adminNavSections = [
    {
      title: "User Management",
      items: [
        {
          title: "All Users",
          href: "/admin/users",
          icon: Users,
          description: "Manage all users",
        },
      ],
    },
    {
      title: "Signal Management",
      items: [
        {
          title: "Signal Control",
          href: "/admin/signal-management",
          icon: Activity,
          description: "Create & manage signals",
        },
        {
          title: "Signal Logs",
          href: "/admin/signals",
          icon: FileText,
          description: "Signal history",
        },
        {
          title: "Signal Subscriptions",
          href: "/admin/signal-subscriptions",
          icon: Bell,
          description: "User signal subscriptions",
        },
      ],
    },
    {
      title: "Market Data",
      items: [
        {
          title: "Tickers",
          href: "/admin/tickers",
          icon: Coins,
          description: "Manage crypto pairs",
        },
        {
          title: "Live Streaming",
          href: "/live-streaming",
          icon: Activity,
          description: "Real-time data",
        },
        {
          title: "Historical Data",
          href: "/historical-ohlc",
          icon: BarChart,
          description: "OHLC data",
        },
      ],
    },
    {
      title: "Subscriptions & Payments",
      items: [
        {
          title: "Subscriptions",
          href: "/admin/subscriptions",
          icon: CreditCard,
          description: "User subscriptions",
        },
      ],
    },
    {
      title: "Notifications & Alerts",
      items: [
        {
          title: "Alert System",
          href: "/admin/alerts",
          icon: Bell,
          description: "System alerts",
        },
        {
          title: "Webhooks",
          href: "/admin/webhooks",
          icon: Globe,
          description: "Webhook management",
        },
        {
          title: "Notifications",
          href: "/admin/notifications",
          icon: MessageSquare,
          description: "User notifications",
        },
        {
          title: "Notification Center",
          href: "/notification-center",
          icon: MessageSquare,
          description: "Notification hub",
        },
      ],
    },
  ];

  // Flatten for compatibility with existing code
  const adminNavItems = adminNavSections.flatMap((section) => section.items);

  // Filter navigation items based on subscription features
  const filteredUserNavItems = userNavItems.filter((item) => {
    if (isAdminUser) return true; // Admins see everything
    if (!item.requiredFeature) return true; // Items without feature requirements are always shown
    return hasAccess(userTier, item.requiredFeature);
  });

  // Add this after line 205 (after filteredUserNavItems definition)
  console.log("📋 userNavItems:", userNavItems);
  console.log("📋 filteredUserNavItems:", filteredUserNavItems);
  userNavItems.forEach((item, index) => {
    const hasAccessResult = hasAccess(userTier, item.requiredFeature);
    console.log(
      `🔐 Item ${index}: ${item.title}, Feature: ${item.requiredFeature}, HasAccess: ${hasAccessResult}`
    );
  });

  const navItems =
    user?.role === "admin" ? adminNavItems : filteredUserNavItems;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg shadow-lg"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "w-64 bg-card h-screen border-r border-border fixed left-0 top-0 z-40 transition-transform duration-300",
          // Only use mobile menu state for mobile screens
          isMobileMenuOpen
            ? "translate-x-0 md:translate-x-0"
            : "-translate-x-full md:translate-x-0",
          className
        )}
      >
        <div className="p-4 md:p-6">
          <Link
            href="/"
            className="flex items-center justify-center mb-6 md:mb-8"
          >
            {user?.role === "admin" ? (
              <div className="flex items-center space-x-2">
                <Shield
                  className="h-5 w-5 md:h-6 md:w-6"
                  style={{ color: "#4A9FE7" }}
                />
                <span
                  className="text-lg md:text-xl font-bold"
                  style={{ color: "#4A9FE7" }}
                >
                  Admin Panel
                </span>
              </div>
            ) : (
              <img
                src="/proud-profits-logo.png"
                alt="Proud Profits"
                className="h-10 md:h-12 object-contain"
              />
            )}
          </Link>

          <nav className="space-y-1 md:space-y-2 max-h-[calc(100vh-180px)] overflow-y-auto">
            {user?.role === "admin"
              ? // Admin organized sections
                adminNavSections.map((section, sectionIndex) => (
                  <div key={section.title} className="space-y-1">
                    {sectionIndex > 0 && (
                      <div className="my-3 border-t border-border/50"></div>
                    )}
                    <div className="px-2 py-1">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {section.title}
                      </h3>
                    </div>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center space-x-3 p-2 md:p-3 rounded-lg transition-colors text-sm md:text-base group relative",
                            isActive(item.href)
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                          onClick={() => {
                            // Only close menu on mobile
                            if (window.innerWidth < 768)
                              setIsMobileMenuOpen(false);
                          }}
                        >
                          <Icon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="truncate block">{item.title}</span>
                            <span className="text-xs text-muted-foreground/70 truncate hidden md:block">
                              {item.description}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ))
              : // User navigation (existing)
                filteredUserNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-3 p-2 md:p-3 rounded-lg transition-colors text-sm md:text-base",
                        isActive(item.href)
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                      onClick={() => {
                        // Only close menu on mobile
                        if (window.innerWidth < 768) setIsMobileMenuOpen(false);
                      }}
                    >
                      <Icon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="truncate">{item.title}</span>
                        {"description" in item && (item as any).description && (
                          <span className="text-xs text-muted-foreground/70 truncate">
                            {(item as any).description}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
          </nav>

          {/* User Info and Logout */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 border-t border-border bg-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                </div>
                <div className="hidden md:block">
                  <p className="font-medium text-foreground">
                    {user?.firstName || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                // Only close menu on mobile
                if (window.innerWidth < 768) setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center space-x-3 p-2 md:p-3 rounded-lg transition-colors text-sm md:text-base text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <LogOut className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
