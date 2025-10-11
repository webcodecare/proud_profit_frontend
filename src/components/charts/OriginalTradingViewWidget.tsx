import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Activity, Play, Pause, Maximize2, Settings } from "lucide-react";

interface TradingViewWidgetProps {
  symbol?: string;
  theme?: 'light' | 'dark';
  height?: number;
  enableTrading?: boolean;
  showSignals?: boolean;
}

interface Signal {
  id: string;
  ticker: string;
  type: 'buy' | 'sell';
  price: string;
  timestamp: string;
  notes?: string;
}

interface MarketData {
  symbol: string;
  price: number;
  change24h?: number;
  volume24h?: number;
  high24h?: number;
  low24h?: number;
}

export default function OriginalTradingViewWidget({ 
  symbol = 'BINANCE:BTCUSDT',
  theme = 'dark',
  height = 400,
  enableTrading = false,
  showSignals = true
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeframe, setTimeframe] = useState('1D');
  const [chartType, setChartType] = useState('candlestick');
  const [priceHistory, setPriceHistory] = useState<number[]>([]);

  // Extract ticker from symbol (BINANCE:BTCUSDT -> BTCUSDT)
  const ticker = symbol.includes(':') ? symbol.split(':')[1] : symbol;

  // Fetch current market data
  const { data: marketData } = useQuery({
    queryKey: [`/api/market/price/${ticker}`],
    refetchInterval: isPlaying ? 3000 : false,
  });

  // Fetch signals data
  const { data: signals = [] } = useQuery({
    queryKey: [`/api/signals/${ticker}`],
    refetchInterval: 30000,
  });

  // Update price history when new data arrives
  useEffect(() => {
    if (marketData?.price) {
      setPriceHistory(prev => {
        const newHistory = [...prev, marketData.price];
        return newHistory.slice(-100); // Keep last 100 data points
      });
    }
  }, [marketData]);

  // Generate sample OHLC data for professional appearance
  const generateOHLCData = () => {
    // Use fallback price if no market data
    const basePrice = marketData?.price || 65000;
    
    const data = [];
    
    for (let i = 0; i < 50; i++) {
      const variation = (Math.random() - 0.5) * 0.02;
      const open = basePrice + (basePrice * variation * i * 0.1);
      const volatility = basePrice * 0.005;
      const high = open + Math.random() * volatility;
      const low = open - Math.random() * volatility;
      const close = low + Math.random() * (high - low);
      
      data.push({ open, high, low, close, volume: Math.random() * 1000000 });
    }
    
    return data;
  };

  // Draw professional TradingView-style chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;
    const chartHeight = height - 60; // Reserve space for controls

    // Clear canvas with TradingView dark background
    ctx.fillStyle = theme === 'dark' ? '#1e222d' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const ohlcData = generateOHLCData();
    if (!ohlcData || ohlcData.length === 0) return;

    // Calculate price range
    const prices = ohlcData.flatMap(d => [d.open, d.high, d.low, d.close]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Draw grid lines (TradingView style)
    ctx.strokeStyle = theme === 'dark' ? '#2a2e39' : '#e1e1e1';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 8; i++) {
      const y = (chartHeight / 8) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, chartHeight);
      ctx.stroke();
    }

    // Draw candlesticks
    const candleWidth = (width / ohlcData.length) * 0.8;
    ohlcData.forEach((candle, index) => {
      const x = (width / ohlcData.length) * index + (width / ohlcData.length) * 0.1;
      const openY = chartHeight - ((candle.open - minPrice) / priceRange) * chartHeight;
      const highY = chartHeight - ((candle.high - minPrice) / priceRange) * chartHeight;
      const lowY = chartHeight - ((candle.low - minPrice) / priceRange) * chartHeight;
      const closeY = chartHeight - ((candle.close - minPrice) / priceRange) * chartHeight;

      const isGreen = candle.close > candle.open;
      
      // Draw wick
      ctx.strokeStyle = isGreen ? '#26a69a' : '#ef5350';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, highY);
      ctx.lineTo(x + candleWidth / 2, lowY);
      ctx.stroke();

      // Draw body
      ctx.fillStyle = isGreen ? '#26a69a' : '#ef5350';
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY) || 1;
      ctx.fillRect(x, bodyTop, candleWidth, bodyHeight);
    });

    // Draw price labels on right side
    ctx.fillStyle = theme === 'dark' ? '#787b86' : '#666666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 8; i++) {
      const price = minPrice + (priceRange / 8) * (8 - i);
      const y = (chartHeight / 8) * i;
      ctx.fillText(`$${price.toFixed(2)}`, width - 5, y + 4);
    }

    // Draw signals if enabled
    if (showSignals && signals && signals.length > 0) {
      signals.slice(0, 3).forEach((signal: Signal, index: number) => {
        const x = width * 0.7 + (index * 60);
        const y = chartHeight * 0.2;
        
        // Signal marker
        ctx.fillStyle = signal.type === 'buy' ? '#26a69a' : '#ef5350';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Signal text
        ctx.fillStyle = theme === 'dark' ? '#ffffff' : '#000000';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(signal.type.toUpperCase(), x, y + 4);
      });
    }

    // Draw current price line
    if (marketData?.price) {
      const currentY = chartHeight - ((marketData.price - minPrice) / priceRange) * chartHeight;
      
      ctx.strokeStyle = '#ffb74d';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, currentY);
      ctx.lineTo(width, currentY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Current price label
      ctx.fillStyle = '#ffb74d';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`$${marketData.price.toFixed(2)}`, width - 10, currentY - 5);
    }

  }, [marketData, signals, theme, showSignals, timeframe]);

  return (
    <Card className="w-full bg-background border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            {ticker} • {timeframe}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {marketData && (
              <div className="flex items-center gap-3 text-sm">
                <span className="font-mono text-xl font-bold">
                  ${marketData.price?.toLocaleString()}
                </span>
                {marketData.change24h !== undefined && (
                  <span className={`flex items-center gap-1 ${
                    marketData.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {marketData.change24h >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {Math.abs(marketData.change24h).toFixed(2)}%
                  </span>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className="h-8 w-8 p-0"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Timeframe selector */}
        <div className="flex gap-1 mt-2">
          {['1m', '5m', '15m', '1h', '4h', '1D', '1W'].map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeframe(tf)}
              className="h-7 px-2 text-xs"
            >
              {tf}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div 
          ref={containerRef} 
          className="relative w-full border-t border-border"
          style={{ height: `${height}px` }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          />
          
          {/* Trading controls overlay */}
          {enableTrading && (
            <div className="absolute bottom-4 left-4 flex gap-2">
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                BUY ${marketData?.price?.toFixed(0)}
              </Button>
              <Button size="sm" variant="destructive">
                SELL ${marketData?.price?.toFixed(0)}
              </Button>
            </div>
          )}
          
          {/* Signal notifications */}
          {showSignals && signals && signals.length > 0 && (
            <div className="absolute top-4 right-4 space-y-2">
              {signals.slice(0, 2).map((signal: Signal) => (
                <div
                  key={signal.id}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    signal.type === 'buy' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-red-600 text-white'
                  }`}
                >
                  {signal.type.toUpperCase()} ${signal.price}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}