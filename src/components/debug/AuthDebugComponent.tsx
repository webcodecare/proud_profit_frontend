import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Key } from "lucide-react";

export default function AuthDebugComponent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center">Loading auth status...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Authentication Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Status:
          </span>
          <Badge variant={user ? "default" : "destructive"}>
            {user ? "Authenticated" : "Not Logged In"}
          </Badge>
        </div>

        {user && (
          <>
            <div className="flex items-center justify-between">
              <span>Email:</span>
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Role:</span>
              <Badge variant="outline">{user.role}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>User ID:</span>
              <span className="text-sm text-muted-foreground font-mono">
                {user.id.substring(0, 8)}...
              </span>
            </div>
          </>
        )}

        {!user && (
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Key className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Please log in to access the watchlist feature
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
