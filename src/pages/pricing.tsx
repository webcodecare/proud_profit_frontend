import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, X, AlertCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";

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

const getTierDescription = (tier: string) => {
  switch (tier) {
    case 'basic': return 'Perfect for getting started with crypto trading';
    case 'premium': return 'Advanced features for serious traders';
    case 'pro': return 'Everything you need for professional trading';
    case 'elite': return 'Complete solution for professional traders';
    default: return 'Enhance your trading experience';
  }
};

const getTierCTA = (tier: string) => {
  switch (tier) {
    case 'basic': return 'Get Started';
    case 'premium': return 'Go Premium';
    case 'pro': return 'Go Pro';
    case 'elite': return 'Go Elite';
    default: return 'Choose Plan';
  }
};


export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch subscription plans from database
  const { data: subscriptionPlans = [], isLoading: plansLoading, error: plansError } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription-plans'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Check if any plans support yearly billing
  const hasYearlyPlans = subscriptionPlans.some(plan => plan.yearlyPrice);
  
  // Auto-switch to monthly if yearly is selected but current plans don't support yearly
  useEffect(() => {
    if (isAnnual && !hasYearlyPlans) {
      setIsAnnual(false);
    }
  }, [isAnnual, hasYearlyPlans]);

  const handleStripeCheckout = async (plan: SubscriptionPlan) => {
    try {
      setLoading(plan.id);
      const hasYearlyPrice = plan.yearlyPrice && plan.yearlyPrice > 0;
      const billingInterval = hasYearlyPrice && isAnnual ? "yearly" : "monthly";
      
      const response = await apiRequest("POST", "/api/create-subscription", {
        planTier: plan.tier,
        billingInterval
      });

      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error('Stripe checkout error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to start payment process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handlePayPalCheckout = async (plan: SubscriptionPlan) => {
    try {
      setLoading(`${plan.id}-paypal`);
      const hasYearlyPrice = plan.yearlyPrice && plan.yearlyPrice > 0;
      const showYearlyPrice = isAnnual && hasYearlyPrice;
      const amount = showYearlyPrice ? plan.yearlyPrice! / 100 : plan.monthlyPrice / 100; // Convert cents to dollars
      const billingInterval = showYearlyPrice ? 'yearly' : 'monthly';
      
      // For PayPal, we'll redirect to a checkout page with PayPal integration
      const paypalUrl = `/checkout-paypal?plan=${plan.tier}&amount=${amount}&billing=${billingInterval}`;
      window.location.href = paypalUrl;
    } catch (error) {
      console.error('PayPal checkout error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to start PayPal checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const getSavingsPercentage = (monthly: number, yearly: number) => {
    return Math.round(((monthly * 12 - yearly) / (monthly * 12)) * 100);
  };

  const formatPrice = (cents: number | undefined | null) => {
    if (!cents || cents === 0 || isNaN(cents)) {
      return "0"; // Return "0" instead of "NaN" for invalid/missing prices
    }
    return (cents / 100).toFixed(0); // Show whole dollars for pricing page
  };

  // Filter active plans only
  const activePlans = subscriptionPlans.filter(plan => plan.isActive);

  if (plansLoading) {
    return (
      <div className="min-h-screen bg-slate-900 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Handle plans loading error
  if (plansError) {
    return (
      <div className="min-h-screen bg-slate-900 dark:bg-slate-950">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md bg-slate-800 border-slate-600">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">Unable to Load Plans</h3>
                <p className="text-slate-300 mb-4">We're having trouble loading subscription plans. Please try again.</p>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // If no active plans available
  if (activePlans.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 dark:bg-slate-950">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md bg-slate-800 border-slate-600">
            <CardContent className="pt-6">
              <div className="text-center">
                <Settings className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">No Plans Available</h3>
                <p className="text-slate-300">There are currently no subscription plans available.</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-slate-950">
      <Navigation />
      <div className="py-20">
        <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            Choose Your Trading Plan
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Unlock powerful crypto trading insights with our comprehensive analytics platform
          </p>
          
          {/* Billing Toggle - Only show if there are yearly plans */}
          {hasYearlyPlans && (
            <div className="flex items-center justify-center gap-4 mb-12">
              <span className={`text-sm font-medium ${!isAnnual ? 'text-orange-400' : 'text-slate-400'}`}>
                Monthly
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                  isAnnual ? 'bg-orange-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAnnual ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${isAnnual ? 'text-orange-400' : 'text-slate-400'}`}>
                Annual
              </span>
              {isAnnual && (
                <Badge variant="secondary" className="ml-2">Save up to 20%</Badge>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {activePlans.map((plan, index) => {
            const hasYearlyPrice = plan.yearlyPrice && plan.yearlyPrice > 0;
            const showYearlyPrice = isAnnual && hasYearlyPrice;
            const price = showYearlyPrice ? plan.yearlyPrice! : plan.monthlyPrice;
            const isPopular = plan.tier === 'premium'; // Mark premium as popular
            const description = getTierDescription(plan.tier);
            const ctaText = getTierCTA(plan.tier);
            
            return (
              <Card 
                key={plan.id}
                className={`relative transition-all duration-300 hover:scale-105 bg-slate-800/60 border-slate-600/40 ${
                  isPopular 
                    ? 'border-2 border-orange-500/60 shadow-2xl ring-2 ring-orange-500 ring-opacity-50' 
                    : 'hover:shadow-xl hover:border-slate-500/60'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-orange-500 text-white px-4 py-1">Most Popular</Badge>
                  </div>
                )}
              
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-extrabold text-white">
                        ${formatPrice(price)}
                      </span>
                      <span className="text-slate-400 ml-1">
                        /{showYearlyPrice ? 'year' : 'month'}
                      </span>
                    </div>
                    {showYearlyPrice && (
                      <div className="text-sm text-green-600 font-medium mt-2">
                        Save {getSavingsPercentage(plan.monthlyPrice, plan.yearlyPrice!)}% annually
                      </div>
                    )}
                    {isAnnual && !hasYearlyPrice && (
                      <p className="text-xs text-slate-400 mt-1">
                        Monthly billing only
                      </p>
                    )}
                  </div>
                  <p className="text-slate-300 mt-4">
                    {description}
                  </p>
                </CardHeader>

                <CardContent className="pb-6">
                  <ul className="space-y-3">
                    {(Array.isArray(plan.features) ? plan.features : []).map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-200">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-6 flex flex-col gap-3">
                  <Button
                    className={`w-full ${
                      isPopular 
                        ? 'bg-orange-500 hover:bg-orange-600' 
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                    onClick={() => handleStripeCheckout(plan)}
                    disabled={loading === plan.id}
                  >
                    {loading === plan.id ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      ctaText + ' - Stripe'
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handlePayPalCheckout(plan)}
                    disabled={loading === `${plan.id}-paypal`}
                  >
                    {loading === `${plan.id}-paypal` ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      'Pay with PayPal'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">Frequently Asked Questions</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-white">Can I change plans anytime?</h3>
              <p className="text-slate-300">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-white">Do you offer refunds?</h3>
              <p className="text-slate-300">
                We offer a 30-day money-back guarantee on all plans. No questions asked.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-white">Is my data secure?</h3>
              <p className="text-slate-300">
                Absolutely. We use enterprise-grade security and never share your trading data.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-white">What payment methods do you accept?</h3>
              <p className="text-slate-300">
                We accept all major credit cards through Stripe and PayPal payments.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <p className="text-sm text-slate-400 mb-4">Trusted by traders worldwide</p>
          <div className="flex justify-center items-center gap-8 opacity-60">
            <div className="text-xs">🔒 SSL Secured</div>
            <div className="text-xs">💳 Stripe Certified</div>
            <div className="text-xs">🛡️ SOC 2 Compliant</div>
            <div className="text-xs">📱 Mobile Ready</div>
          </div>
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}