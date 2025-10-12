import React, { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface TradingViewWidgetProps {
  symbol?: string;
  theme?: "light" | "dark";
  height?: number;
  interval?: string;
  showSignals?: boolean;
}

interface Signal {
  id: string;
  ticker: string;
  signalType: "buy" | "sell";
  price: number;
  timestamp: string;
  timeframe: string;
  notes?: string;
}

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  source: string;
}

// Declare TradingView global for TypeScript
declare global {
  interface Window {
    TradingView: any;
  }
}

export default function TradingViewWidget({
  symbol = "BINANCE:BTCUSDT",
  theme = "dark",
  height = 600,
  interval = "1W",
  showSignals = true,
}: TradingViewWidgetProps) {
  const widgetRef = useRef<HTMLDivElement>(null);

  // Helpers to map between parent interval (TradingView format) and select values
  const propToSelect = (iv?: string) => {
    if (!iv) return "1W";
    if (/^\d+$/.test(iv)) return iv; // numeric intervals like 30,60,240
    if (iv === "D") return "1D";
    if (iv === "W") return "1W";
    if (iv === "M") return "1M";
    return iv;
  };

  const selectToEmbed = (sel?: string) => {
    if (!sel) return "W";
    if (/^\d+$/.test(sel)) return sel; // numeric stays numeric
    if (sel === "1D") return "D";
    if (sel === "1W") return "W";
    if (sel === "1M") return "M";
    return sel;
  };

  const [selectedTimeframe, setSelectedTimeframe] = useState(
    propToSelect(interval)
  );

  // Extract ticker from symbol (BINANCE:BTCUSDT -> BTCUSDT)
  const ticker = symbol.includes(":") ? symbol.split(":")[1] : symbol;

  // Supported timeframes for TradingView (admin-controlled)
  const supportedTimeframes = [
    { value: "30", label: "30 Minutes" },
    { value: "60", label: "1 Hour" },
    { value: "240", label: "4 Hours" },
    { value: "480", label: "8 Hours" },
    { value: "720", label: "12 Hours" },
    { value: "1D", label: "1D" },
    { value: "1W", label: "1W" },
    { value: "1M", label: "1 Month" },
  ];

  // Fetch current market data with optimized polling
  const { data: marketData } = useQuery({
    queryKey: [`/api/public/market/price/${ticker}`],
    refetchInterval: 60000, // Update every minute instead of 5 seconds
    refetchOnWindowFocus: false, // Prevent polling bursts when switching tabs
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Fetch signals for this ticker and timeframe
  const { data: signalsData } = useQuery({
    queryKey: [`/api/signals/${ticker}`, selectedTimeframe],
    refetchInterval: 120000, // Update every 2 minutes instead of 10 seconds
    staleTime: 60000, // Consider data fresh for 1 minute
  });

  const signals = (signalsData as any)?.signals || [];
  const marketPrice = (marketData as MarketData)?.price || 0;
  const priceChange = (marketData as MarketData)?.change || 0;
  const priceChangePercent = (marketData as MarketData)?.changePercent || 0;

  // Load TradingView widget
  useEffect(() => {
    if (!widgetRef.current) return;

    const container = widgetRef.current;
    container.innerHTML = ""; // Clear previous widget

    // Create widget container
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    container.appendChild(widgetContainer);

    // Build embed config using embed-compatible interval
    const embedInterval = selectToEmbed(selectedTimeframe);
    const config = {
      autosize: false,
      symbol: symbol,
      interval: embedInterval,
      timezone: "Etc/UTC",
      theme: theme,
      style: "1",
      locale: "en",
      enable_publishing: false,
      withdateranges: true,
      range: "YTD",
      hide_side_toolbar: false,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
      width: "100%",
      height: height,
    };

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify(config);

    container.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [symbol, selectedTimeframe, theme, height]);

  // Handle timeframe changes
  const handleTimeframeChange = (newTimeframe: string) => {
    setSelectedTimeframe(newTimeframe);
  };

  return (
    <div className="space-y-4">
      {/* Chart Header with Live Price */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {ticker} Chart
          </h3>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>Price: ${marketPrice.toFixed(2)}</span>
            {marketPrice > 0 && (
              <span
                className={priceChange >= 0 ? "text-green-400" : "text-red-400"}
              >
                {priceChange >= 0 ? "+" : ""}
                {priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            <Activity className="w-3 h-3 mr-1" />
            Live
          </Badge>
          {showSignals && (
            <Badge variant="default">{signals.length} Signals</Badge>
          )}
        </div>
      </div>

      {/* Timeframe Selector */}
      <Card className="bg-card border-border mb-4">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-foreground">
              Timeframe:
            </label>
            <Select
              defaultValue="1W"
              value={selectedTimeframe}
              onValueChange={handleTimeframeChange}
            >
              <SelectTrigger className="w-48">
                <SelectValue>
                  {supportedTimeframes.find(
                    (tf) => tf.value === selectedTimeframe
                  )?.label ?? selectedTimeframe}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {supportedTimeframes.map((tf) => (
                  <SelectItem key={tf.value} value={tf.value}>
                    {tf.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* TradingView Chart Widget */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="tradingview-widget-container">
            <div ref={widgetRef} style={{ height: `${height}px` }} />
            <div className="tradingview-widget-copyright">
              <a
                href="https://www.tradingview.com/"
                rel="noopener nofollow"
                target="_blank"
              >
                <span className="text-xs text-muted-foreground">
                  Track all markets on TradingView
                </span>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Signals */}
      {showSignals && signals.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Recent Signals ({selectedTimeframe})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {signals.slice(0, 5).map((signal: Signal) => (
                <div
                  key={signal.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {signal.signalType === "buy" ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <Badge
                      variant={
                        signal.signalType === "buy" ? "default" : "destructive"
                      }
                    >
                      {signal.signalType?.toUpperCase() || "SIGNAL"}
                    </Badge>
                    <span className="font-medium text-foreground">
                      ${signal.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {signal.timeframe}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(signal.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
