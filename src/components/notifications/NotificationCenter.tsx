import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useWebSocket } from '@/hooks/useWebSocket';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Activity,
  Settings,
  Filter,
  MoreVertical,
  X,
  Check,
  Archive,
  Volume2,
  VolumeX
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface Notification {
  id: string;
  type: 'signal' | 'price' | 'news' | 'system' | 'achievement';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  isArchived: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata?: {
    symbol?: string;
    price?: number;
    change?: number;
    signalType?: 'buy' | 'sell';
  };
}

interface NotificationCenterProps {
  className?: string;
  isCompact?: boolean;
}

export default function NotificationCenter({ className, isCompact = false }: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // WebSocket for real-time notifications
  const { isConnected } = useWebSocket('ws://localhost:5000/ws', {
    onMessage: (data: any) => {
      if (data.type === 'notification') {
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        
        // Show toast for new notifications
        if (data.notification) {
          toast({
            title: data.notification.title,
            description: data.notification.message,
            variant: data.notification.priority === 'critical' ? 'destructive' : 'default',
          });

          // Play sound if enabled
          if (soundEnabled && data.notification.priority !== 'low') {
            playNotificationSound();
          }
        }
      }
    },
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest('PATCH', `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Archive notification
  const archiveMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest('PATCH', `/api/notifications/${notificationId}/archive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('PATCH', '/api/notifications/mark-all-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "All notifications marked as read",
        description: "Your notification center has been updated",
      });
    },
  });

  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYdBTSJ2O3PeDEEJnvH9N6TSA0SUqzh7aZQEwxMpOD1wGId');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors in restricted environments
      });
    } catch (error) {
      // Ignore audio errors
    }
  };

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = priority === 'critical' ? 'text-red-500' : 
                     priority === 'high' ? 'text-orange-500' : 
                     priority === 'medium' ? 'text-blue-500' : 'text-gray-500';
    
    switch (type) {
      case 'signal':
        return <TrendingUp className={`h-4 w-4 ${iconClass}`} />;
      case 'price':
        return <DollarSign className={`h-4 w-4 ${iconClass}`} />;
      case 'news':
        return <Info className={`h-4 w-4 ${iconClass}`} />;
      case 'system':
        return <Settings className={`h-4 w-4 ${iconClass}`} />;
      case 'achievement':
        return <CheckCircle className={`h-4 w-4 ${iconClass}`} />;
      default:
        return <Bell className={`h-4 w-4 ${iconClass}`} />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="destructive" className="text-xs">Critical</Badge>;
      case 'high':
        return <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">High</Badge>;
      case 'medium':
        return <Badge variant="outline" className="text-xs">Medium</Badge>;
      default:
        return null;
    }
  };

  const filterNotifications = (notifications: Notification[]) => {
    let filtered = notifications;
    
    switch (activeTab) {
      case 'unread':
        filtered = notifications.filter(n => !n.isRead && !n.isArchived);
        break;
      case 'signals':
        filtered = notifications.filter(n => n.type === 'signal' && !n.isArchived);
        break;
      case 'price':
        filtered = notifications.filter(n => n.type === 'price' && !n.isArchived);
        break;
      case 'archived':
        filtered = notifications.filter(n => n.isArchived);
        break;
      default:
        filtered = notifications.filter(n => !n.isArchived);
    }
    
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const unreadCount = notifications.filter(n => !n.isRead && !n.isArchived).length;
  const filteredNotifications = filterNotifications(notifications);

  if (isCompact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            {filteredNotifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50 ${
                  !notification.isRead ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                }`}
                onClick={() => markAsReadMutation.mutate(notification.id)}
              >
                {getNotificationIcon(notification.type, notification.priority)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{notification.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Center
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} unread
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Disable sound' : 'Enable sound'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={unreadCount === 0}
            >
              <Check className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className={`flex items-center gap-1 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          <span>•</span>
          <span>Real-time updates</span>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
            <TabsTrigger value="signals">Signals</TabsTrigger>
            <TabsTrigger value="price">Price</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-4">
            <ScrollArea className="h-96">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg border animate-pulse">
                      <div className="w-4 h-4 bg-gray-200 rounded" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications to display</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors ${
                        !notification.isRead ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : ''
                      }`}
                    >
                      {getNotificationIcon(notification.type, notification.priority)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <div className="flex items-center gap-2">
                            {getPriorityBadge(notification.priority)}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!notification.isRead && (
                                  <DropdownMenuItem
                                    onClick={() => markAsReadMutation.mutate(notification.id)}
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Mark as read
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => archiveMutation.mutate(notification.id)}
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                        {notification.metadata && (
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {notification.metadata.symbol && (
                              <span className="font-mono">{notification.metadata.symbol}</span>
                            )}
                            {notification.metadata.price && (
                              <span>${notification.metadata.price.toLocaleString()}</span>
                            )}
                            {notification.metadata.change && (
                              <span className={notification.metadata.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {notification.metadata.change >= 0 ? '+' : ''}{notification.metadata.change.toFixed(2)}%
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}