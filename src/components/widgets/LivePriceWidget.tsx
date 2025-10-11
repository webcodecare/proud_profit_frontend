import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';

interface LivePriceWidgetProps {
  symbol: string;
  size?: 'sm' | 'md' | 'lg';
  showChart?: boolean;
  className?: string;
}

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  lastUpdate: string;
}

export default function LivePriceWidget({ 
  symbol, 
  size = 'md', 
  showChart = false,
  className = ''
}: LivePriceWidgetProps) {
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [animationKey, setAnimationKey] = useState(0);

  // Fetch real-time price data
  const { data: priceData, isLoading } = useQuery<PriceData>({
    queryKey: [`/api/market/price/${symbol}`],
    refetchInterval: 2000, // Update every 2 seconds
  });

  // Track price changes for animation
  useEffect(() => {
    if (priceData?.price && previousPrice !== null) {
      if (priceData.price > previousPrice) {
        setPriceDirection('up');
      } else if (priceData.price < previousPrice) {
        setPriceDirection('down');
      } else {
        setPriceDirection('neutral');
      }
      setAnimationKey(prev => prev + 1);
    }
    
    if (priceData?.price) {
      setPreviousPrice(priceData.price);
    }
  }, [priceData?.price, previousPrice]);

  if (isLoading) {
    return (
      <Card className={`${className} animate-pulse`}>
        <CardHeader className="pb-2">
          <div className="h-4 bg-muted rounded w-20"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted rounded w-32 mb-2"></div>
          <div className="h-4 bg-muted rounded w-24"></div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = priceData?.changePercent24h >= 0;
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <Card className={`${className} border-border/50 hover:border-border transition-all duration-200`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          {symbol.replace('USDT', '/USD')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div 
          key={animationKey}
          initial={{ scale: 1 }}
          animate={{ 
            scale: priceDirection !== 'neutral' ? [1, 1.05, 1] : 1,
            color: priceDirection === 'up' ? '#22c55e' : priceDirection === 'down' ? '#ef4444' : 'inherit'
          }}
          transition={{ duration: 0.3 }}
          className={`${sizeClasses[size]} font-bold mb-2`}
        >
          ${priceData?.price?.toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}
        </motion.div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant={isPositive ? "default" : "destructive"}
            className={`flex items-center gap-1 ${
              isPositive 
                ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                : 'bg-red-500/10 text-red-500 border-red-500/20'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {isPositive ? '+' : ''}{priceData?.changePercent24h?.toFixed(2)}%
          </Badge>
          
          <span className="text-sm text-muted-foreground">
            {isPositive ? '+' : ''}${priceData?.change24h?.toFixed(2)}
          </span>
        </div>

        {size !== 'sm' && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Volume 24h</span>
              <span className="font-medium">
                {priceData?.volume24h?.toLocaleString(undefined, { 
                  maximumFractionDigits: 0 
                })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Last Update</span>
              <span className="font-medium flex items-center gap-1">
                <Activity className="h-3 w-3 text-green-500" />
                {new Date(priceData?.lastUpdate || '').toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}

        {showChart && size === 'lg' && (
          <div className="mt-4 h-20 bg-muted/20 rounded flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Mini chart placeholder</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}