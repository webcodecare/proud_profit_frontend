import React, { useEffect, useState } from 'react';
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useLocation } from 'wouter';
import { useAuth } from "@/hooks/useAuth";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
if (!stripePublicKey) {
  console.error('Missing VITE_STRIPE_PUBLIC_KEY environment variable');
}
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { refreshUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast({
        title: "Payment Error",
        description: "Payment system is not ready. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/subscription?payment=success`,
        },
        redirect: 'if_required'
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "An error occurred during payment processing.",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment successful, activate subscription
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const plan = urlParams.get('plan') || 'basic';
          const billing = urlParams.get('billing') || 'monthly';
          
          const activationResponse = await apiRequest("/api/create-subscription", {
            method: "POST",
            body: JSON.stringify({
              planTier: plan,
              billingInterval: billing,
              paymentMethod: 'stripe',
              paymentData: {
                paymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount / 100, // Convert from cents
                currency: paymentIntent.currency,
                status: paymentIntent.status
              }
            })
          });
          
          if (activationResponse) {
            toast({
              title: "Payment Successful",
              description: "Your subscription has been activated!",
            });
            
            // Refresh user data to get updated subscription info
            await refreshUser();
            
            // Redirect to dashboard with success
            setTimeout(() => {
              setLocation('/dashboard?payment=success&subscription=activated');
            }, 1500);
          }
        } catch (activationError: any) {
          console.error('Failed to activate subscription:', activationError);
          toast({
            title: "Payment Successful",
            description: "Payment completed but subscription activation failed. Please contact support.",
            variant: "destructive",
          });
          
          // Redirect to dashboard with error flag
          setTimeout(() => {
            setLocation('/dashboard?payment=success&subscription=error');
          }, 2000);
        }
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? "Processing..." : "Complete Payment"}
      </button>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Get plan from URL params
    const params = new URLSearchParams(window.location.search);
    const planId = params.get('plan') || 'basic';
    const amount = params.get('amount');

    if (!amount) {
      toast({
        title: "Invalid Request",
        description: "No plan selected. Redirecting to pricing...",
        variant: "destructive"
      });
      setTimeout(() => setLocation('/pricing'), 2000);
      return;
    }

    // Create PaymentIntent for the selected subscription plan
    apiRequest("/api/create-payment-intent", {
      method: "POST",
      body: JSON.stringify({ 
        planId,
        amount: parseInt(amount),
        type: 'subscription'
      })
    })
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error('No client secret returned');
        }
      })
      .catch((error) => {
        console.error('Failed to create payment intent:', error);
        toast({
          title: "Payment Setup Failed",
          description: error.message || "Failed to initialize payment. Please try again.",
          variant: "destructive"
        });
        setTimeout(() => setLocation('/pricing'), 3000);
      });
  }, [toast, setLocation]);

  if (!stripePromise) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-destructive mb-2">Payment System Unavailable</h2>
          <p className="text-muted-foreground">Stripe is not configured. Please contact support.</p>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" aria-label="Loading"/>
          <p className="text-muted-foreground">Setting up secure payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Complete Your Payment</h1>
          <p className="text-muted-foreground">Enter your payment details below</p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm />
          </Elements>
        </div>
      </div>
    </div>
  );
};