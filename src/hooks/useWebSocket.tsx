import { useEffect, useCallback } from "react";

// WebSocket Message Types (keeping interface for compatibility)
export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export type WebSocketMessageHandler = (message: WebSocketMessage) => void;

/**
 * Deprecated: Internal WebSocket hook
 * 
 * This hook was used for internal WebSocket server communication.
 * For serverless architecture, use:
 * - usePriceStreaming() for live market data (direct Binance WebSocket)
 * - useSupabaseRealtime() for internal real-time features (alerts, signals)
 */
export function useWebSocket(onMessage?: WebSocketMessageHandler) {
  useEffect(() => {
    console.warn('⚠️ useWebSocket is deprecated for serverless architecture. Use usePriceStreaming() for market data or useSupabaseRealtime() for internal features.');
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    console.warn('⚠️ Internal WebSocket server not available in serverless mode');
    return false;
  }, []);

  return {
    sendMessage,
    isConnected: false,
  };
}
