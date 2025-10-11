import { useState, useEffect, useCallback } from 'react';
import priceStreamingService, { PriceData } from '../services/priceStreamingService';

interface UsePriceStreamingOptions {
  symbols: string[];
  enableKlines?: boolean;
  throttleDelay?: number;
  autoConnect?: boolean;
}

interface UsePriceStreamingReturn {
  prices: Record<string, PriceData>;
  isConnected: boolean;
  connectionSource: 'binance' | 'coincap' | 'polling' | 'none';
  error: string | null;
  connect: (symbols?: string[]) => void;
  disconnect: () => void;
  getStatus: () => {
    connected: boolean;
    source: string;
    symbolCount: number;
    lastUpdate: string | null;
  };
}

export function usePriceStreaming({
  symbols,
  enableKlines = false,
  throttleDelay = 100,
  autoConnect = true,
}: UsePriceStreamingOptions): UsePriceStreamingReturn {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [connectionSource, setConnectionSource] = useState<'binance' | 'coincap' | 'polling' | 'none'>('none');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // Handle price updates from streaming service
  const handlePriceUpdate = useCallback((priceData: PriceData) => {
    setPrices(prev => ({
      ...prev,
      [priceData.symbol]: priceData
    }));
    setLastUpdate(new Date().toISOString());
  }, []);

  // Handle connection status changes
  const handleConnectionChange = useCallback((data: any) => {
    setIsConnected(true);
    setConnectionSource(data.source || 'binance');
    setError(null);
  }, []);

  const handleDisconnection = useCallback((data: any) => {
    setIsConnected(false);
    setConnectionSource('none');
  }, []);

  const handleError = useCallback((data: any) => {
    setError(data.error?.message || 'Connection error');
    setIsConnected(false);
  }, []);

  // Setup streaming service event listeners
  useEffect(() => {
    // Set throttle delay
    priceStreamingService.setThrottleDelay(throttleDelay);
    
    // Listen to events
    priceStreamingService.on('price', handlePriceUpdate);
    priceStreamingService.on('connected', handleConnectionChange);
    priceStreamingService.on('disconnected', handleDisconnection);
    priceStreamingService.on('error', handleError);

    return () => {
      priceStreamingService.removeListener('price', handlePriceUpdate);
      priceStreamingService.removeListener('connected', handleConnectionChange);
      priceStreamingService.removeListener('disconnected', handleDisconnection);
      priceStreamingService.removeListener('error', handleError);
    };
  }, [handlePriceUpdate, handleConnectionChange, handleDisconnection, handleError, throttleDelay]);

  // Connect function using streaming service
  const connect = useCallback((symbolsToConnect?: string[]) => {
    const targetSymbols = symbolsToConnect || symbols;
    
    try {
      // Connect using the streaming service
      priceStreamingService.connectBinanceWebSocket(targetSymbols);
    } catch (error) {
      console.error('Failed to connect to streaming service:', error);
      setError('Failed to connect to streaming service');
    }
  }, [symbols]);

  // Disconnect function
  const disconnect = useCallback(() => {
    priceStreamingService.disconnect();
    setIsConnected(false);
    setConnectionSource('none');
    setError(null);
  }, []);

  // Get status function
  const getStatus = useCallback(() => {
    const serviceStatus = priceStreamingService.getConnectionStatus();
    return {
      connected: serviceStatus.isConnected,
      source: serviceStatus.source,
      symbolCount: Object.keys(prices).length,
      lastUpdate,
    };
  }, [prices, lastUpdate]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && symbols.length > 0) {
      connect(symbols);
    }
    
    return () => {
      // Don't disconnect on unmount to allow other components to use the service
    };
  }, [autoConnect, symbols, connect]);

  // Connection status is already handled by event listeners above
  // No need for polling - removed to prevent memory leak

  return {
    prices,
    isConnected,
    connectionSource,
    error,
    connect,
    disconnect,
    getStatus,
  };
}