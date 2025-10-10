import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { SessionManager } from "@/lib/sessionManager";
import { useToast } from "@/hooks/use-toast";
import { syncUserWithDatabaseSafe } from "@/lib/userSync";
import { AuthUtils } from "@/lib/authUtils";
import { tokenStorage } from "@/lib/auth";
import { buildApiUrl } from "@/config/api";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Clear any existing auth state first to avoid conflicts
        console.log("🧹 Clearing existing auth state before OAuth callback");
        SessionManager.clearSession();
        tokenStorage.remove();

        // Check if there's auth data in the URL (OAuth callback)
        const urlHash = window.location.hash;
        console.log("🔍 URL hash:", urlHash);

        // First try to get session from URL if it's an OAuth callback
        let session = null;
        let error = null;

        if (urlHash.includes("access_token") || urlHash.includes("id_token")) {
          console.log("� Detected OAuth callback with tokens in URL");
          try {
            // Use regular getSession instead of getSessionFromUrl
            const result = await supabase.auth.getSession();
            session = result.data.session;
            error = result.error;
            console.log("🔍 getSessionFromUrl result:", {
              hasSession: !!session,
              error,
            });
          } catch (urlErr) {
            console.warn(
              "⚠️ getSessionFromUrl failed, falling back to getSession:",
              urlErr
            );
          }
        }

        // If no session from URL, try regular getSession
        if (!session) {
          console.log("🔍 Trying regular getSession");
          const result = await supabase.auth.getSession();
          session = result.data.session;
          error = result.error;
        }

        console.log("🔍 Final session result:", {
          hasSession: !!session,
          error,
        });

        if (error) {
          console.error("Auth callback error:", error);
          toast({
            variant: "destructive",
            title: "Authentication Failed",
            description: error.message || "Failed to complete Google login",
          });
          window.location.href = "/login";
          return;
        }

        if (session) {
          // Debug: Log the full session data to understand what we're getting
          console.log("🔍 Full Supabase session:", session);
          console.log("🔍 Session user data:", session.user);
          console.log("🔍 Session user email:", session.user.email);
          console.log("🔍 Session user metadata:", session.user.user_metadata);

          // Extract user data from Supabase session
          const user = {
            id: session.user.id,
            email: session.user.email || "",
            firstName:
              session.user.user_metadata?.full_name?.split(" ")[0] ||
              session.user.user_metadata?.first_name ||
              "",
            lastName:
              session.user.user_metadata?.full_name
                ?.split(" ")
                .slice(1)
                .join(" ") ||
              session.user.user_metadata?.last_name ||
              "",
            role: "user" as const,
            isActive: true,
            subscriptionTier: "free" as const,
            subscriptionStatus: "active" as const, // Free users have active status
            createdAt: session.user.created_at || new Date().toISOString(),
          };

          console.log("🔧 Extracted user data for session:", {
            userId: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          });

          console.log(
            "📌 About to set token and create session for Google login"
          );

          // Create session in SessionManager
          const createdSession = SessionManager.createSession(
            session.access_token,
            user
          );
          console.log("✅ Google OAuth session created:", {
            tokenLength: createdSession.token.length,
            userId: createdSession.user?.id,
            expiresAt: new Date(createdSession.expiresAt).toISOString(),
          });

          // Also store in legacy token storage to ensure useAuth picks it up
          tokenStorage.set(session.access_token);

          // Verify session was written to localStorage
          const verifySession = localStorage.getItem("crypto_session");
          console.log(
            "✅ Verification - Google session in localStorage:",
            !!verifySession
          );
          if (verifySession) {
            const parsed = JSON.parse(verifySession);
            console.log("✅ Verified Google session data:", {
              hasToken: !!parsed.token,
              hasUser: !!parsed.user,
              tokenMatch: parsed.token === session.access_token,
            });
          }

          // Set flag to trigger frontend auth refresh
          localStorage.setItem("google_login_complete", "true");

          console.log("✅ Session and token stored for Google login");

          // Call sync-user endpoint to ensure user exists in database after Google/social login
          await syncUserWithDatabaseSafe(session.access_token);

          // Fetch the actual user profile from backend after sync to get real subscription data
          try {
            const response = await fetch(buildApiUrl("/api/user/profile"), {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                "Content-Type": "application/json",
              },
            });

            if (response.ok) {
              const profileData = await response.json();
              if (profileData?.user) {
                console.log(
                  "✅ Updated user profile from backend:",
                  profileData.user
                );
                // Update the user object with real backend data
                user.subscriptionTier =
                  profileData.user.subscriptionTier || "free";
                user.subscriptionStatus =
                  profileData.user.subscriptionStatus || "active";
                user.role = profileData.user.role || "user";

                // Recreate session with updated user data
                const updatedSession = SessionManager.createSession(
                  session.access_token,
                  user
                );
                console.log("✅ Session updated with backend user data:", {
                  subscriptionTier: user.subscriptionTier,
                  subscriptionStatus: user.subscriptionStatus,
                  role: user.role,
                });
              }
            } else {
              console.warn(
                "⚠️ Failed to fetch user profile after Google login, using default values"
              );
            }
          } catch (profileError) {
            console.warn(
              "⚠️ Error fetching user profile after Google login:",
              profileError
            );
          }

          toast({
            title: "Login Successful",
            description: "Welcome back!",
          });

          // Use role-based redirect like the regular login flow
          const storedRedirect = sessionStorage.getItem("redirectAfterLogin");
          const targetUrl = AuthUtils.getPostAuthRedirect(
            user,
            storedRedirect || undefined
          );

          console.log("🔧 Google login redirect:", {
            storedRedirect,
            targetUrl,
            userRole: user.role,
          });

          if (storedRedirect) {
            sessionStorage.removeItem("redirectAfterLogin");
          }

          // Use window.location.href to ensure a full page load and proper auth state
          window.location.href = targetUrl;
        } else {
          toast({
            variant: "destructive",
            title: "Authentication Failed",
            description: "No session found. Please try again.",
          });
          window.location.href = "/login";
        }
      } catch (err) {
        console.error("Callback handling error:", err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred during authentication",
        });
        window.location.href = "/login";
      }
    };

    handleCallback();
  }, [toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold mb-2">Completing login...</h2>
        <p className="text-muted-foreground">
          Please wait while we authenticate your account.
        </p>
      </div>
    </div>
  );
}
