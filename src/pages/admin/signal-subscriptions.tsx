import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Mail, 
  Smartphone, 
  MessageSquare,
  Clock,
  Users,
  Activity
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SignalSubscription {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  tickerSymbol: string;
  timeframe: string;
  deliveryMethods: string[];
  maxAlertsPerDay: number;
  isActive: boolean;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Ticker {
  id: string;
  symbol: string;
  name: string;
}

export default function SignalSubscriptionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for dialogs and forms
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<SignalSubscription | null>(null);
  
  // Form state for new subscription
  const [newSubscription, setNewSubscription] = useState({
    userId: "",
    tickerSymbol: "",
    timeframe: "",
    deliveryMethods: [] as string[],
    maxAlertsPerDay: 10,
    isActive: true
  });

  // Queries
  const { data: subscriptionsData, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['/api/admin/signal-subscriptions'],
    queryFn: () => apiRequest('/api/admin/signal-subscriptions'),
    enabled: true
  });

  const { data: usersData } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: () => apiRequest('/api/admin/users'),
    enabled: true
  });

  const { data: tickersData } = useQuery({
    queryKey: ['/api/admin/tickers'],
    queryFn: () => apiRequest('/api/admin/tickers'),
    enabled: true
  });

  // Safely extract arrays from API responses
  const subscriptions = Array.isArray(subscriptionsData) ? subscriptionsData : subscriptionsData?.subscriptions || [];
  const users = Array.isArray(usersData) ? usersData : usersData?.users || [];
  const tickers = Array.isArray(tickersData) ? tickersData : tickersData?.tickers || [];

  // Mutations
  const createSubscriptionMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/signal-subscriptions', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/signal-subscriptions'] });
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "Success",
        description: "Signal subscription created successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive"
      });
    }
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest(`/api/admin/signal-subscriptions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/signal-subscriptions'] });
      setShowEditDialog(false);
      setSelectedSubscription(null);
      toast({
        title: "Success",
        description: "Subscription updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription",
        variant: "destructive"
      });
    }
  });

  const deleteSubscriptionMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/signal-subscriptions/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/signal-subscriptions'] });
      toast({
        title: "Success",
        description: "Subscription deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete subscription",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setNewSubscription({
      userId: "",
      tickerSymbol: "",
      timeframe: "",
      deliveryMethods: [],
      maxAlertsPerDay: 10,
      isActive: true
    });
  };

  const handleCreateSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubscription.userId || !newSubscription.tickerSymbol || !newSubscription.timeframe) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    createSubscriptionMutation.mutate(newSubscription);
  };

  const handleEditSubscription = (subscription: SignalSubscription) => {
    setSelectedSubscription(subscription);
    setShowEditDialog(true);
  };

  const handleUpdateSubscription = () => {
    if (!selectedSubscription) return;

    updateSubscriptionMutation.mutate({
      id: selectedSubscription.id,
      data: {
        deliveryMethods: selectedSubscription.deliveryMethods,
        maxAlertsPerDay: selectedSubscription.maxAlertsPerDay,
        isActive: selectedSubscription.isActive
      }
    });
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getDeliveryMethodIcons = (methods: string[]) => {
    return (
      <div className="flex gap-1">
        {methods.includes('email') && <Mail className="w-4 h-4 text-blue-500" />}
        {methods.includes('sms') && <Smartphone className="w-4 h-4 text-green-500" />}
        {methods.includes('telegram') && <MessageSquare className="w-4 h-4 text-blue-400" />}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar className="flex-none w-64 hidden lg:block" />
        <div className="flex-1 min-h-screen lg:ml-64">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl">
              {/* Header */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2">Signal Subscriptions</h1>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Manage user signal subscriptions and notification preferences
                  </p>
                </div>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto min-h-[48px] px-6 font-medium">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Subscription
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-[500px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-lg sm:text-xl">Create New Subscription</DialogTitle>
                      <DialogDescription className="text-sm text-muted-foreground">
                        Add a signal subscription for a specific user
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubscription} className="space-y-6">
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="user-select" className="text-sm font-medium">User *</Label>
                          <Select
                            value={newSubscription.userId}
                            onValueChange={(value) => 
                              setNewSubscription(prev => ({ ...prev, userId: value }))
                            }
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select a user" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.isArray(users) && users.map(user => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name} ({user.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="ticker-select" className="text-sm font-medium">Ticker *</Label>
                            <Select
                              value={newSubscription.tickerSymbol}
                              onValueChange={(value) => 
                                setNewSubscription(prev => ({ ...prev, tickerSymbol: value }))
                              }
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select ticker" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.isArray(tickers) && tickers.map(ticker => (
                                  <SelectItem key={ticker.id} value={ticker.symbol}>
                                    {ticker.symbol} - {ticker.description || ticker.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="timeframe-select" className="text-sm font-medium">Timeframe *</Label>
                            <Select
                              value={newSubscription.timeframe}
                              onValueChange={(value) => 
                                setNewSubscription(prev => ({ ...prev, timeframe: value }))
                              }
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select timeframe" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1m">1 Minute</SelectItem>
                                <SelectItem value="5m">5 Minutes</SelectItem>
                                <SelectItem value="15m">15 Minutes</SelectItem>
                                <SelectItem value="1h">1 Hour</SelectItem>
                                <SelectItem value="4h">4 Hours</SelectItem>
                                <SelectItem value="1d">1 Day</SelectItem>
                                <SelectItem value="1w">1 Week</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Delivery Methods</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {['email', 'sms', 'telegram'].map(method => (
                              <div key={method} className="flex items-center space-x-2 p-3 border rounded-md">
                                <Checkbox
                                  id={method}
                                  checked={newSubscription.deliveryMethods.includes(method)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setNewSubscription(prev => ({
                                        ...prev,
                                        deliveryMethods: [...prev.deliveryMethods, method]
                                      }));
                                    } else {
                                      setNewSubscription(prev => ({
                                        ...prev,
                                        deliveryMethods: prev.deliveryMethods.filter(m => m !== method)
                                      }));
                                    }
                                  }}
                                />
                                <Label htmlFor={method} className="text-sm capitalize font-medium cursor-pointer">
                                  {method}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="max-alerts" className="text-sm font-medium">Max Alerts Per Day</Label>
                          <Input
                            id="max-alerts"
                            type="number"
                            min="1"
                            max="100"
                            value={newSubscription.maxAlertsPerDay}
                            onChange={(e) => 
                              setNewSubscription(prev => ({ 
                                ...prev, 
                                maxAlertsPerDay: parseInt(e.target.value) || 10 
                              }))
                            }
                            className="h-11"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="is-active"
                            checked={newSubscription.isActive}
                            onCheckedChange={(checked) => 
                              setNewSubscription(prev => ({ ...prev, isActive: !!checked }))
                            }
                          />
                          <Label htmlFor="is-active" className="text-sm font-medium cursor-pointer">
                            Active subscription
                          </Label>
                        </div>
                      </div>

                      <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row">
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => setShowCreateDialog(false)}
                          className="w-full sm:w-auto min-h-[48px]"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createSubscriptionMutation.isPending}
                          className="w-full sm:w-auto min-h-[48px]"
                        >
                          {createSubscriptionMutation.isPending ? 'Creating...' : 'Create Subscription'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Edit Subscription Dialog */}
              <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="w-[95vw] max-w-[500px] max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">Edit Subscription</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                      Update subscription settings for {selectedSubscription?.userName}
                    </DialogDescription>
                  </DialogHeader>
                  {selectedSubscription && (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Delivery Methods</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {['email', 'sms', 'telegram'].map(method => (
                            <div key={method} className="flex items-center space-x-2 p-3 border rounded-md">
                              <Checkbox
                                id={`edit-${method}`}
                                checked={selectedSubscription.deliveryMethods.includes(method)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedSubscription(prev => prev ? ({
                                      ...prev,
                                      deliveryMethods: [...prev.deliveryMethods, method]
                                    }) : null);
                                  } else {
                                    setSelectedSubscription(prev => prev ? ({
                                      ...prev,
                                      deliveryMethods: prev.deliveryMethods.filter(m => m !== method)
                                    }) : null);
                                  }
                                }}
                              />
                              <Label htmlFor={`edit-${method}`} className="text-sm capitalize font-medium cursor-pointer">
                                {method}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-max-alerts" className="text-sm font-medium">Max Alerts Per Day</Label>
                        <Input
                          id="edit-max-alerts"
                          type="number"
                          min="1"
                          max="100"
                          value={selectedSubscription.maxAlertsPerDay}
                          onChange={(e) => 
                            setSelectedSubscription(prev => prev ? ({ 
                              ...prev, 
                              maxAlertsPerDay: parseInt(e.target.value) || 10 
                            }) : null)
                          }
                          className="h-11"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-is-active"
                          checked={selectedSubscription.isActive}
                          onCheckedChange={(checked) => 
                            setSelectedSubscription(prev => prev ? ({ ...prev, isActive: !!checked }) : null)
                          }
                        />
                        <Label htmlFor="edit-is-active" className="text-sm font-medium cursor-pointer">
                          Active subscription
                        </Label>
                      </div>

                      <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row">
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => setShowEditDialog(false)}
                          className="w-full sm:w-auto min-h-[48px]"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleUpdateSubscription}
                          disabled={updateSubscriptionMutation.isPending}
                          className="w-full sm:w-auto min-h-[48px]"
                        >
                          {updateSubscriptionMutation.isPending ? 'Updating...' : 'Update Subscription'}
                        </Button>
                      </DialogFooter>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-blue-500 rounded-lg flex-shrink-0">
                        <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {Array.isArray(subscriptions) ? subscriptions.length : 0}
                        </div>
                        <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-300 truncate">
                          Total Subscriptions
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-green-500 rounded-lg flex-shrink-0">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-900 dark:text-green-100">
                          {Array.isArray(subscriptions) ? subscriptions.filter(s => s.isActive).length : 0}
                        </div>
                        <div className="text-xs sm:text-sm text-green-600 dark:text-green-300 truncate">
                          Active
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-orange-500 rounded-lg flex-shrink-0">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-900 dark:text-orange-100">
                          {Array.from(new Set(Array.isArray(subscriptions) ? subscriptions.map(s => s.userId) : [])).length}
                        </div>
                        <div className="text-xs sm:text-sm text-orange-600 dark:text-orange-300 truncate">
                          Unique Users
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Subscriptions List */}
              <Card>
                <CardHeader>
                  <CardTitle>User Signal Subscriptions</CardTitle>
                  <CardDescription>
                    Manage all user signal subscriptions and notification preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {subscriptionsLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : subscriptions.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No subscriptions found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Array.isArray(subscriptions) && subscriptions.map(subscription => (
                        <Card 
                          key={subscription.id} 
                          className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500"
                        >
                          <CardContent className="p-4">
                            <div className="space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-6">
                              {/* User Info Section */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-3 mb-3">
                                  <div className="flex-shrink-0 mt-1">
                                    {getStatusIcon(subscription.isActive)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-lg mb-1 truncate">
                                      {subscription.userName}
                                    </div>
                                    <div className="text-sm text-muted-foreground break-all">
                                      {subscription.userEmail}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Responsive details layout */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                  <Badge variant="secondary" className="w-fit text-sm">
                                    {subscription.tickerSymbol} - {subscription.timeframe}
                                  </Badge>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" />
                                      {subscription.maxAlertsPerDay} alerts/day
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Delivery methods */}
                                <div className="flex items-center gap-2 mt-3">
                                  <span className="text-sm text-muted-foreground font-medium">Delivery:</span>
                                  <div className="flex gap-2">
                                    {subscription.deliveryMethods.map(method => (
                                      <Badge key={method} variant="outline" className="text-xs px-2 py-1">
                                        <div className="flex items-center gap-1">
                                          {method === 'email' && <Mail className="w-3 h-3" />}
                                          {method === 'sms' && <Smartphone className="w-3 h-3" />}
                                          {method === 'telegram' && <MessageSquare className="w-3 h-3" />}
                                          <span className="capitalize">{method}</span>
                                        </div>
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-3 justify-end lg:justify-start">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditSubscription(subscription)}
                                  className="min-h-[40px] px-4"
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="min-h-[40px] px-4"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="w-[95vw] max-w-[400px]">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Subscription</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this subscription for {subscription.userName}? 
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex flex-col-reverse gap-2 sm:flex-row">
                                      <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteSubscriptionMutation.mutate(subscription.id)}
                                        className="bg-red-600 hover:bg-red-700 min-h-[44px]"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
          </div>
        </div>
      </div>
    </div>
  );
}