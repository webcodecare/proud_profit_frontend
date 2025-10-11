import React, { useState } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tokenStorage } from '@/lib/auth';

interface Alert {
  id: string;
  type: 'price' | 'technical' | 'volume' | 'news' | 'whale';
  ticker: string;
  condition: string;
  value: number;
  enabled: boolean;
  channels: string[];
  createdAt: string;
  lastTriggered?: string;
}

interface AlertFormData {
  type: string;
  ticker: string;
  condition: string;
  value: number;
  channels: string[];
}

export default function AlertSystem() {
  const [newAlert, setNewAlert] = useState<AlertFormData>({
    type: 'price',
    ticker: 'BTCUSDT',
    condition: 'above',
    value: 70000,
    channels: ['email']
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = tokenStorage.get();

  // Helper function for authenticated requests
  const authRequest = async (method: string, url: string, data?: any) => {
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create alerts",
        variant: "destructive",
      });
      throw new Error("Please log in to create alerts");
    }
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: "Unknown error occurred" };
        }
        
        // User-friendly error messages with toast notifications
        let errorMessage = "Failed to create alert. Please try again.";
        
        if (response.status === 400 && errorData.code === 'INVALID_USER_ID') {
          errorMessage = "Your session has expired. Please log in again to continue.";
        } else if (response.status === 401) {
          errorMessage = "Please log in again to continue";
        } else if (response.status === 403) {
          errorMessage = "You don't have permission to perform this action";
        } else if (response.status === 409) {
          errorMessage = "An alert with these settings already exists";
        } else if (response.status === 422) {
          if (errorData.code === 'VALIDATION_ERROR') {
            errorMessage = "Please check your alert settings. Some information may be invalid.";
          } else {
            errorMessage = "Please check your alert settings and try again";
          }
        } else if (response.status === 500 && errorData.code === 'DATABASE_ERROR') {
          errorMessage = "Database connection issue. Please try again in a moment.";
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        toast({
          title: "Alert Creation Failed",
          description: errorMessage,
          variant: "destructive",
        });
        
        throw new Error(errorMessage);
      }
      
      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        // Only show toast if it hasn't been shown already
        if (!error.message.includes("log in")) {
          toast({
            title: "Network Error",
            description: error.message || "Please check your connection and try again.",
            variant: "destructive",
          });
        }
        throw error;
      }
      const networkError = "Network error. Please check your connection and try again.";
      toast({
        title: "Connection Error",
        description: networkError,
        variant: "destructive",
      });
      throw new Error(networkError);
    }
  };

  const { data: alerts = [], isLoading: alertsLoading, error: alertsError } = useQuery({
    queryKey: ['/api/alerts', token],
    queryFn: () => authRequest('GET', '/api/alerts'),
    enabled: !!token,
    retry: 1,
    staleTime: 30000,
  });

  const { data: tickers = [], isLoading: tickersLoading, error: tickersError } = useQuery({
    queryKey: ['/api/tickers', token],
    queryFn: () => authRequest('GET', '/api/tickers'),
    enabled: !!token,
    retry: 1,
    staleTime: 60000,
  });

  const isLoading = alertsLoading || tickersLoading;

  const createAlertMutation = useMutation({
    mutationFn: (alertData: AlertFormData) => {
      // Convert value to string to match decimal schema
      const payload = {
        ...alertData,
        value: alertData.value.toString()
      };
      return authRequest('POST', '/api/alerts', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts', token] });
      toast({
        title: "Alert Created",
        description: "Your alert has been set up successfully",
      });
      setNewAlert({
        type: 'price',
        ticker: 'BTCUSDT',
        condition: 'above',
        value: 70000,
        channels: ['email']
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create alert",
        variant: "destructive",
      });
    },
  });

  const updateAlertMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => 
      authRequest('PATCH', `/api/alerts/${id}`, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts', token] });
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (id: string) => authRequest('DELETE', `/api/alerts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts', token] });
      toast({
        title: "Alert Deleted",
        description: "Alert has been removed",
      });
    },
  });

  const handleCreateAlert = async () => {
    if (!newAlert.ticker || !newAlert.value || newAlert.channels.length === 0) {
      toast({
        title: "Invalid Alert",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    await createAlertMutation.mutateAsync(newAlert);
  };

  const handleChannelToggle = (channel: string) => {
    setNewAlert(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'price': return <TrendingUp className="h-4 w-4" />;
      case 'technical': return <Activity className="h-4 w-4" />;
      case 'volume': return <TrendingDown className="h-4 w-4" />;
      case 'news': return <MessageSquare className="h-4 w-4" />;
      case 'whale': return <Bell className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'price': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'technical': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'volume': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'news': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'whale': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Authentication check
  if (!token) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-muted-foreground mb-4">
              Please log in to access the alert system.
            </p>
            <Button onClick={() => window.location.href = "/login"}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-2"></div>
            <div className="h-4 bg-muted rounded w-96"></div>
          </div>
          <div className="h-6 bg-muted rounded w-24"></div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (alertsError || tickersError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Alerts</h3>
            <p className="text-muted-foreground mb-4">
              {alertsError?.message || tickersError?.message || "There was an error loading the alert system."}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/alerts', token] });
                queryClient.invalidateQueries({ queryKey: ['/api/tickers', token] });
              }}>
                Retry
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Advanced Alert System</h2>
          <p className="text-muted-foreground">
            Set up intelligent alerts for price movements, technical indicators, and market events
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {alerts.length} Active Alerts
        </Badge>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create Alert</TabsTrigger>
          <TabsTrigger value="active">Active Alerts</TabsTrigger>
          <TabsTrigger value="history">Alert History</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Alert</CardTitle>
              <CardDescription>
                Set up custom alerts for price movements, technical indicators, and market events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="alert-type">Alert Type</Label>
                  <Select value={newAlert.type} onValueChange={(value) => setNewAlert(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select alert type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price">Price Alert</SelectItem>
                      <SelectItem value="technical">Technical Indicator</SelectItem>
                      <SelectItem value="volume">Volume Spike</SelectItem>
                      <SelectItem value="news">News Event</SelectItem>
                      <SelectItem value="whale">Whale Movement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ticker">Cryptocurrency</Label>
                  <Select value={newAlert.ticker} onValueChange={(value) => setNewAlert(prev => ({ ...prev, ticker: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ticker" />
                    </SelectTrigger>
                    <SelectContent>
                      {tickers.map((ticker: any) => (
                        <SelectItem key={ticker.id} value={ticker.symbol}>
                          {ticker.symbol} - {ticker.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select value={newAlert.condition} onValueChange={(value) => setNewAlert(prev => ({ ...prev, condition: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Price Above</SelectItem>
                      <SelectItem value="below">Price Below</SelectItem>
                      <SelectItem value="crosses_above">Crosses Above</SelectItem>
                      <SelectItem value="crosses_below">Crosses Below</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value">Value</Label>
                  <Input
                    id="value"
                    type="number"
                    value={newAlert.value}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                    placeholder="Enter threshold value"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notification Channels</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'email', label: 'Email', icon: Mail },
                    { key: 'sms', label: 'SMS', icon: Smartphone },
                    { key: 'push', label: 'Push', icon: Bell },
                    { key: 'telegram', label: 'Telegram', icon: MessageSquare },
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={key}
                        checked={newAlert.channels.includes(key)}
                        onChange={() => handleChannelToggle(key)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={key} className="flex items-center space-x-1 cursor-pointer">
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleCreateAlert}
                disabled={createAlertMutation.isPending}
                className="w-full"
              >
                {createAlertMutation.isPending ? 'Creating...' : 'Create Alert'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading alerts...</div>
          ) : alerts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
                <p className="text-muted-foreground">Create your first alert to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {alerts.map((alert: Alert) => (
                <Card key={alert.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getAlertIcon(alert.type)}
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">{alert.ticker}</span>
                            <Badge className={getAlertTypeColor(alert.type)}>
                              {alert.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {alert.condition} {alert.value}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={alert.enabled}
                          onCheckedChange={(enabled) => updateAlertMutation.mutate({ id: alert.id, enabled })}
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteAlertMutation.mutate(alert.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert History</CardTitle>
              <CardDescription>View your triggered alerts and notification history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Alert history will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}