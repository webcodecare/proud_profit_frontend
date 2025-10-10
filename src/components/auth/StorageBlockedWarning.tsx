import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { UniversalStorage } from '@/lib/storage';

export default function StorageBlockedWarning() {
  const [isStorageBlocked, setIsStorageBlocked] = useState(false);
  const [showWarning, setShowWarning] = useState(true);

  useEffect(() => {
    // Check if storage is persistent
    const storageType = UniversalStorage.getStorageType();
    const isPersistent = UniversalStorage.isPersistent();
    
    if (!isPersistent || storageType === 'memory') {
      setIsStorageBlocked(true);
    }
  }, []);

  if (!isStorageBlocked || !showWarning) {
    return null;
  }

  const handleOpenInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Alert variant="destructive" className="max-w-4xl mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Storage Blocked - Authentication Won't Persist</AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p>
            Your browser is blocking storage in this embedded view. Login sessions won't persist when you reload or navigate pages.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={handleOpenInNewTab}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in New Tab (Recommended)
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowWarning(false)}
            >
              Dismiss
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
