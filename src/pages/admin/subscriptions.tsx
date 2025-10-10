import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { apiRequest, queryClient } from "../../lib/queryClient";
import { CreditCard, Edit, Trash2, Plus, Users, TrendingUp, DollarSign, Calendar } from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";

interface UserSubscription {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  planTier: string;
  planName: string;
  status: "active" | "cancelled" | "expired" | "pending";
  startDate: string;
  endDate: string;
  amount: number;
  stripeSubscriptionId?: string;
  lastPayment: string;
  nextPayment: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  tier: string;
  monthlyPrice: number;
  yearlyPrice: number | null;
  features: string[];
  maxSignals: number | null;
  maxTickers: number | null;
  isActive: boolean;
}

export default function AdminSubscriptions() {
  console.log('AdminSubscriptions component: Starting render');
  
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<SubscriptionPlan | null>(null);
  const [newPlan, setNewPlan] = useState({
    name: "",
    tier: "basic",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [""],
    maxSignals: 10,
    maxTickers: 3,
  });
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  console.log('AdminSubscriptions: Setting up subscriptions query');
  const { data: subscriptions = [], isLoading: subscriptionsLoading, error: subscriptionsError } = useQuery<UserSubscription[]>({
    queryKey: ["/api/admin/subscriptions"],
    queryFn: () => apiRequest("/api/admin/subscriptions"),
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });
  
  // Ensure subscriptions is always an array
  const safeSubscriptions = Array.isArray(subscriptions) ? subscriptions : [];
  
  if (subscriptionsError) {
    console.error('Subscriptions query error:', subscriptionsError);
  }

  console.log('AdminSubscriptions: Setting up plans query');
  const { data: plansResponse, isLoading: plansLoading, error: plansError } = useQuery({
    queryKey: ["/api/subscription-plans"],
    queryFn: () => apiRequest("/api/subscription-plans"),
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });
  
  const plans: SubscriptionPlan[] = plansResponse?.plans?.map((plan: any) => ({
    id: plan.id,
    name: plan.name,
    tier: plan.tier || plan.name.toLowerCase(),
    monthlyPrice: plan.price,
    yearlyPrice: plan.yearly_price || null,
    features: plan.features || [],
    maxSignals: plan.max_signals ?? -1,
    maxTickers: plan.max_tickers ?? -1,
    isActive: plan.is_active ?? true,
  })) || [];
  
  if (plansError) {
    console.error('Plans query error:', plansError);
  }
  
  console.log('AdminSubscriptions: About to render, plans:', plans?.length || 0, 'subscriptions:', subscriptions?.length || 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "expired":
        return <Badge variant="secondary">Expired</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
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
    mutationFn: (planData: any) => {
      // Validate admin permissions before API call
      if (!hasPermission("admin")) {
        throw new Error("Insufficient permissions: Admin role required");
      }
      return apiRequest('/api/admin/subscription-plans', {
        method: 'POST',
        body: JSON.stringify(planData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
      toast({ title: 'Success', description: 'Subscription plan created successfully' });
      setIsCreateDialogOpen(false);
      setNewPlan({ name: '', tier: 'basic', monthlyPrice: 0, yearlyPrice: 0, features: [''], maxSignals: 10, maxTickers: 3 });
    },
    onError: (error: any) => {
      console.error('Create plan error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to create subscription plan', variant: 'destructive' });
    }
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      // Validate admin permissions before API call
      if (!hasPermission("admin")) {
        throw new Error("Insufficient permissions: Admin role required");
      }
      return apiRequest(`/api/admin/subscription-plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
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
    mutationFn: (id: string) => {
      // Validate admin permissions before API call
      if (!hasPermission("admin")) {
        throw new Error("Insufficient permissions: Admin role required");
      }
      return apiRequest(`/api/admin/subscription-plans/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
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
    const filteredFeatures = newPlan.features.filter(f => f.trim() !== '');
    const planData = {
      ...newPlan,
      features: filteredFeatures,
      monthlyPrice: Math.round(newPlan.monthlyPrice * 100), // Convert to cents
      yearlyPrice: newPlan.yearlyPrice ? Math.round(newPlan.yearlyPrice * 100) : null
    };
    createPlanMutation.mutate(planData);
  };

  const handleUpdatePlan = () => {
    if (!selectedPlan) return;
    const filteredFeatures = selectedPlan.features.filter(f => f.trim() !== '');
    const planData = {
      name: selectedPlan.name,
      tier: selectedPlan.tier,
      monthlyPrice: Math.round(selectedPlan.monthlyPrice * 100), // Convert to cents
      yearlyPrice: selectedPlan.yearlyPrice ? Math.round(selectedPlan.yearlyPrice * 100) : null,
      features: filteredFeatures,
      maxSignals: selectedPlan.maxSignals,
      maxTickers: selectedPlan.maxTickers,
      isActive: selectedPlan.isActive
    };
    updatePlanMutation.mutate({ id: selectedPlan.id, data: planData });
  };

  const handleDeletePlan = () => {
    if (!planToDelete) return;
    deletePlanMutation.mutate(planToDelete.id);
  };

  const openEditDialog = (plan: SubscriptionPlan) => {
    setSelectedPlan({
      ...plan,
      monthlyPrice: plan.monthlyPrice / 100, // Convert from cents
      yearlyPrice: plan.yearlyPrice ? plan.yearlyPrice / 100 : null
    });
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

  // Error boundary fallback
  if (subscriptionsError && plansError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <Sidebar className="hidden lg:block lg:w-64" />
          
          <div className="flex-1 lg:ml-64">
            <Header 
              title="Subscription Management" 
              subtitle="Manage subscription plans and user subscriptions"
            />

            <div className="p-4 lg:p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-medium">Error Loading Data</h3>
                <p className="text-red-600 text-sm mt-1">
                  Failed to load subscription data. Please try refreshing the page.
                </p>
                <Button 
                  className="mt-2" 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (subscriptionsLoading || plansLoading) {
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
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </Header>

          {/* Content */}
          <div className="p-4 lg:p-6 space-y-6">
            {(subscriptionsError || plansError) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-medium">Error Loading Data</h3>
                <p className="text-red-600 text-sm mt-1">
                  {subscriptionsError ? 'Failed to load subscriptions. ' : ''}
                  {plansError ? 'Failed to load subscription plans.' : ''}
                  Please try refreshing the page.
                </p>
              </div>
            )}
            
            <Tabs defaultValue="plans" className="space-y-4">
              <TabsList>
                <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
                <TabsTrigger value="users">User Subscriptions</TabsTrigger>
                <TabsTrigger value="analytics">Subscription Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="plans" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plans && plans.length > 0 ? (
                    plans.map((plan) => (
                      <Card key={plan.id} className={plan.isActive ? "" : "opacity-60"}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                {plan.name}
                                {!plan.isActive && <Badge variant="secondary">Inactive</Badge>}
                              </CardTitle>
                              <CardDescription className="capitalize">{plan.tier} tier</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <p className="text-2xl font-bold">{formatCurrency(plan.monthlyPrice)}</p>
                              <p className="text-sm text-muted-foreground">per month</p>
                              {plan.yearlyPrice && (
                                <p className="text-sm text-muted-foreground">
                                  {formatCurrency(plan.yearlyPrice)} per year
                                </p>
                              )}
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium mb-2">Features:</p>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {plan.features?.slice(0, 3).map((feature, index) => (
                                  <li key={index} className="flex items-center">
                                    <span className="w-1 h-1 bg-primary rounded-full mr-2"></span>
                                    {feature}
                                  </li>
                                ))}
                                {plan.features && plan.features.length > 3 && (
                                  <li className="text-xs">+{plan.features.length - 3} more</li>
                                )}
                              </ul>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="font-medium">Signals</p>
                                <p className="text-muted-foreground">
                                  {plan.maxSignals === -1 ? "Unlimited" : plan.maxSignals}
                                </p>
                              </div>
                              <div>
                                <p className="font-medium">Tickers</p>
                                <p className="text-muted-foreground">
                                  {plan.maxTickers === -1 ? "Unlimited" : plan.maxTickers}
                                </p>
                              </div>
                            </div>

                            <div className="flex space-x-2 mt-4 pt-4 border-t">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => openEditDialog(plan)}
                                data-testid={`button-edit-${plan.id}`}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => openDeleteDialog(plan)}
                                data-testid={`button-delete-${plan.id}`}
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
                <Card>
                  <CardHeader>
                    <CardTitle>User Subscriptions</CardTitle>
                    <CardDescription>Manage individual user subscriptions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {safeSubscriptions.length === 0 ? (
                      <div className="text-center py-8">
                        <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No active subscriptions</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {safeSubscriptions.map((subscription) => (
                          <div key={subscription.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div>
                                <h4 className="font-medium">{subscription.userName}</h4>
                                <p className="text-sm text-muted-foreground">{subscription.userEmail}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">{subscription.planName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatCurrency(subscription.amount)} • Next payment: {new Date(subscription.nextPayment).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(subscription.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                          <p className="text-2xl font-bold">
                            {safeSubscriptions.filter(s => s.status === "active").length}
                          </p>
                        </div>
                        <Users className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">+5% from last month</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                          <p className="text-2xl font-bold">$12,450</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">+12% from last month</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Churn Rate</p>
                          <p className="text-2xl font-bold">2.3%</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">-0.5% from last month</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Avg LTV</p>
                          <p className="text-2xl font-bold">$287</p>
                        </div>
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">+8% from last month</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Create Plan Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Subscription Plan</DialogTitle>
                  <DialogDescription>
                    Add a new subscription plan to offer to your users.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="create-name">Plan Name</Label>
                    <Input
                      id="create-name"
                      value={newPlan.name}
                      onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                      placeholder="e.g., Pro Plan"
                      data-testid="input-create-name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="create-tier">Tier</Label>
                    <Select value={newPlan.tier} onValueChange={(value) => setNewPlan({ ...newPlan, tier: value })}>
                      <SelectTrigger data-testid="select-create-tier">
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="elite">Elite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="create-monthly-price">Monthly Price ($)</Label>
                      <Input
                        id="create-monthly-price"
                        type="number"
                        step="0.01"
                        value={newPlan.monthlyPrice}
                        onChange={(e) => setNewPlan({ ...newPlan, monthlyPrice: parseFloat(e.target.value) || 0 })}
                        data-testid="input-create-monthly-price"
                      />
                    </div>
                    <div>
                      <Label htmlFor="create-yearly-price">Yearly Price ($)</Label>
                      <Input
                        id="create-yearly-price"
                        type="number"
                        step="0.01"
                        value={newPlan.yearlyPrice}
                        onChange={(e) => setNewPlan({ ...newPlan, yearlyPrice: parseFloat(e.target.value) || 0 })}
                        data-testid="input-create-yearly-price"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="create-max-signals">Max Signals (-1 for unlimited)</Label>
                      <Input
                        id="create-max-signals"
                        type="number"
                        value={newPlan.maxSignals}
                        onChange={(e) => setNewPlan({ ...newPlan, maxSignals: parseInt(e.target.value) || 0 })}
                        data-testid="input-create-max-signals"
                      />
                    </div>
                    <div>
                      <Label htmlFor="create-max-tickers">Max Tickers (-1 for unlimited)</Label>
                      <Input
                        id="create-max-tickers"
                        type="number"
                        value={newPlan.maxTickers}
                        onChange={(e) => setNewPlan({ ...newPlan, maxTickers: parseInt(e.target.value) || 0 })}
                        data-testid="input-create-max-tickers"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Features</Label>
                    {newPlan.features.map((feature, index) => (
                      <div key={index} className="flex gap-2 mt-2">
                        <Input
                          value={feature}
                          onChange={(e) => updateFeature(index, e.target.value, false)}
                          placeholder="Feature description"
                          data-testid={`input-create-feature-${index}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFeature(index, false)}
                          disabled={newPlan.features.length === 1}
                          data-testid={`button-remove-feature-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addFeature(false)}
                      className="mt-2"
                      data-testid="button-add-feature"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Feature
                    </Button>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel-create"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreatePlan}
                    disabled={createPlanMutation.isPending || !newPlan.name || !newPlan.tier}
                    data-testid="button-save-create"
                  >
                    {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Plan Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Subscription Plan</DialogTitle>
                  <DialogDescription>
                    Update the subscription plan details.
                  </DialogDescription>
                </DialogHeader>
                
                {selectedPlan && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-name">Plan Name</Label>
                      <Input
                        id="edit-name"
                        value={selectedPlan.name}
                        onChange={(e) => setSelectedPlan({ ...selectedPlan, name: e.target.value })}
                        placeholder="e.g., Pro Plan"
                        data-testid="input-edit-name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-tier">Tier</Label>
                      <Select value={selectedPlan.tier} onValueChange={(value) => setSelectedPlan({ ...selectedPlan, tier: value })}>
                        <SelectTrigger data-testid="select-edit-tier">
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="elite">Elite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-monthly-price">Monthly Price ($)</Label>
                        <Input
                          id="edit-monthly-price"
                          type="number"
                          step="0.01"
                          value={selectedPlan.monthlyPrice}
                          onChange={(e) => setSelectedPlan({ ...selectedPlan, monthlyPrice: parseFloat(e.target.value) || 0 })}
                          data-testid="input-edit-monthly-price"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-yearly-price">Yearly Price ($)</Label>
                        <Input
                          id="edit-yearly-price"
                          type="number"
                          step="0.01"
                          value={selectedPlan.yearlyPrice || 0}
                          onChange={(e) => setSelectedPlan({ ...selectedPlan, yearlyPrice: parseFloat(e.target.value) || 0 })}
                          data-testid="input-edit-yearly-price"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-max-signals">Max Signals (-1 for unlimited)</Label>
                        <Input
                          id="edit-max-signals"
                          type="number"
                          value={selectedPlan.maxSignals ?? ''}
                          onChange={(e) => setSelectedPlan({ ...selectedPlan, maxSignals: parseInt(e.target.value) || 0 })}
                          data-testid="input-edit-max-signals"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-max-tickers">Max Tickers (-1 for unlimited)</Label>
                        <Input
                          id="edit-max-tickers"
                          type="number"
                          value={selectedPlan.maxTickers ?? ''}
                          onChange={(e) => setSelectedPlan({ ...selectedPlan, maxTickers: parseInt(e.target.value) || 0 })}
                          data-testid="input-edit-max-tickers"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Features</Label>
                      {selectedPlan.features.map((feature, index) => (
                        <div key={index} className="flex gap-2 mt-2">
                          <Input
                            value={feature}
                            onChange={(e) => updateFeature(index, e.target.value, true)}
                            placeholder="Feature description"
                            data-testid={`input-edit-feature-${index}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeFeature(index, true)}
                            disabled={selectedPlan.features.length === 1}
                            data-testid={`button-remove-edit-feature-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addFeature(true)}
                        className="mt-2"
                        data-testid="button-add-edit-feature"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Feature
                      </Button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit-active"
                        checked={selectedPlan.isActive}
                        onChange={(e) => setSelectedPlan({ ...selectedPlan, isActive: e.target.checked })}
                        data-testid="checkbox-edit-active"
                      />
                      <Label htmlFor="edit-active">Active Plan</Label>
                    </div>
                  </div>
                )}
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdatePlan}
                    disabled={updatePlanMutation.isPending || !selectedPlan?.name || !selectedPlan?.tier}
                    data-testid="button-save-edit"
                  >
                    {updatePlanMutation.isPending ? "Updating..." : "Update Plan"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Plan Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Subscription Plan</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete "{planToDelete?.name}"? This action cannot be undone.
                    {planToDelete && (
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-yellow-800 text-sm">
                          <strong>Warning:</strong> This will permanently remove the plan. Users currently subscribed to this plan may be affected.
                        </p>
                      </div>
                    )}
                  </DialogDescription>
                </DialogHeader>
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}
                    data-testid="button-cancel-delete"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeletePlan}
                    disabled={deletePlanMutation.isPending}
                    data-testid="button-confirm-delete"
                  >
                    {deletePlanMutation.isPending ? "Deleting..." : "Delete Plan"}
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