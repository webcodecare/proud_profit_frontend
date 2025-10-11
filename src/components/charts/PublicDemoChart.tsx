import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, BarChart3, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SignalMarker {
  id: string;
  type: 'buy' | 'sell';
  price: number;
  timestamp: string;
  x: number;
  y: number;
}

interface PublicDemoChartProps {
  title?: string;
  symbol?: string;
  className?: string;
}

export default function PublicDemoChart({ 
  title = "Bitcoin Live Chart", 
  symbol = "BTCUSDT",
  className = ""
}: PublicDemoChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPrice, setCurrentPrice] = useState(67234.56);
  const [priceChange, setPriceChange] = useState(2.34);
  const [signals, setSignals] = useState<SignalMarker[]>([]);
  const [isAnimating, setIsAnimating] = useState(true);
  const [volume, setVolume] = useState(1234567);
  const [trend, setTrend] = useState<'up' | 'down' | 'sideways'>('up');

  // Enhanced OHLC data with more realistic market movement
  const [sampleData, setSampleData] = useState([
    { timestamp: '09:00', open: 66800, high: 67200, low: 66500, close: 67000, volume: 1200000 },
    { timestamp: '09:30', open: 67000, high: 67500, low: 66900, close: 67300, volume: 1350000 },
    { timestamp: '10:00', open: 67300, high: 67800, low: 67100, close: 67600, volume: 1100000 },
    { timestamp: '10:30', open: 67600, high: 68200, low: 67400, close: 67900, volume: 1800000 },
    { timestamp: '11:00', open: 67900, high: 68500, low: 67700, close: 68200, volume: 2100000 },
    { timestamp: '11:30', open: 68200, high: 68800, low: 67950, close: 68400, volume: 1650000 },
    { timestamp: '12:00', open: 68400, high: 68900, low: 68100, close: 67800, volume: 1900000 },
    { timestamp: '12:30', open: 67800, high: 68300, low: 67300, close: 67600, volume: 2200000 },
    { timestamp: '13:00', open: 67600, high: 68100, low: 67200, close: 67900, volume: 1750000 },
    { timestamp: '13:30', open: 67900, high: 68400, low: 67600, close: 68100, volume: 1450000 },
    { timestamp: '14:00', open: 68100, high: 68600, low: 67800, close: 68300, volume: 1600000 },
    { timestamp: '14:30', open: 68300, high: 68800, low: 68000, close: 68200, volume: 1300000 },
  ]);

  // Simulate live price updates with realistic market behavior
  useEffect(() => {
    const interval = setInterval(() => {
      const variation = (Math.random() - 0.5) * 300; // ±150 price variation
      const newPrice = Math.max(65000, Math.min(70000, currentPrice + variation));
      const change = ((newPrice - 67000) / 67000) * 100;
      const newVolume = Math.floor(Math.random() * 1000000) + 800000;
      
      // Update trend based on price movement
      if (Math.abs(change) > 1) {
        setTrend(change > 0 ? 'up' : 'down');
      } else {
        setTrend('sideways');
      }
      
      setCurrentPrice(newPrice);
      setPriceChange(change);
      setVolume(newVolume);

      // Update chart data with new candle
      setSampleData(prev => {
        const newCandle = {
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }).slice(0, 5),
          open: prev[prev.length - 1].close,
          high: newPrice + Math.random() * 200,
          low: newPrice - Math.random() * 200,
          close: newPrice,
          volume: newVolume
        };
        return [...prev.slice(1), newCandle]; // Keep same number of candles
      });
    }, 2500); // Faster updates for more dynamic feel

    return () => clearInterval(interval);
  }, [currentPrice]);

  // Generate simulated trading signals
  useEffect(() => {
    const generateSignal = () => {
      const newSignal: SignalMarker = {
        id: `signal-${Date.now()}`,
        type: Math.random() > 0.5 ? 'buy' : 'sell',
        price: currentPrice,
        timestamp: new Date().toISOString(),
        x: Math.random() * 350 + 50, // Random x position
        y: Math.random() * 200 + 50,  // Random y position
      };

      setSignals(prev => [...prev.slice(-4), newSignal]); // Keep last 5 signals
    };

    // Generate initial signals
    const initialSignals: SignalMarker[] = [
      { id: '1', type: 'buy', price: 66500, timestamp: '2025-01-09T10:30:00Z', x: 100, y: 80 },
      { id: '2', type: 'sell', price: 68200, timestamp: '2025-01-09T11:45:00Z', x: 200, y: 120 },
      { id: '3', type: 'buy', price: 67800, timestamp: '2025-01-09T13:15:00Z', x: 300, y: 100 },
    ];
    setSignals(initialSignals);

    // Generate new signal every 8 seconds for more activity
    const signalInterval = setInterval(generateSignal, 8000);
    
    return () => clearInterval(signalInterval);
  }, [currentPrice]);

  // Draw the chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw professional background grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
    ctx.lineWidth = 0.5;
    
    // Vertical grid lines
    for (let i = 0; i <= 12; i++) {
      const x = (rect.width / 12) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
    }
    
    // Horizontal grid lines  
    for (let i = 0; i <= 8; i++) {
      const y = (rect.height / 8) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }

    // Calculate price ranges first
    const maxPrice = Math.max(...sampleData.map(d => d.high));
    const minPrice = Math.min(...sampleData.map(d => d.low));
    const priceRange = maxPrice - minPrice || 1; // Prevent division by zero

    // Draw price levels
    const currentPriceY = rect.height - ((currentPrice - minPrice) / priceRange) * rect.height;
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, currentPriceY);
    ctx.lineTo(rect.width, currentPriceY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw candlestick chart
    const candleWidth = rect.width / sampleData.length * 0.6;

    // Draw enhanced candlesticks with volume bars
    sampleData.forEach((candle, index) => {
      const x = (rect.width / sampleData.length) * index + candleWidth / 2;
      const openY = rect.height - ((candle.open - minPrice) / priceRange) * rect.height;
      const closeY = rect.height - ((candle.close - minPrice) / priceRange) * rect.height;
      const highY = rect.height - ((candle.high - minPrice) / priceRange) * rect.height;
      const lowY = rect.height - ((candle.low - minPrice) / priceRange) * rect.height;

      const isGreen = candle.close > candle.open;
      
      // Draw volume bar at bottom (scaled)
      const volumeHeight = (candle.volume / 2500000) * (rect.height * 0.15);
      ctx.fillStyle = isGreen ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';
      ctx.fillRect(x - candleWidth / 4, rect.height - volumeHeight, candleWidth / 2, volumeHeight);
      
      // Draw enhanced wick
      ctx.strokeStyle = isGreen ? '#10b981' : '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Draw enhanced body with gradients
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY) || 2;
      
      // Create gradient for candle body
      const gradient = ctx.createLinearGradient(0, bodyTop, 0, bodyTop + bodyHeight);
      if (isGreen) {
        gradient.addColorStop(0, '#22c55e');
        gradient.addColorStop(1, '#16a34a');
      } else {
        gradient.addColorStop(0, '#ef4444');
        gradient.addColorStop(1, '#dc2626');
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      
      // Add subtle border
      ctx.strokeStyle = isGreen ? '#15803d' : '#b91c1c';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // Draw trend line
    if (sampleData.length > 1) {
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      sampleData.forEach((candle, index) => {
        const x = (rect.width / sampleData.length) * index + candleWidth / 2;
        const closeY = rect.height - ((candle.close - minPrice) / priceRange) * rect.height;
        
        if (index === 0) {
          ctx.moveTo(x, closeY);
        } else {
          ctx.lineTo(x, closeY);
        }
      });
      
      ctx.stroke();
    }

    // Draw signal markers
    signals.forEach((signal) => {
      const x = signal.x;
      const y = signal.y;
      
      // Draw signal triangle
      ctx.fillStyle = signal.type === 'buy' ? '#10b981' : '#ef4444';
      ctx.beginPath();
      if (signal.type === 'buy') {
        // Up triangle for buy
        ctx.moveTo(x, y - 8);
        ctx.lineTo(x - 6, y + 4);
        ctx.lineTo(x + 6, y + 4);
      } else {
        // Down triangle for sell
        ctx.moveTo(x, y + 8);
        ctx.lineTo(x - 6, y - 4);
        ctx.lineTo(x + 6, y - 4);
      }
      ctx.closePath();
      ctx.fill();

      // Draw signal border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

  }, [signals, sampleData, currentPrice]);

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant="secondary" className="text-xs">DEMO</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-2xl font-bold">${currentPrice.toLocaleString()}</div>
              <div className={`text-sm flex items-center ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {priceChange >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative h-64">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          />
          
          {/* Live Signal Indicator */}
          {isAnimating && (
            <div className="absolute top-4 right-4 flex items-center space-x-2 bg-black/80 text-white px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">LIVE SIGNALS</span>
            </div>
          )}

          {/* Recent Signal Alert */}
          {signals.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-4 bg-black/90 text-white px-3 py-2 rounded-lg border border-gray-600"
            >
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${signals[signals.length - 1].type === 'buy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs font-medium">
                  Latest: {signals[signals.length - 1].type.toUpperCase()} ${signals[signals.length - 1].price.toFixed(0)}
                </span>
              </div>
            </motion.div>
          )}

          {/* Volume and Trend Indicator */}
          <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-2 rounded-lg">
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <BarChart3 className="h-3 w-3" />
                <span>Vol: {(volume / 1000000).toFixed(1)}M</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  trend === 'up' ? 'bg-green-500' : 
                  trend === 'down' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <span>{trend.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Chart Footer with Stats */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 dark:text-gray-400">
                24h Vol: {(volume / 1000000).toFixed(1)}M
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                Signals: {signals.length}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'}>
                {trend === 'up' ? 'Bullish' : trend === 'down' ? 'Bearish' : 'Neutral'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Live Data
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}