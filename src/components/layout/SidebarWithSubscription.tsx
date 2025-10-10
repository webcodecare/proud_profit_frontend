import React from "react";
import { Sidebar } from "./Sidebar";
import { useUserSubscriptionData } from "@/hooks/useSubscription.tsx";

interface SidebarWithSubscriptionProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function SidebarWithSubscription(props: SidebarWithSubscriptionProps) {
  const { data: subscription, isLoading, error } = useUserSubscriptionData();

  return <Sidebar {...props} subscription={subscription || undefined} />;
}
export default SidebarWithSubscription;
