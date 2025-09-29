import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Settings, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface SignalsWidgetProps {
  widget: any;
  onUpdateSettings: (settings: Record<string, any>) => void;
  onRemove: () => void;
  onToggleEnabled: () => void;
}

export default function SignalsWidget({ widget, onUpdateSettings }: SignalsWidgetProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(widget.settings);

  const { data: signals, isLoading } = useQuery({
    queryKey: ['/api/signals', localSettings.limit],
    queryFn: () => apiRequest('GET', `/api/signals?limit=${localSettings.limit}`),
    refetchInterval: localSettings.autoRefresh ? 10000 : false, // Refresh every 10 seconds if auto-refresh is enabled
    retry: false,
  });

  // Demo signals data when API is unavailable
  const demoSignals = [
    {
      id: '1',
      symbol: 'BTCUSDT',
      type: 'buy',
      price: 67500,
      timestamp: new Date().toISOString(),
      confidence: 85,
      notes: 'Strong bullish momentum'
    },
    {
      id: '2',
      symbol: 'ETHUSDT',
      type: 'sell',
      price: 3450,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      confidence: 78,
      notes: 'Resistance level reached'
    },
    {
      id: '3',
      symbol: 'SOLUSDT',
      type: 'buy',
      price: 145,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      confidence: 92,
      notes: 'Breakout pattern confirmed'
    }
  ];

  const signalsData = signals || demoSignals;

  const saveSettings = () => {
    onUpdateSettings(localSettings);
    setIsSettingsOpen(false);
  };

  const getSignalColor = (type: string) => {
    switch (type) {
      case 'buy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'sell': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'buy': return <TrendingUp className="h-3 w-3" />;
      case 'sell': return <TrendingDown className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Trading Signals
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-6 w-12 bg-muted rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-16 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-20"></div>
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
          <Activity className="h-4 w-4" />
          Trading Signals
        </CardTitle>
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
              <Settings className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Signals Widget Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Number of signals to show</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={localSettings.limit}
                  onChange={(e) => setLocalSettings({...localSettings, limit: parseInt(e.target.value) || 5})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-refresh"
                  checked={localSettings.autoRefresh}
                  onCheckedChange={(checked) => setLocalSettings({...localSettings, autoRefresh: checked})}
                />
                <Label htmlFor="auto-refresh">Auto refresh (10s interval)</Label>
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
        {signalsData.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div>No signals available</div>
          </div>
        ) : (
          <div className="space-y-3">
            {signalsData.slice(0, localSettings.limit).map((signal: any, index: number) => (
              <div key={signal.id || index} className="flex items-center gap-3">
                <Badge variant="secondary" className={`${getSignalColor(signal.type)} flex items-center gap-1`}>
                  {getSignalIcon(signal.type)}
                  {signal.type.toUpperCase()}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{signal.symbol}</div>
                  <div className="text-xs text-muted-foreground">
                    {signal.price && `$${signal.price.toLocaleString()}`}
                    {signal.timestamp && ` • ${formatTime(signal.timestamp)}`}
                  </div>
                </div>
                {signal.confidence && (
                  <div className="text-xs text-muted-foreground">
                    {Math.round(signal.confidence * 100)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}