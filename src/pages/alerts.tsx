import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import AlertsView from "@/components/alerts/AlertsView";
import SubscriptionGuard from "@/components/auth/SubscriptionGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  Mail, 
  Smartphone, 
  MessageSquare,
  Volume2,
  Settings,
  Target,
  Activity,
  Plus,
  Edit,
  Trash2
} from "lucide-react";

export default function Alerts() {
  const { settings, updateSettings } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAlert, setEditingAlert] = useState<any>(null);

  const [alertSettings, setAlertSettings] = useState({
    email: settings?.notificationEmail ?? true,
    sms: settings?.notificationSms ?? false,
    push: settings?.notificationPush ?? true,
  });

  const [customAlerts, setCustomAlerts] = useState([
    {
      id: "1",
      name: "BTC Price Alert",
      condition: "price_above",
      value: 70000,
      ticker: "BTCUSDT",
      enabled: true,
    },
    {
      id: "2",
      name: "ETH Drop Alert",
      condition: "price_below",
      value: 3000,
      ticker: "ETHUSDT",
      enabled: false,
    },
  ]);

  const handleSettingsUpdate = async (newSettings: Partial<typeof alertSettings>) => {
    setIsLoading(true);
    try {
      await updateSettings({
        notificationEmail: newSettings.email ?? alertSettings.email,
        notificationSms: newSettings.sms ?? alertSettings.sms,
        notificationPush: newSettings.push ?? alertSettings.push,
      });
      setAlertSettings({ ...alertSettings, ...newSettings });
    } catch (error) {
      toast({
        title: "Failed to update settings",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAlert = () => {
    toast({
      title: "Add Alert",
      description: "Opening alert creation dialog...",
    });
    // You can add a modal/dialog here or navigate to a form
    setShowAddDialog(true);
  };

  const handleEditAlert = (alert: any) => {
    setEditingAlert(alert);
    toast({
      title: "Edit Alert",
      description: `Editing alert: ${alert.name}`,
    });
  };

  const handleDeleteAlert = (alertId: string) => {
    setCustomAlerts(prev => prev.filter(alert => alert.id !== alertId));
    toast({
      title: "Alert Deleted",
      description: "The alert has been removed successfully.",
    });
  };

  const alertTypes = [
    {
      id: "email",
      title: "Email Notifications",
      description: "Receive alerts via email",
      icon: Mail,
      enabled: alertSettings.email,
      details: "Get detailed signal analysis and market insights via email",
    },
    {
      id: "sms",
      title: "SMS Alerts",
      description: "Instant SMS notifications",
      icon: Smartphone,
      enabled: alertSettings.sms,
      details: "Immediate text messages for urgent trading signals",
    },
    {
      id: "push",
      title: "Push Notifications",
      description: "Browser push notifications",
      icon: Bell,
      enabled: alertSettings.push,
      details: "Real-time notifications in your browser",
    },
  ];

  const recentAlerts = [
    {
      id: "1",
      type: "buy",
      ticker: "BTCUSDT",
      price: 67234.56,
      time: "2 hours ago",
      delivered: ["email", "push"],
    },
    {
      id: "2",
      type: "sell",
      ticker: "ETHUSDT",
      price: 3456.78,
      time: "5 hours ago",
      delivered: ["email"],
    },
    {
      id: "3",
      type: "price_alert",
      ticker: "BTCUSDT",
      price: 70000,
      time: "1 day ago",
      delivered: ["email", "sms", "push"],
    },
  ];

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
            {/* Notification Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Notification Methods
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {alertTypes.map((alertType) => {
                  const IconComponent = alertType.icon;
                  return (
                    <div key={alertType.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg ${alertType.enabled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{alertType.title}</h3>
                          <p className="text-sm text-muted-foreground">{alertType.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">{alertType.details}</p>
                        </div>
                      </div>
                      <Switch
                        checked={alertType.enabled}
                        onCheckedChange={(checked) =>
                          handleSettingsUpdate({ [alertType.id]: checked })
                        }
                        disabled={isLoading}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Custom Price Alerts */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Volume2 className="mr-2 h-5 w-5" />
                    Custom Price Alerts
                  </CardTitle>
                  <Button onClick={handleAddAlert}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Alert
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Switch
                          checked={alert.enabled}
                          onCheckedChange={(checked) => {
                            setCustomAlerts(prev =>
                              prev.map(a => a.id === alert.id ? { ...a, enabled: checked } : a)
                            );
                          }}
                        />
                        <div>
                          <h3 className="font-semibold">{alert.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {alert.ticker} {alert.condition === 'price_above' ? 'above' : 'below'} ${alert.value.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={alert.enabled ? "default" : "secondary"}>
                          {alert.enabled ? "Active" : "Inactive"}
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={() => handleEditAlert(alert)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteAlert(alert.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Signal Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Signal Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signal-frequency">Signal Frequency</Label>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Signals</SelectItem>
                        <SelectItem value="high-confidence">High Confidence Only</SelectItem>
                        <SelectItem value="buy-only">Buy Signals Only</SelectItem>
                        <SelectItem value="sell-only">Sell Signals Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minimum-price">Minimum Price Change (%)</Label>
                    <Input 
                      id="minimum-price"
                      type="number"
                      placeholder="2.5"
                      defaultValue="2.5"
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-semibold">Quiet Hours</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quiet-start">Start Time</Label>
                      <Input 
                        id="quiet-start"
                        type="time"
                        defaultValue="22:00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quiet-end">End Time</Label>
                      <Input 
                        id="quiet-end"
                        type="time"
                        defaultValue="08:00"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          alert.type === 'buy' ? 'bg-emerald-400' : 
                          alert.type === 'sell' ? 'bg-red-400' : 
                          'bg-yellow-400'
                        }`} />
                        <div>
                          <h3 className="font-semibold">
                            {alert.type === 'price_alert' ? 'Price Alert' : `${alert.type.toUpperCase()} Signal`} - {alert.ticker}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Price: ${alert.price.toLocaleString()} • {alert.time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {alert.delivered.includes('email') && <Mail className="h-4 w-4 text-blue-400" />}
                        {alert.delivered.includes('sms') && <MessageSquare className="h-4 w-4 text-green-400" />}
                        {alert.delivered.includes('push') && <Bell className="h-4 w-4 text-yellow-400" />}
                      </div>
                    </div>
                  ))}
                </div>
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
