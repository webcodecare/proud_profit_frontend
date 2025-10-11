import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, DollarSign, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { type RealtimeAlert } from '@/hooks/useSupabaseRealtime';

interface SignalTooltipProps {
  alert: RealtimeAlert | null;
  position: { x: number; y: number };
  onClose: () => void;
}

export default function SignalTooltip({ alert, position, onClose }: SignalTooltipProps) {
  if (!alert) return null;

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        transition={{ duration: 0.2 }}
        className="fixed z-50 bg-card border rounded-lg shadow-xl p-4 min-w-64 max-w-sm"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -100%)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {alert.signalType === 'buy' ? (
              <TrendingUp className="h-5 w-5 text-green-400" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-400" />
            )}
            <h3 className={`font-semibold ${
              alert.signalType === 'buy' ? 'text-green-400' : 'text-red-400'
            }`}>
              {alert.signalType.toUpperCase()} SIGNAL
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Signal Details */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Ticker</div>
              <div className="font-mono font-semibold">{alert.ticker}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Price</div>
              <div className="font-mono font-semibold flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                {formatPrice(alert.price)}
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">Timestamp</div>
            <div className="text-sm flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              {formatTime(alert.timestamp)}
            </div>
          </div>

          {alert.timeframe && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Timeframe</div>
              <div className="text-sm font-mono">{alert.timeframe}</div>
            </div>
          )}

          {alert.strategy && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Strategy</div>
              <div className="text-sm flex items-start">
                <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>{alert.strategy}</span>
              </div>
            </div>
          )}

          {alert.note && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Note</div>
              <div className="text-sm text-muted-foreground">{alert.note}</div>
            </div>
          )}

          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground mb-1">Source</div>
            <div className="text-sm">
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                {alert.source}
              </span>
            </div>
          </div>
        </div>

        {/* Tooltip Arrow */}
        <div 
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full"
        >
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border"></div>
          <div className="w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-card absolute -top-px left-1/2 transform -translate-x-1/2"></div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}