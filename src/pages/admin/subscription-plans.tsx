import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout/Sidebar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, DollarSign, CreditCard } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PlansResponse {
  plans: SubscriptionPlan[];
}

export default function SubscriptionPlans() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: "",
    description: "",
    price: 0,
    interval: "monthly",
    features: "",
    is_active: true,
  });

  // Fetch plans
  const { data: plansResponse, isLoading, error, refetch } = useQuery<PlansResponse>({
    queryKey: ["/api/admin/subscription-plans"],
    queryFn: async () => {
      const response = await apiRequest("/api/admin/subscription-plans");
      return response;
    },
  });

  const plans = plansResponse?.plans || [];

  // Create plan mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof newPlan) => {
      const payload = {
        ...data,
        features: data.features.split(",").map((f) => f.trim()).filter(Boolean),
      };
      return apiRequest("/api/admin/subscription-plans", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      setIsCreateDialogOpen(false);
      setNewPlan({
        name: "",
        description: "",
        price: 0,
        interval: "monthly",
        features: "",
        is_active: true,
      });
      toast({
        title: "Plan Created",
        description: "Subscription plan has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create plan",
        variant: "destructive",
      });
    },
  });

  // Update plan mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; price?: number; features?: string[] }) => {
      return apiRequest("/api/admin/subscription-plans", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      setIsEditDialogOpen(false);
      setEditingPlan(null);
      toast({
        title: "Plan Updated",
        description: "Subscription plan has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update plan",
        variant: "destructive",
      });
    },
  });

  // Delete plan mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("/api/admin/subscription-plans", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      toast({
        title: "Plan Deleted",
        description: "Subscription plan has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete plan",
        variant: "destructive",
      });
    },
  });

  const handleCreatePlan = () => {
    if (!newPlan.name || !newPlan.price) {
      toast({
        title: "Validation Error",
        description: "Name and price are required",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(newPlan);
  };

  const handleUpdatePlan = () => {
    if (!editingPlan) return;
    updateMutation.mutate({
      id: editingPlan.id,
      price: editingPlan.price,
      features: editingPlan.features,
    });
  };

  const handleDeletePlan = (plan: SubscriptionPlan) => {
    if (confirm(`Are you sure you want to delete the "${plan.name}" plan?`)) {
      deleteMutation.mutate(plan.id);
    }
  };

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64 p-6 overflow-y-auto flex items-center justify-center">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Failed to load subscription plans. Please try again.</p>
              <Button onClick={() => refetch()} className="mt-4">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Subscription Plans</h1>
              <p className="text-muted-foreground">
                Manage subscription tiers and pricing
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Plan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Subscription Plan</DialogTitle>
                  <DialogDescription>
                    Add a new subscription tier for users
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Plan Name</Label>
                    <Input
                      id="name"
                      value={newPlan.name}
                      onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                      placeholder="Premium"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newPlan.description}
                      onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                      placeholder="Full access to all features"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={newPlan.price}
                      onChange={(e) => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) })}
                      placeholder="29.99"
                    />
                  </div>
                  <div>
                    <Label htmlFor="interval">Billing Interval</Label>
                    <Select
                      value={newPlan.interval}
                      onValueChange={(value) => setNewPlan({ ...newPlan, interval: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="features">Features (comma-separated)</Label>
                    <Textarea
                      id="features"
                      value={newPlan.features}
                      onChange={(e) => setNewPlan({ ...newPlan, features: e.target.value })}
                      placeholder="unlimited_signals, advanced_analytics, priority_support"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newPlan.is_active}
                      onCheckedChange={(checked) =>
                        setNewPlan({ ...newPlan, is_active: checked })
                      }
                    />
                    <Label>Active Plan</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePlan} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Plan"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Subscription Plan</DialogTitle>
                  <DialogDescription>
                    Update plan pricing and features
                  </DialogDescription>
                </DialogHeader>
                {editingPlan && (
                  <div className="space-y-4">
                    <div>
                      <Label>Plan Name</Label>
                      <Input value={editingPlan.name} disabled className="bg-muted" />
                    </div>
                    <div>
                      <Label htmlFor="edit-price">Price</Label>
                      <Input
                        id="edit-price"
                        type="number"
                        step="0.01"
                        value={editingPlan.price}
                        onChange={(e) =>
                          setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-features">Features</Label>
                      <Textarea
                        id="edit-features"
                        value={editingPlan.features.join(", ")}
                        onChange={(e) =>
                          setEditingPlan({
                            ...editingPlan,
                            features: e.target.value.split(",").map((f) => f.trim()),
                          })
                        }
                      />
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdatePlan} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Updating..." : "Update Plan"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Plans Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{plans.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {plans.filter((p) => p.isActive).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Price</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${plans.length > 0 ? (plans.reduce((sum, p) => sum + p.price, 0) / plans.length).toFixed(2) : "0.00"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 space-y-4">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                <div className="text-muted-foreground">Loading plans...</div>
              </div>
            ) : plans.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No subscription plans configured
              </div>
            ) : (
              plans.map((plan) => (
                <Card key={plan.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{plan.name}</CardTitle>
                      {plan.isActive && <Badge>Active</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-3xl font-bold">${plan.price}</div>
                        <p className="text-sm text-muted-foreground">
                          per {plan.interval}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Features:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center">
                              <span className="mr-2">•</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setEditingPlan(plan);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-destructive"
                          onClick={() => handleDeletePlan(plan)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
