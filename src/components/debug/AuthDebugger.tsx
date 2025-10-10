import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SessionManager } from "@/lib/sessionManager";
import { tokenStorage } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Debug component to help identify auth session issues
 * Add this to any page to see current auth state
 */
export function AuthDebugger() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  const collectDebugInfo = async () => {
    try {
      // Get Supabase session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      // Get session manager data
      const sessionManagerData = SessionManager.getSession();

      // Get legacy token
      const legacyToken = tokenStorage.get();

      // Get all localStorage auth data
      const cryptoSession = localStorage.getItem("crypto_session");
      const authToken = localStorage.getItem("auth_token");

      const info = {
        timestamp: new Date().toISOString(),
        supabaseSession: {
          hasSession: !!session,
          sessionUser: session?.user
            ? {
                id: session.user.id,
                email: session.user.email,
                created_at: session.user.created_at,
                user_metadata: session.user.user_metadata,
                app_metadata: session.user.app_metadata,
              }
            : null,
          error,
        },
        supabaseUser: {
          hasUser: !!user,
          userData: user
            ? {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
                user_metadata: user.user_metadata,
                app_metadata: user.app_metadata,
              }
            : null,
          error: userError,
        },
        sessionManager: {
          hasSession: !!sessionManagerData,
          sessionData: sessionManagerData
            ? {
                hasToken: !!sessionManagerData.token,
                hasUser: !!sessionManagerData.user,
                userId: sessionManagerData.user?.id,
                userEmail: sessionManagerData.user?.email,
                userRole: sessionManagerData.user?.role,
                expiresAt: sessionManagerData.expiresAt,
                isValid: SessionManager.isValidSession(),
              }
            : null,
        },
        localStorage: {
          hasCryptoSession: !!cryptoSession,
          hasAuthToken: !!authToken,
          legacyToken: legacyToken
            ? legacyToken.substring(0, 20) + "..."
            : null,
        },
        currentUrl: window.location.href,
      };

      setDebugInfo(info);
      console.log("🐛 Auth Debug Info:", info);
    } catch (error) {
      console.error("Debug info collection failed:", error);
      setDebugInfo({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const clearAllAuthData = async () => {
    try {
      // Clear Supabase session
      await supabase.auth.signOut();

      // Clear SessionManager
      SessionManager.clearSession();

      // Clear legacy token
      tokenStorage.remove();

      // Clear localStorage
      localStorage.removeItem("crypto_session");
      localStorage.removeItem("auth_token");

      console.log("🧹 All auth data cleared");
      await collectDebugInfo();
    } catch (error) {
      console.error("Failed to clear auth data:", error);
    }
  };

  useEffect(() => {
    collectDebugInfo();
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Auth Debug Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={collectDebugInfo}>Refresh Debug Info</Button>
          <Button onClick={clearAllAuthData} variant="destructive">
            Clear All Auth Data
          </Button>
        </div>

        <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>

        <div className="text-sm text-gray-600">
          <p>
            <strong>Instructions:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Check if Supabase session shows the correct user email</li>
            <li>Compare Supabase user data with SessionManager data</li>
            <li>
              If data doesn't match, use "Clear All Auth Data" and try login
              again
            </li>
            <li>Check browser console for the full debug output</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default AuthDebugger;
