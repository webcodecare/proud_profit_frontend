import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import PayPalButton from "@/components/payments/PayPalButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, CreditCard, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";

interface PlanDetails {
  name: string;
  price: number;
  features: string[];
  tier: 'basic' | 'pro' | 'elite';
}

const planDetails: Record<string, PlanDetails> = {
  basic: {
    name: 'Basic Plan',
    price: 49,
    features: [
      'Real-time price data',
      'Basic trading signals',
      'Email notifications',
      'Up to 3 watchlist items',
      'Mobile app access'
    ],
    tier: 'basic'
  },
  pro: {
    name: 'Pro Plan',
    price: 99,
    features: [
      'Everything in Basic',
      'Advanced trading signals',
      'SMS & Email notifications',
      'Up to 10 watchlist items',
      'Advanced analytics dashboard',
      'Technical indicators'
    ],
    tier: 'pro'
  },
  elite: {
    name: 'Elite Plan',
    price: 199,
    features: [
      'Everything in Pro',
      'Unlimited watchlist items',
      'Custom trading indicators',
      'Telegram notifications',
      'Advanced cycle forecasting',
      '200-week heatmap analysis'
    ],
    tier: 'elite'
  }
};

export default function CheckoutPayPal() {
  const [, setLocation] = useLocation();
  const [planData, setPlanData] = useState<{
    plan: string;
    amount: string;
    billing: string;
  } | null>(null);

  useEffect(() => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get('plan');
    const amount = urlParams.get('amount');
    const billing = urlParams.get('billing');

    if (plan && amount && billing) {
      setPlanData({ plan, amount, billing });
    } else {
      // Redirect to pricing page if parameters are missing
      setLocation('/pricing');
    }
  }, [setLocation]);

  if (!planData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const selectedPlan = planDetails[planData.plan];
  if (!selectedPlan) {
    setLocation('/pricing');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/pricing')}
            className="mb-4 text-gray-300 hover:text-white hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pricing
          </Button>
          
          <h1 className="text-3xl font-bold mb-2 text-white">Complete Your Purchase</h1>
          <p className="text-gray-300">
            Secure checkout powered by PayPal
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5 text-green-500" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-white">{selectedPlan.name}</h3>
                  <Badge variant="secondary" className="mt-1 bg-slate-700 text-gray-300">
                    {planData.billing === 'yearly' ? 'Annual Billing' : 'Monthly Billing'}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">${planData.amount}</div>
                  <div className="text-sm text-gray-400">
                    /{planData.billing === 'yearly' ? 'year' : 'month'}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-600 pt-4">
                <h4 className="font-medium mb-3 text-white">What you get:</h4>
                <ul className="space-y-2">
                  {selectedPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-300">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {planData.billing === 'yearly' && (
                <div className="bg-green-900/20 border border-green-800 p-4 rounded-lg">
                  <div className="flex items-center text-green-300">
                    <Badge className="bg-green-500 text-white mr-2">
                      Save 20%
                    </Badge>
                    <span className="text-sm font-medium">
                      You're saving ${(selectedPlan.price * 12) - parseInt(planData.amount)} annually
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CreditCard className="h-5 w-5 text-blue-500" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-gray-300 mb-4">
                    Pay securely with PayPal. You can use your PayPal account or pay with a credit/debit card.
                  </p>
                </div>

                {/* PayPal Button Container */}
                <div className="bg-slate-700 p-6 rounded-lg text-center">
                  <PayPalButton
                    amount={planData.amount}
                    currency="USD"
                    intent="CAPTURE"
                  />
                </div>

                {/* Security Notice */}
                <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-lg">
                  <div className="flex items-start">
                    <Shield className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-300 mb-1">
                        Secure Payment
                      </p>
                      <p className="text-blue-200">
                        Your payment is processed securely by PayPal. We never store your payment information.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="text-xs text-gray-400 space-y-2">
                  <p>
                    By completing your purchase, you agree to our Terms of Service and Privacy Policy.
                  </p>
                  <p>
                    Your subscription will automatically renew unless cancelled. You can manage your subscription 
                    in your account settings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

          {/* Trust Indicators */}
          <div className="mt-12 text-center">
            <div className="flex justify-center items-center gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                SSL Secured
              </div>
              <div className="flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                PayPal Certified
              </div>
              <div>30-Day Money Back Guarantee</div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}