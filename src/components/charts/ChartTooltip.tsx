import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  DollarSign,
  BarChart3,
  Zap,
  Info,
  X,
  ExternalLink
} from 'lucide-react';

interface AlertSignal {
  id: string;
  userId: string | null;
  ticker: string;
  signalType: 'buy' | 'sell';
  price: number;
  timestamp: string;
  timeframe: string;
  strategy?: string;
  source: string;
  note?: string;
  createdAt: string;
}

interface TooltipPosition {
  x: number;
  y: number;
}

interface ChartTooltipProps {
  signal: AlertSignal | null;
  position: TooltipPosition | null;
  isVisible: boolean;
  onClose: () => void;
  currentPrice?: number;
}

export default function ChartTooltip({ 
  signal, 
  position, 
  isVisible, 
  onClose,
  currentPrice 
}: ChartTooltipProps) {
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [priceChangePercent, setPriceChangePercent] = useState<number | null>(null);

  useEffect(() => {
    if (signal && currentPrice) {
      const change = currentPrice - signal.price;
      const changePercent = (change / signal.price) * 100;
      setPriceChange(change);
      setPriceChangePercent(changePercent);
    }
  }, [signal, currentPrice]);

  if (!signal || !position || !isVisible) {
    return null;
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return {
      relative: `${diffDays}d ago`,
      absolute: date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    };
  };

  const getSignalIcon = () => {
    return signal.signalType === 'buy' ? (
      <TrendingUp className="h-5 w-5 text-green-500" />
    ) : (
      <TrendingDown className="h-5 w-5 text-red-500" />
    );
  };

  const getPerformanceColor = () => {
    if (!priceChange) return 'text-muted-foreground';
    
    if (signal.signalType === 'buy') {
      return priceChange > 0 ? 'text-green-500' : 'text-red-500';
    } else {
      return priceChange < 0 ? 'text-green-500' : 'text-red-500';
    }
  };

  const getPerformanceIndicator = () => {
    if (!priceChange || !priceChangePercent) return null;
    
    const isPositive = signal.signalType === 'buy' ? priceChange > 0 : priceChange < 0;
    
    return (
      <div className={`flex items-center gap-1 ${getPerformanceColor()}`}>
        {isPositive ? (
          <TrendingUp className="h-4 w-4" />
        ) : (
          <TrendingDown className="h-4 w-4" />
        )}
        <span className="font-medium">
          {isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%
        </span>
        <span className="text-xs">
          (${Math.abs(priceChange).toFixed(2)})
        </span>
      </div>
    );
  };

  const timeInfo = formatTimestamp(signal.timestamp);

  return (
    <div
      className="fixed z-50 pointer-events-auto"
      style={{
        left: Math.min(position.x + 10, window.innerWidth - 320),
        top: Math.max(position.y - 10, 10),
        maxWidth: '300px'
      }}
    >
      <Card className="shadow-lg border-2 bg-background/95 backdrop-blur-sm">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {getSignalIcon()}
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={signal.signalType === 'buy' ? 'default' : 'destructive'}>
                    {signal.signalType.toUpperCase()}
                  </Badge>
                  <span className="font-bold text-lg">{signal.ticker}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Trading Signal
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Separator />

          {/* Price Information */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Signal Price
              </span>
              <span className="font-mono font-bold">
                ${signal.price.toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 8 
                })}
              </span>
            </div>
            
            {currentPrice && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Price</span>
                <span className="font-mono">
                  ${currentPrice.toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 8 
                  })}
                </span>
              </div>
            )}
            
            {getPerformanceIndicator() && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Performance</span>
                {getPerformanceIndicator()}
              </div>
            )}
          </div>

          <Separator />

          {/* Signal Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                Timeframe
              </span>
              <Badge variant="outline">{signal.timeframe}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Zap className="h-4 w-4" />
                Source
              </span>
              <span className="text-sm font-medium">{signal.source}</span>
            </div>
            
            {signal.strategy && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  Strategy
                </span>
                <Badge variant="secondary">{signal.strategy}</Badge>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Time
              </span>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {typeof timeInfo === 'string' ? timeInfo : timeInfo.relative}
                </div>
                {typeof timeInfo === 'object' && (
                  <div className="text-xs text-muted-foreground">
                    {timeInfo.absolute}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          {signal.note && (
            <>
              <Separator />
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Info className="h-4 w-4" />
                  Notes
                </span>
                <p className="text-sm bg-muted/50 p-2 rounded text-foreground">
                  {signal.note}
                </p>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <Separator />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1">
              <ExternalLink className="h-3 w-3 mr-1" />
              View Details
            </Button>
            <Button 
              size="sm" 
              variant={signal.signalType === 'buy' ? 'default' : 'destructive'}
              className="flex-1"
            >
              {signal.signalType === 'buy' ? 'Follow Buy' : 'Follow Sell'}
            </Button>
          </div>

          {/* Signal ID for reference */}
          <div className="text-xs text-muted-foreground text-center border-t pt-2">
            Signal ID: {signal.id.slice(0, 8)}...
          </div>
        </CardContent>
      </Card>
    </div>
  );
}