import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import LiveMarketData from '@/components/LiveMarketData/LiveMarketData';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign, 
  BarChart3, 
  Bell,
  Zap,
  Target,
  PieChart,
  LineChart,
  RefreshCw
} from 'lucide-react';

interface MarketPrice {
  symbol: string;
  price: string;
  change24h: string;
  volume24h: string;
  lastUpdated: string;
}

interface Signal {
  id: string;
  ticker: string;
  signalType: 'buy' | 'sell';
  price: string;
  timeframe: string;
  timestamp: string;
  source: string;
  note?: string;
}

interface BitcoinAnalytics {
  rainbowChart: any;
  cycleData: any;
  forecastData: any;
  heatmapData: any;
}

interface Notification {
  id: string;
  type: 'signal' | 'price' | 'news' | 'system' | 'achievement';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export default function ComprehensiveDashboard() {
  const { user } = useAuth();
  const [selectedTicker, setSelectedTicker] = useState('BTCUSDT');
  const [activeTab, setActiveTab] = useState('overview');

  // Market Data APIs
  const { data: marketPrices = [], isLoading: pricesLoading } = useQuery<MarketPrice[]>({
    queryKey: ['/api/market/prices'],
    refetchInterval: 5000,
  });

  const { data: currentPrice, isLoading: currentPriceLoading } = useQuery<MarketPrice>({
    queryKey: ['/api/market/price', selectedTicker],
    refetchInterval: 2000,
  });

  // Signal APIs
  const { data: signals = [], isLoading: signalsLoading } = useQuery<Signal[]>({
    queryKey: ['/api/signals'],
    refetchInterval: 10000,
  });

  const { data: tickerSignals = [], isLoading: tickerSignalsLoading } = useQuery<Signal[]>({
    queryKey: ['/api/signals', selectedTicker],
    refetchInterval: 10000,
  });

  // Chart APIs
  const { data: heatmapData, isLoading: heatmapLoading } = useQuery({
    queryKey: ['/api/chart/heatmap/BTC'],
    refetchInterval: 30000,
  });

  const { data: cycleData, isLoading: cycleLoading } = useQuery({
    queryKey: ['/api/chart/cycle/BTC'],
    refetchInterval: 30000,
  });

  const { data: forecastData, isLoading: forecastLoading } = useQuery({
    queryKey: ['/api/chart/forecast/BTC'],
    refetchInterval: 30000,
  });

  // Analytics APIs
  const { data: bitcoinAnalytics, isLoading: analyticsLoading } = useQuery<BitcoinAnalytics>({
    queryKey: ['/api/analytics/bitcoin'],
    refetchInterval: 60000,
  });

  // Notification APIs
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000,
  });

  const { data: tickers = [] } = useQuery({
    queryKey: ['/api/tickers'],
    refetchInterval: 60000,
  });

  const unreadNotifications = notifications.filter(n => !n.isRead).length;
  const latestSignals = signals.slice(0, 5);
  const criticalNotifications = notifications.filter(n => n.priority === 'critical').slice(0, 3);

  const formatPrice = (price: string | number) => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(num);
  };

  const formatChange = (change: string | number) => {
    const num = typeof change === 'string' ? parseFloat(change) : change;
    const formatted = num.toFixed(2);
    return {
      value: formatted,
      isPositive: num >= 0,
      className: num >= 0 ? 'text-green-500' : 'text-red-500'
    };
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <CardContent>
            <p className="text-muted-foreground">Please log in to access the dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trading Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive view of market data, signals, and analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Bell className="h-3 w-3" />
            {unreadNotifications} alerts
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            {latestSignals.length} signals
          </Badge>
        </div>
      </div>

      <Separator />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">BTC Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentPriceLoading ? '...' : formatPrice(currentPrice?.price || '0')}
            </div>
            {currentPrice && (
              <p className={`text-xs ${formatChange(currentPrice.change24h).className}`}>
                {formatChange(currentPrice.change24h).isPositive ? '+' : ''}
                {formatChange(currentPrice.change24h).value}% (24h)
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Signals</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{signals.length}</div>
            <p className="text-xs text-muted-foreground">
              {signals.filter(s => s.signalType === 'buy').length} buy, {signals.filter(s => s.signalType === 'sell').length} sell
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2.1T</div>
            <p className="text-xs text-green-500">+3.2% (24h)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fear & Greed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">65</div>
            <p className="text-xs text-yellow-500">Greed</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="signals">Signals</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="notifications">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Latest Signals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Latest Signals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {signalsLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  </div>
                ) : latestSignals.length > 0 ? (
                  <div className="space-y-3">
                    {latestSignals.map((signal) => (
                      <div key={signal.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          {signal.signalType === 'buy' ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <div>
                            <p className="font-medium">{signal.ticker}</p>
                            <p className="text-sm text-muted-foreground">{signal.timeframe}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatPrice(signal.price)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(signal.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground p-4">No signals available</p>
                )}
              </CardContent>
            </Card>

            {/* Critical Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Critical Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notificationsLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  </div>
                ) : criticalNotifications.length > 0 ? (
                  <div className="space-y-3">
                    {criticalNotifications.map((notification) => (
                      <div key={notification.id} className="p-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                        <p className="font-medium text-red-900 dark:text-red-100">{notification.title}</p>
                        <p className="text-sm text-red-700 dark:text-red-300">{notification.message}</p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground p-4">No critical alerts</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Market Movers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Top Market Movers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pricesLoading ? (
                <div className="flex items-center justify-center p-4">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                </div>
              ) : marketPrices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {marketPrices.slice(0, 6).map((price) => (
                    <div key={price.symbol} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{price.symbol}</p>
                          <p className="text-sm text-muted-foreground">{formatPrice(price.price)}</p>
                        </div>
                        <div className={`text-right ${formatChange(price.change24h).className}`}>
                          <p className="font-medium">
                            {formatChange(price.change24h).isPositive ? '+' : ''}
                            {formatChange(price.change24h).value}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground p-4">No market data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Trading Signals</CardTitle>
            </CardHeader>
            <CardContent>
              {signalsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : signals.length > 0 ? (
                <div className="space-y-2">
                  {signals.map((signal) => (
                    <div key={signal.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-4">
                        {signal.signalType === 'buy' ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{signal.ticker}</p>
                          <p className="text-sm text-muted-foreground">
                            {signal.source} • {signal.timeframe}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(signal.price)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(signal.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={signal.signalType === 'buy' ? 'default' : 'destructive'}>
                        {signal.signalType.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground p-8">No signals available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bitcoin Heatmap Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {heatmapLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <LineChart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Heatmap data loaded successfully</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cycle Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {cycleLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <PieChart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Cycle data loaded successfully</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Bitcoin Analytics Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : bitcoinAnalytics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg border">
                    <BarChart3 className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                    <p className="text-sm font-medium">Rainbow Chart</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div className="text-center p-4 rounded-lg border">
                    <LineChart className="h-8 w-8 mx-auto text-green-500 mb-2" />
                    <p className="text-sm font-medium">Cycle Data</p>
                    <p className="text-xs text-muted-foreground">Updated</p>
                  </div>
                  <div className="text-center p-4 rounded-lg border">
                    <TrendingUp className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                    <p className="text-sm font-medium">Forecast</p>
                    <p className="text-xs text-muted-foreground">Generated</p>
                  </div>
                  <div className="text-center p-4 rounded-lg border">
                    <Target className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                    <p className="text-sm font-medium">Heatmap</p>
                    <p className="text-xs text-muted-foreground">Available</p>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground p-8">No analytics data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market" className="space-y-6">
          {/* Enhanced Live Market Data Widgets */}
          <LiveMarketData />
          
          {/* Additional Market Data List */}
          <Card>
            <CardHeader>
              <CardTitle>Market Data Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {pricesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : marketPrices.length > 0 ? (
                <div className="space-y-2">
                  {marketPrices.map((price) => (
                    <div key={price.symbol} className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                      <div>
                        <p className="font-medium">{price.symbol}</p>
                        <p className="text-sm text-muted-foreground">Vol: {price.volume24h}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(price.price)}</p>
                        <p className={`text-sm ${formatChange(price.change24h).className}`}>
                          {formatChange(price.change24h).isPositive ? '+' : ''}
                          {formatChange(price.change24h).value}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground p-8">No market data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              {notificationsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : notifications.length > 0 ? (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div key={notification.id} className={`p-4 rounded-lg border ${!notification.isRead ? 'bg-accent/20' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{notification.title}</p>
                            <Badge variant={
                              notification.priority === 'critical' ? 'destructive' :
                              notification.priority === 'high' ? 'secondary' :
                              'outline'
                            }>
                              {notification.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground p-8">No notifications available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}