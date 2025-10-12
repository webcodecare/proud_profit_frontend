import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Activity,
  Database,
  Loader2,
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
  user_id: string;
  ticker_symbol: string;
  timeframe: string;
  delivery_methods: string[];
  max_alerts_per_day: number;
  is_active: boolean;
  created_at: string;
  users?: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface Ticker {
  id: string;
  symbol: string;
  description: string;
}

// Demo data for testing
const DEMO_USERS: User[] = [
  {
    id: "user-1",
    email: "alice@example.com",
    first_name: "Alice",
    last_name: "Johnson",
  },
  {
    id: "user-2",
    email: "bob@example.com",
    first_name: "Bob",
    last_name: "Smith",
  },
  {
    id: "user-3",
    email: "charlie@example.com",
    first_name: "Charlie",
    last_name: "Brown",
  },
  {
    id: "user-4",
    email: "diana@example.com",
    first_name: "Diana",
    last_name: "Prince",
  },
  {
    id: "user-5",
    email: "evan@example.com",
    first_name: "Evan",
    last_name: "Davis",
  },
];

const DEMO_TICKERS: Ticker[] = [
  { id: "ticker-1", symbol: "BTCUSDT", description: "Bitcoin" },
  { id: "ticker-2", symbol: "ETHUSDT", description: "Ethereum" },
  { id: "ticker-3", symbol: "SOLUSDT", description: "Solana" },
  { id: "ticker-4", symbol: "ADAUSDT", description: "Cardano" },
  { id: "ticker-5", symbol: "DOGEUSDT", description: "Dogecoin" },
];

const INITIAL_DEMO_SUBSCRIPTIONS: SignalSubscription[] = [
  {
    id: "sub-1",
    user_id: "user-1",
    ticker_symbol: "BTCUSDT",
    timeframe: "4H",
    delivery_methods: ["email", "sms"],
    max_alerts_per_day: 10,
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    users: DEMO_USERS[0],
  },
  {
    id: "sub-2",
    user_id: "user-2",
    ticker_symbol: "ETHUSDT",
    timeframe: "1H",
    delivery_methods: ["email"],
    max_alerts_per_day: 15,
    is_active: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    users: DEMO_USERS[1],
  },
  {
    id: "sub-3",
    user_id: "user-3",
    ticker_symbol: "SOLUSDT",
    timeframe: "1D",
    delivery_methods: ["telegram", "email"],
    max_alerts_per_day: 5,
    is_active: false,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    users: DEMO_USERS[2],
  },
];

// Demo mode storage
const STORAGE_KEY = "demo-signal-subscriptions";

const getDemoSubscriptions = (): SignalSubscription[] => {
  if (typeof window === "undefined") return INITIAL_DEMO_SUBSCRIPTIONS;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.map((sub: any) => ({
        ...sub,
        users: DEMO_USERS.find((u) => u.id === sub.user_id),
      }));
    } catch {
      return INITIAL_DEMO_SUBSCRIPTIONS;
    }
  }
  return INITIAL_DEMO_SUBSCRIPTIONS;
};

const saveDemoSubscriptions = (subscriptions: SignalSubscription[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
};

interface SignalSubscriptionsPageProps {
  demoMode?: boolean;
}

export default function SignalSubscriptionsPage({
  demoMode: propDemoMode,
}: SignalSubscriptionsPageProps = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isClient, setIsClient] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  // State for dialogs and forms
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<SignalSubscription | null>(null);

  // Form state for new subscription
  const [newSubscription, setNewSubscription] = useState({
    userId: "",
    tickerSymbol: "",
    timeframe: "",
    deliveryMethods: [] as string[],
    maxAlertsPerDay: 10,
    isActive: true,
  });

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
    setDemoMode(propDemoMode || !supabase);
  }, [propDemoMode]);

  // Fetch subscriptions - with demo mode support
  const { data: subscriptions = [], isLoading: subscriptionsLoading } =
    useQuery({
      queryKey: ["signal-subscriptions", demoMode],
      queryFn: async () => {
        if (demoMode) {
          return getDemoSubscriptions();
        }

        if (!supabase) {
          return [];
        }

        const { data, error } = await supabase
          .from("user_ticker_subscriptions")
          .select(
            `
          *,
          users:user_id (
            id,
            email,
            first_name,
            last_name
          )
        `
          )
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching subscriptions:", error);
          throw error;
        }

        return data || [];
      },
      enabled: isClient,
    });

  // Fetch users - with demo mode support
  const { data: users = [] } = useQuery({
    queryKey: ["users-list", demoMode],
    queryFn: async () => {
      if (demoMode) {
        return DEMO_USERS;
      }

      if (!supabase) {
        return [];
      }

      const { data, error } = await supabase
        .from("users")
        .select("id, email, first_name, last_name")
        .order("email", { ascending: true });

      if (error) {
        console.error("Error fetching users:", error);
        throw error;
      }

      return data || [];
    },
    enabled: isClient,
  });

  // Fetch tickers - with demo mode support
  const { data: tickers = [] } = useQuery({
    queryKey: ["tickers-list", demoMode],
    queryFn: async () => {
      if (demoMode) {
        return DEMO_TICKERS;
      }

      if (!supabase) {
        return [];
      }

      const { data, error } = await supabase
        .from("available_tickers")
        .select("id, symbol, description")
        .eq("is_enabled", true)
        .order("symbol", { ascending: true });

      if (error) {
        console.error("Error fetching tickers:", error);
        throw error;
      }

      return data || [];
    },
    enabled: isClient,
  });

  // Create subscription mutation - with demo mode support
  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: any) => {
      if (demoMode) {
        // Demo mode - save to localStorage
        const currentSubs = getDemoSubscriptions();
        const newSub: SignalSubscription = {
          id: `sub-${Date.now()}`,
          user_id: data.userId,
          ticker_symbol: data.tickerSymbol,
          timeframe: data.timeframe,
          delivery_methods: data.deliveryMethods,
          max_alerts_per_day: data.maxAlertsPerDay,
          is_active: data.isActive,
          created_at: new Date().toISOString(),
          users: DEMO_USERS.find((u) => u.id === data.userId),
        };
        const updatedSubs = [newSub, ...currentSubs];
        saveDemoSubscriptions(updatedSubs);
        return newSub;
      }

      if (!supabase) {
        throw new Error("Supabase not configured");
      }

      const { data: result, error } = await supabase
        .from("user_ticker_subscriptions")
        .insert([
          {
            user_id: data.userId,
            ticker_symbol: data.tickerSymbol,
            timeframe: data.timeframe,
            delivery_methods: data.deliveryMethods,
            max_alerts_per_day: data.maxAlertsPerDay,
            is_active: data.isActive,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signal-subscriptions"] });
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "Success",
        description: "Signal subscription created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    },
  });

  // Update subscription mutation - with demo mode support
  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      if (demoMode) {
        // Demo mode - update in localStorage
        const currentSubs = getDemoSubscriptions();
        const updatedSubs = currentSubs.map((sub) => {
          if (sub.id === id) {
            return {
              ...sub,
              delivery_methods: data.deliveryMethods,
              max_alerts_per_day: data.maxAlertsPerDay,
              is_active: data.isActive,
            };
          }
          return sub;
        });
        saveDemoSubscriptions(updatedSubs);
        return updatedSubs.find((s) => s.id === id);
      }

      if (!supabase) {
        throw new Error("Supabase not configured");
      }

      const { data: result, error } = await supabase
        .from("user_ticker_subscriptions")
        .update({
          delivery_methods: data.deliveryMethods,
          max_alerts_per_day: data.maxAlertsPerDay,
          is_active: data.isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signal-subscriptions"] });
      setShowEditDialog(false);
      setSelectedSubscription(null);
      toast({
        title: "Success",
        description: "Subscription updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription",
        variant: "destructive",
      });
    },
  });

  // Delete subscription mutation - with demo mode support
  const deleteSubscriptionMutation = useMutation({
    mutationFn: async (id: string) => {
      if (demoMode) {
        // Demo mode - delete from localStorage
        const currentSubs = getDemoSubscriptions();
        const updatedSubs = currentSubs.filter((sub) => sub.id !== id);
        saveDemoSubscriptions(updatedSubs);
        return;
      }

      if (!supabase) {
        throw new Error("Supabase not configured");
      }

      const { error } = await supabase
        .from("user_ticker_subscriptions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signal-subscriptions"] });
      toast({
        title: "Success",
        description: "Subscription deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete subscription",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setNewSubscription({
      userId: "",
      tickerSymbol: "",
      timeframe: "",
      deliveryMethods: [],
      maxAlertsPerDay: 10,
      isActive: true,
    });
  };

  const handleCreateSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newSubscription.userId ||
      !newSubscription.tickerSymbol ||
      !newSubscription.timeframe
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
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
        deliveryMethods: selectedSubscription.delivery_methods,
        maxAlertsPerDay: selectedSubscription.max_alerts_per_day,
        isActive: selectedSubscription.is_active,
      },
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
        {methods.includes("email") && (
          <Mail className="w-4 h-4 text-blue-500" />
        )}
        {methods.includes("sms") && (
          <Smartphone className="w-4 h-4 text-green-500" />
        )}
        {methods.includes("telegram") && (
          <MessageSquare className="w-4 h-4 text-blue-400" />
        )}
      </div>
    );
  };

  // Helper function to get user display name
  const getUserName = (subscription: SignalSubscription) => {
    if (subscription.users) {
      const { first_name, last_name } = subscription.users;
      if (first_name && last_name) return `${first_name} ${last_name}`;
      if (first_name) return first_name;
      if (last_name) return last_name;
    }
    return subscription.users?.email || "Unknown User";
  };

  // Show loading state during SSR
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <Sidebar className="flex-none w-64 hidden lg:block" />
          <div className="flex-1 min-h-screen lg:ml-64">
            <div className="container mx-auto p-4 sm:p-6">
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar className="flex-none w-64 hidden lg:block" />
        <div className="flex-1 min-h-screen lg:ml-64">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl">
            {/* Demo Mode Banner */}
            {demoMode && (
              <Card className="border-blue-500 bg-gray-500">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Database className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-900">
                        Demo Mode Active
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        You're viewing demo data stored in browser memory. All
                        CRUD operations work perfectly! Data will persist until
                        you clear browser storage.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  Signal Subscriptions
                </h1>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Manage user signal subscriptions and notification preferences
                </p>
              </div>
              <Dialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
              >
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto h-12 px-6 font-medium">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subscription
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">
                      Create New Subscription
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-600">
                      Add a signal subscription for a specific user
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    onSubmit={handleCreateSubscription}
                    className="space-y-6"
                  >
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Label
                          htmlFor="user-select"
                          className="text-sm font-medium"
                        >
                          User *
                        </Label>
                        <Select
                          value={newSubscription.userId}
                          onValueChange={(value) =>
                            setNewSubscription((prev) => ({
                              ...prev,
                              userId: value,
                            }))
                          }
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select a user" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(users) &&
                              users.map((user: User) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.first_name && user.last_name
                                    ? `${user.first_name} ${user.last_name}`
                                    : user.email}{" "}
                                  ({user.email})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="ticker-select"
                            className="text-sm font-medium"
                          >
                            Ticker *
                          </Label>
                          <Select
                            value={newSubscription.tickerSymbol}
                            onValueChange={(value) =>
                              setNewSubscription((prev) => ({
                                ...prev,
                                tickerSymbol: value,
                              }))
                            }
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select ticker" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.isArray(tickers) &&
                                tickers.map((ticker: Ticker) => (
                                  <SelectItem
                                    key={ticker.id}
                                    value={ticker.symbol}
                                  >
                                    {ticker.symbol} - {ticker.description}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="timeframe-select"
                            className="text-sm font-medium"
                          >
                            Timeframe *
                          </Label>
                          <Select
                            value={newSubscription.timeframe}
                            onValueChange={(value) =>
                              setNewSubscription((prev) => ({
                                ...prev,
                                timeframe: value,
                              }))
                            }
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select timeframe" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30M">30 Minutes</SelectItem>
                              <SelectItem value="1H">1 Hour</SelectItem>
                              <SelectItem value="4H">4 Hours</SelectItem>
                              <SelectItem value="8H">8 Hours</SelectItem>
                              <SelectItem value="12H">12 Hours</SelectItem>
                              <SelectItem value="1D">1 Day</SelectItem>
                              <SelectItem value="1W">1 Week</SelectItem>
                              <SelectItem value="1M">1 Month</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium">
                          Delivery Methods
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {["email", "sms", "telegram"].map((method) => (
                            <div
                              key={method}
                              className="flex items-center space-x-2 p-3 border rounded-md"
                            >
                              <Checkbox
                                id={method}
                                checked={newSubscription.deliveryMethods.includes(
                                  method
                                )}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewSubscription((prev) => ({
                                      ...prev,
                                      deliveryMethods: [
                                        ...prev.deliveryMethods,
                                        method,
                                      ],
                                    }));
                                  } else {
                                    setNewSubscription((prev) => ({
                                      ...prev,
                                      deliveryMethods:
                                        prev.deliveryMethods.filter(
                                          (m) => m !== method
                                        ),
                                    }));
                                  }
                                }}
                              />
                              <Label
                                htmlFor={method}
                                className="text-sm capitalize font-medium cursor-pointer flex-1"
                              >
                                {method}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="max-alerts"
                          className="text-sm font-medium"
                        >
                          Max Alerts Per Day
                        </Label>
                        <Input
                          id="max-alerts"
                          type="number"
                          min="1"
                          max="100"
                          value={newSubscription.maxAlertsPerDay}
                          onChange={(e) =>
                            setNewSubscription((prev) => ({
                              ...prev,
                              maxAlertsPerDay: parseInt(e.target.value) || 10,
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
                            setNewSubscription((prev) => ({
                              ...prev,
                              isActive: !!checked,
                            }))
                          }
                        />
                        <Label
                          htmlFor="is-active"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Active subscription
                        </Label>
                      </div>
                    </div>

                    <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateDialog(false)}
                        className="w-full sm:w-auto h-12"
                        disabled={createSubscriptionMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createSubscriptionMutation.isPending}
                        className="w-full sm:w-auto h-12"
                      >
                        {createSubscriptionMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Subscription"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Edit Subscription Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">
                    Edit Subscription
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-600">
                    Update subscription settings for{" "}
                    {selectedSubscription
                      ? getUserName(selectedSubscription)
                      : ""}
                  </DialogDescription>
                </DialogHeader>
                {selectedSubscription && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Delivery Methods
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {["email", "sms", "telegram"].map((method) => (
                          <div
                            key={method}
                            className="flex items-center space-x-2 p-3 border rounded-md"
                          >
                            <Checkbox
                              id={`edit-${method}`}
                              checked={selectedSubscription.delivery_methods.includes(
                                method
                              )}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSubscription((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          delivery_methods: [
                                            ...prev.delivery_methods,
                                            method,
                                          ],
                                        }
                                      : null
                                  );
                                } else {
                                  setSelectedSubscription((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          delivery_methods:
                                            prev.delivery_methods.filter(
                                              (m) => m !== method
                                            ),
                                        }
                                      : null
                                  );
                                }
                              }}
                            />
                            <Label
                              htmlFor={`edit-${method}`}
                              className="text-sm capitalize font-medium cursor-pointer flex-1"
                            >
                              {method}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="edit-max-alerts"
                        className="text-sm font-medium"
                      >
                        Max Alerts Per Day
                      </Label>
                      <Input
                        id="edit-max-alerts"
                        type="number"
                        min="1"
                        max="100"
                        value={selectedSubscription.max_alerts_per_day}
                        onChange={(e) =>
                          setSelectedSubscription((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  max_alerts_per_day:
                                    parseInt(e.target.value) || 10,
                                }
                              : null
                          )
                        }
                        className="h-11"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-is-active"
                        checked={selectedSubscription.is_active}
                        onCheckedChange={(checked) =>
                          setSelectedSubscription((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  is_active: !!checked,
                                }
                              : null
                          )
                        }
                      />
                      <Label
                        htmlFor="edit-is-active"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Active subscription
                      </Label>
                    </div>

                    <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowEditDialog(false)}
                        className="w-full sm:w-auto h-12"
                        disabled={updateSubscriptionMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpdateSubscription}
                        disabled={updateSubscriptionMutation.isPending}
                        className="w-full sm:w-auto h-12"
                      >
                        {updateSubscriptionMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update Subscription"
                        )}
                      </Button>
                    </DialogFooter>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Subscriptions
                  </CardTitle>
                  <Users className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {subscriptions.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Active
                  </CardTitle>
                  <Activity className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {subscriptions.filter((s) => s.is_active).length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Inactive
                  </CardTitle>
                  <Clock className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-600">
                    {subscriptions.filter((s) => !s.is_active).length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subscriptions Table */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-t-lg">
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  All Subscriptions
                </CardTitle>
                <CardDescription className="text-blue-100">
                  View and manage signal subscriptions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {subscriptionsLoading ? (
                  <div className="flex items-center justify-center py-12 bg-gradient-to-br from-gray-50 to-gray-100">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-3" />
                    <span className="text-gray-600 font-medium">
                      Loading subscriptions...
                    </span>
                  </div>
                ) : subscriptions.length === 0 ? (
                  <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No subscriptions found
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                      Get started by creating your first signal subscription for
                      your users
                    </p>
                    <Button
                      onClick={() => setShowCreateDialog(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Subscription
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-gray-50 to-blue-50 border-b-2 border-blue-200">
                          <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">
                            User
                          </th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">
                            Ticker
                          </th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">
                            Timeframe
                          </th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">
                            Delivery
                          </th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">
                            Max/Day
                          </th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">
                            Status
                          </th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {subscriptions.map((subscription, index) => (
                          <tr
                            key={subscription.id}
                            className={`
                  transition-all duration-200 hover:shadow-md
                  ${
                    index % 2 === 0
                      ? "bg-white hover:bg-blue-50"
                      : "bg-gray-50 hover:bg-blue-50"
                  }
                  border-l-4 ${
                    subscription.is_active
                      ? "border-l-green-500"
                      : "border-l-red-500"
                  }
                `}
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">
                                    {getUserName(subscription)
                                      .charAt(0)
                                      .toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 text-sm">
                                    {getUserName(subscription)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {subscription.users?.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 font-semibold text-xs px-3 py-1">
                                {subscription.ticker_symbol}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <Badge
                                variant="secondary"
                                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 font-semibold text-xs px-3 py-1"
                              >
                                {subscription.timeframe}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex gap-2">
                                {subscription.delivery_methods.includes(
                                  "email"
                                ) && (
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group relative">
                                    <Mail className="w-4 h-4 text-blue-600" />
                                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                      Email
                                    </span>
                                  </div>
                                )}
                                {subscription.delivery_methods.includes(
                                  "sms"
                                ) && (
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center group relative">
                                    <Smartphone className="w-4 h-4 text-green-600" />
                                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                      SMS
                                    </span>
                                  </div>
                                )}
                                {subscription.delivery_methods.includes(
                                  "telegram"
                                ) && (
                                  <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center group relative">
                                    <MessageSquare className="w-4 h-4 text-blue-400" />
                                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                      Telegram
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">
                                    {subscription.max_alerts_per_day}
                                  </span>
                                </div>
                                <span className="text-sm font-semibold text-gray-700">
                                  {subscription.max_alerts_per_day}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div
                                className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${
                                  subscription.is_active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {getStatusIcon(subscription.is_active)}
                                <span className="text-sm font-semibold">
                                  {subscription.is_active
                                    ? "Active"
                                    : "Inactive"}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleEditSubscription(subscription)
                                  }
                                  className="h-9 w-9 p-0 bg-gradient-to-r from-blue-100 to-blue-50 hover:from-blue-200 hover:to-blue-100 border border-blue-200 rounded-lg transition-all"
                                >
                                  <Edit className="w-4 h-4 text-blue-600" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-9 w-9 p-0 bg-gradient-to-r from-red-100 to-red-50 hover:from-red-200 hover:to-red-100 border border-red-200 rounded-lg transition-all"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="w-[95vw] max-w-[400px] border-0 shadow-xl">
                                    <AlertDialogHeader>
                                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Trash2 className="w-6 h-6 text-red-600" />
                                      </div>
                                      <AlertDialogTitle className="text-center text-lg">
                                        Delete Subscription
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="text-center">
                                        Are you sure you want to delete the
                                        subscription for{" "}
                                        <span className="font-semibold text-gray-900">
                                          {getUserName(subscription)}
                                        </span>
                                        ? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
                                      <AlertDialogCancel className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-900 border-0">
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          deleteSubscriptionMutation.mutate(
                                            subscription.id
                                          )
                                        }
                                        className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 border-0"
                                      >
                                        {deleteSubscriptionMutation.isPending ? (
                                          <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Deleting...
                                          </>
                                        ) : (
                                          "Delete Subscription"
                                        )}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
