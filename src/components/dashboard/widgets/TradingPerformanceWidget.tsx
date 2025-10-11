import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { 
  LineChart, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Award,
  Settings,
  X 
} from 'lucide-react';

interface Widget {
  id: string;
  type: string;
  title: string;
  position: number;
  size: 'small' | 'medium' | 'large';
  settings: Record<string, any>;
  enabled: boolean;
}

interface TradingPerformanceWidgetProps {
  widget: Widget;
  onUpdateSettings: (settings: Record<string, any>) => void;
  onRemove: () => void;
  onToggleEnabled: () => void;
}

export default function TradingPerformanceWidget({ 
  widget, 
  onUpdateSettings, 
  onRemove, 
  onToggleEnabled 
}: TradingPerformanceWidgetProps) {
  // Mock trading performance data - in a real app, this would come from API
  const performanceData = {
    totalTrades: 156,
    winRate: 68.5,
    avgWin: 245.30,
    avgLoss: -185.20,
    bestTrade: 1250.75,
    worstTrade: -425.80,
    totalProfit: 8520.45,
    profitFactor: 2.34,
    sharpeRatio: 1.84,
    maxDrawdown: -1250.30,
    recentTrades: [
      { date: '2024-08-20', symbol: 'BTCUSDT', type: 'BUY', pnl: 185.50, status: 'win' },
      { date: '2024-08-19', symbol: 'ETHUSDT', type: 'SELL', pnl: -95.20, status: 'loss' },
      { date: '2024-08-18', symbol: 'SOLUSDT', type: 'BUY', pnl: 320.75, status: 'win' },
      { date: '2024-08-17', symbol: 'BTCUSDT', type: 'SELL', pnl: 245.30, status: 'win' },
      { date: '2024-08-16', symbol: 'ETHUSDT', type: 'BUY', pnl: -125.40, status: 'loss' },
    ]
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent.toFixed(1)}%`;
  };

  const getPerformanceMetrics = () => {
    const { timeframe } = widget.settings;
    
    switch (timeframe) {
      case '7d':
        return { profit: 520.45, winRate: 72.3, trades: 8 };
      case '30d':
        return { profit: 2150.30, winRate: 68.5, trades: 35 };
      case '90d':
        return { profit: 5820.75, winRate: 65.2, trades: 89 };
      default:
        return { profit: 8520.45, winRate: 68.5, trades: 156 };
    }
  };

  const metrics = getPerformanceMetrics();

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <LineChart className="h-5 w-5" />
            {widget.title}
          </CardTitle>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-xs">
            {widget.settings.timeframe || '30d'}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {metrics.trades} trades
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Profit</p>
            <p className={`font-semibold ${
              metrics.profit >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {formatCurrency(metrics.profit)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <div className="flex items-center gap-1">
              <p className="font-semibold">{formatPercent(metrics.winRate)}</p>
              {metrics.winRate >= 60 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Avg Win</p>
            <p className="font-semibold text-green-500">
              {formatCurrency(performanceData.avgWin)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Avg Loss</p>
            <p className="font-semibold text-red-500">
              {formatCurrency(performanceData.avgLoss)}
            </p>
          </div>
        </div>

        {/* Advanced Metrics (for larger widgets) */}
        {widget.size !== 'small' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <p className="text-muted-foreground">Profit Factor</p>
                <p className="font-medium">{performanceData.profitFactor.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Sharpe Ratio</p>
                <p className="font-medium">{performanceData.sharpeRatio.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Best Trade</p>
                <p className="font-medium text-green-500">
                  {formatCurrency(performanceData.bestTrade)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Max Drawdown</p>
                <p className="font-medium text-red-500">
                  {formatCurrency(performanceData.maxDrawdown)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Trades (for large widgets) */}
        {widget.size === 'large' && widget.settings.showChart && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Recent Trades</h4>
            <div className="space-y-1">
              {performanceData.recentTrades.slice(0, 3).map((trade, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      trade.status === 'win' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="font-medium">{trade.symbol}</span>
                    <Badge variant="outline" className="text-xs py-0 px-1">
                      {trade.type}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${
                      trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {formatCurrency(trade.pnl)}
                    </div>
                    <div className="text-muted-foreground">
                      {new Date(trade.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Badge */}
        <div className="flex justify-center">
          <Badge variant={metrics.winRate >= 70 ? 'default' : metrics.winRate >= 60 ? 'secondary' : 'destructive'}>
            <Award className="h-3 w-3 mr-1" />
            {metrics.winRate >= 70 ? 'Excellent' : metrics.winRate >= 60 ? 'Good' : 'Needs Improvement'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}