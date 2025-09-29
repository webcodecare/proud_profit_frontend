import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionManager } from "@/lib/sessionManager";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "superuser" | "user";
  fallbackPath?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole,
  fallbackPath = "/login" 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check session validity first
    if (!SessionManager.isValidSession()) {
      SessionManager.clearSession();
      setLocation(fallbackPath);
      return;
    }

    if (!isLoading && !isAuthenticated) {
      // Store the attempted URL for post-login redirect
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/auth' && currentPath !== '/') {
        sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
      setLocation(fallbackPath);
    }
  }, [isAuthenticated, isLoading, setLocation, fallbackPath]);

  // Show loading state while authentication is being verified
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // Return null if not authenticated (redirect is handled in useEffect)
  if (!isAuthenticated) {
    return null;
  }

  // Check role-based access control
  if (requiredRole && user?.role !== requiredRole) {
    // Allow superuser to access admin routes
    const hasAccess = requiredRole === "admin" && (user?.role === "superuser" || user?.role === "admin");
    
    if (!hasAccess) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="mb-6">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 15c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl lg:text-4xl font-bold text-destructive mb-2">Access Denied</h1>
              <p className="text-muted-foreground mb-6">
                You don't have permission to access this page. {requiredRole === "admin" ? "Administrator" : "Elevated"} privileges required.
              </p>
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => setLocation("/dashboard")}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
              >
                Return to Dashboard
              </button>
              <button 
                onClick={() => setLocation("/settings")}
                className="w-full border border-border hover:bg-accent px-4 py-2 rounded-md"
              >
                Account Settings
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}