import { useEffect } from "react";
import { TokenManager } from "@/lib/tokenManager";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

/**
 * Hook to monitor token expiry and handle automatic refresh
 */
export function useTokenMonitor() {
  const { toast } = useToast();
  const { logout } = useAuth();

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkTokenExpiry = async () => {
      try {
        const currentToken = await TokenManager.getValidToken();

        // If no token, skip check
        if (!currentToken) return;

        // Check if token is close to expiry (within 10 minutes)
        const isExpiringSoon = TokenManager.isTokenExpired(currentToken);

        if (isExpiringSoon) {
          console.log("🔄 Token expiring soon, attempting refresh...");

          const refreshResult = await TokenManager.refreshToken();

          if (refreshResult.success) {
            console.log("✅ Token refreshed successfully");
            toast({
              title: "Session Refreshed",
              description: "Your session has been automatically renewed",
            });
          } else {
            console.error("❌ Token refresh failed:", refreshResult.error);

            // Only show error if we have no refresh token available
            if (!TokenManager.hasRefreshToken()) {
              toast({
                title: "Session Expired",
                description: "Please login again to continue",
                variant: "destructive",
              });
              logout();
            }
          }
        }
      } catch (error) {
        console.error("Token monitoring error:", error);
      }
    };

    // Check token expiry every 5 minutes
    intervalId = setInterval(checkTokenExpiry, 5 * 60 * 1000);

    // Cleanup interval on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [toast, logout]);
}
