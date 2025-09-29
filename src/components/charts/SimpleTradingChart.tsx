import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface SimpleTradingChartProps {
  symbol?: string;
  height?: number;
}

interface MarketData {
  symbol: string;
  price: number;
  change24h?: number;
}

export default function SimpleTradingChart({ 
  symbol = 'BTCUSDT',
  height = 300
}: SimpleTradingChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);

  // Extract ticker from symbol (BINANCE:BTCUSDT -> BTCUSDT)
  const ticker = symbol.includes(':') ? symbol.split(':')[1] : symbol;

  // Fetch current market data
  const { data: marketData } = useQuery({
    queryKey: [`/api/market/price/${ticker}`],
    refetchInterval: 5000, // Update every 5 seconds
  });

  // Update price history when new data arrives
  useEffect(() => {
    if (marketData?.price) {
      setPriceHistory(prev => {
        const newHistory = [...prev, marketData.price];
        // Keep last 50 data points
        return newHistory.slice(-50);
      });
    }
  }, [marketData]);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !priceHistory.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;

    // Clear canvas with TradingView-style background
    ctx.fillStyle = '#1e222d';
    ctx.fillRect(0, 0, width, height);

    if (priceHistory.length < 2) return;

    // Calculate price range
    const minPrice = Math.min(...priceHistory);
    const maxPrice = Math.max(...priceHistory);
    const priceRange = maxPrice - minPrice || 1;

    // Draw grid (TradingView style)
    ctx.strokeStyle = '#2a2e39';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw price line (TradingView blue)
    ctx.strokeStyle = '#2196f3';
    ctx.lineWidth = 2;
    ctx.beginPath();

    priceHistory.forEach((price, index) => {
      const x = (width / (priceHistory.length - 1)) * index;
      const y = height - ((price - minPrice) / priceRange) * height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw current price indicator
    if (priceHistory.length > 0) {
      const lastPrice = priceHistory[priceHistory.length - 1];
      const lastY = height - ((lastPrice - minPrice) / priceRange) * height;
      
      ctx.fillStyle = '#2196f3';
      ctx.beginPath();
      ctx.arc(width - 10, lastY, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, [priceHistory]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {ticker} Chart
          </span>
          {marketData && (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                ${marketData.price?.toLocaleString()}
              </span>
              {marketData.change24h && (
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
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full" style={{ height: `${height}px` }}>
          <canvas
            ref={canvasRef}
            className="w-full h-full border border-border rounded"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          Showing last {priceHistory.length} price points • Updates every 5 seconds
        </div>
      </CardContent>
    </Card>
  );
}