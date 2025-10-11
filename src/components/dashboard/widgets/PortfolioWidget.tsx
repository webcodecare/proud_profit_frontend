import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
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

interface PortfolioWidgetProps {
  widget: Widget;
  onUpdateSettings: (settings: Record<string, any>) => void;
  onRemove: () => void;
  onToggleEnabled: () => void;
}

export default function PortfolioWidget({ 
  widget, 
  onUpdateSettings, 
  onRemove, 
  onToggleEnabled 
}: PortfolioWidgetProps) {
  // Mock portfolio data - in a real app, this would come from API
  const portfolioData = {
    totalValue: 125650.45,
    totalPnL: 12850.22,
    totalPnLPercent: 11.4,
    holdings: [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        amount: 1.25,
        value: 71450.50,
        pnl: 8520.30,
        pnlPercent: 13.6,
        allocation: 56.8
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        amount: 15.8,
        value: 42100.25,
        pnl: 3150.75,
        pnlPercent: 8.1,
        allocation: 33.5
      },
      {
        symbol: 'SOL',
        name: 'Solana',
        amount: 45.2,
        value: 12099.70,
        pnl: 1179.17,
        pnlPercent: 10.8,
        allocation: 9.7
      }
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
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            {widget.title}
          </CardTitle>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Portfolio Summary */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Value</span>
            <span className="font-semibold text-lg">
              {formatCurrency(portfolioData.totalValue)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total P&L</span>
            <div className="flex items-center gap-1">
              {portfolioData.totalPnL >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`font-medium ${
                portfolioData.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {formatCurrency(Math.abs(portfolioData.totalPnL))} 
                ({formatPercent(portfolioData.totalPnLPercent)})
              </span>
            </div>
          </div>
        </div>

        {/* Holdings */}
        {widget.settings.showAllocation && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Holdings</h4>
            <div className="space-y-2">
              {portfolioData.holdings.slice(0, widget.size === 'small' ? 2 : 3).map((holding) => (
                <div key={holding.symbol} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {holding.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium">{holding.symbol}</div>
                      <div className="text-xs text-muted-foreground">
                        {holding.amount.toFixed(2)} tokens
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(holding.value)}</div>
                    {widget.settings.showPnL && (
                      <div className={`text-xs ${
                        holding.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {formatPercent(holding.pnlPercent)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Allocation Chart Preview */}
        {widget.size !== 'small' && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Allocation</h4>
            <div className="space-y-1">
              {portfolioData.holdings.map((holding) => (
                <div key={holding.symbol} className="flex items-center gap-2 text-xs">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ 
                      backgroundColor: holding.symbol === 'BTC' ? '#f7931a' : 
                                     holding.symbol === 'ETH' ? '#627eea' : '#9945ff'
                    }}
                  />
                  <span className="flex-1">{holding.symbol}</span>
                  <span className="text-muted-foreground">{holding.allocation}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}