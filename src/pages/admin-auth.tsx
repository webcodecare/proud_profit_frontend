import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllUsers } from "@/lib/supabase";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Shield, Users, Crown, UserPlus } from "lucide-react";

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'elite' | 'user';
  subscription_tier: 'free' | 'basic' | 'premium' | 'pro' | 'elite';
  subscription_status?: string;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

export default function AdminAuthPage() {
  const { isAuthenticated, isAdmin, createAdminUser, createEliteUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form states
  const [adminForm, setAdminForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  
  const [eliteForm, setEliteForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  // Fetch users query using secure server endpoint
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: getAllUsers,
    enabled: isAuthenticated && isAdmin(),
  });

  // Create admin user mutation
  const createAdminMutation = useMutation({
    mutationFn: async () => {
      await createAdminUser(
        adminForm.email,
        adminForm.password,
        adminForm.firstName,
        adminForm.lastName
      );
    },
    onSuccess: () => {
      setAdminForm({ email: "", password: "", firstName: "", lastName: "" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
  });

  // Create elite user mutation
  const createEliteMutation = useMutation({
    mutationFn: async () => {
      await createEliteUser(
        eliteForm.email,
        eliteForm.password,
        eliteForm.firstName,
        eliteForm.lastName
      );
    },
    onSuccess: () => {
      setEliteForm({ email: "", password: "", firstName: "", lastName: "" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
  });

  // Update user role mutation using secure server endpoint
  const { updateUserRole } = useAuth();
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'elite' | 'user' }) => {
      await updateUserRole(userId, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
  });

  // Update subscription mutation using secure server endpoint
  const { updateUserSubscription } = useAuth();
  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ userId, tier }: { userId: string; tier: 'free' | 'basic' | 'premium' | 'pro' | 'elite' }) => {
      await updateUserSubscription(userId, tier);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please sign in to continue</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Access Required
            </CardTitle>
            <CardDescription>
              You need admin privileges to access this page
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'elite':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'elite':
        return 'default';
      case 'pro':
        return 'secondary';
      case 'premium':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl" data-testid="admin-auth-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Admin Dashboard - User Management
        </h1>
        <p className="text-muted-foreground">
          Manage users, roles, and subscriptions dynamically with Supabase
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Users
          </TabsTrigger>
          <TabsTrigger value="create-admin" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Create Admin
          </TabsTrigger>
          <TabsTrigger value="create-elite" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Create Elite
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management ({users.length})
              </CardTitle>
              <CardDescription>
                View and manage all registered users, their roles, and subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Subscription</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                          <TableCell>
                            <div className="font-medium">
                              {user.first_name || user.last_name 
                                ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                                : 'No name'
                              }
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {user.role.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getTierBadgeVariant(user.subscription_tier)}>
                              {user.subscription_tier.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.is_active ? 'default' : 'secondary'}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Select
                                value={user.role}
                                onValueChange={(role: 'admin' | 'elite' | 'user') =>
                                  updateRoleMutation.mutate({ userId: user.id, role })
                                }
                                data-testid={`role-select-${user.id}`}
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="elite">Elite</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              <Select
                                value={user.subscription_tier}
                                onValueChange={(tier: 'free' | 'basic' | 'premium' | 'pro' | 'elite') =>
                                  updateSubscriptionMutation.mutate({ userId: user.id, tier })
                                }
                                data-testid={`subscription-select-${user.id}`}
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue />
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
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create-admin">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Create Admin User
              </CardTitle>
              <CardDescription>
                Create a new administrator with full system access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-firstName">First Name</Label>
                  <Input
                    id="admin-firstName"
                    value={adminForm.firstName}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter first name"
                    data-testid="admin-first-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-lastName">Last Name</Label>
                  <Input
                    id="admin-lastName"
                    value={adminForm.lastName}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter last name"
                    data-testid="admin-last-name-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email Address</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="admin@example.com"
                  data-testid="admin-email-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter secure password"
                  data-testid="admin-password-input"
                />
              </div>
              <Button
                onClick={() => createAdminMutation.mutate()}
                disabled={!adminForm.email || !adminForm.password || createAdminMutation.isPending}
                className="w-full"
                data-testid="create-admin-button"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {createAdminMutation.isPending ? 'Creating...' : 'Create Admin User'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create-elite">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Create Elite User
              </CardTitle>
              <CardDescription>
                Create a new elite user with premium access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="elite-firstName">First Name</Label>
                  <Input
                    id="elite-firstName"
                    value={eliteForm.firstName}
                    onChange={(e) => setEliteForm(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter first name"
                    data-testid="elite-first-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="elite-lastName">Last Name</Label>
                  <Input
                    id="elite-lastName"
                    value={eliteForm.lastName}
                    onChange={(e) => setEliteForm(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter last name"
                    data-testid="elite-last-name-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="elite-email">Email Address</Label>
                <Input
                  id="elite-email"
                  type="email"
                  value={eliteForm.email}
                  onChange={(e) => setEliteForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="elite@example.com"
                  data-testid="elite-email-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="elite-password">Password</Label>
                <Input
                  id="elite-password"
                  type="password"
                  value={eliteForm.password}
                  onChange={(e) => setEliteForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter secure password"
                  data-testid="elite-password-input"
                />
              </div>
              <Button
                onClick={() => createEliteMutation.mutate()}
                disabled={!eliteForm.email || !eliteForm.password || createEliteMutation.isPending}
                className="w-full"
                data-testid="create-elite-button"
              >
                <Crown className="h-4 w-4 mr-2" />
                {createEliteMutation.isPending ? 'Creating...' : 'Create Elite User'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}