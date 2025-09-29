import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, Activity, Settings, BarChart3, Monitor } from "lucide-react";

declare global {
  interface Window {
    TradingView: any;
  }
}

interface TradingTerminalProps {
  symbol?: string;
  height?: number;
}

export default function TradingTerminal({ symbol = "BINANCE:BTCUSDT", height = 600 }: TradingTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('15');
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [showOrderBook, setShowOrderBook] = useState(true);
  const [showTrades, setShowTrades] = useState(true);

  // Load TradingView script
  useEffect(() => {
    if (window.TradingView) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize TradingView Terminal
  useEffect(() => {
    if (isLoaded && containerRef.current && window.TradingView) {
      // Clear existing widget
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {
          console.warn('Error removing widget:', e);
        }
      }

      // Create new TradingView widget with professional terminal features
      widgetRef.current = new window.TradingView.widget({
        width: '100%',
        height: height - 60,
        symbol: symbol,
        interval: selectedTimeframe,
        timezone: 'Etc/UTC',
        theme: selectedTheme,
        style: '1', // Candlestick
        locale: 'en',
        toolbar_bg: selectedTheme === 'dark' ? '#1a1a1a' : '#ffffff',
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        container_id: containerRef.current.id,
        studies: [
          'Volume@tv-basicstudies',
          'RSI@tv-basicstudies',
          'MACD@tv-basicstudies',
          'MovingAverage@tv-basicstudies'
        ],
        overrides: {
          'paneProperties.background': selectedTheme === 'dark' ? '#0a0a0a' : '#ffffff',
          'paneProperties.vertGridProperties.color': selectedTheme === 'dark' ? '#2a2a2a' : '#e0e0e0',
          'paneProperties.horzGridProperties.color': selectedTheme === 'dark' ? '#2a2a2a' : '#e0e0e0',
          'symbolWatermarkProperties.transparency': 90,
          'scalesProperties.textColor': selectedTheme === 'dark' ? '#d1d5db' : '#374151',
          'mainSeriesProperties.candleStyle.upColor': '#22c55e',
          'mainSeriesProperties.candleStyle.downColor': '#ef4444',
          'mainSeriesProperties.candleStyle.borderUpColor': '#22c55e',
          'mainSeriesProperties.candleStyle.borderDownColor': '#ef4444',
          'mainSeriesProperties.candleStyle.wickUpColor': '#22c55e',
          'mainSeriesProperties.candleStyle.wickDownColor': '#ef4444',
        },
        loading_screen: {
          backgroundColor: selectedTheme === 'dark' ? '#0a0a0a' : '#ffffff',
          foregroundColor: selectedTheme === 'dark' ? '#ffffff' : '#000000'
        },
        disabled_features: [
          'use_localstorage_for_settings',
          'save_chart_properties_to_local_storage',
          'header_symbol_search'
        ],
        enabled_features: [
          'study_templates',
          'side_toolbar_in_fullscreen_mode',
          'header_chart_type',
          'header_resolutions',
          'header_screenshot',
          'header_undo_redo',
          'header_fullscreen_button',
          'use_localstorage_for_settings'
        ]
      });
    }
  }, [isLoaded, symbol, selectedTimeframe, selectedTheme, height]);

  const timeframes = [
    { value: '1', label: '1m' },
    { value: '5', label: '5m' },
    { value: '15', label: '15m' },
    { value: '1H', label: '1h' },
    { value: '4H', label: '4h' },
    { value: '1D', label: '1D' },
    { value: '1W', label: '1W' }
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Professional Trading Terminal
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600">
              <Activity className="h-3 w-3 mr-1" />
              Live Market Data
            </Badge>
            
            {/* Timeframe Selector */}
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeframes.map((tf) => (
                  <SelectItem key={tf.value} value={tf.value}>
                    {tf.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTheme(selectedTheme === 'dark' ? 'light' : 'dark')}
            >
              {selectedTheme === 'dark' ? '🌙' : '☀️'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* TradingView Chart Container */}
        <div className="relative">
          <div 
            id={`tradingview-terminal-${Math.random().toString(36).substr(2, 9)}`}
            ref={containerRef}
            style={{ height: height - 60 }}
            className="w-full"
          >
            {!isLoaded && (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading Professional Trading Terminal...</p>
                  <p className="text-xs text-muted-foreground mt-2">Powered by TradingView</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Access Controls */}
          {isLoaded && (
            <div className="absolute top-2 left-2 flex gap-1 z-10">
              <Button size="sm" variant="secondary" className="text-xs h-6">
                <BarChart3 className="h-3 w-3 mr-1" />
                Chart
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-6">
                📊 Depth
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-6">
                📈 Screener
              </Button>
            </div>
          )}
        </div>

        {/* Terminal Footer with Symbol Info */}
        <div className="p-3 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="font-medium">{symbol.replace('BINANCE:', '').replace('USDT', '/USDT')}</span>
              <Badge variant="outline" className="text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +2.34%
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>Volume: 24.5B</span>
              <span>24h Change: +$1,567</span>
              <span>Last Update: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}