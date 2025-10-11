import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, LineData, LineSeries } from 'lightweight-charts';
import { useQuery } from '@tanstack/react-query';

interface WorkingChartProps {
  symbol: string;
  height?: number;
}

interface OHLCData {
  time: string;
  close: number;
}

interface OHLCResponse {
  symbol: string;
  count: number;
  data: OHLCData[];
}

export default function WorkingChart({ symbol, height = 400 }: WorkingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Fetch OHLC data
  const { data: ohlcData, isLoading } = useQuery<OHLCResponse>({
    queryKey: [`/api/ohlc?symbol=${symbol}&interval=1h&limit=1000`],
    enabled: !!symbol,
  });

  useEffect(() => {
    if (!chartContainerRef.current || isLoading) return;

    console.log('Creating working chart for', symbol, { hasData: !!ohlcData, count: ohlcData?.count });

    try {
      // Clean up previous chart
      if (chartRef.current) {
        chartRef.current.remove();
      }

      // Create chart
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth || 800,
        height: height,
        layout: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
        },
      });

      chartRef.current = chart;

      // Add line series
      const lineSeries = chart.addSeries(LineSeries, {
        color: '#2196F3',
        lineWidth: 2,
      });

      // Load data if available
      if (ohlcData?.data && ohlcData.data.length > 0) {
        const chartData: LineData[] = ohlcData.data.map((candle) => ({
          time: (new Date(candle.time).getTime() / 1000) as any,
          value: candle.close,
        }));

        lineSeries.setData(chartData);
        chart.timeScale().fitContent();
        console.log('Chart data loaded successfully:', chartData.length, 'points');
      } else {
        console.log('No data to load');
      }

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chart) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    } catch (error) {
      console.error('Working chart error:', error);
    }
  }, [symbol, ohlcData, height, isLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
        <div>Loading chart...</div>
      </div>
    );
  }

  return (
    <div className="w-full border rounded-lg">
      <div className="p-4 border-b">
        <h3 className="font-medium">{symbol} Price Chart</h3>
        <div className="text-sm text-gray-500">
          Data points: {ohlcData?.count || 0}
        </div>
      </div>
      <div 
        ref={chartContainerRef} 
        className="w-full"
        style={{ height: `${height}px` }}
      />
    </div>
  );
}