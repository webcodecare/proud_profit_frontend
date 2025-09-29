// Legacy WebSocket Types (keeping for compatibility)
export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export type WebSocketMessageHandler = (message: WebSocketMessage) => void;

/**
 * Deprecated: Internal WebSocket Manager
 * 
 * This class was used for internal WebSocket server communication.
 * For serverless architecture, use:
 * - priceStreamingService for live market data (direct Binance WebSocket)
 * - Supabase Realtime for internal real-time features (alerts, signals)
 */
export class WebSocketManager {
  constructor() {
    console.warn('⚠️ WebSocketManager is deprecated for serverless architecture');
  }

  connect(): Promise<void> {
    console.warn('⚠️ Internal WebSocket server not available in serverless mode');
    return Promise.resolve();
  }

  disconnect(): void {
    // No-op for compatibility
  }

  addMessageHandler(handler: WebSocketMessageHandler): void {
    // No-op for compatibility
  }

  removeMessageHandler(handler: WebSocketMessageHandler): void {
    // No-op for compatibility
  }

  send(message: WebSocketMessage): boolean {
    console.warn('⚠️ Internal WebSocket server not available in serverless mode');
    return false;
  }

  get isConnected(): boolean {
    return false;
  }
}

// Legacy export for compatibility
export const webSocketManager = new WebSocketManager();