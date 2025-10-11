import React, { useEffect, lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { useTokenMonitor } from "@/hooks/useTokenMonitor";
import SessionWarning from "@/components/auth/SessionWarning";
import PerformanceOptimizer from "@/components/common/PerformanceOptimizer";
import AuthGuard from "@/components/auth/AuthGuard";
import SubscriptionGuard from "@/components/auth/SubscriptionGuard";
import { AdminErrorBoundary } from "@/components/admin/AdminErrorBoundary";
import NotificationInitializer from "@/components/NotificationInitializer";

// Critical pages loaded immediately
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Auth from "@/pages/auth";
import AuthCallback from "@/pages/auth-callback";
import ResetPassword from "@/pages/reset-password";

// Heavy pages lazy loaded for better performance
const Dashboard = lazy(() => import("@/pages/dashboard"));

const Trading = lazy(() => import("@/pages/trading"));
const Admin = lazy(() => import("@/pages/admin"));
const Alerts = lazy(() => import("@/pages/alerts"));
const Settings = lazy(() => import("@/pages/settings"));
const Subscription = lazy(() => import("@/pages/subscription"));
const BitcoinAnalytics = lazy(() => import("@/pages/bitcoin-analytics"));
const Members = lazy(() => import("@/pages/members"));
const MarketData = lazy(() => import("@/pages/market-data"));
const About = lazy(() => import("@/pages/about"));
const Contact = lazy(() => import("@/pages/contact"));
const Privacy = lazy(() => import("@/pages/privacy"));
const Terms = lazy(() => import("@/pages/terms"));
const Pricing = lazy(() => import("@/pages/pricing"));
const Checkout = lazy(() => import("@/pages/checkout"));
const Subscribe = lazy(() => import("@/pages/subscribe"));
const Demo = lazy(() => import("@/pages/demo"));

// Additional pages from GitHub
const AdvancedAlerts = lazy(() => import("@/pages/advanced-alerts"));
const DashboardWidgets = lazy(() => import("@/pages/dashboard-widgets"));
const HistoricalOhlc = lazy(() => import("@/pages/historical-ohlc"));
const LiveStreaming = lazy(() => import("@/pages/live-streaming"));
const NotificationCenter = lazy(() => import("@/pages/notification-center"));
const NotificationDashboard = lazy(
  () => import("@/pages/notification-dashboard")
);
const NotificationSetup = lazy(() => import("@/pages/notification-setup"));
const Preferences = lazy(() => import("@/pages/preferences"));
const TradingPlayground = lazy(() => import("@/pages/trading-playground"));
const UpgradePage = lazy(() => import("@/pages/upgrade"));

// Admin pages
const AdminUsers = lazy(() => import("@/pages/admin/users"));
const AdminTickers = lazy(() => import("@/pages/admin/tickers"));
const AdminSignals = lazy(() => import("@/pages/admin/signals"));
const AdminAlerts = lazy(() => import("@/pages/admin/alerts"));
const AdminWebhooks = lazy(() => import("@/pages/admin/webhooks"));
const AdminNotifications = lazy(() => import("@/pages/admin/notifications"));
const AdminLogs = lazy(() => import("@/pages/admin/logs"));
const AdminAnalytics = lazy(() => import("@/pages/admin/analytics"));
const AdminIntegrations = lazy(() => import("@/pages/admin/integrations"));
const AdminReports = lazy(() => import("@/pages/admin/reports"));
const AdminPermissions = lazy(() => import("@/pages/admin/permissions"));
const AdminUserRoles = lazy(() => import("@/pages/admin/user-roles"));
const AdminPayments = lazy(() => import("@/pages/admin/payments"));
const AdminSubscriptions = lazy(() => import("@/pages/admin/subscriptions"));
const AdminContent = lazy(() => import("@/pages/admin/content"));
const AdminNotificationSetup = lazy(
  () => import("@/pages/admin/notification-setup")
);
const AdminTestUsers = lazy(() => import("@/pages/admin/test-users"));
const AdminSignalManagement = lazy(
  () => import("@/pages/admin/SignalManagement")
);
const AdminSignalSubscriptions = lazy(
  () => import("@/pages/admin/signal-subscriptions")
);
const AdminApiTester = lazy(() => import("@/pages/admin/api-tester"));
const UserSubscriptionManagement = lazy(
  () => import("@/pages/user/SubscriptionManagement")
);
const UserNotifications = lazy(() => import("@/pages/UserNotifications"));

// Loading component for better UX
const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
    <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
    <p className="text-muted-foreground text-sm">Loading...</p>
  </div>
);

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/demo">
        <Suspense fallback={<LoadingScreen />}>
          <Demo />
        </Suspense>
      </Route>
      <Route path="/auth" component={Auth} />
      <Route path="/auth/login" component={Auth} />
      <Route path="/auth/register" component={Auth} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/signup" component={Auth} />
      <Route path="/login" component={Auth} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/pricing">
        <Suspense fallback={<LoadingScreen />}>
          <Pricing />
        </Suspense>
      </Route>
      <Route path="/checkout">
        <Suspense fallback={<LoadingScreen />}>
          <Checkout />
        </Suspense>
      </Route>
      <Route path="/subscribe">
        <Suspense fallback={<LoadingScreen />}>
          <Subscribe />
        </Suspense>
      </Route>
      <Route
        path="/dashboard"
        component={() => (
          <AuthGuard allowedRoles={["user"]}>
            <Suspense fallback={<LoadingScreen />}>
              <Dashboard />
            </Suspense>
          </AuthGuard>
        )}
      />

      <Route
        path="/trading"
        component={() => (
          <AuthGuard allowedRoles={["user"]}>
            <SubscriptionGuard feature="trading">
              <Suspense fallback={<LoadingScreen />}>
                <Trading />
              </Suspense>
            </SubscriptionGuard>
          </AuthGuard>
        )}
      />
      <Route
        path="/admin"
        component={() => (
          <AuthGuard requiredRole="admin">
            <AdminErrorBoundary>
              <Suspense fallback={<LoadingScreen />}>
                <Admin />
              </Suspense>
            </AdminErrorBoundary>
          </AuthGuard>
        )}
      />
      <Route
        path="/alerts"
        component={() => (
          <AuthGuard allowedRoles={["user"]}>
            <Suspense fallback={<LoadingScreen />}>
              <Alerts />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/settings"
        component={() => (
          <AuthGuard allowedRoles={["user"]}>
            <Suspense fallback={<LoadingScreen />}>
              <Settings />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/notifications"
        component={() => (
          <AuthGuard allowedRoles={["user"]}>
            <Suspense fallback={<LoadingScreen />}>
              <UserNotifications />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/subscription"
        component={() => (
          <AuthGuard allowedRoles={["user"]}>
            <Suspense fallback={<LoadingScreen />}>
              <Subscription />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/bitcoin-analytics"
        component={() => (
          <AuthGuard allowedRoles={["user"]}>
            <SubscriptionGuard feature="analytics">
              <Suspense fallback={<LoadingScreen />}>
                <BitcoinAnalytics />
              </Suspense>
            </SubscriptionGuard>
          </AuthGuard>
        )}
      />
      <Route
        path="/members"
        component={() => (
          <AuthGuard allowedRoles={["user"]}>
            <Suspense fallback={<LoadingScreen />}>
              <Members />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route path="/market-data">
        <Suspense fallback={<LoadingScreen />}>
          <MarketData />
        </Suspense>
      </Route>
      <Route path="/about">
        <Suspense fallback={<LoadingScreen />}>
          <About />
        </Suspense>
      </Route>
      <Route path="/contact">
        <Suspense fallback={<LoadingScreen />}>
          <Contact />
        </Suspense>
      </Route>
      <Route path="/privacy">
        <Suspense fallback={<LoadingScreen />}>
          <Privacy />
        </Suspense>
      </Route>
      <Route path="/terms">
        <Suspense fallback={<LoadingScreen />}>
          <Terms />
        </Suspense>
      </Route>

      {/* Additional authenticated pages */}
      <Route
        path="/advanced-alerts"
        component={() => (
          <AuthGuard requiredRole="admin">
            <Suspense fallback={<LoadingScreen />}>
              <AdvancedAlerts />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/dashboard-widgets"
        component={() => (
          <AuthGuard allowedRoles={["user"]}>
            <Suspense fallback={<LoadingScreen />}>
              <DashboardWidgets />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/historical-ohlc"
        component={() => (
          <AuthGuard requiredRole="admin">
            <Suspense fallback={<LoadingScreen />}>
              <HistoricalOhlc />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/live-streaming"
        component={() => (
          <AuthGuard requiredRole="admin">
            <Suspense fallback={<LoadingScreen />}>
              <LiveStreaming />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/notification-center"
        component={() => (
          <AuthGuard requiredRole="admin">
            <Suspense fallback={<LoadingScreen />}>
              <NotificationCenter />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/notification-dashboard"
        component={() => (
          <AuthGuard requiredRole="admin">
            <Suspense fallback={<LoadingScreen />}>
              <NotificationDashboard />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/notification-setup"
        component={() => (
          <AuthGuard allowedRoles={["user"]}>
            <Suspense fallback={<LoadingScreen />}>
              <NotificationSetup />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/preferences"
        component={() => (
          <AuthGuard allowedRoles={["user"]}>
            <Suspense fallback={<LoadingScreen />}>
              <Preferences />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/trading-playground"
        component={() => (
          <AuthGuard allowedRoles={["user"]}>
            <Suspense fallback={<LoadingScreen />}>
              <TradingPlayground />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/upgrade"
        component={() => (
          <AuthGuard allowedRoles={["user"]}>
            <Suspense fallback={<LoadingScreen />}>
              <UpgradePage />
            </Suspense>
          </AuthGuard>
        )}
      />

      {/* Signal Management Pages */}
      <Route
        path="/admin/signal-management"
        component={() => (
          <AuthGuard requiredRole="admin">
            <Suspense fallback={<LoadingScreen />}>
              <AdminSignalManagement />
            </Suspense>
          </AuthGuard>
        )}
      />

      <Route
        path="/my-subscriptions"
        component={() => (
          <AuthGuard allowedRoles={["user"]}>
            <Suspense fallback={<LoadingScreen />}>
              <UserSubscriptionManagement />
            </Suspense>
          </AuthGuard>
        )}
      />

      {/* Admin pages */}
      <Route
        path="/admin/users"
        component={() => (
          <AuthGuard requiredRole="admin">
            <AdminErrorBoundary>
              <Suspense fallback={<LoadingScreen />}>
                <AdminUsers />
              </Suspense>
            </AdminErrorBoundary>
          </AuthGuard>
        )}
      />
      <Route
        path="/admin/tickers"
        component={() => (
          <AuthGuard requiredRole="admin">
            <AdminErrorBoundary>
              <Suspense fallback={<LoadingScreen />}>
                <AdminTickers />
              </Suspense>
            </AdminErrorBoundary>
          </AuthGuard>
        )}
      />
      <Route
        path="/admin/signals"
        component={() => (
          <AuthGuard requiredRole="admin">
            <AdminErrorBoundary>
              <Suspense fallback={<LoadingScreen />}>
                <AdminSignals />
              </Suspense>
            </AdminErrorBoundary>
          </AuthGuard>
        )}
      />
      <Route
        path="/admin/alerts"
        component={() => (
          <AuthGuard requiredRole="admin">
            <Suspense fallback={<LoadingScreen />}>
              <AdminAlerts />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/admin/webhooks"
        component={() => (
          <AuthGuard requiredRole="admin">
            <Suspense fallback={<LoadingScreen />}>
              <AdminWebhooks />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/admin/notifications"
        component={() => (
          <AuthGuard requiredRole="admin">
            <Suspense fallback={<LoadingScreen />}>
              <AdminNotifications />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/admin/logs"
        component={() => (
          <AuthGuard requiredRole="admin">
            <Suspense fallback={<LoadingScreen />}>
              <AdminLogs />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/admin/analytics"
        component={() => (
          <AuthGuard requiredRole="admin">
            <Suspense fallback={<LoadingScreen />}>
              <AdminAnalytics />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/admin/integrations"
        component={() => (
          <AuthGuard requiredRole="admin">
            <Suspense fallback={<LoadingScreen />}>
              <AdminIntegrations />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/admin/reports"
        component={() => (
          <AuthGuard requiredRole="admin">
            <Suspense fallback={<LoadingScreen />}>
              <AdminReports />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/admin/permissions"
        component={() => (
          <AuthGuard requiredRole="admin">
            <Suspense fallback={<LoadingScreen />}>
              <AdminPermissions />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/admin/user-roles"
        component={() => (
          <AuthGuard requiredRole="admin">
            <Suspense fallback={<LoadingScreen />}>
              <AdminUserRoles />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/admin/payments"
        component={() => (
          <AuthGuard requiredRole="admin">
            <Suspense fallback={<LoadingScreen />}>
              <AdminPayments />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/admin/subscriptions"
        component={() => (
          <Suspense fallback={<LoadingScreen />}>
            <AdminSubscriptions />
          </Suspense>
        )}
      />
      <Route
        path="/admin/signal-subscriptions"
        component={() => (
          <AuthGuard requiredRole="admin">
            <Suspense fallback={<LoadingScreen />}>
              <AdminSignalSubscriptions />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/demo/signal-subscriptions"
        component={() => (
          <Suspense fallback={<LoadingScreen />}>
            <AdminSignalSubscriptions demoMode={true} />
          </Suspense>
        )}
      />
      <Route
        path="/admin/content"
        component={() => (
          <AuthGuard requiredRole="admin">
            <Suspense fallback={<LoadingScreen />}>
              <AdminContent />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/admin/notification-setup"
        component={() => (
          <AuthGuard requiredRole="admin">
            <Suspense fallback={<LoadingScreen />}>
              <AdminNotificationSetup />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/admin/test-users"
        component={() => (
          <AuthGuard requiredRole="admin">
            <Suspense fallback={<LoadingScreen />}>
              <AdminTestUsers />
            </Suspense>
          </AuthGuard>
        )}
      />
      <Route
        path="/admin/api-tester"
        component={() => (
          <AuthGuard requiredRole="admin">
            <Suspense fallback={<LoadingScreen />}>
              <AdminApiTester />
            </Suspense>
          </AuthGuard>
        )}
      />

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  // Global error handling for chart-related issues
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);

      // Prevent default behavior for specific known issues
      if (event.reason && event.reason.message) {
        const message = event.reason.message.toLowerCase();
        if (
          message.includes("tradingview") ||
          message.includes("chart") ||
          message.includes("widget")
        ) {
          event.preventDefault();
          console.warn("Chart-related error handled gracefully");
          return;
        }
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () =>
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TokenMonitorWrapper />
        <NotificationInitializer />
        <TooltipProvider>
          <PerformanceOptimizer>
            <div className="min-h-screen bg-background text-foreground">
              <Router />
              <SessionWarning
                onExtend={() => console.log("Session extended")}
                onLogout={() => console.log("Session logged out")}
              />
              <Toaster />
            </div>
          </PerformanceOptimizer>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Token Monitor Component
function TokenMonitorWrapper() {
  useTokenMonitor();
  return null;
}
