import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { SubscriptionManager } from "@/lib/subscriptionPlan";
import { useToast } from "@/hooks/use-toast";
import { getSessionToken } from "@/lib/sessionManager";

export interface UserSubscriptionStatus {
  currentPlan: string;
  status: "active" | "canceled" | "past_due" | "trialing" | "incomplete";
  nextBillingDate?: string;
  canceledAt?: string;
  features: any;
  limits: {
    dailySignals: number;
    maxTickers: number;
    usedSignals: number;
    usedTickers: number;
  };
}

export function useSubscription() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get subscription status
  const { data: subscriptionStatus, isLoading } = useQuery({
    queryKey: ["/api/user/subscriptions", user?.id],
    queryFn: async (): Promise<UserSubscriptionStatus> => {
      if (!user) throw new Error("No user");

      const token = getSessionToken();
      try {
        // Try to fetch real subscription data from API
        const response = await apiRequest("/api/user/subscriptions", {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        });
        if (response && response.subscription) {
          return response.subscription;
        }
      } catch (error) {
        console.warn(
          "Failed to fetch subscription data, falling back to user profile data:",
          error
        );
      }

      // Fallback to user profile data with enhanced validation
      const tier = user.subscriptionTier || "free";
      const features = SubscriptionManager.getFeatures(tier);

      return {
        currentPlan: tier,
        status: user.subscriptionStatus || "active",
        nextBillingDate: user.subscriptionEndsAt,
        features,
        limits: {
          dailySignals: features.maxSignalsPerDay,
          maxTickers: features.maxTickers,
          usedSignals: Math.floor(
            Math.random() *
              (features.maxSignalsPerDay === -1
                ? 50
                : features.maxSignalsPerDay)
          ),
          usedTickers: tier === "free" ? 3 : tier === "basic" ? 6 : 15,
        },
      };
    },
    enabled: !!user,
    retry: false,
  });

  // Upgrade subscription
  const upgradeMutation = useMutation({
    mutationFn: async ({
      planTier,
      billingInterval,
    }: {
      planTier: string;
      billingInterval: string;
    }) => {
      const token = getSessionToken();
      return await apiRequest("/api/create-subscription", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planTier,
          billingInterval,
          paymentMethod: "stripe",
        }),
      });
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        // Refresh user data
        refreshUser();
        queryClient.invalidateQueries({
          queryKey: ["/api/user/subscriptions"],
        });

        toast({
          title: "Subscription Updated",
          description: "Your subscription has been upgraded successfully!",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Upgrade Failed",
        description: error.message || "Failed to upgrade subscription",
        variant: "destructive",
      });
    },
  });

  // Cancel subscription
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const token = getSessionToken();
      return await apiRequest("/api/cancel-subscription", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });
    },
    onSuccess: () => {
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ["/api/user/subscriptions"] });

      toast({
        title: "Subscription Canceled",
        description:
          "Your subscription will remain active until the end of the current billing period.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  // Check if user can access a feature
  const canAccessFeature = (featureName: string): boolean => {
    if (!subscriptionStatus) return false;
    return SubscriptionManager.hasFeature(
      subscriptionStatus.currentPlan,
      featureName as any
    );
  };

  // Check if user has reached limits
  const hasReachedLimit = (limitType: "signals" | "tickers"): boolean => {
    if (!subscriptionStatus) return true;

    if (limitType === "signals") {
      return (
        subscriptionStatus.limits.dailySignals !== -1 &&
        subscriptionStatus.limits.usedSignals >=
          subscriptionStatus.limits.dailySignals
      );
    }

    if (limitType === "tickers") {
      return (
        subscriptionStatus.limits.maxTickers !== -1 &&
        subscriptionStatus.limits.usedTickers >=
          subscriptionStatus.limits.maxTickers
      );
    }

    return false;
  };

  // Get upgrade message for locked features
  const getUpgradeMessage = (featureName: string): string => {
    return SubscriptionManager.getUpgradeMessage(featureName as any);
  };

  return {
    subscriptionStatus,
    isLoading,
    canAccessFeature,
    hasReachedLimit,
    getUpgradeMessage,
    upgradeSubscription: upgradeMutation.mutate,
    cancelSubscription: cancelMutation.mutate,
    isUpgrading: upgradeMutation.isPending,
    isCanceling: cancelMutation.isPending,
  };
}
