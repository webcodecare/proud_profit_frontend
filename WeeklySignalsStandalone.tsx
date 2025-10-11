import React, { useEffect, useRef, useState } from 'react';

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
  note?: string;
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
  apiUrl = 'http://localhost:5000',
  height = 500, 
  className = '',
  title = 'Weekly Buy/Sell Signals - Past 2 Years'
}: WeeklySignalsStandaloneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [ohlcData, setOhlcData] = useState<OHLCResponse | null>(null);
  const [signalMarkers, setSignalMarkers] = useState<AlertSignal[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const symbol = 'BTCUSDT';
  const timeframe = '1w';

  // Fetch data function with error handling
  const fetchData = async (endpoint: string) => {
    try {
      const response = await fetch(`${apiUrl}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  };

  // Load data and update chart
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        setConnectionStatus('connecting');
        setError(null);
        
        // Fetch OHLC data and signals simultaneously
        const [ohlcResponse, signalsResponse, priceResponse] = await Promise.all([
          fetchData(`/api/ohlc?symbol=${symbol}&interval=${timeframe}&limit=104`),
          fetchData(`/api/signals/alerts?ticker=${symbol}&timeframe=1W`),
          fetchData(`/api/market/price/${symbol}`)
        ]);

        if (!isMounted) return;

        // Process data
        if (ohlcResponse?.data?.length) {
          setOhlcData(ohlcResponse);
        }

        if (signalsResponse?.length) {
          setSignalMarkers(signalsResponse);
        }

        if (priceResponse?.price) {
          setCurrentPrice(priceResponse.price);
        }

        setConnectionStatus('connected');
        setIsLoading(false);
        setLastUpdate(new Date());
        
      } catch (error) {
        if (!isMounted) return;
        console.error('Error loading chart data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load data');
        setConnectionStatus('error');
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

  // Canvas-based chart rendering with real-time animation
  useEffect(() => {
    if (!canvasRef.current || !ohlcData?.data?.length || isLoading) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = height;

    const drawChart = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const data = ohlcData.data.slice(-104); // Last 2 years of weekly data
      if (data.length === 0) return;

      // Calculate price range
      const prices = data.flatMap(d => [d.high, d.low]);
      if (currentPrice) prices.push(currentPrice);
      
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice;
      const padding = priceRange * 0.1;

      // Drawing parameters
      const chartArea = {
        left: 80,
        top: 40,
        right: canvas.width - 40,
        bottom: canvas.height - 80
      };
      const chartWidth = chartArea.right - chartArea.left;
      const chartHeight = chartArea.bottom - chartArea.top;
      const candleWidth = Math.max(2, chartWidth / data.length * 0.8);

      // Helper functions
      const priceToY = (price: number) => {
        return chartArea.top + ((maxPrice + padding - price) / (priceRange + 2 * padding)) * chartHeight;
      };

      const indexToX = (index: number) => {
        return chartArea.left + (index + 0.5) * (chartWidth / data.length);
      };

      // Draw background
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      
      // Horizontal grid lines
      for (let i = 0; i <= 8; i++) {
        const price = minPrice + (priceRange / 8) * i;
        const y = priceToY(price);
        ctx.beginPath();
        ctx.moveTo(chartArea.left, y);
        ctx.lineTo(chartArea.right, y);
        ctx.stroke();
        
        // Price labels
        ctx.fillStyle = '#888888';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`$${price.toFixed(0)}`, chartArea.left - 10, y + 4);
      }

      // Vertical grid lines
      const timeLabels = Math.min(6, data.length);
      for (let i = 0; i < timeLabels; i++) {
        const dataIndex = Math.floor((data.length - 1) * i / (timeLabels - 1));
        const x = indexToX(dataIndex);
        
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.stroke();
        
        // Time labels
        const date = new Date(data[dataIndex].time);
        ctx.fillStyle = '#888888';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          x, 
          chartArea.bottom + 20
        );
      }

      // Draw candlesticks
      data.forEach((candle, index) => {
        const x = indexToX(index);
        const openY = priceToY(candle.open);
        const highY = priceToY(candle.high);
        const lowY = priceToY(candle.low);
        const closeY = priceToY(candle.close);
        
        const isGreen = candle.close > candle.open;
        const color = isGreen ? '#4ADE80' : '#F87171';
        
        // Draw wick
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();
        
        // Draw body
        ctx.fillStyle = color;
        const bodyHeight = Math.abs(closeY - openY);
        const bodyY = Math.min(openY, closeY);
        ctx.fillRect(x - candleWidth/2, bodyY, candleWidth, Math.max(bodyHeight, 2));
      });

      // Draw signal markers
      signalMarkers.forEach(signal => {
        const signalTime = new Date(signal.timestamp).getTime();
        const signalIndex = data.findIndex(candle => {
          const candleTime = new Date(candle.time).getTime();
          return Math.abs(candleTime - signalTime) < 7 * 24 * 60 * 60 * 1000; // Within a week
        });

        if (signalIndex >= 0) {
          const x = indexToX(signalIndex);
          const y = signal.signalType === 'buy' 
            ? priceToY(data[signalIndex].low) + 40
            : priceToY(data[signalIndex].high) - 40;

          // Draw arrow with glow effect
          ctx.shadowColor = signal.signalType === 'buy' ? '#4ADE80' : '#F87171';
          ctx.shadowBlur = 10;
          ctx.fillStyle = signal.signalType === 'buy' ? '#4ADE80' : '#F87171';
          
          ctx.beginPath();
          if (signal.signalType === 'buy') {
            ctx.moveTo(x, y);
            ctx.lineTo(x - 10, y + 20);
            ctx.lineTo(x + 10, y + 20);
          } else {
            ctx.moveTo(x, y);
            ctx.lineTo(x - 10, y - 20);
            ctx.lineTo(x + 10, y - 20);
          }
          ctx.closePath();
          ctx.fill();

          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;

          // Draw signal text with background
          const text = `${signal.signalType.toUpperCase()} $${Math.round(signal.price).toLocaleString()}`;
          ctx.font = 'bold 11px Arial';
          const textMetrics = ctx.measureText(text);
          const textWidth = textMetrics.width;
          const textHeight = 12;
          
          const textX = x;
          const textY = y + (signal.signalType === 'buy' ? 40 : -30);
          
          // Text background
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillRect(textX - textWidth/2 - 4, textY - textHeight/2 - 2, textWidth + 8, textHeight + 4);
          
          // Text
          ctx.fillStyle = signal.signalType === 'buy' ? '#4ADE80' : '#F87171';
          ctx.textAlign = 'center';
          ctx.fillText(text, textX, textY + 4);
        }
      });

      // Draw current price line (real-time movement)
      if (currentPrice) {
        const currentY = priceToY(currentPrice);
        
        // Animated dashed line with glow
        ctx.shadowColor = '#FF6B35';
        ctx.shadowBlur = 5;
        ctx.strokeStyle = '#FF6B35';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(chartArea.left, currentY);
        ctx.lineTo(chartArea.right, currentY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Current price label
        const priceText = `$${currentPrice.toLocaleString()}`;
        ctx.font = 'bold 12px Arial';
        const priceTextMetrics = ctx.measureText(priceText);
        
        // Label background
        ctx.fillStyle = '#FF6B35';
        ctx.fillRect(chartArea.right + 5, currentY - 10, priceTextMetrics.width + 10, 20);
        
        // Label text
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';
        ctx.fillText(priceText, chartArea.right + 10, currentY + 4);
      }

      // Draw title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(title, canvas.width / 2, 25);

      // Draw live indicator
      const indicatorX = canvas.width - 30;
      const indicatorY = 20;
      
      ctx.fillStyle = connectionStatus === 'connected' ? '#4ADE80' : '#F87171';
      ctx.beginPath();
      ctx.arc(indicatorX, indicatorY, 6, 0, 2 * Math.PI);
      ctx.fill();

      // Status text
      ctx.fillStyle = '#cccccc';
      ctx.font = '11px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(
        `${connectionStatus === 'connected' ? 'LIVE' : 'LOADING'} • ${lastUpdate.toLocaleTimeString()}`,
        canvas.width - 45,
        25
      );

      // Draw symbol and timeframe
      ctx.fillStyle = '#888888';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${symbol} • Weekly • ${data.length} periods`, 10, 25);
    };

    // Initial draw
    drawChart();

    // Animate the chart every second for smooth real-time updates
    const animate = () => {
      drawChart();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [ohlcData, signalMarkers, currentPrice, lastUpdate, connectionStatus, height, isLoading, title]);

  if (isLoading) {
    return (
      <div className={`weekly-signals-chart ${className}`} style={{ background: '#1a1a1a', borderRadius: '8px', padding: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.5rem' }}>{title}</h2>
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
        <style>{`
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
      <div className={`weekly-signals-chart ${className}`} style={{ background: '#1a1a1a', borderRadius: '8px', padding: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.5rem' }}>{title}</h2>
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
    <div className={`weekly-signals-chart ${className}`} style={{ background: '#1a1a1a', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)' }}>
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
        padding: '1.5rem',
        borderBottom: '1px solid #333'
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
      <canvas 
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: `${height}px`,
          display: 'block'
        }}
      />
    </div>
  );
}