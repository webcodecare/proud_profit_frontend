"use client";

import React, {
  useState,
  useEffect,
  useRef,
  type MouseEvent,
  type TouchEvent,
} from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
// Generate SVG charts for reliable cross-platform display
const generateChartSVG = (type: string) => {
  const baseChart = `
    <svg width="400" height="240" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad${type}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#FF6B35;stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:#4A90A4;stop-opacity:0.1" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="#0f172a"/>
      <g stroke="#4A90A4" stroke-width="2" fill="none">
        <path d="M50,200 Q100,150 150,120 T250,100 T350,80"/>
        <path d="M50,180 Q100,160 150,140 T250,120 T350,100" opacity="0.7"/>
        <path d="M50,160 Q100,140 150,130 T250,110 T350,90" opacity="0.5"/>
      </g>
      <rect x="0" y="0" width="400" height="240" fill="url(#grad${type})"/>
      <text x="200" y="30" text-anchor="middle" fill="#FF6B35" font-family="Arial" font-size="14" font-weight="bold">
        ${type.toUpperCase()} ANALYSIS
      </text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(baseChart)}`;
};

const chart1Image = generateChartSVG("heatmap");
const chart2Image = generateChartSVG("cycle");
const chart3Image = generateChartSVG("trend");

interface Slide {
  id: number;
  title: string;
  description: string;
  image: string;
  gradient: string;
  isComingSoon?: boolean;
}

const originalSlides: Slide[] = [
  {
    id: 1,
    title: "200-Week Heatmap Cycle Analyzer",
    description:
      "Visualize key support/resistance levels with our 200-week MA heatmap. Identify institutional accumulation zones and long-term trend direction with precision.",
    image: chart1Image,
    gradient: "from-black via-slate-900 to-blue-900",
  },
  {
    id: 2,
    title: "Yearly Cycle Heatmap Forecaster", 
    description:
      "Advanced price action analysis highlighting liquidity pools, order blocks, and fair value gaps. Pinpoint high-probability reversal zones with institutional flow markers.",
    image: chart2Image,
    gradient: "from-black via-slate-900 to-blue-900",
  },
  {
    id: 3,
    title: "Cyclical Heatmap Trend Indicator",
    description:
      "Algorithmic detection of halving cycles, Elliott Wave patterns, and macroeconomic trends. Backtested strategy engine optimizes entries for cyclical assets.",
    image: chart3Image,
    gradient: "from-black via-slate-900 to-blue-900",
  },
  {
    id: 5,
    title: "Quantum Fractal Scanner (Coming Soon)",
    description:
      "Next-gen pattern recognition combining harmonic scaling laws with machine learning. Currently in alpha testing - join our waitlist for early access.",
    image: "/placeholder.svg?height=300&width=400",
    gradient: "from-black via-slate-900 to-blue-900",
    isComingSoon: true,
  },
];

export default function TradingCarousel() {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragStartTranslate, setDragStartTranslate] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [screenSize, setScreenSize] = useState('lg');
  const animationRef = useRef<number>();

  // Responsive settings
  const getResponsiveSettings = () => {
    if (typeof window === 'undefined') return { cardWidth: 380, gap: 20, slidesToShow: 1 };
    
    const width = window.innerWidth;
    if (width < 640) { // mobile
      return { cardWidth: width - 40, gap: 16, slidesToShow: 1 };
    } else if (width < 1024) { // tablet
      return { cardWidth: Math.min(360, (width - 60) / 2), gap: 20, slidesToShow: 2 };
    } else { // desktop
      return { cardWidth: 380, gap: 24, slidesToShow: 3 };
    }
  };

  const { cardWidth, gap, slidesToShow } = getResponsiveSettings();
  const slideWidth = cardWidth + gap;

  // Create enough slides for seamless infinite scrolling
  const slides = [
    ...originalSlides,
    ...originalSlides,
    ...originalSlides,
    ...originalSlides,
  ];

  // Continuous animation function
  const animate = () => {
    if (!isDragging && autoPlay) {
      setTranslateX((prev) => {
        const newTranslate = prev - 1; // Move 1px per frame for smooth animation

        // Reset position when we've moved one full set of slides
        if (newTranslate <= -originalSlides.length * slideWidth) {
          return 0;
        }

        return newTranslate;
      });
    }
    animationRef.current = requestAnimationFrame(animate);
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setScreenSize('sm');
      } else if (width < 1024) {
        setScreenSize('md');
      } else {
        setScreenSize('lg');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Start animation
  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDragging, autoPlay]);

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
    setDragStartTranslate(translateX);
    setAutoPlay(false);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    const diff = clientX - startX;
    const newTranslate = dragStartTranslate + diff;

    // Only allow dragging in the right-to-left direction (negative values)
    // Add some resistance when trying to drag right
    if (diff > 0) {
      setTranslateX(dragStartTranslate + diff * 0.3); // Reduced movement when dragging right
    } else {
      setTranslateX(newTranslate);
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Snap to nearest slide
    const snapPosition = Math.round(translateX / slideWidth) * slideWidth;
    setTranslateX(snapPosition);

    // Resume auto-play after a short delay
    setTimeout(() => setAutoPlay(true), 1000);
  };

  // Mouse events
  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Manual navigation
  const slideNext = () => {
    setTranslateX((prev) => prev - slideWidth);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 2000);
  };

  const slidePrev = () => {
    setTranslateX((prev) => Math.min(0, prev + slideWidth));
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 2000);
  };

  return (
    <div className="relative w-full bg-black py-8 px-4 sm:px-6 lg:px-8">
      {/* Section Title - Responsive */}
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
          Advanced Trading Analytics
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-white/70 max-w-2xl mx-auto px-4">
          Discover our professional-grade analysis tools designed for serious traders
        </p>
      </div>

      <div className="relative overflow-hidden mx-auto max-w-7xl">
        {/* Navigation Arrows - Hidden on mobile */}
        <button
          onClick={slidePrev}
          className="hidden sm:flex absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 lg:w-10 lg:h-10 bg-white/10 hover:bg-white/20 rounded-full items-center justify-center text-white transition-colors backdrop-blur-sm"
          aria-label="Previous slide"
          disabled={translateX >= 0}
        >
          <ChevronLeft className="w-4 h-4 lg:w-5 lg:h-5" />
        </button>

        <button
          onClick={slideNext}
          className="hidden sm:flex absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 lg:w-10 lg:h-10 bg-white/10 hover:bg-white/20 rounded-full items-center justify-center text-white transition-colors backdrop-blur-sm"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5" />
        </button>

        {/* Cards Container */}
        <div
          className="flex cursor-grab active:cursor-grabbing px-2 sm:px-0"
          style={{
            transform: `translateX(${translateX}px)`,
            transition: "none",
            gap: `${gap}px`,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={isDragging ? handleMouseMove : undefined}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {slides.map((slide, index) => (
            <div
              key={`${slide.id}-${index}`}
              className="flex-shrink-0 select-none"
              style={{ width: `${cardWidth}px` }}
            >
              <div
                className={`h-[450px] sm:h-[500px] lg:h-[520px] bg-gradient-to-br ${slide.gradient} rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col border-[0.2px] border-[#363636]`}
              >
                {/* Chart Area */}
                <div className="relative h-48 sm:h-56 lg:h-64 mb-4 sm:mb-6 bg-gray-900/30 rounded-lg sm:rounded-xl overflow-hidden">
                  {slide.isComingSoon ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Plus className="w-8 h-8 sm:w-12 sm:h-12 text-white/60 mx-auto mb-2" />
                        <div className="text-white/60 text-xs sm:text-sm">
                          New Features
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={slide.image || "/placeholder.svg"}
                      alt={`${slide.title} Chart`}
                      className="w-full h-full object-cover border-[0.2px] border-[#363636] rounded-lg sm:rounded-xl"
                      draggable={false}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="text-white flex-1">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 leading-tight">
                    {slide.title}
                  </h3>
                  <p className="text-white/90 text-xs sm:text-sm lg:text-base leading-relaxed">
                    {slide.description}
                  </p>
                  {slide.isComingSoon && (
                    <div className="mt-3 sm:mt-4">
                      <span className="inline-block px-2 sm:px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                        Coming Soon
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Mobile Dots Indicator */}
        <div className="flex justify-center mt-6 sm:hidden">
          <div className="flex space-x-2">
            {originalSlides.map((_, index) => (
              <div
                key={index}
                className="w-2 h-2 rounded-full bg-white/30"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}