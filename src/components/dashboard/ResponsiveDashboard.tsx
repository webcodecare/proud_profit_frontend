import React from 'react';
import { SecurityGuard } from '@/components/auth/SecurityGuard';
import { QuickStats } from './QuickStats';
import { RecentSignals } from './RecentSignals';
import { DashboardTabs } from './DashboardTabs';
import { TickerManager } from './TickerManager';
import { DashboardWidgets } from './DashboardWidgets';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  TrendingUp, 
  Bell, 
  BarChart3, 
  Settings,
  User,
  Crown,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function ResponsiveDashboard() {
  const { user } = useAuth();

  return (
    <SecurityGuard>
      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <div className="block md:hidden bg-card border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Proud Profits</h1>
                <p className="text-xs text-muted-foreground">Trading Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="p-4 sm:p-6 md:p-8 max-w-[2000px] mx-auto">
          {/* Welcome Section - Responsive */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Welcome back, {user?.firstName || 'Trader'}!
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Monitor your portfolio and trading signals in real-time
                </p>
              </div>
              
              {/* Subscription Status - Mobile Optimized */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                  {user?.role === 'admin' ? (
                    <>
                      <Crown className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Admin</span>
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">
                        {user?.subscriptionTier?.charAt(0).toUpperCase() + (user?.subscriptionTier?.slice(1) || 'Free')}
                      </span>
                    </>
                  )}
                </div>
                
                {/* Device Indicators */}
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Smartphone className="h-4 w-4 block sm:hidden" />
                  <Tablet className="h-4 w-4 hidden sm:block md:hidden" />
                  <Monitor className="h-4 w-4 hidden md:block" />
                  <span className="text-xs">
                    {typeof window !== 'undefined' && window.innerWidth < 640 ? 'Mobile' : 
                     typeof window !== 'undefined' && window.innerWidth < 1024 ? 'Tablet' : 'Desktop'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats - Responsive Grid */}
          <div className="mb-6 sm:mb-8">
            <QuickStats />
          </div>

          {/* Main Dashboard Grid - Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 md:gap-8">
            {/* Left Column - Full width on mobile, 8 cols on desktop */}
            <div className="lg:col-span-8 space-y-4 sm:space-y-6">
              {/* Dashboard Tabs */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <BarChart3 className="h-5 w-5" />
                    Market Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <DashboardTabs />
                </CardContent>
              </Card>

              {/* Dashboard Widgets - Mobile Optimized */}
              <Card className="block lg:hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <DashboardWidgets />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Full width on mobile, 4 cols on desktop */}
            <div className="lg:col-span-4 space-y-4 sm:space-y-6">
              {/* Recent Signals */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Bell className="h-5 w-5" />
                    Recent Signals
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <RecentSignals />
                </CardContent>
              </Card>

              {/* Ticker Manager */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <TrendingUp className="h-5 w-5" />
                    Watchlist
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <TickerManager />
                </CardContent>
              </Card>

              {/* Dashboard Widgets - Desktop Only */}
              <Card className="hidden lg:block">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="h-5 w-5" />
                    Dashboard Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <DashboardWidgets />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Subscription Upgrade Prompt - Only for free users */}
          {user?.subscriptionTier === 'free' && (
            <div className="mt-6 sm:mt-8">
              <Alert className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950">
                <Shield className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <strong>Unlock Premium Features</strong>
                      <p className="text-sm mt-1">
                        Get advanced analytics, SMS alerts, and priority support
                      </p>
                    </div>
                    <Button 
                      onClick={() => window.location.href = '/subscription-payment'}
                      className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto"
                    >
                      <Crown className="mr-2 h-4 w-4" />
                      Upgrade Now
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </div>
    </SecurityGuard>
  );
}