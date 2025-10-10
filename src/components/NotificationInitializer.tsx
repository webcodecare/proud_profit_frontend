import { useEffect } from 'react';
import { subscribeToSignals } from '@/services/notificationService';
import { useToast } from '@/hooks/use-toast';

export default function NotificationInitializer() {
  const { toast } = useToast();

  useEffect(() => {
    console.log('🔔 Initializing notification system...');
    
    const unsubscribe = subscribeToSignals((signal) => {
      toast({
        title: `${signal.signalType?.toUpperCase() || signal.signal_type?.toUpperCase()} Signal Created`,
        description: `${signal.ticker} at $${signal.price}`,
        variant: signal.signalType === 'buy' || signal.signal_type === 'buy' ? 'default' : 'destructive',
      });
    });

    return () => {
      console.log('🔕 Cleaning up notification system...');
      unsubscribe();
    };
  }, [toast]);

  return null;
}
