import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, Settings, TrendingUp, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MarketOverviewWidgetProps {
  widget: any;
  onUpdateSettings: (settings: Record<string, any>) => void;
  onRemove: () => void;
  onToggleEnabled: () => void;
}

export default function MarketOverviewWidget({ widget, onUpdateSettings }: MarketOverviewWidgetProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(widget.settings);

  const { data: marketData = [], isLoading } = useQuery({
    queryKey: ['/api/market/overview'],
    queryFn: () => apiRequest('GET', '/api/market/overview'),
  });

  const { data: tickers = [] } = useQuery({
    queryKey: ['/api/tickers/enabled'],
    queryFn: () => apiRequest('GET', '/api/tickers/enabled'),
  });

  const saveSettings = () => {
    onUpdateSettings(localSettings);
    setIsSettingsOpen(false);
  };

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  };

  const formatPercentage = (percentage: number) => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Major': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      'Layer1': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      'DeFi': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      'Legacy': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
      'Utility': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
      'Emerging': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100'
    };
    return colors[category as keyof typeof colors] || colors.Legacy;
  };

  // Mock market data with realistic values
  const mockMarketData = [
    { symbol: 'BTCUSDT', name: 'Bitcoin', price: 67890.45, change24h: 2.34, volume24h: 28500000000, category: 'Major' },
    { symbol: 'ETHUSDT', name: 'Ethereum', price: 3456.78, change24h: 1.87, volume24h: 15600000000, category: 'Major' },
    { symbol: 'SOLUSDT', name: 'Solana', price: 98.45, change24h: -0.92, volume24h: 2100000000, category: 'Layer1' },
    { symbol: 'ADAUSDT', name: 'Cardano', price: 0.4567, change24h: 3.21, volume24h: 890000000, category: 'Layer1' },
    { symbol: 'LINKUSDT', name: 'Chainlink', price: 14.23, change24h: -1.45, volume24h: 456000000, category: 'Utility' },
    { symbol: 'UNIUSDT', name: 'Uniswap', price: 7.89, change24h: 4.56, volume24h: 234000000, category: 'DeFi' },
    { symbol: 'DOTUSDT', name: 'Polkadot', price: 5.67, change24h: -2.34, volume24h: 345000000, category: 'Layer1' },
    { symbol: 'AVAXUSDT', name: 'Avalanche', price: 32.45, change24h: 1.23, volume24h: 567000000, category: 'Layer1' }
  ];

  const filteredData = mockMarketData
    .filter(item => localSettings.categories.includes(item.category))
    .slice(0, localSettings.limit);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Market Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-20 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-16"></div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-muted rounded w-16 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Market Overview
        </CardTitle>
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
              <Settings className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Market Overview Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Number of assets to show</Label>
                <Input
                  type="number"
                  min="5"
                  max="20"
                  value={localSettings.limit}
                  onChange={(e) => setLocalSettings({...localSettings, limit: parseInt(e.target.value) || 10})}
                />
              </div>
              <div>
                <Label>Asset Categories</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['Major', 'Layer1', 'DeFi', 'Legacy', 'Utility', 'Emerging'].map(category => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={category}
                        checked={localSettings.categories.includes(category)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setLocalSettings({
                              ...localSettings,
                              categories: [...localSettings.categories, category]
                            });
                          } else {
                            setLocalSettings({
                              ...localSettings,
                              categories: localSettings.categories.filter((c: string) => c !== category)
                            });
                          }
                        }}
                      />
                      <Label htmlFor={category} className="text-sm">{category}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveSettings}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {filteredData.map((asset, index) => (
            <div key={asset.symbol} className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Badge variant="secondary" className={`text-xs ${getCategoryColor(asset.category)}`}>
                  {asset.symbol.replace('USDT', '')}
                </Badge>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{asset.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-sm">{formatPrice(asset.price)}</div>
                <div className={`flex items-center gap-1 text-xs ${getChangeColor(asset.change24h)}`}>
                  {asset.change24h >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {formatPercentage(asset.change24h)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}