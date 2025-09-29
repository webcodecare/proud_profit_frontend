import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, UTCTimestamp, LineData } from 'lightweight-charts';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Activity, 
  RefreshCw, 
  TrendingUp
} from 'lucide-react';

interface SimpleInteractiveChartProps {
  symbol: string;
  height?: number;
  onSymbolChange?: (symbol: string) => void;
  className?: string;
}

interface OHLCData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  source: 'cache' | 'binance';
}

interface OHLCResponse {
  symbol: string;
  interval: string;
  count: number;
  cached: boolean;
  external: boolean;
  data: OHLCData[];
}

interface LivePrice {
  symbol: string;
  price: number;
  timestamp: string;
}

const TIMEFRAMES = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '30m', label: '30 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '12h', label: '12 Hours' },
  { value: '1d', label: '1 Day' },
  { value: '1w', label: '1 Week' }
];

const AVAILABLE_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 
  'ADAUSDT', 'DOTUSDT', 'MATICUSDT', 'AVAXUSDT', 'LINKUSDT'
];

export default function SimpleInteractiveChart({ 
  symbol: initialSymbol, 
  height = 600, 
  onSymbolChange,
  className = '' 
}: SimpleInteractiveChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  
  const [currentSymbol, setCurrentSymbol] = useState(initialSymbol);
  const [timeframe, setTimeframe] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch historical OHLC data
  const { data: ohlcData, isLoading: isLoadingOHLC, refetch: refetchOHLC } = useQuery<OHLCResponse>({
    queryKey: [`/api/ohlc?symbol=${currentSymbol}&interval=${timeframe}&limit=1000`],
    enabled: !!currentSymbol,
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Fetch current price for live updates
  const { data: currentPrice } = useQuery<LivePrice>({
    queryKey: [`/api/market/price/${currentSymbol}`],
    enabled: !!currentSymbol,
    refetchInterval: 5000,
  });

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    console.log('Initializing chart...', { width: chartContainerRef.current.clientWidth, height });
    
    try {
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: height,
        layout: {
          background: { color: '#1a1a1a' },
          textColor: '#ffffff',
        },
        grid: {
          vertLines: { color: '#2a2a2a' },
          horzLines: { color: '#2a2a2a' },
        },
        crosshair: {
          mode: 1,
        },
        rightPriceScale: {
          borderColor: '#2a2a2a',
        },
        timeScale: {
          borderColor: '#2a2a2a',
          timeVisible: true,
        },
      });

      chartRef.current = chart;

      // Create line series using the correct API
      const lineSeries = chart.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
      });
      
      lineSeriesRef.current = lineSeries;

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chart) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: height,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        try {
          chart.remove();
        } catch (e) {
          console.warn('Error removing chart:', e);
        }
      };
    } catch (error) {
      console.error('Failed to initialize chart:', error);
      console.error('Chart container:', chartContainerRef.current);
      console.error('Container dimensions:', {
        width: chartContainerRef.current?.clientWidth,
        height: chartContainerRef.current?.clientHeight
      });
    }
  }, [height]);

  // Load OHLC data into chart
  useEffect(() => {
    if (!ohlcData?.data || !lineSeriesRef.current) return;

    console.log('Loading chart data...', { ohlc: ohlcData.count });

    try {
      const chartData: LineData[] = ohlcData.data.map(candle => ({
        time: (new Date(candle.time).getTime() / 1000) as UTCTimestamp,
        value: candle.close,
      }));

      lineSeriesRef.current.setData(chartData);
      
      // Auto-fit chart
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    } catch (error) {
      console.error('Failed to load chart data:', error);
    }
  }, [ohlcData]);

  // Handle live price updates
  useEffect(() => {
    if (currentPrice && lineSeriesRef.current) {
      try {
        const timestamp = (new Date(currentPrice.timestamp).getTime() / 1000) as UTCTimestamp;
        const lineData: LineData = {
          time: timestamp,
          value: currentPrice.price,
        };
        lineSeriesRef.current.update(lineData);
      } catch (error) {
        console.error('Failed to update price:', error);
      }
    }
  }, [currentPrice]);

  const handleSymbolChange = (newSymbol: string) => {
    setCurrentSymbol(newSymbol);
    onSymbolChange?.(newSymbol);
  };

  const handleRefresh = () => {
    refetchOHLC();
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Interactive Chart
            </CardTitle>
            <Badge variant="default">Live</Badge>
            {ohlcData?.cached && (
              <Badge variant="outline">Cached</Badge>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Symbol Selector */}
            <Select value={currentSymbol} onValueChange={handleSymbolChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_SYMBOLS.map(sym => (
                  <SelectItem key={sym} value={sym}>
                    {sym.replace('USDT', '')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Timeframe Selector */}
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEFRAMES.map(tf => (
                  <SelectItem key={tf.value} value={tf.value}>
                    {tf.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleRefresh} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chart Controls */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="autoRefresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="autoRefresh" className="flex items-center gap-1">
              <RefreshCw className="h-4 w-4" />
              Auto Refresh
            </Label>
          </div>

          {currentPrice && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Current Price:</span>
              <span className="font-mono font-semibold">
                ${currentPrice.price.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isLoadingOHLC ? (
          <div className="flex items-center justify-center h-96">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Loading chart data...</span>
            </div>
          </div>
        ) : (
          <div 
            ref={chartContainerRef} 
            className="w-full"
            style={{ height: `${height}px` }}
          />
        )}

        {/* Connection Status */}
        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              Data: {ohlcData?.count || 0} candles
            </span>
            <span>
              Source: {ohlcData?.external ? 'External' : 'Cache'}
            </span>
            <span>
              Interval: {timeframe}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}