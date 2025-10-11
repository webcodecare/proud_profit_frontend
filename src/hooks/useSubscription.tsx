import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useAuth } from "./useAuth";
import { API_CONFIG } from "../config/api";

export interface UserSubscription {
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
}

export function useUserSubscriptionData() {
  const { user } = useAuth();

  return useQuery<UserSubscription | null>({
    queryKey: ["user-subscription", user?.id],
    queryFn: async () => {
      console.log("useUserSubscriptionData - queryFn called, user:", user);

      if (!user) {
        console.log("useUserSubscriptionData - no user, returning null");
        return null;
      }

      try {
        console.log(
          "useUserSubscriptionData - making API request to:",
          API_CONFIG.ENDPOINTS.USER_SUBSCRIPTIONS
        );
        const response = await apiRequest(
          API_CONFIG.ENDPOINTS.USER_SUBSCRIPTIONS
        );

        console.log("useUserSubscriptionData - API response:", response);

        // Handle both formats: direct subscription object and nested response
        if (response.subscription) {
          console.log(
            "useUserSubscriptionData - found nested subscription:",
            response.subscription
          );
          return response.subscription;
        }

        // Fallback: handle array response format
        if (Array.isArray(response) && response.length > 0) {
          const activeSubscription =
            response.find((sub: UserSubscription) => sub.status === "active") ||
            response[0];
          console.log(
            "useUserSubscriptionData - found array subscription:",
            activeSubscription
          );
          return activeSubscription;
        }

        console.log(
          "useUserSubscriptionData - no subscription found, returning null"
        );
        return null;
      } catch (error) {
        console.error(
          "useUserSubscriptionData - Failed to fetch user subscription:",
          error
        );
        return null;
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook to check if user has active subscription
export function useHasActiveSubscription() {
  const { data: subscription, isLoading } = useUserSubscriptionData();

  const hasActiveSubscription =
    subscription && subscription.status === "active";

  return {
    hasActiveSubscription: !!hasActiveSubscription,
    subscription,
    isLoading,
  };
}
