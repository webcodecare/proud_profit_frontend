import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Preferences() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Redirect to settings page to avoid duplication
    setLocation('/settings');
  }, [setLocation]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Redirecting to Settings...</p>
    </div>
  );
}