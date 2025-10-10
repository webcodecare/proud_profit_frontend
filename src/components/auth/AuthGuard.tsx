import React, { useEffect, startTransition } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";
import { AuthUtils } from "@/lib/authUtils";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "user";
  allowedRoles?: Array<"admin" | "user">;
  exactRole?: boolean; // For strict role matching
}

export default function AuthGuard({
  children,
  requiredRole,
  allowedRoles,
  exactRole = false,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  // Debug authentication state
  console.log("🛡️ AuthGuard:", {
    isAuthenticated,
    isLoading,
    hasUser: !!user,
    userRole: user?.role,
    requiredRole,
    allowedRoles,
    path: window.location.pathname,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      startTransition(() => {
        // Store the attempted URL for post-login redirect
        const currentPath = window.location.pathname;
        if (
          currentPath !== "/login" &&
          currentPath !== "/auth" &&
          currentPath !== "/"
        ) {
          sessionStorage.setItem("redirectAfterLogin", currentPath);
        }
        setLocation("/auth");
      });
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Redirect free tier users to subscription page
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const userTier = user.subscriptionTier || "free";
      const subscriptionStatus = user.subscriptionStatus;
      const currentPath = window.location.pathname;

      // Skip redirecting if user is admin or already on subscription/pricing page
      if (user.role === "admin") {
        return;
      }

      if (
        currentPath === "/subscription" ||
        currentPath === "/pricing" ||
        currentPath === "/auth" ||
        currentPath === "/"
      ) {
        return;
      }

      // Check if user just completed payment or subscription is being activated
      const urlParams = new URLSearchParams(window.location.search);
      const paymentSuccess = urlParams.get("payment") === "success";
      const subscriptionActivated =
        urlParams.get("subscription") === "activated";

      // Allow dashboard access after payment success or if subscription was just activated
      if (paymentSuccess || subscriptionActivated) {
        return;
      }

      // Redirect non-free tier users without active subscription to subscription page
      // Free tier users should have access to the dashboard
      if (
        userTier !== "free" &&
        (!subscriptionStatus || subscriptionStatus !== "active")
      ) {
        startTransition(() => {
          setLocation("/subscription");
        });
      }
    }
  }, [isAuthenticated, isLoading, user, setLocation]);

  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <div className="flex items-center justify-center mb-8">
            <div className="animate-spin w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full"></div>
          </div>
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3 mx-auto" />
        </div>
      </div>
    );
  }

  // If not authenticated, show a clean loading state while redirect happens
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full mx-auto"></div>
          <p className="text-sm text-muted-foreground">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  // Check role-based access with support for exclusivity
  if (requiredRole || allowedRoles) {
    let hasAccess = false;

    if (allowedRoles) {
      // Check if user's role is in the allowed roles list
      hasAccess = allowedRoles.includes(user?.role as any);
    } else if (requiredRole) {
      if (exactRole) {
        // Exact role match - no hierarchy
        hasAccess = user?.role === requiredRole;
      } else {
        // Use AuthUtils for hierarchical role checking
        hasAccess = AuthUtils.hasPermission(user, requiredRole);
      }
    }

    if (!hasAccess) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="mb-6">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="text-2xl lg:text-4xl font-bold text-destructive mb-2">
                Access Denied
              </h1>
              <p className="text-muted-foreground mb-6">
                {allowedRoles
                  ? `This page is restricted to ${allowedRoles.join(
                      ", "
                    )} roles only.`
                  : exactRole
                  ? `This page requires exactly ${requiredRole} role.`
                  : `You don't have permission to access this page. ${
                      requiredRole === "admin" ? "Administrator" : "Elevated"
                    } privileges required.`}
              </p>
            </div>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/dashboard">Return to Dashboard</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/settings">Account Settings</Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
