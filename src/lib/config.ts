// API Configuration - Centralized environment variable management
export const config = {
  // API Base URL - Use environment variable for production backend
  apiBaseUrl: (import.meta as any).env?.VITE_API_BASE_URL || '',
  
  // WebSocket URL - Use current host for Replit compatibility  
  wsUrl: typeof window !== 'undefined' 
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
    : '',
  
  // Environment detection
  isDevelopment: (import.meta as any).env?.DEV || false,
  isProduction: (import.meta as any).env?.PROD || false,
  
  // App configuration
  appName: 'Proud Profits',
  version: '1.0.0',
};

// API endpoint builder - Use relative URLs by default
export const buildApiUrl = (endpoint: string) => {
  // Ensure endpoint is a string before calling string methods
  if (typeof endpoint !== 'string') {
    console.warn('buildApiUrl: endpoint is not a string', endpoint);
    return '/api/fallback';
  }
  
  // If endpoint is already a full URL, return as-is
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // If VITE_API_BASE_URL is explicitly set, use it
  if (config.apiBaseUrl) {
    return `${config.apiBaseUrl}${cleanEndpoint}`;
  }
  
  // Otherwise return relative URL for same-origin requests
  return cleanEndpoint;
};

// WebSocket URL builder - Use current host for WebSocket connections
export const buildWsUrl = (path: string = '') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${cleanPath}`;
  }
  return `ws://localhost:3000${cleanPath}`;
};

// Environment variable validation
export const validateConfig = () => {
  const missing: string[] = [];
  
  if (!config.apiBaseUrl) {
    console.log('Using relative URLs for API calls (same-origin)');
  }
  
  // Validate WebSocket URL construction
  if (typeof window !== 'undefined') {
    try {
      const testWsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
      new URL(testWsUrl); // Test if URL is valid
      config.wsUrl = testWsUrl;
    } catch (error) {
      console.warn('Invalid WebSocket URL construction:', error);
      config.wsUrl = ''; // Clear invalid URL
    }
  }
  
  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing);
  }
  
  console.log('API Configuration:', {
    apiBaseUrl: config.apiBaseUrl || 'relative URLs',
    wsUrl: config.wsUrl || 'not configured',
    environment: config.isDevelopment ? 'development' : 'production'
  });
};

// Initialize configuration validation on load
validateConfig();// Cache bust Sun Sep  7 10:35:17 AM UTC 2025
