import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Plus, Trash2, Bell, Mail, MessageSquare, Smartphone, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface UserSubscription {
  id: string;
  tickerSymbol: string;
  timeframe: string;
  deliveryMethods: string[];
  isActive: boolean;
  createdAt: string;
}

interface AvailableTickerTimeframe {
  id: string;
  tickerSymbol: string;
  timeframe: string;
  description: string;
  isEnabled: boolean;
}

interface UserSignal {
  id: string;
  symbol: string;
  signalType: 'buy' | 'sell';
  price: number;
  timeframe: string;
  timestamp: string;
  notes?: string;
  confidence?: number;
}

export default function SubscriptionManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // New subscription form state
  const [newSubscription, setNewSubscription] = useState({
    tickerSymbol: '',
    timeframe: '',
    deliveryMethods: [] as string[]
  });

  // Fetch user's current subscriptions
  const { data: subscriptionsData, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['/api/user/subscriptions']
  });

  // Fetch available ticker/timeframe combinations
  const { data: availableCombinationsData, isLoading: combinationsLoading } = useQuery({
    queryKey: ['/api/admin/ticker-timeframes']
  });

  // Fetch user's personalized signals
  const { data: userSignalsData, isLoading: userSignalsLoading } = useQuery({
    queryKey: ['/api/user/signals']
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: (subscription: any) => apiRequest('POST', '/api/user/subscriptions', subscription),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/subscriptions'] });
      setNewSubscription({
        tickerSymbol: '',
        timeframe: '',
        deliveryMethods: []
      });
      toast({
        title: 'Subscription Added',
        description: 'You will now receive signals for this ticker/timeframe combination'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Subscription Failed',
        description: error.message || 'Failed to create subscription',
        variant: 'destructive'
      });
    }
  });

  // Delete subscription mutation
  const deleteSubscriptionMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/user/subscriptions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/subscriptions'] });
      toast({
        title: 'Subscription Removed',
        description: 'You will no longer receive signals for this combination'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Removing Subscription',
        description: error.message || 'Failed to remove subscription',
        variant: 'destructive'
      });
    }
  });

  const handleCreateSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubscription.tickerSymbol || !newSubscription.timeframe || newSubscription.deliveryMethods.length === 0) {
      toast({
        title: 'Missing Information',
        description: 'Please select ticker, timeframe, and at least one notification method',
        variant: 'destructive'
      });
      return;
    }
    createSubscriptionMutation.mutate(newSubscription);
  };

  const handleDeliveryMethodChange = (method: string, checked: boolean) => {
    setNewSubscription(prev => ({
      ...prev,
      deliveryMethods: checked 
        ? [...prev.deliveryMethods, method]
        : prev.deliveryMethods.filter(m => m !== method)
    }));
  };

  const subscriptions = subscriptionsData?.subscriptions || [];
  const availableCombinations = availableCombinationsData?.combinations || [];
  const userSignals = userSignalsData?.signals || [];

  // Filter available combinations to exclude already subscribed ones
  const availableForSubscription = availableCombinations.filter((combo: AvailableTickerTimeframe) =>
    !subscriptions.some((sub: UserSubscription) => 
      sub.tickerSymbol === combo.tickerSymbol && sub.timeframe === combo.timeframe
    )
  );

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 space-y-4 lg:space-y-6 max-w-7xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Signal Subscriptions</h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Manage your signal subscriptions and notification preferences
                </p>
              </div>
            </div>

            <Tabs defaultValue="subscriptions" className="space-y-4 lg:space-y-6">
              <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:grid-cols-none sm:inline-flex">
                <TabsTrigger value="subscriptions" className="text-xs sm:text-sm px-2 sm:px-4">My Subs</TabsTrigger>
                <TabsTrigger value="add-subscription" className="text-xs sm:text-sm px-2 sm:px-4">Manage</TabsTrigger>
                <TabsTrigger value="my-signals" className="text-xs sm:text-sm px-2 sm:px-4">Signals</TabsTrigger>
              </TabsList>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Active Subscriptions
              </CardTitle>
              <CardDescription>
                Your current signal subscriptions and notification settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptionsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No Active Subscriptions</p>
                  <p>Add your first subscription to start receiving signals</p>
                </div>
              ) : (
                <div className="space-y-3 lg:space-y-4">
                  {subscriptions.map((subscription: UserSubscription) => (
                    <div key={subscription.id} className="border rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <h3 className="font-semibold text-sm sm:text-base lg:text-lg truncate">
                            {subscription.tickerSymbol}
                          </h3>
                          <Badge variant="outline" className="text-xs sm:text-sm shrink-0">
                            {subscription.timeframe}
                          </Badge>
                          <Badge variant={subscription.isActive ? "default" : "secondary"} className="text-xs sm:text-sm shrink-0">
                            {subscription.isActive ? "Active" : "Paused"}
                          </Badge>
                        </div>
                        <div className="shrink-0 self-end sm:self-start">
                          <Badge variant="secondary" className="text-xs">
                            Admin Managed
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                        <span className="text-muted-foreground shrink-0">Notifications:</span>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1">
                          {subscription.deliveryMethods.map((method: string) => (
                            <div key={method} className="flex items-center gap-1 shrink-0">
                              {method === 'email' && <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />}
                              {method === 'sms' && <Smartphone className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />}
                              {method === 'telegram' && <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />}
                              <span className="capitalize">{method}</span>
                            </div>
                          ))}
                        </div>
                        <span className="text-muted-foreground text-xs sm:text-sm mt-2 sm:mt-0 sm:ml-auto">
                          Since {new Date(subscription.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add-subscription">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Subscription Management Restricted
              </CardTitle>
              <CardDescription>
                Signal subscriptions are now managed by administrators. Contact support to modify your subscriptions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-semibold">Admin-Only Management</h3>
                  <p className="text-muted-foreground text-sm">
                    To ensure optimal signal delivery and prevent conflicts, only administrators can now add or remove signal subscriptions.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Please contact your administrator or support team to:
                  </p>
                  <ul className="text-left text-sm text-muted-foreground space-y-1 mt-4">
                    <li>• Add new ticker/timeframe subscriptions</li>
                    <li>• Modify notification delivery methods</li>
                    <li>• Remove unwanted subscriptions</li>
                    <li>• Update subscription preferences</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-signals">
          <Card>
            <CardHeader>
              <CardTitle>Your Recent Signals</CardTitle>
              <CardDescription>
                Signals sent to you based on your subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userSignalsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : userSignals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No Signals Received</p>
                  <p>Subscribe to ticker/timeframe combinations to receive signals</p>
                </div>
              ) : (
                <div className="space-y-3 lg:space-y-4">
                  {userSignals.map((signal: UserSignal) => (
                    <div key={signal.id} className="border rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          {signal.signalType === 'buy' ? (
                            <div className="flex items-center gap-2 shrink-0">
                              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                              <Badge className="bg-green-100 text-green-800 text-xs sm:text-sm">BUY</Badge>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 shrink-0">
                              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                              <Badge className="bg-red-100 text-red-800 text-xs sm:text-sm">SELL</Badge>
                            </div>
                          )}
                          <h3 className="font-semibold text-sm sm:text-base lg:text-lg truncate">{signal.symbol}</h3>
                          <Badge variant="outline" className="text-xs sm:text-sm shrink-0">{signal.timeframe}</Badge>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <p className="text-base sm:text-lg font-bold">${signal.price}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {new Date(signal.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      {signal.notes && (
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">{signal.notes}</p>
                      )}
                      
                      {signal.confidence && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <span className="text-muted-foreground">Confidence:</span>
                          <Badge variant="outline">{signal.confidence}%</Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}