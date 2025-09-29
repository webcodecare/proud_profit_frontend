import { buildApiUrl } from '../lib/config';

export interface PriceData {
  symbol: string;
  price: number;
  change24h?: number;
  changePercent24h?: number;
  volume24h?: number;
  high24h?: number;
  low24h?: number;
  source?: string;
  lastUpdate?: string;
}

export interface OHLCData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AlertSignal {
  id: string;
  ticker: string;
  signalType: 'buy' | 'sell';
  price: number;
  timestamp: string;
  timeframe: string;
  notes?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  subscriptionTier: string;
  subscriptionStatus?: string;
  role: string;
}

class ApiService {
  private async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem('authToken');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return fetch(buildApiUrl(endpoint), {
      ...options,
      headers,
      credentials: 'include',
    });
  }

  async getMarketPrice(symbol: string): Promise<PriceData> {
    try {
      const response = await fetch(buildApiUrl(`/api/public/market/price/${symbol}`));
      if (!response.ok) {
        throw new Error(`Failed to fetch price for ${symbol}: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      // Return fallback data for demo purposes
      return {
        symbol,
        price: this.generateFallbackPrice(symbol),
        change24h: Math.random() * 1000 - 500,
        changePercent24h: (Math.random() - 0.5) * 10,
        volume24h: Math.random() * 1000000000,
        high24h: this.generateFallbackPrice(symbol) * 1.05,
        low24h: this.generateFallbackPrice(symbol) * 0.95,
        source: 'fallback',
        lastUpdate: new Date().toISOString(),
      };
    }
  }

  async getOHLCData(symbol: string, interval: string = '1w', limit: number = 104): Promise<OHLCData[]> {
    try {
      const response = await fetch(buildApiUrl(`/api/public/ohlc?symbol=${symbol}&interval=${interval}&limit=${limit}`));
      if (!response.ok) {
        throw new Error(`Failed to fetch OHLC data for ${symbol}: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching OHLC data for ${symbol}:`, error);
      // Return fallback OHLC data
      return this.generateFallbackOHLC(symbol, limit);
    }
  }

  async getSignalAlerts(ticker: string, timeframe: string = '1W'): Promise<AlertSignal[]> {
    try {
      const response = await fetch(buildApiUrl(`/api/public/signals/alerts?ticker=${ticker}&timeframe=${timeframe}`));
      if (!response.ok) {
        throw new Error(`Failed to fetch signals for ${ticker}: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching signals for ${ticker}:`, error);
      return [];
    }
  }

  async getUserProfile(): Promise<UserProfile> {
    try {
      const response = await this.fetchWithAuth('/api/user/profile');
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Not authenticated');
        }
        throw new Error(`Failed to fetch user profile: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<{ token: string; user: UserProfile }> {
    try {
      const response = await fetch(buildApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(email: string, password: string, firstName?: string, lastName?: string): Promise<{ token: string; user: UserProfile }> {
    try {
      const response = await fetch(buildApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, firstName, lastName }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Registration failed' }));
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  logout(): void {
    localStorage.removeItem('authToken');
  }

  private generateFallbackPrice(symbol: string): number {
    const basePrices: { [key: string]: number } = {
      'BTCUSDT': 65000,
      'ETHUSDT': 3200,
      'SOLUSDT': 150,
      'ADAUSDT': 0.45,
      'XRPUSDT': 0.52,
    };
    
    const basePrice = basePrices[symbol] || 100;
    // Add some random variation
    return basePrice + (Math.random() - 0.5) * basePrice * 0.1;
  }

  private generateFallbackOHLC(symbol: string, limit: number): OHLCData[] {
    const data: OHLCData[] = [];
    const basePrice = this.generateFallbackPrice(symbol);
    let currentPrice = basePrice;
    
    for (let i = limit - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7)); // Weekly data
      
      const variation = (Math.random() - 0.5) * 0.1;
      const open = currentPrice;
      const volatility = Math.random() * 0.05;
      const high = open * (1 + volatility);
      const low = open * (1 - volatility);
      const close = open * (1 + variation);
      
      data.push({
        time: date.toISOString(),
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.random() * 1000000,
      });
      
      currentPrice = close;
    }
    
    return data;
  }
}

// Create singleton instance
export const apiService = new ApiService();