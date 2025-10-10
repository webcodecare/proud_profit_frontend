import { useState, useEffect } from "react";
import { SessionManager } from "@/lib/sessionManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, AlertTriangle } from "lucide-react";

interface SessionWarningProps {
  onExtend: () => void;
  onLogout: () => void;
}

export default function SessionWarning({ onExtend, onLogout }: SessionWarningProps) {
  const [show, setShow] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

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
        setShow(true);
        setTimeRemaining(Math.floor(minTime / 1000));
      } else {
        setShow(false);
      }
    };

    // Check immediately
    checkSession();

    // Check every 30 seconds
    const interval = setInterval(checkSession, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!show || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setShow(false);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [show, timeRemaining, onLogout]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <CardTitle>Session Expiring Soon</CardTitle>
          </div>
          <CardDescription>
            Your session will expire in {formatTime(timeRemaining)} due to inactivity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Time remaining: {formatTime(timeRemaining)}</span>
          </div>
        </CardContent>
        <CardFooter className="space-x-2">
          <Button 
            variant="outline" 
            onClick={() => {
              setShow(false);
              onLogout();
            }}
            className="flex-1"
          >
            Logout Now
          </Button>
          <Button 
            onClick={() => {
              SessionManager.extendSession();
              setShow(false);
              onExtend();
            }}
            className="flex-1"
          >
            Extend Session
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}