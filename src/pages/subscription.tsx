import { useState, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sidebar } from '@/components/layout/Sidebar';
import { SessionManager } from '@/lib/sessionManager';
import { useToast } from '@/hooks/use-toast';
import { 
  Star, 
  Activity,
  TrendingUp,
  Zap,
  BarChart3,
  Settings,
  LogOut,
  User,
  Home
} from 'lucide-react';

function LoadingSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-6 sm:h-8 w-48 sm:w-64" />
              <Skeleton className="h-3 sm:h-4 w-64 sm:w-96" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2">
                <Skeleton className="h-48 sm:h-64 w-full" />
              </div>
              <div className="space-y-3 sm:space-y-4">
                <Skeleton className="h-24 sm:h-32 w-full" />
                <Skeleton className="h-36 sm:h-48 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  const { user, isLoading } = useAuth();
  const [selectedTicker, setSelectedTicker] = useState<string>('BTCUSDT');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleTickerSelect = (symbol: string) => {
    setSelectedTicker(symbol);
  };

  const handleLogout = () => {
    try {
      SessionManager.clearSession();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      setLocation('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "There was an issue logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="text-center">
                    <p className="text-sm sm:text-base text-muted-foreground">Please log in to manage your subscriptions.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has paid subscription
  const hasActivePaidSubscription = user && 
    user.subscriptionTier !== "free" && 
    user.subscriptionStatus === "active";
  
  // Admin users bypass subscription checks
  const isAdminUser = user?.role === "admin";
  
  // Show sidebar only for paid subscribers or admins
  const showSidebar = isAdminUser || hasActivePaidSubscription;

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <div className="flex h-screen bg-background">
        {showSidebar && <Sidebar />}
        <div className={`flex-1 flex flex-col overflow-hidden ${showSidebar ? 'ml-0 lg:ml-64' : ''}`}>
          {/* Top Header with Logout */}
          <header className="bg-card border-b border-border px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation('/dashboard')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </div>
              
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                  <Star className="h-3 w-3" />
                  {user?.subscriptionTier || 'Free'} Plan
                </Badge>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={''} alt={user?.email} />
                        <AvatarFallback>
                          {user?.email?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        {user?.email && (
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setLocation('/dashboard')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation('/upgrade')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Upgrade</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Subscription Center</h1>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Manage your cryptocurrency subscriptions and monitor real-time charts
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs sm:text-sm">
                    <Activity className="h-3 w-3" />
                    Active User
                  </Badge>
                </div>
              </div>

      <Separator />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Subscription Management - Takes up 2 columns on large screens */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Subscription Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Plan Display */}
              <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg">Current Plan</h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {user?.subscriptionTier || 'Free'} Subscription
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize self-start sm:self-center text-xs sm:text-sm">
                    {user?.subscriptionTier || 'Free'}
                  </Badge>
                </div>
              </div>

              {/* Plan Features */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm sm:text-base">Your Plan Includes:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {user?.subscriptionTier === 'free' && (
                    <>
                      <div className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        Basic trading signals
                      </div>
                      <div className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        Up to 3 tickers
                      </div>
                      <div className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        Email alerts
                      </div>
                    </>
                  )}
                  {user?.subscriptionTier === 'basic' && (
                    <>
                      <div className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        Real-time trading signals
                      </div>
                      <div className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        Up to 10 tickers
                      </div>
                      <div className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        Email & SMS alerts
                      </div>
                      <div className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        Trading playground
                      </div>
                    </>
                  )}
                  {(user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'pro') && (
                    <>
                      <div className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        Advanced analytics
                      </div>
                      <div className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        Unlimited tickers
                      </div>
                      <div className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        All alert types
                      </div>
                      <div className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        Cycle forecasting
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Upgrade Section */}
              <div className="pt-3 sm:pt-4 border-t">
                <div className="text-center">
                  <h4 className="font-medium mb-2 text-sm sm:text-base">Want More Features?</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 px-2">
                    Upgrade your plan to unlock advanced trading tools and analytics
                  </p>
                  <Button 
                    onClick={() => {
                      setIsUpgrading(true);
                      setLocation('/upgrade');
                    }}
                    className="w-full text-sm sm:text-base"
                    size="sm"
                    disabled={isUpgrading}
                  >
                    {isUpgrading ? (
                      <div className="flex items-center">
                        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                        Loading...
                      </div>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Upgrade Plan
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Chart - Takes up 1 column on XL screens */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Ticker:</span>
                <Badge variant="default">{selectedTicker}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan Type:</span>
                <span className="text-sm font-medium">{user?.subscriptionTier || 'Free'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Live Data
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Features Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Available Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Real-time Price Updates</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Trading Signal Alerts</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Interactive Charts</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Multiple Timeframes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span>SMS Notifications</span>
                  <Badge variant="outline" className="text-xs">Pro</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span>Advanced Analytics</span>
                  <Badge variant="outline" className="text-xs">Pro</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

              {/* Help Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Getting Started</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-medium">1. Subscribe to Tickers</h4>
                      <p className="text-muted-foreground">
                        Use the search box to find and subscribe to your favorite cryptocurrencies.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">2. Monitor Charts</h4>
                      <p className="text-muted-foreground">
                        Click on any subscribed ticker to view its interactive chart with real-time data.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">3. Receive Alerts</h4>
                      <p className="text-muted-foreground">
                        Get notified instantly when trading signals are generated for your subscribed tickers.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}