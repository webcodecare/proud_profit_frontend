import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Activity, 
  TrendingUp,
  TrendingDown,
  Clock,
  Settings
} from 'lucide-react';

interface NotificationStats {
  total: number;
  unread: number;
  byType: {
    signal: number;
    price: number;
    news: number;
    system: number;
    achievement: number;
  };
  byPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  lastWeek: number;
  deliveryRate: number;
}

interface NotificationHealth {
  smsEnabled: boolean;
  emailEnabled: boolean;
  telegramEnabled: boolean;
  pushEnabled: boolean;
  webhookEnabled: boolean;
  lastDelivery: string;
  failedDeliveries: number;
}

export default function NotificationStats() {
  const { data: stats, isLoading: statsLoading } = useQuery<NotificationStats>({
    queryKey: ['/api/notifications/stats'],
    refetchInterval: 30000,
  });

  const { data: health, isLoading: healthLoading } = useQuery<NotificationHealth>({
    queryKey: ['/api/notifications/health'],
    refetchInterval: 60000,
  });

  if (statsLoading || healthLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Activity className="h-6 w-6 animate-pulse" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Settings className="h-6 w-6 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Provide default values if data is not available
  const defaultStats = {
    total: 0,
    unread: 0,
    byType: { signal: 0, price: 0, news: 0, system: 0, achievement: 0 },
    byPriority: { critical: 0, high: 0, medium: 0, low: 0 },
    lastWeek: 0,
    deliveryRate: 0
  };

  const defaultHealth = {
    smsEnabled: false,
    emailEnabled: false,
    telegramEnabled: false,
    pushEnabled: false,
    webhookEnabled: false,
    lastDelivery: '',
    failedDeliveries: 0,
    deliveryRate: 0
  };

  const safeStats = stats || defaultStats;
  const safeHealth = health || defaultHealth;

  // Ensure nested objects exist
  const safeByType = safeStats.byType || defaultStats.byType;
  const safeByPriority = safeStats.byPriority || defaultStats.byPriority;

  const unreadPercentage = safeStats.total > 0 ? (safeStats.unread / safeStats.total) * 100 : 0;
  const criticalPercentage = safeStats.total > 0 ? (safeByPriority.critical / safeStats.total) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg border">
              <div className="text-2xl font-bold">{safeStats.total}</div>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="text-center p-3 rounded-lg border">
              <div className="text-2xl font-bold text-orange-500">{safeStats.unread}</div>
              <p className="text-sm text-muted-foreground">Unread</p>
            </div>
          </div>

          {/* Unread Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Unread Notifications</span>
              <span>{unreadPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={unreadPercentage} className="h-2" />
          </div>

          {/* By Type */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">By Type</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  Signals
                </span>
                <Badge variant="outline">{safeByType.signal}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-blue-500" />
                  Price
                </span>
                <Badge variant="outline">{safeByType.price}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Bell className="h-3 w-3 text-purple-500" />
                  News
                </span>
                <Badge variant="outline">{safeByType.news}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Settings className="h-3 w-3 text-gray-500" />
                  System
                </span>
                <Badge variant="outline">{safeByType.system}</Badge>
              </div>
            </div>
          </div>

          {/* By Priority */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">By Priority</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-red-500">Critical</span>
                <Badge variant="destructive">{safeByPriority.critical}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-orange-500">High</span>
                <Badge variant="secondary">{safeByPriority.high}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-500">Medium</span>
                <Badge variant="outline">{safeByPriority.medium}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Low</span>
                <Badge variant="outline">{safeByPriority.low}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Delivery Rate */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Delivery Success Rate</span>
              <span className="font-medium">{safeHealth.deliveryRate}%</span>
            </div>
            <Progress value={safeHealth.deliveryRate} className="h-2" />
          </div>

          {/* Channel Status */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Delivery Channels</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Email</span>
                <Badge variant={safeHealth.emailEnabled ? 'default' : 'secondary'}>
                  {safeHealth.emailEnabled ? 'Active' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>SMS</span>
                <Badge variant={safeHealth.smsEnabled ? 'default' : 'secondary'}>
                  {safeHealth.smsEnabled ? 'Active' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Telegram</span>
                <Badge variant={safeHealth.telegramEnabled ? 'default' : 'secondary'}>
                  {safeHealth.telegramEnabled ? 'Active' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Push</span>
                <Badge variant={safeHealth.pushEnabled ? 'default' : 'secondary'}>
                  {safeHealth.pushEnabled ? 'Active' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Recent Activity</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last Delivery
                </span>
                <span className="text-muted-foreground">
                  {safeHealth.lastDelivery ? new Date(safeHealth.lastDelivery).toLocaleString() : 'Never'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                  Failed Deliveries
                </span>
                <Badge variant={safeHealth.failedDeliveries > 0 ? 'destructive' : 'outline'}>
                  {safeHealth.failedDeliveries}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  This Week
                </span>
                <Badge variant="outline">{safeStats.lastWeek}</Badge>
              </div>
            </div>
          </div>

          {/* Critical Alert Percentage */}
          {criticalPercentage > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-red-500">Critical Alerts</span>
                <span className="font-medium">{criticalPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={criticalPercentage} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}