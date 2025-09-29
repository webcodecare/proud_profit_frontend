import React, { useEffect, useRef, useState } from 'react';

interface SimpleSignalsChartProps {
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

export default function SimpleSignalsChart({ 
  height = 400, 
  className = '',
  title = 'Bitcoin Buy/Sell Signals - Past 2 Years'
}: SimpleSignalsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signals, setSignals] = useState<AlertSignal[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  // Fetch signals data only
  const fetchSignals = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [signalsResponse, priceResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://bitcoin-api.solvemeet.com'}/api/public/signals/alerts?ticker=BTCUSDT&timeframe=1W`).then(r => r.json()),
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://bitcoin-api.solvemeet.com'}/api/public/market/price/BTCUSDT`).then(r => r.json())
      ]);

      if (signalsResponse?.data?.length) {
        setSignals(signalsResponse.data);
      }

      if (priceResponse?.price) {
        setCurrentPrice(priceResponse.price);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading signals:', error);
      setError('Failed to load signals data');
      setIsLoading(false);
    }
  };

  // Draw simple signals timeline
  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || signals.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const { width, height } = rect;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Dark background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Sort signals by timestamp
    const sortedSignals = signals.slice().sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    if (sortedSignals.length === 0) return;

    // Calculate price range from signals
    const prices = sortedSignals.map(s => s.price);
    const minPrice = Math.min(...prices) * 0.95;
    const maxPrice = Math.max(...prices) * 1.05;
    const priceRange = maxPrice - minPrice;

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines (prices)
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i * chartHeight) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
      
      // Price labels
      const price = maxPrice - (i * priceRange) / 5;
      ctx.fillStyle = '#888';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`$${price.toLocaleString()}`, padding - 10, y + 4);
    }

    // Draw signals
    sortedSignals.forEach((signal, index) => {
      const x = padding + (index * chartWidth) / (sortedSignals.length - 1);
      const y = padding + chartHeight - ((signal.price - minPrice) / priceRange) * chartHeight;
      
      // Signal circle
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = signal.signalType === 'buy' ? '#22c55e' : '#ef4444';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Signal label
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        signal.signalType.toUpperCase(), 
        x, 
        y + (signal.signalType === 'buy' ? 25 : -15)
      );

      // Price label
      ctx.fillStyle = '#ccc';
      ctx.font = '10px Arial';
      ctx.fillText(`$${signal.price.toLocaleString()}`, x, y + 35);

      // Date label
      const date = new Date(signal.timestamp);
      ctx.fillText(
        `${date.getMonth() + 1}/${date.getFullYear()}`, 
        x, 
        padding + chartHeight + 20
      );
    });

    // Connect signals with a line
    if (sortedSignals.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      
      sortedSignals.forEach((signal, index) => {
        const x = padding + (index * chartWidth) / (sortedSignals.length - 1);
        const y = padding + chartHeight - ((signal.price - minPrice) / priceRange) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, 25);

    // Current price indicator
    if (currentPrice) {
      ctx.fillStyle = '#3b82f6';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Current: $${currentPrice.toLocaleString()}`, padding, padding - 10);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, []);

  useEffect(() => {
    if (!isLoading && !error) {
      drawChart();
    }
  }, [signals, currentPrice, isLoading, error]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (!isLoading && !error) {
        setTimeout(drawChart, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [signals, isLoading, error]);

  if (isLoading) {
    return (
      <div className={`bg-gray-900 rounded-lg p-6 ${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-white">Loading signals...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-900 rounded-lg p-6 ${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-red-400 text-center">
            <p>⚠️ {error}</p>
            <button 
              onClick={fetchSignals}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (signals.length === 0) {
    return (
      <div className={`bg-gray-900 rounded-lg p-6 ${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-400 text-center">
            <p>No signals found</p>
            <button 
              onClick={fetchSignals}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 rounded-lg p-6 ${className}`} style={{ height }}>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="text-sm text-gray-400">
          {signals.length} signals • Last update: {new Date().toLocaleTimeString()}
        </div>
      </div>
      
      <canvas 
        ref={canvasRef}
        className="w-full rounded"
        style={{ height: height - 80 }}
      />
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">
            {signals.filter(s => s.signalType === 'buy').length}
          </div>
          <div className="text-sm text-gray-400">Buy Signals</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">
            {signals.filter(s => s.signalType === 'sell').length}
          </div>
          <div className="text-sm text-gray-400">Sell Signals</div>
        </div>
      </div>
    </div>
  );
}