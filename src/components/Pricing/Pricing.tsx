import React, { useState, useCallback } from 'react';
import { buildApiUrl } from '@/config/api';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Check, Crown, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import PaymentModal from '@/components/payments/PaymentModal';

interface SubscriptionPlan {
  id: string;
  name: string;
  tier: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  features: string[];
  maxSignals: number;
  maxTickers: number;
  isActive: boolean;
}

const getPlanIcon = (tier: string) => {
  switch (tier) {
    case 'basic': return Star;
    case 'premium': return Zap;
    case 'pro': return Crown;
    default: return Crown;
  }
};

const getPlanColor = (tier: string) => {
  switch (tier) {
    case 'basic': return 'blue';
    case 'premium': return 'orange';
    case 'pro': return 'gold';
    default: return 'gold';
  }
};

function Pricing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  // Fetch subscription plans from API
  const { data: plansResponse, isLoading: isLoadingPlans, error: plansError } = useQuery({
    queryKey: ['/api/subscription-plans'],
    queryFn: async () => {
      const url = buildApiUrl('/api/subscription-plans');
      console.log('Fetching subscription plans from:', url);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch subscription plans');
      return response.json();
    }
  });

  // Map backend response to frontend format
  const subscriptionPlans = plansResponse?.plans?.map((plan: any) => ({
    id: plan.id,
    name: plan.name,
    tier: plan.name.toLowerCase(), // Use name as tier if tier is not provided
    monthlyPrice: plan.price,
    yearlyPrice: plan.price * 10, // Default yearly price if not provided
    features: plan.features || [],
    maxSignals: -1, // Unlimited if not specified
    maxTickers: -1, // Unlimited if not specified
    isActive: plan.is_active
  })) || [];


  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const getYearlySavings = (monthlyPrice: number, yearlyPrice: number) => {
    const yearlyCost = monthlyPrice * 12;
    const savings = yearlyCost - yearlyPrice;
    return Math.round((savings / yearlyCost) * 100);
  };

  // Handle loading and error states
  if (isLoadingPlans) {
    return (
      <section id="pricing" className="py-20 bg-slate-900 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Subscription Plans</h2>
            <p className="text-xl text-white/80">Choose the perfect plan for your trading needs</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-center">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-800/60 rounded-2xl p-8 border border-slate-600/40">
                <Skeleton className="h-8 w-32 mb-4" />
                <Skeleton className="h-12 w-24 mb-2" />
                <Skeleton className="h-4 w-full mb-6" />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
                <Skeleton className="h-10 w-full mt-8" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (plansError) {
    return (
      <section id="pricing" className="py-20 bg-slate-900 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Subscription Plans</h2>
            <p className="text-xl text-red-400">Failed to load subscription plans. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  const activePlans = subscriptionPlans?.filter(plan => plan.isActive) || [];

  return (
    <section id="pricing" className="py-20 bg-slate-900 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Subscription Plans</h2>
          <p className="text-xl text-white/80">Choose the perfect plan for your trading needs</p>
          
          {/* Billing Toggle */}
          <div className="flex justify-center mt-8">
            <div className="bg-slate-800/60 p-1 rounded-lg border border-slate-600/40">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingInterval === 'monthly'
                    ? 'bg-white text-gray-900'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingInterval === 'yearly'
                    ? 'bg-white text-gray-900'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Yearly (Save up to 20%)
              </button>
            </div>
          </div>
        </div>
        
        <div className={`grid gap-8 mx-auto ${
          activePlans.length === 1 
            ? 'grid-cols-1 max-w-md justify-items-center' 
            : activePlans.length === 2 
            ? 'grid-cols-1 md:grid-cols-2 max-w-4xl justify-center' 
            : 'grid-cols-1 md:grid-cols-3 justify-center max-w-6xl'
        }`}>
          {activePlans.map((plan, index) => {
            const Icon = getPlanIcon(plan.tier);
            const color = getPlanColor(plan.tier);
            const price = billingInterval === 'yearly' && plan.yearlyPrice ? plan.yearlyPrice : plan.monthlyPrice;
            const isCurrentPlan = user?.subscriptionTier === plan.tier;
            const savings = billingInterval === 'yearly' && plan.yearlyPrice ? getYearlySavings(plan.monthlyPrice, plan.yearlyPrice) : 0;
            const popular = plan.tier === 'premium'; // Mark premium as popular

            return (
              <div 
                key={plan.id} 
                className={`bg-gradient-to-br backdrop-blur-sm rounded-2xl p-8 border relative ${
                  popular 
                    ? 'from-slate-800/60 to-slate-700/50 border-2 border-orange-500/60' 
                    : color === 'gold'
                    ? 'from-slate-800/40 to-slate-700/60 border border-yellow-500/40'
                    : color === 'orange'
                    ? 'from-slate-800/50 to-slate-700/60 border border-orange-500/40'
                    : 'from-slate-800/50 to-slate-700/60 border border-blue-500/40'
                } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
              >
                {popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                
                <div className="flex items-center mb-4">
                  <Icon className={`w-8 h-8 mr-3 ${
                    color === 'orange' ? 'text-orange-400' :
                    color === 'gold' ? 'text-yellow-400' :
                    color === 'blue' ? 'text-blue-400' :
                    'text-slate-400'
                  }`} />
                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                  {isCurrentPlan && (
                    <Badge className="ml-2 bg-green-500 text-white">Current</Badge>
                  )}
                </div>
                
                <div className={`text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent mb-2 ${
                  color === 'orange' ? 'from-orange-400 to-orange-500' :
                  color === 'gold' ? 'from-yellow-400 to-yellow-500' :
                  color === 'blue' ? 'from-blue-400 to-blue-500' :
                  'from-slate-400 to-blue-400'
                }`}>
                  ${formatPrice(price)}
                  <span className="text-lg text-white/60">/{billingInterval === 'yearly' ? 'year' : 'month'}</span>
                </div>
                
                {billingInterval === 'yearly' && savings > 0 && (
                  <p className="text-sm text-green-400 mb-6">
                    Save {savings}% annually
                  </p>
                )}
                
                <div className="text-white/80 mb-6">
                  <p className="mb-2">Max {plan.maxSignals === -1 ? 'Unlimited' : plan.maxSignals} signals per month</p>
                  <p>Track {plan.maxTickers === -1 ? 'unlimited' : plan.maxTickers} tickers</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-white/80">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                {isCurrentPlan ? (
                  <Button disabled className="w-full" variant="outline">
                    Current Plan
                  </Button>
                ) : (
                  <>
                    {!user ? (
                      <button 
                        type="button"
                        onClick={() => {
                          toast({
                            title: "Login Required",
                            description: "Please login to purchase a subscription",
                            variant: "default",
                          });
                          setTimeout(() => setLocation('/auth'), 500);
                        }}
                        className={`w-full py-3 rounded-full font-semibold transition-all ${
                          plan.color === 'orange' 
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700' :
                          plan.color === 'gold'
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700' :
                            'bg-gradient-to-r from-slate-500 to-blue-500 hover:from-blue-600 hover:to-cyan-600'
                        } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        Login to Subscribe
                      </button>
                    ) : (
                      <PaymentModal
                        planName={plan.name}
                        planTier={plan.tier}
                        monthlyPrice={plan.monthlyPrice}
                        yearlyPrice={plan.yearlyPrice || plan.monthlyPrice * 10}
                        billingInterval={billingInterval}
                        onSuccess={() => {
                          toast({
                            title: "Subscription Successful!",
                            description: `Welcome to ${plan.name}!`,
                          });
                          setTimeout(() => setLocation('/dashboard'), 1500);
                        }}
                      >
                        <button 
                          type="button"
                          className={`w-full py-3 rounded-full font-semibold transition-all ${
                            color === 'orange' 
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700' :
                            color === 'gold'
                              ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700' :
                            color === 'blue'
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' :
                              'bg-gradient-to-r from-slate-500 to-blue-500 hover:from-blue-600 hover:to-cyan-600'
                          } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          Upgrade to {plan.name}
                        </button>
                      </PaymentModal>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="max-w-2xl mx-auto bg-slate-800/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-600/40">
            <h3 className="text-xl font-semibold text-white mb-4">Flexible Billing & Guarantees</h3>
            <p className="text-white/80 mb-6">
              All plans include a 14-day money-back guarantee. Cancel or change your plan at any time.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-white/70">
              <span className="flex items-center">
                <Check className="w-4 h-4 text-green-400 mr-2" />
                Secure payment processing
              </span>
              <span className="flex items-center">
                <Check className="w-4 h-4 text-green-400 mr-2" />
                No hidden fees
              </span>
              <span className="flex items-center">
                <Check className="w-4 h-4 text-green-400 mr-2" />
                Instant activation
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Pricing