import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { SubscriptionManager } from "@/lib/subscriptionPlan";
import { useToast } from "@/hooks/use-toast";

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
    queryKey: ["/api/user/subscription", user?.id],
    queryFn: async (): Promise<UserSubscriptionStatus> => {
      if (!user) throw new Error("No user");
      
      // For now, return mock data based on user's subscription tier
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
          usedSignals: Math.floor(Math.random() * (features.maxSignalsPerDay === -1 ? 50 : features.maxSignalsPerDay)),
          usedTickers: tier === "free" ? 3 : tier === "basic" ? 6 : 15,
        }
      };
    },
    enabled: !!user,
    retry: false,
  });

  // Upgrade subscription
  const upgradeMutation = useMutation({
    mutationFn: async ({ planTier, billingInterval }: { planTier: string; billingInterval: string }) => {
      const response = await apiRequest("POST", "/api/create-subscription", {
        planTier,
        billingInterval,
        paymentMethod: "stripe"
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        // Refresh user data
        refreshUser();
        queryClient.invalidateQueries({ queryKey: ["/api/user/subscription"] });
        
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
      const response = await apiRequest("POST", "/api/cancel-subscription", {});
      return await response.json();
    },
    onSuccess: () => {
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ["/api/user/subscription"] });
      
      toast({
        title: "Subscription Canceled",
        description: "Your subscription will remain active until the end of the current billing period.",
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
    return SubscriptionManager.hasFeature(subscriptionStatus.currentPlan, featureName as any);
  };

  // Check if user has reached limits
  const hasReachedLimit = (limitType: 'signals' | 'tickers'): boolean => {
    if (!subscriptionStatus) return true;
    
    if (limitType === 'signals') {
      return subscriptionStatus.limits.dailySignals !== -1 && 
             subscriptionStatus.limits.usedSignals >= subscriptionStatus.limits.dailySignals;
    }
    
    if (limitType === 'tickers') {
      return subscriptionStatus.limits.maxTickers !== -1 && 
             subscriptionStatus.limits.usedTickers >= subscriptionStatus.limits.maxTickers;
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