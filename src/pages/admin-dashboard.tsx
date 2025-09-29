import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Users, 
  Crown, 
  Plus, 
  LogOut, 
  UserPlus,
  Settings,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  subscriptionTier?: string;
  subscriptionStatus?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface Plan {
  id: string;
  name: string;
  tier: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  features: string[];
  maxSignals: number;
  maxTickers: number;
  isActive: boolean;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);

  // Check authentication and get admin data
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    const adminUserData = localStorage.getItem('adminUser');
    
    if (!adminToken || !adminUserData) {
      setLocation('/admin-login');
      return;
    }

    setAdminUser(JSON.parse(adminUserData));
    fetchData();
  }, [setLocation]);

  const fetchData = async () => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) return;

    try {
      // Fetch users and plans
      const [usersResponse, plansResponse] = await Promise.all([
        fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${adminToken}` }
        }),
        fetch('/api/admin/plans', {
          headers: { Authorization: `Bearer ${adminToken}` }
        })
      ]);

      const [usersResult, plansResult] = await Promise.all([
        usersResponse.json(),
        plansResponse.json()
      ]);

      if (usersResult.success) {
        setUsers(usersResult.data.users);
      }

      if (plansResult.success) {
        setPlans(plansResult.data.plans);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully',
    });
    setLocation('/admin-login');
  };

  const createElitePlan = async () => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) return;

    setIsCreatingPlan(true);
    try {
      const response = await fetch('/api/admin/plans/elite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        }
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Elite plan created successfully',
        });
        fetchData(); // Refresh data
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create elite plan',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingPlan(false);
    }
  };

  const createEliteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) return;

    setIsCreatingUser(true);
    try {
      const response = await fetch('/api/admin/users/create-elite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(newUserForm)
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Elite user created successfully',
        });
        setNewUserForm({ email: '', password: '', firstName: '', lastName: '' });
        fetchData(); // Refresh data
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create elite user',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'elite': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold" data-testid="title-admin-dashboard">Admin Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground" data-testid="text-welcome">
              Welcome, {adminUser?.firstName || adminUser?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'plans', label: 'Plans', icon: Crown },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Total Users</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="stat-total-users">{users.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Crown className="w-5 h-5" />
                  <span>Elite Users</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="stat-elite-users">
                  {users.filter(u => u.role === 'elite').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Active Plans</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="stat-active-plans">{plans.length}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Create Elite User Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserPlus className="w-5 h-5" />
                  <span>Create Elite User</span>
                </CardTitle>
                <CardDescription>
                  Create a new user with elite subscription plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createEliteUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                      required
                      data-testid="input-new-user-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                      required
                      data-testid="input-new-user-password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newUserForm.firstName}
                      onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
                      data-testid="input-new-user-first-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newUserForm.lastName}
                      onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
                      data-testid="input-new-user-last-name"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" disabled={isCreatingUser} data-testid="button-create-elite-user">
                      {isCreatingUser ? 'Creating...' : 'Create Elite User'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Users List */}
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Manage system users and their subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`user-${user.id}`}>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}</span>
                          <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                          {user.subscriptionTier && (
                            <Badge variant={getStatusBadgeVariant(user.subscriptionStatus)}>{user.subscriptionTier}</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {user.email} • Created: {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No users found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'plans' && (
          <div className="space-y-6">
            {/* Create Elite Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Crown className="w-5 h-5" />
                  <span>Create Elite Plan</span>
                </CardTitle>
                <CardDescription>
                  Create the elite subscription plan with premium features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={createElitePlan} 
                  disabled={isCreatingPlan || plans.some(p => p.tier === 'elite')}
                  data-testid="button-create-elite-plan"
                >
                  {isCreatingPlan ? 'Creating...' : 'Create Elite Plan'}
                </Button>
                {plans.some(p => p.tier === 'elite') && (
                  <p className="text-sm text-muted-foreground mt-2">Elite plan already exists</p>
                )}
              </CardContent>
            </Card>

            {/* Plans List */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Plans</CardTitle>
                <CardDescription>Manage available subscription plans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plans.map((plan) => (
                    <div key={plan.id} className="border rounded-lg p-4" data-testid={`plan-${plan.tier}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{plan.name}</h3>
                        <Badge variant={plan.tier === 'elite' ? 'default' : 'secondary'}>
                          {plan.tier}
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold mb-2">
                        ${(plan.monthlyPrice / 100).toFixed(2)}/month
                      </div>
                      <div className="space-y-1 text-sm">
                        {plan.features.map((feature, index) => (
                          <div key={index}>• {feature}</div>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Signals: {plan.maxSignals === -1 ? 'Unlimited' : plan.maxSignals} | 
                        Tickers: {plan.maxTickers === -1 ? 'Unlimited' : plan.maxTickers}
                      </div>
                    </div>
                  ))}
                  {plans.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground col-span-full">
                      No plans found. Create an elite plan to get started.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}