/**
 * Example: How to wire up subscription data to Sidebar
 *
 * Method 1: Use SidebarWithSubscription wrapper component (Recommended)
 */

// In your page component (e.g., dashboard.tsx, settings.tsx, etc.)
import React from "react";
import SidebarWithSubscription from "@/components/layout/SidebarWithSubscription";
import { useAuth } from "@/hooks/useAuth";

export default function ExamplePage() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-background">
      {/* Use SidebarWithSubscription instead of regular Sidebar */}
      <SidebarWithSubscription />

      <div className="flex-1 flex flex-col overflow-hidden ml-0 md:ml-64">
        <main className="flex-1 overflow-y-auto p-6">
          <h1>Your Page Content</h1>
          <p>
            The sidebar will now show full subscription plan details if user is
            subscribed!
          </p>
        </main>
      </div>
    </div>
  );
}

/**
 * Method 2: Fetch subscription data in your page and pass it to Sidebar manually
 */

import { useUserSubscriptionDetails } from "@/hooks/useUserSubscriptionDetails";
import { Sidebar } from "@/components/layout/Sidebar";

export function ExamplePageMethod2() {
  const { data: subscription } = useUserSubscriptionDetails();

  return (
    <div className="flex h-screen bg-background">
      {/* Pass subscription data directly to Sidebar */}
      <Sidebar subscription={subscription || undefined} />

      <div className="flex-1 flex flex-col overflow-hidden ml-0 md:ml-64">
        <main className="flex-1 overflow-y-auto p-6">
          <h1>Your Page Content</h1>
          <p>Subscription data passed manually to Sidebar</p>
        </main>
      </div>
    </div>
  );
}
