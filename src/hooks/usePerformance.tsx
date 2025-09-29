import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
  isLoading: boolean;
}

export function usePerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    isLoading: true
  });

  useEffect(() => {
    const startTime = performance.now();
    
    // Measure initial load
    const measureLoad = () => {
      const loadTime = performance.now() - startTime;
      
      // Measure memory if available
      const memoryUsage = (performance as any).memory?.usedJSHeapSize;
      
      setMetrics({
        loadTime,
        renderTime: loadTime,
        memoryUsage,
        isLoading: false
      });
    };

    // Use requestAnimationFrame to measure after render
    requestAnimationFrame(measureLoad);

    // Performance observer for monitoring
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure') {
            console.log(`Performance measure: ${entry.name} - ${entry.duration}ms`);
          }
        });
      });
      
      observer.observe({ entryTypes: ['measure', 'navigation'] });
      
      return () => observer.disconnect();
    }
  }, []);

  const markStart = (name: string) => {
    performance.mark(`${name}-start`);
  };

  const markEnd = (name: string) => {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  };

  return {
    metrics,
    markStart,
    markEnd
  };
}