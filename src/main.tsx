import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Prevent WebSocket errors from crashing the page
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('Failed to construct \'WebSocket\'')) {
    console.warn('Ignored WebSocket construction error:', event.reason.message);
    event.preventDefault();
  }
});

// Override WebSocket constructor to handle invalid URLs gracefully
const OriginalWebSocket = window.WebSocket;
window.WebSocket = function(url: string | URL, protocols?: string | string[]) {
  try {
    // Check if URL is valid before creating WebSocket
    new URL(url);
    return new OriginalWebSocket(url, protocols);
  } catch (error) {
    console.warn('Invalid WebSocket URL, skipping connection:', url);
    // Return a mock WebSocket that doesn't crash and properly handles cleanup
    const listeners = new Map<string, Set<Function>>();
    return {
      readyState: WebSocket.CLOSED,
      close: () => {
        listeners.clear();
      },
      send: () => {},
      addEventListener: (type: string, listener: Function) => {
        if (!listeners.has(type)) {
          listeners.set(type, new Set());
        }
        listeners.get(type)?.add(listener);
      },
      removeEventListener: (type: string, listener: Function) => {
        listeners.get(type)?.delete(listener);
      },
      dispatchEvent: () => false
    } as any;
  }
} as any;

createRoot(document.getElementById("root")!).render(<App />);
