// Browser-compatible EventEmitter implementation
class SimpleEventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  emit(event: string, ...args: any[]) {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(...args));
    }
  }

  removeListener(event: string, listener: Function) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(l => l !== listener);
    }
  }
}

export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

export interface KlineData {
  symbol: string;
  openTime: number;
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  interval: string;
}

class PriceStreamingService extends SimpleEventEmitter {
  private binanceWs: WebSocket | null = null;
  private coinCapEventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnected = false;
  private subscribedSymbols = new Set<string>();
  private lastPriceUpdate: { [symbol: string]: number } = {};
  private updateThrottle: { [symbol: string]: number } = {};
  private throttleDelay = 100; // 100ms throttle for sub-second updates

  constructor() {
    super();
    this.setupErrorHandling();
  }

  private setupErrorHandling() {
    this.on('error', (error) => {
      console.error('Price streaming error:', error);
      this.handleConnectionFailure();
    });
  }

  // Primary: Binance WebSocket for Kline Streaming
  public connectBinanceWebSocket(symbols: string[] = ['btcusdt', 'ethusdt', 'solusdt']) {
    try {
      // Disconnect existing connection first
      if (this.binanceWs) {
        this.binanceWs.close();
        this.binanceWs = null;
      }

      this.subscribedSymbols = new Set(symbols.map(s => s.toLowerCase()));
      
      // Use combined streams endpoint for multiple symbols
      const streams = Array.from(this.subscribedSymbols).flatMap(symbol => [
        `${symbol}@ticker`,
        `${symbol}@kline_1m`
      ]);
      
      const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams.join('/')}`;
      console.log('Connecting to Binance WebSocket:', wsUrl);
      
      this.binanceWs = new WebSocket(wsUrl);
      
      this.binanceWs.onopen = () => {
        console.log('WebSocket connected to Binance');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected', { source: 'binance', isConnected: true });
      };

      this.binanceWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleBinanceMessage(data);
        } catch (error) {
          console.error('Error parsing Binance message:', error);
        }
      };

      this.binanceWs.onclose = () => {
        console.log('Binance WebSocket disconnected');
        this.isConnected = false;
        this.emit('disconnected', { source: 'binance', isConnected: false });
        this.handleConnectionFailure();
      };

      this.binanceWs.onerror = (error) => {
        console.error('Binance WebSocket error:', error);
        this.emit('error', { source: 'binance', error });
      };

    } catch (error) {
      console.error('Failed to connect to Binance WebSocket:', error);
      this.handleConnectionFailure();
    }
  }

  private handleBinanceMessage(data: any) {
    if (data.stream && data.data) {
      const streamType = data.stream.split('@')[1];
      
      if (streamType === 'kline_1m') {
        this.handleKlineData(data.data);
      } else if (streamType === 'ticker') {
        this.handleTickerData(data.data);
      }
    }
  }

  private handleKlineData(klineData: any) {
    const kline = klineData.k;
    if (!kline.x) return; // Only process closed klines
    
    const data: KlineData = {
      symbol: kline.s.toUpperCase(),
      openTime: kline.t,
      closeTime: kline.T,
      open: parseFloat(kline.o),
      high: parseFloat(kline.h),
      low: parseFloat(kline.l),
      close: parseFloat(kline.c),
      volume: parseFloat(kline.v),
      interval: '1m'
    };

    this.throttledEmit('kline', data);
  }

  private handleTickerData(tickerData: any) {
    const priceData: PriceData = {
      symbol: tickerData.s,
      price: parseFloat(tickerData.c),
      change24h: parseFloat(tickerData.P),
      changePercent24h: parseFloat(tickerData.P),
      volume24h: parseFloat(tickerData.v),
      high24h: parseFloat(tickerData.h),
      low24h: parseFloat(tickerData.l),
      timestamp: Date.now()
    };

    this.throttledEmit('price', priceData);
  }

  // Fallback: Server-Sent Events using CoinCap API
  public connectCoinCapSSE() {
    try {
      console.log('Connecting to CoinCap SSE fallback...');
      
      // Convert symbols to CoinCap format
      const coinCapSymbols = Array.from(this.subscribedSymbols).map(symbol => {
        return symbol.replace('usdt', '').toLowerCase();
      });

      this.coinCapEventSource = new EventSource('/api/stream/coincap');
      
      this.coinCapEventSource.onopen = () => {
        console.log('CoinCap SSE connected');
        this.isConnected = true;
        this.emit('connected', { source: 'coincap' });
      };

      this.coinCapEventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleCoinCapMessage(data);
        } catch (error) {
          console.error('Error parsing CoinCap SSE message:', error);
        }
      };

      this.coinCapEventSource.onerror = (error) => {
        console.error('CoinCap SSE error:', error);
        this.emit('error', { source: 'coincap', error });
        this.handleConnectionFailure();
      };

    } catch (error) {
      console.error('Failed to connect to CoinCap SSE:', error);
      this.emit('error', { source: 'coincap', error });
    }
  }

  private handleCoinCapMessage(data: any) {
    if (data.type === 'price' && data.data) {
      const priceData: PriceData = {
        symbol: `${data.data.id.toUpperCase()}USDT`,
        price: parseFloat(data.data.priceUsd),
        change24h: parseFloat(data.data.changePercent24Hr || '0'),
        changePercent24h: parseFloat(data.data.changePercent24Hr || '0'),
        volume24h: parseFloat(data.data.volumeUsd24Hr || '0'),
        high24h: 0, // Not available in CoinCap
        low24h: 0,  // Not available in CoinCap
        timestamp: Date.now()
      };

      this.throttledEmit('price', priceData);
    }
  }

  // Throttled update logic for sub-second price feeds
  private throttledEmit(event: string, data: PriceData | KlineData) {
    const symbol = data.symbol;
    const now = Date.now();
    
    // Check if we should throttle this update
    if (this.updateThrottle[symbol] && (now - this.updateThrottle[symbol]) < this.throttleDelay) {
      return;
    }
    
    this.updateThrottle[symbol] = now;
    
    // Check if price has changed significantly for price updates
    if (event === 'price') {
      const priceData = data as PriceData;
      const lastPrice = this.lastPriceUpdate[symbol];
      
      if (lastPrice && Math.abs(priceData.price - lastPrice) / lastPrice < 0.0001) {
        return; // Skip if price change is less than 0.01%
      }
      
      this.lastPriceUpdate[symbol] = priceData.price;
    }
    
    this.emit(event, data);
  }

  private handleConnectionFailure() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
      
      setTimeout(() => {
        if (!this.isConnected) {
          // Try fallback if primary connection failed
          if (this.binanceWs && this.binanceWs.readyState !== WebSocket.OPEN) {
            console.log('Switching to CoinCap SSE fallback...');
            this.connectCoinCapSSE();
          } else {
            this.connectBinanceWebSocket(Array.from(this.subscribedSymbols));
          }
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
    }
  }

  public subscribe(symbols: string[]) {
    symbols.forEach(symbol => this.subscribedSymbols.add(symbol.toLowerCase()));
    
    if (this.isConnected) {
      // Send subscription message if connected
      this.sendSubscription(symbols);
    }
  }

  public unsubscribe(symbols: string[]) {
    symbols.forEach(symbol => this.subscribedSymbols.delete(symbol.toLowerCase()));
    
    if (this.isConnected) {
      // Send unsubscription message if connected
      this.sendUnsubscription(symbols);
    }
  }

  private sendSubscription(symbols: string[]) {
    if (this.binanceWs && this.binanceWs.readyState === WebSocket.OPEN) {
      const params = symbols.map(symbol => `${symbol.toLowerCase()}@ticker`);
      const message = {
        method: "SUBSCRIBE",
        params: params,
        id: Date.now()
      };
      
      this.binanceWs.send(JSON.stringify(message));
    }
  }

  private sendUnsubscription(symbols: string[]) {
    if (this.binanceWs && this.binanceWs.readyState === WebSocket.OPEN) {
      const params = symbols.map(symbol => `${symbol.toLowerCase()}@ticker`);
      const message = {
        method: "UNSUBSCRIBE",
        params: params,
        id: Date.now()
      };
      
      this.binanceWs.send(JSON.stringify(message));
    }
  }

  public disconnect() {
    this.isConnected = false;
    
    if (this.binanceWs) {
      this.binanceWs.close();
      this.binanceWs = null;
    }
    
    if (this.coinCapEventSource) {
      this.coinCapEventSource.close();
      this.coinCapEventSource = null;
    }
    
    this.emit('disconnected', { source: 'manual' });
  }

  public getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      subscribedSymbols: Array.from(this.subscribedSymbols),
      source: this.binanceWs?.readyState === WebSocket.OPEN ? 'binance' : 
              this.coinCapEventSource?.readyState === EventSource.OPEN ? 'coincap' : 'none'
    };
  }

  public setThrottleDelay(delay: number) {
    this.throttleDelay = Math.max(50, Math.min(delay, 1000)); // 50ms to 1s range
  }

  // Method to manually connect (used by the UI)
  public connect(symbols: string[] = ['btcusdt', 'ethusdt']) {
    this.subscribe(symbols);
    this.connectBinanceWebSocket(symbols);
  }

  // Get streaming metrics for the UI
  public getMetrics() {
    return {
      updateFrequency: 1000 / this.throttleDelay,
      dataPoints: this.subscribedSymbols.size,
      reconnectAttempts: this.reconnectAttempts,
      uptime: Date.now() - this.startTime
    };
  }

  private startTime = Date.now();
}

// Export singleton instance
export const priceStreamingService = new PriceStreamingService();
export default priceStreamingService;