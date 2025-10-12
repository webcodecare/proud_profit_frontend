import React, { useState, useEffect, lazy, Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import SidebarWithSubscription from "../components/layout/SidebarWithSubscription";
import { buildApiUrl } from "../lib/config";
import { apiRequest } from "../lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Loader2, BarChart3 } from "lucide-react";

// Lazy load components
const TradingViewWidget = lazy(
  () => import("../components/charts/TradingViewWidget")
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
  const queryClient = useQueryClient();

  // State management
  const [selectedTicker, setSelectedTicker] = useState("BTCUSDT");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1W");
  const [chartLoaded, setChartLoaded] = useState(false);
  const [priceAnimationKey, setPriceAnimationKey] = useState(0);
  const [activeSection, setActiveSection] = useState<"chart" | "signals">(
    "chart"
  );
  const [recentSignals, setRecentSignals] = useState<AlertSignal[]>([]);
  const [selectedChart, setSelectedChart] = useState<string>("BTCUSDT");

  // Fetch available tickers from API
  const { data: tickersData } = useQuery({
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
  const { data: watchlistData } = useQuery({
    queryKey: ["/api/watchlist"],
    queryFn: () => apiRequest("/api/watchlist"),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

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

  // Fetch trading signals
  const { data: signalsResponse } = useQuery({
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

  const getTradingViewInterval = () => {
    const timeframe = TIMEFRAMES.find((tf) => tf.value === selectedTimeframe);
    console.log(timeframe?.tvValue, "timeframe?.tvValue");
    return timeframe?.tvValue || "W";
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

  return (
    <div className="flex flex-col h-screen bg-background">
      <SidebarWithSubscription />

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
      </div>
    </div>
  );
}
