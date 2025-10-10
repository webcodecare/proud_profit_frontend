import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { syncUserWithDatabaseSafe } from "@/lib/userSync";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

/**
 * Example component showing how to implement user sync
 * in custom authentication flows
 */
export function CustomAuthExample() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleCustomLogin = async () => {
    setIsLoading(true);
    try {
      // Example: Login with external provider
      const result = await login("user@example.com", "password");

      // User sync is automatically handled by useAuth hook,
      // but if you're implementing custom auth flow, call sync manually:
      // await syncUserWithDatabaseSafe();

      toast({
        title: "Login Successful",
        description: "User has been synced with database",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async () => {
    setIsLoading(true);
    try {
      const success = await syncUserWithDatabaseSafe();

      toast({
        title: success ? "Sync Successful" : "Sync Failed",
        description: success
          ? "User data synchronized with database"
          : "Failed to sync user data, check console for details",
        variant: success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync Error",
        description: "Failed to sync user with database",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">User Sync Example</h3>

      <div className="space-y-2">
        <Button
          onClick={handleCustomLogin}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Logging in..." : "Login (Auto Sync)"}
        </Button>

        <Button
          onClick={handleManualSync}
          disabled={isLoading}
          variant="outline"
          className="w-full"
        >
          {isLoading ? "Syncing..." : "Manual User Sync"}
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>• Login automatically syncs user data with database</p>
        <p>• Manual sync can be triggered if needed</p>
        <p>• Check browser console for sync logs</p>
      </div>
    </div>
  );
}

export default CustomAuthExample;
