import React, { useState } from 'react';
import { AdminGuard } from '@/components/auth/SecurityGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Users, 
  Bell, 
  BarChart3, 
  Settings,
  Database,
  CreditCard,
  FileText,
  Menu,
  X,
  Crown,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  todaySignals: number;
  systemHealth: 'good' | 'warning' | 'critical';
}

export function ResponsiveAdminDashboard() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Mock admin stats - in real app, fetch from API
  const stats: AdminStats = {
    totalUsers: 1247,
    activeSubscriptions: 892,
    todaySignals: 23,
    systemHealth: 'good'
  };

  const adminModules = [
    { id: 'users', name: 'User Management', icon: Users, count: stats.totalUsers, path: '/admin/users' },
    { id: 'subscriptions', name: 'Subscriptions', icon: CreditCard, count: stats.activeSubscriptions, path: '/admin/subscriptions' },
    { id: 'signals', name: 'Signals', icon: TrendingUp, count: stats.todaySignals, path: '/admin/signals' },
    { id: 'alerts', name: 'Alerts', icon: Bell, count: 12, path: '/admin/alerts' },
    { id: 'analytics', name: 'Analytics', icon: BarChart3, count: null, path: '/admin/analytics' },
    { id: 'payments', name: 'Payments', icon: CreditCard, count: null, path: '/admin/payments' },
    { id: 'reports', name: 'Reports', icon: FileText, count: null, path: '/admin/reports' },
    { id: 'settings', name: 'Settings', icon: Settings, count: null, path: '/admin/settings' }
  ];

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'good': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'good': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <div className="block md:hidden bg-card border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <div className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-lg font-bold">Admin Panel</h1>
                  <p className="text-xs text-muted-foreground">System Management</p>
                </div>
              </div>
            </div>
            <Badge className={getHealthColor(stats.systemHealth)}>
              {getHealthIcon(stats.systemHealth)}
              <span className="ml-1 text-xs">{stats.systemHealth.toUpperCase()}</span>
            </Badge>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r p-4">
              <div className="space-y-2">
                {adminModules.map((module) => (
                  <Button
                    key={module.id}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      window.location.href = module.path;
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <module.icon className="mr-3 h-4 w-4" />
                    <span>{module.name}</span>
                    {module.count && (
                      <Badge variant="secondary" className="ml-auto">
                        {module.count}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="p-4 sm:p-6 md:p-8 max-w-[2000px] mx-auto">
          {/* Header Section */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Manage users, monitor system health, and oversee platform operations
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className={`${getHealthColor(stats.systemHealth)} px-3 py-1`}>
                  {getHealthIcon(stats.systemHealth)}
                  <span className="ml-2">System {stats.systemHealth.toUpperCase()}</span>
                </Badge>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid - Responsive */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-xl sm:text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                  </div>
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Subs</p>
                    <p className="text-xl sm:text-2xl font-bold">{stats.activeSubscriptions.toLocaleString()}</p>
                  </div>
                  <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Today Signals</p>
                    <p className="text-xl sm:text-2xl font-bold">{stats.todaySignals}</p>
                  </div>
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">System Status</p>
                    <p className="text-lg sm:text-xl font-bold capitalize">{stats.systemHealth}</p>
                  </div>
                  <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Modules Grid - Responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {adminModules.map((module) => (
              <Card 
                key={module.id} 
                className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
                onClick={() => window.location.href = module.path}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-2">
                      <module.icon className="h-5 w-5" />
                      <span className="text-sm sm:text-base">{module.name}</span>
                    </div>
                    {module.count && (
                      <Badge variant="secondary">
                        {module.count}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Manage {module.name.toLowerCase()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions - Responsive */}
          <div className="mt-6 sm:mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Shield className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-2">
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Add User</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-2">
                    <Bell className="h-4 w-4" />
                    <span className="text-xs">Send Alert</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-2">
                    <Database className="h-4 w-4" />
                    <span className="text-xs">Backup DB</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-xs">Generate Report</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}