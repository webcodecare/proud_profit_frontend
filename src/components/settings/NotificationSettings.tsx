import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  Mail, 
  Phone, 
  MessageSquare,
  Smartphone,
  CheckCircle,
  XCircle,
  Volume2
} from 'lucide-react';

interface NotificationSettingsProps {
  settings: any;
  onUpdate: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export default function NotificationSettings({ settings, onUpdate, isLoading }: NotificationSettingsProps) {
  const { toast } = useToast();
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  
  const [notificationData, setNotificationData] = useState({
    // Channel toggles
    notificationEmail: settings?.notificationEmail ?? true,
    notificationSms: settings?.notificationSms ?? false,
    notificationPush: settings?.notificationPush ?? true,
    notificationTelegram: settings?.notificationTelegram ?? false,
    
    // Contact information
    emailAddress: settings?.emailAddress || '',
    phoneNumber: settings?.phoneNumber || '',
    telegramChatId: settings?.telegramChatId || '',
    
    // Alert type preferences
    priceAlerts: settings?.priceAlerts ?? true,
    volumeAlerts: settings?.volumeAlerts ?? false,
    newsAlerts: settings?.newsAlerts ?? true,
    technicalAlerts: settings?.technicalAlerts ?? true,
    whaleAlerts: settings?.whaleAlerts ?? false,
    
    // Push settings
    pushEnabled: settings?.pushEnabled ?? false,
  });

  // Check push notification support
  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setPushSupported(true);
      setPushPermission(Notification.permission);
    }
  }, []);

  const handleSave = async () => {
    try {
      await onUpdate(notificationData);
      toast({
        title: 'Notification Settings Updated',
        description: 'Your notification preferences have been saved.',
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update notification settings.',
        variant: 'destructive',
      });
    }
  };

  const handleToggle = (field: string, value: boolean) => {
    setNotificationData(prev => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (field: string, value: string) => {
    setNotificationData(prev => ({ ...prev, [field]: value }));
  };

  // Request push notification permission
  const requestPushPermission = async () => {
    if (!pushSupported) {
      toast({
        title: 'Not Supported',
        description: 'Push notifications are not supported in this browser.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      
      if (permission === 'granted') {
        // Register service worker and get push subscription
        const registration = await navigator.serviceWorker.register('/sw.js');
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: 'your-vapid-public-key' // Replace with actual VAPID key
        });
        
        handleToggle('pushEnabled', true);
        await onUpdate({ 
          ...notificationData, 
          pushEnabled: true,
          pushSubscription: JSON.stringify(subscription)
        });
        
        toast({
          title: 'Push Notifications Enabled',
          description: 'You will now receive push notifications.',
        });
      } else {
        toast({
          title: 'Permission Denied',
          description: 'Push notifications permission was denied.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Registration Failed',
        description: 'Failed to register for push notifications.',
        variant: 'destructive',
      });
    }
  };

  // Send test notification
  const sendTestNotification = (channel: string) => {
    toast({
      title: `Test ${channel} Notification`,
      description: `This is a test notification for ${channel.toLowerCase()}.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Channels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive trading signals and updates via email
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={notificationData.notificationEmail}
                  onCheckedChange={(checked) => handleToggle('notificationEmail', checked)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sendTestNotification('Email')}
                  disabled={!notificationData.notificationEmail}
                >
                  Test
                </Button>
              </div>
            </div>
            
            {notificationData.notificationEmail && (
              <div>
                <Label htmlFor="emailAddress">Email Address</Label>
                <Input
                  id="emailAddress"
                  type="email"
                  value={notificationData.emailAddress}
                  onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                  placeholder="your.email@example.com"
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* SMS Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Get instant alerts via text message
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={notificationData.notificationSms}
                  onCheckedChange={(checked) => handleToggle('notificationSms', checked)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sendTestNotification('SMS')}
                  disabled={!notificationData.notificationSms}
                >
                  Test
                </Button>
              </div>
            </div>
            
            {notificationData.notificationSms && (
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={notificationData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Include country code (e.g., +1 for US)
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Push Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Browser notifications when page is not active
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pushPermission === 'granted' ? (
                  <Badge variant="default" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                ) : pushPermission === 'denied' ? (
                  <Badge variant="destructive" className="text-xs">
                    <XCircle className="h-3 w-3 mr-1" />
                    Blocked
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={requestPushPermission}
                    disabled={!pushSupported}
                  >
                    Enable
                  </Button>
                )}
              </div>
            </div>
            
            {pushPermission === 'granted' && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={notificationData.pushEnabled}
                  onCheckedChange={(checked) => handleToggle('pushEnabled', checked)}
                />
                <span className="text-sm">Receive push notifications</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Telegram Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-cyan-500" />
                <div>
                  <p className="font-medium">Telegram Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts via Telegram bot
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={notificationData.notificationTelegram}
                  onCheckedChange={(checked) => handleToggle('notificationTelegram', checked)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sendTestNotification('Telegram')}
                  disabled={!notificationData.notificationTelegram}
                >
                  Test
                </Button>
              </div>
            </div>
            
            {notificationData.notificationTelegram && (
              <div>
                <Label htmlFor="telegramChatId">Telegram Chat ID</Label>
                <Input
                  id="telegramChatId"
                  value={notificationData.telegramChatId}
                  onChange={(e) => handleInputChange('telegramChatId', e.target.value)}
                  placeholder="123456789"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Message @cryptostrategy_bot to get your Chat ID
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alert Type Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Alert Types
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Price Alerts</p>
                <p className="text-sm text-muted-foreground">Buy/sell signals</p>
              </div>
              <Switch
                checked={notificationData.priceAlerts}
                onCheckedChange={(checked) => handleToggle('priceAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Volume Alerts</p>
                <p className="text-sm text-muted-foreground">High volume movements</p>
              </div>
              <Switch
                checked={notificationData.volumeAlerts}
                onCheckedChange={(checked) => handleToggle('volumeAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">News Alerts</p>
                <p className="text-sm text-muted-foreground">Market news updates</p>
              </div>
              <Switch
                checked={notificationData.newsAlerts}
                onCheckedChange={(checked) => handleToggle('newsAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Technical Alerts</p>
                <p className="text-sm text-muted-foreground">RSI, MACD indicators</p>
              </div>
              <Switch
                checked={notificationData.technicalAlerts}
                onCheckedChange={(checked) => handleToggle('technicalAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Whale Alerts</p>
                <p className="text-sm text-muted-foreground">Large transactions</p>
              </div>
              <Switch
                checked={notificationData.whaleAlerts}
                onCheckedChange={(checked) => handleToggle('whaleAlerts', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isLoading} className="w-full">
        Save Notification Settings
      </Button>
    </div>
  );
}