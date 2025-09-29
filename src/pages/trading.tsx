import React, { useState, useEffect, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import Sidebar from "../components/layout/Sidebar";

// Lazy load TradingView chart component
const TradingViewWidget = lazy(() => import("../components/charts/TradingViewWidget"));
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Loader2,
  AlertCircle
} from "lucide-react";

export default function TradingPage() {
  const { user } = useAuth();
  const [selectedTicker, setSelectedTicker] = useState("BTCUSDT");
  const [chartLoaded, setChartLoaded] = useState(false);
  const [priceAnimationKey, setPriceAnimationKey] = useState(0);

  // Fetch market data with reasonable polling interval
  const { data: marketData } = useQuery({
    queryKey: [`/api/public/market/price/${selectedTicker}`],
    refetchInterval: 30000, // Update every 30 seconds instead of 2 seconds
    refetchOnWindowFocus: false, // Prevent polling bursts when switching tabs
    staleTime: 15000, // Consider data fresh for 15 seconds
  });

  // Fetch real trading signals from database
  const { data: signals } = useQuery({
    queryKey: ['/api/signals/recent'],
    refetchInterval: 60000, // Update every minute instead of 3 seconds
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  const currentPrice = (marketData as any)?.price || 0;
  const priceChange = (marketData as any)?.changePercent || 0;
  const priceChangeAbs = (marketData as any)?.change || 0;
  const volume24h = (marketData as any)?.volume || 0;
  const high24h = (marketData as any)?.high || 0;
  const low24h = (marketData as any)?.low || 0;

  // Trigger price animation when price changes
  useEffect(() => {
    setPriceAnimationKey(prev => prev + 1);
  }, [currentPrice]);

  // Chart loading simulation
  useEffect(() => {
    const timer = setTimeout(() => setChartLoaded(true), 1500);
    return () => clearTimeout(timer);
  }, []);


  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-auto ml-0 lg:ml-64">
        {/* Header */}
        <div className="border-b bg-card/50 backdrop-blur-sm p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 lg:gap-4 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base lg:text-lg shrink-0">
                  B
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">BTC-USDT</h1>
                  <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">Bitcoin</p>
                </div>
              </div>
              
              <div className="hidden md:flex items-center gap-3 lg:gap-6 overflow-x-auto scrollbar-hide">
                <div className="min-w-[90px] sm:min-w-[100px]">
                  <p className="text-xs lg:text-sm text-muted-foreground">Last Price</p>
                  <motion.div
                    key={priceAnimationKey}
                    initial={{ scale: 0.95, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="text-base sm:text-lg lg:text-xl font-bold"
                  >
                    ${currentPrice.toLocaleString()}
                  </motion.div>
                </div>
                <div className="min-w-[90px] sm:min-w-[100px]">
                  <p className="text-xs lg:text-sm text-muted-foreground">24h Change</p>
                  <motion.div 
                    key={`change-${priceAnimationKey}`}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={`flex items-center gap-1 ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}
                  >
                    <motion.div
                      animate={{ rotate: priceChange >= 0 ? 0 : 180 }}
                      transition={{ duration: 0.2 }}
                    >
                      {priceChange >= 0 ? <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4" /> : <TrendingDown className="h-3 w-3 lg:h-4 lg:w-4" />}
                    </motion.div>
                    <span className="font-medium text-sm lg:text-base">{priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%</span>
                  </motion.div>
                </div>
                <div className="min-w-[80px]">
                  <p className="text-xs lg:text-sm text-muted-foreground">24h High</p>
                  <p className="font-medium text-sm lg:text-base">${high24h > 0 ? high24h.toLocaleString() : 'Loading...'}</p>
                </div>
                <div className="min-w-[80px]">
                  <p className="text-xs lg:text-sm text-muted-foreground">24h Low</p>
                  <p className="font-medium text-sm lg:text-base">${low24h > 0 ? low24h.toLocaleString() : 'Loading...'}</p>
                </div>
                <div className="min-w-[80px]">
                  <p className="text-xs lg:text-sm text-muted-foreground">24h Volume</p>
                  <p className="font-medium text-sm lg:text-base">{volume24h > 0 ? volume24h.toLocaleString() : 'Loading...'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-only price info */}
        <div className="md:hidden p-3 border-b bg-card/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Last Price</p>
              <p className="text-lg font-bold">${currentPrice.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">24h Change</p>
              <div className={`flex items-center gap-1 ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {priceChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span className="font-medium text-sm">{priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Chart Area */}
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
                          <div className="text-sm text-muted-foreground">Loading TradingView Chart...</div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: chartLoaded ? 1 : 0.5 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full"
                  >
                    <Suspense fallback={<div className="h-[400px] w-full bg-muted animate-pulse rounded-lg flex items-center justify-center"><div className="text-muted-foreground">Loading TradingView Chart...</div></div>}>
                      <TradingViewWidget 
                        symbol={`BINANCE:${selectedTicker}`}
                        theme="dark"
                        height={600}
                        interval="1D"
                        showSignals={true}
                      />
                    </Suspense>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          
          {/* Signals Section */}
          <div className="p-3 sm:p-4 lg:p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Card className="border-2 border-cyan-400 bg-gradient-to-br from-cyan-900/80 via-blue-900/80 to-purple-900/80 shadow-2xl mb-6">
                <CardHeader className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-t-lg">
                  <CardTitle className="text-white font-bold drop-shadow-lg flex items-center gap-2">
                    <Activity className="w-6 h-6" />
                    Signals
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="border-2 border-yellow-400 bg-gradient-to-r from-orange-400/20 to-yellow-400/20 shadow-lg rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-400 animate-pulse" />
                        <p className="text-orange-100 font-medium text-sm">
                          Live trading signals from our analytics system. This data is for informational purposes only.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {(signals as any[])?.length > 0 ? (signals as any[]).slice(0, 6).map((signal: any, index: number) => (
                        <motion.div
                          key={signal.id || index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className={`flex items-center justify-between p-4 border-2 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 ${
                            signal.signalType === 'buy' 
                              ? 'border-green-400 bg-gradient-to-r from-green-500/20 to-emerald-500/20' 
                              : 'border-red-400 bg-gradient-to-r from-red-500/20 to-pink-500/20'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <Badge 
                              variant={signal.signalType === "buy" ? "default" : "destructive"} 
                              className={`${
                                signal.signalType === 'buy' 
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' 
                                  : 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700'
                              } shadow-lg font-bold`}
                            >
                              {signal.signalType === 'buy' ? 'BUY' : 'SELL'}
                            </Badge>
                            <div>
                              <h4 className="font-bold text-white drop-shadow">{signal.ticker}</h4>
                              <p className="text-sm text-cyan-200 font-semibold">
                                ${parseFloat(signal.price).toLocaleString()} • {signal.timeframe || '1H'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-bold text-yellow-300">Confidence:</span>
                              <Badge variant="outline" className="border-2 border-yellow-400 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-yellow-100 font-bold">
                                {signal.confidence || 85}%
                              </Badge>
                            </div>
                          </div>
                        </motion.div>
                      )) : (
                        <div className="text-center py-8 text-cyan-200">
                          <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                          <p>Loading live signals...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

        </div>

      </div>
    </div>
  );
}
