import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import {
  Radio,
  Wifi,
  WifiOff,
  Activity,
  TrendingUp,
  TrendingDown,
  Server,
  Zap,
  PlayCircle,
  PauseCircle,
  Database,
} from "lucide-react";

interface LiveSignal {
  id: string;
  ticker: string;
  signal_type: "buy" | "sell";
  price: string;
  timestamp: string;
  timeframe?: string;
  source: string;
  note?: string;
}

interface TickerPrice {
  symbol: string;
  price: number;
  change24h: number;
}

export default function LiveStreamingPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [liveSignals, setLiveSignals] = useState<LiveSignal[]>([]);
  const [tickerPrices, setTickerPrices] = useState<Record<string, TickerPrice>>({});
  const [activeChannel, setActiveChannel] = useState<any>(null);
  const binanceWsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  // Fetch recent signals from Supabase
  const { data: recentSignals, refetch: refetchSignals } = useQuery({
    queryKey: ["live-signals"],
    queryFn: async () => {
      if (!supabase) {
        console.log("Supabase not configured");
        return [];
      }

      const { data, error } = await supabase
        .from("alert_signals")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching signals:", error);
        return [];
      }

      console.log("📊 Fetched", data?.length || 0, "signals from Supabase");
      return (data as LiveSignal[]) || [];
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch available tickers
  const { data: availableTickers } = useQuery({
    queryKey: ["available-tickers"],
    queryFn: async () => {
      if (!supabase) return [];

      const { data, error } = await supabase
        .from("available_tickers")
        .select("symbol, description, is_enabled")
        .eq("is_enabled", true)
        .order("market_cap", { ascending: true });

      if (error) {
        console.error("Error fetching tickers:", error);
        return [];
      }

      return data || [];
    },
  });

  // Set initial signals
  useEffect(() => {
    if (recentSignals && recentSignals.length > 0) {
      setLiveSignals(recentSignals);
    }
  }, [recentSignals]);

  // Setup Supabase Realtime subscription
  useEffect(() => {
    if (!supabase || !isStreaming) return;

    console.log("🔔 Setting up Supabase Realtime for alert_signals");

    const channel = supabase
      .channel("live-streaming-signals")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alert_signals",
        },
        (payload) => {
          console.log("🔔 New signal received:", payload);
          const newSignal = payload.new as LiveSignal;

          setLiveSignals((prev) => [newSignal, ...prev.slice(0, 49)]);

          toast({
            title: `${newSignal.signal_type.toUpperCase()} Signal`,
            description: `${newSignal.ticker} at $${Number(newSignal.price).toLocaleString()}`,
            variant: newSignal.signal_type === "buy" ? "default" : "destructive",
          });
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          setActiveChannel(channel);
          toast({
            title: "✅ Connected",
            description: "Live signal stream is active",
          });
        }
      });

    return () => {
      console.log("🔌 Cleaning up Supabase Realtime subscription");
      if (supabase) {
        supabase.removeChannel(channel);
      }
      setIsConnected(false);
      setActiveChannel(null);
    };
  }, [isStreaming, toast]);

  // Connect to Binance WebSocket for real-time prices
  useEffect(() => {
    if (!isStreaming || !availableTickers || availableTickers.length === 0) return;

    const symbols = availableTickers.map(t => t.symbol.toLowerCase()).slice(0, 10); // Limit to 10 symbols
    const streams = symbols.map(s => `${s}@ticker`).join("/");
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;

    console.log("💰 Connecting to Binance WebSocket for prices:", symbols);

    binanceWsRef.current = new WebSocket(wsUrl);

    binanceWsRef.current.onopen = () => {
      console.log("✅ Connected to Binance WebSocket");
    };

    binanceWsRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.data && message.data.s) {
          const symbol = message.data.s;
          const price = parseFloat(message.data.c);
          const change24h = parseFloat(message.data.P);

          setTickerPrices(prev => ({
            ...prev,
            [symbol]: {
              symbol,
              price,
              change24h,
            }
          }));
        }
      } catch (error) {
        console.error("Error parsing Binance message:", error);
      }
    };

    binanceWsRef.current.onerror = (error) => {
      console.error("Binance WebSocket error:", error);
    };

    return () => {
      if (binanceWsRef.current) {
        binanceWsRef.current.close();
        binanceWsRef.current = null;
      }
    };
  }, [isStreaming, availableTickers]);

  const toggleStreaming = () => {
    setIsStreaming(!isStreaming);
  };

  const formatUptime = () => {
    const uptime = isStreaming ? Math.floor((Date.now() - (window as any).streamStart || Date.now()) / 1000) : 0;
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Track stream start time
  useEffect(() => {
    if (isStreaming && !(window as any).streamStart) {
      (window as any).streamStart = Date.now();
    } else if (!isStreaming) {
      (window as any).streamStart = null;
    }
  }, [isStreaming]);

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="flex">
        <Sidebar className="hidden lg:block lg:w-64" />

        {/* Main Content */}
        <div className="flex-1 lg:ml-64 overflow-x-hidden">
          {/* Header */}
          <Header
            title="Live Data Streaming"
            subtitle="Real-time market data and signal broadcasting"
          >
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  refetchSignals();
                  toast({ title: "Refreshed", description: "Data refreshed successfully" });
                }}
                size="sm"
              >
                <Activity className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={toggleStreaming}
                variant={isStreaming ? "destructive" : "default"}
                size="sm"
              >
                {isStreaming ? (
                  <>
                    <PauseCircle className="h-4 w-4 mr-2" />
                    Stop Stream
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Start Stream
                  </>
                )}
              </Button>
            </div>
          </Header>

          {/* Content */}
          <div className="p-4 lg:p-6 space-y-6">
            {/* Connection Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Supabase Realtime
                  </CardTitle>
                  {isConnected ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <Badge variant={isConnected ? "default" : "secondary"}>
                      {isConnected ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Live signal updates
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Tickers
                  </CardTitle>
                  <Radio className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {availableTickers?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enabled symbols
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Signals
                  </CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {liveSignals.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Received signals
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Stream Uptime
                  </CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-purple-600">
                    {formatUptime()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isStreaming ? "Active" : "Inactive"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Live Prices */}
            {Object.keys(tickerPrices).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Live Prices (Binance)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Object.values(tickerPrices).slice(0, 10).map((ticker) => (
                      <Card key={ticker.symbol} className="p-3">
                        <div className="text-xs font-mono text-muted-foreground mb-1">
                          {ticker.symbol}
                        </div>
                        <div className="text-lg font-bold">
                          ${ticker.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className={`text-xs ${ticker.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {ticker.change24h >= 0 ? '+' : ''}{ticker.change24h.toFixed(2)}%
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stream Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Stream Controls</span>
                  <Badge variant={isStreaming ? "default" : "secondary"}>
                    {isStreaming ? "Active" : "Idle"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Enabled Symbols
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {availableTickers?.slice(0, 15).map((ticker: any) => (
                        <Badge
                          key={ticker.symbol}
                          variant="outline"
                          className="font-mono"
                        >
                          {ticker.symbol}
                        </Badge>
                      )) || (
                        <span className="text-muted-foreground text-sm">
                          No symbols enabled
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Signals Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Live Signals Feed</span>
                  <Badge variant="secondary">
                    {liveSignals.length} signals
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {liveSignals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Radio className="h-12 w-12 mx-auto mb-4" />
                    <p>No signals received yet</p>
                    <p className="text-sm mt-2">
                      {isConnected
                        ? "Waiting for new signals from Supabase..."
                        : "Start streaming to receive live signals"}
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[600px] overflow-y-auto">
                    {/* Mobile View */}
                    <div className="lg:hidden p-4 space-y-4">
                      {liveSignals.map((signal) => (
                        <Card key={signal.id} className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <Badge
                                variant="outline"
                                className="font-mono text-sm"
                              >
                                {signal.ticker}
                              </Badge>
                              <Badge
                                variant={
                                  signal.signal_type === "buy"
                                    ? "default"
                                    : "destructive"
                                }
                                className="ml-2"
                              >
                                {signal.signal_type === "buy" ? (
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                )}
                                {signal.signal_type.toUpperCase()}
                              </Badge>
                            </div>
                            <span className="text-lg font-bold">
                              ${Number(signal.price).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>{signal.source}</span>
                            <span>
                              {new Date(signal.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          {signal.timeframe && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              {signal.timeframe}
                            </Badge>
                          )}
                          {signal.note && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {signal.note}
                            </p>
                          )}
                        </Card>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-4 font-medium text-muted-foreground">
                              Time
                            </th>
                            <th className="text-left p-4 font-medium text-muted-foreground">
                              Symbol
                            </th>
                            <th className="text-left p-4 font-medium text-muted-foreground">
                              Signal
                            </th>
                            <th className="text-left p-4 font-medium text-muted-foreground">
                              Price
                            </th>
                            <th className="text-left p-4 font-medium text-muted-foreground">
                              Timeframe
                            </th>
                            <th className="text-left p-4 font-medium text-muted-foreground">
                              Source
                            </th>
                            <th className="text-left p-4 font-medium text-muted-foreground">
                              Note
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {liveSignals.map((signal) => (
                            <tr
                              key={signal.id}
                              className="border-b hover:bg-muted/50 transition-colors"
                            >
                              <td className="p-4 text-sm text-muted-foreground">
                                {new Date(
                                  signal.timestamp
                                ).toLocaleTimeString()}
                              </td>
                              <td className="p-4">
                                <Badge variant="outline" className="font-mono">
                                  {signal.ticker}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <Badge
                                  variant={
                                    signal.signal_type === "buy"
                                      ? "default"
                                      : "destructive"
                                  }
                                >
                                  {signal.signal_type === "buy" ? (
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3 mr-1" />
                                  )}
                                  {signal.signal_type.toUpperCase()}
                                </Badge>
                              </td>
                              <td className="p-4 font-bold text-lg">
                                ${Number(signal.price).toLocaleString()}
                              </td>
                              <td className="p-4 text-sm">
                                {signal.timeframe && (
                                  <Badge variant="outline">
                                    {signal.timeframe}
                                  </Badge>
                                )}
                              </td>
                              <td className="p-4 text-sm text-muted-foreground">
                                {signal.source}
                              </td>
                              <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">
                                {signal.note || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
