import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { AuthUtils } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bitcoin,
  Mail,
  Lock,
  User,
  AlertCircle,
  Loader2,
  SendIcon,
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import StorageBlockedWarning from "@/components/auth/StorageBlockedWarning";

export default function Auth() {
  const [, setLocation] = useLocation();
  const { login, register, isLoading, isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  // Redirect if already authenticated with role-based logic
  React.useEffect(() => {
    // Don't redirect while loading - wait for auth state to be determined
    if (isLoading) {
      console.log("Auth loading, waiting...");
      return;
    }

    if (isAuthenticated && user) {
      const storedRedirect = sessionStorage.getItem("redirectAfterLogin");
      const targetUrl = AuthUtils.getPostAuthRedirect(
        user,
        storedRedirect || undefined
      );
      console.log(
        "User already authenticated, redirecting to:",
        targetUrl,
        "User role:",
        user.role
      );
      if (storedRedirect) {
        sessionStorage.removeItem("redirectAfterLogin");
      }
      // Use window.location for immediate redirect with full page reload
      window.location.href = targetUrl;
    }
  }, [isAuthenticated, user, isLoading]);

  const handleGoogleLogin = async () => {
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log("🔧 Google OAuth Configuration:");
      console.log("- Current origin:", window.location.origin);
      console.log("- Redirect URL:", redirectUrl);
      console.log("- Expected URL: http://localhost:5173/auth/callback");

      // Use Supabase Google OAuth - fully frontend solution
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      console.log("Google OAuth redirect URL:", redirectUrl);
      console.log(data, "data from google login");

      if (error) {
        toast({
          variant: "destructive",
          title: "Google Login Failed",
          description: error.message || "Failed to initiate Google login",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to connect to Google",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Debug logging
    console.log("Login attempt:", {
      email: formData.email,
      password: "***" + formData.password.slice(-3),
      mode,
    });

    try {
      if (mode === "login") {
        console.log("Calling login function with:", {
          email: formData.email.trim(),
          password: "***",
        });
        const result = await login(
          formData.email.trim(),
          formData.password.trim()
        );
        console.log("Login result:", result);
        console.log("User from result:", result?.user);
        console.log("User role:", result?.user?.role);

        // Role-based redirect after login - use user data from login response
        const loggedInUser = result?.user;
        if (!loggedInUser) {
          console.error("No user data in login response");
          setError(
            "Login successful but user data not available. Please refresh the page."
          );
          return;
        }

        const storedRedirect = sessionStorage.getItem("redirectAfterLogin");
        const targetUrl = AuthUtils.getPostAuthRedirect(
          loggedInUser,
          storedRedirect || undefined
        );
        console.log("Redirecting to:", targetUrl);

        if (storedRedirect) {
          sessionStorage.removeItem("redirectAfterLogin");
        }

        // Session is saved, redirect immediately
        console.log("✅ Login successful, redirecting to:", targetUrl);
        window.location.href = targetUrl;
      } else {
        await register(
          formData.email.trim(),
          formData.password.trim(),
          formData.firstName,
          formData.lastName
        );
        // Registration already handles redirect in useAuth
        // setLocation("/dashboard");
      }
    } catch (err: any) {
      console.error("Full authentication error:", err);
      console.error("Error message:", err?.message);
      console.error("Error status:", err?.status);
      console.error("Error code:", err?.code);
      // Parse error message from server response
      let errorMessage = "Authentication failed";

      if (err.message) {
        // Check if the error already has a clean message (from our improved queryClient)
        if (err.code === "INVALID_CREDENTIALS") {
          errorMessage =
            mode === "login"
              ? "Invalid email or password. Please check your credentials."
              : "Authentication failed. Please try again.";
        } else if (err.code === "USER_EXISTS") {
          errorMessage =
            "An account with this email already exists. Please try logging in instead.";
        } else if (err.status === 401) {
          errorMessage =
            mode === "login"
              ? "Invalid email or password. Please check your credentials."
              : "Authentication failed. Please try again.";
        } else if (err.status === 409) {
          errorMessage =
            "An account with this email already exists. Please try logging in instead.";
        } else if (err.status === 422 || err.status === 400) {
          errorMessage = "Please check your information and try again.";
        } else if (err.status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else {
          // Use the error message directly if it's already clean
          errorMessage = err.message || "Authentication failed";

          // Fallback: try to parse JSON from legacy error format
          try {
            if (err.message.includes('{"message"')) {
              const jsonMatch = err.message.match(/\{.*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.message) {
                  errorMessage = parsed.message;
                  if (parsed.code === "INVALID_CREDENTIALS") {
                    errorMessage =
                      "Invalid email or password. Please check your credentials.";
                  }
                }
              }
            } else if (err.message.includes("401:")) {
              errorMessage =
                "Invalid email or password. Please check your credentials.";
            }
          } catch {
            // Clean up raw error message as last resort
            errorMessage =
              err.message.replace(/^\d+:\s*/, "").replace(/^Error:\s*/, "") ||
              "Authentication failed";
          }
        }
      }

      setError(errorMessage);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address.",
      });
      return;
    }

    setForgotPasswordLoading(true);
    try {
      await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: forgotPasswordEmail.trim() }),
      });

      setForgotPasswordSent(true);
      toast({
        title: "Reset Link Sent",
        description:
          "If an account exists with this email, you'll receive password reset instructions.",
      });
    } catch (err: any) {
      console.error("Forgot password error:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          err.message || "Failed to send reset email. Please try again.",
      });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <StorageBlockedWarning />
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="flex items-center justify-center">
            <img
              src="/proud-profits-logo.png"
              alt="Proud Profits"
              className="h-16 object-contain"
            />
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Sign in to access your trading dashboard"
                : "Join thousands of successful crypto traders"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    required
                    className="pl-10"
                    data-testid="input-password"
                  />
                </div>
                {mode === "login" && (
                  <div className="text-right">
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto"
                      onClick={() => setShowForgotPassword(true)}
                      data-testid="button-forgot-password"
                    >
                      Forgot password?
                    </Button>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full crypto-gradient text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "login" ? "Signing in..." : "Creating account..."}
                  </>
                ) : mode === "login" ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            {/* Google Login for Users Only */}
            {mode === "login" && (
              <>
                <div className="my-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  className="w-full"
                  disabled={isLoading}
                >
                  <FcGoogle className="mr-2 h-4 w-4" />
                  Sign in with Google
                </Button>
              </>
            )}

            <Separator className="my-6" />

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {mode === "login"
                  ? "Don't have an account?"
                  : "Already have an account?"}
              </p>
              <Button
                variant="link"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-primary"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </Button>
            </div>

            <div className="text-center mt-6">
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to home
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Forgot Password Dialog */}
        <Dialog
          open={showForgotPassword}
          onOpenChange={(open) => {
            setShowForgotPassword(open);
            if (!open) {
              setForgotPasswordEmail("");
              setForgotPasswordSent(false);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Enter your email address and we'll send you a link to reset your
                password.
              </DialogDescription>
            </DialogHeader>

            {forgotPasswordSent ? (
              <div className="text-center py-6">
                <div className="flex justify-center mb-4">
                  <Mail className="h-12 w-12 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Check Your Email</h3>
                <p className="text-muted-foreground">
                  If an account exists with{" "}
                  <strong>{forgotPasswordEmail}</strong>, you'll receive
                  password reset instructions within a few minutes.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail("");
                    setForgotPasswordSent(false);
                  }}
                  data-testid="button-close-forgot-password"
                >
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgotPasswordEmail">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="forgotPasswordEmail"
                      type="email"
                      placeholder="john@example.com"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      required
                      className="pl-10"
                      data-testid="input-forgot-password-email"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForgotPassword(false)}
                    className="flex-1"
                    data-testid="button-cancel-forgot-password"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={forgotPasswordLoading}
                    className="flex-1"
                    data-testid="button-send-reset-email"
                  >
                    {forgotPasswordLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <SendIcon className="mr-2 h-4 w-4" />
                        Send Reset Link
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
