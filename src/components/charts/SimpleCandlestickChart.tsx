import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, RefreshCw, Activity } from 'lucide-react';

interface SimpleCandlestickChartProps {
  height?: number;
  className?: string;
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

export default function SimpleCandlestickChart({ 
  height = 500, 
  className = '' 
}: SimpleCandlestickChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const symbol = 'BTCUSDT';
  const timeframe = '1w';

  // Fetch historical OHLC data for weekly timeframe with real-time updates
  const { data: ohlcData, isLoading: isLoadingOHLC, refetch: refetchOHLC } = useQuery<OHLCResponse>({
    queryKey: [`/api/ohlc?symbol=${symbol}&interval=${timeframe}&limit=104`],
    refetchInterval: 30000, // Update every 30 seconds for real-time movement
  });

  // Fetch buy/sell signals with real-time updates
  const { data: alertSignals, isLoading: isLoadingSignals, refetch: refetchSignals } = useQuery<AlertSignal[]>({
    queryKey: [`/api/public/signals/alerts?ticker=${symbol}&timeframe=1W`],
    refetchInterval: 15000, // Check for new signals every 15 seconds
  });

  // Fetch current price for real-time updates
  const { data: priceData } = useQuery<{ price: number }>({
    queryKey: [`/api/market/price/${symbol}`],
    refetchInterval: 5000, // Update current price every 5 seconds
    onSuccess: (data) => {
      if (data?.price) {
        setCurrentPrice(data.price);
        setLastUpdate(new Date());
      }
    }
  });

  // Update loading state
  useEffect(() => {
    if (!isLoadingOHLC && !isLoadingSignals) {
      setIsLoading(false);
    }
  }, [isLoadingOHLC, isLoadingSignals]);

  // Draw the chart
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

    // Draw signals
    if (alertSignals?.length) {
      alertSignals.forEach(signal => {
        const signalDate = new Date(signal.timestamp);
        const dataIndex = data.findIndex(d => {
          const candleDate = new Date(d.time);
          return Math.abs(candleDate.getTime() - signalDate.getTime()) < 7 * 24 * 60 * 60 * 1000; // Within a week
        });
        
        if (dataIndex >= 0) {
          const x = indexToX(dataIndex);
          const y = priceToY(signal.price);
          
          // Draw signal marker
          ctx.fillStyle = signal.signalType === 'buy' ? '#22c55e' : '#ef4444';
          ctx.beginPath();
          if (signal.signalType === 'buy') {
            // Up arrow
            ctx.moveTo(x, y + 10);
            ctx.lineTo(x - 8, y + 20);
            ctx.lineTo(x + 8, y + 20);
          } else {
            // Down arrow
            ctx.moveTo(x, y - 10);
            ctx.lineTo(x - 8, y - 20);
            ctx.lineTo(x + 8, y - 20);
          }
          ctx.closePath();
          ctx.fill();
          
          // Signal label
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(
            signal.signalType.toUpperCase(),
            x,
            signal.signalType === 'buy' ? y + 17 : y - 13
          );
        }
      });
    }

    // Draw current price line if available
    if (currentPrice && ohlcData?.data?.length) {
      const prices = ohlcData.data.flatMap(d => [d.high, d.low]);
      const minPrice = Math.min(...prices) * 0.98;
      const maxPrice = Math.max(...prices) * 1.02;
      
      if (currentPrice >= minPrice && currentPrice <= maxPrice) {
        const priceY = chartArea.top + (1 - (currentPrice - minPrice) / (maxPrice - minPrice)) * chartArea.height;
        
        // Draw price line
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(chartArea.left, priceY);
        ctx.lineTo(chartArea.left + chartArea.width, priceY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Price label
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Live: $${currentPrice.toLocaleString()}`, chartArea.left + chartArea.width + 10, priceY + 4);
      }
    }

    // Chart title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('BTCUSD Weekly Chart with Trading Signals', chartArea.left, 25);
    
    // Last update indicator
    if (lastUpdate) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`Updated: ${lastUpdate.toLocaleTimeString()}`, chartArea.left + chartArea.width, 25);
    }

  }, [ohlcData, alertSignals, currentPrice, lastUpdate, height, isLoading]);

  const handleRefresh = () => {
    refetchOHLC();
    refetchSignals();
  };

  if (isLoading || isLoadingOHLC || isLoadingSignals) {
    return (
      <section className={`py-16 bg-white dark:bg-gray-900 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Weekly Buy/Sell Signals - Past 2 Years
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Loading BTCUSD weekly chart with real trading signals...
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
            Weekly Buy/Sell Signals - Past 2 Years
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Interactive BTCUSD weekly chart showing real buy/sell signals from our trading algorithm
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                  {alertSignals?.length || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Trading Signals
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
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">
                  BTCUSD Weekly Chart with Trading Signals
                </CardTitle>
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="text-sm">
                    <Activity className="w-3 h-3 mr-1" />
                    Live {currentPrice && `$${currentPrice.toLocaleString()}`}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    disabled={isLoadingOHLC || isLoadingSignals}
                  >
                    <RefreshCw className={`w-4 h-4 ${(isLoadingOHLC || isLoadingSignals) ? 'animate-spin' : ''}`} />
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
                  • Timeframe: Weekly • Symbol: BTCUSD • Period: 2 Years
                  {lastUpdate && ` • Updated: ${lastUpdate.toLocaleTimeString()}`}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Signals List */}
          {alertSignals && alertSignals.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Recent Trading Signals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {alertSignals
                    .slice()
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 10)
                    .map((signal, index) => (
                    <div key={signal.id || index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {signal.signalType === 'buy' ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {signal.signalType.toUpperCase()} Signal
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
        </div>
      </div>
    </section>
  );
}