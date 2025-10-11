import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, LogOut } from "lucide-react";
import SubscriptionBadge from "@/components/subscription/SubscriptionBadge";
import { formatDistanceToNow } from "date-fns";

export default function UserProfileWidget() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 
                   user.email.substring(0, 2).toUpperCase();

  return (
    <Card className="p-3 sm:p-4">
      <CardHeader className="pb-3 p-0">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
            <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-xs sm:text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-xs sm:text-sm truncate">
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user.email
              }
            </h3>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <div className="mt-1">
              <SubscriptionBadge tier={user.subscriptionTier as any} size="sm" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-0">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Role:</span>
            <p className="font-medium capitalize">{user.role}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Status:</span>
            <p className="font-medium text-green-600">Active</p>
          </div>
        </div>
        
        {user.lastLoginAt && (
          <div className="text-xs">
            <span className="text-muted-foreground">Last login:</span>
            <p className="font-medium">
              {formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true })}
            </p>
          </div>
        )}

        <div className="flex space-x-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1 text-xs px-2">
            <Settings className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Settings</span>
            <span className="sm:hidden">Set</span>
          </Button>
          <Button size="sm" variant="outline" onClick={logout} className="text-xs px-2">
            <LogOut className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden">Exit</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}