import { useState, useEffect } from "react";
import { SessionManager } from "@/lib/sessionManager";

export function useSessionWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const checkSession = () => {
      const sessionInfo = SessionManager.getSessionInfo();
      if (!sessionInfo) return;

      const now = Date.now();
      const timeUntilExpiry = sessionInfo.expiresAt.getTime() - now;
      const timeUntilInactivity = sessionInfo.lastActivity.getTime() + (2 * 60 * 60 * 1000) - now; // 2 hours

      const minTime = Math.min(timeUntilExpiry, timeUntilInactivity);
      
      // Show warning if less than 10 minutes remaining
      if (minTime <= 10 * 60 * 1000 && minTime > 0) {
        setShowWarning(true);
        setTimeRemaining(Math.floor(minTime / 1000));
      } else {
        setShowWarning(false);
      }
    };

    // Check immediately
    checkSession();

    // Check every 30 seconds
    const interval = setInterval(checkSession, 30000);

    return () => clearInterval(interval);
  }, []);

  const dismissWarning = () => {
    setShowWarning(false);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return {
    showWarning,
    timeRemaining,
    dismissWarning,
    formatTime,
  };
}