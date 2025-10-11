import { apiRequest } from "./queryClient";
import { UniversalStorage } from "./storage";

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "admin" | "user";
  isActive: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionTier: "free" | "basic" | "premium" | "pro" | "elite";
  subscriptionStatus?:
    | "active"
    | "canceled"
    | "past_due"
    | "trialing"
    | "incomplete";
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
  async getSessionSync() {
    // Fetch backend session user info (from cookies/session)
    return await apiRequest("/api/auth/session", {
      method: "GET",
      credentials: "include", // Ensure cookies are sent
    });
  },
  async register(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<AuthResponse> {
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

  async updateSettings(
    token: string,
    settings: Partial<UserSettings>
  ): Promise<UserSettings> {
    return await apiRequest("/api/user/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async updatePassword(
    token: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    return await apiRequest("/api/auth/update-password", {
      method: "POST",
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async updateEmail(
    token: string,
    currentPassword: string,
    newEmail: string
  ): Promise<void> {
    return await apiRequest("/api/auth/update-email", {
      method: "POST",
      body: JSON.stringify({
        currentPassword,
        newEmail,
      }),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async updateProfile(
    token: string,
    updates: {
      firstName?: string;
      lastName?: string;
      bio?: string;
      company?: string;
      website?: string;
      location?: string;
      avatar?: string;
    }
  ): Promise<User> {
    return await apiRequest("/api/user/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async getSignedUploadUrl(
    token: string,
    fileName: string
  ): Promise<{ path: string; token: string; signedUrl: string }> {
    return await apiRequest("/api/storage/signed-upload-url", {
      method: "POST",
      body: JSON.stringify({ fileName }),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },


  async syncUser(): Promise<void> {
    return await apiRequest("/api/auth/sync-user", {
      method: "POST",
      headers: {
        // Credentials will be automatically included via cookies/session
        // Token will be added by apiRequest function
      },
    });
  },
};




// Local storage helpers
export const tokenStorage = {
  get(): string | null {
    return UniversalStorage.getItem("auth_token");
  },

  set(token: string): void {
    UniversalStorage.setItem("auth_token", token);
  },

  remove(): void {
    UniversalStorage.removeItem("auth_token");
  },
};
