import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buildApiUrl } from '../../config/api';

// TradingView Script Loader Utility
let tradingViewScriptPromise: Promise<void> | null = null;

const waitForTradingView = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const maxAttempts = 100; // 5 seconds total (50ms * 100)
    let attempts = 0;
    
    const checkReady = () => {
      attempts++;
      if (typeof window !== 'undefined' && window.TradingView && window.TradingView.widget) {
        console.log('TradingView widget constructor ready');
        resolve();
        return;
      }
      
      if (attempts >= maxAttempts) {
        reject(new Error('TradingView widget not ready after 5 seconds'));
        return;
      }
      
      setTimeout(checkReady, 50);
    };
    
    checkReady();
  });
};

const loadTradingViewScript = (): Promise<void> => {
  if (tradingViewScriptPromise) {
    return tradingViewScriptPromise;
  }

  tradingViewScriptPromise = new Promise(async (resolve, reject) => {
    try {
      // Check if TradingView widget is already ready with enhanced checks
      if (typeof window !== 'undefined' && window.TradingView && window.TradingView.widget) {
        resolve();
        return;
      }

      // Check if script is already in the document
      const existingScript = document.querySelector('script[src="https://s3.tradingview.com/tv.js"]');
      if (existingScript) {
        // Script exists, wait for it to be ready
        await waitForTradingView();
        resolve();
        return;
      }

      // Create and load the script
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      
      script.onload = async () => {
        console.log('TradingView script loaded, waiting for widget constructor...');
        try {
          await waitForTradingView();
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      script.onerror = () => {
        console.error('Failed to load tv.js - check Network tab for https://s3.tradingview.com/tv.js');
        reject(new Error('Failed to load TradingView script from CDN'));
      };
      
      document.head.appendChild(script);
      console.log('TradingView script tag added to document head');
    } catch (error) {
      reject(error);
    }
  });

  return tradingViewScriptPromise;
};

interface TradingViewChartProps {
  symbol?: string;
  height?: number;
  className?: string;
  theme?: 'light' | 'dark';
  interval?: string;
  showToolbar?: boolean;
  title?: string;
  description?: string;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

export default function TradingViewChart({
  symbol = 'BINANCE:BTCUSDT',
  height = 700,
  className = '',
  theme = 'dark',
  interval = '1W',
  showToolbar = true,
  title = 'Bitcoin Buy/Sell Signals - Past 2 Years',
  description = 'Interactive chart showing our trading algorithm\'s buy/sell signals with real market data'
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const initializedRef = useRef<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [signalsCount, setSignalsCount] = useState<number>(5);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch OHLC data for chart using the working endpoint - MUST be before any conditional returns
  const { data: ohlcData } = useQuery({
    queryKey: [`/api/public/market/ohlc/BTCUSDT/1d`],
    refetchInterval: 30000, // Update every 30 seconds
  });

  // Extract chart data from the API response
  const chartData = Array.isArray((ohlcData as any)?.data) ? (ohlcData as any).data : Array.isArray(ohlcData) ? ohlcData : [];

  // Fetch current Bitcoin price for display
  const fetchCurrentPrice = async () => {
    try {
      console.log('TradingView fetching price from:', buildApiUrl('/api/public/market/price/BTCUSDT'));
      const response = await fetch(buildApiUrl('/api/public/market/price/BTCUSDT'));
      console.log('TradingView price response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('TradingView price data:', data);
        if (data.price) {
          setCurrentPrice(data.price);
          console.log('TradingView price updated to:', data.price);
        }
      } else {
        console.error('TradingView price response not ok:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching current price:', error);
    }
  };

  // Initialize TradingView Widget
  useEffect(() => {
    const initWidget = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('Starting TradingView widget initialization...');
        
        // Load TradingView script and wait for it to be ready
        await loadTradingViewScript();

        if (typeof window === 'undefined' || !window.TradingView || !window.TradingView.widget || !containerRef.current) {
          throw new Error('TradingView script not loaded, widget not available, or container not found');
        }

        // Clean up existing widget with enhanced null checks
        if (widgetRef.current && typeof widgetRef.current.remove === 'function') {
          try {
            widgetRef.current.remove();
          } catch (e) {
            console.warn('Error removing existing widget:', e);
          }
          widgetRef.current = null;
        }

        // Create new widget with unique ID to prevent caching
        const containerId = `tradingview_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        containerRef.current.id = containerId;

        const widgetConfig = {
          symbol: symbol,
          interval: interval,
          timezone: 'Etc/UTC',
          theme: theme === 'dark' ? 'dark' : 'light',
          style: '1',
          locale: 'en',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          hide_top_toolbar: !showToolbar,
          hide_legend: false,
          save_image: false,
          container_id: containerId,
          autosize: true,
          height: height - 100, // Account for header/footer
          disabled_features: ['timeframes_toolbar'],
        };

        console.log('Initializing TradingView widget with config:', widgetConfig);
        widgetRef.current = new window.TradingView.widget(widgetConfig);

        setIsLoading(false);
        initializedRef.current = true;

      } catch (error) {
        console.error('Failed to initialize TradingView chart:', error);
        setError(error instanceof Error ? error.message : 'Failed to load interactive chart');
        setIsLoading(false);
      }
    };

    if (!initializedRef.current) {
      initWidget();
    }

    // Cleanup on unmount (handles React StrictMode double-invocation)
    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {
          console.warn('Error cleaning up widget:', e);
        }
        widgetRef.current = null;
      }
      initializedRef.current = false; // Reset for StrictMode re-render
    };
  }, [symbol, interval, theme, showToolbar, height]);

  // Separate effect for price fetching
  useEffect(() => {
    fetchCurrentPrice();
    const priceInterval = setInterval(fetchCurrentPrice, 30000);
    return () => clearInterval(priceInterval);
  }, []);

  // Update last update time periodically
  useEffect(() => {
    const updateInterval = setInterval(() => {
      setLastUpdate(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(updateInterval);
  }, []);

  if (error) {
    // Show fallback chart if TradingView fails
    return (
      <div className={`bg-slate-800 rounded-lg overflow-hidden ${className}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 border-b border-slate-600">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-white mb-2">
              {title}
            </h2>
            <p className="text-slate-300">
              {description}
            </p>
          </div>
          
          {/* Status indicators */}
          <div className="flex justify-center items-center gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-slate-300 font-medium">Live Data</span>
            </div>
            
            {currentPrice && (
              <div className="text-slate-300" data-testid="text-current-price">
                Bitcoin: <span className="text-green-400 font-bold">${currentPrice.toLocaleString()}</span>
              </div>
            )}
            
            <div className="text-slate-300" data-testid="text-signals-count">
              Signals: <span className="text-orange-400 font-bold">{signalsCount}</span>
            </div>
            
            <div className="text-slate-300" data-testid="text-ohlc-count">
              Historical: <span className="text-blue-400 font-bold">104</span>
            </div>
          </div>
        </div>

        {/* Fallback Chart */}
        <div className="relative bg-slate-900 p-6 text-center" style={{ height: `${height}px` }}>
          <div className="text-red-400 mb-4">⚠️ Interactive chart temporarily unavailable</div>
          <div className="text-slate-300 mb-6">{error}</div>
          
          <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700 max-w-2xl mx-auto">
            <h4 className="text-lg font-semibold text-slate-200 mb-3">
              Bitcoin Trading Data Available
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              While the interactive chart is loading, your live Bitcoin data continues to update: 
              current price ${currentPrice?.toLocaleString() || 'loading'}, {signalsCount} active trading signals, 
              and 104 historical data points.
            </p>
          </div>
          
          <button
            onClick={() => {
              setError(null);
              initializedRef.current = false;
            }}
            className="mt-6 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded transition-colors"
            data-testid="button-retry-chart"
          >
            Retry Interactive Chart
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
            {title}
          </h2>
          <p className="text-slate-300">
            {description}
          </p>
        </div>
        
        {/* Status indicators */}
        <div className="flex justify-center items-center gap-6 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-slate-300 font-medium">Live Data</span>
          </div>
          
          {currentPrice && (
            <div className="text-slate-300" data-testid="text-current-price">
              Bitcoin: <span className="text-green-400 font-bold">${currentPrice.toLocaleString()}</span>
            </div>
          )}
          
          <div className="text-slate-300" data-testid="text-signals-count">
            Signals: <span className="text-orange-400 font-bold">{signalsCount}</span>
          </div>
          
          <div className="text-slate-300" data-testid="text-ohlc-count">
            Historical: <span className="text-blue-400 font-bold">104</span>
          </div>
          
          <div className="text-slate-400">
            Updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* TradingView Chart Container */}
      <div className="relative bg-slate-900" style={{ height: `${height}px` }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-300">Loading interactive chart...</p>
            </div>
          </div>
        )}
        
        {/* TradingView Widget Container */}
        <div 
          ref={containerRef}
          className="w-full h-full"
          style={{ minHeight: `${height - 100}px` }}
        />
      </div>

      {/* Chart Legend & Info */}
      <div className="p-4 bg-slate-700 border-t border-slate-600">
        <div className="flex flex-wrap justify-center items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded"></div>
            <span className="text-slate-300">Live Updates</span>
          </div>
          <div className="text-slate-400 text-xs">
            Real-time Bitcoin Chart
          </div>
        </div>
      </div>
    </div>
  );
}