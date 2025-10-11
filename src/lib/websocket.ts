import { useRef, useEffect, useCallback } from "react";

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export type WebSocketMessageHandler = (message: WebSocketMessage) => void;

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private messageHandlers: Set<WebSocketMessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private reconnectTimeoutId: number | null = null;
  private shouldReconnect = true;

  constructor() {
    // Robust WebSocket URL construction that works across all environments
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    
    // Use window.location.host which automatically includes the correct port
    // This avoids hardcoding ports and works in all environments
    this.url = `${protocol}//${window.location.host}/ws`;
    console.log('WebSocket URL constructed:', this.url);
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
        resolve();
        return;
      }

      this.shouldReconnect = true; // Enable reconnection for new connection attempts
      this.isConnecting = true;

      try {
        // Validate WebSocket URL before creating connection
        if (!this.url || this.url.includes('undefined')) {
          console.warn("Invalid WebSocket URL, skipping connection");
          this.isConnecting = false;
          resolve(); // Resolve gracefully instead of rejecting
          return;
        }

        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log("WebSocket connected");
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.messageHandlers.forEach(handler => handler(message));
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        this.ws.onclose = (event) => {
          console.log("WebSocket disconnected:", event.code, event.reason);
          this.isConnecting = false;
          // Only attempt to reconnect if it wasn't an intentional close and reconnection is enabled
          if (this.shouldReconnect && event.code !== 1000) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.warn("WebSocket connection failed, continuing without real-time features");
          this.isConnecting = false;
          // Resolve instead of reject to prevent unhandled promise rejection
          resolve();
        };
      } catch (error) {
        console.warn("WebSocket initialization failed, continuing without real-time features");
        this.isConnecting = false;
        resolve(); // Resolve gracefully
      }
    });
  }

  disconnect(): void {
    this.shouldReconnect = false; // Prevent reconnection after manual disconnect
    
    // Clear any pending reconnection timeouts
    if (this.reconnectTimeoutId !== null) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'client disconnect'); // Use standard close code
      this.ws = null;
    }
    
    // Reset state
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  addMessageHandler(handler: WebSocketMessageHandler): void {
    this.messageHandlers.add(handler);
  }

  removeMessageHandler(handler: WebSocketMessageHandler): void {
    this.messageHandlers.delete(handler);
  }

  send(message: WebSocketMessage): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      // Clear any existing timeout before setting new one
      if (this.reconnectTimeoutId !== null) {
        clearTimeout(this.reconnectTimeoutId);
      }
      
      this.reconnectTimeoutId = window.setTimeout(() => {
        this.reconnectTimeoutId = null;
        this.connect().catch(error => {
          console.error("Reconnection failed:", error);
        });
      }, delay);
    } else {
      console.error("Max reconnection attempts reached");
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Global WebSocket manager instance
export const webSocketManager = new WebSocketManager();
