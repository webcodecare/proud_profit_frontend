import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/components/notifications/NotificationSystem';
import { 
  CreditCard, 
  Shield, 
  Check, 
  Star,
  Crown,
  Zap,
  TrendingUp,
  Bell,
  Smartphone
} from 'lucide-react';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
  color: string;
  icon: React.ReactNode;
}

const pricingTiers: PricingTier[] = [
  {
    id: 'basic',
    name: 'Basic Trader',
    price: 47,
    description: 'Essential tools for crypto trading',
    features: [
      'Real-time price alerts',
      'Basic trading signals',
      'Portfolio tracking',
      'Email notifications',
      'Mobile app access'
    ],
    color: 'from-blue-500 to-blue-600',
    icon: <TrendingUp className="h-6 w-6" />
  },
  {
    id: 'premium',
    name: 'Pro Trader',
    price: 97,
    description: 'Advanced analytics and premium features',
    features: [
      'All Basic features',
      'Advanced trading signals',
      'Technical analysis tools',
      'SMS notifications',
      'Priority email support',
      'Custom alerts',
      'Market insights'
    ],
    popular: true,
    color: 'from-orange-500 to-orange-600',
    icon: <Star className="h-6 w-6" />
  },
  {
    id: 'pro',
    name: 'Elite Trader',
    price: 197,
    description: 'Complete trading suite with premium support',
    features: [
      'All Pro features',
      'AI-powered signals',
      'Advanced forecasting',
      'Phone support',
      'Custom integrations',
      'White-label access',
      'Dedicated account manager'
    ],
    color: 'from-purple-500 to-purple-600',
    icon: <Crown className="h-6 w-6" />
  }
];

export default function SubscriptionPayment() {
  const { user } = useAuth();
  const { paymentSuccess, paymentError } = useNotifications();
  const [selectedTier, setSelectedTier] = useState<string>('premium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');

  const handlePayment = async (tier: PricingTier) => {
    setIsProcessing(true);
    
    try {
      if (paymentMethod === 'stripe') {
        await handleStripePayment(tier);
      } else {
        await handlePayPalPayment(tier);
      }
    } catch (error: any) {
      paymentError(error.message || 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripePayment = async (tier: PricingTier) => {
    // Mock Stripe payment for demonstration
    // In real implementation, this would integrate with Stripe Elements
    setTimeout(() => {
      paymentSuccess(tier.name);
      // Redirect to dashboard after successful payment
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    }, 2000);
  };

  const handlePayPalPayment = async (tier: PricingTier) => {
    // Mock PayPal payment for demonstration  
    // In real implementation, this would integrate with PayPal SDK
    setTimeout(() => {
      paymentSuccess(tier.name);
      // Redirect to dashboard after successful payment
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Upgrade Your Trading Experience
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan to unlock advanced trading features and maximize your crypto profits
          </p>
          {user && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Badge variant="outline" className="px-3 py-1">
                Current: {user.subscriptionTier?.charAt(0).toUpperCase() + (user.subscriptionTier?.slice(1) || 'Free')}
              </Badge>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {pricingTiers.map((tier) => (
            <Card 
              key={tier.id}
              className={`relative transition-all duration-300 hover:scale-105 cursor-pointer ${
                selectedTier === tier.id ? 'ring-2 ring-primary shadow-lg' : ''
              } ${tier.popular ? 'border-orange-200 shadow-xl' : ''}`}
              onClick={() => setSelectedTier(tier.id)}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-orange-500 text-white px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r ${tier.color} flex items-center justify-center text-white`}>
                  {tier.icon}
                </div>
                <CardTitle className="text-xl font-bold">{tier.name}</CardTitle>
                <div className="text-3xl font-bold text-primary">
                  ${tier.price}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{tier.description}</p>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment Section */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Complete Your Purchase
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Selected plan: <strong>{pricingTiers.find(t => t.id === selectedTier)?.name}</strong> - 
              ${pricingTiers.find(t => t.id === selectedTier)?.price}/month
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Payment Method Selection */}
            <div>
              <h3 className="font-semibold mb-4">Choose Payment Method</h3>
              <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'stripe' | 'paypal')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="stripe" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Credit Card
                  </TabsTrigger>
                  <TabsTrigger value="paypal" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    PayPal
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="stripe" className="mt-4">
                  <div className="p-4 border rounded-md bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Secure Credit Card Payment</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your payment is secured by Stripe. We accept Visa, Mastercard, and American Express.
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="paypal" className="mt-4">
                  <div className="p-4 border rounded-md bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">PayPal Payment</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Pay securely with your PayPal account or PayPal Credit.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Security Notice */}
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200">Secure Payment</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  All payments are encrypted and secure. Your subscription includes a 30-day money-back guarantee.
                </p>
              </div>
            </div>

            {/* Payment Button */}
            <Button
              onClick={() => {
                const tier = pricingTiers.find(t => t.id === selectedTier);
                if (tier) handlePayment(tier);
              }}
              disabled={isProcessing}
              className="w-full h-12 text-lg font-semibold"
              size="lg"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing Payment...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Start {pricingTiers.find(t => t.id === selectedTier)?.name} - ${pricingTiers.find(t => t.id === selectedTier)?.price}/month
                </div>
              )}
            </Button>

            {/* Additional Info */}
            <div className="text-center space-y-2 text-sm text-muted-foreground">
              <p>Cancel anytime • No long-term contracts • Instant activation</p>
              <p className="flex items-center justify-center gap-1">
                <Smartphone className="h-4 w-4" />
                Access on all devices: Desktop, Mobile, Tablet
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}