import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { SessionManager } from '@/lib/sessionManager';
import { tokenStorage } from '@/lib/auth';
import PaymentModal from '@/components/payments/PaymentModal';
import Sidebar from '@/components/layout/Sidebar';
import { 
  Check, 
  Crown, 
  TrendingUp, 
  BarChart3, 
  Settings,
  CreditCard,
  ArrowRight,
  LogOut,
  User,
  Home,
  Star,
  AlertCircle
} from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  tier: string;
  monthlyPrice: number;
  yearlyPrice: number | null;
  features: string[];
  maxSignals: number | null;
  maxTickers: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const getTierIcon = (tier: string) => {
  switch (tier) {
    case 'basic': return TrendingUp;
    case 'premium': return BarChart3;
    case 'pro': return Crown;
    case 'elite': return Crown;
    default: return TrendingUp;
  }
};

const getTierDescription = (tier: string) => {
  switch (tier) {
    case 'basic': return 'Perfect for getting started with crypto trading';
    case 'premium': return 'Advanced features for serious traders';
    case 'pro': return 'Everything you need for professional trading';
    case 'elite': return 'Ultimate trading experience with all features';
    default: return 'Enhance your trading experience';
  }
};

export default function UpgradePage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [, setLocation] = useLocation();
  const token = tokenStorage.get();

  // Fetch subscription plans from database
  const { data: plansResponse, isLoading: plansLoading, error: plansError } = useQuery({
    queryKey: ['/api/subscription-plans'],
    queryFn: () => apiRequest('/api/subscription-plans'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const subscriptionPlans: SubscriptionPlan[] = plansResponse?.plans?.map((plan: any) => ({
    id: plan.id,
    name: plan.name,
    tier: plan.tier || plan.name.toLowerCase(),
    monthlyPrice: plan.price,
    yearlyPrice: plan.yearly_price || null,
    features: plan.features || [],
    maxSignals: plan.max_signals ?? -1,
    maxTickers: plan.max_tickers ?? -1,
    isActive: plan.is_active ?? true,
  })) || [];

  // Check if any plans support yearly billing
  const hasYearlyPlans = subscriptionPlans.some(plan => plan.yearlyPrice);
  
  // Auto-switch to monthly if yearly is selected but current plans don't support yearly
  useEffect(() => {
    if (billingInterval === 'yearly' && !hasYearlyPlans) {
      setBillingInterval('monthly');
    }
  }, [billingInterval, hasYearlyPlans]);

  const handleLogout = () => {
    try {
      SessionManager.clearSession();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      setLocation('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "There was an issue logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpgrade = async (planTier: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upgrade your subscription.",
        variant: "destructive",
      });
      return;
    }

    if (user.subscriptionTier === planTier) {
      toast({
        title: "Already Subscribed",
        description: `You are already on the ${planTier} plan.`,
        variant: "default",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await apiRequest('POST', '/api/create-subscription', {
        planTier,
        billingInterval
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upgrade failed');
      }

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else if (data.success || data.message?.includes('Successfully upgraded')) {
        toast({
          title: "Upgrade Successful! 🎉",
          description: `You have been upgraded to ${planTier} plan!`,
        });
        
        // Update user session with new subscription data if provided
        if (data.user) {
          // Create updated user object with new subscription data
          const updatedUser = {
            ...user,
            subscriptionTier: data.user.subscriptionTier || planTier,
            subscriptionStatus: data.user.subscriptionStatus || 'active',
            subscriptionEndsAt: data.subscription?.endsAt
          };
          
          // Update session manager with new user data
          if (token) {
            const session = SessionManager.getSession();
            if (session) {
              SessionManager.createSession(token, updatedUser);
            }
          }
        }
        
        // Refresh user profile data to ensure UI updates immediately
        await queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
        await queryClient.refetchQueries({ queryKey: ["/api/user/profile"] });
        
        // Small delay to show success message then redirect
        setTimeout(() => {
          setLocation('/dashboard');
        }, 1500);
      } else {
        throw new Error(data.message || 'Unknown error occurred');
      }
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast({
        title: "Upgrade Failed",
        description: error.message || "Failed to process upgrade. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const getYearlySavings = (monthlyPrice: number, yearlyPrice: number) => {
    const yearlyCost = monthlyPrice * 12;
    const savings = yearlyCost - yearlyPrice;
    return Math.round((savings / yearlyCost) * 100);
  };

  if (isLoading || plansLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground">Please log in to manage your subscription.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Handle plans loading error
  if (plansError) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Unable to Load Plans</h3>
                <p className="text-muted-foreground mb-4">We're having trouble loading subscription plans. Please try again.</p>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Filter active plans only
  const activePlans = subscriptionPlans.filter(plan => plan.isActive);

  // If no active plans available
  if (activePlans.length === 0) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Plans Available</h3>
                <p className="text-muted-foreground">There are currently no subscription plans available.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        {/* Top Header with Logout */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/dashboard')}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Star className="h-3 w-3" />
                {user?.subscriptionTier || 'Free'} Plan
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={''} alt={user?.email} />
                      <AvatarFallback>
                        {user?.email?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user?.email && (
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation('/dashboard')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation('/subscription')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Subscription</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 sm:mb-4">
                Upgrade Your Trading Experience
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto px-2">
                Choose the perfect plan to unlock advanced trading features and maximize your profits
              </p>
              
              {/* Current Plan Badge */}
              <div className="mt-6">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  Current Plan: {user.subscriptionTier?.charAt(0).toUpperCase() + user.subscriptionTier?.slice(1) || 'Free'}
                </Badge>
              </div>
            </div>

          {/* Billing Toggle - Only show if there are yearly plans */}
          {hasYearlyPlans && (
            <div className="flex justify-center mb-8">
              <div className="bg-muted p-1 rounded-lg">
                <button
                  onClick={() => setBillingInterval('monthly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    billingInterval === 'monthly'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingInterval('yearly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    billingInterval === 'yearly'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Yearly (Save up to 33%)
                </button>
              </div>
            </div>
          )}

          {/* Subscription Plans */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {activePlans.map((plan, index) => {
              const Icon = getTierIcon(plan.tier);
              const hasYearlyPrice = plan.yearlyPrice && plan.yearlyPrice > 0;
              const showYearlyPrice = billingInterval === 'yearly' && hasYearlyPrice;
              const price = showYearlyPrice ? plan.yearlyPrice! : plan.monthlyPrice;
              const isCurrentPlan = user.subscriptionTier === plan.tier;
              const savings = showYearlyPrice ? getYearlySavings(plan.monthlyPrice, plan.yearlyPrice!) : 0;
              const isPopular = plan.tier === 'premium'; // Mark premium as popular
              const description = getTierDescription(plan.tier);

              return (
                <Card 
                  key={plan.id} 
                  className={`relative transition-all ${isPopular ? 'ring-2 ring-primary' : ''} ${
                    isCurrentPlan ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-lg' : 'hover:shadow-md'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className={`text-center pb-4 ${isCurrentPlan ? 'text-green-800 dark:text-green-100' : ''}`}>
                    <div className={`mx-auto mb-2 p-2 rounded-lg w-fit ${
                      isCurrentPlan ? 'bg-green-100 dark:bg-green-800' : 'bg-muted'
                    }`}>
                      <Icon className={`h-6 w-6 ${isCurrentPlan ? 'text-green-700 dark:text-green-200' : ''}`} />
                    </div>
                    <CardTitle className={`text-xl ${isCurrentPlan ? 'text-green-800 dark:text-green-100' : ''}`}>
                      {plan.name}
                    </CardTitle>
                    <p className={`text-sm ${
                      isCurrentPlan ? 'text-green-700 dark:text-green-200' : 'text-muted-foreground'
                    }`}>
                      {description}
                    </p>
                    
                    <div className="mt-4">
                      <div className={`text-3xl font-bold ${
                        isCurrentPlan ? 'text-green-800 dark:text-green-100' : ''
                      }`}>
                        ${formatPrice(price)}
                        <span className={`text-sm font-normal ${
                          isCurrentPlan ? 'text-green-700 dark:text-green-200' : 'text-muted-foreground'
                        }`}>
                          /{showYearlyPrice ? 'year' : 'month'}
                        </span>
                      </div>
                      {showYearlyPrice && savings > 0 && (
                        <p className={`text-sm mt-1 ${
                          isCurrentPlan ? 'text-green-700 dark:text-green-200' : 'text-green-600 dark:text-green-400'
                        }`}>
                          Save {savings}% annually
                        </p>
                      )}
                      {billingInterval === 'yearly' && !hasYearlyPrice && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Monthly billing only
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className={`h-4 w-4 mt-0.5 mr-2 flex-shrink-0 ${
                            isCurrentPlan ? 'text-green-700 dark:text-green-300' : 'text-green-500'
                          }`} />
                          <span className={`text-sm ${
                            isCurrentPlan ? 'text-green-800 dark:text-green-100' : ''
                          }`}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {isCurrentPlan ? (
                      <Button
                        disabled
                        className="w-full"
                        variant="outline"
                      >
                        Current Plan
                      </Button>
                    ) : (
                      <PaymentModal
                        planName={plan.name}
                        planTier={plan.tier}
                        monthlyPrice={plan.monthlyPrice}
                        yearlyPrice={plan.yearlyPrice || 0} // Use actual yearly price or 0 if not available
                        billingInterval={hasYearlyPrice ? billingInterval : 'monthly'} // Force monthly if no yearly price
                        onSuccess={async () => {
                          toast({
                            title: "Upgrade Successful!",
                            description: `You have been upgraded to ${plan.name}!`,
                          });
                          
                          // Refresh user profile data to ensure UI updates immediately
                          await queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
                          await queryClient.refetchQueries({ queryKey: ["/api/user/profile"] });
                          
                          // Redirect to dashboard after a short delay
                          setTimeout(() => {
                            setLocation('/dashboard');
                          }, 1500);
                        }}
                      >
                        <Button
                          className="w-full"
                          disabled={isProcessing}
                        >
                          <div className="flex items-center">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Upgrade Now
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </div>
                        </Button>
                      </PaymentModal>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-4">
                  <Settings className="h-6 w-6 text-muted-foreground mr-2" />
                  <h3 className="text-lg font-semibold">Flexible Billing</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  All plans include a 14-day money-back guarantee. You can cancel or change your plan at any time.
                </p>
                <div className="flex justify-center space-x-6 text-sm text-muted-foreground">
                  <span>• Secure payment processing</span>
                  <span>• No hidden fees</span>
                  <span>• Instant activation</span>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}