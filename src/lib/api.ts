import { SessionManager } from "./sessionManager";
import { tokenStorage } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const getAuthToken = (): string | null => {
  const session = SessionManager.getSession();
  if (session?.token) {
    return session.token;
  }
  return tokenStorage.get();
};

// Support both old and new API patterns for backward compatibility
export const apiRequest = async (
  methodOrEndpoint: string,
  endpointOrOptions?: string | RequestInit,
  data?: any
): Promise<any> => {
  let method: string;
  let endpoint: string;
  let options: RequestInit = {};

  // Handle both old and new calling patterns
  if (typeof endpointOrOptions === "string") {
    // Old pattern: apiRequest('POST', '/api/endpoint', data)
    method = methodOrEndpoint.toUpperCase();
    endpoint = endpointOrOptions;
    if (data) {
      options = {
        method,
        body: JSON.stringify(data),
      };
    } else {
      options = { method };
    }
  } else {
    // New pattern: apiRequest('/api/endpoint', { method: 'POST', body: JSON.stringify(data) })
    endpoint = methodOrEndpoint;
    options = endpointOrOptions || {};
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const defaultOptions: RequestInit = {
    credentials: "include",
    headers,
  };

  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;

      try {
        const errorData = await response.json();
        if (errorData.error || errorData.message) {
          errorMessage = errorData.error || errorData.message;
        }
      } catch (e) {
        // If response is not JSON, use the status text
      }

      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred");
  }
};

export const apiGet = (endpoint: string) => apiRequest(endpoint);

export const apiPost = (endpoint: string, data: any) =>
  apiRequest(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const apiPut = (endpoint: string, data: any) =>
  apiRequest(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const apiDelete = (endpoint: string, data?: any) =>
  apiRequest(endpoint, {
    method: "DELETE",
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiPatch = (endpoint: string, data: any) =>
  apiRequest(endpoint, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
