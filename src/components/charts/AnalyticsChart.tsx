import { useEffect, useRef } from 'react';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
  }[];
}

interface AnalyticsChartProps {
  data: ChartData;
  type: 'line' | 'bar' | 'pie';
  height?: number;
  title?: string;
}

export function AnalyticsChart({ data, type, height = 300, title }: AnalyticsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data.labels.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const width = rect.width;
    const height = rect.height;
    const padding = 40;

    // Chart dimensions
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    if (type === 'line' || type === 'bar') {
      drawLineOrBarChart(ctx, data, width, height, padding, chartWidth, chartHeight, type);
    } else if (type === 'pie') {
      drawPieChart(ctx, data, width, height);
    }
  }, [data, type]);

  const drawLineOrBarChart = (
    ctx: CanvasRenderingContext2D,
    data: ChartData,
    width: number,
    height: number,
    padding: number,
    chartWidth: number,
    chartHeight: number,
    chartType: 'line' | 'bar'
  ) => {
    // Find max value for scaling
    const maxValue = Math.max(...data.datasets.flatMap(d => d.data));
    const minValue = Math.min(0, ...data.datasets.flatMap(d => d.data));
    const range = maxValue - minValue;

    // Draw axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Y-axis
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    // X-axis
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw data
    data.datasets.forEach((dataset, datasetIndex) => {
      const color = dataset.borderColor || dataset.backgroundColor || `hsl(${datasetIndex * 60}, 70%, 50%)`;
      
      if (chartType === 'line') {
        // Draw line
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        dataset.data.forEach((value, index) => {
          const x = padding + (index / (data.labels.length - 1)) * chartWidth;
          const y = height - padding - ((value - minValue) / range) * chartHeight;
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();

        // Draw points
        ctx.fillStyle = color;
        dataset.data.forEach((value, index) => {
          const x = padding + (index / (data.labels.length - 1)) * chartWidth;
          const y = height - padding - ((value - minValue) / range) * chartHeight;
          
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 2 * Math.PI);
          ctx.fill();
        });
      } else {
        // Draw bars
        const barWidth = chartWidth / data.labels.length * 0.8;
        const barSpacing = chartWidth / data.labels.length * 0.2;
        
        ctx.fillStyle = color;
        dataset.data.forEach((value, index) => {
          const x = padding + index * (chartWidth / data.labels.length) + barSpacing / 2;
          const barHeight = ((value - minValue) / range) * chartHeight;
          const y = height - padding - barHeight;
          
          ctx.fillRect(x, y, barWidth, barHeight);
        });
      }
    });

    // Draw labels
    ctx.fillStyle = '#6B7280';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    
    data.labels.forEach((label, index) => {
      const x = padding + (index / (data.labels.length - 1)) * chartWidth;
      ctx.fillText(label, x, height - padding + 15);
    });

    // Draw Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (range * i) / 5;
      const y = height - padding - (i / 5) * chartHeight;
      ctx.fillText(Math.round(value).toString(), padding - 10, y + 4);
    }
  };

  const drawPieChart = (
    ctx: CanvasRenderingContext2D,
    data: ChartData,
    width: number,
    height: number
  ) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    // Calculate total
    const total = data.datasets[0]?.data.reduce((sum, value) => sum + value, 0) || 1;
    
    // Colors for pie slices
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
    
    let currentAngle = -Math.PI / 2; // Start at top

    data.datasets[0]?.data.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      const color = colors[index % colors.length];

      // Draw slice
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round((value / total) * 100)}%`, labelX, labelY);

      currentAngle += sliceAngle;
    });

    // Draw legend
    data.labels.forEach((label, index) => {
      const legendY = 50 + index * 20;
      const color = colors[index % colors.length];
      
      // Legend color box
      ctx.fillStyle = color;
      ctx.fillRect(width - 150, legendY, 15, 15);
      
      // Legend text
      ctx.fillStyle = '#374151';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(label, width - 130, legendY + 12);
    });
  };

  return (
    <div className="relative">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      )}
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: `${height}px` }}
      />
    </div>
  );
}