import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, UTCTimestamp, ColorType } from 'lightweight-charts';

interface WeeklySignalChartFixedProps {
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

export default function WeeklySignalChartFixed({ 
  height = 600, 
  className = '' 
}: WeeklySignalChartFixedProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Wait for DOM to be ready
    const initChart = () => {
      try {
        const container = chartContainerRef.current;
        if (!container) return;

        // Clear any existing chart
        if (chartRef.current) {
          chartRef.current.remove();
        }

        const chart = createChart(container, {
          width: container.clientWidth,
          height: height,
          layout: {
            textColor: 'rgba(255, 255, 255, 0.9)',
            background: { type: ColorType.Solid, color: 'rgba(17, 17, 17, 1)' },
          },
          grid: {
            vertLines: { color: 'rgba(197, 203, 206, 0.1)' },
            horzLines: { color: 'rgba(197, 203, 206, 0.1)' },
          },
          crosshair: {
            mode: 1,
            vertLine: { color: '#FF6B35', labelBackgroundColor: '#FF6B35' },
            horzLine: { color: '#FF6B35', labelBackgroundColor: '#FF6B35' },
          },
          rightPriceScale: {
            borderColor: 'rgba(197, 203, 206, 0.8)',
          },
          timeScale: {
            borderColor: 'rgba(197, 203, 206, 0.8)',
            timeVisible: true,
            secondsVisible: false,
          },
        });

        const candlestickSeries = (chart as any).addCandlestickSeries({
          upColor: '#4ADE80',
          downColor: '#F87171',
          borderDownColor: '#F87171',
          borderUpColor: '#4ADE80',
          wickDownColor: '#F87171',
          wickUpColor: '#4ADE80',
        });

        chartRef.current = chart;
        candlestickSeriesRef.current = candlestickSeries;

        console.log('Chart initialized successfully');
        loadChartData();

      } catch (error) {
        console.error('Failed to initialize chart:', error);
        setError('Failed to initialize chart');
      }
    };

    // Use setTimeout to ensure DOM is ready
    setTimeout(initChart, 100);

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth 
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [height]);

  // Load chart data
  const loadChartData = async () => {
    try {
      setConnectionStatus('connecting');
      setError(null);

      console.log('Loading chart data...');

      // Fetch data from public endpoints
      const [ohlcResponse, signalsResponse, priceResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://bitcoin-api.solvemeet.com'}/api/public/ohlc?symbol=BTCUSDT&interval=1w&limit=104`).then(r => r.json()),
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://bitcoin-api.solvemeet.com'}/api/public/signals/alerts?ticker=BTCUSDT&timeframe=1W`).then(r => r.json()),
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://bitcoin-api.solvemeet.com'}/api/public/market/price/BTCUSDT`).then(r => r.json())
      ]);

      console.log('Data loaded:', { 
        ohlc: ohlcResponse?.data?.length || 0, 
        signals: signalsResponse?.length || 0,
        price: priceResponse?.price 
      });

      if (ohlcResponse?.data?.length && candlestickSeriesRef.current) {
        // Process OHLC data
        const candlestickData = ohlcResponse.data.map((item: OHLCData) => ({
          time: (new Date(item.time).getTime() / 1000) as UTCTimestamp,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        }));

        candlestickSeriesRef.current.setData(candlestickData);

        // Add signal markers
        if (signalsResponse?.length) {
          const markers = signalsResponse.map((signal: AlertSignal) => ({
            time: (new Date(signal.timestamp).getTime() / 1000) as UTCTimestamp,
            position: signal.signalType === 'buy' ? 'belowBar' : 'aboveBar',
            color: signal.signalType === 'buy' ? '#4ADE80' : '#F87171',
            shape: signal.signalType === 'buy' ? 'arrowUp' : 'arrowDown',
            text: `${signal.signalType.toUpperCase()} $${signal.price.toFixed(0)}`,
            size: 2,
          }));

          (candlestickSeriesRef.current as any).setMarkers(markers);
        }

        // Fit content
        chartRef.current?.timeScale().fitContent();
      }

      // Update current price
      if (priceResponse?.price) {
        setCurrentPrice(priceResponse.price);
      }

      setConnectionStatus('connected');
      setIsLoading(false);
      setLastUpdate(new Date());

    } catch (error) {
      console.error('Error loading chart data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      setConnectionStatus('error');
      setIsLoading(false);
    }
  };

  // Set up real-time updates
  useEffect(() => {
    if (!isLoading && connectionStatus === 'connected') {
      const interval = setInterval(loadChartData, 5000);
      return () => clearInterval(interval);
    }
  }, [isLoading, connectionStatus]);

  if (error) {
    return (
      <div className={`p-8 bg-slate-800 rounded-lg ${className}`}>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Weekly Buy/Sell Signals - Past 2 Years
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
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 text-center border-b border-slate-600">
        <h2 className="text-2xl font-bold text-white mb-2">
          Weekly Buy/Sell Signals - Past 2 Years
        </h2>
        <p className="text-slate-300 mb-3">
          Interactive BTCUSD weekly chart with real buy/sell signals from our algorithm
        </p>
        
        {/* Status indicators */}
        <div className="flex justify-center items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400' : 
              connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
            <span className="text-slate-300">
              {connectionStatus === 'connected' ? 'Live' : 
               connectionStatus === 'connecting' ? 'Connecting...' : 'Error'}
            </span>
          </div>
          
          {currentPrice && (
            <div className="text-slate-300">
              Current: <span className="text-green-400 font-bold">${currentPrice.toLocaleString()}</span>
            </div>
          )}
          
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
              <p className="text-slate-300">Loading real-time data...</p>
            </div>
          </div>
        )}
        
        <div 
          ref={chartContainerRef}
          style={{ width: '100%', height: `${height}px` }}
          className="bg-slate-900"
        />
      </div>
    </div>
  );
}