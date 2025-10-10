import React, { memo, useMemo, useCallback } from 'react';
import { usePerformance } from '@/hooks/usePerformance';

interface FastChartProps {
  data: any[];
  width?: number;
  height?: number;
  color?: string;
  type?: 'line' | 'area' | 'bar';
}

// Optimized chart component with minimal re-renders
const FastChart: React.FC<FastChartProps> = memo(({ 
  data, 
  width = 300, 
  height = 200, 
  color = '#3b82f6',
  type = 'line'
}) => {
  const { throttle } = usePerformance();

  // Memoize chart calculation to prevent unnecessary re-renders
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d.value || d.y || d.price || 0));
    const minValue = Math.min(...data.map(d => d.value || d.y || d.price || 0));
    const range = maxValue - minValue || 1;

    return data.map((point, index) => {
      const value = point.value || point.y || point.price || 0;
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - minValue) / range) * height;
      return { x, y, value };
    });
  }, [data, width, height]);

  // Throttled path generation for smooth performance
  const generatePath = useCallback(throttle((points: any[]) => {
    if (!points || points.length === 0) return '';

    if (type === 'line') {
      return points.reduce((path, point, index) => {
        return path + (index === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
      }, '');
    } else if (type === 'area') {
      const linePath = points.reduce((path, point, index) => {
        return path + (index === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
      }, '');
      return `${linePath} L ${width} ${height} L 0 ${height} Z`;
    }
    
    return '';
  }, 16), [type, width, height, throttle]); // 60fps throttling

  const path = chartData ? generatePath(chartData) : '';

  if (!chartData || chartData.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-muted/20 rounded-lg skeleton-loader"
        style={{ width, height }}
      >
        <span className="text-sm text-muted-foreground">No data</span>
      </div>
    );
  }

  return (
    <div className="relative" data-heavy="true">
      <svg
        width={width}
        height={height}
        className="gpu-accelerated"
        style={{ 
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
          shapeRendering: 'optimizeSpeed'
        }}
      >
        {type === 'area' && (
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          </defs>
        )}
        
        {type === 'bar' ? (
          chartData.map((point, index) => (
            <rect
              key={index}
              x={point.x - 2}
              y={point.y}
              width="4"
              height={height - point.y}
              fill={color}
              className="transition-all duration-200 hover:opacity-80"
            />
          ))
        ) : (
          <path
            d={path}
            stroke={type === 'area' ? color : color}
            strokeWidth="2"
            fill={type === 'area' ? `url(#gradient-${color})` : 'none'}
            className="transition-all duration-200"
            style={{ vectorEffect: 'non-scaling-stroke' }}
          />
        )}

        {/* Data points for interactivity */}
        {chartData.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="3"
            fill={color}
            className="opacity-0 hover:opacity-100 transition-opacity duration-200"
            style={{ cursor: 'pointer' }}
          >
            <title>{`Value: ${point.value.toFixed(2)}`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
});

FastChart.displayName = 'FastChart';

export default FastChart;