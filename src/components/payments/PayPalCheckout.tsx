import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    paypal?: any;
  }
}

interface PayPalCheckoutProps {
  amount: number;
  currency?: string;
  description: string;
  subscriptionTier: 'basic' | 'premium' | 'pro';
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function PayPalCheckout({
  amount,
  currency = 'USD',
  description,
  subscriptionTier,
  onSuccess,
  onError
}: PayPalCheckoutProps) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPayPalScript = async () => {
      try {
        // Get PayPal client token
        const setupResponse = await apiRequest('GET', '/api/payments/paypal/setup');
        const { clientId } = setupResponse;

        // Load PayPal SDK
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`;
        script.async = true;
        
        script.onload = () => {
          if (window.paypal && paypalRef.current) {
            window.paypal.Buttons({
              createOrder: async () => {
                try {
                  const response = await apiRequest('POST', '/api/payments/paypal/create-order', {
                    amount: amount.toFixed(2),
                    currency,
                    description,
                    subscriptionTier
                  });
                  return response.id;
                } catch (error: any) {
                  onError?.(error.message);
                  toast({
                    title: "PayPal Setup Failed",
                    description: error.message,
                    variant: "destructive",
                  });
                  throw error;
                }
              },
              
              onApprove: async (data: any) => {
                try {
                  const response = await apiRequest('POST', `/api/payments/paypal/capture-order/${data.orderID}`);
                  
                  if (response.status === 'COMPLETED') {
                    onSuccess?.();
                    toast({
                      title: "Payment Successful",
                      description: `Successfully subscribed to ${subscriptionTier} plan via PayPal!`,
                    });
                  } else {
                    throw new Error('Payment not completed');
                  }
                } catch (error: any) {
                  onError?.(error.message);
                  toast({
                    title: "Payment Processing Failed",
                    description: error.message,
                    variant: "destructive",
                  });
                }
              },
              
              onError: (err: any) => {
                const errorMessage = 'PayPal payment failed. Please try again.';
                onError?.(errorMessage);
                toast({
                  title: "PayPal Error",
                  description: errorMessage,
                  variant: "destructive",
                });
              },
              
              onCancel: () => {
                toast({
                  title: "Payment Cancelled",
                  description: "PayPal payment was cancelled.",
                  variant: "default",
                });
              }
            }).render(paypalRef.current);
          }
          setIsLoading(false);
        };
        
        script.onerror = () => {
          setError('Failed to load PayPal SDK');
          setIsLoading(false);
        };
        
        document.head.appendChild(script);
        
        return () => {
          document.head.removeChild(script);
        };
      } catch (error: any) {
        setError(error.message);
        setIsLoading(false);
      }
    };

    loadPayPalScript();
  }, [amount, currency, description, subscriptionTier]);

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          PayPal Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading PayPal...</span>
          </div>
        ) : (
          <div>
            <div className="mb-4 text-center">
              <p className="text-lg font-semibold">${amount} {currency}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div ref={paypalRef} className="min-h-[45px]" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}