import React, { useEffect, useRef, useState } from 'react';

interface BuySellSignalChartProps {
  height?: number;
  className?: string;
}

interface OHLCData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface AlertSignal {
  id: string;
  ticker: string;
  signalType: 'buy' | 'sell';
  price: number;
  timestamp: string;
  timeframe: string;
  notes?: string;
}

export default function BuySellSignalChart({ 
  height = 700, 
  className = '' 
}: BuySellSignalChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [ohlcData, setOhlcData] = useState<OHLCData[]>([]);
  const [signals, setSignals] = useState<AlertSignal[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);

  // Sample buy/sell signals for demonstration
  const sampleSignals = [
    {
      id: '1',
      ticker: 'BTCUSDT',
      signalType: 'buy' as const,
      price: 65000,
      timestamp: '2024-01-15T00:00:00Z',
      timeframe: '1W',
      notes: 'Strong support level'
    },
    {
      id: '2',
      ticker: 'BTCUSDT',
      signalType: 'sell' as const,
      price: 73000,
      timestamp: '2024-03-10T00:00:00Z',
      timeframe: '1W',
      notes: 'Resistance breakout'
    },
    {
      id: '3',
      ticker: 'BTCUSDT',
      signalType: 'buy' as const,
      price: 58000,
      timestamp: '2024-05-20T00:00:00Z',
      timeframe: '1W',
      notes: 'Oversold bounce'
    },
    {
      id: '4',
      ticker: 'BTCUSDT',
      signalType: 'sell' as const,
      price: 69000,
      timestamp: '2024-08-15T00:00:00Z',
      timeframe: '1W',
      notes: 'Profit taking zone'
    },
    {
      id: '5',
      ticker: 'BTCUSDT',
      signalType: 'buy' as const,
      price: 95000,
      timestamp: '2024-11-01T00:00:00Z',
      timeframe: '1W',
      notes: 'Bull market continuation'
    }
  ];

  // Load chart data
  const loadChartData = async () => {
    try {
      // Only show "connecting" on first load or after multiple failures
      if (isLoading || consecutiveFailures > 2) {
        setConnectionStatus('connecting');
      }
      setError(null);

      const [ohlcResponse, priceResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://bitcoin-api.solvemeet.com'}/api/public/ohlc?symbol=BTCUSDT&interval=1w&limit=104`).then(r => r.json()),
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://bitcoin-api.solvemeet.com'}/api/public/market/price/BTCUSDT`).then(r => r.json())
      ]);

      if (ohlcResponse?.data?.length) {
        setOhlcData(ohlcResponse.data);
      }

      if (priceResponse?.price) {
        setCurrentPrice(priceResponse.price);
      }

      // Use sample signals for now
      setSignals(sampleSignals);

      setConnectionStatus('connected');
      setIsLoading(false);
      setLastUpdate(new Date());
      setConsecutiveFailures(0);

    } catch (error) {
      console.error('Error loading chart data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      setConsecutiveFailures(prev => prev + 1);
      // Only show error status after multiple consecutive failures
      if (consecutiveFailures > 5) {
        setConnectionStatus('error');
      }
      setIsLoading(false);
    }
  };

  // Draw chart on canvas
  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || !ohlcData.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;
    const padding = 60;

    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Calculate price range
    const prices = ohlcData.flatMap(d => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // Chart dimensions
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Draw grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    
    // Horizontal lines
    for (let i = 0; i <= 10; i++) {
      const y = padding + (chartHeight / 10) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Vertical lines
    for (let i = 0; i <= 20; i++) {
      const x = padding + (chartWidth / 20) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Draw price labels
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 10; i++) {
      const price = maxPrice - (priceRange / 10) * i;
      const y = padding + (chartHeight / 10) * i;
      ctx.fillText(`$${price.toLocaleString()}`, padding - 10, y + 4);
    }

    // Draw candlesticks
    const candleWidth = chartWidth / ohlcData.length * 0.8;
    
    ohlcData.forEach((candle, index) => {
      const x = padding + (chartWidth / ohlcData.length) * index + (chartWidth / ohlcData.length) * 0.1;
      
      const openY = padding + ((maxPrice - candle.open) / priceRange) * chartHeight;
      const closeY = padding + ((maxPrice - candle.close) / priceRange) * chartHeight;
      const highY = padding + ((maxPrice - candle.high) / priceRange) * chartHeight;
      const lowY = padding + ((maxPrice - candle.low) / priceRange) * chartHeight;

      const isGreen = candle.close > candle.open;
      
      // Draw wick
      ctx.strokeStyle = isGreen ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, highY);
      ctx.lineTo(x + candleWidth / 2, lowY);
      ctx.stroke();

      // Draw body
      ctx.fillStyle = isGreen ? '#22c55e' : '#ef4444';
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY);
      ctx.fillRect(x, bodyTop, candleWidth, Math.max(bodyHeight, 1));
    });

    // Draw buy/sell signals
    signals.forEach(signal => {
      // Find the closest candle by date
      const signalDate = new Date(signal.timestamp);
      let closestIndex = 0;
      let minDiff = Math.abs(new Date(ohlcData[0].time).getTime() - signalDate.getTime());
      
      ohlcData.forEach((candle, index) => {
        const diff = Math.abs(new Date(candle.time).getTime() - signalDate.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = index;
        }
      });

      const x = padding + (chartWidth / ohlcData.length) * closestIndex + (chartWidth / ohlcData.length) * 0.5;
      const signalY = padding + ((maxPrice - signal.price) / priceRange) * chartHeight;

      // Draw signal marker
      ctx.fillStyle = signal.signalType === 'buy' ? '#10b981' : '#f59e0b';
      ctx.beginPath();
      
      if (signal.signalType === 'buy') {
        // Buy arrow (pointing up)
        ctx.moveTo(x, signalY - 15);
        ctx.lineTo(x - 8, signalY - 5);
        ctx.lineTo(x + 8, signalY - 5);
      } else {
        // Sell arrow (pointing down)
        ctx.moveTo(x, signalY + 15);
        ctx.lineTo(x - 8, signalY + 5);
        ctx.lineTo(x + 8, signalY + 5);
      }
      
      ctx.closePath();
      ctx.fill();

      // Removed text labels for cleaner appearance
    });

    // Draw current price line
    if (currentPrice) {
      const currentY = padding + ((maxPrice - currentPrice) / priceRange) * chartHeight;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padding, currentY);
      ctx.lineTo(width - padding, currentY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Current price label
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Current: $${currentPrice.toLocaleString()}`, padding + 10, currentY - 10);
    }
  };

  // Draw chart when data updates
  useEffect(() => {
    if (!isLoading && ohlcData.length > 0) {
      setTimeout(drawChart, 100);
    }
  }, [ohlcData, signals, currentPrice, isLoading]);

  // Load data on mount and set up real-time updates
  useEffect(() => {
    loadChartData();
    const interval = setInterval(loadChartData, 30000); // Reduced frequency to 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!isLoading && ohlcData.length > 0) {
        setTimeout(drawChart, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isLoading, ohlcData]);

  if (error) {
    return (
      <div className={`p-8 bg-slate-800 rounded-lg ${className}`}>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Buy/Sell Signal Chart
          </h2>
          <div className="text-red-400 mb-4">⚠️ {error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 border-b border-slate-600">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-white mb-2">
            Bitcoin Buy/Sell Signals - Past 2 Years
          </h2>
          <p className="text-slate-300">
            Interactive chart showing our trading algorithm's buy/sell signals with real market data
          </p>
        </div>
        
        {/* Status indicators */}
        <div className="flex justify-center items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-slate-300 font-medium">Live Data</span>
          </div>
          
          {currentPrice && (
            <div className="text-slate-300">
              Bitcoin: <span className="text-green-400 font-bold">${currentPrice.toLocaleString()}</span>
            </div>
          )}
          
          <div className="text-slate-300">
            Signals: <span className="text-orange-400 font-bold">{signals.length}</span>
          </div>
          
          <div className="text-slate-400">
            Updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800 z-10">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-300">Loading trading signals...</p>
            </div>
          </div>
        )}
        
        <div ref={chartContainerRef} className="relative">
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: `${height}px` }}
            className="bg-slate-900 rounded-b-lg"
          />
        </div>
      </div>

      {/* Simplified Legend - only essential information */}
      <div className="p-4 bg-slate-700 border-t border-slate-600">
        <div className="flex flex-wrap justify-center items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-green-500"></div>
            <span className="text-slate-300">Buy Signal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-yellow-500"></div>
            <span className="text-slate-300">Sell Signal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-yellow-400" style={{background: 'repeating-linear-gradient(to right, #fbbf24 0, #fbbf24 5px, transparent 5px, transparent 10px)'}}></div>
            <span className="text-slate-300">Current Price</span>
          </div>
        </div>
      </div>
    </div>
  );
}