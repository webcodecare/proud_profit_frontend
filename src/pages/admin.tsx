import React, { useState, Component, ErrorInfo, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { buildApiUrl } from "@/config/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch as UISwitch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Activity,
  DollarSign,
  Server,
  Plus,
  Trash2,
  Send,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AdminErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Admin panel error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="flex">
            <Sidebar />
            <div className="ml-0 md:ml-64 flex-1 flex items-center justify-center p-6">
              <Card className="max-w-md">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                    <h2 className="text-xl font-bold text-destructive">
                      Something Went Wrong
                    </h2>
                  </div>
                  <p className="text-muted-foreground mb-2">
                    The admin panel encountered an unexpected error.
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Error: {this.state.error?.message || "Unknown error"}
                  </p>
                  <div className="space-x-2">
                    <Button onClick={() => window.location.reload()}>
                      Reload Page
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => (window.location.href = "/dashboard")}
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface Ticker {
  id: string;
  symbol: string;
  description: string;
  isEnabled: boolean;
  category?: string;
}

interface SignalForm {
  ticker: string;
  signalType: "buy" | "sell";
  price: number;
  note: string;
}

interface SystemLog {
  id: string;
  action: string;
  userId?: string;
  details: any;
  createdAt: string;
}

function AdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();

  const [signalForm, setSignalForm] = useState<SignalForm>({
    ticker: "",
    signalType: "buy",
    price: 0,
    note: "",
  });

  const [activeTab, setActiveTab] = useState<string>("overview");
  const [newTicker, setNewTicker] = useState({
    symbol: "",
    description: "",
    category: "crypto",
    isEnabled: true,
  });
  const [newPlan, setNewPlan] = useState({
    name: "",
    tier: "",
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxSignals: 10,
    maxTickers: 3,
    isActive: true,
  });

  const [isSignalDialogOpen, setIsSignalDialogOpen] = useState(false);
  const [isTickerDialogOpen, setIsTickerDialogOpen] = useState(false);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const authToken = localStorage.getItem("auth_token");

  // Fetch tickers
  const {
    data: tickersResponse,
    isLoading: isLoadingTickers,
    error: tickersError,
  } = useQuery({
    queryKey: ["/api/admin/tickers"],
    queryFn: async () => {
      if (!authToken) throw new Error("No auth token");
      const response = await fetch(buildApiUrl("/api/admin/tickers"), {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok)
        throw new Error(`Failed to fetch tickers: ${response.status}`);
      const data = await response.json();
      return data;
    },
    retry: false,
  });

  const tickers = Array.isArray(tickersResponse)
    ? tickersResponse
    : tickersResponse?.tickers || [];

  // Fetch signals
  const {
    data: signalsResponse,
    isLoading: isLoadingSignals,
    error: signalsError,
  } = useQuery({
    queryKey: ["/api/signals"],
    queryFn: async () => {
      if (!authToken) throw new Error("No auth token");
      const response = await fetch(buildApiUrl("/api/signals?limit=20"), {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok)
        throw new Error(`Failed to fetch signals: ${response.status}`);
      const data = await response.json();
      return data;
    },
    retry: false,
  });

  const signals = Array.isArray(signalsResponse)
    ? signalsResponse
    : signalsResponse?.signals || [];

  // System logs
  const {
    data: systemLogs,
    isLoading: logsLoading,
    error: logsError,
    refetch: refetchLogs,
  } = useQuery({
    queryKey: ["/api/admin/system/logs"],
    queryFn: async () => {
      if (!authToken) throw new Error("No auth token");
      const response = await fetch(buildApiUrl("/api/admin/system/logs"), {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok)
        throw new Error(`Failed to fetch logs: ${response.status}`);
      return await response.json();
    },
    retry: false,
  });

  // System statistics
  const {
    data: systemStats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["/api/admin/system/stats"],
    queryFn: async () => {
      if (!authToken) throw new Error("No auth token");
      const response = await fetch(buildApiUrl("/api/admin/system/stats"), {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok)
        throw new Error(`Failed to fetch stats: ${response.status}`);
      return await response.json();
    },
    retry: false,
  });

  // Subscription plans
  const {
    data: subscriptionPlansResponse,
    isLoading: plansLoading,
    error: plansError,
    refetch: refetchPlans,
  } = useQuery({
    queryKey: ["/api/admin/subscription-plans"],
    queryFn: async () => {
      if (!authToken) throw new Error("No auth token");
      const response = await fetch(
        buildApiUrl("/api/admin/subscription-plans"),
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      if (!response.ok)
        throw new Error(
          `Failed to fetch subscription plans: ${response.status}`
        );
      const data = await response.json();
      return data;
    },
    retry: false,
  });

  const subscriptionPlans = Array.isArray(subscriptionPlansResponse)
    ? subscriptionPlansResponse
    : subscriptionPlansResponse?.plans || [];

  // Mutations
  const createTickerMutation = useMutation({
    mutationFn: async (ticker: typeof newTicker) => {
      const response = await fetch(buildApiUrl("/api/admin/tickers"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          symbol: ticker.symbol,
          description: ticker.description,
          category: ticker.category,
          is_enabled: ticker.isEnabled,
        }),
      });
      if (!response.ok) throw new Error("Failed to create ticker");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickers"] });
      setNewTicker({
        symbol: "",
        description: "",
        category: "crypto",
        isEnabled: true,
      });
      setIsTickerDialogOpen(false);
      toast({ title: "Ticker created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create ticker", variant: "destructive" });
    },
  });

  const updateTickerMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await fetch(buildApiUrl("/api/admin/tickers"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!response.ok) throw new Error("Failed to update ticker");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickers"] });
      toast({ title: "Ticker updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update ticker", variant: "destructive" });
    },
  });

  const deleteTickerMutation = useMutation({
    mutationFn: async (tickerId: string) => {
      const response = await fetch(buildApiUrl("/api/admin/tickers"), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ id: tickerId }),
      });
      if (!response.ok) throw new Error("Failed to delete ticker");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickers"] });
      toast({ title: "Ticker deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete ticker", variant: "destructive" });
    },
  });

  const createSignalMutation = useMutation({
    mutationFn: async (signal: SignalForm) => {
      const response = await fetch(buildApiUrl("/api/admin/signals"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          ticker: signal.ticker,
          action: signal.signalType,
          price: signal.price,
          timeframe: "1h",
          strategy: "manual",
          message: signal.note,
        }),
      });
      if (!response.ok) throw new Error("Failed to create signal");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/signals"] });
      setSignalForm({ ticker: "", signalType: "buy", price: 0, note: "" });
      setIsSignalDialogOpen(false);
      toast({ title: "Signal created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create signal", variant: "destructive" });
    },
  });

  const deleteSignalMutation = useMutation({
    mutationFn: async (signalId: string) => {
      const response = await fetch(buildApiUrl("/api/admin/signals"), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ id: signalId }),
      });
      if (!response.ok) throw new Error("Failed to delete signal");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/signals"] });
      toast({ title: "Signal deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete signal", variant: "destructive" });
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: async (plan: typeof newPlan) => {
      const response = await fetch(
        buildApiUrl("/api/admin/subscription-plans"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(plan),
        }
      );
      if (!response.ok) throw new Error("Failed to create subscription plan");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/subscription-plans"],
      });
      setNewPlan({
        name: "",
        tier: "",
        monthlyPrice: 0,
        yearlyPrice: 0,
        maxSignals: 10,
        maxTickers: 3,
        isActive: true,
      });
      setIsPlanDialogOpen(false);
      toast({ title: "Subscription plan created successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to create subscription plan",
        variant: "destructive",
      });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({
      planId,
      updates,
    }: {
      planId: string;
      updates: any;
    }) => {
      const response = await fetch(
        buildApiUrl(`/api/admin/subscription-plans/${planId}`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(updates),
        }
      );
      if (!response.ok) throw new Error("Failed to update subscription plan");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/subscription-plans"],
      });
      toast({ title: "Subscription plan updated successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to update subscription plan",
        variant: "destructive",
      });
    },
  });

  // Show fallback UI if not authenticated
  if (!authToken) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Authentication Required</h2>
            <p className="text-muted-foreground">
              Please log in to access the admin panel.
            </p>
            <Button
              className="mt-4"
              onClick={() => (window.location.href = "/login")}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check loading state
  const isLoadingAny =
    isLoadingTickers || isLoadingSignals || statsLoading || plansLoading;
  const hasCriticalErrors = tickersError || signalsError;

  if (isLoadingAny && !hasCriticalErrors) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <Sidebar />
          <div className="ml-0 md:ml-64 flex-1 flex items-center justify-center p-6">
            <Card className="bg-card">
              <CardContent className="p-6 flex flex-col items-center">
                <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                <h2 className="text-xl font-bold mb-2">
                  Loading Admin Dashboard
                </h2>
                <p className="text-muted-foreground">
                  Please wait while we fetch your data...
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (hasCriticalErrors) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <Sidebar />
          <div className="ml-0 md:ml-64 flex-1 p-6">
            <Card className="bg-card">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 text-destructive">
                  Admin Panel Error
                </h2>
                <p className="text-muted-foreground mb-4">
                  Unable to load critical admin data.
                </p>
                <div className="space-y-2">
                  {tickersError && (
                    <p className="text-sm text-destructive">
                      • Tickers API: {tickersError.message}
                    </p>
                  )}
                  {signalsError && (
                    <p className="text-sm text-destructive">
                      • Signals API: {signalsError.message}
                    </p>
                  )}
                </div>
                <div className="mt-4 space-x-2">
                  <Button onClick={() => window.location.reload()}>
                    Reload Page
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />

        {/* Main Content */}
        <div className="ml-0 md:ml-64 flex-1 min-h-screen">
          {/* Top Bar */}
          <header className="bg-card border-b border-border p-4 md:p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl md:text-2xl font-bold">Admin Dashboard</h1>
              <div className="relative">
                <button
                  className="flex items-center space-x-2 focus:outline-none"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center text-destructive-foreground font-semibold text-sm">
                    {user?.firstName?.charAt(0) ||
                      user?.email?.charAt(0) ||
                      "A"}
                  </div>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {user?.firstName?.charAt(0) ||
                            user?.email?.charAt(0) ||
                            "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {user?.firstName || "User"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => logout()}
                      className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-sm text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <LogOut className="h-4 w-4 flex-shrink-0" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Admin Content */}
          <div className="p-4 md:p-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="tickers">Tickers</TabsTrigger>
                <TabsTrigger value="signals">Signals</TabsTrigger>
                <TabsTrigger value="plans">Plans</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 md:space-y-6">
                {/* Stats */}
                {statsError ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center justify-center py-8 space-y-3">
                        <AlertTriangle className="h-12 w-12 text-destructive" />
                        <h3 className="text-lg font-semibold text-destructive">
                          Failed to Load System Statistics
                        </h3>
                        <Button onClick={() => refetchStats()}>
                          <Activity className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : statsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i}>
                        <CardContent className="p-4 md:p-6">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-16" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {[
                      {
                        title: "Total Tickers",
                        value: String(tickers.length),
                        icon: Activity,
                        color: "text-blue-400",
                      },
                      {
                        title: "Active Tickers",
                        value: String(
                          tickers.filter((t: any) => t.isEnabled).length
                        ),
                        icon: Activity,
                        color: "text-emerald-400",
                      },
                      {
                        title: "Recent Signals",
                        value: String(signals.length),
                        icon: DollarSign,
                        color: "text-yellow-400",
                      },
                      {
                        title: "System Status",
                        value: "Online",
                        icon: Server,
                        color: "text-emerald-400",
                      },
                    ].map((stat, index) => {
                      const IconComponent = stat.icon;
                      return (
                        <Card key={index}>
                          <CardContent className="p-4 md:p-6">
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs md:text-sm text-muted-foreground truncate">
                                  {stat.title}
                                </p>
                                <p
                                  className={`text-lg md:text-2xl font-bold ${stat.color} truncate`}
                                >
                                  {stat.value}
                                </p>
                              </div>
                              <IconComponent
                                className={`h-6 w-6 md:h-8 md:w-8 ${stat.color} flex-shrink-0 ml-2`}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {logsLoading ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                        </div>
                      ) : logsError ? (
                        <div className="flex flex-col items-center justify-center py-4 space-y-2">
                          <AlertTriangle className="h-6 w-6 text-destructive" />
                          <p className="text-sm text-destructive">
                            Failed to load logs
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => refetchLogs()}
                          >
                            Retry
                          </Button>
                        </div>
                      ) : systemLogs?.logs && systemLogs.logs.length > 0 ? (
                        systemLogs.logs.slice(0, 5).map((log: SystemLog) => (
                          <div
                            key={log.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-border last:border-b-0 gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {log.action}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(log.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <Badge variant="outline" className="w-fit shrink-0">
                              {log.userId ? "User" : "System"}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          No recent activity
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Button
                          className="w-full justify-start"
                          onClick={() => setActiveTab("signals")}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Signal
                        </Button>
                        <Button
                          className="w-full justify-start"
                          onClick={() => setActiveTab("tickers")}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Ticker
                        </Button>
                        <Button
                          className="w-full justify-start"
                          onClick={() => setActiveTab("plans")}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Manage Plans
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tickers Tab */}
              <TabsContent value="tickers" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Ticker Management</CardTitle>
                      {/* <Dialog
                        open={isTickerDialogOpen}
                        onOpenChange={setIsTickerDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Ticker
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Ticker</DialogTitle>
                            <DialogDescription>
                              Add a new ticker to the system
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div>
                              <Label htmlFor="ticker-symbol">Symbol</Label>
                              <Input
                                id="ticker-symbol"
                                value={newTicker.symbol}
                                onChange={(e) =>
                                  setNewTicker({
                                    ...newTicker,
                                    symbol: e.target.value.toUpperCase(),
                                  })
                                }
                                placeholder="BTCUSDT"
                              />
                            </div>
                            <div>
                              <Label htmlFor="ticker-description">
                                Description
                              </Label>
                              <Input
                                id="ticker-description"
                                value={newTicker.description}
                                onChange={(e) =>
                                  setNewTicker({
                                    ...newTicker,
                                    description: e.target.value,
                                  })
                                }
                                placeholder="Bitcoin"
                              />
                            </div>
                            <div>
                              <Label htmlFor="ticker-category">Category</Label>
                              <Select
                                value={newTicker.category}
                                onValueChange={(value) =>
                                  setNewTicker({
                                    ...newTicker,
                                    category: value,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="crypto">
                                    Cryptocurrency
                                  </SelectItem>
                                  <SelectItem value="stock">Stock</SelectItem>
                                  <SelectItem value="forex">Forex</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() =>
                                createTickerMutation.mutate(newTicker)
                              }
                              disabled={createTickerMutation.isPending}
                            >
                              {createTickerMutation.isPending
                                ? "Creating..."
                                : "Create Ticker"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog> */}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingTickers ? (
                      <div className="text-center py-8">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Symbol</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Category</TableHead>
                            {/* <TableHead>Status</TableHead> */}
                            {/* <TableHead>Actions</TableHead> */}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tickers && tickers.length > 0 ? (
                            tickers.map((ticker: Ticker) => (
                              <TableRow key={ticker.id}>
                                <TableCell className="font-medium">
                                  {ticker.symbol}
                                </TableCell>
                                <TableCell>{ticker.description}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {ticker.category || "crypto"}
                                  </Badge>
                                </TableCell>
                                {/* <TableCell>
                                  <UISwitch
                                    checked={ticker.isEnabled}
                                    onCheckedChange={(checked) =>
                                      updateTickerMutation.mutate({
                                        id: ticker.id,
                                        updates: { is_enabled: checked },
                                      })
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      deleteTickerMutation.mutate(ticker.id)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell> */}
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center py-8 text-muted-foreground"
                              >
                                No tickers found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Signals Tab */}
              <TabsContent value="signals" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Signal Management</CardTitle>
                      {/* <Dialog
                        open={isSignalDialogOpen}
                        onOpenChange={setIsSignalDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Signal
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create Trading Signal</DialogTitle>
                            <DialogDescription>
                              Manually create a trading signal
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div>
                              <Label htmlFor="signal-ticker">Ticker</Label>
                              <Input
                                id="signal-ticker"
                                value={signalForm.ticker}
                                onChange={(e) =>
                                  setSignalForm({
                                    ...signalForm,
                                    ticker: e.target.value,
                                  })
                                }
                                placeholder="BTC"
                              />
                            </div>
                            <div>
                              <Label htmlFor="signal-type">Signal Type</Label>
                              <Select
                                value={signalForm.signalType}
                                onValueChange={(value: "buy" | "sell") =>
                                  setSignalForm({
                                    ...signalForm,
                                    signalType: value,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="buy">Buy</SelectItem>
                                  <SelectItem value="sell">Sell</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="signal-price">Price</Label>
                              <Input
                                id="signal-price"
                                type="number"
                                value={signalForm.price}
                                onChange={(e) =>
                                  setSignalForm({
                                    ...signalForm,
                                    price: parseFloat(e.target.value) || 0,
                                  })
                                }
                                placeholder="45000"
                              />
                            </div>
                            <div>
                              <Label htmlFor="signal-note">Note/Message</Label>
                              <Input
                                id="signal-note"
                                value={signalForm.note}
                                onChange={(e) =>
                                  setSignalForm({
                                    ...signalForm,
                                    note: e.target.value,
                                  })
                                }
                                placeholder="Strong upward momentum"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() =>
                                createSignalMutation.mutate(signalForm)
                              }
                              disabled={createSignalMutation.isPending}
                            >
                              {createSignalMutation.isPending
                                ? "Creating..."
                                : "Create Signal"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog> */}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingSignals ? (
                      <div className="text-center py-8">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Symbol</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Timeframe</TableHead>
                            <TableHead>Created</TableHead>
                            {/* <TableHead>Actions</TableHead> */}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {signals && signals.length > 0 ? (
                            signals.map((signal: any) => (
                              <TableRow key={signal.id}>
                                <TableCell className="font-medium">
                                  {signal.symbol || signal.ticker}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      signal.signalType === "buy" ||
                                      signal.action === "buy"
                                        ? "default"
                                        : "destructive"
                                    }
                                  >
                                    {signal.signalType || signal.action}
                                  </Badge>
                                </TableCell>
                                <TableCell>${signal.price}</TableCell>
                                <TableCell>
                                  {signal.timeframe || "1h"}
                                </TableCell>
                                <TableCell>
                                  {new Date(
                                    signal.createdAt
                                  ).toLocaleDateString()}
                                </TableCell>
                                {/* <TableCell>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      deleteSignalMutation.mutate(signal.id)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell> */}
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="text-center py-8 text-muted-foreground"
                              >
                                No signals found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Plans Tab */}
              <TabsContent value="plans" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Subscription Plans</CardTitle>
                      {/* <Dialog
                        open={isPlanDialogOpen}
                        onOpenChange={setIsPlanDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Plan
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create Subscription Plan</DialogTitle>
                            <DialogDescription>
                              Add a new subscription plan with features and
                              pricing
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="plan-name">Plan Name</Label>
                                <Input
                                  id="plan-name"
                                  value={newPlan.name}
                                  onChange={(e) =>
                                    setNewPlan({
                                      ...newPlan,
                                      name: e.target.value,
                                    })
                                  }
                                  placeholder="e.g. Premium Plan"
                                />
                              </div>
                              <div>
                                <Label htmlFor="plan-tier">Tier</Label>
                                <Select
                                  value={newPlan.tier}
                                  onValueChange={(value) =>
                                    setNewPlan({ ...newPlan, tier: value })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select tier" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="basic">Basic</SelectItem>
                                    <SelectItem value="premium">
                                      Premium
                                    </SelectItem>
                                    <SelectItem value="pro">Pro</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="monthly-price">
                                  Monthly Price (cents)
                                </Label>
                                <Input
                                  id="monthly-price"
                                  type="number"
                                  value={newPlan.monthlyPrice}
                                  onChange={(e) =>
                                    setNewPlan({
                                      ...newPlan,
                                      monthlyPrice:
                                        parseInt(e.target.value) || 0,
                                    })
                                  }
                                  placeholder="999"
                                />
                              </div>
                              <div>
                                <Label htmlFor="yearly-price">
                                  Yearly Price (cents)
                                </Label>
                                <Input
                                  id="yearly-price"
                                  type="number"
                                  value={newPlan.yearlyPrice}
                                  onChange={(e) =>
                                    setNewPlan({
                                      ...newPlan,
                                      yearlyPrice:
                                        parseInt(e.target.value) || 0,
                                    })
                                  }
                                  placeholder="9990"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="max-signals">Max Signals</Label>
                                <Input
                                  id="max-signals"
                                  type="number"
                                  value={newPlan.maxSignals}
                                  onChange={(e) =>
                                    setNewPlan({
                                      ...newPlan,
                                      maxSignals: parseInt(e.target.value) || 0,
                                    })
                                  }
                                  placeholder="50"
                                />
                              </div>
                              <div>
                                <Label htmlFor="max-tickers">Max Tickers</Label>
                                <Input
                                  id="max-tickers"
                                  type="number"
                                  value={newPlan.maxTickers}
                                  onChange={(e) =>
                                    setNewPlan({
                                      ...newPlan,
                                      maxTickers: parseInt(e.target.value) || 0,
                                    })
                                  }
                                  placeholder="3"
                                />
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() => createPlanMutation.mutate(newPlan)}
                              disabled={createPlanMutation.isPending}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              {createPlanMutation.isPending
                                ? "Creating..."
                                : "Create Plan"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog> */}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {plansLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 border rounded"
                          >
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                            <Skeleton className="h-8 w-16" />
                          </div>
                        ))}
                      </div>
                    ) : plansError ? (
                      <div className="flex flex-col items-center justify-center py-8 space-y-2">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                        <p className="text-sm text-destructive font-medium">
                          Failed to load subscription plans
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => refetchPlans()}
                        >
                          Retry
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {subscriptionPlans && subscriptionPlans.length > 0 ? (
                          subscriptionPlans.map((plan: any) => (
                            <div
                              key={plan.id}
                              className="flex items-center justify-between p-3 border rounded"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{plan.name}</h4>
                                  <Badge
                                    variant={
                                      plan.isActive ? "default" : "secondary"
                                    }
                                  >
                                    {plan.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  ${(plan.monthlyPrice / 100).toFixed(2)}/month
                                  • {plan.maxSignals} signals •{" "}
                                  {plan.maxTickers} tickers
                                </p>
                              </div>
                              {/* <div className="flex items-center gap-2">
                                <UISwitch
                                  checked={plan.isActive}
                                  onCheckedChange={(checked) =>
                                    updatePlanMutation.mutate({
                                      planId: plan.id,
                                      updates: { isActive: checked },
                                    })
                                  }
                                />
                              </div> */}
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground text-center py-4">
                            No subscription plans found
                          </p>
                        )}
                      </div>
                    )}
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

export default function Admin() {
  return (
    <AdminErrorBoundary>
      <AdminPanel />
    </AdminErrorBoundary>
  );
}

//rubel
