import React, { useState, useEffect, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import SidebarWithSubscription from "../components/layout/SidebarWithSubscription";
import { buildApiUrl } from "../lib/config";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Loader2,
  BarChart3,
  Star,
  Bell,
  Clock,
  LineChart,
  PieChart,
  Settings,
  Plus,
} from "lucide-react";

// Lazy load components
const TradingViewWidget = lazy(
  () => import("../components/charts/TradingViewWidget")
);
const SimpleTradingViewChart = lazy(
  () => import("../components/charts/SimpleTradingViewChart")
);

interface AlertSignal {
  id: string;
  ticker: string;
  signal_type?: string;
  signalType?: string;
  price: number;
  created_at?: string;
  timestamp?: string;
  timeframe?: string;
  source?: string;
  note?: string;
  notes?: string;
}

interface TickerData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
}

interface WatchlistItem {
  id: string;
  symbol: string;
  name?: string;
  is_active: boolean;
  sort_order: number;
  added_at: string;
}

const TIMEFRAMES = [
  { value: "30M", label: "30 Minutes", tvValue: "30" },
  { value: "1H", label: "1 Hour", tvValue: "60" },
  { value: "4H", label: "4 Hours", tvValue: "240" },
  { value: "8H", label: "8 Hours", tvValue: "480" },
  { value: "12H", label: "12 Hours", tvValue: "720" },
  { value: "1D", label: "1 Day", tvValue: "D" },
  { value: "1W", label: "1 Week", tvValue: "W" },
  { value: "1M", label: "1 Month", tvValue: "M" },
];

export default function TradingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [selectedTicker, setSelectedTicker] = useState("BTCUSDT");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1D");
  const [chartLoaded, setChartLoaded] = useState(false);
  const [priceAnimationKey, setPriceAnimationKey] = useState(0);
  const [operatingSymbol, setOperatingSymbol] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"chart" | "signals">(
    "chart"
  );
  const [recentSignals, setRecentSignals] = useState<AlertSignal[]>([]);
  const [selectedChart, setSelectedChart] = useState<string>("BTCUSDT");

  // Admin state
  const [newSignal, setNewSignal] = useState({
    ticker: "",
    signalType: "buy" as "buy" | "sell",
    price: "",
    timeframe: "4H",
    source: "Manual",
    note: "",
  });

  const isAdmin = user?.role === "admin";

  // Fetch available tickers from API
  const { data: tickersData, isLoading: tickersLoading } = useQuery({
    queryKey: ["/api/tickers"],
    queryFn: async () => {
      const response = await fetch(buildApiUrl("/api/tickers"));
      if (!response.ok) throw new Error("Failed to fetch tickers");
      const data = await response.json();
      return Array.isArray(data) ? { tickers: data } : data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const tickers = Array.isArray(tickersData?.tickers)
    ? tickersData.tickers
    : [];

  // Fetch user's watchlist from database
  const { data: watchlistData, isLoading: watchlistLoading } = useQuery({
    queryKey: ["/api/watchlist"],
    queryFn: () => apiRequest("/api/watchlist"),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  console.log(watchlistData, "watchlistData");

  // Extract symbols from watchlist
  const selectedTickers = watchlistData?.watchlist?.map(
    (item: WatchlistItem) => item.symbol
  ) || ["BTCUSDT", "ETHUSDT", "SOLUSDT"];

  // Fetch real-time market data
  const { data: marketData, isLoading: marketLoading } = useQuery({
    queryKey: [`/api/public/market/price/${selectedTicker}`],
    queryFn: async () => {
      const response = await fetch(
        buildApiUrl(`/api/public/market/price/${selectedTicker}`)
      );
      if (!response.ok) throw new Error("Failed to fetch market data");
      return await response.json();
    },
    refetchInterval: 10000,
    refetchOnWindowFocus: false,
    staleTime: 5000,
  });

  // Fetch prices for selected tickers
  const { data: pricesData, isLoading: pricesLoading } = useQuery({
    queryKey: ["/api/public/market/prices", selectedTickers],
    queryFn: async () => {
      const symbols = selectedTickers.join(",");
      const response = await fetch(
        buildApiUrl(`/api/public/market/prices?symbols=${symbols}`)
      );
      if (!response.ok) throw new Error("Failed to fetch prices");
      const result = await response.json();

      if (result.data && Array.isArray(result.data)) {
        const prices: any = {};
        result.data.forEach((item: any) => {
          prices[item.symbol] = {
            price: item.price,
            change24h: item.change,
            changePercent: item.changePercent,
            volume: item.volume,
            high: item.high,
            low: item.low,
          };
        });
        return { prices };
      }
      return result;
    },
    refetchInterval: 5000,
    enabled: selectedTickers.length > 0,
  });

  // Fetch trading signals
  const { data: signalsResponse, isLoading: signalsLoading } = useQuery({
    queryKey: [`/api/public/signals/alerts`, selectedTickers],
    queryFn: async () => {
      const response = await fetch(
        buildApiUrl("/api/public/signals/alerts?limit=50")
      );
      if (!response.ok) throw new Error("Failed to fetch signals");
      const data = await response.json();
      return Array.isArray(data) ? { signals: data } : data;
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });

  // Format ticker data with prices
  const formattedTickers: TickerData[] = React.useMemo(() => {
    if (!tickersData?.tickers || !pricesData?.prices) return [];

    return tickersData.tickers
      .filter((ticker: any) => selectedTickers.includes(ticker.symbol))
      .map((ticker: any) => {
        const priceInfo = pricesData.prices[ticker.symbol] || {};
        return {
          symbol: ticker.symbol,
          name:
            ticker.baseAsset ||
            ticker.name ||
            ticker.symbol.replace("USDT", ""),
          price: priceInfo.price || 0,
          change24h: priceInfo.change24h || 0,
          changePercent24h: priceInfo.changePercent || 0,
        };
      });
  }, [tickersData, pricesData, selectedTickers]);

  // Update signals based on selected tickers
  useEffect(() => {
    if (signalsResponse?.signals) {
      const filteredSignals = signalsResponse.signals.filter((signal: any) =>
        selectedTickers.some((ticker: string) => {
          const normalizeSymbol = (symbol: string) =>
            symbol.replace(/(USDT|USDC|BUSD|USD|EUR|BTC|ETH|BNB)$/i, "");

          const normalizedTicker = normalizeSymbol(ticker);
          const normalizedSignal = normalizeSymbol(signal.ticker);

          return (
            normalizedSignal === normalizedTicker || signal.ticker === ticker
          );
        })
      );
      // Only update state if the filtered signals have changed
      if (JSON.stringify(filteredSignals) !== JSON.stringify(recentSignals)) {
        setRecentSignals(filteredSignals);
      }
    } else if (recentSignals.length > 0) {
      setRecentSignals([]);
    }
  }, [signalsResponse, selectedTickers]);

  // Update selected chart when watchlist changes
  useEffect(() => {
    if (selectedTickers.length > 0 && selectedChart !== selectedTickers[0]) {
      setSelectedChart(selectedTickers[0]);
    }
  }, [selectedTickers]);

  // Update selected chart when watchlist changes
  useEffect(() => {
    if (
      selectedTickers.length > 0 &&
      !selectedTickers.includes(selectedChart)
    ) {
      setSelectedChart(selectedTickers[0]);
    }
  }, [selectedTickers, selectedChart]);

  // Add to watchlist mutation
  const addToWatchlistMutation = useMutation({
    mutationFn: async ({ symbol, name }: { symbol: string; name?: string }) => {
      setOperatingSymbol(symbol);
      return apiRequest("/api/watchlist", {
        method: "POST",
        body: JSON.stringify({ symbol, name }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({
        title: "Added to Watchlist",
        description: "Cryptocurrency added to your watchlist successfully",
      });
    },
    onError: (error: any) => {
      if (error.message?.includes("already in watchlist")) {
        toast({
          title: "Already in Watchlist",
          description: "This cryptocurrency is already in your watchlist",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add cryptocurrency to watchlist",
          variant: "destructive",
        });
      }
    },
    onSettled: () => {
      setOperatingSymbol(null);
    },
  });

  // Remove from watchlist mutation
  const removeFromWatchlistMutation = useMutation({
    mutationFn: async (symbol: string) => {
      setOperatingSymbol(symbol);
      return apiRequest("/api/watchlist", {
        method: "DELETE",
        body: JSON.stringify({ symbol }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({
        title: "Removed from Watchlist",
        description: "Cryptocurrency removed from your watchlist successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove cryptocurrency from watchlist",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setOperatingSymbol(null);
    },
  });

  // Create signal mutation (admin only)
  const createSignalMutation = useMutation({
    mutationFn: async (signalData: any) => {
      return apiRequest("/api/admin/signals", {
        method: "POST",
        body: JSON.stringify(signalData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Signal created successfully",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/public/signals/alerts"],
      });
      setNewSignal({
        ticker: "",
        signalType: "buy",
        price: "",
        timeframe: "4H",
        source: "Manual",
        note: "",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create signal",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const handleTickerToggle = (symbol: string, name?: string) => {
    if (selectedTickers.includes(symbol)) {
      removeFromWatchlistMutation.mutate(symbol);
    } else {
      addToWatchlistMutation.mutate({ symbol, name });
    }
  };

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

  const getTradingViewInterval = () => {
    const timeframe = TIMEFRAMES.find((tf) => tf.value === selectedTimeframe);
    return timeframe?.tvValue || "D";
  };

  const refreshChartData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/tickers"] });
    queryClient.invalidateQueries({
      queryKey: [`/api/public/market/price/${selectedTicker}`],
    });
  };

  const refreshSignalsData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
    queryClient.invalidateQueries({ queryKey: ["/api/tickers"] });
    queryClient.invalidateQueries({
      queryKey: [`/api/public/signals/alerts`, selectedTickers],
    });
  };

  const handleSectionSwitch = (section: "chart" | "signals") => {
    setActiveSection(section);
    if (section === "chart") {
      refreshChartData();
    } else {
      refreshSignalsData();
    }
  };

  // Get market data values
  const currentPrice = (marketData as any)?.price || 0;
  const priceChange = (marketData as any)?.changePercent || 0;
  const volume24h = (marketData as any)?.volume || 0;
  const high24h = (marketData as any)?.high || 0;
  const low24h = (marketData as any)?.low || 0;

  // Price animation effect
  useEffect(() => {
    setPriceAnimationKey((prev) => prev + 1);
  }, [currentPrice]);

  // Chart loading effect
  useEffect(() => {
    setChartLoaded(false);
    const timer = setTimeout(() => setChartLoaded(true), 1000);
    return () => clearTimeout(timer);
  }, [selectedTicker, selectedTimeframe]);

  // Window focus effect
  useEffect(() => {
    const handleFocus = () => {
      if (activeSection === "chart") {
        refreshChartData();
      } else {
        refreshSignalsData();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [activeSection, selectedTicker]);

  // Quick stats for dashboard
  const quickStats = [
    {
      title: "Live Tickers",
      value: selectedTickers.length.toString(),
      icon: BarChart3,
      color: "text-blue-500",
    },
    {
      title: "Last Signal",
      value:
        recentSignals.length > 0
          ? formatDistanceToNow(
              new Date(
                recentSignals[0].created_at ||
                  recentSignals[0].timestamp ||
                  new Date()
              ),
              { addSuffix: true }
            )
          : "N/A",
      icon: Clock,
      color: "text-foreground",
    },
    {
      title: "Market Status",
      value: "LIVE",
      icon: Activity,
      color: "text-orange-500",
    },
    {
      title: "Total Signals",
      value: recentSignals.length.toString(),
      icon: Bell,
      color: "text-foreground",
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      <SidebarWithSubscription />

      {/* Tab Navigation */}
      <div
        className="
    flex bg-inherit backdrop-blur-sm p-2 mt-2 sm:mt-0 sm:p-3 lg:p-3 pt-0 ml-0 lg:ml-64
    sm:static fixed bottom-[-8px] left-0 z-50
  "
      >
        <div
          className="
      flex bg-[#2C2C30] rounded-t-2xl sm:rounded-xl shadow-inner p-1.5 gap-2
      w-full sm:w-screen justify-around sm:justify-start
    "
        >
          <button
            onClick={() => handleSectionSwitch("chart")}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 ${
              activeSection === "chart"
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                : "text-white hover:text-gray-900 hover:bg-gray-200"
            }`}
          >
            📊 Buy / Sell Chart
          </button>

          <button
            onClick={() => handleSectionSwitch("signals")}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 ${
              activeSection === "signals"
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                : "text-white hover:text-gray-900 hover:bg-gray-200"
            }`}
          >
            📈 Signals & Watchlist
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-auto ml-0 lg:ml-64">
        {/* Chart Section */}
        {activeSection === "chart" && (
          <>
            {/* Header with Controls */}
            <div className="border-b bg-card/50 backdrop-blur-sm p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col gap-4">
                {/* Page Title */}
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-6 w-6 lg:h-8 lg:w-8 text-primary" />
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
                      Buy/Sell Chart
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Real-time trading signals and market analysis
                    </p>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <Label
                      htmlFor="ticker-select"
                      className="text-xs mb-1.5 block"
                    >
                      Ticker
                    </Label>
                    <Select
                      value={selectedTicker}
                      onValueChange={setSelectedTicker}
                    >
                      <SelectTrigger id="ticker-select" className="w-full">
                        <SelectValue placeholder="Select ticker" />
                      </SelectTrigger>
                      <SelectContent>
                        {tickers.map((ticker: any) => (
                          <SelectItem key={ticker.symbol} value={ticker.symbol}>
                            {ticker.baseAsset ||
                              ticker.symbol.replace("USDT", "")}{" "}
                            -{" "}
                            {ticker.description || ticker.name || ticker.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 min-w-[150px]">
                    <Label
                      htmlFor="timeframe-select"
                      className="text-xs mb-1.5 block"
                    >
                      Timeframe
                    </Label>
                    <Select
                      value={selectedTimeframe}
                      onValueChange={setSelectedTimeframe}
                    >
                      <SelectTrigger id="timeframe-select" className="w-full">
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEFRAMES.map((tf) => (
                          <SelectItem key={tf.value} value={tf.value}>
                            {tf.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Price Info */}
                <div className="flex items-center gap-3 lg:gap-6 overflow-x-auto scrollbar-hide">
                  <div className="min-w-[90px] sm:min-w-[100px]">
                    <p className="text-xs lg:text-sm text-muted-foreground">
                      Last Price
                    </p>
                    {marketLoading ? (
                      <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
                    ) : (
                      <motion.div
                        key={priceAnimationKey}
                        initial={{ scale: 0.95, opacity: 0.8 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="text-base sm:text-lg lg:text-xl font-bold"
                      >
                        $
                        {currentPrice > 0 ? currentPrice.toLocaleString() : "0"}
                      </motion.div>
                    )}
                  </div>

                  <div className="min-w-[90px] sm:min-w-[100px]">
                    <p className="text-xs lg:text-sm text-muted-foreground">
                      24h Change
                    </p>
                    {marketLoading ? (
                      <div className="h-6 w-20 bg-muted animate-pulse rounded"></div>
                    ) : (
                      <motion.div
                        key={`change-${priceAnimationKey}`}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className={`flex items-center gap-1 ${
                          priceChange >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        <motion.div
                          animate={{ rotate: priceChange >= 0 ? 0 : 180 }}
                          transition={{ duration: 0.2 }}
                        >
                          {priceChange >= 0 ? (
                            <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4" />
                          ) : (
                            <TrendingDown className="h-3 w-3 lg:h-4 lg:w-4" />
                          )}
                        </motion.div>
                        <span className="font-medium text-sm lg:text-base">
                          {priceChange > 0 ? "+" : ""}
                          {priceChange.toFixed(2)}%
                        </span>
                      </motion.div>
                    )}
                  </div>

                  {/* Additional market data */}
                  <div className="min-w-[80px]">
                    <p className="text-xs lg:text-sm text-muted-foreground">
                      24h High
                    </p>
                    {marketLoading ? (
                      <div className="h-5 w-16 bg-muted animate-pulse rounded"></div>
                    ) : (
                      <p className="font-medium text-sm lg:text-base">
                        ${high24h > 0 ? high24h.toLocaleString() : "-"}
                      </p>
                    )}
                  </div>

                  <div className="min-w-[80px]">
                    <p className="text-xs lg:text-sm text-muted-foreground">
                      24h Low
                    </p>
                    {marketLoading ? (
                      <div className="h-5 w-16 bg-muted animate-pulse rounded"></div>
                    ) : (
                      <p className="font-medium text-sm lg:text-base">
                        ${low24h > 0 ? low24h.toLocaleString() : "-"}
                      </p>
                    )}
                  </div>

                  <div className="min-w-[80px]">
                    <p className="text-xs lg:text-sm text-muted-foreground">
                      24h Volume
                    </p>
                    {marketLoading ? (
                      <div className="h-5 w-20 bg-muted animate-pulse rounded"></div>
                    ) : (
                      <p className="font-medium text-sm lg:text-base">
                        {volume24h > 0 ? volume24h.toLocaleString() : "-"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Chart Container */}
            <div className="flex-1 p-3 sm:p-4 lg:p-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50 relative overflow-hidden">
                  <CardContent className="p-4 h-full relative">
                    <AnimatePresence>
                      {!chartLoaded && (
                        <motion.div
                          initial={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm"
                        >
                          <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <div className="text-sm text-muted-foreground">
                              Loading chart for {selectedTicker}...
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.div
                      key={`${selectedTicker}-${selectedTimeframe}`}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: chartLoaded ? 1 : 0.5 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full"
                    >
                      <Suspense
                        fallback={
                          <div className="h-[400px] w-full bg-muted animate-pulse rounded-lg flex items-center justify-center">
                            <div className="text-muted-foreground">
                              Loading TradingView Chart...
                            </div>
                          </div>
                        }
                      >
                        <TradingViewWidget
                          symbol={`BINANCE:${selectedTicker}`}
                          theme="dark"
                          height={600}
                          interval={getTradingViewInterval()}
                          showSignals={true}
                        />
                      </Suspense>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </>
        )}

        {/* Signals & Watchlist Section */}
        {activeSection === "signals" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Dashboard Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList
                    className={`grid w-full ${
                      isAdmin ? "grid-cols-5" : "grid-cols-4"
                    }`}
                  >
                    <TabsTrigger
                      value="overview"
                      className="flex items-center justify-center gap-1 sm:gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span className="hidden sm:inline">Overview</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="charts"
                      className="flex items-center justify-center gap-1 sm:gap-2"
                    >
                      <LineChart className="h-4 w-4" />
                      <span className="hidden sm:inline">Charts</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="analytics"
                      className="flex items-center justify-center gap-1 sm:gap-2"
                    >
                      <PieChart className="h-4 w-4" />
                      <span className="hidden sm:inline">Analytics</span>
                    </TabsTrigger>
                    {isAdmin && (
                      <TabsTrigger
                        value="admin"
                        className="flex items-center justify-center gap-1 sm:gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        <span className="hidden sm:inline">Admin</span>
                      </TabsTrigger>
                    )}
                    <TabsTrigger
                      value="signals"
                      className="flex items-center justify-center gap-1 sm:gap-2"
                    >
                      <Bell className="h-4 w-4" />
                      <span className="hidden sm:inline">Signals</span>
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
                                <p
                                  className={`text-2xl font-bold ${stat.color}`}
                                >
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
                        <CardTitle className="flex items-center gap-2">
                          <Star className="h-5 w-5" />
                          Your Cryptocurrency Watchlist
                          {watchlistLoading && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {tickersLoading || watchlistLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {(tickersData?.tickers || [])
                              .slice(0, 12)
                              .map((ticker: any) => {
                                const isSelected = selectedTickers.includes(
                                  ticker.symbol
                                );
                                const isCurrentlyOperating =
                                  operatingSymbol === ticker.symbol;
                                const isAnyOperationInProgress =
                                  operatingSymbol !== null;

                                return (
                                  <Button
                                    key={ticker.symbol}
                                    variant={isSelected ? "default" : "outline"}
                                    onClick={() =>
                                      handleTickerToggle(
                                        ticker.symbol,
                                        ticker.baseAsset ||
                                          ticker.name ||
                                          ticker.symbol.replace("USDT", "")
                                      )
                                    }
                                    disabled={isAnyOperationInProgress}
                                    className={`justify-start relative transition-all duration-200 ${
                                      isAnyOperationInProgress &&
                                      !isCurrentlyOperating
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                    }`}
                                  >
                                    {isCurrentlyOperating && (
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    )}
                                    {isSelected && !isCurrentlyOperating && (
                                      <Star className="h-4 w-4 mr-2 fill-current" />
                                    )}
                                    {ticker.baseAsset ||
                                      ticker.name ||
                                      ticker.symbol.replace("USDT", "")}
                                  </Button>
                                );
                              })}
                          </div>
                        )}

                        {/* Watchlist Summary */}
                        {!watchlistLoading && watchlistData?.watchlist && (
                          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-muted-foreground">
                                {watchlistData.watchlist.length}{" "}
                                cryptocurrencies in your watchlist
                              </div>
                              {operatingSymbol && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Updating {operatingSymbol}...
                                </div>
                              )}
                            </div>
                            {watchlistData.watchlist.length > 0 &&
                              !operatingSymbol && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Last updated:{" "}
                                  {new Date(
                                    watchlistData.watchlist[0]?.added_at
                                  ).toLocaleString()}
                                </div>
                              )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Live Prices */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Live Prices</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {pricesLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : formattedTickers.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            Select cryptocurrencies to see live prices
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {formattedTickers.map((ticker) => (
                              <Card key={ticker.symbol} className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-bold">
                                    {ticker.name}
                                  </span>
                                  <Badge
                                    variant={
                                      ticker.changePercent24h >= 0
                                        ? "default"
                                        : "destructive"
                                    }
                                  >
                                    {ticker.changePercent24h >= 0 ? "+" : ""}
                                    {ticker.changePercent24h.toFixed(2)}%
                                  </Badge>
                                </div>
                                <div className="text-2xl font-bold">
                                  $
                                  {ticker.price.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {ticker.symbol}
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Recent Signals Overview */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Signals</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {signalsLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                          ) : recentSignals.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">
                              No signals yet. Your trading signals will appear
                              here.
                            </p>
                          ) : (
                            recentSignals.slice(0, 5).map((signal) => {
                              const signalType =
                                signal.signal_type ||
                                signal.signalType ||
                                "unknown";
                              const timestamp =
                                signal.created_at ||
                                signal.timestamp ||
                                new Date().toISOString();
                              const note = signal.note || signal.notes;

                              return (
                                <div
                                  key={signal.id}
                                  className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                  <div className="flex items-center space-x-3">
                                    <Badge
                                      variant={
                                        signalType.toLowerCase() === "buy" ||
                                        signalType.toLowerCase() === "long"
                                          ? "default"
                                          : "destructive"
                                      }
                                    >
                                      {signalType.toUpperCase()}
                                    </Badge>
                                    <div>
                                      <p className="font-medium">
                                        {signal.ticker}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        ${signal.price.toLocaleString()} •{" "}
                                        {formatDistanceToNow(
                                          new Date(timestamp),
                                          {
                                            addSuffix: true,
                                          }
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-muted-foreground">
                                      {signal.source || "System"}
                                    </p>
                                    {note && (
                                      <p className="text-xs text-muted-foreground">
                                        {note}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="charts" className="space-y-6">
                    <Card className="bg-[#1F1F23]/80 backdrop-blur-md border border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                      <CardHeader className="border-b border-gray-700 pb-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <CardTitle className="text-xl font-semibold text-white">
                              📊 Interactive Price Charts
                            </CardTitle>
                            <p className="text-sm text-gray-400 mt-1">
                              Analyze live price movements of your favorite
                              cryptocurrencies.
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Label className="text-sm text-gray-300">
                              Select Ticker:
                            </Label>
                            <Select
                              value={selectedChart}
                              onValueChange={setSelectedChart}
                            >
                              <SelectTrigger className="w-[180px] bg-[#2C2C30] border-gray-600 text-white focus:ring-2 focus:ring-blue-500">
                                <SelectValue placeholder="Choose" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#2C2C30] text-white border border-gray-700 shadow-xl">
                                {selectedTickers.map((ticker: string) => (
                                  <SelectItem
                                    key={ticker}
                                    value={ticker}
                                    className="hover:bg-blue-500 hover:text-white transition-colors"
                                  >
                                    {ticker.replace("USDT", "")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-6">
                        {selectedTickers.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-2">
                            <div className="text-3xl">📉</div>
                            <p className="text-center text-sm sm:text-base max-w-sm">
                              Select cryptocurrencies from your watchlist to
                              view interactive charts.
                            </p>
                          </div>
                        ) : (
                          <Suspense
                            fallback={
                              <div className="h-[600px] w-full bg-[#2A2A2F] animate-pulse rounded-xl flex flex-col items-center justify-center text-gray-400">
                                <div className="text-lg font-medium">
                                  Loading Chart...
                                </div>
                              </div>
                            }
                          >
                            <div className="rounded-xl overflow-hidden border border-gray-700">
                              <SimpleTradingViewChart
                                ticker={selectedChart}
                                height={600}
                              />
                            </div>
                          </Suspense>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="analytics" className="space-y-6">
                    {/* Market Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-6">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              Active Tickers
                            </p>
                            <p className="text-3xl font-bold">
                              {formattedTickers.length}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {selectedTickers.length} selected in watchlist
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              Recent Signals
                            </p>
                            <p className="text-3xl font-bold">
                              {recentSignals.length}
                            </p>
                            <div className="flex gap-2 text-xs">
                              <span className="text-green-500">
                                {
                                  recentSignals.filter((s) => {
                                    const type = (
                                      s.signal_type ||
                                      s.signalType ||
                                      ""
                                    ).toLowerCase();
                                    return type === "buy" || type === "long";
                                  }).length
                                }{" "}
                                Buy
                              </span>
                              <span className="text-red-500">
                                {
                                  recentSignals.filter((s) => {
                                    const type = (
                                      s.signal_type ||
                                      s.signalType ||
                                      ""
                                    ).toLowerCase();
                                    return type === "sell" || type === "short";
                                  }).length
                                }{" "}
                                Sell
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              Avg Price Change
                            </p>
                            <p
                              className={`text-3xl font-bold ${
                                formattedTickers.length > 0 &&
                                formattedTickers.reduce(
                                  (acc, t) => acc + t.changePercent24h,
                                  0
                                ) /
                                  formattedTickers.length >=
                                  0
                                  ? "text-green-500"
                                  : "text-red-500"
                              }`}
                            >
                              {formattedTickers.length > 0
                                ? (
                                    formattedTickers.reduce(
                                      (acc, t) => acc + t.changePercent24h,
                                      0
                                    ) / formattedTickers.length
                                  ).toFixed(2)
                                : "0.00"}
                              %
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formattedTickers.length > 0
                                ? "Last 24 hours"
                                : "No data"}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              Market Trend
                            </p>
                            <p className="text-3xl font-bold">
                              {formattedTickers.length === 0 ? (
                                <span className="text-muted-foreground">
                                  N/A
                                </span>
                              ) : formattedTickers.filter(
                                  (t) => t.changePercent24h >= 0
                                ).length >
                                formattedTickers.length / 2 ? (
                                <span className="text-green-500">Bullish</span>
                              ) : (
                                <span className="text-red-500">Bearish</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formattedTickers.length > 0
                                ? `${
                                    formattedTickers.filter(
                                      (t) => t.changePercent24h >= 0
                                    ).length
                                  }/${formattedTickers.length} positive`
                                : "No tickers selected"}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Performance Rankings */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Performance Rankings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Top Gainers */}
                          <div className="space-y-3">
                            <h3 className="text-sm font-medium text-green-500 flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Top Gainers (24h)
                            </h3>
                            {formattedTickers.length === 0 ? (
                              <p className="text-center text-muted-foreground py-4 text-sm">
                                Select tickers to see rankings
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {[...formattedTickers]
                                  .sort(
                                    (a, b) =>
                                      b.changePercent24h - a.changePercent24h
                                  )
                                  .slice(0, 5)
                                  .map((ticker, index) => (
                                    <div
                                      key={ticker.symbol}
                                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs font-medium text-muted-foreground w-4">
                                          #{index + 1}
                                        </span>
                                        <div>
                                          <p className="font-medium">
                                            {ticker.name}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {ticker.symbol}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-medium">
                                          ${ticker.price.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-green-500">
                                          +{ticker.changePercent24h.toFixed(2)}%
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>

                          {/* Top Losers */}
                          <div className="space-y-3">
                            <h3 className="text-sm font-medium text-red-500 flex items-center gap-2">
                              <TrendingDown className="h-4 w-4" />
                              Top Losers (24h)
                            </h3>
                            {formattedTickers.length === 0 ? (
                              <p className="text-center text-muted-foreground py-4 text-sm">
                                Select tickers to see rankings
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {[...formattedTickers]
                                  .sort(
                                    (a, b) =>
                                      a.changePercent24h - b.changePercent24h
                                  )
                                  .slice(0, 5)
                                  .map((ticker, index) => (
                                    <div
                                      key={ticker.symbol}
                                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs font-medium text-muted-foreground w-4">
                                          #{index + 1}
                                        </span>
                                        <div>
                                          <p className="font-medium">
                                            {ticker.name}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {ticker.symbol}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-medium">
                                          ${ticker.price.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-red-500">
                                          {ticker.changePercent24h.toFixed(2)}%
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Signal Analysis */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Signal Distribution by Ticker</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {recentSignals.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">
                            No signals available for analysis
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {Object.entries(
                              recentSignals.reduce((acc, signal) => {
                                const ticker = signal.ticker;
                                if (!acc[ticker]) {
                                  acc[ticker] = { buy: 0, sell: 0, total: 0 };
                                }
                                acc[ticker].total += 1;
                                const signalType = (
                                  signal.signal_type ||
                                  signal.signalType ||
                                  ""
                                ).toLowerCase();
                                if (
                                  signalType === "buy" ||
                                  signalType === "long"
                                ) {
                                  acc[ticker].buy += 1;
                                } else {
                                  acc[ticker].sell += 1;
                                }
                                return acc;
                              }, {} as Record<string, { buy: number; sell: number; total: number }>)
                            )
                              .sort((a, b) => b[1].total - a[1].total)
                              .map(([ticker, stats]) => (
                                <div
                                  key={ticker}
                                  className="p-4 bg-muted rounded-lg"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium">
                                      {ticker}
                                    </span>
                                    <Badge variant="outline">
                                      {stats.total} signals
                                    </Badge>
                                  </div>
                                  <div className="flex gap-2 text-sm">
                                    <div className="flex items-center gap-1">
                                      <div className="w-3 h-3 rounded-full bg-green-500" />
                                      <span className="text-muted-foreground">
                                        {stats.buy} Buy
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <div className="w-3 h-3 rounded-full bg-red-500" />
                                      <span className="text-muted-foreground">
                                        {stats.sell} Sell
                                      </span>
                                    </div>
                                  </div>
                                  <div className="mt-2 h-2 bg-background rounded-full overflow-hidden flex">
                                    <div
                                      className="bg-green-500"
                                      style={{
                                        width: `${
                                          (stats.buy / stats.total) * 100
                                        }%`,
                                      }}
                                    />
                                    <div
                                      className="bg-red-500"
                                      style={{
                                        width: `${
                                          (stats.sell / stats.total) * 100
                                        }%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Market Correlation Heatmap */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Price Correlation Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {formattedTickers.length < 2 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            Add more cryptocurrencies to your watchlist to see
                            correlation analysis
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                              Showing price movement correlations between
                              selected cryptocurrencies
                            </p>
                            <div className="grid gap-2">
                              {formattedTickers.slice(0, 5).map((ticker, i) => (
                                <div
                                  key={ticker.symbol}
                                  className="flex items-center justify-between p-2 rounded bg-muted/50"
                                >
                                  <span className="text-sm font-medium">
                                    {ticker.name}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                      24h:
                                    </span>
                                    <span
                                      className={`text-sm font-medium ${
                                        ticker.changePercent24h >= 0
                                          ? "text-green-500"
                                          : "text-red-500"
                                      }`}
                                    >
                                      {ticker.changePercent24h >= 0 ? "+" : ""}
                                      {ticker.changePercent24h.toFixed(2)}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Volume Analysis */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Volume Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {pricesData?.prices ? (
                          <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                              24-hour trading volume for selected
                              cryptocurrencies
                            </p>
                            <div className="space-y-3">
                              {Object.entries(pricesData.prices)
                                .filter(([symbol]) =>
                                  selectedTickers.includes(symbol)
                                )
                                .sort(
                                  (a, b) =>
                                    ((b[1] as { volume: number }).volume || 0) -
                                    ((a[1] as { volume: number }).volume || 0)
                                )
                                .slice(0, 10)
                                .map(([symbol, data], index) => {
                                  const maxVolume = Math.max(
                                    ...Object.values(pricesData.prices)
                                      .filter((_, i) =>
                                        selectedTickers.includes(
                                          Object.keys(pricesData.prices)[i]
                                        )
                                      )
                                      .map(
                                        (d: any) =>
                                          (d as { volume: number }).volume || 0
                                      )
                                  );

                                  const volumePercentage =
                                    (((data as { volume: number }).volume ||
                                      0) /
                                      maxVolume) *
                                    100;

                                  return (
                                    <div key={symbol} className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-medium text-muted-foreground w-4">
                                            #{index + 1}
                                          </span>
                                          <span className="text-sm font-medium">
                                            {symbol.replace("USDT", "")}
                                          </span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                          $
                                          {(
                                            (data as { volume: number })
                                              .volume || 0
                                          ).toLocaleString()}
                                        </span>
                                      </div>
                                      <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                          style={{
                                            width: `${volumePercentage}%`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            Loading volume data...
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {isAdmin && (
                    <TabsContent value="admin" className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Create Signal (Admin Only)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Ticker</Label>
                                <Input
                                  value={newSignal.ticker}
                                  onChange={(e) =>
                                    setNewSignal({
                                      ...newSignal,
                                      ticker: e.target.value,
                                    })
                                  }
                                  placeholder="BTCUSDT"
                                />
                              </div>
                              <div>
                                <Label>Signal Type</Label>
                                <Select
                                  value={newSignal.signalType}
                                  onValueChange={(value: "buy" | "sell") =>
                                    setNewSignal({
                                      ...newSignal,
                                      signalType: value,
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="buy">Buy</SelectItem>
                                    <SelectItem value="sell">Sell</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Price</Label>
                                <Input
                                  type="number"
                                  value={newSignal.price}
                                  onChange={(e) =>
                                    setNewSignal({
                                      ...newSignal,
                                      price: e.target.value,
                                    })
                                  }
                                  placeholder="0.00"
                                />
                              </div>
                              <div>
                                <Label>Timeframe</Label>
                                <Input
                                  value={newSignal.timeframe}
                                  onChange={(e) =>
                                    setNewSignal({
                                      ...newSignal,
                                      timeframe: e.target.value,
                                    })
                                  }
                                  placeholder="4H"
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Note (Optional)</Label>
                              <Input
                                value={newSignal.note}
                                onChange={(e) =>
                                  setNewSignal({
                                    ...newSignal,
                                    note: e.target.value,
                                  })
                                }
                                placeholder="Additional information"
                              />
                            </div>
                            <Button
                              onClick={handleCreateSignal}
                              disabled={createSignalMutation.isPending}
                            >
                              {createSignalMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Plus className="h-4 w-4 mr-2" />
                              )}
                              Create Signal
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}
                  <TabsContent value="signals" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>All Signals</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {signalsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : recentSignals.length > 0 ? (
                          <div className="space-y-3">
                            {recentSignals.map((signal) => {
                              const signalType = (
                                signal.signal_type ||
                                signal.signalType ||
                                "buy"
                              ).toLowerCase();
                              const isBuySignal =
                                signalType === "buy" || signalType === "long";
                              const timestamp =
                                signal.created_at ||
                                signal.timestamp ||
                                new Date().toISOString();

                              return (
                                <div
                                  key={signal.id}
                                  className="flex items-center justify-between p-3 bg-muted rounded"
                                >
                                  <div className="flex items-center space-x-3">
                                    {isBuySignal ? (
                                      <TrendingUp className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <TrendingDown className="h-4 w-4 text-red-500" />
                                    )}
                                    <div>
                                      <span className="font-medium">
                                        {signal.ticker}
                                      </span>
                                      <span
                                        className={`ml-2 text-sm ${
                                          isBuySignal
                                            ? "text-green-500"
                                            : "text-red-500"
                                        }`}
                                      >
                                        {signalType.toUpperCase()}
                                      </span>
                                      {signal.timeframe && (
                                        <span className="ml-2 text-xs text-muted-foreground">
                                          {signal.timeframe}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium">
                                      $
                                      {signal.price.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {formatDistanceToNow(
                                        new Date(timestamp),
                                        {
                                          addSuffix: true,
                                        }
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No signals available
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
