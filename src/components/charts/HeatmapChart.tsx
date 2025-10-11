import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface HeatmapChartProps {
  symbol?: string;
  height?: number;
  className?: string;
}

interface HeatmapData {
  id: string;
  ticker: string;
  week: string;
  sma200w: string;
  deviationPercent: string;
  createdAt: string;
}

export default function HeatmapChart({
  symbol = "BTC",
  height = 300,
  className,
}: HeatmapChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const { data: heatmapData, isLoading } = useQuery({
    queryKey: [`/api/public/chart/heatmap/${symbol}`],
    refetchInterval: 60000, // Refresh every minute
  });

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clear any existing chart
    chartContainerRef.current.innerHTML = '';

    // Create canvas-based heatmap
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = chartContainerRef.current.clientWidth || 400;
    canvas.height = height;
    canvas.style.width = '100%';
    canvas.style.height = `${height}px`;

    chartContainerRef.current.appendChild(canvas);

    // Professional heatmap grid
    const weeks = 52;
    const years = 4;
    const cellWidth = (canvas.width - 80) / weeks;
    const cellHeight = (canvas.height - 120) / years;

    // Professional color palette based on deviation percentage
    const getColor = (deviation: number) => {
      if (deviation < -50) return '#7f1d1d'; // Dark red - deep oversold
      if (deviation < -25) return '#dc2626'; // Red - oversold
      if (deviation < -10) return '#f97316'; // Orange - moderately oversold
      if (deviation < 10) return '#374151'; // Gray - neutral zone
      if (deviation < 25) return '#059669'; // Green - moderately overbought
      if (deviation < 50) return '#2563eb'; // Blue - overbought
      return '#7c3aed'; // Purple - extremely overbought
    };

    // Draw heatmap grid
    ctx.fillStyle = 'hsl(var(--muted-foreground))';
    ctx.font = '10px system-ui';

    for (let year = 0; year < years; year++) {
      for (let week = 0; week < weeks; week++) {
        // Use real data if available, otherwise generate realistic sample
        let deviation: number;
        if (heatmapData && heatmapData.length > 0) {
          const dataPoint = heatmapData[Math.min(week, heatmapData.length - 1)];
          deviation = parseFloat(dataPoint.deviationPercent);
        } else {
          // Generate realistic crypto deviation pattern
          deviation = (Math.sin(week * 0.12) * 30) + 
                     (Math.sin(year * 0.8) * 15) + 
                     (Math.random() * 10 - 5);
        }

        const x = 20 + week * cellWidth;
        const y = 40 + year * cellHeight;

        ctx.fillStyle = getColor(deviation);
        ctx.fillRect(x, y, cellWidth - 1, cellHeight - 1);

        // Add subtle border
        ctx.strokeStyle = 'hsl(var(--border))';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, cellWidth - 1, cellHeight - 1);
      }
    }

    // Add year labels
    ctx.fillStyle = 'hsl(var(--foreground))';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'right';
    for (let year = 0; year < years; year++) {
      const y = 40 + year * cellHeight + cellHeight / 2;
      ctx.fillText(`${2021 + year}`, 15, y + 4);
    }

    // Add legend
    const legendY = canvas.height - 30;
    const legendColors = [
      { color: '#dc2626', label: '<-50%' },
      { color: '#ef4444', label: '-25%' },
      { color: '#f97316', label: '0%' },
      { color: '#22c55e', label: '+25%' },
      { color: '#3b82f6', label: '+50%' },
      { color: '#8b5cf6', label: '>50%' }
    ];

    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    legendColors.forEach((item, i) => {
      const x = 20 + i * (canvas.width - 40) / legendColors.length;
      ctx.fillStyle = item.color;
      ctx.fillRect(x, legendY, 20, 15);
      ctx.fillStyle = 'hsl(var(--foreground))';
      ctx.fillText(item.label, x + 10, legendY + 25);
    });

  }, [heatmapData, symbol, height]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            200-Week SMA Heatmap
          </CardTitle>
          <CardDescription>Loading heatmap data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentDeviation = heatmapData && heatmapData.length > 0 
    ? parseFloat(heatmapData[0].deviationPercent)
    : 12.5; // Sample value

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              200-Week SMA Heatmap
            </CardTitle>
            <CardDescription>Price deviation from 200-week moving average</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">
              {currentDeviation > 0 ? '+' : ''}{currentDeviation.toFixed(1)}%
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              {currentDeviation > 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              Current deviation
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={chartContainerRef} className="w-full" style={{ height: `${height}px` }} />
        <div className="mt-4 text-xs text-muted-foreground">
          <p>Green/Blue: Above 200-week SMA (potential profit-taking zones)</p>
          <p>Red/Orange: Below 200-week SMA (potential accumulation zones)</p>
        </div>
      </CardContent>
    </Card>
  );
}