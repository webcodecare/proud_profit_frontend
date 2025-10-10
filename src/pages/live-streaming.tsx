import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
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
  Users,
  Zap,
  PlayCircle,
  PauseCircle,
} from "lucide-react";

interface StreamingStatus {
  websocket: {
    connected: number;
    status: "active" | "idle";
  };
  tickers: {
    enabled: number;
    symbols: string[];
  };
  signals: {
    recent: number;
    lastSignal: string | null;
  };
  server: {
    uptime: number;
    memory: any;
  };
}

interface LiveSignal {
  id: string;
  symbol: string;
  signalType: "buy" | "sell";
  price: number;
  timestamp: string;
  source: string;
  note?: string;
}

export default function LiveStreamingPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [liveSignals, setLiveSignals] = useState<LiveSignal[]>([]);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  // Fetch streaming status with reasonable polling
  const {
    data: streamingStatus,
    isLoading,
    refetch,
  } = useQuery<StreamingStatus>({
    queryKey: ["/api/admin/live-streaming"],
    queryFn: () => apiRequest("/api/admin/live-streaming"),
    refetchInterval: (data) =>
      data?.isActivelyStreaming || isStreaming ? 30000 : false, // Only poll when streaming
    refetchOnWindowFocus: false, // Prevent unnecessary polling bursts when switching tabs
    staleTime: 15000, // Consider data fresh for 15 seconds
  });

  // WebSocket connection
  useEffect(() => {
    if (isStreaming) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [isStreaming]);

  const connectWebSocket = () => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setConnectionAttempts(0);
        toast({
          title: "Connected",
          description: "Live data stream connected",
        });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("WebSocket message received:", message);

          if (message.type === "signal") {
            const signal = message.data as LiveSignal;
            setLiveSignals((prev) => [signal, ...prev.slice(0, 49)]); // Keep last 50 signals

            toast({
              title: `${signal.signalType.toUpperCase()} Signal`,
              description: `${signal.symbol} at $${Number(
                signal.price
              ).toLocaleString()}`,
              variant: signal.signalType === "buy" ? "default" : "destructive",
            });
          } else if (message.type === "connection") {
            console.log("WebSocket connection confirmed:", message.message);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        if (isStreaming && connectionAttempts < 5) {
          // Auto-reconnect with exponential backoff
          setTimeout(() => {
            setConnectionAttempts((prev) => prev + 1);
            connectWebSocket();
          }, Math.pow(2, connectionAttempts) * 1000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to live data stream",
          variant: "destructive",
        });
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      toast({
        title: "Connection Failed",
        description: "Unable to establish WebSocket connection",
        variant: "destructive",
      });
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  };

  const toggleStreaming = () => {
    setIsStreaming(!isStreaming);
  };

  const sendTestSignal = async () => {
    try {
      await apiRequest("/api/admin/live-streaming/test", {
        method: "POST",
        body: JSON.stringify({
          symbol: "BTCUSDT",
          signalType: Math.random() > 0.5 ? "buy" : "sell",
        }),
      });

      toast({
        title: "Test Signal Sent",
        description: "Test signal broadcasted to all connected clients",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test signal",
        variant: "destructive",
      });
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatMemory = (bytes: number) => {
    return `${Math.round(bytes / 1024 / 1024)}MB`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar className="hidden lg:block lg:w-64" />

        {/* Main Content */}
        <div className="flex-1 lg:ml-64">
          {/* Header */}
          <Header
            title="Live Data Streaming"
            subtitle="Real-time market data and signal broadcasting"
          >
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              className="mr-2"
            >
              <Activity className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
            <Button
              onClick={toggleStreaming}
              variant={isStreaming ? "destructive" : "default"}
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
          </Header>

          {/* Content */}
          <div className="p-4 lg:p-6 space-y-6">
            {/* Connection Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    WebSocket
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
                    {streamingStatus?.websocket?.connected || 0} clients
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
                    {streamingStatus?.tickers?.enabled || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enabled symbols
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Recent Signals
                  </CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {streamingStatus?.signals?.recent || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last 24 hours
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Server Status
                  </CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-purple-600">
                    {streamingStatus?.server
                      ? formatUptime(streamingStatus.server.uptime)
                      : "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {streamingStatus?.server?.memory
                      ? formatMemory(streamingStatus.server.memory.heapUsed)
                      : "N/A"}{" "}
                    used
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Stream Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Stream Controls</span>
                  <Badge
                    variant={
                      streamingStatus?.websocket?.status === "active"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {streamingStatus?.websocket?.status === "active"
                      ? "Active"
                      : "Idle"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium mb-2">
                      Enabled Symbols
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {streamingStatus?.tickers?.symbols?.map((symbol) => (
                        <Badge
                          key={symbol}
                          variant="outline"
                          className="font-mono"
                        >
                          {symbol}
                        </Badge>
                      )) || (
                        <span className="text-muted-foreground text-sm">
                          No symbols enabled
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={sendTestSignal}
                      variant="outline"
                      size="sm"
                    >
                      Send Test Signal
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Last signal:{" "}
                      {streamingStatus?.signals?.lastSignal
                        ? new Date(
                            streamingStatus.signals.lastSignal
                          ).toLocaleTimeString()
                        : "None"}
                    </p>
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
                    <p>No live signals received</p>
                    <p className="text-sm mt-2">
                      {isConnected
                        ? "Waiting for signals..."
                        : "Connect to WebSocket to receive signals"}
                    </p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
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
                                {signal.symbol}
                              </Badge>
                              <Badge
                                variant={
                                  signal.signalType === "buy"
                                    ? "default"
                                    : "destructive"
                                }
                                className="ml-2"
                              >
                                {signal.signalType === "buy" ? (
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                )}
                                {signal.signalType.toUpperCase()}
                              </Badge>
                            </div>
                            <span className="text-lg font-bold">
                              ${signal.price.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>{signal.source}</span>
                            <span>
                              {new Date(signal.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          {signal.note && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {signal.note}
                            </p>
                          )}
                        </Card>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden lg:block">
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
                                  {signal.symbol}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <Badge
                                  variant={
                                    signal.signalType === "buy"
                                      ? "default"
                                      : "destructive"
                                  }
                                >
                                  {signal.signalType === "buy" ? (
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3 mr-1" />
                                  )}
                                  {signal.signalType.toUpperCase()}
                                </Badge>
                              </td>
                              <td className="p-4 font-bold text-lg">
                                ${signal.price.toLocaleString()}
                              </td>
                              <td className="p-4 text-sm text-muted-foreground">
                                {signal.source}
                              </td>
                              <td className="p-4 text-sm text-muted-foreground">
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
