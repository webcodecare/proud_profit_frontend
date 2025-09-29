import React, { useEffect, useRef } from "react";

interface PayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function PayPalButton({
  amount,
  currency,
  intent,
}: PayPalButtonProps) {
  const paypalRef = useRef<HTMLDivElement>(null);

  const createOrder = async () => {
    try {
      const orderPayload = {
        amount: amount,
        currency: currency,
        intent: intent,
      };
      
      console.log('Creating PayPal order with payload:', orderPayload);
      
      const response = await fetch("/paypal/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const output = await response.json();
      console.log('PayPal order created:', output);
      return output.id;
    } catch (error) {
      console.error('PayPal payment error:', error);
      throw error;
    }
  };

  const onApprove = async (data: any) => {
    try {
      console.log("PayPal onApprove:", data);
      
      const response = await fetch(`/paypal/order/${data.orderID}/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const orderData = await response.json();
      console.log("PayPal capture result:", orderData);
      
      // After successful payment, activate subscription and redirect to dashboard
      if (orderData && orderData.status === 'COMPLETED') {
        try {
          // Get plan details from URL parameters
          const urlParams = new URLSearchParams(window.location.search);
          const plan = urlParams.get('plan') || 'basic';
          const billing = urlParams.get('billing') || 'monthly';
          
          // Activate subscription
          const authToken = localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '';
          console.log('Using auth token for subscription:', authToken ? 'Token found' : 'No token found');
          
          const subscriptionResponse = await fetch('/api/create-subscription', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
              planTier: plan,
              billingInterval: billing,
              paymentMethod: 'paypal'
            })
          });
          
          if (subscriptionResponse.ok) {
            console.log('Subscription activated successfully');
            const subscriptionData = await subscriptionResponse.json();
            console.log('Subscription response:', subscriptionData);
            
            // Clear auth cache and redirect to force profile refresh
            localStorage.removeItem('user_profile_cache');
            sessionStorage.clear();
            
            // Direct redirect to dashboard with payment success flag
            window.location.href = '/dashboard?payment=success&subscription=activated';
            return;
          } else {
            console.error('Subscription activation failed:', subscriptionResponse.status);
            const errorData = await subscriptionResponse.text();
            console.error('Error details:', errorData);
            
            // Still redirect to dashboard even if subscription API fails
            console.log('Redirecting to dashboard despite API failure');
            window.location.href = '/dashboard?payment=success';
            return;
          }
        } catch (error) {
          console.error('Failed to activate subscription:', error);
        }
        
        // Always redirect to dashboard after payment processing
        setTimeout(() => {
          window.location.href = '/dashboard?payment=success';
        }, 1000);
      } else {
        // Redirect to dashboard even if status is not explicitly COMPLETED
        console.log('Payment status not COMPLETED, but redirecting anyway:', orderData);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      }
    } catch (error) {
      console.error('PayPal payment error:', error);
      alert('Payment processing failed. Please try again.');
    }
  };

  const onCancel = (data: any) => {
    console.log("PayPal payment cancelled:", data);
  };

  const onError = (err: any) => {
    console.error("PayPal payment error:", err);
    alert('Payment error occurred. Please try again.');
  };

  useEffect(() => {
    const loadPayPalScript = async () => {
      try {
        // Check if PayPal script is already loaded
        if (window.paypal) {
          renderPayPalButton();
          return;
        }

        // Get PayPal client ID from backend
        const response = await fetch('/paypal/client-id');
        const { clientId } = await response.json();

        // Create and load PayPal script
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency.toUpperCase()}`;
        script.async = true;
        script.onload = renderPayPalButton;
        script.onerror = () => {
          console.error('Failed to load PayPal SDK');
        };
        
        document.body.appendChild(script);
      } catch (error) {
        console.error('Failed to get PayPal client ID:', error);
      }
    };

    const renderPayPalButton = () => {
      if (window.paypal && paypalRef.current) {
        // Clear any existing buttons
        paypalRef.current.innerHTML = '';
        
        window.paypal.Buttons({
          createOrder: createOrder,
          onApprove: onApprove,
          onCancel: onCancel,
          onError: onError,
          style: {
            color: 'blue',
            shape: 'rect',
            label: 'paypal',
            layout: 'vertical'
          }
        }).render(paypalRef.current);
      }
    };

    loadPayPalScript();
  }, [amount, currency, intent]);

  return (
    <div>
      <div ref={paypalRef}></div>
    </div>
  );
}