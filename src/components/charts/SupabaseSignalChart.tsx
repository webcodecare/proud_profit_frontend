import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, RefreshCw, Activity } from 'lucide-react';

// Supabase client setup
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

interface SupabaseSignalChartProps {
  height?: number;
  className?: string;
}

interface AlertSignal {
  id: string;
  ticker: string;
  signal_type: 'buy' | 'sell';
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

export default function SupabaseSignalChart({ 
  height = 500, 
  className = '' 
}: SupabaseSignalChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [signals, setSignals] = useState<AlertSignal[]>([]);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  
  const symbol = 'BTCUSD';
  const timeframe = '1w';

  // Fetch OHLC data (using existing API)
  const { data: ohlcData, isLoading: isLoadingOHLC, refetch: refetchOHLC } = useQuery<OHLCResponse>({
    queryKey: [`/api/ohlc?symbol=BTCUSDT&interval=${timeframe}&limit=104`],
    refetchInterval: 300000,
  });

  // Fetch initial signals from Supabase
  useEffect(() => {
    if (!supabase) {
      console.warn('Supabase not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to environment variables.');
      setRealtimeStatus('error');
      return;
    }

    const fetchSignals = async () => {
      try {
        const { data, error } = await supabase
          .from('alert_signals')
          .select('*')
          .eq('ticker', symbol)
          .eq('timeframe', '1W')
          .order('timestamp', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error fetching signals:', error);
          setRealtimeStatus('error');
          return;
        }

        setSignals(data || []);
        setRealtimeStatus('connected');
        console.log('Loaded signals from Supabase:', data?.length);
      } catch (error) {
        console.error('Supabase connection error:', error);
        setRealtimeStatus('error');
      }
    };

    fetchSignals();
  }, [symbol]);

  // Set up real-time subscription
  useEffect(() => {
    if (!supabase) return;

    const subscription = supabase
      .channel('alert_signals_realtime')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'alert_signals',
          filter: `ticker=eq.${symbol}`
        },
        (payload) => {
          console.log('New signal received:', payload.new);
          const newSignal = payload.new as AlertSignal;
          setSignals(prev => [newSignal, ...prev].slice(0, 50)); // Keep latest 50 signals
        }
      )
      .subscribe((status) => {
        console.log('Supabase subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [symbol]);

  // Update loading state
  useEffect(() => {
    if (!isLoadingOHLC && signals.length >= 0) {
      setIsLoading(false);
    }
  }, [isLoadingOHLC, signals]);

  // Draw the chart with Supabase signals
  useEffect(() => {
    if (!canvasRef.current || !ohlcData?.data?.length || isLoading) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const data = ohlcData.data.slice(-52); // Last year of weekly data
    if (data.length === 0) return;

    // Calculate price range
    const prices = data.flatMap(d => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.1;

    // Drawing parameters
    const chartArea = {
      left: 60,
      top: 40,
      right: canvas.width - 40,
      bottom: canvas.height - 60
    };
    const chartWidth = chartArea.right - chartArea.left;
    const chartHeight = chartArea.bottom - chartArea.top;
    const candleWidth = chartWidth / data.length * 0.8;

    // Helper functions
    const priceToY = (price: number) => {
      return chartArea.top + ((maxPrice + padding - price) / (priceRange + 2 * padding)) * chartHeight;
    };

    const indexToX = (index: number) => {
      return chartArea.left + (index + 0.5) * (chartWidth / data.length);
    };

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const price = minPrice + (priceRange / 5) * i;
      const y = priceToY(price);
      ctx.beginPath();
      ctx.moveTo(chartArea.left, y);
      ctx.lineTo(chartArea.right, y);
      ctx.stroke();
      
      // Price labels
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`$${price.toFixed(0)}`, chartArea.left - 5, y + 4);
    }

    // Draw candlesticks
    data.forEach((candle, index) => {
      const x = indexToX(index);
      const openY = priceToY(candle.open);
      const highY = priceToY(candle.high);
      const lowY = priceToY(candle.low);
      const closeY = priceToY(candle.close);
      
      const isGreen = candle.close > candle.open;
      const color = isGreen ? '#22c55e' : '#ef4444';
      
      // Draw wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      
      // Draw body
      ctx.fillStyle = color;
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY);
      ctx.fillRect(x - candleWidth/2, bodyTop, candleWidth, Math.max(bodyHeight, 1));
    });

    // Draw Supabase signals
    if (signals?.length) {
      signals.forEach(signal => {
        const signalDate = new Date(signal.timestamp);
        const dataIndex = data.findIndex(d => {
          const candleDate = new Date(d.time);
          return Math.abs(candleDate.getTime() - signalDate.getTime()) < 7 * 24 * 60 * 60 * 1000; // Within a week
        });
        
        if (dataIndex >= 0) {
          const x = indexToX(dataIndex);
          const y = priceToY(signal.price);
          
          // Draw signal marker with enhanced styling
          ctx.fillStyle = signal.signal_type === 'buy' ? '#22c55e' : '#ef4444';
          ctx.shadowColor = signal.signal_type === 'buy' ? '#22c55e' : '#ef4444';
          ctx.shadowBlur = 5;
          
          ctx.beginPath();
          if (signal.signal_type === 'buy') {
            // Up arrow
            ctx.moveTo(x, y + 10);
            ctx.lineTo(x - 10, y + 22);
            ctx.lineTo(x + 10, y + 22);
          } else {
            // Down arrow
            ctx.moveTo(x, y - 10);
            ctx.lineTo(x - 10, y - 22);
            ctx.lineTo(x + 10, y - 22);
          }
          ctx.closePath();
          ctx.fill();
          
          // Reset shadow
          ctx.shadowBlur = 0;
          
          // Signal label
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(
            signal.signal_type.toUpperCase(),
            x,
            signal.signal_type === 'buy' ? y + 19 : y - 15
          );
        }
      });
    }

    // Chart title with real-time status
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('BTCUSD Weekly Chart with Supabase Real-time Signals', chartArea.left, 25);

  }, [ohlcData, signals, height, isLoading]);

  const handleRefresh = () => {
    refetchOHLC();
    // Refetch signals from Supabase
    if (supabase) {
      supabase
        .from('alert_signals')
        .select('*')
        .eq('ticker', symbol)
        .eq('timeframe', '1W')
        .order('timestamp', { ascending: false })
        .limit(50)
        .then(({ data }) => {
          if (data) setSignals(data);
        });
    }
  };

  if (isLoading || isLoadingOHLC) {
    return (
      <section className={`py-16 bg-white dark:bg-gray-900 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Weekly Buy/Sell Signals - Supabase Real-time
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Loading BTCUSD weekly chart with real-time signals from Supabase...
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-16 bg-white dark:bg-gray-900 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Weekly Buy/Sell Signals - Supabase Real-time
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Interactive BTCUSD weekly chart with real-time signals from Supabase database
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {ohlcData?.data?.length || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Weekly Candles
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {signals?.length || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Supabase Signals
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  1W
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Timeframe
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className={`text-2xl font-bold mb-2 ${
                  realtimeStatus === 'connected' ? 'text-green-600' : 
                  realtimeStatus === 'connecting' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {realtimeStatus === 'connected' ? '🟢' : 
                   realtimeStatus === 'connecting' ? '🟡' : '🔴'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Real-time Status
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">
                  BTCUSD Weekly Chart with Supabase Signals
                </CardTitle>
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className={`text-sm ${
                    realtimeStatus === 'connected' ? 'border-green-500 text-green-600' :
                    realtimeStatus === 'connecting' ? 'border-yellow-500 text-yellow-600' :
                    'border-red-500 text-red-600'
                  }`}>
                    <Activity className="w-3 h-3 mr-1" />
                    {realtimeStatus === 'connected' ? 'Real-time' : 
                     realtimeStatus === 'connecting' ? 'Connecting' : 'Offline'}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    disabled={isLoadingOHLC}
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingOHLC ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <canvas 
                ref={canvasRef} 
                className="w-full border rounded-lg"
                style={{ height: `${height}px` }}
              />
              
              {/* Legend */}
              <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600 dark:text-gray-400">Buy Signal</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="text-gray-600 dark:text-gray-400">Sell Signal</span>
                </div>
                <div className="text-gray-500 dark:text-gray-500">
                  • Real-time via Supabase • Symbol: BTCUSD • Timeframe: Weekly
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Signals List */}
          {signals && signals.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Recent Trading Signals from Supabase</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {signals
                    .slice(0, 10)
                    .map((signal, index) => (
                    <div key={signal.id || index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {signal.signal_type === 'buy' ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {signal.signal_type.toUpperCase()} Signal
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(signal.timestamp).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900 dark:text-white">
                          ${signal.price.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {signal.ticker}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!supabase && (
            <Card className="mt-8 border-yellow-200 bg-yellow-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="text-yellow-600 text-2xl">⚠️</div>
                  <div>
                    <h3 className="font-bold text-yellow-800">Supabase Configuration Required</h3>
                    <p className="text-yellow-700 mt-1">
                      To enable real-time signals, please add your Supabase credentials to the environment variables:
                    </p>
                    <div className="mt-2 bg-yellow-100 p-2 rounded text-sm font-mono">
                      VITE_SUPABASE_URL=your_project_url<br/>
                      VITE_SUPABASE_ANON_KEY=your_anon_key
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}