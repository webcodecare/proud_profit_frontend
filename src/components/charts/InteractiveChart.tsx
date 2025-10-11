import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, UTCTimestamp, CandlestickData, LineData, ColorType } from 'lightweight-charts';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useRealtimeChartMarkers, type RealtimeAlert } from '@/hooks/useSupabaseRealtime';
import ChartTooltip from './ChartTooltip';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  RefreshCw, 
  Settings,
  BarChart3,
  Maximize2,
  Volume2
} from 'lucide-react';

interface InteractiveChartProps {
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

const CHART_TYPES = [
  { value: 'candlestick', label: 'Candlestick', icon: BarChart3 },
  { value: 'line', label: 'Line', icon: TrendingUp },
  { value: 'area', label: 'Area', icon: Activity }
];

const CHART_THEMES = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' }
];

const AVAILABLE_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 
  'ADAUSDT', 'DOTUSDT', 'MATICUSDT', 'AVAXUSDT', 'LINKUSDT'
];

export default function InteractiveChart({ 
  symbol: initialSymbol, 
  height = 600, 
  onSymbolChange,
  className = '' 
}: InteractiveChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  
  const [currentSymbol, setCurrentSymbol] = useState(initialSymbol);
  const [timeframe, setTimeframe] = useState('1h');
  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'area'>('candlestick');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showVolume, setShowVolume] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [alertMarkers, setAlertMarkers] = useState<RealtimeAlert[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  
  // Tooltip state
  const [tooltipSignal, setTooltipSignal] = useState<any>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{x: number, y: number} | null>(null);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [availableSignals, setAvailableSignals] = useState<any[]>([]);

  // Fetch historical OHLC data
  const { data: ohlcData, isLoading: isLoadingOHLC, refetch: refetchOHLC } = useQuery<OHLCResponse>({
    queryKey: [`/api/ohlc?symbol=${currentSymbol}&interval=${timeframe}&limit=1000`],
    enabled: !!currentSymbol,
    refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh every 30 seconds
  });

  // Fetch current price for live updates
  const { data: currentPrice } = useQuery<LivePrice>({
    queryKey: [`/api/market/price/${currentSymbol}`],
    enabled: !!currentSymbol,
    refetchInterval: 5000, // Update price every 5 seconds
  });

  // Fetch signals for tooltip data
  const { data: signalsData } = useQuery({
    queryKey: [`/api/signals/${currentSymbol}`],
    enabled: !!currentSymbol,
    refetchInterval: 30000, // Refresh signals every 30 seconds
  });

  useEffect(() => {
    if (signalsData) {
      setAvailableSignals(signalsData);
    }
  }, [signalsData]);

  // WebSocket connection for live price streaming
  const { 
    isConnected: wsConnected, 
    lastMessage: wsMessage 
  } = useWebSocket('/ws/price', {
    onOpen: () => setConnectionStatus('connected'),
    onClose: () => setConnectionStatus('disconnected'),
    onError: () => setConnectionStatus('disconnected')
  });

  // Subscribe to real-time alert markers
  const handleNewSignal = useCallback((alert: RealtimeAlert) => {
    console.log(`New signal received: ${alert.signalType} ${alert.ticker} at $${alert.price}`);
    setAlertMarkers(prev => [alert, ...prev.slice(0, 49)]); // Keep last 50 alerts
    
    // Add marker to chart
    if (chartRef.current && alert.ticker === currentSymbol) {
      const marker = {
        time: (new Date(alert.timestamp).getTime() / 1000) as UTCTimestamp,
        position: alert.signalType === 'BUY' ? 'belowBar' as const : 'aboveBar' as const,
        color: alert.signalType === 'BUY' ? '#22c55e' : '#ef4444',
        shape: alert.signalType === 'BUY' ? 'arrowUp' as const : 'arrowDown' as const,
        text: `${alert.signalType} @$${alert.price}`,
        size: 1,
      };
      
      if (candlestickSeriesRef.current) {
        // Note: setMarkers is deprecated in newer versions
        console.log('Would set marker:', marker);
      } else if (lineSeriesRef.current) {
        console.log('Would set marker:', marker);
      } else if (areaSeriesRef.current) {
        console.log('Would set marker:', marker);
      }
    }
  }, [currentSymbol]);

  const { tickerAlerts } = useRealtimeChartMarkers(currentSymbol, handleNewSignal);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { type: ColorType.Solid, color: theme === 'dark' ? '#1a1a1a' : '#ffffff' },
        textColor: theme === 'dark' ? '#ffffff' : '#000000',
        fontSize: 12,
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: theme === 'dark' ? '#2a2a2a' : '#f0f0f0' },
        horzLines: { color: theme === 'dark' ? '#2a2a2a' : '#f0f0f0' },
      },
      crosshair: {
        mode: 1, // Normal crosshair
        vertLine: {
          color: theme === 'dark' ? '#758796' : '#9598a1',
          width: 1,
          style: 3, // Dashed
        },
        horzLine: {
          color: theme === 'dark' ? '#758796' : '#9598a1',
          width: 1,
          style: 3, // Dashed
        },
      },
      rightPriceScale: {
        borderColor: theme === 'dark' ? '#2a2a2a' : '#e0e0e0',
        scaleMargins: { top: 0.1, bottom: showVolume ? 0.4 : 0.1 },
      },
      timeScale: {
        borderColor: theme === 'dark' ? '#2a2a2a' : '#e0e0e0',
        timeVisible: true,
        secondsVisible: timeframe === '1m' || timeframe === '5m',
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    chartRef.current = chart;

    // Add chart click event handler for markers
    chart.subscribeClick((param) => {
      if (param.time && param.point) {
        const timestamp = param.time as number;
        const price = param.seriesData?.get(candlestickSeriesRef.current || lineSeriesRef.current || areaSeriesRef.current) as any;
        
        if (price) {
          const actualPrice = typeof price === 'object' ? (price.close || price.value) : price;
          const matchingSignal = findSignalForTooltip(timestamp, actualPrice);
          
          if (matchingSignal) {
            const rect = chartContainerRef.current?.getBoundingClientRect();
            if (rect && param.point) {
              setTooltipSignal(matchingSignal);
              setTooltipPosition({
                x: rect.left + param.point.x,
                y: rect.top + param.point.y
              });
              setIsTooltipVisible(true);
            }
          }
        }
      }
    });

    // Create volume series if enabled
    if (showVolume) {
      try {
        const volumeSeries = chart.addHistogramSeries({
          color: theme === 'dark' ? '#26a69a33' : '#26a69a66',
          priceFormat: { type: 'volume' },
          priceScaleId: 'volume',
          scaleMargins: { top: 0.8, bottom: 0 },
        });
        volumeSeriesRef.current = volumeSeries;
      } catch (error) {
        console.warn('Volume series not supported in this chart version:', error);
      }
    }

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
      if (chart) {
        chart.remove();
      }
    };
  }, [height, theme, showVolume, timeframe]);

  // Update chart type
  useEffect(() => {
    if (!chartRef.current) return;

    // Remove existing series
    if (candlestickSeriesRef.current) {
      chartRef.current.removeSeries(candlestickSeriesRef.current);
      candlestickSeriesRef.current = null;
    }
    if (lineSeriesRef.current) {
      chartRef.current.removeSeries(lineSeriesRef.current);
      lineSeriesRef.current = null;
    }
    if (areaSeriesRef.current) {
      chartRef.current.removeSeries(areaSeriesRef.current);
      areaSeriesRef.current = null;
    }

    // Create new series based on chart type
    switch (chartType) {
      case 'candlestick':
        try {
          const candlestickSeries = chartRef.current.addCandlestickSeries({
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderDownColor: '#ef4444',
            borderUpColor: '#22c55e',
            wickDownColor: '#ef4444',
            wickUpColor: '#22c55e',
          });
          candlestickSeriesRef.current = candlestickSeries;
        } catch (error) {
          console.warn('Candlestick series not supported:', error);
        }
        break;
      
      case 'line':
        try {
          const lineSeries = chartRef.current.addLineSeries({
            color: '#3b82f6',
            lineWidth: 2,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 6,
          });
          lineSeriesRef.current = lineSeries;
        } catch (error) {
          console.warn('Line series not supported:', error);
        }
        break;
      
      case 'area':
        try {
          const areaSeries = chartRef.current.addAreaSeries({
            topColor: '#3b82f666',
            bottomColor: '#3b82f600',
            lineColor: '#3b82f6',
            lineWidth: 2,
            crosshairMarkerVisible: true,
          });
          areaSeriesRef.current = areaSeries;
        } catch (error) {
          console.warn('Area series not supported:', error);
        }
        break;
    }
  }, [chartType, theme]);

  // Load OHLC data into chart
  useEffect(() => {
    if (!ohlcData?.data || !chartRef.current) return;

    const chartData = ohlcData.data.map(candle => {
      const timestamp = (new Date(candle.time).getTime() / 1000) as UTCTimestamp;
      
      if (chartType === 'candlestick') {
        return {
          time: timestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        } as CandlestickData;
      } else {
        return {
          time: timestamp,
          value: candle.close,
        } as LineData;
      }
    });

    const volumeData = showVolume ? ohlcData.data.map(candle => ({
      time: (new Date(candle.time).getTime() / 1000) as UTCTimestamp,
      value: candle.volume,
      color: candle.close >= candle.open ? '#22c55e66' : '#ef444466',
    })) : [];

    // Set data to appropriate series
    if (chartType === 'candlestick' && candlestickSeriesRef.current) {
      candlestickSeriesRef.current.setData(chartData as CandlestickData[]);
    } else if (chartType === 'line' && lineSeriesRef.current) {
      lineSeriesRef.current.setData(chartData as LineData[]);
    } else if (chartType === 'area' && areaSeriesRef.current) {
      areaSeriesRef.current.setData(chartData as LineData[]);
    }

    // Set volume data
    if (showVolume && volumeSeriesRef.current && volumeData.length > 0) {
      volumeSeriesRef.current.setData(volumeData);
    }

    // Add existing alert markers
    if (alertMarkers.length > 0) {
      const markers = alertMarkers
        .filter(alert => alert.ticker === currentSymbol)
        .map(alert => ({
          time: (new Date(alert.timestamp).getTime() / 1000) as UTCTimestamp,
          position: alert.signalType === 'BUY' ? 'belowBar' as const : 'aboveBar' as const,
          color: alert.signalType === 'BUY' ? '#22c55e' : '#ef4444',
          shape: alert.signalType === 'BUY' ? 'arrowUp' as const : 'arrowDown' as const,
          text: `${alert.signalType} @$${alert.price}`,
          size: 1,
        }));

      // Note: setMarkers is deprecated in this version
      const activeSeries = candlestickSeriesRef.current || lineSeriesRef.current || areaSeriesRef.current;
      if (activeSeries && markers.length > 0) {
        console.log('Would set markers:', markers.length);
      }
    }

    // Auto-fit chart
    chartRef.current.timeScale().fitContent();
  }, [ohlcData, chartType, showVolume, alertMarkers, currentSymbol]);

  // Handle live price updates
  useEffect(() => {
    if (currentPrice && chartRef.current) {
      const timestamp = (new Date(currentPrice.timestamp).getTime() / 1000) as UTCTimestamp;
      
      // Update the last candle with current price (simplified approach)
      const activeSeries = candlestickSeriesRef.current || lineSeriesRef.current || areaSeriesRef.current;
      if (activeSeries) {
        // In a real implementation, you would update the last candle's close price
        // For now, we'll just add a new data point if it's a line/area chart
        if (chartType !== 'candlestick') {
          const lineData: LineData = {
            time: timestamp,
            value: currentPrice.price,
          };
          (activeSeries as ISeriesApi<'Line' | 'Area'>).update(lineData);
        }
      }
    }
  }, [currentPrice, chartType]);

  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (wsMessage && wsConnected) {
      try {
        const data = JSON.parse(wsMessage);
        if (data.symbol === currentSymbol && data.price) {
          // Handle real-time price updates via WebSocket
          const timestamp = (new Date().getTime() / 1000) as UTCTimestamp;
          
          if (chartType !== 'candlestick') {
            const activeSeries = lineSeriesRef.current || areaSeriesRef.current;
            if (activeSeries) {
              const lineData: LineData = {
                time: timestamp,
                value: data.price,
              };
              (activeSeries as ISeriesApi<'Line' | 'Area'>).update(lineData);
            }
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [wsMessage, wsConnected, currentSymbol, chartType]);

  const handleSymbolChange = (newSymbol: string) => {
    setCurrentSymbol(newSymbol);
    onSymbolChange?.(newSymbol);
  };

  const handleRefresh = () => {
    refetchOHLC();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle tooltip events
  const handleTooltipClose = () => {
    setIsTooltipVisible(false);
    setTooltipSignal(null);
    setTooltipPosition(null);
  };

  // Find signal by timestamp and price for tooltip
  const findSignalForTooltip = (timestamp: number, price: number) => {
    return availableSignals.find(signal => {
      const signalTimestamp = new Date(signal.timestamp).getTime() / 1000;
      const timeDiff = Math.abs(signalTimestamp - timestamp);
      const priceDiff = Math.abs(signal.price - price);
      
      // Match within 1 hour and $100 range (adjust as needed)
      return timeDiff < 3600 && priceDiff < 100;
    });
  };

  return (
    <Card className={`${className} ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Interactive Chart
            </CardTitle>
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
              {connectionStatus === 'connected' ? 'Live' : 'Static'}
            </Badge>
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

            {/* Chart Type Selector */}
            <Select value={chartType} onValueChange={(value: 'candlestick' | 'line' | 'area') => setChartType(value)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHART_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Theme Toggle */}
            <Select value={theme} onValueChange={(value: 'dark' | 'light') => setTheme(value)}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHART_THEMES.map(th => (
                  <SelectItem key={th.value} value={th.value}>
                    {th.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleRefresh} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>

            <Button onClick={toggleFullscreen} size="sm" variant="outline">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chart Controls */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="volume"
              checked={showVolume}
              onCheckedChange={setShowVolume}
            />
            <Label htmlFor="volume" className="flex items-center gap-1">
              <Volume2 className="h-4 w-4" />
              Volume
            </Label>
          </div>

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

          {alertMarkers.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Signals:</span>
              <Badge variant="outline">{alertMarkers.filter(a => a.ticker === currentSymbol).length}</Badge>
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
          
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="capitalize">{connectionStatus}</span>
          </div>
        </div>
      </CardContent>

      {/* Interactive Chart Tooltip */}
      <ChartTooltip
        signal={tooltipSignal}
        position={tooltipPosition}
        isVisible={isTooltipVisible}
        onClose={handleTooltipClose}
        currentPrice={currentPrice?.price}
      />
    </Card>
  );
}