import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authAPI, tokenStorage, User, UserSettings } from "@/lib/auth";
type AuthResponse = {
  token?: string;
  user?: User;
  session?: { access_token: string };
};
import { useToast } from "@/hooks/use-toast";
import { SessionManager } from "@/lib/sessionManager";
import { AuthUtils } from "@/lib/authUtils";
import { syncUserWithDatabaseSafe } from "@/lib/userSync";
import { TokenManager } from "@/lib/tokenManager";

interface AuthContextType {
  user: User | null;
  settings: UserSettings | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ user: User | undefined; token: string }>;
  register: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => Promise<void>;
  logout: () => void;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  extendSession: () => void;
  hasPermission: (requiredRole?: string) => boolean;
  getUserDisplayName: () => string;
  getUserInitials: () => string;
  refreshUser: () => Promise<void>;
  updateUserSession: (user: User) => void;
  refreshAuthState: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Listen for Google login completion and force auth state refresh
  const [token, setToken] = useState<string | null>(() => {
    // Try session manager first, fallback to legacy token storage
    return SessionManager.getToken() || tokenStorage.get();
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Function to refresh auth state (declared early for use in effects)
  const refreshAuthState = useCallback(() => {
    console.log("🔄 Refreshing auth state...");
    const newToken = SessionManager.getToken() || tokenStorage.get();
    console.log("🔄 Current token:", token?.substring(0, 20) + "...");
    console.log("🔄 New token found:", newToken?.substring(0, 20) + "...");

    if (newToken && newToken !== token) {
      console.log("✅ Found new token, updating auth state");
      setToken(newToken);

      // Also trigger a query refetch to get fresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    } else if (newToken) {
      console.log("🔄 Token unchanged but triggering query refresh");
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    } else {
      console.log("🔄 No token found during refresh");
    }
  }, [token, queryClient]);

  useEffect(() => {
    const checkGoogleLoginFlag = () => {
      if (localStorage.getItem("google_login_complete")) {
        console.log(
          "🔄 Detected Google login completion, refreshing auth state"
        );
        refreshAuthState();
        queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
        localStorage.removeItem("google_login_complete");
      }
    };
    window.addEventListener("storage", checkGoogleLoginFlag);
    checkGoogleLoginFlag();
    return () => window.removeEventListener("storage", checkGoogleLoginFlag);
  }, [refreshAuthState, queryClient]);

  // Initialize session on mount with validation
  useEffect(() => {
    console.log("🔧 Initializing auth session on mount");

    // Check for session data in localStorage
    const sessionDataRaw = localStorage.getItem("crypto_session");
    console.log("🔧 Raw session data exists:", !!sessionDataRaw);
    if (sessionDataRaw) {
      console.log("🔧 Session data preview:", sessionDataRaw.substring(0, 100));
    }

    const session = SessionManager.getSession();
    console.log("🔧 Session found:", !!session);
    if (session) {
      console.log("🔧 Session details:", {
        hasToken: !!session.token,
        hasUser: !!session.user,
        userId: session.user?.id,
        userRole: session.user?.role,
        isValid: SessionManager.isValidSession(),
      });
    }

    if (session && SessionManager.isValidSession()) {
      console.log("🔧 ✅ Valid session found, setting token");
      setToken(session.token);
    } else {
      console.log("🔧 No valid session from SessionManager");

      // Try legacy token migration BEFORE clearing anything
      const legacyToken = tokenStorage.get();
      console.log("🔧 Legacy token check:", !!legacyToken);

      if (legacyToken) {
        console.log("🔧 ✅ Using legacy token");
        setToken(legacyToken);
      } else {
        console.log("🔧 ⚠️ No token found - user not authenticated");
        setToken(null);
        // DON'T clear auth data on initial mount - it breaks the login flow
      }
    }
  }, []);

  // Try to get cached user from session first (avoids unnecessary API calls)
  const cachedUser = token ? SessionManager.getUser() : null;

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["/api/user/profile", token],
    queryFn: async () => {
      if (!token) return null;

      try {
        console.log(
          "🔧 Fetching profile with token:",
          token?.substring(0, 20) + "..."
        );
        console.log("🔧 Token length:", token?.length);
        const profile = await authAPI.getProfile(token);
        console.log("🔧 Profile fetched successfully:", {
          userId: profile?.user?.id,
          role: profile?.user?.role,
          subscriptionTier: profile?.user?.subscriptionTier,
          subscriptionStatus: profile?.user?.subscriptionStatus,
        });

        // Update session with fresh backend data
        if (profile?.user) {
          SessionManager.createSession(token, profile.user);
        }

        return profile;
      } catch (error: any) {
        // Don't clear auth data if we have cached user - profile fetch might fail due to token format mismatch
        console.error("❌ Profile fetch failed");
        console.error("❌ Error details:", {
          message: error?.message,
          status: error?.status,
          code: error?.code,
        });

        // If we still have a valid session with user data, keep using it
        const fallbackUser = SessionManager.getUser();
        if (fallbackUser) {
          console.log(
            "⚠️ Profile fetch failed but using cached session user as fallback"
          );
          return { user: fallbackUser, settings: null };
        }

        // Only clear auth if we have no cached user data
        console.error("❌ No cached user data, clearing auth");
        setToken(null);
        AuthUtils.clearAllAuthData().catch(console.error);
        return null;
      }
    },
    enabled: !!token,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const data: AuthResponse = await authAPI.login(email, password);
      // Handle both response formats: {token: "..."} and {session: {access_token: "..."}}
      const token = data.token || data.session?.access_token;
      const user = data.user;
      if (!token) {
        throw new Error(
          "Login successful but no authentication token received"
        );
      }
      setToken(token);
      SessionManager.createSession(token, user);
      tokenStorage.set(token);
      await syncUserWithDatabaseSafe(token);
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({ title: "Login successful", description: "Welcome back!" });
      return { user, token };
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({
      email,
      password,
      firstName,
      lastName,
    }: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    }) => authAPI.register(email, password, firstName, lastName),
    onSuccess: async (data: any) => {
      // Handle both response formats: {token: "..."} and {session: {access_token: "..."}}
      const token = data.token || data.session?.access_token;

      if (!token) {
        console.error("❌ No token found in registration response:", data);
        throw new Error(
          "Registration successful but no authentication token received"
        );
      }

      setToken(token);
      // Create session with user data
      SessionManager.createSession(token, data.user);
      tokenStorage.set(token); // Keep legacy support

      // Call sync-user endpoint to ensure user exists in database
      await syncUserWithDatabaseSafe(token);

      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });

      // Role-based redirect after registration (most new users are not admins, but handle edge cases)
      const storedRedirect = sessionStorage.getItem("redirectAfterLogin");
      const targetUrl = AuthUtils.getPostAuthRedirect(
        data.user,
        storedRedirect || undefined
      );
      if (storedRedirect) {
        sessionStorage.removeItem("redirectAfterLogin");
      }
      window.location.href = targetUrl;

      toast({
        title: "Registration successful",
        description: "Welcome to Proud Profits!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: Partial<UserSettings>) =>
      token
        ? authAPI.updateSettings(token, settings)
        : Promise.reject("No token"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const login = async (email: string, password: string) => {
    console.log("Login attempt:", {
      email,
      password: password.replace(/./g, "*"),
      mode: "login",
    });
    console.log("Calling login function with:", {
      email,
      password: password.substring(0, 3) + "*".repeat(password.length - 3),
    });
    try {
      const result = await loginMutation.mutateAsync({ email, password });
      console.log("Login result:", result);
      console.log("User from login result:", result?.user);
      console.log("User role from login:", result?.user?.role);

      // Session sync check: ensure backend and frontend user IDs match
      try {
        const syncRes = await authAPI.getSessionSync(); // Should return backend user info
        if (
          syncRes?.user?.id &&
          result?.user?.id &&
          syncRes.user.id !== result.user.id
        ) {
          console.warn(
            "Session mismatch: frontend user ID does not match backend user ID. Forcing logout."
          );
          logout();
          toast({
            title: "Session Mismatch",
            description: "Your session was out of sync. Please login again.",
            variant: "destructive",
          });
          window.location.href = "/login";
          return result;
        }
      } catch (syncErr) {
        console.warn("Session sync check failed:", syncErr);
      }

      // Ensure we return the complete result including user data
      return result;
    } catch (error) {
      console.error("Full authentication error:", error);
      console.error(
        "Error message:",
        error instanceof Error ? error.message : "Unknown error"
      );
      console.error("Error status:", (error as any)?.status || null);
      console.error("Error code:", (error as any)?.code || null);
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => {
    await registerMutation.mutateAsync({
      email,
      password,
      firstName,
      lastName,
    });
  };

  const logout = async () => {
    try {
      AuthUtils.logSecurityEvent("USER_LOGOUT", {
        userId: profileData?.user?.id,
      });

      // Clear all local auth data (including Supabase session)
      setToken(null);
      await TokenManager.clearTokens(); // Clear all tokens including Supabase
      await AuthUtils.clearAllAuthData();
      queryClient.clear();

      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });

      // Redirect to login page with a timestamp to force refresh
      const timestamp = new Date().getTime();
      window.location.href = `/login?t=${timestamp}`;
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, clear local data and redirect
      setToken(null);
      const timestamp = new Date().getTime();
      window.location.href = `/login?t=${timestamp}`;
    }
  };

  const extendSession = async () => {
    try {
      // Try to refresh the token instead of just extending session
      const refreshResult = await TokenManager.refreshToken();

      if (refreshResult.success && refreshResult.token) {
        setToken(refreshResult.token);
        AuthUtils.logSecurityEvent("SESSION_EXTENDED", {
          userId: profileData?.user?.id,
        });
        toast({
          title: "Session extended",
          description: "Your session has been refreshed",
        });
      } else {
        // If refresh fails, extend current session
        SessionManager.extendSession();
        AuthUtils.logSecurityEvent("SESSION_EXTENDED", {
          userId: profileData?.user?.id,
        });
        toast({
          title: "Session extended",
          description: "Your session has been extended",
        });
      }
    } catch (error) {
      console.error("Session extension failed:", error);
      toast({
        title: "Session extension failed",
        description: "Please login again if you experience issues",
        variant: "destructive",
      });
    }
  };

  const hasPermission = (requiredRole?: string) => {
    return AuthUtils.hasPermission(profileData?.user, requiredRole);
  };

  const getUserDisplayName = () => {
    return AuthUtils.getUserDisplayName(profileData?.user);
  };

  const getUserInitials = () => {
    return AuthUtils.getUserInitials(profileData?.user);
  };

  const updateSettings = async (settings: Partial<UserSettings>) => {
    await updateSettingsMutation.mutateAsync(settings);
  };

  // Function to refresh user data after subscription changes
  const refreshUser = async () => {
    if (token) {
      console.log("🔄 refreshUser: Forcing backend profile fetch");

      try {
        // Force fetch from backend and update session
        const profile = await authAPI.getProfile(token);
        if (profile?.user) {
          console.log("🔄 refreshUser: Got fresh profile from backend:", {
            userId: profile.user.id,
            subscriptionTier: profile.user.subscriptionTier,
            subscriptionStatus: profile.user.subscriptionStatus,
            role: profile.user.role,
          });

          // Update session with fresh user data
          SessionManager.createSession(token, profile.user);

          // Invalidate and refetch queries to trigger re-render
          await queryClient.invalidateQueries({
            queryKey: ["/api/user/profile", token],
          });
        }
      } catch (error) {
        console.error("🔄 refreshUser: Failed to fetch fresh profile:", error);

        // Fallback to query invalidation
        await queryClient.invalidateQueries({
          queryKey: ["/api/user/profile", token],
        });
        await queryClient.refetchQueries({
          queryKey: ["/api/user/profile", token],
        });
      }
    }
  };

  // Periodic refresh of user data to ensure subscription status stays current
  useEffect(() => {
    if (!token) return;

    // Set up interval to refresh user data every 5 minutes
    const refreshInterval = setInterval(() => {
      console.log("🔄 Periodic user data refresh");
      refreshUser();
    }, 5 * 60 * 1000); // 5 minutes

    // Also refresh when user returns to tab (e.g., after payment on another tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("🔄 Tab became visible, refreshing user data");
        refreshUser();
      }
    };

    const handleFocus = () => {
      console.log("🔄 Window focused, refreshing user data");
      refreshUser();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [token]);

  // Function to update user data in session after subscription change
  const updateUserSession = (updatedUser: User) => {
    if (token) {
      SessionManager.createSession(token, updatedUser);
    }
  };

  // Use cached user from session if profile fetch is pending or failed
  // This prevents the black screen issue when profile fetch hasn't completed yet
  const authUser = profileData?.user || cachedUser || null;
  const isAuthenticated = !!token && !!authUser;

  // Debug logging for user subscription data
  useEffect(() => {
    if (authUser) {
      console.log("🔍 Current authUser object in useAuth:", {
        id: authUser.id,
        email: authUser.email,
        role: authUser.role,
        subscriptionTier: authUser.subscriptionTier,
        subscriptionStatus: authUser.subscriptionStatus,
        isActive: authUser.isActive,
        source: profileData?.user ? "profileData" : "cachedUser",
      });
    }
    if (cachedUser) {
      console.log("🔍 Cached user data:", {
        subscriptionTier: cachedUser.subscriptionTier,
        subscriptionStatus: cachedUser.subscriptionStatus,
      });
    }
    if (profileData?.user) {
      console.log("🔍 Profile data user:", {
        subscriptionTier: profileData.user.subscriptionTier,
        subscriptionStatus: profileData.user.subscriptionStatus,
      });
    }
  }, [authUser, cachedUser, profileData?.user]);

  const contextValue: AuthContextType = {
    user: authUser,
    settings: profileData?.settings || null,
    isLoading:
      isLoading || loginMutation.isPending || registerMutation.isPending,
    isAuthenticated,
    login,
    register,
    logout,
    updateSettings,
    extendSession,
    hasPermission,
    getUserDisplayName,
    getUserInitials,
    refreshUser,
    updateUserSession,
    refreshAuthState,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
