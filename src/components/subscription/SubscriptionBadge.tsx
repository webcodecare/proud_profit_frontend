import { Badge } from "@/components/ui/badge";
import { Crown, Star, Zap, User } from "lucide-react";

interface SubscriptionBadgeProps {
  tier: "free" | "basic" | "premium" | "pro";
  size?: "sm" | "md" | "lg";
}

export default function SubscriptionBadge({ tier, size = "md" }: SubscriptionBadgeProps) {
  const config = {
    free: {
      label: "Free",
      icon: User,
      variant: "secondary" as const,
      className: "bg-gray-100 text-gray-700 hover:bg-gray-200"
    },
    basic: {
      label: "Basic",
      icon: Star,
      variant: "default" as const,
      className: "bg-blue-100 text-blue-700 hover:bg-blue-200"
    },
    premium: {
      label: "Premium", 
      icon: Zap,
      variant: "default" as const,
      className: "bg-purple-100 text-purple-700 hover:bg-purple-200"
    },
    pro: {
      label: "Pro",
      icon: Crown,
      variant: "default" as const,
      className: "bg-orange-100 text-orange-700 hover:bg-orange-200"
    }
  };

  const { label, icon: Icon, className } = config[tier];
  const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";

  return (
    <Badge className={`${className} ${textSize} flex items-center gap-1`}>
      <Icon className={iconSize} />
      {label}
    </Badge>
  );
}