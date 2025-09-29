import React, { useState, useEffect, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import SubscriptionGuard from "@/components/auth/SubscriptionGuard";

// Lazy load existing charts
const HeatmapChart = lazy(() => import("@/components/charts/HeatmapChart"));
const CycleChart = lazy(() => import("@/components/charts/CycleChart"));
const AdvancedForecastChart = lazy(() => import("@/components/charts/AdvancedForecastChart"));
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Bell,
  BarChart3,
  LineChart,
  PieChart,
  Target,
  Clock,
  Settings,
  Plus,
  Database,
  Edit
} from "lucide-react";

interface AlertSignal {
  id: string;
  ticker: string;
  signalType: "buy" | "sell";
  price: string;
  timestamp: string;
  source: string;
  note?: string;
}

export default function MultiTickerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [recentSignals, setRecentSignals] = useState<AlertSignal[]>([]);
  const [selectedTickers, setSelectedTickers] = useState<string[]>(["BTCUSDT", "ETHUSDT"]);
  const [selectedChart, setSelectedChart] = useState<string>("BTCUSDT");
  
  // Admin state
  const [newSignal, setNewSignal] = useState({
    ticker: '',
    signalType: 'buy' as 'buy' | 'sell',
    price: '',
    timeframe: '4H',
    source: 'Manual',
    note: ''
  });
  
  const isAdmin = user?.role === 'admin';

  // Handle ticker selection
  const handleTickerToggle = (symbol: string) => {
    setSelectedTickers(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  // Fetch public signals (no user-specific data)
  const { data: publicSignals, isLoading: isLoadingSignals } = useQuery({
    queryKey: ["/api/public/signals/alerts"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // WebSocket for real-time updates (placeholder for now)
  // const { isConnected } = useWebSocket();

  // Update signals from public API
  useEffect(() => {
    if (publicSignals && Array.isArray(publicSignals)) {
      setRecentSignals(publicSignals);
    }
  }, [publicSignals]);

  // Admin mutations
  const createSignalMutation = useMutation({
    mutationFn: async (signalData: any) => {
      return apiRequest('/api/admin/signals', {
        method: 'POST',
        body: JSON.stringify(signalData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Signal created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/public/signals/alerts'] });
      setNewSignal({
        ticker: '',
        signalType: 'buy',
        price: '',
        timeframe: '4H',
        source: 'Manual',
        note: ''
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create signal",
        variant: "destructive",
      });
    },
  });

  const handleCreateSignal = () => {
    if (!newSignal.ticker || !newSignal.price) {
      toast({
        title: "Error",
        description: "Ticker and price are required",
        variant: "destructive",
      });
      return;
    }
    
    createSignalMutation.mutate({
      ...newSignal,
      price: parseFloat(newSignal.price).toString(),
    });
  };

  // Update signals when userSignals change
  useEffect(() => {
    // For now, populate with mock signals for demo
    // Real signals will come from API
  }, []);

  const quickStats = [
    {
      title: "Live Tickers",
      value: selectedTickers.length.toString(),
      icon: BarChart3,
      color: "text-[var(--steel-blue)]",
    },
    {
      title: "Last Signal",
      value: "2h ago",
      icon: Clock,
      color: "text-foreground",
    },
    {
      title: "Market Status",
      value: "LIVE",
      icon: Activity,
      color: "text-[var(--chart-prime-orange)]",
    },
    {
      title: "Signal Sources",
      value: "TradingView",
      icon: Bell,
      color: "text-foreground",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        
        {/* Main Content */}
        <div className="ml-0 lg:ml-64 flex-1">
          {/* Top Bar */}
          <header className="bg-card border-b border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Multi-Ticker Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  Tracking {selectedTickers.length} cryptocurrencies with live TradingView signals
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="px-3 py-1">
                  <Activity className="mr-2 h-4 w-4" />
                  Live Data
                </Badge>
                <Button variant="outline">
                  <Bell className="mr-2 h-4 w-4" />
                  Alerts ({recentSignals.length})
                </Button>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="p-6 space-y-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'}`}>
                <TabsTrigger value="overview" className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Overview</span>
                </TabsTrigger>
                <TabsTrigger value="charts" className="flex items-center space-x-2">
                  <LineChart className="h-4 w-4" />
                  <span>Charts</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center space-x-2">
                  <PieChart className="h-4 w-4" />
                  <span>Analytics</span>
                </TabsTrigger>
                {isAdmin ? (
                  <TabsTrigger value="admin" className="flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Admin</span>
                  </TabsTrigger>
                ) : (
                  <TabsTrigger value="categories" className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Categories</span>
                  </TabsTrigger>
                )}
                <TabsTrigger value="signals" className="flex items-center space-x-2">
                  <Bell className="h-4 w-4" />
                  <span>Signals</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {quickStats.map((stat, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              {stat.title}
                            </p>
                            <p className={`text-2xl font-bold ${stat.color}`}>
                              {stat.value}
                            </p>
                          </div>
                          <stat.icon className={`h-8 w-8 ${stat.color}`} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Ticker Selector */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Cryptocurrency Watchlist</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {["BTCUSDT", "ETHUSDT", "ADAUSDT", "BNBUSDT", "DOTUSDT", "SOLUSDT"].map((ticker) => (
                        <Button
                          key={ticker}
                          variant={selectedTickers.includes(ticker) ? "default" : "outline"}
                          onClick={() => handleTickerToggle(ticker)}
                          className="justify-start"
                        >
                          {ticker.replace("USDT", "")}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Signals Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Signals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {isLoadingSignals ? (
                        <div className="space-y-2">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                          ))}
                        </div>
                      ) : recentSignals.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No signals yet. Your trading signals will appear here.
                        </p>
                      ) : (
                        recentSignals.slice(0, 5).map((signal) => (
                          <div key={signal.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Badge variant={signal.signalType === "buy" ? "default" : "destructive"}>
                                {signal.signalType.toUpperCase()}
                              </Badge>
                              <div>
                                <p className="font-medium">{signal.ticker}</p>
                                <p className="text-sm text-muted-foreground">
                                  ${signal.price} • {new Date(signal.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">{signal.source}</p>
                              {signal.note && (
                                <p className="text-xs text-muted-foreground">{signal.note}</p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="categories" className="space-y-6">
                {/* Enhanced Multi-Ticker Category Management */}
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Cryptocurrency Categories</h2>
                    <p className="text-muted-foreground">
                      Explore beyond Bitcoin with 25+ cryptocurrencies organized by category
                    </p>
                  </div>

                  {/* Available Tickers Query */}
                  {(() => {
                    const { data: availableTickers = [], isLoading: isLoadingTickers } = useQuery({
                      queryKey: ["/api/tickers/enabled"],
                    });

                    if (isLoadingTickers) {
                      return (
                        <div className="flex items-center justify-center h-64">
                          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Major Cryptos</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {["BTCUSDT", "ETHUSDT", "BNBUSDT"].map((ticker) => (
                              <Button
                                key={ticker}
                                variant={selectedTickers.includes(ticker) ? "default" : "outline"}
                                onClick={() => handleTickerToggle(ticker)}
                                className="w-full justify-start"
                              >
                                {ticker.replace("USDT", "")}
                              </Button>
                            ))}
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader>
                            <CardTitle>DeFi Tokens</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {["ADAUSDT", "DOTUSDT", "LINKUSDT"].map((ticker) => (
                              <Button
                                key={ticker}
                                variant={selectedTickers.includes(ticker) ? "default" : "outline"}
                                onClick={() => handleTickerToggle(ticker)}
                                className="w-full justify-start"
                              >
                                {ticker.replace("USDT", "")}
                              </Button>
                            ))}
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader>
                            <CardTitle>Layer 1</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {["SOLUSDT", "AVAXUSDT", "MATICUSDT"].map((ticker) => (
                              <Button
                                key={ticker}
                                variant={selectedTickers.includes(ticker) ? "default" : "outline"}
                                onClick={() => handleTickerToggle(ticker)}
                                className="w-full justify-start"
                              >
                                {ticker.replace("USDT", "")}
                              </Button>
                            ))}
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })()}

                  {/* Current Selection Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Current Watchlist ({selectedTickers.length}/10)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {selectedTickers.map((ticker) => (
                            <Badge 
                              key={ticker} 
                              variant="default" 
                              className="flex items-center gap-2 px-3 py-1"
                            >
                              <span>{ticker.replace('USDT', '')}</span>
                              <button
                                onClick={() => handleTickerToggle(ticker)}
                                className="hover:bg-white/20 rounded-full p-0.5"
                              >
                                ✕
                              </button>
                            </Badge>
                          ))}
                        </div>
                        
                        {selectedTickers.length === 0 && (
                          <p className="text-muted-foreground text-center py-8">
                            Select cryptocurrencies from the categories above to start tracking
                          </p>
                        )}
                        
                        {selectedTickers.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                            {/* Mock market data display for selected tickers */}
                            {selectedTickers.slice(0, 6).map((ticker, index) => (
                              <Card key={ticker} className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-bold">{ticker.replace('USDT', '')}</span>
                                  <Badge variant={index % 2 === 0 ? "default" : "destructive"}>
                                    {index % 2 === 0 ? '+' : '-'}{(Math.random() * 10).toFixed(2)}%
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  ${(Math.random() * 100000).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Vol: ${(Math.random() * 1000000000).toLocaleString(undefined, {notation: 'compact'})}
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="charts" className="space-y-6">
                {/* Chart Selector */}
                <Card>
                  <CardHeader>
                    <CardTitle>Select Chart to Display</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedTickers.map((ticker) => (
                        <Button
                          key={ticker}
                          variant={selectedChart === ticker ? "default" : "outline"}
                          onClick={() => setSelectedChart(ticker)}
                        >
                          {ticker.replace('USDT', '')}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Live Market Data Chart */}
                {selectedChart && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Live Market Data - {selectedChart.replace('USDT', '')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(() => {
                          const { data: priceData, isLoading: priceLoading } = useQuery({
                            queryKey: [`/api/public/market/price/${selectedChart}`],
                            refetchInterval: 10000, // Refresh every 10 seconds
                          });

                          if (priceLoading) {
                            return (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[...Array(4)].map((_, i) => (
                                  <div key={i} className="text-center p-4 border rounded">
                                    <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                  </div>
                                ))}
                              </div>
                            );
                          }

                          return (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-4 border rounded">
                                <div className="text-2xl font-bold text-[var(--steel-blue)]">
                                  ${priceData?.price?.toLocaleString(undefined, {minimumFractionDigits: 2}) || 'N/A'}
                                </div>
                                <div className="text-sm text-muted-foreground">Current Price</div>
                              </div>
                              <div className="text-center p-4 border rounded">
                                <div className={`text-2xl font-bold ${
                                  (priceData?.priceChangePercent || 0) >= 0 
                                    ? 'text-green-600' 
                                    : 'text-red-600'
                                }`}>
                                  {priceData?.priceChangePercent?.toFixed(2) || '0.00'}%
                                </div>
                                <div className="text-sm text-muted-foreground">24h Change</div>
                              </div>
                              <div className="text-center p-4 border rounded">
                                <div className="text-2xl font-bold">
                                  ${priceData?.volume?.toLocaleString(undefined, {notation: 'compact'}) || 'N/A'}
                                </div>
                                <div className="text-sm text-muted-foreground">24h Volume</div>
                              </div>
                              <div className="text-center p-4 border rounded">
                                <div className="text-2xl font-bold">
                                  ${((priceData?.price || 0) * (priceData?.volume || 0) / 1000000).toLocaleString(undefined, {notation: 'compact'})}M
                                </div>
                                <div className="text-sm text-muted-foreground">Market Cap (Est)</div>
                              </div>
                            </div>
                          );
                        })()}
                        <div className="text-sm text-muted-foreground text-center">
                          Raw trading signals from TradingView will appear here across all timeframes (30min, 1hour, 4hour, 8hour, 12hour, day, week, month)
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="space-y-6">
                  {/* Advanced Cycle Forecasting - HIDDEN */}
                  {/* <SubscriptionGuard feature="cycleForecasting">
                    {selectedChart && (
                      <AdvancedForecastChart ticker={selectedChart} />
                    )}
                  </SubscriptionGuard> */}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Heatmap */}
                    <SubscriptionGuard feature="heatmapAnalysis">
                      <Card>
                        <CardHeader>
                          <CardTitle>200-Week SMA Heatmap</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <HeatmapChart />
                        </CardContent>
                      </Card>
                    </SubscriptionGuard>

                    {/* Cycle Analysis */}
                    <SubscriptionGuard feature="advancedAnalytics">
                      <Card>
                        <CardHeader>
                          <CardTitle>Cycle Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CycleChart />
                        </CardContent>
                      </Card>
                    </SubscriptionGuard>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="signals" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>All Trading Signals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {isLoadingSignals ? (
                        <div className="space-y-2">
                          {[...Array(10)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                          ))}
                        </div>
                      ) : recentSignals.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No signals yet. Your trading signals will appear here.
                        </p>
                      ) : (
                        recentSignals.map((signal) => (
                          <div key={signal.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <Badge variant={signal.signalType === "buy" ? "default" : "destructive"}>
                                {signal.signalType.toUpperCase()}
                              </Badge>
                              <div>
                                <p className="font-medium text-lg">{signal.ticker}</p>
                                <p className="text-sm text-muted-foreground">
                                  Price: ${signal.price}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{signal.source}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(signal.timestamp).toLocaleString()}
                              </p>
                              {signal.note && (
                                <p className="text-xs text-muted-foreground mt-1">{signal.note}</p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Admin Panel Tab */}
              {isAdmin && (
                <TabsContent value="admin" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Create New Signal */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Plus className="h-5 w-5" />
                          Create Trading Signal
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="ticker">Ticker</Label>
                            <Select value={newSignal.ticker} onValueChange={(value) => setNewSignal({...newSignal, ticker: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select ticker" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BTCUSDT">BTCUSDT</SelectItem>
                                <SelectItem value="ETHUSDT">ETHUSDT</SelectItem>
                                <SelectItem value="SOLUSDT">SOLUSDT</SelectItem>
                                <SelectItem value="ADAUSDT">ADAUSDT</SelectItem>
                                <SelectItem value="XRPUSDT">XRPUSDT</SelectItem>
                                <SelectItem value="DOTUSDT">DOTUSDT</SelectItem>
                                <SelectItem value="LINKUSDT">LINKUSDT</SelectItem>
                                <SelectItem value="AVAXUSDT">AVAXUSDT</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="signalType">Signal Type</Label>
                            <Select value={newSignal.signalType} onValueChange={(value: 'buy' | 'sell') => setNewSignal({...newSignal, signalType: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="buy">BUY</SelectItem>
                                <SelectItem value="sell">SELL</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="price">Price</Label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={newSignal.price}
                              onChange={(e) => setNewSignal({...newSignal, price: e.target.value})}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="timeframe">Timeframe</Label>
                            <Select value={newSignal.timeframe} onValueChange={(value) => setNewSignal({...newSignal, timeframe: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1m">1 Minute</SelectItem>
                                <SelectItem value="5m">5 Minutes</SelectItem>
                                <SelectItem value="15m">15 Minutes</SelectItem>
                                <SelectItem value="30m">30 Minutes</SelectItem>
                                <SelectItem value="1H">1 Hour</SelectItem>
                                <SelectItem value="4H">4 Hours</SelectItem>
                                <SelectItem value="1D">1 Day</SelectItem>
                                <SelectItem value="1W">1 Week</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="source">Source</Label>
                          <Input
                            placeholder="Signal source"
                            value={newSignal.source}
                            onChange={(e) => setNewSignal({...newSignal, source: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="note">Note (Optional)</Label>
                          <Input
                            placeholder="Additional notes"
                            value={newSignal.note}
                            onChange={(e) => setNewSignal({...newSignal, note: e.target.value})}
                          />
                        </div>
                        
                        <Button 
                          onClick={handleCreateSignal} 
                          disabled={createSignalMutation.isPending}
                          className="w-full"
                        >
                          {createSignalMutation.isPending ? "Creating..." : "Create Signal"}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Database Stats */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Database className="h-5 w-5" />
                          Database Statistics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const { data: dbStats, isLoading: statsLoading } = useQuery({
                            queryKey: ['/api/admin/stats'],
                            refetchInterval: 30000,
                          });

                          if (statsLoading) {
                            return (
                              <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                  <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                                ))}
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-4">
                              <div className="flex justify-between items-center p-3 bg-muted rounded">
                                <span className="font-medium">Total Signals</span>
                                <Badge variant="secondary">{dbStats?.signals || 'N/A'}</Badge>
                              </div>
                              <div className="flex justify-between items-center p-3 bg-muted rounded">
                                <span className="font-medium">Active Users</span>
                                <Badge variant="secondary">{dbStats?.users || 'N/A'}</Badge>
                              </div>
                              <div className="flex justify-between items-center p-3 bg-muted rounded">
                                <span className="font-medium">Available Tickers</span>
                                <Badge variant="secondary">{dbStats?.tickers || 'N/A'}</Badge>
                              </div>
                              <div className="flex justify-between items-center p-3 bg-muted rounded">
                                <span className="font-medium">OHLC Records</span>
                                <Badge variant="secondary">{dbStats?.ohlc || 'N/A'}</Badge>
                              </div>
                              <div className="flex justify-between items-center p-3 bg-muted rounded">
                                <span className="font-medium">Heatmap Data</span>
                                <Badge variant="secondary">{dbStats?.heatmaps || 'N/A'}</Badge>
                              </div>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Admin Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Edit className="h-5 w-5" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button variant="outline" className="h-20 flex-col space-y-2">
                          <Database className="h-6 w-6" />
                          <span className="text-sm">Manage Tickers</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col space-y-2">
                          <Bell className="h-6 w-6" />
                          <span className="text-sm">View Alerts</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col space-y-2">
                          <Activity className="h-6 w-6" />
                          <span className="text-sm">System Health</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col space-y-2">
                          <Target className="h-6 w-6" />
                          <span className="text-sm">Analytics</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}