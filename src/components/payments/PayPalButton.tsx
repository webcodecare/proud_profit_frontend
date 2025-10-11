import React, { useEffect, useRef } from "react";
import { buildApiUrl } from "@/config/api";
import { apiRequest } from "@/lib/queryClient";

interface PayPalButtonProps {
  id: string;
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
  id,
  amount,
  currency,
  intent,
}: PayPalButtonProps) {
  const paypalRef = useRef<HTMLDivElement>(null);

  const createOrder = async () => {
    try {
      const orderPayload = {
        plan_id: id,
        amount: amount,
        currency: currency,
        intent: intent,
      };

      console.log("Creating PayPal order with payload:", orderPayload);

      const response = await apiRequest("/paypal/order", {
        method: "POST",
        body: JSON.stringify(orderPayload),
      });

      console.log(response, "response");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const output = await response.json();
      console.log("PayPal order created:", output);
      return output.id;
    } catch (error) {
      console.error("PayPal payment error:", error);
      throw error;
    }
  };

  const onApprove = async (data: any) => {
    try {
      console.log("PayPal onApprove:", data);

      const response = await fetch(
        buildApiUrl(`/paypal/order/${data.orderID}/capture`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const orderData = await response.json();
      console.log("PayPal capture result:", orderData);

      // After successful payment, validate and activate subscription
      if (orderData && orderData.status === "COMPLETED") {
        try {
          // Validate payment details
          if (
            !orderData.purchase_units ||
            !orderData.purchase_units[0] ||
            !orderData.purchase_units[0].amount
          ) {
            throw new Error("Invalid payment data: missing amount information");
          }

          const paymentAmount = parseFloat(
            orderData.purchase_units[0].amount.value
          );
          const paymentCurrency =
            orderData.purchase_units[0].amount.currency_code;

          console.log("Payment validated:", {
            amount: paymentAmount,
            currency: paymentCurrency,
          });

          // Get plan details from URL parameters
          const urlParams = new URLSearchParams(window.location.search);
          const plan = urlParams.get("plan") || "basic";
          const billing = urlParams.get("billing") || "monthly";

          if (!plan || !billing) {
            throw new Error("Missing plan or billing interval parameters");
          }

          // Activate subscription using consistent token management
          let authToken = null;
          try {
            // Use SessionManager for consistent token access
            const { SessionManager } = await import("../../lib/sessionManager");
            authToken = SessionManager.getToken();
          } catch (error) {
            // Fallback to localStorage if SessionManager not available
            console.warn(
              "SessionManager not available, falling back to localStorage"
            );
            authToken =
              localStorage.getItem("auth_token") ||
              localStorage.getItem("authToken") ||
              "";
          }

          if (!authToken) {
            throw new Error("No authentication token found");
          }

          console.log(
            "Using auth token for subscription:",
            authToken ? "Token found" : "No token found"
          );

          const subscriptionResponse = await fetch("/api/create-subscription", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              planTier: plan,
              billingInterval: billing,
              paymentMethod: "paypal",
              paymentData: {
                orderId: data.orderID,
                amount: paymentAmount,
                currency: paymentCurrency,
                transactionId: orderData.id,
                status: orderData.status,
              },
            }),
          });

          if (subscriptionResponse.ok) {
            console.log("Subscription activated successfully");
            const subscriptionData = await subscriptionResponse.json();
            console.log("Subscription response:", subscriptionData);

            // Clear auth cache and redirect to force profile refresh
            localStorage.removeItem("user_profile_cache");
            sessionStorage.clear();

            // Direct redirect to dashboard with payment success flag
            window.location.href =
              "/dashboard?payment=success&subscription=activated";
            return;
          } else {
            console.error(
              "Subscription activation failed:",
              subscriptionResponse.status
            );
            const errorData = await subscriptionResponse.text();
            console.error("Error details:", errorData);

            // Redirect with subscription error flag
            console.log("Redirecting to dashboard with subscription error");
            window.location.href =
              "/dashboard?payment=success&subscription=error";
            return;
          }
        } catch (error: any) {
          console.error("Failed to activate subscription:", error);
          // Show error to user but still redirect
          alert(
            `Payment successful but subscription activation failed: ${
              error.message || "Unknown error"
            }. Please contact support.`
          );

          // Redirect to dashboard with error flag
          setTimeout(() => {
            window.location.href =
              "/dashboard?payment=success&subscription=error";
          }, 2000);
          return;
        }
      } else {
        // Payment not completed successfully
        console.error("Payment status not COMPLETED:", orderData);
        throw new Error(
          `Payment not completed. Status: ${orderData.status || "unknown"}`
        );
      }
    } catch (error) {
      console.error("PayPal payment error:", error);
      alert("Payment processing failed. Please try again.");
    }
  };

  const onCancel = (data: any) => {
    console.log("PayPal payment cancelled:", data);
  };

  const onError = (err: any) => {
    console.error("PayPal payment error:", err);
    alert("Payment error occurred. Please try again.");
  };

  useEffect(() => {
    const loadPayPalScript = async () => {
      try {
        // Check if PayPal script is already loaded
        if (window.paypal) {
          renderPayPalButton();
          return;
        }

        // Get PayPal client ID from backend using consistent API request
        const { clientId } = await apiRequest("/api/payments/paypal/client-id");
        console.log(clientId, "clientId mamamam");
        // Create and load PayPal script
        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency.toUpperCase()}`;
        script.async = true;
        script.onload = renderPayPalButton;
        script.onerror = () => {
          console.error("Failed to load PayPal SDK");
        };

        document.body.appendChild(script);
      } catch (error) {
        console.error("Failed to get PayPal client ID:", error);
      }
    };

    const renderPayPalButton = () => {
      if (window.paypal && paypalRef.current) {
        // Clear any existing buttons
        paypalRef.current.innerHTML = "";

        window.paypal
          .Buttons({
            createOrder: createOrder,
            onApprove: onApprove,
            onCancel: onCancel,
            onError: onError,
            style: {
              color: "blue",
              shape: "rect",
              label: "paypal",
              layout: "vertical",
            },
          })
          .render(paypalRef.current);
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
