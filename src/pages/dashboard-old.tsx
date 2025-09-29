import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import QuickStats from "@/components/dashboard/QuickStats";
import RecentSignals from "@/components/dashboard/RecentSignals";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import TickerManager from "@/components/dashboard/TickerManager";
import DashboardWidgets from "@/components/dashboard/DashboardWidgets";
import { useState } from "react";

interface AlertSignal {
  id: string;
  ticker: string;
  signalType: "buy" | "sell";
  price: string;
  timestamp: string;
  source: string;
  note?: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [recentSignals, setRecentSignals] = useState<AlertSignal[]>([]);
  const [selectedTickers, setSelectedTickers] = useState<string[]>([
    "BTCUSDT",
    "ETHUSDT",
  ]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle ticker selection
  const handleTickerToggle = (symbol: string) => {
    setSelectedTickers((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol],
    );
  };

  // Fetch user's recent signals (public signals if not authenticated)
  const { data: userSignals, isLoading: isLoadingSignals } = useQuery({
    queryKey: ["/api/signals/BTCUSDT"],
    queryFn: async () => {
      const response = await fetch("/api/signals/BTCUSDT?limit=10");
      if (!response.ok) {
        throw new Error("Failed to fetch signals");
      }
      return await response.json();
    },
  });

  // WebSocket for real-time signal updates
  useWebSocket((message) => {
    if (message.type === "new_signal" && message.signal) {
      setRecentSignals((prev) => [message.signal, ...prev.slice(0, 9)]);
    }
  });

  useEffect(() => {
    if (userSignals && userSignals.length > 0) {
      setRecentSignals(userSignals);
    } else {
      // Show sample signals if no real signals available
      const sampleSignals: AlertSignal[] = [
        {
          id: "signal-1",
          ticker: "BTCUSDT",
          signalType: "buy",
          price: "67500.00",
          timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          source: "TradingView",
          note: "RSI oversold condition",
        },
        {
          id: "signal-2",
          ticker: "ETHUSDT",
          signalType: "sell",
          price: "3200.50",
          timestamp: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
          source: "Algorithm",
          note: "MACD bearish crossover",
        },
        {
          id: "signal-3",
          ticker: "SOLUSDT",
          signalType: "buy",
          price: "98.25",
          timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
          source: "TradingView",
          note: "Support level bounce",
        },
      ];
      setRecentSignals(sampleSignals);
    }
  }, [userSignals]);

  const quickStats = [
    {
      title: "Signal Accuracy",
      value: "87.5%",
      icon: Target,
      color: "text-emerald-400",
    },
    {
      title: "Last Signal",
      value: "2h ago",
      icon: Clock,
      color: "text-foreground",
    },
    {
      title: "Portfolio",
      value: "+24.5%",
      icon: TrendingUp,
      color: "text-emerald-400",
    },
    {
      title: "Active Alerts",
      value: "12",
      icon: Bell,
      color: "text-foreground",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content */}
        <div className="w-full lg:ml-64 flex-1 bg-background">
          {/* Enhanced Top Bar */}
          <TopBar
            title="Trading Dashboard"
            onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            showMobileMenu={isMobileMenuOpen}
          />

          {/* Dashboard Content */}
          <div className="p-4 lg:p-6 space-y-6">
            {/* Quick Stats - Responsive Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {quickStats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <Card key={index}>
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs lg:text-sm text-muted-foreground">
                            {stat.title}
                          </p>
                          <p
                            className={`text-lg lg:text-2xl font-bold ${stat.color}`}
                          >
                            {stat.value}
                          </p>
                        </div>
                        <IconComponent
                          className={`h-6 w-6 lg:h-8 lg:w-8 ${stat.color}`}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Enhanced Dashboard Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6">
                <TabsTrigger
                  value="overview"
                  className="flex items-center space-x-2 text-xs lg:text-sm"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Overview</span>
                  <span className="sm:hidden">Home</span>
                </TabsTrigger>
                <TabsTrigger
                  value="charts"
                  className="flex items-center space-x-2 text-xs lg:text-sm"
                >
                  <LineChart className="h-4 w-4" />
                  <span>Charts</span>
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="flex items-center space-x-2 text-xs lg:text-sm"
                >
                  <PieChart className="h-4 w-4" />
                  <span className="hidden sm:inline">Analytics</span>
                  <span className="sm:hidden">Data</span>
                </TabsTrigger>
                <TabsTrigger
                  value="alerts"
                  className="flex items-center space-x-2 text-xs lg:text-sm"
                >
                  <Bell className="h-4 w-4" />
                  <span>Alerts</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Market Statistics, Professional Features, and Market Information */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Market Statistics */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Market Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Total Market Cap:
                          </span>
                          <span className="font-semibold">$2.45T</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            24h Volume:
                          </span>
                          <span className="font-semibold">$89.2B</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            BTC Dominance:
                          </span>
                          <span className="font-semibold">42.8%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Active Cryptos:
                          </span>
                          <span className="font-semibold">2.4M+</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Market Trend:
                          </span>
                          <Badge variant="outline" className="text-green-600">
                            Bullish
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Professional Features */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Professional Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">
                              RSI & MACD Indicators
                            </span>
                          </div>
                          <Badge variant="outline" className="text-green-600">
                            Active
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-purple-500" />
                            <span className="text-sm">Bollinger Bands</span>
                          </div>
                          <Badge variant="outline" className="text-green-600">
                            Active
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-orange-500" />
                            <span className="text-sm">Volume Analysis</span>
                          </div>
                          <Badge variant="outline" className="text-green-600">
                            Active
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm">Price Alerts</span>
                          </div>
                          <Badge variant="outline" className="text-blue-600">
                            Available
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-pink-500" />
                            <span className="text-sm">Chart Patterns</span>
                          </div>
                          <Badge variant="outline" className="text-blue-600">
                            Available
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Market Information */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Market Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            24h Volume:
                          </span>
                          <span className="font-semibold">$2.4B</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            24h High:
                          </span>
                          <span className="font-semibold text-green-600">
                            $72,450
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            24h Low:
                          </span>
                          <span className="font-semibold text-red-600">
                            $68,230
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Market Cap:
                          </span>
                          <span className="font-semibold">$1.37T</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Fear & Greed:
                          </span>
                          <Badge variant="outline" className="text-yellow-600">
                            Neutral 52
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Active Tickers Display */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-5 w-5" />
                      <span>Active Tickers</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {selectedTickers.map((ticker) => (
                        <div
                          key={ticker}
                          className="flex items-center justify-between p-3 border rounded-lg bg-card"
                        >
                          <div>
                            <div className="font-medium text-sm">
                              {ticker.replace("USDT", "")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Active
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {ticker.includes("BTC")
                              ? "₿"
                              : ticker.includes("ETH")
                                ? "Ξ"
                                : "●"}
                          </Badge>
                        </div>
                      ))}
                      {selectedTickers.length === 0 && (
                        <div className="col-span-full text-center py-6 text-muted-foreground">
                          <p>No active tickers selected</p>
                          <p className="text-xs mt-1">
                            Add tickers to monitor price movements
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <Suspense fallback={<Skeleton className="h-20 w-full" />}>
                        <TickerSelector
                          selectedTickers={selectedTickers}
                          onTickerToggle={handleTickerToggle}
                          className=""
                        />
                      </Suspense>
                    </div>
                  </CardContent>
                </Card>

                {/* Charts Section - Bigger Price Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Price Chart</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                      <Suspense
                        fallback={
                          <div className="h-96 w-full bg-muted animate-pulse rounded-lg flex items-center justify-center">
                            <div className="text-muted-foreground">
                              Loading Chart...
                            </div>
                          </div>
                        }
                      >
                        <TradingViewRealWidget
                          ticker={selectedTickers[0] || "BTCUSDT"}
                        />
                      </Suspense>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>200-Week Heatmap</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Suspense
                        fallback={<Skeleton className="h-[300px] w-full" />}
                      >
                        <HeatmapChart symbol="BTC" height={300} />
                      </Suspense>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Signals */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Recent Signals</span>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/alerts">View All</Link>
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingSignals ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : recentSignals.length > 0 ? (
                      <div className="space-y-3">
                        {recentSignals.slice(0, 5).map((signal) => (
                          <div
                            key={signal.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              {signal.signalType === "buy" ? (
                                <TrendingUp className="h-5 w-5 text-green-400" />
                              ) : (
                                <TrendingDown className="h-5 w-5 text-red-400" />
                              )}
                              <div>
                                <p className="font-medium">{signal.ticker}</p>
                                <p className="text-sm text-muted-foreground">
                                  {signal.signalType.toUpperCase()} at $
                                  {signal.price}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                {new Date(
                                  signal.timestamp,
                                ).toLocaleTimeString()}
                              </p>
                              <Badge variant="outline" className="text-xs mt-1">
                                {signal.source}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No recent signals. Signals will appear here when
                        available.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="charts" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Suspense
                    fallback={<Skeleton className="h-[400px] w-full" />}
                  >
                    <HeatmapChart symbol="BTC" height={400} />
                  </Suspense>
                  <Suspense
                    fallback={<Skeleton className="h-[400px] w-full" />}
                  >
                    <CycleChart symbol="BTC" height={400} />
                  </Suspense>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Cycle Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Suspense
                        fallback={<Skeleton className="h-[300px] w-full" />}
                      >
                        <CycleChart symbol="BTC" height={300} />
                      </Suspense>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span>Win Rate</span>
                        <span className="font-semibold text-green-400">
                          87.5%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg. Hold Time</span>
                        <span className="font-semibold">2.3 days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Best Performer</span>
                        <span className="font-semibold">BTCUSDT</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="alerts" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Alert Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button className="w-full" asChild>
                        <Link href="/alerts">Manage Alerts</Link>
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/advanced-alerts">Advanced Alerts</Link>
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/notification-setup">
                          Notification Setup
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {recentSignals.slice(0, 3).map((signal) => (
                        <div
                          key={signal.id}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <span className="text-sm">
                            {signal.ticker} {signal.signalType.toUpperCase()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(signal.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
