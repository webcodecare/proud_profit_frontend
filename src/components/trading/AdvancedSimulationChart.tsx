import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface ChartDataPoint {
  time: number;
  balance: number;
  pnl: number;
}

interface AdvancedSimulationChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
}

export default function AdvancedSimulationChart({ 
  data, 
  width = 400, 
  height = 200 
}: AdvancedSimulationChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (data.length < 2) return;

    // Find min/max values for scaling
    const balances = data.map(d => d.balance);
    const minBalance = Math.min(...balances);
    const maxBalance = Math.max(...balances);
    const range = maxBalance - minBalance || 1;

    // Chart dimensions
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Draw grid lines
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 6; i++) {
      const x = padding + (chartWidth / 6) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Draw balance line
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = height - padding - ((point.balance - minBalance) / range) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw area under curve for positive P&L
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.1)');

    ctx.fillStyle = gradient;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = height - padding - ((point.balance - minBalance) / range) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, height - padding);
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw data points
    ctx.fillStyle = '#10B981';
    data.forEach((point, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = height - padding - ((point.balance - minBalance) / range) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw value labels
    ctx.fillStyle = '#E5E7EB';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'right';

    // Max value
    ctx.fillText(
      `$${maxBalance.toLocaleString()}`,
      width - padding - 5,
      padding + 15
    );

    // Min value
    ctx.fillText(
      `$${minBalance.toLocaleString()}`,
      width - padding - 5,
      height - padding - 5
    );

  }, [data, width, height]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-gray-800 rounded-lg p-4 border border-gray-700"
    >
      <h3 className="text-white text-sm font-medium mb-3">Portfolio Performance</h3>
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ maxWidth: width, maxHeight: height }}
      />
      {data.length > 0 && (
        <div className="mt-3 flex justify-between text-xs text-gray-400">
          <span>Start: ${data[0]?.balance.toLocaleString()}</span>
          <span>Current: ${data[data.length - 1]?.balance.toLocaleString()}</span>
        </div>
      )}
    </motion.div>
  );
}