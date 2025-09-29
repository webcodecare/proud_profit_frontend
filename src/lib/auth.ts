import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "admin" | "user";
  isActive: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionTier: "free" | "basic" | "premium" | "pro";
  subscriptionStatus?: "active" | "canceled" | "past_due" | "trialing" | "incomplete";
  subscriptionEndsAt?: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  notificationEmail: boolean;
  notificationSms: boolean;
  notificationPush: boolean;
  theme: "light" | "dark";
  language: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ProfileResponse {
  user: User;
  settings?: UserSettings;
}

export const authAPI = {
  async register(email: string, password: string, firstName?: string, lastName?: string): Promise<AuthResponse> {
    return await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
      }),
    });
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      return await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });
    } catch (error: any) {
      console.error("Login API error:", error);
      throw error;
    }
  },

  async getProfile(token: string): Promise<ProfileResponse> {
    return await apiRequest("/api/user/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async updateSettings(token: string, settings: Partial<UserSettings>): Promise<UserSettings> {
    return await apiRequest("/api/user/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// Local storage helpers
export const tokenStorage = {
  get(): string | null {
    return localStorage.getItem("auth_token");
  },

  set(token: string): void {
    localStorage.setItem("auth_token", token);
  },

  remove(): void {
    localStorage.removeItem("auth_token");
  },
};
