import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { buildApiUrl } from './config';

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
  // Get token from localStorage for authentication
  const token = localStorage.getItem("auth_token");
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options?.headers,
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fullUrl = buildApiUrl(url);
  console.log('🔗 Making API request to:', fullUrl);
  
  try {
    const res = await fetch(fullUrl, {
      method: options?.method || "GET",
      headers,
      body: options?.body,
      credentials: "include",
    });

    console.log('✅ API response status:', res.status);
    await throwIfResNotOk(res);
    return res.json();
  } catch (error) {
    console.error('❌ API request failed:', error);
    console.error('URL:', fullUrl);
    console.error('Method:', options?.method || "GET");
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get token from localStorage for authentication
    const token = localStorage.getItem("auth_token");
    
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(buildApiUrl(queryKey[0] as string), {
      headers,
      credentials: "include",
    });

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
