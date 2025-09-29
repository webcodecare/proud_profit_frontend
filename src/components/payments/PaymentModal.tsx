import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Wallet, ArrowRight, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// PayPal integration handled directly in component

interface PaymentModalProps {
  planName: string;
  planTier: string;
  monthlyPrice: number;
  yearlyPrice: number;
  billingInterval: 'monthly' | 'yearly';
  isCurrentPlan?: boolean;
  children: React.ReactNode;
  onSuccess?: () => void;
}

export default function PaymentModal({
  planName,
  planTier,
  monthlyPrice,
  yearlyPrice,
  billingInterval,
  isCurrentPlan = false,
  children,
  onSuccess
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('paypal');
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const price = billingInterval === 'yearly' ? yearlyPrice : monthlyPrice;
  const formattedPrice = (price / 100).toFixed(2);

  const handleStripePayment = async () => {
    if (isCurrentPlan) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          planTier,
          billingInterval,
          paymentMethod: 'stripe'
        })
      });

      const data = await response.json();
      
      if (response.ok && data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Stripe payment error:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayPalSuccess = () => {
    toast({
      title: "Payment Successful!",
      description: `Successfully upgraded to ${planName}`,
    });
    setIsOpen(false);
    onSuccess?.();
  };

  if (isCurrentPlan) {
    return <>{children}</>;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Complete Your Upgrade
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Plan Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <h3 className="font-semibold text-lg">{planName}</h3>
                <div className="text-3xl font-bold text-primary">
                  ${formattedPrice}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{billingInterval === 'yearly' ? 'year' : 'month'}
                  </span>
                </div>
                {billingInterval === 'yearly' && (
                  <Badge variant="secondary" className="mt-2">
                    Save {Math.round(((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100)}% annually
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <h4 className="font-medium">Choose Payment Method</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={paymentMethod === 'stripe' ? 'default' : 'outline'}
                className="h-16 flex-col"
                onClick={() => setPaymentMethod('stripe')}
              >
                <CreditCard className="h-5 w-5 mb-1" />
                <span className="text-sm">Credit Card</span>
                {paymentMethod === 'stripe' && <Check className="h-3 w-3 absolute top-2 right-2" />}
              </Button>
              
              <Button
                variant={paymentMethod === 'paypal' ? 'default' : 'outline'}
                className="h-16 flex-col"
                onClick={() => setPaymentMethod('paypal')}
              >
                <Wallet className="h-5 w-5 mb-1" />
                <span className="text-sm">PayPal</span>
                {paymentMethod === 'paypal' && <Check className="h-3 w-3 absolute top-2 right-2" />}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Payment Buttons */}
          <div className="space-y-3">
            {paymentMethod === 'stripe' ? (
              <Button
                onClick={handleStripePayment}
                disabled={isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <div className="flex items-center">
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay with Stripe
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                )}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={async () => {
                    if (isCurrentPlan) return;
                    
                    setIsProcessing(true);
                    try {
                      const response = await fetch('/api/create-subscription', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                        },
                        body: JSON.stringify({
                          planTier,
                          billingInterval,
                          paymentMethod: 'paypal'
                        })
                      });

                      const data = await response.json();
                      
                      if (response.ok && data.success) {
                        toast({
                          title: "Upgrade Successful!",
                          description: `Successfully upgraded to ${planName}`,
                        });
                        setIsOpen(false);
                        onSuccess?.();
                      } else {
                        throw new Error(data.message || 'Payment failed');
                      }
                    } catch (error) {
                      console.error('PayPal payment error:', error);
                      toast({
                        title: "Payment Failed",
                        description: error instanceof Error ? error.message : "Failed to process payment",
                        variant: "destructive",
                      });
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Wallet className="w-4 h-4 mr-2" />
                      Pay with PayPal
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Secure payment processed by PayPal
                </p>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="text-center text-xs text-muted-foreground">
            <p>🔒 Secure payment processing</p>
            <p>14-day money-back guarantee • Cancel anytime</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}