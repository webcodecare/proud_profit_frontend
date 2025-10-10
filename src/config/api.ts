// API Configuration for Frontend
const BASE_URL_FROM_ENV = (import.meta as any).env?.VITE_API_BASE_URL;
console.log("Environment VITE_API_BASE_URL:", BASE_URL_FROM_ENV);

export const API_CONFIG = {
  // Use empty string to make relative URLs that go through Vite proxy
  // The proxy in vite.config.ts forwards /api requests to the backend
  BASE_URL: BASE_URL_FROM_ENV,

  // API endpoints
  ENDPOINTS: {
    // Auth
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
    PROFILE: "/api/user/profile",

    // Market Data
    MARKET_PRICE: "/api/public/market/price",
    OHLC_DATA: "/api/public/ohlc",
    SIGNALS: "/api/public/signals/alerts",

    // Private APIs (require authentication)
    USER_ALERTS: "/api/alerts",
    SUBSCRIPTION: "/api/subscription",
    USER_SUBSCRIPTIONS: "/api/user/subscriptions",
    PAYMENT: "/api/payment",
  },

  // Request configuration
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
} as const;

// Helper function to build full API URLs
export function buildApiUrl(endpoint: string): string {
  // Use relative URLs if no base URL is configured
  return API_CONFIG.BASE_URL ? `${API_CONFIG.BASE_URL}${endpoint}` : endpoint;
}

// Helper function to build market price URL
export function buildMarketPriceUrl(symbol: string): string {
  return buildApiUrl(`${API_CONFIG.ENDPOINTS.MARKET_PRICE}/${symbol}`);
}

// Helper function to build OHLC data URL
export function buildOhlcUrl(
  symbol: string,
  interval: string,
  limit?: number
): string {
  const params = new URLSearchParams({
    symbol,
    interval,
    ...(limit && { limit: limit.toString() }),
  });
  return buildApiUrl(`${API_CONFIG.ENDPOINTS.OHLC_DATA}?${params}`);
}

// Helper function to build signals URL
export function buildSignalsUrl(
  ticker: string,
  timeframe: string,
  days?: number
): string {
  const params = new URLSearchParams({
    ticker,
    timeframe,
    ...(days && { days: days.toString() }),
  });
  return buildApiUrl(`${API_CONFIG.ENDPOINTS.SIGNALS}?${params}`);
}
