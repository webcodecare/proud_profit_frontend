import React, { useEffect, useRef } from 'react';
import { createChart, LineData, LineSeries } from 'lightweight-charts';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, RefreshCw } from 'lucide-react';

interface BasicChartProps {
  symbol: string;
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

interface OHLCResponse {
  symbol: string;
  interval: string;
  count: number;
  cached: boolean;
  data: OHLCData[];
}

export default function BasicChart({ 
  symbol, 
  height = 400, 
  className = '' 
}: BasicChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);

  // Fetch OHLC data
  const { data: ohlcData, isLoading } = useQuery<OHLCResponse>({
    queryKey: [`/api/ohlc?symbol=${symbol}&interval=1h&limit=1000`],
    enabled: !!symbol,
    refetchInterval: 30000,
  });

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    console.log('Creating basic chart for', symbol);
    
    try {
      // Clean up previous chart
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
      }

      // Create simple chart with minimum configuration
      const chart = createChart(chartContainerRef.current, {
        width: Math.max(chartContainerRef.current.clientWidth, 400),
        height: height,
        layout: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
        },
        grid: {
          vertLines: {
            color: '#eeeeee',
          },
          horzLines: {
            color: '#eeeeee',
          },
        },
      });

      // Use correct method with LineSeries definition
      const lineSeries = chart.addSeries(LineSeries, {
        color: '#3b82f6',
        lineWidth: 2,
      });

      chartInstanceRef.current = chart;

      // Load data if available
      if (ohlcData?.data && ohlcData.data.length > 0) {
        console.log('Loading data into chart:', ohlcData.count);
        
        const chartData: LineData[] = ohlcData.data.map(candle => ({
          time: Math.floor(new Date(candle.time).getTime() / 1000) as any,
          value: candle.close,
        }));

        lineSeries.setData(chartData);
        chart.timeScale().fitContent();
      }

      // Handle resize
      const resizeObserver = new ResizeObserver(() => {
        if (chartContainerRef.current && chart) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      });

      resizeObserver.observe(chartContainerRef.current);

      return () => {
        resizeObserver.disconnect();
        if (chart) {
          chart.remove();
        }
      };
    } catch (error) {
      console.error('Chart initialization failed:', error);
      console.error('Error details:', error.message);
      console.error('Chart container element:', chartContainerRef.current);
      console.error('Container dimensions:', {
        width: chartContainerRef.current?.clientWidth,
        height: chartContainerRef.current?.clientHeight,
        offsetWidth: chartContainerRef.current?.offsetWidth,
        offsetHeight: chartContainerRef.current?.offsetHeight
      });
    }
  }, [symbol, height, ohlcData]);

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {symbol} Price Chart
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="default">Live</Badge>
            {ohlcData?.cached && (
              <Badge variant="outline">Cached</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
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

        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <span>Data points: {ohlcData?.count || 0}</span>
          <span>1H intervals</span>
        </div>
      </CardContent>
    </Card>
  );
}