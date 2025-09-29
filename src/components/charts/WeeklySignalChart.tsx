import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';

interface WeeklySignalsStandaloneProps {
  apiUrl?: string;
  height?: number;
  className?: string;
  title?: string;
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

interface OHLCData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface OHLCResponse {
  symbol: string;
  interval: string;
  count: number;
  data: OHLCData[];
}

/**
 * Standalone Weekly Buy/Sell Signals Chart Component
 * 
 * This component can be used on ANY website by simply:
 * 1. Import this component
 * 2. Provide your API URL
 * 3. Include the chart in your JSX
 * 
 * Example usage:
 * <WeeklySignalsStandalone 
 *   apiUrl="https://your-api-domain.com" 
 *   height={600}
 *   title="Custom Title"
 * />
 */
export default function WeeklySignalsStandalone({ 
  apiUrl = '',
  height = 500, 
  className = '',
  title = 'Weekly Buy/Sell Signals - Past 2 Years'
}: WeeklySignalsStandaloneProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const symbol = 'BTCUSDT';
  const timeframe = '1w';

  // Fetch data function with error handling
  const fetchData = async (endpoint: string) => {
    try {
      const url = apiUrl ? `${apiUrl}${endpoint}` : endpoint;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        textColor: 'rgba(255, 255, 255, 1)',
        background: { type: 'solid', color: 'rgba(17, 17, 17, 1)' },
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

    let candlestickSeries;
    if (chart.addCandlestickSeries) {
      try {
        candlestickSeries = chart.addCandlestickSeries({
          upColor: '#4ADE80',
          downColor: '#F87171',
          borderDownColor: '#F87171',
          borderUpColor: '#4ADE80',
          wickDownColor: '#F87171',
          wickUpColor: '#4ADE80',
        });
      } catch (error) {
        console.error('Failed to create candlestick series:', error);
        setError('Failed to initialize chart');
        return;
      }
    } else {
      console.error('addCandlestickSeries method not available');
      setError('Chart library not compatible');
      return;
    }

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [height]);

  // Load data and update chart
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        // Only show "connecting" on first load or after multiple failures
        if (isLoading || consecutiveFailures > 2) {
          setConnectionStatus('connecting');
        }
        setError(null);
        
        // Fetch OHLC data and signals simultaneously using public endpoints
        const [ohlcResponse, signalsResponse, priceResponse] = await Promise.all([
          fetchData(`/api/public/ohlc?symbol=${symbol}&interval=${timeframe}&limit=104`),
          fetchData(`/api/public/signals/alerts?ticker=${symbol}&timeframe=1W`),
          fetchData(`/api/public/market/price/${symbol}`)
        ]);

        if (!isMounted) return;

        // Process OHLC data
        if (ohlcResponse?.data?.length && candlestickSeriesRef.current) {
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

            candlestickSeriesRef.current.setMarkers(markers as any);
          }

          // Update current price
          if (priceResponse?.price) {
            setCurrentPrice(priceResponse.price);
          }

          chartRef.current?.timeScale().fitContent();
        }

        setConnectionStatus('connected');
        setIsLoading(false);
        setLastUpdate(new Date());
        setConsecutiveFailures(0);
        
      } catch (error) {
        if (!isMounted) return;
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

    loadData();

    // Set up real-time updates
    const interval = setInterval(loadData, 5000); // Update every 5 seconds

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [apiUrl, symbol, timeframe]);

  if (isLoading) {
    return (
      <div className={`weekly-signals-chart ${className}`}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ color: '#fff', marginBottom: '1rem' }}>{title}</h2>
          <div 
            style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid #FF6B35', 
              borderTop: '4px solid transparent', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}
          />
          <p style={{ color: '#888', marginTop: '1rem' }}>Loading real-time data...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`weekly-signals-chart ${className}`}>
        <div style={{ textAlign: 'center', padding: '2rem', background: '#1a1a1a', borderRadius: '8px' }}>
          <h2 style={{ color: '#fff', marginBottom: '1rem' }}>{title}</h2>
          <div style={{ color: '#F87171', marginBottom: '1rem' }}>⚠️ {error}</div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#FF6B35',
              color: '#fff',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`weekly-signals-chart ${className}`}>
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '1rem',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
        padding: '1.5rem',
        borderRadius: '8px 8px 0 0'
      }}>
        <h2 style={{ 
          color: '#fff', 
          margin: '0 0 0.5rem 0',
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>
          {title}
        </h2>
        <p style={{ 
          color: '#888', 
          margin: 0,
          fontSize: '0.9rem'
        }}>
          Interactive BTCUSD weekly chart with real buy/sell signals from our algorithm
        </p>
        
        {/* Live Status */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '0.5rem',
          fontSize: '0.8rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: connectionStatus === 'connected' ? '#4ADE80' : '#F87171'
            }} />
            <span style={{ color: '#888' }}>
              {connectionStatus === 'connected' ? 'Live' : 'Connecting...'}
            </span>
          </div>
          {currentPrice && (
            <div style={{ color: '#FF6B35', fontWeight: 'bold' }}>
              ${currentPrice.toLocaleString()}
            </div>
          )}
          <div style={{ color: '#666' }}>
            Updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div 
        ref={chartContainerRef}
        style={{ 
          width: '100%', 
          height: `${height}px`,
          background: '#111',
          borderRadius: '0 0 8px 8px',
          position: 'relative'
        }}
      />
    </div>
  );
}

// CSS for animations (can be moved to external stylesheet)
const styles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .weekly-signals-chart {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    background: #111;
  }
`;

// Inject CSS if not already present
if (typeof document !== 'undefined' && !document.getElementById('weekly-signals-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'weekly-signals-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}