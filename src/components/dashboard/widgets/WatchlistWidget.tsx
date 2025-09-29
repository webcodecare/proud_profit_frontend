import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Settings, TrendingUp, TrendingDown, Plus, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WatchlistWidgetProps {
  widget: any;
  onUpdateSettings: (settings: Record<string, any>) => void;
  onRemove: () => void;
  onToggleEnabled: () => void;
}

export default function WatchlistWidget({ widget, onUpdateSettings }: WatchlistWidgetProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [localSettings, setLocalSettings] = useState(widget.settings);

  const { data: watchlist = [], isLoading } = useQuery({
    queryKey: ['/api/watchlist'],
    queryFn: () => apiRequest('GET', '/api/watchlist'),
  });

  const { data: availableAssets = [] } = useQuery({
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

  // Mock watchlist data
  const mockWatchlist = [
    { symbol: 'BTCUSDT', name: 'Bitcoin', price: 67890.45, change24h: 2.34, volume24h: 28500000000 },
    { symbol: 'ETHUSDT', name: 'Ethereum', price: 3456.78, change24h: 1.87, volume24h: 15600000000 },
    { symbol: 'SOLUSDT', name: 'Solana', price: 98.45, change24h: -0.92, volume24h: 2100000000 },
    { symbol: 'ADAUSDT', name: 'Cardano', price: 0.4567, change24h: 3.21, volume24h: 890000000 }
  ];

  const displayWatchlist = watchlist.length > 0 ? watchlist : mockWatchlist;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Watchlist
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
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
          <Target className="h-4 w-4" />
          Watchlist ({displayWatchlist.length})
        </CardTitle>
        <div className="flex gap-1">
          <Dialog open={isAddAssetOpen} onOpenChange={setIsAddAssetOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                <Plus className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add to Watchlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Asset</Label>
                  <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose cryptocurrency" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAssets.map((asset: any) => (
                        <SelectItem key={asset.symbol} value={asset.symbol}>
                          {asset.name} ({asset.symbol.replace('USDT', '')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddAssetOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => {
                    // Add asset to watchlist logic here
                    setIsAddAssetOpen(false);
                    setSelectedAsset('');
                  }} disabled={!selectedAsset}>
                    Add to Watchlist
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                <Settings className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Watchlist Widget Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-charts"
                    checked={localSettings.showCharts}
                    onCheckedChange={(checked) => setLocalSettings({...localSettings, showCharts: checked})}
                  />
                  <Label htmlFor="show-charts">Show mini charts</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="compact-view"
                    checked={localSettings.compactView}
                    onCheckedChange={(checked) => setLocalSettings({...localSettings, compactView: checked})}
                  />
                  <Label htmlFor="compact-view">Compact view</Label>
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
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {displayWatchlist.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div>No assets in watchlist</div>
            <div className="text-xs mt-1">Add cryptocurrencies to monitor</div>
          </div>
        ) : (
          <div className="space-y-3">
            {displayWatchlist.map((asset, index) => (
              <div key={asset.symbol} className="flex items-center gap-3 group">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Badge variant="secondary" className="text-xs">
                    {asset.symbol.replace('USDT', '')}
                  </Badge>
                  {!localSettings.compactView && (
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{asset.name}</div>
                    </div>
                  )}
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  onClick={() => {
                    // Remove from watchlist logic here
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {/* Mini charts if enabled */}
        {localSettings.showCharts && displayWatchlist.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-xs text-muted-foreground">Price Trends (24h)</div>
            <div className="grid grid-cols-2 gap-2">
              {displayWatchlist.slice(0, 4).map((asset) => (
                <div key={asset.symbol} className="space-y-1">
                  <div className="text-xs font-medium">{asset.symbol.replace('USDT', '')}</div>
                  <div className="h-8 flex items-end space-x-0.5">
                    {Array.from({ length: 12 }, (_, i) => {
                      const height = Math.max(2, Math.random() * 30 + 5);
                      const isGreen = Math.random() > 0.5;
                      return (
                        <div
                          key={i}
                          className={`flex-1 ${
                            isGreen ? 'bg-green-500' : 'bg-red-500'
                          } rounded-sm opacity-60`}
                          style={{ height: `${height}px` }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}