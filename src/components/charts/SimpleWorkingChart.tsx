import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface SimpleWorkingChartProps {
  symbol?: string;
  height?: number;
}

interface OHLC {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface MarketData {
  price: number;
  change24h?: number;
  volume24h?: number;
}

export default function SimpleWorkingChart({ 
  symbol = 'BTCUSDT', 
  height = 400 
}: SimpleWorkingChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  
  // Fetch market data
  const { data: marketData } = useQuery({
    queryKey: [`/api/public/market/price/${symbol}`],
    refetchInterval: 5000,
  });

  // Fetch OHLC data
  const { data: ohlcData } = useQuery({
    queryKey: [`/api/public/market/ohlc/${symbol}?interval=1w&limit=100`],
    refetchInterval: 30000,
  });

  const price = (marketData as MarketData)?.price || 0;
  const change24h = (marketData as MarketData)?.change24h || 0;
  const ohlcArray = ((ohlcData as any)?.data as OHLC[]) || [];

  // Debug logging
  console.log('Chart Debug:', { 
    symbol, 
    marketData, 
    ohlcData, 
    price, 
    change24h, 
    ohlcArrayLength: ohlcArray.length 
  });

  useEffect(() => {
    if (price > 0) {
      setCurrentPrice(price);
    }
  }, [price]);

  // Draw simple candlestick chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ohlcArray.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (ohlcArray.length === 0) return;

    const padding = 40;
    const chartWidth = rect.width - 2 * padding;
    const chartHeight = rect.height - 2 * padding;

    // Calculate price range
    const prices = ohlcArray.flatMap(d => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // Draw candlesticks
    const candleWidth = chartWidth / ohlcArray.length * 0.8;
    
    ohlcArray.forEach((candle, index) => {
      const x = padding + (index * chartWidth / ohlcArray.length) + (chartWidth / ohlcArray.length - candleWidth) / 2;
      
      // Normalize prices to canvas coordinates
      const openY = padding + ((maxPrice - candle.open) / priceRange) * chartHeight;
      const closeY = padding + ((maxPrice - candle.close) / priceRange) * chartHeight;
      const highY = padding + ((maxPrice - candle.high) / priceRange) * chartHeight;
      const lowY = padding + ((maxPrice - candle.low) / priceRange) * chartHeight;

      // Determine candle color
      const isGreen = candle.close > candle.open;
      ctx.strokeStyle = isGreen ? '#22c55e' : '#ef4444';
      ctx.fillStyle = isGreen ? '#22c55e' : '#ef4444';

      // Draw high-low line
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, highY);
      ctx.lineTo(x + candleWidth / 2, lowY);
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw candle body
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY);
      
      if (bodyHeight < 2) {
        // For doji candles, draw a line
        ctx.beginPath();
        ctx.moveTo(x, openY);
        ctx.lineTo(x + candleWidth, openY);
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.fillRect(x, bodyTop, candleWidth, bodyHeight);
      }
    });

    // Draw price labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    
    // Draw max price
    ctx.fillText(maxPrice.toFixed(2), rect.width - padding + 35, padding + 15);
    
    // Draw min price  
    ctx.fillText(minPrice.toFixed(2), rect.width - padding + 35, rect.height - padding - 5);
    
    // Draw current price
    if (currentPrice > 0) {
      const currentY = padding + ((maxPrice - currentPrice) / priceRange) * chartHeight;
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padding, currentY);
      ctx.lineTo(rect.width - padding, currentY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = '#3b82f6';
      ctx.fillText(currentPrice.toFixed(2), rect.width - padding + 35, currentY + 5);
    }

  }, [ohlcData, currentPrice]);

  return (
    <div className="space-y-4">
      {/* Price Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{symbol}</h3>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-foreground">
                  ${currentPrice.toLocaleString()}
                </span>
                {change24h !== 0 && (
                  <Badge variant={change24h >= 0 ? 'default' : 'destructive'} className="flex items-center space-x-1">
                    {change24h >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>
                      {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                    </span>
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Live</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Price Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full" style={{ height: `${height}px` }}>
            <canvas
              ref={canvasRef}
              className="w-full h-full border border-border rounded"
              style={{ background: '#1a1a1a' }}
            />
            {ohlcArray.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading chart data...</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Symbol: {symbol} | API Status: {marketData ? 'Connected' : 'Waiting...'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Market Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Market Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Price</p>
              <p className="font-semibold">${currentPrice.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">24h Change</p>
              <p className={`font-semibold ${change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data Points</p>
              <p className="font-semibold">{ohlcArray.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-semibold text-green-500">Live</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}