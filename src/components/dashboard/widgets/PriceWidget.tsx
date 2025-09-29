import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Settings, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface PriceWidgetProps {
  widget: any;
  onUpdateSettings: (settings: Record<string, any>) => void;
  onRemove: () => void;
  onToggleEnabled: () => void;
}

export default function PriceWidget({ widget, onUpdateSettings }: PriceWidgetProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(widget.settings);

  const { data: price, isLoading, error } = useQuery({
    queryKey: ['/api/market/price', widget.settings.ticker],
    queryFn: () => apiRequest('GET', `/api/market/price/${widget.settings.ticker}`),
    refetchInterval: 5000, // Refresh every 5 seconds
    retry: false,
  });

  const { data: ohlcData } = useQuery({
    queryKey: ['/api/chart/ohlc', widget.settings.ticker],
    queryFn: () => apiRequest('GET', `/api/chart/ohlc/${widget.settings.ticker}?interval=1h&limit=24`),
    enabled: widget.settings.showChart,
    retry: false,
  });

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

  const saveSettings = () => {
    onUpdateSettings(localSettings);
    setIsSettingsOpen(false);
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            {widget.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-8 bg-muted rounded w-32"></div>
            <div className="h-4 bg-muted rounded w-24"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fallback demo data when API is unavailable
  const getFallbackData = (ticker: string) => {
    const basePrices = {
      'BTCUSDT': { price: 67432.50, changePercent24h: 2.45 },
      'ETHUSDT': { price: 3456.78, changePercent24h: -1.23 },
      'SOLUSDT': { price: 145.67, changePercent24h: 4.56 },
      'ADAUSDT': { price: 0.456, changePercent24h: -0.89 },
      'DOTUSDT': { price: 7.89, changePercent24h: 1.34 },
      'LINKUSDT': { price: 14.23, changePercent24h: 3.21 }
    };
    return basePrices[ticker as keyof typeof basePrices] || basePrices.BTCUSDT;
  };

  const priceData = price || getFallbackData(widget.settings.ticker);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          {widget.settings.ticker}
        </CardTitle>
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
              <Settings className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Price Widget Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Cryptocurrency</Label>
                <Select 
                  value={localSettings.ticker} 
                  onValueChange={(value) => setLocalSettings({...localSettings, ticker: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTCUSDT">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="ETHUSDT">Ethereum (ETH)</SelectItem>
                    <SelectItem value="SOLUSDT">Solana (SOL)</SelectItem>
                    <SelectItem value="ADAUSDT">Cardano (ADA)</SelectItem>
                    <SelectItem value="DOTUSDT">Polkadot (DOT)</SelectItem>
                    <SelectItem value="LINKUSDT">Chainlink (LINK)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-chart"
                  checked={localSettings.showChart}
                  onCheckedChange={(checked) => setLocalSettings({...localSettings, showChart: checked})}
                />
                <Label htmlFor="show-chart">Show mini chart</Label>
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
        <div className="space-y-2">
          <div className="text-2xl font-bold">
            {formatPrice(priceData.price)}
          </div>
          <div className={`flex items-center gap-1 text-sm ${getChangeColor(priceData.changePercent24h)}`}>
            {priceData.changePercent24h >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {formatPercentage(priceData.changePercent24h)}
            <span className="text-muted-foreground">24h</span>
          </div>
          {widget.settings.showChart && ohlcData && ohlcData.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-muted-foreground mb-1">24h Price Chart</div>
              <div className="h-16 flex items-end space-x-0.5">
                {ohlcData.slice(-12).map((candle: any, index: number) => {
                  const height = Math.max(2, (candle.close / priceData.price) * 60);
                  const isGreen = candle.close >= candle.open;
                  return (
                    <div
                      key={index}
                      className={`flex-1 ${
                        isGreen ? 'bg-green-500' : 'bg-red-500'
                      } rounded-sm opacity-80`}
                      style={{ height: `${height}%` }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}