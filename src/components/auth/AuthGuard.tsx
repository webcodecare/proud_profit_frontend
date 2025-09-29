import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, startTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "elite" | "user";
  allowedRoles?: Array<"admin" | "elite" | "user">;
  exactRole?: boolean; // For strict role matching
}

export default function AuthGuard({ children, requiredRole, allowedRoles, exactRole = false }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user, databaseUser } = useAuth();
  const [, setLocation] = useLocation();
  
  // Debug authentication state
  console.log("🛡️ AuthGuard:", { 
    isAuthenticated, 
    isLoading, 
    hasUser: !!user, 
    userEmail: user?.email,
    requiredRole,
    allowedRoles,
    path: window.location.pathname
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      startTransition(() => {
        // Store the attempted URL for post-login redirect
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/auth' && currentPath !== '/') {
          sessionStorage.setItem('redirectAfterLogin', currentPath);
        }
        setLocation("/auth");
      });
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // For now, we'll comment out the subscription redirect logic since we're using Supabase auth
  // This can be re-implemented later when subscription management is set up with Supabase
  /*
  useEffect(() => {
    // Subscription redirect logic will be implemented later with Supabase user metadata
  }, [isAuthenticated, isLoading, user, setLocation]);
  */

  // Show loading state while authentication is being checked
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

  // If not authenticated, don't render anything (redirect will happen in useEffect)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  // Secure role checking for Supabase auth - check both metadata and database
  if (requiredRole || allowedRoles) {
    let hasAccess = false;
    
    // Get role from user metadata OR database user data
    const userRole = user?.user_metadata?.role || databaseUser?.role || 'user';
    
    if (allowedRoles) {
      hasAccess = allowedRoles.includes(userRole as any);
    } else if (requiredRole) {
      if (exactRole) {
        hasAccess = userRole === requiredRole;
      } else {
        // Role hierarchy: admin > elite > user
        if (requiredRole === 'user') {
          hasAccess = ['admin', 'elite', 'user'].includes(userRole);
        } else if (requiredRole === 'elite') {
          hasAccess = ['admin', 'elite'].includes(userRole);
        } else if (requiredRole === 'admin') {
          hasAccess = userRole === 'admin';
        }
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
              <h1 className="text-2xl lg:text-4xl font-bold text-destructive mb-2">Access Denied</h1>
              <p className="text-muted-foreground mb-6">
                {allowedRoles ? 
                  `This page is restricted to ${allowedRoles.join(', ')} roles only.` : 
                  exactRole ? 
                    `This page requires exactly ${requiredRole} role.` :
                    `You don't have permission to access this page. ${requiredRole === "admin" ? "Administrator" : "Elevated"} privileges required.`
                }
              </p>
            </div>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href={userRole === 'admin' ? '/admin' : '/dashboard'}>
                  Return to {userRole === 'admin' ? 'Admin Panel' : 'Dashboard'}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
