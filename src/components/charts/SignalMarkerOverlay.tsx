import { useEffect, useRef, useState } from 'react';
import ChartTooltip from './ChartTooltip';
import { useQuery } from '@tanstack/react-query';

interface AlertSignal {
  id: string;
  userId: string | null;
  ticker: string;
  signalType: 'buy' | 'sell';
  price: number;
  timestamp: string;
  timeframe: string;
  strategy?: string;
  source: string;
  note?: string;
  createdAt: string;
}

interface SignalMarkerOverlayProps {
  symbol: string;
  chartContainerRef: React.RefObject<HTMLDivElement>;
  currentPrice?: number;
  className?: string;
}

export default function SignalMarkerOverlay({ 
  symbol, 
  chartContainerRef, 
  currentPrice,
  className = '' 
}: SignalMarkerOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [hoveredSignal, setHoveredSignal] = useState<AlertSignal | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{x: number, y: number} | null>(null);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  // Fetch signals for this symbol
  const { data: signalsData } = useQuery<AlertSignal[]>({
    queryKey: [`/api/signals/${symbol}`],
    enabled: !!symbol,
    refetchInterval: 30000,
  });

  const signals = signalsData || [];

  // Position overlay markers over chart
  useEffect(() => {
    if (!chartContainerRef.current || !overlayRef.current || !signals.length) return;

    const chartRect = chartContainerRef.current.getBoundingClientRect();
    overlayRef.current.style.position = 'absolute';
    overlayRef.current.style.top = `${chartRect.top}px`;
    overlayRef.current.style.left = `${chartRect.left}px`;
    overlayRef.current.style.width = `${chartRect.width}px`;
    overlayRef.current.style.height = `${chartRect.height}px`;
    overlayRef.current.style.pointerEvents = 'none';
    overlayRef.current.style.zIndex = '10';
  }, [chartContainerRef, signals]);

  const handleMarkerClick = (signal: AlertSignal, event: React.MouseEvent) => {
    event.stopPropagation();
    setHoveredSignal(signal);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
    setIsTooltipVisible(true);
  };

  const handleTooltipClose = () => {
    setIsTooltipVisible(false);
    setHoveredSignal(null);
    setTooltipPosition(null);
  };

  // Calculate marker positions based on time and price
  const getMarkerPosition = (signal: AlertSignal) => {
    if (!chartContainerRef.current) return { x: 0, y: 0 };

    const chartRect = chartContainerRef.current.getBoundingClientRect();
    
    // Mock positioning logic - in real implementation, this would use chart time/price scales
    const timePercent = Math.random() * 0.8 + 0.1; // Random position for demo
    const pricePercent = Math.random() * 0.8 + 0.1; // Random position for demo
    
    return {
      x: chartRect.width * timePercent,
      y: chartRect.height * pricePercent
    };
  };

  return (
    <>
      {/* Signal Markers Overlay */}
      <div 
        ref={overlayRef} 
        className={`fixed pointer-events-none ${className}`}
        style={{ zIndex: 10 }}
      >
        {signals.map((signal) => {
          const position = getMarkerPosition(signal);
          
          return (
            <div
              key={signal.id}
              className="absolute pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
              style={{ 
                left: `${position.x}px`, 
                top: `${position.y}px`,
                zIndex: 11 
              }}
              onClick={(e) => handleMarkerClick(signal, e)}
              onMouseEnter={(e) => {
                setHoveredSignal(signal);
                setTooltipPosition({ x: e.clientX, y: e.clientY });
                setIsTooltipVisible(true);
              }}
              onMouseLeave={() => {
                setIsTooltipVisible(false);
                setHoveredSignal(null);
              }}
            >
              {/* Signal Marker */}
              <div className={`
                relative w-6 h-6 rounded-full border-2 shadow-lg
                flex items-center justify-center text-xs font-bold text-white
                ${signal.signalType === 'buy' 
                  ? 'bg-green-500 border-green-600' 
                  : 'bg-red-500 border-red-600'
                }
                hover:shadow-xl transition-shadow
              `}>
                {signal.signalType === 'buy' ? '↑' : '↓'}
                
                {/* Pulse animation for recent signals */}
                {new Date(signal.createdAt).getTime() > Date.now() - 5 * 60 * 1000 && (
                  <div className={`
                    absolute inset-0 rounded-full animate-ping
                    ${signal.signalType === 'buy' ? 'bg-green-400' : 'bg-red-400'}
                  `} />
                )}
              </div>

              {/* Price label */}
              <div className={`
                absolute top-full left-1/2 transform -translate-x-1/2 mt-1
                px-2 py-1 rounded text-xs font-mono text-white
                ${signal.signalType === 'buy' ? 'bg-green-600' : 'bg-red-600'}
                opacity-0 hover:opacity-100 transition-opacity
              `}>
                ${signal.price.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Enhanced Tooltip */}
      <ChartTooltip
        signal={hoveredSignal}
        position={tooltipPosition}
        isVisible={isTooltipVisible}
        onClose={handleTooltipClose}
        currentPrice={currentPrice}
      />
    </>
  );
}