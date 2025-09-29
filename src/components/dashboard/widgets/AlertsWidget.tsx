import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Settings, TrendingUp, TrendingDown } from 'lucide-react';
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

interface AlertsWidgetProps {
  widget: any;
  onUpdateSettings: (settings: Record<string, any>) => void;
  onRemove: () => void;
  onToggleEnabled: () => void;
}

export default function AlertsWidget({ widget, onUpdateSettings }: AlertsWidgetProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(widget.settings);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['/api/alerts'],
    queryFn: () => apiRequest('GET', '/api/alerts'),
  });

  const saveSettings = () => {
    onUpdateSettings(localSettings);
    setIsSettingsOpen(false);
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'above':
      case 'crosses_above':
        return <TrendingUp className="h-3 w-3" />;
      case 'below':
      case 'crosses_below':
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Bell className="h-3 w-3" />;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'above':
      case 'crosses_above':
        return 'text-green-600 dark:text-green-400';
      case 'below':
      case 'crosses_below':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  };

  const activeAlerts = localSettings.showOnlyActive ? alerts.filter((alert: any) => alert.enabled) : alerts;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Active Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 w-4 bg-muted rounded"></div>
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
          <Bell className="h-4 w-4" />
          Active Alerts ({activeAlerts.length})
        </CardTitle>
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
              <Settings className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alerts Widget Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-only-active"
                  checked={localSettings.showOnlyActive}
                  onCheckedChange={(checked) => setLocalSettings({...localSettings, showOnlyActive: checked})}
                />
                <Label htmlFor="show-only-active">Show only enabled alerts</Label>
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
        {activeAlerts.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div>No active alerts</div>
            <div className="text-xs mt-1">Create alerts to monitor prices</div>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAlerts.slice(0, 5).map((alert: any, index: number) => (
              <div key={alert.id || index} className="flex items-center gap-3">
                <div className={`${getConditionColor(alert.condition)}`}>
                  {getConditionIcon(alert.condition)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{alert.ticker}</div>
                  <div className="text-xs text-muted-foreground">
                    {alert.condition.replace('_', ' ')} {formatPrice(alert.value)}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  {!alert.enabled && (
                    <Badge variant="secondary" className="text-xs">Disabled</Badge>
                  )}
                  {alert.lastTriggered && (
                    <div className="text-xs text-muted-foreground">
                      Triggered
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}