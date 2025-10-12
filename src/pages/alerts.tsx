import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";
import AlertsView from "@/components/alerts/AlertsView";
import SubscriptionGuard from "@/components/auth/SubscriptionGuard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  Mail, 
  Smartphone, 
  MessageSquare,
  Settings,
  Target
} from "lucide-react";

interface RecentAlert {
  id: string;
  ticker: string;
  signal_type: 'buy' | 'sell' | 'price_alert';
  price: string;
  timestamp: string;
  created_at: string;
}

export default function Alerts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user settings directly from Supabase
  const { data: userSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['user-settings-alerts', user?.id],
    queryFn: async () => {
      if (!supabase || !user?.id) {
        return {
          notification_email: true,
          notification_sms: false,
          notification_push: true,
          notification_telegram: false,
        };
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('notification_email, notification_sms, notification_push, notification_telegram')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching settings:', error);
        if (error.code === 'PGRST116') {
          // No settings found, create default
          const defaultSettings = {
            user_id: user.id,
            notification_email: true,
            notification_sms: false,
            notification_push: true,
            notification_telegram: false,
          };

          const { data: newSettings, error: insertError } = await supabase
            .from('user_settings')
            .insert([defaultSettings])
            .select('notification_email, notification_sms, notification_push, notification_telegram')
            .single();

          if (insertError) {
            console.error('Error creating settings:', insertError);
            return defaultSettings;
          }

          return newSettings;
        }
        return {
          notification_email: true,
          notification_sms: false,
          notification_push: true,
          notification_telegram: false,
        };
      }

      return data;
    },
    enabled: !!user?.id,
  });

  const [alertSettings, setAlertSettings] = useState({
    email: userSettings?.notification_email ?? true,
    sms: userSettings?.notification_sms ?? false,
    push: userSettings?.notification_push ?? true,
    telegram: userSettings?.notification_telegram ?? false,
  });

  // Update local state when settings from Supabase change
  useEffect(() => {
    if (userSettings) {
      setAlertSettings({
        email: userSettings.notification_email ?? true,
        sms: userSettings.notification_sms ?? false,
        push: userSettings.notification_push ?? true,
        telegram: userSettings.notification_telegram ?? false,
      });
    }
  }, [userSettings]);

  // Fetch recent alerts from Supabase
  const { data: recentAlertsData } = useQuery({
    queryKey: ['recent-alerts'],
    queryFn: async () => {
      if (!supabase) {
        console.log('Supabase not configured');
        return [];
      }

      const { data, error } = await supabase
        .from('alert_signals')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching recent alerts:', error);
        return [];
      }

      return (data as RecentAlert[]) || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const recentAlerts = recentAlertsData || [];

  // Supabase mutation for updating settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<typeof alertSettings>) => {
      if (!supabase || !user?.id) {
        throw new Error("Please log in to save settings");
      }

      console.log('Updating notification settings:', newSettings);

      // Map UI state to database columns
      const dbUpdates = {
        notification_email: newSettings.email ?? alertSettings.email,
        notification_sms: newSettings.sms ?? alertSettings.sms,
        notification_push: newSettings.push ?? alertSettings.push,
        notification_telegram: newSettings.telegram ?? alertSettings.telegram,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('user_settings')
        .update(dbUpdates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw new Error(error.message || 'Failed to update settings');
      }

      return data;
    },
    onSuccess: () => {
      console.log('Settings updated successfully');
      toast({
        title: "✅ Settings Updated",
        description: "Your notification preferences have been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['user-settings-alerts', user?.id] });
    },
    onError: (error: any) => {
      console.error('Settings update error:', error);
      toast({
        title: "❌ Failed to update settings",
        description: error?.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const handleSettingsUpdate = async (newSettings: Partial<typeof alertSettings>) => {
    // Check if user is logged in
    if (!user) {
      toast({
        title: "⚠️ Authentication Required",
        description: "Please log in to save notification settings",
        variant: "destructive",
      });
      return;
    }

    // Update local state immediately for better UX
    setAlertSettings({ ...alertSettings, ...newSettings });
    
    // Update database
    updateSettingsMutation.mutate(newSettings);
  };

  const alertTypes = [
    {
      id: "email",
      title: "Email Notifications",
      description: "Receive alerts via email",
      icon: Mail,
      enabled: alertSettings.email,
      details: "Get detailed signal analysis and market insights via email",
      badge: alertSettings.email ? "Active" : "Disabled",
    },
    // {
    //   id: "sms",
    //   title: "SMS Alerts",
    //   description: "Instant SMS notifications",
    //   icon: Smartphone,
    //   enabled: alertSettings.sms,
    //   details: "Immediate text messages for urgent trading signals",
    //   badge: alertSettings.sms ? "Active" : "Disabled",
    // },
    {
      id: "push",
      title: "Push Notifications",
      description: "Browser push notifications",
      icon: Bell,
      enabled: alertSettings.push,
      details: "Real-time notifications in your browser",
      badge: alertSettings.push ? "Active" : "Disabled",
    },
    // {
    //   id: "telegram",
    //   title: "Telegram Alerts",
    //   description: "Receive notifications on Telegram",
    //   icon: MessageSquare,
    //   enabled: alertSettings.telegram,
    //   details: "Get instant alerts on your Telegram account",
    //   badge: alertSettings.telegram ? "Active" : "Disabled",
    // },
  ];

  const getDeliveryChannels = (alert: RecentAlert) => {
    const channels: string[] = [];
    if (alertSettings.email) channels.push('email');
    if (alertSettings.sms) channels.push('sms');
    if (alertSettings.push) channels.push('push');
    if (alertSettings.telegram) channels.push('telegram');
    return channels;
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        
        {/* Main Content */}
        <div className="ml-0 md:ml-64 flex-1">
          <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
            <Tabs defaultValue="signals" className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-2 text-xs sm:text-sm">
                <TabsTrigger value="signals" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
                  <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Trading Signals</span>
                  <span className="sm:hidden">🎯</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Alert Settings</span>
                  <span className="sm:hidden">⚙️</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signals" className="space-y-6">
                <SubscriptionGuard feature="advancedAlerts">
                  <AlertsView />
                </SubscriptionGuard>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold tracking-tight mb-2">Alert Settings</h1>
                  <p className="text-muted-foreground">
                    Configure your notification preferences and manage custom alerts
                  </p>
                </div>

                <div className="space-y-6">
            {/* Notification Methods - Fully Dynamic */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Notification Methods
                </CardTitle>
                <CardDescription>
                  Configure how you want to receive trading signals and alerts. Changes are saved automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(updateSettingsMutation.isPending || settingsLoading) && (
                  <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      {updateSettingsMutation.isPending ? 'Saving preferences...' : 'Loading settings...'}
                    </div>
                  </div>
                )}
                
                <div className="grid gap-4">
                  {alertTypes.map((alertType) => {
                    const IconComponent = alertType.icon;
                    return (
                      <div 
                        key={alertType.id} 
                        className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                          alertType.enabled 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-muted-foreground/50'
                        }`}
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className={`p-3 rounded-lg transition-colors ${
                            alertType.enabled 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{alertType.title}</h3>
                              <Badge 
                                variant={alertType.enabled ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {alertType.badge}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{alertType.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">{alertType.details}</p>
                          </div>
                        </div>
                        <Switch
                          checked={alertType.enabled}
                          onCheckedChange={(checked) =>
                            handleSettingsUpdate({ [alertType.id]: checked })
                          }
                          disabled={updateSettingsMutation.isPending || !user}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* User Info */}
                {user && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                    <p>Notifications for: <span className="font-semibold">{user.email}</span></p>
                    <p className="mt-1">Settings are synced across all your devices</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Alerts - Dynamic from Supabase */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {recentAlerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent alerts found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentAlerts.map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full ${
                            alert.signal_type === 'buy' ? 'bg-emerald-400' : 
                            alert.signal_type === 'sell' ? 'bg-red-400' : 
                            'bg-yellow-400'
                          }`} />
                          <div>
                            <h3 className="font-semibold">
                              {alert.signal_type === 'price_alert' ? 'Price Alert' : `${alert.signal_type.toUpperCase()} Signal`} - {alert.ticker}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Price: ${parseFloat(alert.price).toLocaleString()} • {formatTimeAgo(alert.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getDeliveryChannels(alert).map((channel) => (
                            <div key={channel}>
                              {channel === 'email' && <Mail className="h-4 w-4 text-blue-400" />}
                              {channel === 'sms' && <MessageSquare className="h-4 w-4 text-green-400" />}
                              {channel === 'push' && <Bell className="h-4 w-4 text-yellow-400" />}
                              {channel === 'telegram' && <MessageSquare className="h-4 w-4 text-purple-400" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
