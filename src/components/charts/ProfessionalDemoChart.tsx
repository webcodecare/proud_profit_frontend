import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, BarChart3, Zap, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OHLCData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface SignalMarker {
  id: string;
  type: 'buy' | 'sell';
  price: number;
  timestamp: string;
  confidence: number;
}

interface ProfessionalDemoChartProps {
  title?: string;
  symbol?: string;
  className?: string;
}

export default function ProfessionalDemoChart({ 
  title = "Bitcoin Professional Chart", 
  symbol = "BTCUSDT",
  className = ""
}: ProfessionalDemoChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [currentPrice, setCurrentPrice] = useState(67234.56);
  const [priceChange, setPriceChange] = useState(2.34);
  const [volume, setVolume] = useState(1234567890);
  const [signals, setSignals] = useState<SignalMarker[]>([]);
  const [marketStatus, setMarketStatus] = useState<'bullish' | 'bearish' | 'neutral'>('bullish');

  // Professional OHLC data simulation
  const [ohlcData, setOhlcData] = useState<OHLCData[]>([
    { timestamp: '09:00', open: 66800, high: 67200, low: 66500, close: 67000, volume: 1200000 },
    { timestamp: '09:15', open: 67000, high: 67500, low: 66900, close: 67300, volume: 1350000 },
    { timestamp: '09:30', open: 67300, high: 67800, low: 67100, close: 67600, volume: 1100000 },
    { timestamp: '09:45', open: 67600, high: 68200, low: 67400, close: 67900, volume: 1800000 },
    { timestamp: '10:00', open: 67900, high: 68500, low: 67700, close: 68200, volume: 2100000 },
    { timestamp: '10:15', open: 68200, high: 68800, low: 67950, close: 68400, volume: 1650000 },
    { timestamp: '10:30', open: 68400, high: 68900, low: 68100, close: 67800, volume: 1900000 },
    { timestamp: '10:45', open: 67800, high: 68300, low: 67300, close: 67600, volume: 2200000 },
    { timestamp: '11:00', open: 67600, high: 68100, low: 67200, close: 67900, volume: 1750000 },
    { timestamp: '11:15', open: 67900, high: 68400, low: 67600, close: 68100, volume: 1450000 },
    { timestamp: '11:30', open: 68100, high: 68600, low: 67800, close: 68300, volume: 1600000 },
    { timestamp: '11:45', open: 68300, high: 68800, low: 68000, close: 68200, volume: 1300000 },
  ]);

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      const variation = (Math.random() - 0.5) * 400;
      const newPrice = Math.max(65000, Math.min(70000, currentPrice + variation));
      const change = ((newPrice - 67000) / 67000) * 100;
      const newVolume = Math.floor(Math.random() * 500000000) + 800000000;
      
      setCurrentPrice(newPrice);
      setPriceChange(change);
      setVolume(newVolume);
      
      // Update market status
      if (Math.abs(change) > 1.5) {
        setMarketStatus(change > 0 ? 'bullish' : 'bearish');
      } else {
        setMarketStatus('neutral');
      }

      // Update OHLC data
      setOhlcData(prev => {
        const newCandle: OHLCData = {
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }).slice(0, 5),
          open: prev[prev.length - 1].close,
          high: newPrice + Math.random() * 300,
          low: newPrice - Math.random() * 300,
          close: newPrice,
          volume: newVolume / 1000
        };
        return [...prev.slice(1), newCandle];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [currentPrice]);

  // Generate trading signals
  useEffect(() => {
    const generateSignal = () => {
      const signal: SignalMarker = {
        id: `signal-${Date.now()}`,
        type: Math.random() > 0.6 ? 'buy' : 'sell',
        price: currentPrice,
        timestamp: new Date().toISOString(),
        confidence: Math.floor(Math.random() * 30) + 70
      };
      
      setSignals(prev => [...prev.slice(-2), signal]);
    };

    // Initial signals
    setSignals([
      { id: '1', type: 'buy', price: 66500, timestamp: '2025-01-09T10:30:00Z', confidence: 85 },
      { id: '2', type: 'sell', price: 68200, timestamp: '2025-01-09T11:45:00Z', confidence: 78 },
    ]);

    const signalInterval = setInterval(generateSignal, 12000);
    return () => clearInterval(signalInterval);
  }, [currentPrice]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1000000000) return `${(vol / 1000000000).toFixed(1)}B`;
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
    return vol.toString();
  };

  return (
    <Card className={`professional-chart relative overflow-hidden ${className}`}>
      {/* Header */}
      <CardHeader className="pb-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              <div className="text-xs text-slate-300">{symbol} • Professional View</div>
            </div>
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
              LIVE
            </Badge>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold">{formatPrice(currentPrice)}</div>
            <div className={`text-sm flex items-center justify-end ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChange >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Chart Area */}
        <div className="relative h-80 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
          {/* Professional Chart Simulation */}
          <div className="absolute inset-0 p-4">
            <div className="h-full w-full relative">
              {/* Grid Background */}
              <svg className="absolute inset-0 w-full h-full opacity-20">
                <defs>
                  <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              {/* Candlestick Chart Simulation */}
              <div className="flex items-end justify-between h-full pt-8 pb-12">
                {ohlcData.slice(-8).map((candle, index) => {
                  const isGreen = candle.close > candle.open;
                  const height = Math.random() * 60 + 20;
                  
                  return (
                    <div key={index} className="flex flex-col items-center space-y-1">
                      {/* Candlestick */}
                      <div className="relative">
                        {/* Wick */}
                        <div 
                          className={`w-0.5 ${isGreen ? 'bg-green-500' : 'bg-red-500'} mx-auto`}
                          style={{ height: `${height + 10}px` }}
                        />
                        {/* Body */}
                        <div 
                          className={`w-3 ${isGreen ? 'bg-green-500' : 'bg-red-500'} absolute top-2 left-1/2 transform -translate-x-1/2`}
                          style={{ height: `${height * 0.6}px` }}
                        />
                      </div>
                      
                      {/* Volume Bar */}
                      <div 
                        className={`w-2 ${isGreen ? 'bg-green-500/30' : 'bg-red-500/30'}`}
                        style={{ height: `${(candle.volume / 3000000) * 20}px` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Signal Markers */}
              <AnimatePresence>
                {signals.map((signal, index) => (
                  <motion.div
                    key={signal.id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className={`absolute ${signal.type === 'buy' ? 'bottom-16' : 'top-16'} transform -translate-x-1/2`}
                    style={{ left: `${20 + index * 15}%` }}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold
                      ${signal.type === 'buy' ? 'bg-green-500' : 'bg-red-500'} shadow-lg`}>
                      {signal.type === 'buy' ? '↑' : '↓'}
                    </div>
                    <div className={`absolute top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-xs
                      ${signal.type === 'buy' ? 'bg-green-500' : 'bg-red-500'} text-white whitespace-nowrap`}>
                      {signal.type.toUpperCase()} {signal.confidence}%
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Live Status Indicator */}
              <div className="absolute top-4 right-4 flex items-center space-x-2 bg-black/80 text-white px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium">STREAMING</span>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Footer Stats */}
        <div className="bg-slate-900 text-white p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xs text-slate-400">24h Volume</div>
              <div className="text-sm font-semibold">{formatVolume(volume)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Market Status</div>
              <div className={`text-sm font-semibold capitalize ${
                marketStatus === 'bullish' ? 'text-green-400' : 
                marketStatus === 'bearish' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {marketStatus}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Signals</div>
              <div className="text-sm font-semibold">{signals.length}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Timeframe</div>
              <div className="text-sm font-semibold">15M</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}