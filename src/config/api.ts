// Environment guard - ensure BASE_URL is configured
const getBaseUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!baseUrl && import.meta.env.NODE_ENV !== 'test') {
    console.warn('VITE_API_BASE_URL not configured. Falling back to localhost:5000');
    return 'http://localhost:5000';
  }
  return baseUrl || '';
};

// API Configuration for Separated Frontend
export const API_CONFIG = {
  // Backend API URL - will be different for development and production
  BASE_URL: getBaseUrl(),
  
  // API endpoints (matching proud_profit backend routes)
  ENDPOINTS: {
    // Auth
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/user/profile',
    
    // Market Data
    MARKET_PRICE: '/api/public/market/price',
    OHLC_DATA: '/api/market/ohlc',
    SIGNALS: '/api/public/signals/alerts',
    
    // Private APIs (require authentication)
    USER_ALERTS: '/api/alerts',
    SUBSCRIPTION: '/api/subscription',
    PAYMENTS: '/api/payments',
    PAYMENT_CREATE_INTENT: '/api/payments/create-intent',
    
    // Backward compatibility
    PAYMENT: '/api/payments', // Alias for PAYMENTS to maintain backward compatibility
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
export function buildOhlcUrl(symbol: string, interval: string, limit?: number): string {
  const params = new URLSearchParams({
    symbol,
    interval,
    ...(limit && { limit: limit.toString() })
  });
  return buildApiUrl(`${API_CONFIG.ENDPOINTS.OHLC_DATA}?${params}`);
}

// Helper function to build signals URL
export function buildSignalsUrl(ticker: string, timeframe: string, days?: number): string {
  const params = new URLSearchParams({
    ticker,
    timeframe,
    ...(days && { days: days.toString() })
  });
  return buildApiUrl(`${API_CONFIG.ENDPOINTS.SIGNALS}?${params}`);
}