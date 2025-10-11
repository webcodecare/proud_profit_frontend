import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface OHLCData {
  time: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Signal {
  id: string;
  ticker: string;
  signalType: 'BUY' | 'SELL';
  price: number;
  timestamp: string;
  notes?: string;
}

interface ProfessionalTradingChartProps {
  symbol: string;
  height?: number;
  className?: string;
  showSignals?: boolean;
}

export default function ProfessionalTradingChart({ 
  symbol, 
  height = 400, 
  className = '',
  showSignals = true 
}: ProfessionalTradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [signals, setSignals] = useState<Signal[]>([]);

  // Fetch OHLC data
  const { data: marketData, isLoading: marketLoading } = useQuery({
    queryKey: [`/api/market/klines/${symbol}`],
    refetchInterval: 30000,
  });

  // Fetch signals data
  const { data: signalData } = useQuery({
    queryKey: [`/api/signals`],
    enabled: showSignals,
  });

  // Process signals data
  useEffect(() => {
    if (signalData && Array.isArray(signalData)) {
      const filteredSignals = signalData
        .filter((signal: any) => signal.ticker === symbol.replace('USDT', ''))
        .map((signal: any) => ({
          id: signal.id,
          ticker: signal.ticker,
          signalType: signal.signalType.toUpperCase(),
          price: parseFloat(signal.price),
          timestamp: signal.timestamp || signal.createdAt,
          notes: signal.note
        }));
      setSignals(filteredSignals);
    }
  }, [signalData, symbol]);

  // WebSocket for real-time updates
  useWebSocket((message) => {
    if (message.type === "new_signal" && message.signal && showSignals) {
      const newSignal = {
        id: message.signal.id,
        ticker: message.signal.ticker,
        signalType: message.signal.signalType.toUpperCase(),
        price: parseFloat(message.signal.price),
        timestamp: message.signal.timestamp,
        notes: message.signal.note
      };
      setSignals(prev => [newSignal, ...prev].slice(0, 20)); // Keep last 20 signals
    }
  });

  useEffect(() => {
    if (!chartContainerRef.current || !marketData || marketData.length === 0) return;

    // Clear existing chart
    chartContainerRef.current.innerHTML = '';

    // Create professional canvas chart
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high DPI for crisp rendering
    const devicePixelRatio = window.devicePixelRatio || 1;
    const rect = chartContainerRef.current.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    chartContainerRef.current.appendChild(canvas);

    // Chart dimensions
    const padding = 60;
    const rightPadding = 100;
    const chartWidth = rect.width - padding - rightPadding;
    const chartHeight = height - (padding * 2);

    // Process market data
    const processedData = marketData.map((item: any, index: number) => ({
      time: new Date(item.time).getTime(),
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: parseFloat(item.volume || 0),
      x: padding + (index / (marketData.length - 1)) * chartWidth
    })).filter(d => !isNaN(d.open) && !isNaN(d.high) && !isNaN(d.low) && !isNaN(d.close));

    if (processedData.length === 0) return;

    // Calculate price range
    const prices = processedData.flatMap(d => [d.open, d.high, d.low, d.close]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const priceBuffer = priceRange * 0.05;

    const priceToY = (price: number) => {
      return padding + chartHeight - ((price - (minPrice - priceBuffer)) / (priceRange + 2 * priceBuffer)) * chartHeight;
    };

    // Professional dark theme background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#0f1419');
    bgGradient.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, rect.width, height);

    // Draw professional grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Horizontal grid lines with price levels
    const gridLevels = 8;
    for (let i = 0; i <= gridLevels; i++) {
      const price = minPrice + (priceRange * i / gridLevels);
      const y = priceToY(price);
      
      // Grid line
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Price labels
      ctx.fillStyle = '#8d9094';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`$${price.toLocaleString(undefined, { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
      })}`, padding + chartWidth + 8, y + 4);
    }

    // Vertical grid lines (time)
    const timeSteps = 6;
    for (let i = 0; i <= timeSteps; i++) {
      const x = padding + (i / timeSteps) * chartWidth;
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + chartHeight);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw professional candlesticks
    const candleWidth = Math.max(2, chartWidth / processedData.length * 0.7);
    
    processedData.forEach((candle, index) => {
      const x = candle.x;
      const bodyTop = priceToY(Math.max(candle.open, candle.close));
      const bodyBottom = priceToY(Math.min(candle.open, candle.close));
      const bodyHeight = Math.max(1, bodyBottom - bodyTop);
      const isGreen = candle.close > candle.open;

      // Professional wick lines
      ctx.strokeStyle = isGreen ? '#00d4aa' : '#ff4976';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, priceToY(candle.high));
      ctx.lineTo(x, priceToY(candle.low));
      ctx.stroke();

      // Candle body with professional colors
      if (isGreen) {
        ctx.fillStyle = '#00d4aa';
        ctx.strokeStyle = '#00b893';
      } else {
        ctx.fillStyle = '#ff4976';
        ctx.strokeStyle = '#e73c5e';
      }
      
      ctx.fillRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight);
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight);
    });

    // Draw buy/sell signals with professional styling
    if (showSignals && signals.length > 0) {
      signals.forEach((signal) => {
        const signalTime = new Date(signal.timestamp).getTime();
        
        // Find closest candle
        let closestIndex = -1;
        let minTimeDiff = Infinity;
        
        processedData.forEach((candle, index) => {
          const timeDiff = Math.abs(candle.time - signalTime);
          if (timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            closestIndex = index;
          }
        });

        if (closestIndex !== -1) {
          const candle = processedData[closestIndex];
          const x = candle.x;
          const y = priceToY(signal.price);
          const isBuy = signal.signalType === 'BUY';

          // Professional signal indicator
          ctx.shadowColor = isBuy ? '#00d4aa' : '#ff4976';
          ctx.shadowBlur = 8;
          
          // Signal circle
          ctx.fillStyle = isBuy ? '#00d4aa' : '#ff4976';
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, 2 * Math.PI);
          ctx.fill();

          ctx.shadowBlur = 0;

          // Signal icon
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(isBuy ? '▲' : '▼', x, y + 4);

          // Signal label with price
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'center';
          
          // Background for text
          const text = `${signal.signalType} $${signal.price.toLocaleString()}`;
          const metrics = ctx.measureText(text);
          const textWidth = metrics.width + 8;
          const textHeight = 16;
          const textX = x - textWidth/2;
          const textY = y + (isBuy ? 20 : -25);
          
          ctx.fillStyle = isBuy ? '#00d4aa' : '#ff4976';
          ctx.fillRect(textX, textY, textWidth, textHeight);
          
          ctx.fillStyle = '#ffffff';
          ctx.fillText(text, x, textY + 12);
        }
      });
    }

    // Professional chart header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${symbol.replace('USDT', '/USD')}`, padding, 35);

    // Current price and stats
    if (processedData.length > 0) {
      const lastCandle = processedData[processedData.length - 1];
      const firstCandle = processedData[0];
      const priceChange = lastCandle.close - firstCandle.open;
      const priceChangePercent = (priceChange / firstCandle.open) * 100;
      
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = priceChange >= 0 ? '#00d4aa' : '#ff4976';
      ctx.textAlign = 'right';
      
      const priceText = `$${lastCandle.close.toLocaleString()} (${priceChange >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%)`;
      ctx.fillText(priceText, rect.width - 20, 35);
      
      // Signal count indicator
      if (showSignals && signals.length > 0) {
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#8d9094';
        ctx.fillText(`${signals.length} signals`, rect.width - 20, 55);
      }
    }

  }, [marketData, signals, symbol, height, showSignals]);

  if (marketLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            {symbol.replace('USDT', '/USD')} Trading Chart
          </CardTitle>
          <CardDescription>Loading market data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const latestPrice = marketData && marketData.length > 0 
    ? parseFloat(marketData[marketData.length - 1]?.close || 0)
    : 0;

  const priceChange = marketData && marketData.length > 1
    ? latestPrice - parseFloat(marketData[0]?.open || 0)
    : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-xl">
              <Activity className="mr-2 h-6 w-6" />
              {symbol.replace('USDT', '/USD')} Professional Chart
            </CardTitle>
            <CardDescription>Real-time price data with trading signals</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              ${latestPrice.toLocaleString()}
            </div>
            <div className="flex items-center text-sm">
              {priceChange > 0 ? (
                <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1 text-red-500" />
              )}
              <span className={priceChange > 0 ? 'text-green-500' : 'text-red-500'}>
                {priceChange > 0 ? '+' : ''}{((priceChange / latestPrice) * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
        {showSignals && signals.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{signals.length} Active Signals</Badge>
            <Badge variant={signals[0]?.signalType === 'BUY' ? 'default' : 'destructive'}>
              Latest: {signals[0]?.signalType} at ${signals[0]?.price.toLocaleString()}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div ref={chartContainerRef} className="w-full" style={{ height: `${height}px` }} />
        {showSignals && (
          <div className="mt-4 text-xs text-muted-foreground">
            <p>• Green circles (▲): BUY signals • Red circles (▼): SELL signals</p>
            <p>• Signals show exact entry prices and timestamps for optimal trading decisions</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}