import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Trash2,
  TrendingUp,
  TrendingDown
} from "lucide-react";

export default function AlertsSimple() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [alertSettings, setAlertSettings] = useState({
    email: true,
    sms: false,
    push: true,
    telegram: false
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
    {
      id: "3",
      name: "SOL Buy Signal",
      condition: "buy_signal",
      value: 0,
      ticker: "SOLUSDT",
      enabled: true,
    }
  ]);

  const recentAlerts = [
    { id: 1, type: "buy", ticker: "BTCUSDT", price: "$69,200", time: "2 min ago", triggered: true },
    { id: 2, type: "price", ticker: "ETHUSDT", price: "$3,400", time: "5 min ago", triggered: false },
    { id: 3, type: "sell", ticker: "SOLUSDT", price: "$98.50", time: "10 min ago", triggered: true }
  ];

  const handleSettingsUpdate = async (setting: string, value: boolean) => {
    setIsLoading(true);
    try {
      setAlertSettings(prev => ({ ...prev, [setting]: value }));
      toast({
        title: "Settings updated",
        description: `${setting} notifications ${value ? 'enabled' : 'disabled'}`,
      });
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

  const toggleAlert = (alertId: string) => {
    setCustomAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, enabled: !alert.enabled }
          : alert
      )
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        
        {/* Main Content */}
        <div className="ml-0 md:ml-64 flex-1">
          {/* Top Bar */}
          <header className="bg-card border-b border-border p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2 md:space-x-3">
                <Bell className="h-5 w-5 md:h-6 md:w-6" />
                <h1 className="text-xl md:text-2xl font-bold">Alert Center</h1>
              </div>
              <Badge variant="outline" className="text-emerald-400 text-xs md:text-sm self-start sm:self-auto">
                Real-Time Alerts
              </Badge>
            </div>
          </header>

          {/* Alert Content */}
          <div className="p-4 md:p-6">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="custom">Custom Alerts</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Alert Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {customAlerts.filter(a => a.enabled).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Currently active</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Today's Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">12</div>
                      <div className="text-sm text-green-500">+3 from yesterday</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Channels</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {Object.values(alertSettings).filter(Boolean).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Enabled channels</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">98%</div>
                      <div className="text-sm text-green-500">Delivery success</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Alerts */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentAlerts.map((alert) => (
                        <div key={alert.id} className="flex items-center justify-between p-3 bg-muted rounded">
                          <div className="flex items-center space-x-3">
                            {alert.type === 'buy' ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : alert.type === 'sell' ? (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            ) : (
                              <Target className="h-4 w-4 text-blue-500" />
                            )}
                            <div>
                              <span className="font-medium">{alert.ticker}</span>
                              <span className="ml-2 text-sm capitalize">{alert.type}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{alert.price}</div>
                            <div className="text-sm text-muted-foreground">{alert.time}</div>
                          </div>
                          <Badge variant={alert.triggered ? "default" : "secondary"}>
                            {alert.triggered ? "Triggered" : "Pending"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Channels</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Configure how you want to receive alerts
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-blue-500" />
                        <div>
                          <Label className="text-base">Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive alerts via email</p>
                        </div>
                      </div>
                      <Switch
                        checked={alertSettings.email}
                        onCheckedChange={(checked) => handleSettingsUpdate('email', checked)}
                        disabled={isLoading}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Smartphone className="h-5 w-5 text-green-500" />
                        <div>
                          <Label className="text-base">SMS Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive alerts via SMS</p>
                        </div>
                      </div>
                      <Switch
                        checked={alertSettings.sms}
                        onCheckedChange={(checked) => handleSettingsUpdate('sms', checked)}
                        disabled={isLoading}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Volume2 className="h-5 w-5 text-purple-500" />
                        <div>
                          <Label className="text-base">Push Notifications</Label>
                          <p className="text-sm text-muted-foreground">Browser push notifications</p>
                        </div>
                      </div>
                      <Switch
                        checked={alertSettings.push}
                        onCheckedChange={(checked) => handleSettingsUpdate('push', checked)}
                        disabled={isLoading}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <MessageSquare className="h-5 w-5 text-blue-400" />
                        <div>
                          <Label className="text-base">Telegram Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive alerts via Telegram bot</p>
                        </div>
                      </div>
                      <Switch
                        checked={alertSettings.telegram}
                        onCheckedChange={(checked) => handleSettingsUpdate('telegram', checked)}
                        disabled={isLoading}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="custom" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Custom Alerts</CardTitle>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Alert
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Create custom price and signal alerts
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {customAlerts.map((alert) => (
                        <div key={alert.id} className="flex items-center justify-between p-4 bg-muted rounded">
                          <div className="flex items-center space-x-4">
                            <Switch
                              checked={alert.enabled}
                              onCheckedChange={() => toggleAlert(alert.id)}
                            />
                            <div>
                              <div className="font-medium">{alert.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {alert.ticker} {alert.condition.replace('_', ' ')} ${alert.value.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Alert History</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      View all triggered alerts from the past 30 days
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentAlerts.concat(recentAlerts).map((alert, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded">
                          <div className="flex items-center space-x-3">
                            {alert.type === 'buy' ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : alert.type === 'sell' ? (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            ) : (
                              <Target className="h-4 w-4 text-blue-500" />
                            )}
                            <div>
                              <span className="font-medium">{alert.ticker}</span>
                              <span className="ml-2 text-sm capitalize">{alert.type} Alert</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{alert.price}</div>
                            <div className="text-sm text-muted-foreground">{alert.time}</div>
                          </div>
                          <Badge variant={alert.triggered ? "default" : "secondary"}>
                            {alert.triggered ? "Delivered" : "Failed"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}