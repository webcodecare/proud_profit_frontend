import { useState, useEffect, useCallback } from 'react';
import { priceStreamingService, PriceData, KlineData } from '@/services/priceStreamingService';

interface UsePriceStreamingOptions {
  symbols?: string[];
  enableKlines?: boolean;
  throttleDelay?: number;
  autoConnect?: boolean;
}

interface PriceStreamingState {
  prices: { [symbol: string]: PriceData };
  klines: { [symbol: string]: KlineData[] };
  isConnected: boolean;
  connectionSource: 'binance' | 'coincap' | 'none';
  reconnectAttempts: number;
  error: any;
}

export function usePriceStreaming(options: UsePriceStreamingOptions = {}) {
  const {
    symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
    enableKlines = false,
    throttleDelay = 100,
    autoConnect = true
  } = options;

  const [state, setState] = useState<PriceStreamingState>({
    prices: {},
    klines: {},
    isConnected: false,
    connectionSource: 'none',
    reconnectAttempts: 0,
    error: null
  });

  // Handle price updates
  const handlePriceUpdate = useCallback((priceData: PriceData) => {
    setState(prev => ({
      ...prev,
      prices: {
        ...prev.prices,
        [priceData.symbol]: priceData
      }
    }));
  }, []);

  // Handle kline updates
  const handleKlineUpdate = useCallback((klineData: KlineData) => {
    if (!enableKlines) return;
    
    setState(prev => {
      const symbolKlines = prev.klines[klineData.symbol] || [];
      const updatedKlines = [...symbolKlines, klineData].slice(-100); // Keep last 100 klines
      
      return {
        ...prev,
        klines: {
          ...prev.klines,
          [klineData.symbol]: updatedKlines
        }
      };
    });
  }, [enableKlines]);

  // Handle connection status changes
  const handleConnectionChange = useCallback((data: any) => {
    const source = data.source === 'binance' ? 'binance' : 
                   data.source === 'coincap' ? 'coincap' : 'none';
    setState(prev => ({
      ...prev,
      isConnected: source !== 'none',
      connectionSource: source,
      error: null
    }));
  }, []);

  // Handle disconnection
  const handleDisconnection = useCallback((data: any) => {
    setState(prev => ({
      ...prev,
      isConnected: false,
      connectionSource: 'none'
    }));
  }, []);

  // Handle errors
  const handleError = useCallback((error: any) => {
    setState(prev => ({
      ...prev,
      error: error
    }));
  }, []);

  // Connect to streaming service
  const connect = useCallback((connectSymbols?: string[]) => {
    priceStreamingService.setThrottleDelay(throttleDelay);
    const symbolsToConnect = connectSymbols || symbols;
    priceStreamingService.connectBinanceWebSocket(symbolsToConnect);
    
    // Update connection status immediately
    setState(prev => ({
      ...prev,
      isConnected: true,
      connectionSource: 'binance',
      error: null
    }));
  }, [symbols, throttleDelay]);

  // Disconnect from streaming service
  const disconnect = useCallback(() => {
    priceStreamingService.disconnect();
    // Update state immediately
    setState(prev => ({
      ...prev,
      isConnected: false,
      connectionSource: 'none',
      error: null
    }));
  }, []);

  // Subscribe to additional symbols
  const subscribe = useCallback((newSymbols: string[]) => {
    priceStreamingService.subscribe(newSymbols);
  }, []);

  // Unsubscribe from symbols
  const unsubscribe = useCallback((symbolsToRemove: string[]) => {
    priceStreamingService.unsubscribe(symbolsToRemove);
  }, []);

  // Get current connection status
  const getStatus = useCallback(() => {
    return priceStreamingService.getConnectionStatus();
  }, []);

  // Setup event listeners
  useEffect(() => {
    priceStreamingService.on('price', handlePriceUpdate);
    priceStreamingService.on('kline', handleKlineUpdate);
    priceStreamingService.on('connected', handleConnectionChange);
    priceStreamingService.on('disconnected', handleDisconnection);
    priceStreamingService.on('error', handleError);

    // Auto-connect if enabled
    if (autoConnect) {
      connect();
    }

    return () => {
      priceStreamingService.removeListener('price', handlePriceUpdate);
      priceStreamingService.removeListener('kline', handleKlineUpdate);
      priceStreamingService.removeListener('connected', handleConnectionChange);
      priceStreamingService.removeListener('disconnected', handleDisconnection);
      priceStreamingService.removeListener('error', handleError);
      
      // Disconnect the service to prevent memory leaks
      if (autoConnect) {
        priceStreamingService.disconnect();
      }
    };
  }, [
    handlePriceUpdate,
    handleKlineUpdate,
    handleConnectionChange,
    handleDisconnection,
    handleError,
    autoConnect,
    connect
  ]);

  // Update subscription when symbols change
  useEffect(() => {
    if (state.isConnected && symbols.length > 0) {
      priceStreamingService.subscribe(symbols);
    }
  }, [symbols, state.isConnected]);

  return {
    // State
    prices: state.prices,
    klines: state.klines,
    isConnected: state.isConnected,
    connectionSource: state.connectionSource,
    reconnectAttempts: state.reconnectAttempts,
    error: state.error,
    
    // Actions
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    getStatus,
    
    // Helpers
    getPrice: (symbol: string) => state.prices[symbol],
    getKlines: (symbol: string) => state.klines[symbol] || [],
    getPriceChange: (symbol: string) => {
      const price = state.prices[symbol];
      return price ? {
        change: price.change24h,
        changePercent: price.changePercent24h,
        isPositive: price.change24h >= 0
      } : null;
    }
  };
}

export default usePriceStreaming;