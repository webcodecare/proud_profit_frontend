# Sidebar Subscription Integration

This document explains how the Sidebar component has been updated to show full subscription plan details.

## What Changed

### 1. Updated Sidebar Component

The `Sidebar` component now accepts an optional `subscription` prop with full plan details:

```tsx
interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
  subscription?: {
    id: string;
    planId: string;
    planName: string;
    planDescription: string;
    amount: number;
    features: string[];
    status: string;
    billingCycle: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    // ... other fields
  };
}
```

### 2. New Subscription Data Hook

Created `useUserSubscriptionDetails()` hook that fetches full subscription data from `/api/user/subscriptions`:

```tsx
const { data: subscription, isLoading } = useUserSubscriptionDetails();
```

### 3. Wrapper Component

Created `SidebarWithSubscription` that automatically fetches and passes subscription data to the Sidebar:

```tsx
<SidebarWithSubscription />
```

## How It Works

### When User is NOT Subscribed

- Shows "Subscription" button in the sidebar
- Clicking leads to subscription page

### When User IS Subscribed

- Shows "My Plan (Plan Name)" instead of "Subscription" button
- Displays full plan details in an expanded card format:
  - Plan name and description
  - Amount and billing cycle
  - Subscription status
  - Current period dates
  - List of features included

## Usage Examples

### Method 1: Use the Wrapper Component (Recommended)

```tsx
import SidebarWithSubscription from "@/components/layout/SidebarWithSubscription";

export default function MyPage() {
  return (
    <div className="flex h-screen">
      <SidebarWithSubscription />
      <main className="flex-1 ml-0 md:ml-64">{/* Your page content */}</main>
    </div>
  );
}
```

### Method 2: Manual Integration

```tsx
import { Sidebar } from "@/components/layout/Sidebar";
import { useUserSubscriptionDetails } from "@/hooks/useUserSubscriptionDetails";

export default function MyPage() {
  const { data: subscription } = useUserSubscriptionDetails();

  return (
    <div className="flex h-screen">
      <Sidebar subscription={subscription || undefined} />
      <main className="flex-1 ml-0 md:ml-64">{/* Your page content */}</main>
    </div>
  );
}
```

## API Response Format

The `/api/user/subscriptions` endpoint should return an array of subscriptions:

```json
[
  {
    "id": "sub_123",
    "planId": "pro-monthly",
    "planName": "Professional",
    "planDescription": "Advanced trading features",
    "amount": 99,
    "features": ["Unlimited signals", "Advanced analytics", "Priority support"],
    "status": "active",
    "billingCycle": "monthly",
    "currentPeriodStart": "2024-01-01T00:00:00Z",
    "currentPeriodEnd": "2024-02-01T00:00:00Z",
    "stripeSubscriptionId": "sub_stripe123",
    "stripeCustomerId": "cus_stripe123",
    "stripePriceId": "price_stripe123",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

## Files Modified

1. `src/components/layout/Sidebar.tsx` - Updated to accept and display subscription prop
2. `src/hooks/useUserSubscriptionDetails.tsx` - New hook for fetching subscription data
3. `src/components/layout/SidebarWithSubscription.tsx` - Wrapper component
4. `src/pages/dashboard.tsx` - Updated to use new sidebar (example)

## Migration Guide

To update existing pages:

1. **Replace regular Sidebar import:**

   ```tsx
   // Old
   import Sidebar from "@/components/layout/Sidebar";

   // New
   import SidebarWithSubscription from "@/components/layout/SidebarWithSubscription";
   ```

2. **Update component usage:**

   ```tsx
   // Old
   <Sidebar />

   // New
   <SidebarWithSubscription />
   ```

That's it! The sidebar will now automatically show full subscription plan details when the user has an active subscription.
