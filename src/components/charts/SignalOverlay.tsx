import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';
import { type RealtimeAlert } from '@/hooks/useSupabaseRealtime';

interface SignalOverlayProps {
  alerts: RealtimeAlert[];
  ticker: string;
  onAlertClick?: (alert: RealtimeAlert) => void;
}

export default function SignalOverlay({ alerts, ticker, onAlertClick }: SignalOverlayProps) {
  const [visibleAlerts, setVisibleAlerts] = useState<RealtimeAlert[]>([]);
  
  // Filter alerts for current ticker and limit to last 5
  useEffect(() => {
    const tickerAlerts = alerts
      .filter(alert => alert.ticker === ticker)
      .slice(0, 5);
    setVisibleAlerts(tickerAlerts);
  }, [alerts, ticker]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  };

  return (
    <div className="absolute top-4 left-4 z-20 space-y-2 max-w-xs">
      <AnimatePresence mode="popLayout">
        {visibleAlerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.9 }}
            transition={{ 
              duration: 0.3,
              delay: index * 0.1 
            }}
            className={`relative overflow-hidden rounded-lg border cursor-pointer ${
              alert.signalType === 'buy'
                ? 'bg-green-900/20 border-green-500/30 text-green-400'
                : 'bg-red-900/20 border-red-500/30 text-red-400'
            }`}
            onClick={() => onAlertClick?.(alert)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Animated background gradient */}
            <motion.div
              className={`absolute inset-0 opacity-30 ${
                alert.signalType === 'buy' 
                  ? 'bg-gradient-to-r from-green-500/10 to-transparent'
                  : 'bg-gradient-to-r from-red-500/10 to-transparent'
              }`}
              animate={{
                x: ['0%', '100%', '0%']
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: 'reverse'
              }}
            />
            
            <div className="relative p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {alert.signalType === 'buy' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="font-semibold text-sm">
                    {alert.signalType.toUpperCase()} SIGNAL
                  </span>
                </div>
                
                {/* Latest signal indicator */}
                {index === 0 && (
                  <motion.div
                    className="w-2 h-2 rounded-full bg-current"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-3 w-3" />
                    <span className="text-sm font-mono">
                      ${formatPrice(alert.price)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1 text-xs opacity-70">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(alert.timestamp)}</span>
                  </div>
                </div>
                
                {alert.strategy && (
                  <div className="text-xs opacity-70 truncate">
                    {alert.strategy}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Signal summary */}
      {visibleAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-muted-foreground bg-card/80 border rounded px-2 py-1"
        >
          {visibleAlerts.length} recent signal{visibleAlerts.length !== 1 ? 's' : ''} • {ticker}
        </motion.div>
      )}
    </div>
  );
}