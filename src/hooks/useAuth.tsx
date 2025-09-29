import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useToast } from "./use-toast";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getUserRole: () => string;
  getUserDisplayName: () => string;
  getUserInitials: () => string;
  isAdmin: () => boolean;
  isElite: () => boolean;
  databaseUser: any;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [databaseUser, setDatabaseUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check for stored backend authentication first
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Create fake user object for compatibility with normalized fields
        const fakeUser = {
          id: parsedUser.id,
          email: parsedUser.email,
          role: parsedUser.role, // Promote to top level
          subscriptionTier: parsedUser.subscriptionTier, // Promote to top level
          subscriptionStatus: parsedUser.subscriptionStatus, // Promote to top level
          user_metadata: {
            first_name: parsedUser.firstName,
            last_name: parsedUser.lastName,
            role: parsedUser.role,
          }
        };
        setUser(fakeUser as any);
        setDatabaseUser(parsedUser);
        setIsLoading(false);
        console.log('Backend auth restored from localStorage');
        return;
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }

    // Skip Supabase auth if client is not initialized
    if (!supabase) {
      console.log('Supabase client not available');
      setIsLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.warn('Failed to get initial session:', error);
      }
      setIsLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'session_present' : 'no_session');
        
        // Check if we have backend auth before clearing state
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');
        
        // Only update auth state from Supabase if we don't have backend auth
        if (!storedToken || !storedUser) {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Fetch database user data when signed in
          if (session?.user) {
            try {
              const { data: dbUser } = await supabase
                .from('users')
                .select('*')
                .eq('email', session.user.email)
                .single();
              
              setDatabaseUser(dbUser);
              
              // Normalize user object with role and subscription fields at top level
              if (dbUser) {
                const normalizedUser = {
                  ...session.user,
                  role: dbUser.role || session.user.user_metadata?.role || 'user',
                  subscriptionTier: dbUser.subscriptionTier || session.user.user_metadata?.subscriptionTier || 'free',
                  subscriptionStatus: dbUser.subscriptionStatus || session.user.user_metadata?.subscriptionStatus || 'inactive'
                };
                setUser(normalizedUser as any);
              }
            } catch (error) {
              console.error('Error fetching database user:', error);
              setDatabaseUser(null);
            }
          } else {
            setDatabaseUser(null);
          }
          
          setIsLoading(false);

          if (event === 'SIGNED_IN') {
            toast({
              title: "Welcome!",
              description: "You have been signed in successfully.",
            });
          } else if (event === 'SIGNED_OUT') {
            toast({
              title: "Signed out",
              description: "You have been signed out successfully.",
            });
          }
        } else {
          // Backend auth is active, don't let Supabase override it
          console.log('Backend auth detected, preserving auth state');
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [toast]);

  const signInWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Always try backend API first, then fallback to Supabase if it fails
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (response.ok && result.user) {
          // Store token and user data locally
          localStorage.setItem('auth_token', result.token);
          localStorage.setItem('auth_user', JSON.stringify(result.user));
          
          // Create fake user object for compatibility with normalized fields
          const fakeUser = {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role, // Promote to top level
            subscriptionTier: result.user.subscriptionTier, // Promote to top level
            subscriptionStatus: result.user.subscriptionStatus, // Promote to top level
            user_metadata: {
              first_name: result.user.firstName,
              last_name: result.user.lastName,
              role: result.user.role,
            }
          };
          
          setUser(fakeUser as any);
          setDatabaseUser(result.user);
          
          toast({
            title: "Welcome!",
            description: "You have been signed in successfully.",
          });
          
          return;
        }
        // If backend API fails, fall through to try Supabase
      } catch (backendError) {
        console.log('Backend auth failed, trying Supabase...', backendError);
      }

      // Try Supabase Auth if backend API failed and Supabase is available
      if (supabase) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw new Error(error.message);
        }
        return;
      }

      // If both methods fail
      throw new Error("Authentication service not available");
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast({
        title: "Sign in failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, firstName?: string, lastName?: string) => {
    setIsLoading(true);
    try {
      if (!supabase) {
        throw new Error("Authentication service not available");
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      toast({
        title: "Google sign in failed",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
      setIsLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      // Always clear backend auth tokens
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setUser(null);
      setDatabaseUser(null);
      setSession(null);
      
      // Also sign out from Supabase if available
      if (supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.warn('Supabase signOut error:', error.message);
        }
      }
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getUserRole = () => {
    return databaseUser?.role || user?.user_metadata?.role || 'user';
  };

  const isAdmin = () => {
    return getUserRole() === 'admin';
  };

  const isElite = () => {
    return getUserRole() === 'elite' || getUserRole() === 'admin';
  };

  const createAdminUserHandler = async (email: string, password: string, firstName?: string, lastName?: string) => {
    setIsLoading(true);
    try {
      await createAdminUser({ email, password, firstName, lastName });
      
      toast({
        title: "Admin user created!",
        description: "Admin account has been created successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to create admin user",
        description: error.message || "Failed to create admin account",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createEliteUserHandler = async (email: string, password: string, firstName?: string, lastName?: string) => {
    setIsLoading(true);
    try {
      await createEliteUser({ email, password, firstName, lastName });
      
      toast({
        title: "Elite user created!",
        description: "Elite account has been created successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to create elite user",
        description: error.message || "Failed to create elite account",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, role: 'admin' | 'elite' | 'user') => {
    try {
      await updateUserRole(userId, role);
      toast({
        title: "Role updated",
        description: `User role has been updated to ${role}.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to update role",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdateUserSubscription = async (userId: string, tier: 'free' | 'basic' | 'premium' | 'pro' | 'elite') => {
    try {
      await updateUserSubscription(userId, tier);
      toast({
        title: "Subscription updated",
        description: `User subscription has been updated to ${tier}.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to update subscription",
        description: error.message || "Failed to update user subscription",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getUserDisplayName = () => {
    if (!user) return "";
    
    const metadata = user.user_metadata;
    const firstName = metadata?.first_name || "";
    const lastName = metadata?.last_name || "";
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (user.email) {
      return user.email.split("@")[0];
    }
    
    return "User";
  };

  const getUserInitials = () => {
    if (!user) return "";
    
    const metadata = user.user_metadata;
    const firstName = metadata?.first_name || "";
    const lastName = metadata?.last_name || "";
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    } else if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    
    return "U";
  };

  const contextValue: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    getUserRole,
    getUserDisplayName,
    getUserInitials,
    isAdmin,
    isElite,
    createAdminUser: createAdminUserHandler,
    createEliteUser: createEliteUserHandler,
    updateUserRole: handleUpdateUserRole,
    updateUserSubscription: handleUpdateUserSubscription,
    databaseUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}