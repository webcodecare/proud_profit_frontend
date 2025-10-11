import { useState } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, Activity, Zap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const indicators = [
  {
    id: 1,
    title: "200 Week Heatmap",
    description: "Advanced price deviation analysis using 200-week moving averages. Available now in your members dashboard.",
    icon: <TrendingUp className="h-8 w-8 text-[var(--chart-prime-orange)]" />,
    available: true
  },
  {
    id: 2,
    title: "2-Year Cycle Indicator", 
    description: "Market cycle analysis with 2-year moving average crossovers. Available now in your members dashboard.",
    icon: <Activity className="h-8 w-8 text-[var(--steel-blue)]" />,
    available: true
  },
  {
    id: 3,
    title: "Cycle Forecaster",
    description: "AI-powered predictive analytics for market cycle forecasting. Available now in your members dashboard.",
    icon: <Zap className="h-8 w-8 text-[var(--accent-green)]" />,
    available: true
  },
  {
    id: 4,
    title: "More Coming",
    description: "We're constantly developing new features and tools to enhance your trading experience. Stay tuned for exciting updates!",
    icon: <Plus className="h-8 w-8 text-gray-400" />,
    isComingSoon: true
  }
];

export default function IndicatorsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % indicators.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + indicators.length) % indicators.length);
  };

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Members Only Dashboard Indicators
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            These 3 exclusive indicators are available now in your members dashboard - no additional tools listed that we don't provide
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {indicators.map((indicator) => (
                <div key={indicator.id} className="w-full flex-shrink-0 px-4">
                  <Card className={`${indicator.isComingSoon ? 'opacity-60' : 'border-2 border-[var(--steel-blue)]/20'}`}>
                    <CardContent className="p-8">
                      <div className="text-center">
                        <div className="mb-6 flex justify-center">
                          <div className={`p-4 rounded-full ${indicator.isComingSoon ? 'bg-gray-100 dark:bg-gray-800' : 'bg-gradient-to-br from-[var(--steel-blue)]/10 to-[var(--chart-prime-orange)]/10'}`}>
                            {indicator.icon}
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                          {indicator.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                          {indicator.description}
                        </p>
                        {indicator.available && (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                              Available in Dashboard
                            </span>
                          </div>
                        )}
                        {indicator.isComingSoon && (
                          <span className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-full text-sm">
                            Coming Soon
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation buttons */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4"
            onClick={nextSlide}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Dots indicator */}
          <div className="flex justify-center mt-6 space-x-2">
            {indicators.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex
                    ? 'bg-[var(--steel-blue)]'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}