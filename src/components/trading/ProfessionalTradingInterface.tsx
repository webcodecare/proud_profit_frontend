import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  BarChart3,
  Target,
  Zap,
  AlertTriangle
} from 'lucide-react';

interface TradeHistory {
  id: string;
  price: number;
  amount: number;
  side: 'buy' | 'sell';
  timestamp: string;
}

interface ProfessionalTradingInterfaceProps {
  symbol: string;
  currentPrice: number;
}

export default function ProfessionalTradingInterface({ 
  symbol, 
  currentPrice 
}: ProfessionalTradingInterfaceProps) {
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check TradingView timeframe support for current symbol
  const { data: timeframeConfig } = useQuery({
    queryKey: ['/api/trading/timeframes', symbol],
    retry: false,
  });

  // Supported timeframes for TradingView alerts
  const supportedTimeframes = timeframeConfig?.supported_timeframes || [];
  const isTradingViewSupported = timeframeConfig?.supported || false;



  // Generate recent trades
  const generateRecentTrades = (): TradeHistory[] => {
    const trades: TradeHistory[] = [];
    for (let i = 0; i < 50; i++) {
      trades.push({
        id: `trade-${i}`,
        price: currentPrice + (Math.random() - 0.5) * currentPrice * 0.002,
        amount: Math.random() * 2 + 0.01,
        side: Math.random() > 0.5 ? 'buy' : 'sell',
        timestamp: new Date(Date.now() - i * 30000).toISOString()
      });
    }
    return trades;
  };

  const [recentTrades] = useState(generateRecentTrades());

  return (
    <div className="space-y-6">
      {/* TradingView Alert Status */}
      {symbol === 'BTCUSD' && isTradingViewSupported && (
        <Card className="border-green-500/20 bg-gradient-to-r from-green-500/5 to-emerald-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <div>
                  <h3 className="font-semibold text-sm">TradingView Alerts Active</h3>
                  <p className="text-xs text-muted-foreground">
                    Receiving live buy/sell signals from TradingView bots
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="text-green-600 border-green-500/30">
                  {supportedTimeframes.length} Timeframes
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {supportedTimeframes.join(', ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {symbol !== 'BTCUSD' && (
        <Card className="border-yellow-500/20 bg-gradient-to-r from-yellow-500/5 to-orange-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <div>
                <h3 className="font-semibold text-sm">TradingView Alerts Limited</h3>
                <p className="text-xs text-muted-foreground">
                  TradingView webhook integration currently supports BTCUSD only. 
                  Switch to BTCUSD for automated signals across 7 timeframes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Professional Features */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Professional Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">RSI & MACD Indicators</span>
                </div>
                <Badge variant="outline" className="text-green-600">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Bollinger Bands</span>
                </div>
                <Badge variant="outline" className="text-green-600">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Volume Analysis</span>
                </div>
                <Badge variant="outline" className="text-green-600">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Drawing Tools</span>
                </div>
                <Badge variant="outline" className="text-blue-600">Available</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Price Alerts</span>
                </div>
                <Badge variant="outline" className="text-blue-600">Available</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-pink-500" />
                  <span className="text-sm">Chart Patterns</span>
                </div>
                <Badge variant="outline" className="text-blue-600">Available</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Market Information */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Market Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">24h Volume:</span>
                <span className="font-semibold">$2.4B</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">24h High:</span>
                <span className="font-semibold text-green-600">${(currentPrice * 1.02).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">24h Low:</span>
                <span className="font-semibold text-red-600">${(currentPrice * 0.98).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Market Cap:</span>
                <span className="font-semibold">$1.37T</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Fear & Greed:</span>
                <Badge variant="outline" className="text-yellow-600">Neutral 52</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Signal Information */}
      <div className="mt-6">
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <h3 className="font-semibold text-sm">Signal-Only Platform</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              This platform provides trading signals and market analysis. We do not facilitate actual trades.
              Use these signals with your preferred trading platform.
            </p>
            <div className="text-xs text-muted-foreground">
              <strong>Current Status:</strong> TradingView webhook integration active for BTCUSD across 7 timeframes
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades - Kept as single section */}
      <div className="mt-6">
        <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Trades
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-1 max-h-96 overflow-y-auto">
            <div className="px-4 grid grid-cols-3 gap-2 text-xs text-muted-foreground font-medium mb-2">
              <span>Price</span>
              <span className="text-right">Size</span>
              <span className="text-right">Time</span>
            </div>
            {recentTrades.slice(0, 30).map((trade, index) => (
              <div
                key={trade.id}
                className="px-4 grid grid-cols-3 gap-2 text-xs py-1 hover:bg-muted/50"
              >
                <span className={`font-mono ${
                  trade.side === 'buy' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {trade.price.toFixed(2)}
                </span>
                <span className="text-right font-mono">{trade.amount.toFixed(4)}</span>
                <span className="text-right text-muted-foreground">
                  {new Date(trade.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}