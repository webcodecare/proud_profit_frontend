import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useAuth } from "./useAuth";

export interface UserSubscriptionDetails {
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

export function useUserSubscriptionDetails() {
  const { user } = useAuth();

  return useQuery<UserSubscriptionDetails | null>({
    queryKey: ["user-subscription-details", user?.id],
    queryFn: async () => {
      if (!user) return null;

      try {
        const response = await apiRequest("/api/user/subscriptions");

        // The API returns an array, we want the first active subscription
        if (Array.isArray(response) && response.length > 0) {
          return (
            response.find(
              (sub: UserSubscriptionDetails) => sub.status === "active"
            ) || response[0]
          );
        }

        return null;
      } catch (error) {
        console.error("Failed to fetch user subscription details:", error);
        return null;
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
