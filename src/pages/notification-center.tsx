import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import Sidebar from '@/components/layout/Sidebar';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import NotificationStats from '@/components/notifications/NotificationStats';
import ContextualAlert from '@/components/notifications/ContextualAlert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Settings, 
  TestTube, 
  Volume2, 
  VolumeX,
  Monitor,
  Smartphone,
  Activity
} from 'lucide-react';

export default function NotificationCenterPage() {
  const { user } = useAuth();
  const {
    notifications,
    contextualAlerts,
    preferences,
    unreadCount,
    isConnected,
    updatePreferences,
    dismissContextualAlert,
    createTestNotification,
    requestNotificationPermission,
  } = useNotifications();

  if (!user) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-muted-foreground">Please log in to access the notification center.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 md:ml-64">
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Notification Center</h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Manage your real-time alerts and notification preferences
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  {unreadCount} unread
                </Badge>
                <Badge 
                  variant={isConnected ? "default" : "destructive"} 
                  className="flex items-center gap-1"
                >
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Statistics Section */}
            <NotificationStats />

            <Separator />

            {/* Main Content */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Notification Center - Takes up 2 columns */}
              <div className="xl:col-span-2">
                <NotificationCenter />
              </div>

              {/* Settings Panel */}
              <div className="space-y-6">
                {/* Notification Preferences */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Global Settings */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">General</h4>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {preferences.enableSound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                          <Label htmlFor="sound">Sound Alerts</Label>
                        </div>
                        <Switch
                          id="sound"
                          checked={preferences.enableSound}
                          onCheckedChange={(checked) => 
                            updatePreferences({ enableSound: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          <Label htmlFor="browser">Browser Notifications</Label>
                        </div>
                        <Switch
                          id="browser"
                          checked={preferences.enableBrowser}
                          onCheckedChange={(checked) => 
                            updatePreferences({ enableBrowser: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          <Label htmlFor="contextual">Contextual Alerts</Label>
                        </div>
                        <Switch
                          id="contextual"
                          checked={preferences.enableContextual}
                          onCheckedChange={(checked) => 
                            updatePreferences({ enableContextual: checked })
                          }
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Categories */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Categories</h4>
                      
                      {Object.entries(preferences.categories || {}).map(([category, enabled]) => (
                        <div key={category} className="flex items-center justify-between">
                          <Label htmlFor={category} className="capitalize">
                            {category}
                          </Label>
                          <Switch
                            id={category}
                            checked={enabled}
                            onCheckedChange={(checked) => 
                              updatePreferences({ 
                                categories: { 
                                  ...preferences.categories, 
                                  [category]: checked 
                                } 
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Priorities */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Priorities</h4>
                      
                      {Object.entries(preferences.priorities || {}).map(([priority, enabled]) => (
                        <div key={priority} className="flex items-center justify-between">
                          <Label htmlFor={priority} className="capitalize">
                            {priority}
                          </Label>
                          <Switch
                            id={priority}
                            checked={enabled}
                            onCheckedChange={(checked) => 
                              updatePreferences({ 
                                priorities: { 
                                  ...preferences.priorities, 
                                  [priority]: checked 
                                } 
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Test Notifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TestTube className="h-5 w-5" />
                      Test Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Test different types of notifications to verify your settings.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => createTestNotification('signal')}
                      >
                        Signal
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => createTestNotification('price')}
                      >
                        Price
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => createTestNotification('news')}
                      >
                        News
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => createTestNotification('system')}
                      >
                        System
                      </Button>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={requestNotificationPermission}
                    >
                      Enable Browser Notifications
                    </Button>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Notifications:</span>
                      <span className="font-medium">{notifications.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Unread:</span>
                      <span className="font-medium">{unreadCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Today:</span>
                      <span className="font-medium">
                        {notifications.filter(n => 
                          new Date(n.timestamp).toDateString() === new Date().toDateString()
                        ).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Connection:</span>
                      <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                        {isConnected ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contextual Alerts */}
      <ContextualAlert
        alerts={contextualAlerts}
        onDismiss={dismissContextualAlert}
        position="top-right"
      />
    </div>
  );
}