import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch as UISwitch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Bell, 
  Plus, 
  Mail,
  MessageSquare,
  Smartphone,
  Settings,
  CheckCircle,
  XCircle,
  Target
} from "lucide-react";

interface AvailableCombination {
  id: string;
  tickerSymbol: string;
  timeframe: string;
  description: string;
  isEnabled: boolean;
}

interface UserSubscription {
  id: string;
  tickerSymbol: string;
  timeframe: string;
  deliveryMethods: string[];
  isActive: boolean;
  createdAt: string;
}

export default function UserSubscriptions() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);
  const [selectedCombination, setSelectedCombination] = useState<AvailableCombination | null>(null);
  const [deliveryMethods, setDeliveryMethods] = useState<string[]>(["email"]);

  // Fetch available combinations
  const { data: availableCombinations, isLoading: isLoadingCombinations } = useQuery({
    queryKey: ["/api/user/available-combinations"],
  });

  // Fetch user's current subscriptions
  const { data: userSubscriptions, isLoading: isLoadingSubscriptions } = useQuery({
    queryKey: ["/api/user/subscriptions"],
  });

  // Subscribe to combination
  const subscribeMutation = useMutation({
    mutationFn: async (subscriptionData: { tickerSymbol: string; timeframe: string; deliveryMethods: string[] }) => {
      return await apiRequest("/api/user/subscriptions", {
        method: "POST",
        body: JSON.stringify(subscriptionData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/subscriptions"] });
      setIsSubscribeOpen(false);
      setSelectedCombination(null);
      setDeliveryMethods(["email"]);
      toast({ title: "Successfully subscribed to signals" });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to subscribe", variant: "destructive" });
    },
  });

  // Update subscription
  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<UserSubscription> }) => {
      return await apiRequest(`/api/user/subscriptions/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/subscriptions"] });
      toast({ title: "Subscription updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to update subscription", variant: "destructive" });
    },
  });

  // Unsubscribe
  const unsubscribeMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/user/subscriptions/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/subscriptions"] });
      toast({ title: "Successfully unsubscribed" });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to unsubscribe", variant: "destructive" });
    },
  });

  const handleSubscribe = (combination: AvailableCombination) => {
    setSelectedCombination(combination);
    setIsSubscribeOpen(true);
  };

  const handleUnsubscribe = (subscriptionId: string) => {
    if (confirm("Are you sure you want to unsubscribe from these signals?")) {
      unsubscribeMutation.mutate(subscriptionId);
    }
  };

  const isAlreadySubscribed = (tickerSymbol: string, timeframe: string) => {
    return userSubscriptions?.some((sub: UserSubscription) => 
      sub.tickerSymbol === tickerSymbol && sub.timeframe === timeframe && sub.isActive
    );
  };

  const getDeliveryMethodIcon = (method: string) => {
    switch (method) {
      case "email": return <Mail className="h-4 w-4" />;
      case "sms": return <Smartphone className="h-4 w-4" />;
      case "telegram": return <MessageSquare className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const subscriptionStats = {
    total: userSubscriptions?.length || 0,
    active: userSubscriptions?.filter((sub: UserSubscription) => sub.isActive).length || 0,
    available: availableCombinations?.length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        
        {/* Main Content */}
        <div className="lg:ml-64 flex-1">
          {/* Mobile Header */}
          <div className="lg:hidden bg-card border-b border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Target className="h-5 w-5" />
                <h1 className="text-lg font-bold">Signal Subscriptions</h1>
              </div>
            </div>
          </div>

          {/* Desktop Header */}
          <header className="hidden lg:block bg-card border-b border-border p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Target className="h-6 w-6" />
                <div>
                  <h1 className="text-2xl font-bold">Signal Subscriptions</h1>
                  <p className="text-sm text-muted-foreground">Subscribe to specific ticker + timeframe combinations</p>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="p-4 lg:p-6 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Available Combinations</div>
                <div className="text-2xl font-bold text-blue-500">{subscriptionStats.available}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Your Subscriptions</div>
                <div className="text-2xl font-bold text-emerald-500">{subscriptionStats.total}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Active Subscriptions</div>
                <div className="text-2xl font-bold text-orange-500">{subscriptionStats.active}</div>
              </Card>
            </div>

            {/* Available Combinations */}
            <Card>
              <CardHeader>
                <CardTitle>Available Signal Combinations</CardTitle>
                <p className="text-sm text-muted-foreground">
                  These are the ticker + timeframe combinations approved by administrators
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {isLoadingCombinations ? (
                    <div className="col-span-full text-center py-8">Loading combinations...</div>
                  ) : availableCombinations?.map((combination: AvailableCombination) => (
                    <Card key={combination.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold font-mono">
                            {combination.tickerSymbol}
                          </div>
                          <Badge variant="outline">{combination.timeframe}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-4">
                          {combination.description}
                        </div>
                        <Button
                          onClick={() => handleSubscribe(combination)}
                          disabled={isAlreadySubscribed(combination.tickerSymbol, combination.timeframe)}
                          className="w-full"
                          variant={isAlreadySubscribed(combination.tickerSymbol, combination.timeframe) ? "secondary" : "default"}
                        >
                          {isAlreadySubscribed(combination.tickerSymbol, combination.timeframe) ? (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Subscribed
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Subscribe
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Current Subscriptions */}
            <Card>
              <CardHeader>
                <CardTitle>Your Current Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticker</TableHead>
                      <TableHead>Timeframe</TableHead>
                      <TableHead>Delivery Methods</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Subscribed</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingSubscriptions ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Loading subscriptions...
                        </TableCell>
                      </TableRow>
                    ) : userSubscriptions?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No subscriptions yet. Subscribe to combinations above to get started.
                        </TableCell>
                      </TableRow>
                    ) : userSubscriptions?.map((subscription: UserSubscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell className="font-semibold font-mono">
                          {subscription.tickerSymbol}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{subscription.timeframe}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {subscription.deliveryMethods.map((method) => (
                              <Badge key={method} variant="secondary" className="flex items-center gap-1">
                                {getDeliveryMethodIcon(method)}
                                {method}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <UISwitch
                              checked={subscription.isActive}
                              onCheckedChange={(checked: boolean) =>
                                updateSubscriptionMutation.mutate({
                                  id: subscription.id,
                                  updates: { isActive: checked },
                                })
                              }
                            />
                            <Badge variant={subscription.isActive ? "default" : "secondary"}>
                              {subscription.isActive ? (
                                <><CheckCircle className="mr-1 h-3 w-3" /> Active</>
                              ) : (
                                <><XCircle className="mr-1 h-3 w-3" /> Paused</>
                              )}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(subscription.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUnsubscribe(subscription.id)}
                            disabled={unsubscribeMutation.isPending}
                          >
                            Unsubscribe
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Subscribe Dialog */}
            <Dialog open={isSubscribeOpen} onOpenChange={setIsSubscribeOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Subscribe to Signals</DialogTitle>
                  <DialogDescription>
                    {selectedCombination && (
                      <>Subscribe to {selectedCombination.tickerSymbol}/{selectedCombination.timeframe} signals</>
                    )}
                  </DialogDescription>
                </DialogHeader>
                {selectedCombination && (
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="font-semibold">
                        {selectedCombination.tickerSymbol} / {selectedCombination.timeframe}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedCombination.description}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Delivery Methods</Label>
                      <div className="space-y-2">
                        {[
                          { value: "email", label: "Email", icon: Mail },
                          { value: "sms", label: "SMS", icon: Smartphone },
                          { value: "telegram", label: "Telegram", icon: MessageSquare },
                        ].map((method) => (
                          <div key={method.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={method.value}
                              checked={deliveryMethods.includes(method.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setDeliveryMethods([...deliveryMethods, method.value]);
                                } else {
                                  setDeliveryMethods(deliveryMethods.filter(m => m !== method.value));
                                }
                              }}
                            />
                            <Label htmlFor={method.value} className="flex items-center space-x-2 cursor-pointer">
                              <method.icon className="h-4 w-4" />
                              <span>{method.label}</span>
                            </Label>
                          </div>
                        ))}
                      </div>
                      {deliveryMethods.length === 0 && (
                        <p className="text-sm text-red-500">Please select at least one delivery method</p>
                      )}
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsSubscribeOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => selectedCombination && subscribeMutation.mutate({
                      tickerSymbol: selectedCombination.tickerSymbol,
                      timeframe: selectedCombination.timeframe,
                      deliveryMethods
                    })}
                    disabled={subscribeMutation.isPending || deliveryMethods.length === 0}
                    className="crypto-gradient text-white"
                  >
                    {subscribeMutation.isPending ? "Subscribing..." : "Subscribe"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}