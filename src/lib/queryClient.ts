import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { buildApiUrl } from "../config/api";
import { TokenManager } from "./tokenManager";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;

    // Try to parse JSON error response for cleaner messages
    try {
      const errorData = JSON.parse(text);
      if (errorData.message) {
        // Create a custom error with clean message
        const error = new Error(errorData.message);
        (error as any).status = res.status;
        (error as any).code = errorData.code;
        throw error;
      }
    } catch (parseError) {
      // If JSON parsing fails, use the original approach
    }

    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  options?: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
  }
): Promise<any> {
  // Get a valid token (with auto-refresh if needed)
  const token = await TokenManager.getValidToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options?.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log(`✅ Authorization header set with refreshed token`);
  } else {
    console.error("❌ No valid token available for authorization!");
  }

  const fullUrl = buildApiUrl(url);
  console.log("� Making API request to:", fullUrl);

  try {
    const res = await fetch(fullUrl, {
      method: options?.method || "GET",
      headers,
      body: options?.body,
      credentials: "include",
    });

    console.log("✅ API response status:", res.status);

    // If we get 401, the token might be expired - try to refresh and retry once
    if (res.status === 401 && token) {
      console.log("� Got 401, attempting token refresh and retry...");
      const refreshResult = await TokenManager.refreshToken();

      if (refreshResult.success && refreshResult.token) {
        console.log("✅ Token refreshed, retrying request...");
        headers["Authorization"] = `Bearer ${refreshResult.token}`;

        const retryRes = await fetch(fullUrl, {
          method: options?.method || "GET",
          headers,
          body: options?.body,
          credentials: "include",
        });

        await throwIfResNotOk(retryRes);
        return retryRes.json();
      } else {
        console.error(
          "❌ Token refresh failed, clearing auth and throwing error"
        );
        TokenManager.clearTokens().catch(console.error);
        throw new Error("Session expired. Please login again.");
      }
    }

    await throwIfResNotOk(res);
    return res.json();
  } catch (error) {
    console.error("❌ API request failed:", error);
    console.error("URL:", fullUrl);
    console.error("Method:", options?.method || "GET");
    console.error("Token was:", token ? "present" : "missing");
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get a valid token (with auto-refresh if needed)
    const token = await TokenManager.getValidToken();

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(buildApiUrl(queryKey[0] as string), {
      headers,
      credentials: "include",
    });

    // If we get 401 and have a token, try to refresh and retry
    if (res.status === 401 && token) {
      console.log("🔄 Query got 401, attempting token refresh and retry...");
      const refreshResult = await TokenManager.refreshToken();

      if (refreshResult.success && refreshResult.token) {
        headers["Authorization"] = `Bearer ${refreshResult.token}`;

        const retryRes = await fetch(buildApiUrl(queryKey[0] as string), {
          headers,
          credentials: "include",
        });

        if (retryRes.status === 401 && unauthorizedBehavior === "returnNull") {
          return null;
        }

        await throwIfResNotOk(retryRes);
        return await retryRes.json();
      } else {
        TokenManager.clearTokens().catch(console.error);
        if (unauthorizedBehavior === "throw") {
          throw new Error("Session expired. Please login again.");
        }
        return null;
      }
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
