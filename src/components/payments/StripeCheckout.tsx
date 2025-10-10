import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface StripeCheckoutProps {
  amount: number;
  currency?: string;
  description: string;
  subscriptionTier: 'basic' | 'premium' | 'pro';
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

function CheckoutForm({ amount, currency = 'usd', description, subscriptionTier, onSuccess, onError }: StripeCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest('POST', '/api/payments/stripe/create-intent', {
          amount: amount * 100, // Convert to cents
          currency,
          description,
          subscriptionTier
        });
        setClientSecret(response.clientSecret);
      } catch (error: any) {
        onError?.(error.message);
        toast({
          title: "Payment Setup Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    createPaymentIntent();
  }, [amount, currency, description, subscriptionTier]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsProcessing(true);

    if (!stripe || !elements || !clientSecret) {
      setIsProcessing(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setIsProcessing(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'Customer', // You can collect this from a form
          },
        },
      });

      if (error) {
        onError?.(error.message || 'Payment failed');
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent?.status === 'succeeded') {
        onSuccess?.();
        toast({
          title: "Payment Successful",
          description: `Successfully subscribed to ${subscriptionTier} plan!`,
        });
      }
    } catch (error: any) {
      onError?.(error.message);
      toast({
        title: "Payment Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: 'hsl(var(--foreground))',
        '::placeholder': {
          color: 'hsl(var(--muted-foreground))',
        },
        backgroundColor: 'hsl(var(--background))',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg bg-background">
        <CardElement options={cardElementOptions} />
      </div>
      
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing || !clientSecret}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay ${amount} USD
          </>
        )}
      </Button>
    </form>
  );
}

export function StripeCheckout(props: StripeCheckoutProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Secure Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Elements stripe={stripePromise}>
          <CheckoutForm {...props} />
        </Elements>
      </CardContent>
    </Card>
  );
}