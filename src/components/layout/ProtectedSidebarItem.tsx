import React from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { hasAccess } from "@/lib/subscriptionUtils";
import { Lock, Crown } from "lucide-react";

interface ProtectedSidebarItemProps {
  href: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  requiredTier?: "basic" | "premium" | "pro";
  feature?: string;
  className?: string;
}

export default function ProtectedSidebarItem({
  href,
  title,
  icon: Icon,
  isActive,
  requiredTier = "basic",
  feature,
  className
}: ProtectedSidebarItemProps) {
  const { user } = useAuth();
  const userTier = user?.subscriptionTier || "free";
  const subscriptionStatus = user?.subscriptionStatus;
  
  // Check access based on feature or tier
  let hasFeatureAccess = false;
  
  if (feature) {
    hasFeatureAccess = hasAccess(userTier, feature as any);
  } else {
    const tierLevels = { free: 0, basic: 1, premium: 2, pro: 3 };
    const userLevel = tierLevels[userTier as keyof typeof tierLevels] || 0;
    const requiredLevel = tierLevels[requiredTier];
    hasFeatureAccess = userLevel >= requiredLevel;
  }
  
  // Admin bypass
  if (user?.role === "admin" || user?.role === "superuser") {
    hasFeatureAccess = true;
  }
  
  // Check if subscription is active (except for free tier)
  const hasActiveSubscription = subscriptionStatus === "active" || userTier === "free";
  
  // Determine if user can access this feature
  const canAccess = hasFeatureAccess && hasActiveSubscription;
  
  // Always show the item, but indicate if it's locked
  const itemClassName = cn(
    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent",
    isActive && "bg-accent",
    !canAccess && "opacity-60",
    className
  );
  
  if (!canAccess) {
    // Show locked item that doesn't navigate
    return (
      <div className={itemClassName}>
        <Icon className="h-4 w-4" />
        <span className="flex-1">{title}</span>
        <div className="flex items-center gap-1">
          <Lock className="h-3 w-3 text-muted-foreground" />
          {requiredTier !== "basic" && <Crown className="h-3 w-3 text-yellow-500" />}
        </div>
      </div>
    );
  }
  
  // Regular accessible item
  return (
    <Link href={href}>
      <div className={itemClassName}>
        <Icon className="h-4 w-4" />
        <span>{title}</span>
      </div>
    </Link>
  );
}