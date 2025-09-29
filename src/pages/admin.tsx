import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { 
  Users, 
  Activity, 
  DollarSign, 
  Server, 
  Plus, 
  Edit, 
  Trash2,
  Send,
  CheckCircle,
  XCircle
} from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "admin" | "user";
  isActive: boolean;
  createdAt: string;
}

interface Ticker {
  id: string;
  symbol: string;
  description: string;
  isEnabled: boolean;
  createdAt: string;
}

interface SignalForm {
  ticker: string;
  signalType: "buy" | "sell";
  price: number;
  note: string;
}

interface SystemSetting {
  key: string;
  value: any;
  category: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  label: string;
  description?: string;
  isPublic: boolean;
  isEditable: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SystemLog {
  id: string;
  action: string;
  userId?: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface Integration {
  name: string;
  status: 'connected' | 'not_configured' | 'disconnected';
  provider: string;
  configStatus?: any;
  lastCheck?: string;
}

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [signalForm, setSignalForm] = useState<SignalForm>({
    ticker: "",
    signalType: "buy",
    price: 0,
    note: "",
  });

  // System Settings State - removed activeTab as we only show overview
  const [selectedCategory, setSelectedCategory] = useState<string>("general");
  const [newSetting, setNewSetting] = useState({
    key: "",
    value: "",
    category: "general",
    type: "string" as const,
    label: "",
    description: "",
    isPublic: false,
    isEditable: true
  });
  const [newTicker, setNewTicker] = useState({
    symbol: "",
    description: "",
    isEnabled: true,
  });
  const [newPlan, setNewPlan] = useState({
    name: "",
    tier: "",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [],
    maxSignals: 10,
    maxTickers: 3,
    isActive: true,
  });
  const [isSignalDialogOpen, setIsSignalDialogOpen] = useState(false);
  const [isTickerDialogOpen, setIsTickerDialogOpen] = useState(false);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);

  const authToken = localStorage.getItem("auth_token");

  // Fetch admin stats
  const { data: usersResponse, isLoading: isLoadingUsers, error: usersError } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      if (!authToken) throw new Error("No auth token");
      const response = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      return await response.json();
    },
    retry: false,
  });

  const users = usersResponse?.users || [];

  const { data: tickers, isLoading: isLoadingTickers, error: tickersError } = useQuery({
    queryKey: ["/api/admin/tickers"],
    queryFn: async () => {
      if (!authToken) throw new Error("No auth token");
      const response = await fetch("/api/admin/tickers", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fetch tickers: ${response.status}`);
      }
      return await response.json() as Ticker[];
    },
    retry: false,
  });

  const { data: signals, isLoading: isLoadingSignals, error: signalsError } = useQuery({
    queryKey: ["/api/signals"],
    queryFn: async () => {
      if (!authToken) throw new Error("No auth token");
      const response = await fetch("/api/signals?limit=20", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fetch signals: ${response.status}`);
      }
      return await response.json();
    },
    retry: false,
  });

  // System Settings Queries
  const { data: systemSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      if (!authToken) throw new Error("No auth token");
      const response = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch settings");
      return await response.json();
    },
    retry: false,
  });

  // System Logs Query
  const { data: systemLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/admin/system/logs"],
    queryFn: async () => {
      if (!authToken) throw new Error("No auth token");
      const response = await fetch("/api/admin/system/logs", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch logs");
      return await response.json();
    },
    retry: false,
  });

  // API Integrations Query
  const { data: integrations, isLoading: integrationsLoading } = useQuery({
    queryKey: ["/api/admin/system/integrations"],
    queryFn: async () => {
      if (!authToken) throw new Error("No auth token");
      const response = await fetch("/api/admin/system/integrations", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch integrations");
      return await response.json();
    },
    retry: false,
  });

  // System Statistics Query
  const { data: systemStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/system/stats"],
    queryFn: async () => {
      if (!authToken) throw new Error("No auth token");
      const response = await fetch("/api/admin/system/stats", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return await response.json();
    },
    retry: false,
  });

  // Subscription Plans Query
  const { data: subscriptionPlans, isLoading: plansLoading } = useQuery({
    queryKey: ["/api/admin/subscription-plans"],
    queryFn: async () => {
      if (!authToken) throw new Error("No auth token");
      const response = await fetch("/api/admin/subscription-plans", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch subscription plans");
      return await response.json();
    },
    retry: false,
  });

  // System Settings Mutations
  const createSettingMutation = useMutation({
    mutationFn: async (setting: any) => {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(setting),
      });
      if (!response.ok) throw new Error("Failed to create setting");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Success", description: "Setting created successfully" });
      setNewSetting({
        key: "", value: "", category: "general", type: "string",
        label: "", description: "", isPublic: false, isEditable: true
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create setting", variant: "destructive" });
    }
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, updates }: { key: string; updates: any }) => {
      const response = await fetch(`/api/admin/settings/${key}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update setting");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Success", description: "Setting updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update setting", variant: "destructive" });
    }
  });

  const deleteSettingMutation = useMutation({
    mutationFn: async (key: string) => {
      const response = await fetch(`/api/admin/settings/${key}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error("Failed to delete setting");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Success", description: "Setting deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete setting", variant: "destructive" });
    }
  });

  // Mutations
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update user");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update user", variant: "destructive" });
    },
  });

  const createTickerMutation = useMutation({
    mutationFn: async (ticker: typeof newTicker) => {
      const response = await fetch("/api/admin/tickers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(ticker),
      });
      if (!response.ok) throw new Error("Failed to create ticker");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickers"] });
      setNewTicker({ symbol: "", description: "", isEnabled: true });
      setIsTickerDialogOpen(false);
      toast({ title: "Ticker created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create ticker", variant: "destructive" });
    },
  });

  const updateTickerMutation = useMutation({
    mutationFn: async ({ tickerId, updates }: { tickerId: string; updates: Partial<Ticker> }) => {
      const response = await fetch(`/api/admin/tickers/${tickerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updates),
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

  const createSignalMutation = useMutation({
    mutationFn: async (signal: SignalForm) => {
      const response = await fetch("/api/admin/signals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(signal),
      });
      if (!response.ok) throw new Error("Failed to create signal");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/signals"] });
      setSignalForm({ ticker: "", signalType: "buy", price: 0, note: "" });
      setIsSignalDialogOpen(false);
      toast({ title: "Signal injected successfully" });
    },
    onError: () => {
      toast({ title: "Failed to inject signal", variant: "destructive" });
    },
  });

  // Subscription Plan Mutations
  const createPlanMutation = useMutation({
    mutationFn: async (plan: typeof newPlan) => {
      const response = await fetch("/api/admin/subscription-plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(plan),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create subscription plan");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      setNewPlan({
        name: "", tier: "", monthlyPrice: 0, yearlyPrice: 0, 
        features: [], maxSignals: 10, maxTickers: 3, isActive: true
      });
      setIsPlanDialogOpen(false);
      toast({ title: "Subscription plan created successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create subscription plan", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ planId, updates }: { planId: string; updates: any }) => {
      const response = await fetch(`/api/admin/subscription-plans/${planId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update subscription plan");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      toast({ title: "Subscription plan updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update subscription plan", variant: "destructive" });
    },
  });

  const adminStats = [
    {
      title: "Total Users",
      value: String(users?.length ?? 0),
      icon: Users,
      color: "text-foreground",
    },
    {
      title: "Active Signals",
      value: String(signals?.length ?? 0),
      icon: Activity,
      color: "text-emerald-400",
    },
    {
      title: "Revenue",
      value: "$45,678",
      icon: DollarSign,
      color: "text-emerald-400",
    },
    {
      title: "System Status",
      value: "Online",
      icon: Server,
      color: "text-emerald-400",
    },
  ];

  // Show fallback UI if not authenticated
  if (!authToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Authentication Required</h2>
            <p className="text-muted-foreground">Please log in to access the admin panel.</p>
            <Button className="mt-4" onClick={() => window.location.href = '/auth'}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show errors if API calls fail
  if (usersError || tickersError || signalsError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex">
          <Sidebar />
          <div className="ml-0 md:ml-64 flex-1 p-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 text-destructive">Admin Panel Error</h2>
                <p className="text-muted-foreground mb-4">Unable to load admin data. Please check your authentication.</p>
                <div className="space-y-2">
                  {usersError && <p className="text-sm text-destructive">Users: {usersError.message}</p>}
                  {tickersError && <p className="text-sm text-destructive">Tickers: {tickersError.message}</p>}
                  {signalsError && <p className="text-sm text-destructive">Signals: {signalsError.message}</p>}
                </div>
                <Button className="mt-4" onClick={() => window.location.reload()}>
                  Reload Page
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        
        {/* Main Content */}
        <div className="ml-0 md:ml-64 flex-1 min-h-screen">
          {/* Top Bar */}
          <header className="bg-card border-b border-border p-4 md:p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl md:text-2xl font-bold">Admin Dashboard</h1>
              <div className="flex items-center space-x-2 md:space-x-4">
                <span className="text-xs md:text-sm text-muted-foreground hidden sm:block">Last login: 2h ago</span>
                <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center text-destructive-foreground font-semibold text-sm">
                  A
                </div>
              </div>
            </div>
          </header>

          {/* Admin Content */}
          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Overview Content */}
            <div className="space-y-4 md:space-y-6">
              {/* Admin Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {(systemStats ? [
                    {
                      title: "Total Users",
                      value: String(systemStats.users?.total ?? 0),
                      icon: Users,
                      color: "text-blue-400",
                    },
                    {
                      title: "Active Tickers",
                      value: String(systemStats.tickers?.enabled ?? 0),
                      icon: Activity,
                      color: "text-emerald-400",
                    },
                    {
                      title: "Recent Signals",
                      value: String(systemStats.signals?.recent ?? 0),
                      icon: DollarSign,
                      color: "text-yellow-400",
                    },
                    {
                      title: "System Uptime",
                      value: `${Math.floor((systemStats.system?.uptime ?? 0) / 3600)}h`,
                      icon: Server,
                      color: "text-emerald-400",
                    },
                  ] : adminStats).map((stat, index) => {
                    const IconComponent = stat.icon;
                    return (
                      <Card key={index}>
                        <CardContent className="p-4 md:p-6">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs md:text-sm text-muted-foreground truncate">{stat.title}</p>
                              <p className={`text-lg md:text-2xl font-bold ${stat.color} truncate`}>{stat.value}</p>
                            </div>
                            <IconComponent className={`h-6 w-6 md:h-8 md:w-8 ${stat.color} flex-shrink-0 ml-2`} />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {systemLogs?.logs?.slice(0, 5).map((log: SystemLog) => (
                        <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-border last:border-b-0 gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{log.action}</p>
                            <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</p>
                          </div>
                          <Badge variant="outline" className="w-fit shrink-0">{log.userId ? 'User' : 'System'}</Badge>
                        </div>
                      )) || <p className="text-muted-foreground text-center py-4">No recent activity</p>}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">System Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(integrations || {}).map(([key, integration]: [string, any]) => (
                          <div key={key} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                            <span className="text-sm font-medium capitalize truncate flex-1 mr-2">{key}</span>
                            <Badge 
                              variant={integration.status === 'connected' ? 'default' : 'destructive'}
                              className="shrink-0"
                            >
                              {integration.status}
                            </Badge>
                          </div>
                        ))}
                        {Object.keys(integrations || {}).length === 0 && (
                          <p className="text-muted-foreground text-center py-4">No integrations configured</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Subscription Plans Management */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Subscription Plans</CardTitle>
                      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" data-testid="button-create-plan">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Plan
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create Subscription Plan</DialogTitle>
                            <DialogDescription>
                              Add a new subscription plan with features and pricing
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="plan-name">Plan Name</Label>
                                <Input
                                  id="plan-name"
                                  data-testid="input-plan-name"
                                  value={newPlan.name}
                                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                                  placeholder="e.g. Premium Plan"
                                />
                              </div>
                              <div>
                                <Label htmlFor="plan-tier">Tier</Label>
                                <Select value={newPlan.tier} onValueChange={(value) => setNewPlan({ ...newPlan, tier: value })}>
                                  <SelectTrigger data-testid="select-plan-tier">
                                    <SelectValue placeholder="Select tier" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="basic">Basic</SelectItem>
                                    <SelectItem value="premium">Premium</SelectItem>
                                    <SelectItem value="pro">Pro</SelectItem>
                                    <SelectItem value="elite">Elite</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="monthly-price">Monthly Price (cents)</Label>
                                <Input
                                  id="monthly-price"
                                  type="number"
                                  data-testid="input-monthly-price"
                                  value={newPlan.monthlyPrice}
                                  onChange={(e) => setNewPlan({ ...newPlan, monthlyPrice: parseInt(e.target.value) || 0 })}
                                  placeholder="999"
                                />
                              </div>
                              <div>
                                <Label htmlFor="yearly-price">Yearly Price (cents)</Label>
                                <Input
                                  id="yearly-price"
                                  type="number"
                                  data-testid="input-yearly-price"
                                  value={newPlan.yearlyPrice}
                                  onChange={(e) => setNewPlan({ ...newPlan, yearlyPrice: parseInt(e.target.value) || 0 })}
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
                                  data-testid="input-max-signals"
                                  value={newPlan.maxSignals}
                                  onChange={(e) => setNewPlan({ ...newPlan, maxSignals: parseInt(e.target.value) || 0 })}
                                  placeholder="50"
                                />
                              </div>
                              <div>
                                <Label htmlFor="max-tickers">Max Tickers</Label>
                                <Input
                                  id="max-tickers"
                                  type="number"
                                  data-testid="input-max-tickers"
                                  value={newPlan.maxTickers}
                                  onChange={(e) => setNewPlan({ ...newPlan, maxTickers: parseInt(e.target.value) || 0 })}
                                  placeholder="3"
                                />
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() => createPlanMutation.mutate(newPlan)}
                              disabled={createPlanMutation.isPending}
                              data-testid="button-save-plan"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {plansLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center justify-between p-3 border rounded">
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                            <Skeleton className="h-8 w-16" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {subscriptionPlans?.map((plan: any) => (
                          <div key={plan.id} className="flex items-center justify-between p-3 border rounded" data-testid={`plan-${plan.id}`}>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium" data-testid={`text-plan-name-${plan.id}`}>{plan.name}</h4>
                                <Badge variant={plan.isActive ? "default" : "secondary"}>
                                  {plan.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                ${(plan.monthlyPrice / 100).toFixed(2)}/month • 
                                {plan.maxSignals === -1 ? 'Unlimited' : plan.maxSignals} signals • 
                                {plan.maxTickers === -1 ? 'Unlimited' : plan.maxTickers} tickers
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <UISwitch
                                checked={plan.isActive}
                                onCheckedChange={(checked) => 
                                  updatePlanMutation.mutate({ planId: plan.id, updates: { isActive: checked } })
                                }
                                data-testid={`switch-plan-active-${plan.id}`}
                              />
                            </div>
                          </div>
                        )) || <p className="text-muted-foreground text-center py-4">No subscription plans found</p>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
