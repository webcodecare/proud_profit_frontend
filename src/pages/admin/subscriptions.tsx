import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../hooks/useAuth";
import { CreditCard, Edit, Trash2, Plus, Users, TrendingUp, DollarSign, Calendar, RefreshCw } from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  interval: string;
  billing_interval: string;
  features: string | string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserSubscription {
  id: string;
  user_id: string;
  current_plan_id: string | null;
  status: string;
  billing_interval: string | null;
  next_billing_date: string | null;
  last_billing_date: string | null;
  started_at: string;
  cancelled_at: string | null;
  created_at: string;
  users?: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
    is_active: boolean;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    subscription_tier: string | null;
    subscription_status: string | null;
    subscription_ends_at: string | null;
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
  };
  subscription_plans?: SubscriptionPlan;
}

interface PaymentTransaction {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_provider: string;
  created_at: string;
  paid_at: string | null;
  subscription_plan_id: string | null;
}

export default function AdminSubscriptions() {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<SubscriptionPlan | null>(null);
  const [newPlan, setNewPlan] = useState({
    name: "",
    description: "",
    price: 0,
    interval: "month",
    billing_interval: "monthly",
    features: [""],
  });
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  // Fetch subscription plans from Supabase
  const { data: plans = [], isLoading: plansLoading, refetch: refetchPlans } = useQuery<SubscriptionPlan[]>({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      if (!supabase) {
        console.warn("Supabase not configured");
        return [];
      }

      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("price", { ascending: true });

      if (error) {
        console.error("Error fetching subscription plans:", error);
        throw error;
      }

      return data || [];
    },
  });

  // Fetch users directly from Supabase users table
  const { data: userSubscriptions = [], isLoading: subscriptionsLoading, refetch: refetchSubscriptions, error: fetchError } = useQuery<UserSubscription[]>({
    queryKey: ["user-subscriptions"],
    queryFn: async () => {
      console.log("🔍 Starting to fetch users from Supabase...");
      console.log("🔑 Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
      console.log("🔑 Has Anon Key:", !!import.meta.env.VITE_SUPABASE_ANON_KEY);
      
      if (!supabase) {
        console.error("⚠️ Supabase not configured - no client available");
        console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
        return [];
      }

      console.log("✅ Supabase client is available");
      console.log("📡 Fetching from 'users' table...");

      try {
        const { data, error, count } = await supabase
          .from("users")
          .select("*", { count: 'exact' })
          .order("created_at", { ascending: false });

        if (error) {
          console.error("❌ Supabase error:", error);
          console.error("Error code:", error.code);
          console.error("Error message:", error.message);
          console.error("Error details:", error.details);
          throw error;
        }

        console.log("✅ Query successful!");
        console.log("📊 Total users in Supabase:", count);
        console.log("📊 Users returned:", data?.length || 0);
        console.log("👥 Sample user data:", data?.[0]);
        console.log("👥 All user data:", data);

        // Transform data to match expected format
        return (data || []).map(user => ({
        id: user.id,
        user_id: user.id,
        current_plan_id: null,
        status: user.subscription_status || 'none',
        billing_interval: null,
        next_billing_date: null,
        last_billing_date: null,
        started_at: user.created_at,
        cancelled_at: null,
        created_at: user.created_at,
        users: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          is_active: user.is_active,
          stripe_customer_id: user.stripe_customer_id,
          stripe_subscription_id: user.stripe_subscription_id,
          subscription_tier: user.subscription_tier,
          subscription_status: user.subscription_status,
          subscription_ends_at: user.subscription_ends_at,
          last_login_at: user.last_login_at,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
        }));
      } catch (err) {
        console.error("💥 Unexpected error fetching users:", err);
        throw err;
      }
    },
  });

  // Fetch payment transactions for analytics
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<PaymentTransaction[]>({
    queryKey: ["payment-transactions"],
    queryFn: async () => {
      if (!supabase) {
        console.warn("Supabase not configured");
        return [];
      }

      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching payment transactions:", error);
        throw error;
      }

      return data || [];
    },
  });

  // Calculate analytics
  const analytics = useMemo(() => {
    const activeSubscriptions = userSubscriptions.filter(s => s.status === "active").length;
    
    // Calculate monthly revenue from completed transactions this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyTransactions = transactions.filter(t => 
      t.status === "completed" && 
      new Date(t.created_at) >= startOfMonth
    );
    const monthlyRevenue = monthlyTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Calculate previous month for comparison
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastMonthTransactions = transactions.filter(t => 
      t.status === "completed" && 
      new Date(t.created_at) >= startOfLastMonth &&
      new Date(t.created_at) <= endOfLastMonth
    );
    const lastMonthRevenue = lastMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
      : "0";

    // Calculate churn rate (cancelled in last 30 days / total active 30 days ago)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const cancelledLast30Days = userSubscriptions.filter(s => 
      s.cancelled_at && new Date(s.cancelled_at) >= thirtyDaysAgo
    ).length;
    const totalSubs = userSubscriptions.length;
    const churnRate = totalSubs > 0 ? ((cancelledLast30Days / totalSubs) * 100).toFixed(1) : "0";

    // Calculate conversion rate (new active subs last 30 days / total users)
    const newSubsLast30Days = userSubscriptions.filter(s => 
      new Date(s.started_at) >= thirtyDaysAgo && s.status === "active"
    ).length;

    return {
      activeSubscriptions,
      monthlyRevenue,
      revenueGrowth,
      churnRate,
      newSubsLast30Days,
    };
  }, [userSubscriptions, transactions]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "past_due":
        return <Badge variant="destructive">Past Due</Badge>;
      case "trialing":
        return <Badge variant="outline">Trial</Badge>;
      case "paused":
        return <Badge variant="secondary">Paused</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (planData: any) => {
      if (!supabase) {
        throw new Error("Supabase not configured");
      }

      const { data, error } = await supabase
        .from("subscription_plans")
        .insert([{
          name: planData.name,
          description: planData.description || null,
          price: planData.price,
          interval: planData.interval,
          billing_interval: planData.billing_interval,
          features: JSON.stringify(planData.features.filter((f: string) => f.trim() !== '')),
          is_active: true,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      refetchPlans();
      toast({ title: 'Success', description: 'Subscription plan created successfully' });
      setIsCreateDialogOpen(false);
      setNewPlan({ name: '', description: '', price: 0, interval: 'month', billing_interval: 'monthly', features: [''] });
    },
    onError: (error: any) => {
      console.error('Create plan error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to create subscription plan', variant: 'destructive' });
    }
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      if (!supabase) {
        throw new Error("Supabase not configured");
      }

      const { data: result, error } = await supabase
        .from("subscription_plans")
        .update({
          name: data.name,
          description: data.description || null,
          price: data.price,
          interval: data.interval,
          billing_interval: data.billing_interval,
          features: typeof data.features === 'string' ? data.features : JSON.stringify(data.features.filter((f: string) => f.trim() !== '')),
          is_active: data.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      refetchPlans();
      toast({ title: 'Success', description: 'Subscription plan updated successfully' });
      setIsEditDialogOpen(false);
      setSelectedPlan(null);
    },
    onError: (error: any) => {
      console.error('Update plan error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to update subscription plan', variant: 'destructive' });
    }
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) {
        throw new Error("Supabase not configured");
      }

      const { error } = await supabase
        .from("subscription_plans")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      refetchPlans();
      toast({ title: 'Success', description: 'Subscription plan deleted successfully' });
      setIsDeleteDialogOpen(false);
      setPlanToDelete(null);
    },
    onError: (error: any) => {
      console.error('Delete plan error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to delete subscription plan', variant: 'destructive' });
    }
  });

  const handleCreatePlan = () => {
    createPlanMutation.mutate(newPlan);
  };

  const handleUpdatePlan = () => {
    if (!selectedPlan) return;
    const planData = {
      name: selectedPlan.name,
      description: selectedPlan.description,
      price: selectedPlan.price,
      interval: selectedPlan.interval,
      billing_interval: selectedPlan.billing_interval,
      features: selectedPlan.features,
      is_active: selectedPlan.is_active
    };
    updatePlanMutation.mutate({ id: selectedPlan.id, data: planData });
  };

  const handleDeletePlan = () => {
    if (!planToDelete) return;
    deletePlanMutation.mutate(planToDelete.id);
  };

  const openEditDialog = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (plan: SubscriptionPlan) => {
    setPlanToDelete(plan);
    setIsDeleteDialogOpen(true);
  };

  const addFeature = (isEditMode = false) => {
    if (isEditMode && selectedPlan) {
      setSelectedPlan({
        ...selectedPlan,
        features: [...selectedPlan.features, '']
      });
    } else {
      setNewPlan({
        ...newPlan,
        features: [...newPlan.features, '']
      });
    }
  };

  const removeFeature = (index: number, isEditMode = false) => {
    if (isEditMode && selectedPlan) {
      const newFeatures = selectedPlan.features.filter((_, i) => i !== index);
      setSelectedPlan({
        ...selectedPlan,
        features: newFeatures
      });
    } else {
      const newFeatures = newPlan.features.filter((_, i) => i !== index);
      setNewPlan({
        ...newPlan,
        features: newFeatures
      });
    }
  };

  const updateFeature = (index: number, value: string, isEditMode = false) => {
    if (isEditMode && selectedPlan) {
      const newFeatures = [...selectedPlan.features];
      newFeatures[index] = value;
      setSelectedPlan({
        ...selectedPlan,
        features: newFeatures
      });
    } else {
      const newFeatures = [...newPlan.features];
      newFeatures[index] = value;
      setNewPlan({
        ...newPlan,
        features: newFeatures
      });
    }
  };

  // Loading state
  if (plansLoading || subscriptionsLoading || transactionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <Sidebar className="hidden lg:block lg:w-64" />
          
          <div className="flex-1 lg:ml-64">
            <Header 
              title="Subscription Management" 
              subtitle="Loading subscription data..."
            />

            <div className="p-4 lg:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
        <Sidebar className="hidden lg:block lg:w-64" />
        
        {/* Main Content */}
        <div className="flex-1 lg:ml-64">
          {/* Header */}
          <Header 
            title="Subscription Management" 
            subtitle="Manage subscription plans and user subscriptions"
          >
            <Button 
              variant="outline" 
              onClick={() => {
                refetchPlans();
                refetchSubscriptions();
              }}
              className="mr-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </Header>

          {/* Content */}
          <div className="p-4 lg:p-6 space-y-6">
            <Tabs defaultValue="plans" className="space-y-4">
              <TabsList>
                <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
                <TabsTrigger value="users">User Subscriptions ({userSubscriptions.length})</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="plans" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plans && plans.length > 0 ? (
                    plans.map((plan) => (
                      <Card key={plan.id} className={plan.is_active ? "" : "opacity-60"}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                {plan.name}
                                {!plan.is_active && <Badge variant="secondary">Inactive</Badge>}
                              </CardTitle>
                              <CardDescription>{plan.description || plan.interval}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <p className="text-2xl font-bold">${plan.price}</p>
                              <p className="text-sm text-muted-foreground">per {plan.interval}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium mb-2">Features:</p>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {(() => {
                                  const features = typeof plan.features === 'string' 
                                    ? (plan.features.startsWith('{') || plan.features.startsWith('[') 
                                        ? JSON.parse(plan.features) 
                                        : [plan.features])
                                    : plan.features;
                                  const featureArray = Array.isArray(features) ? features : [];
                                  return featureArray.slice(0, 3).map((feature: any, index: number) => (
                                    <li key={index} className="flex items-center">
                                      <span className="w-1 h-1 bg-primary rounded-full mr-2"></span>
                                      {typeof feature === 'string' ? feature : JSON.stringify(feature)}
                                    </li>
                                  ));
                                })()}
                              </ul>
                            </div>

                            <div className="flex space-x-2 mt-4 pt-4 border-t">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => openEditDialog(plan)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => openDeleteDialog(plan)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No subscription plans available</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                {(() => {
                  const activeUsers = userSubscriptions.filter(sub => 
                    sub.users?.subscription_status === 'active'
                  );
                  const endedUsers = userSubscriptions.filter(sub => 
                    sub.users?.subscription_status && sub.users.subscription_status !== 'active'
                  );
                  const noSubscriptionUsers = userSubscriptions.filter(sub => 
                    !sub.users?.subscription_status
                  );

                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                                <p className="text-2xl font-bold text-green-600">{activeUsers.length}</p>
                              </div>
                              <Users className="h-8 w-8 text-green-600" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Ended/Cancelled</p>
                                <p className="text-2xl font-bold text-red-600">{endedUsers.length}</p>
                              </div>
                              <Users className="h-8 w-8 text-red-600" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">No Subscription</p>
                                <p className="text-2xl font-bold text-gray-600">{noSubscriptionUsers.length}</p>
                              </div>
                              <Users className="h-8 w-8 text-gray-600" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle>Active User Subscriptions</CardTitle>
                          <CardDescription>
                            Users with active subscription status only
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {activeUsers.length === 0 ? (
                            <div className="text-center py-8">
                              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <p className="text-muted-foreground">No active subscriptions found</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse">
                                <thead>
                                  <tr className="border-b bg-muted/50">
                                    <th className="p-3 text-left text-sm font-medium">User Info</th>
                                    <th className="p-3 text-left text-sm font-medium bg-blue-50">Subscription Tier</th>
                                    <th className="p-3 text-left text-sm font-medium bg-blue-50">Subscription Status</th>
                                    <th className="p-3 text-left text-sm font-medium bg-blue-50">Subscription Ends At</th>
                                    <th className="p-3 text-left text-sm font-medium">Role</th>
                                    <th className="p-3 text-left text-sm font-medium">Account Active</th>
                                    <th className="p-3 text-left text-sm font-medium">Stripe Customer ID</th>
                                    <th className="p-3 text-left text-sm font-medium">Stripe Sub ID</th>
                                    <th className="p-3 text-left text-sm font-medium">Last Login</th>
                                    <th className="p-3 text-left text-sm font-medium">Created At</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {activeUsers.map((subscription) => {
                                    const isActive = subscription.users?.subscription_status === 'active';
                                    const isEnded = subscription.users?.subscription_status && subscription.users.subscription_status !== 'active';
                                    const rowClass = isActive ? 'bg-green-50/50' : isEnded ? 'bg-red-50/50' : '';
                                    
                                    return (
                                      <tr key={subscription.id} className={`border-b hover:bg-muted/30 ${rowClass}`}>
                                        <td className="p-3 text-sm">
                                          <div>
                                            <p className="font-medium">
                                              {subscription.users?.first_name && subscription.users?.last_name
                                                ? `${subscription.users.first_name} ${subscription.users.last_name}`
                                                : 'N/A'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{subscription.users?.email || 'N/A'}</p>
                                            <p className="text-xs text-muted-foreground font-mono">{subscription.users?.id || 'N/A'}</p>
                                          </div>
                                        </td>
                                        <td className="p-3 text-sm bg-blue-50/30">
                                          {subscription.users?.subscription_tier ? (
                                            <Badge variant="outline" className="font-semibold">
                                              {subscription.users.subscription_tier.toUpperCase()}
                                            </Badge>
                                          ) : (
                                            <span className="text-muted-foreground">No Tier</span>
                                          )}
                                        </td>
                                        <td className="p-3 text-sm bg-blue-50/30">
                                          {subscription.users?.subscription_status ? (
                                            <Badge variant={isActive ? 'default' : 'destructive'} className="font-semibold">
                                              {subscription.users.subscription_status.toUpperCase()}
                                            </Badge>
                                          ) : (
                                            <span className="text-muted-foreground">No Status</span>
                                          )}
                                        </td>
                                        <td className="p-3 text-sm bg-blue-50/30">
                                          {subscription.users?.subscription_ends_at ? (
                                            <div>
                                              <p className="font-medium">
                                                {new Date(subscription.users.subscription_ends_at).toLocaleDateString()}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                {new Date(subscription.users.subscription_ends_at) > new Date() 
                                                  ? '(Future)' 
                                                  : '(Expired)'}
                                              </p>
                                            </div>
                                          ) : (
                                            <span className="text-muted-foreground">N/A</span>
                                          )}
                                        </td>
                                        <td className="p-3 text-sm">
                                          <Badge variant={subscription.users?.role === 'admin' ? 'default' : 'outline'}>
                                            {subscription.users?.role || 'N/A'}
                                          </Badge>
                                        </td>
                                        <td className="p-3 text-sm">
                                          <Badge variant={subscription.users?.is_active ? 'default' : 'destructive'}>
                                            {subscription.users?.is_active ? 'Yes' : 'No'}
                                          </Badge>
                                        </td>
                                        <td className="p-3 text-sm font-mono text-xs">
                                          {subscription.users?.stripe_customer_id || 'N/A'}
                                        </td>
                                        <td className="p-3 text-sm font-mono text-xs">
                                          {subscription.users?.stripe_subscription_id || 'N/A'}
                                        </td>
                                        <td className="p-3 text-sm">
                                          {subscription.users?.last_login_at 
                                            ? new Date(subscription.users.last_login_at).toLocaleString()
                                            : 'Never'}
                                        </td>
                                        <td className="p-3 text-sm">
                                          {subscription.users?.created_at 
                                            ? new Date(subscription.users.created_at).toLocaleDateString()
                                            : 'N/A'}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                          <p className="text-2xl font-bold">
                            {analytics.activeSubscriptions}
                          </p>
                        </div>
                        <Users className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {analytics.newSubsLast30Days} new in last 30 days
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                          <p className="text-2xl font-bold">{formatCurrency(analytics.monthlyRevenue)}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {Number(analytics.revenueGrowth) >= 0 ? '+' : ''}{analytics.revenueGrowth}% from last month
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Churn Rate</p>
                          <p className="text-2xl font-bold">{analytics.churnRate}%</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Last 30 days</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Plans</p>
                          <p className="text-2xl font-bold">{plans.filter(p => p.is_active).length}</p>
                        </div>
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {plans.length} total ({plans.filter(p => !p.is_active).length} inactive)
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Breakdown by Plan</CardTitle>
                    <CardDescription>Monthly recurring revenue per subscription tier</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {plans.filter(p => p.is_active).map((plan) => {
                        const planSubs = userSubscriptions.filter(
                          s => s.current_plan_id === plan.id && s.status === 'active'
                        );
                        const planRevenue = planSubs.length * plan.price;
                        
                        return (
                          <div key={plan.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{plan.name}</p>
                              <p className="text-sm text-muted-foreground">{planSubs.length} active subscribers</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">${planRevenue.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">/{plan.interval}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Create Plan Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Subscription Plan</DialogTitle>
            <DialogDescription>Add a new subscription tier to your platform</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="create-name">Plan Name</Label>
                <Input
                  id="create-name"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  placeholder="e.g. Premium Plan"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-price">Price ($)</Label>
                <Input
                  id="create-price"
                  type="number"
                  step="0.01"
                  value={newPlan.price}
                  onChange={(e) => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="create-interval">Interval</Label>
                <Select value={newPlan.interval} onValueChange={(value) => setNewPlan({ ...newPlan, interval: value })}>
                  <SelectTrigger id="create-interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-billing-interval">Billing Interval</Label>
                <Select value={newPlan.billing_interval} onValueChange={(value) => setNewPlan({ ...newPlan, billing_interval: value })}>
                  <SelectTrigger id="create-billing-interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="create-description">Description (optional)</Label>
              <Input
                id="create-description"
                value={newPlan.description}
                onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                placeholder="e.g. Complete trading suite"
              />
            </div>

            <div className="grid gap-2">
              <Label>Features</Label>
              {newPlan.features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value, false)}
                    placeholder="Feature description"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeFeature(index, false)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => addFeature(false)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Feature
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreatePlan} disabled={createPlanMutation.isPending}>
              {createPlanMutation.isPending ? 'Creating...' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Subscription Plan</DialogTitle>
            <DialogDescription>Update subscription plan details</DialogDescription>
          </DialogHeader>
          {selectedPlan && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Plan Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedPlan.name}
                    onChange={(e) => setSelectedPlan({ ...selectedPlan, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-price">Price ($)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={selectedPlan.price}
                    onChange={(e) => setSelectedPlan({ ...selectedPlan, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-interval">Interval</Label>
                  <Select value={selectedPlan.interval} onValueChange={(value) => setSelectedPlan({ ...selectedPlan, interval: value })}>
                    <SelectTrigger id="edit-interval">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="year">Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-billing-interval">Billing Interval</Label>
                  <Select value={selectedPlan.billing_interval} onValueChange={(value) => setSelectedPlan({ ...selectedPlan, billing_interval: value })}>
                    <SelectTrigger id="edit-billing-interval">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={selectedPlan.description || ''}
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, description: e.target.value })}
                  placeholder="e.g. Complete trading suite"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-is-active"
                  checked={selectedPlan.is_active}
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="edit-is-active">Active</Label>
              </div>

              <div className="grid gap-2">
                <Label>Features</Label>
                {(() => {
                  const featuresArray = typeof selectedPlan.features === 'string' 
                    ? (selectedPlan.features.startsWith('{') || selectedPlan.features.startsWith('[') 
                        ? JSON.parse(selectedPlan.features) 
                        : [selectedPlan.features])
                    : Array.isArray(selectedPlan.features) ? selectedPlan.features : [];
                  
                  return featuresArray.map((feature: any, index: number) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={typeof feature === 'string' ? feature : JSON.stringify(feature)}
                        onChange={(e) => {
                          const newFeatures = [...featuresArray];
                          newFeatures[index] = e.target.value;
                          setSelectedPlan({ ...selectedPlan, features: newFeatures as any });
                        }}
                        placeholder="Feature description"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newFeatures = featuresArray.filter((_: any, i: number) => i !== index);
                          setSelectedPlan({ ...selectedPlan, features: newFeatures as any });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ));
                })()}
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  const featuresArray = typeof selectedPlan.features === 'string' 
                    ? (selectedPlan.features.startsWith('{') || selectedPlan.features.startsWith('[')
                        ? JSON.parse(selectedPlan.features)
                        : [selectedPlan.features])
                    : Array.isArray(selectedPlan.features) ? selectedPlan.features : [];
                  setSelectedPlan({ ...selectedPlan, features: [...featuresArray, ''] as any });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feature
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleUpdatePlan} disabled={updatePlanMutation.isPending}>
              {updatePlanMutation.isPending ? 'Updating...' : 'Update Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subscription Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{planToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePlan} disabled={deletePlanMutation.isPending}>
              {deletePlanMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
