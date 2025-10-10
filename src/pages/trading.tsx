import React, { useState, useEffect, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import SidebarWithSubscription from "../components/layout/SidebarWithSubscription";
import { buildApiUrl } from "../lib/config";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";

// Lazy load TradingView chart component
const TradingViewWidget = lazy(
  () => import("../components/charts/TradingViewWidget")
);
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
  AlertCircle,
  BarChart3,
  Star,
} from "lucide-react";

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

interface WatchlistItem {
  id: string;
  symbol: string;
  name?: string;
  is_active: boolean;
  sort_order: number;
  added_at: string;
}

export default function TradingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTicker, setSelectedTicker] = useState("BTCUSDT");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1D");
  const [chartLoaded, setChartLoaded] = useState(false);
  const [priceAnimationKey, setPriceAnimationKey] = useState(0);
  const [operatingSymbol, setOperatingSymbol] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"chart" | "signals">(
    "chart"
  );

  // Fetch available tickers from API - all dynamic data
  const { data: tickersData, isLoading: tickersLoading } = useQuery({
    queryKey: ["/api/tickers"],
    queryFn: async () => {
      const response = await fetch(buildApiUrl("/api/tickers"));
      if (!response.ok) throw new Error("Failed to fetch tickers");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
  });

  const tickers = Array.isArray(tickersData) ? tickersData : [];

  // Get current ticker info
  const currentTicker = tickers.find((t) => t.symbol === selectedTicker);

  // Fetch real-time market data with reasonable polling
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

  // Fetch real trading signals from database for selected ticker
  const { data: signalsResponse, isLoading: signalsLoading } = useQuery({
    queryKey: [`/api/public/signals/alerts`, selectedTicker],
    queryFn: async () => {
      const response = await fetch(
        buildApiUrl(
          `/api/public/signals/alerts?ticker=${selectedTicker}&limit=10`
        )
      );
      if (!response.ok) throw new Error("Failed to fetch signals");
      const data = await response.json();
      return Array.isArray(data) ? data : data.signals || data.data || [];
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const signals = Array.isArray(signalsResponse) ? signalsResponse : [];

  // Fetch user's watchlist from database
  const { data: watchlistData, isLoading: watchlistLoading } = useQuery({
    queryKey: ["/api/watchlist"],
    queryFn: () => apiRequest("/api/watchlist"),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });

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

  // Handle ticker selection - now using database
  const handleTickerToggle = (symbol: string, name?: string) => {
    const selectedTickers =
      watchlistData?.watchlist?.map((item: WatchlistItem) => item.symbol) || [];

    if (selectedTickers.includes(symbol)) {
      // Remove from watchlist
      removeFromWatchlistMutation.mutate(symbol);
    } else {
      // Add to watchlist
      addToWatchlistMutation.mutate({ symbol, name });
    }
  };

  const currentPrice = (marketData as any)?.price || 0;
  const priceChange = (marketData as any)?.changePercent || 0;
  const priceChangeAbs = (marketData as any)?.change || 0;
  const volume24h = (marketData as any)?.volume || 0;
  const high24h = (marketData as any)?.high || 0;
  const low24h = (marketData as any)?.low || 0;

  // Trigger price animation when price changes
  useEffect(() => {
    setPriceAnimationKey((prev) => prev + 1);
  }, [currentPrice]);

  // Chart loading simulation
  useEffect(() => {
    setChartLoaded(false);
    const timer = setTimeout(() => setChartLoaded(true), 1000);
    return () => clearTimeout(timer);
  }, [selectedTicker, selectedTimeframe]);

  // Get TradingView interval format
  const getTradingViewInterval = () => {
    const timeframe = TIMEFRAMES.find((tf) => tf.value === selectedTimeframe);
    return timeframe?.tvValue || "D";
  };

  // Function to refresh all data for chart section
  const refreshChartData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/tickers"] });
    queryClient.invalidateQueries({
      queryKey: [`/api/public/market/price/${selectedTicker}`],
    });
    queryClient.invalidateQueries({
      queryKey: [`/api/public/signals/alerts`, selectedTicker],
    });
  };

  // Function to refresh all data for signals section
  const refreshSignalsData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
    queryClient.invalidateQueries({ queryKey: ["/api/tickers"] });
    queryClient.invalidateQueries({
      queryKey: [`/api/public/signals/alerts`, selectedTicker],
    });
  };

  // Handle section switching with data refresh
  const handleSectionSwitch = (section: "chart" | "signals") => {
    setActiveSection(section);

    if (section === "chart") {
      refreshChartData();
    } else if (section === "signals") {
      refreshSignalsData();
    }
  };

  // Add effect to refresh data when user comes back to the page
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

  return (
    <div className="flex h-screen bg-background">
      <SidebarWithSubscription />

      <div className="flex-1 flex flex-col overflow-auto ml-0 lg:ml-64">
        {/* Header with Title and Controls */}
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

            {/* Controls Row */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Ticker Selection */}
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="ticker-select" className="text-xs mb-1.5 block">
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
                        {ticker.baseAsset || ticker.symbol.replace("USDT", "")}{" "}
                        - {ticker.description || ticker.name || ticker.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Timeframe Selection */}
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
                    ${currentPrice > 0 ? currentPrice.toLocaleString() : "0"}
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

        {/* Tab Navigation */}
        <div className="border-b p-3 sm:p-4 lg:p-6 pt-0">
          <div className="flex bg-gray-100 rounded-lg p-1 max-w-fit">
            <button
              onClick={() => handleSectionSwitch("chart")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeSection === "chart"
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Buy/Sell Chart
            </button>
            <button
              onClick={() => handleSectionSwitch("signals")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeSection === "signals"
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Signals & Watchlist
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Chart Section - Only show when chart tab is active */}
          {activeSection === "chart" && (
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
          )}

          {/* Signals & Watchlist Section - Only show when signals tab is active */}
          {activeSection === "signals" && (
            <div className="p-3 sm:p-4 lg:p-6">
              {/* Watchlist Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="mb-6"
              >
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
                        {(tickers || []).slice(0, 12).map((ticker: any) => {
                          const selectedTickers =
                            watchlistData?.watchlist?.map(
                              (item: WatchlistItem) => item.symbol
                            ) || [];
                          const isSelected = selectedTickers.includes(
                            ticker.symbol
                          );
                          const isCurrentlyOperating =
                            operatingSymbol === ticker.symbol;
                          const isAnyOperationInProgress =
                            operatingSymbol !== null;

                          return (
                            <button
                              key={ticker.symbol}
                              onClick={() =>
                                handleTickerToggle(
                                  ticker.symbol,
                                  ticker.baseAsset ||
                                    ticker.name ||
                                    ticker.symbol.replace("USDT", "")
                                )
                              }
                              disabled={isAnyOperationInProgress}
                              className={`
                                px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200
                                ${
                                  isSelected
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background border-border hover:bg-muted"
                                }
                                ${
                                  isAnyOperationInProgress &&
                                  !isCurrentlyOperating
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:scale-105"
                                }
                                flex items-center justify-center gap-2
                              `}
                            >
                              {isCurrentlyOperating && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              )}
                              {isSelected && !isCurrentlyOperating && (
                                <Star className="h-4 w-4 fill-current" />
                              )}
                              {ticker.baseAsset ||
                                ticker.name ||
                                ticker.symbol.replace("USDT", "")}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Watchlist Summary */}
                    {!watchlistLoading && watchlistData?.watchlist && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            {watchlistData.watchlist.length} cryptocurrencies in
                            your watchlist
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
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <Card className="border-2 border-cyan-400 bg-gradient-to-br from-cyan-900/80 via-blue-900/80 to-purple-900/80 shadow-2xl mb-6">
                  <CardHeader className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-t-lg">
                    <CardTitle className="text-white font-bold drop-shadow-lg flex items-center gap-2">
                      <Activity className="w-6 h-6" />
                      Recent Signals - {selectedTicker}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="border-2 border-yellow-400 bg-gradient-to-r from-orange-400/20 to-yellow-400/20 shadow-lg rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-400 animate-pulse" />
                          <p className="text-orange-100 font-medium text-sm">
                            Live trading signals from our analytics system. This
                            data is for informational purposes only.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {signalsLoading ? (
                          <div className="text-center py-8 text-cyan-200">
                            <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                            <p>Loading signals for {selectedTicker}...</p>
                          </div>
                        ) : signals?.length > 0 ? (
                          signals
                            .slice(0, 6)
                            .map((signal: any, index: number) => {
                              const signalType =
                                signal.signal_type ||
                                signal.signalType ||
                                "buy";
                              const isBuy =
                                signalType.toLowerCase() === "buy" ||
                                signalType.toLowerCase() === "long";
                              const timestamp =
                                signal.created_at ||
                                signal.timestamp ||
                                new Date().toISOString();

                              return (
                                <motion.div
                                  key={signal.id || index}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{
                                    duration: 0.3,
                                    delay: index * 0.1,
                                  }}
                                  className={`flex items-center justify-between p-4 border-2 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 ${
                                    isBuy
                                      ? "border-green-400 bg-gradient-to-r from-green-500/20 to-emerald-500/20"
                                      : "border-red-400 bg-gradient-to-r from-red-500/20 to-pink-500/20"
                                  }`}
                                >
                                  <div className="flex items-center space-x-4">
                                    <Badge
                                      variant={
                                        isBuy ? "default" : "destructive"
                                      }
                                      className={`${
                                        isBuy
                                          ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                                          : "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
                                      } shadow-lg font-bold`}
                                    >
                                      {isBuy ? "BUY" : "SELL"}
                                    </Badge>
                                    <div>
                                      <h4 className="font-bold text-white drop-shadow">
                                        {signal.ticker}
                                      </h4>
                                      <p className="text-sm text-cyan-200 font-semibold">
                                        $
                                        {parseFloat(
                                          signal.price
                                        ).toLocaleString()}{" "}
                                        •{" "}
                                        {signal.timeframe || selectedTimeframe}
                                      </p>
                                      {signal.note || signal.notes ? (
                                        <p className="text-xs text-cyan-300 mt-1">
                                          {signal.note || signal.notes}
                                        </p>
                                      ) : null}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-cyan-300">
                                      {new Date(timestamp).toLocaleDateString()}{" "}
                                      {new Date(timestamp).toLocaleTimeString()}
                                    </p>
                                    <p className="text-xs text-cyan-400 mt-1">
                                      {signal.source || "System"}
                                    </p>
                                  </div>
                                </motion.div>
                              );
                            })
                        ) : (
                          <div className="text-center py-8 text-cyan-200">
                            <Activity className="w-8 h-8 mx-auto mb-2" />
                            <p>No signals available for {selectedTicker}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
