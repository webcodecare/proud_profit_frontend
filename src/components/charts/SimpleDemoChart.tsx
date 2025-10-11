import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface SimpleDemoChartProps {
  title?: string;
  symbol?: string;
  className?: string;
}

export default function SimpleDemoChart({ 
  title = "Bitcoin Chart", 
  symbol = "BTCUSDT",
  className = ""
}: SimpleDemoChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPrice, setCurrentPrice] = useState(67234.56);
  const [priceChange, setPriceChange] = useState(2.34);

  // Simple price data points
  const pricePoints = [
    66800, 67000, 67300, 67600, 67900, 68200, 68400, 67800, 
    67600, 67900, 68100, 68300, 68200, 67950, 68150, 68400
  ];

  // Update price every few seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const variation = (Math.random() - 0.5) * 200;
      const newPrice = Math.max(65000, Math.min(70000, currentPrice + variation));
      const change = ((newPrice - 67000) / 67000) * 100;
      
      setCurrentPrice(newPrice);
      setPriceChange(change);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentPrice]);

  // Simple line chart drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw simple grid
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.2)';
    ctx.lineWidth = 1;
    
    // Horizontal lines
    for (let i = 1; i < 4; i++) {
      const y = (rect.height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }

    // Draw price line
    const maxPrice = Math.max(...pricePoints);
    const minPrice = Math.min(...pricePoints);
    const priceRange = maxPrice - minPrice;

    ctx.strokeStyle = priceChange >= 0 ? '#10b981' : '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();

    pricePoints.forEach((price, index) => {
      const x = (rect.width / (pricePoints.length - 1)) * index;
      const y = rect.height - ((price - minPrice) / priceRange) * rect.height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Add gradient fill
    ctx.lineTo(rect.width, rect.height);
    ctx.lineTo(0, rect.height);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
    gradient.addColorStop(0, priceChange >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fill();

  }, [priceChange, currentPrice]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {symbol}
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold">{formatPrice(currentPrice)}</div>
            <div className={`text-sm flex items-center ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {priceChange >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="relative h-48">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          />
          
          <div className="absolute top-2 right-2 text-xs text-gray-500">
            Live
          </div>
        </div>
      </CardContent>
    </Card>
  );
}