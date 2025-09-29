import { useEffect } from "react";

interface PerformanceOptimizerProps {
  children: React.ReactNode;
}

export default function PerformanceOptimizer({ children }: PerformanceOptimizerProps) {
  useEffect(() => {
    // Preload critical resources
    const criticalResources = [
      '/api/user/profile',
      '/api/market/price/BTCUSDT',
    ];

    criticalResources.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });

    // Enable GPU acceleration for smooth animations
    document.documentElement.style.transform = 'translateZ(0)';
    document.documentElement.style.backfaceVisibility = 'hidden';
    document.documentElement.style.perspective = '1000px';

    // Optimize images for faster loading
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.loading) {
        img.loading = 'lazy';
      }
    });

    return () => {
      // Cleanup
      document.documentElement.style.transform = '';
      document.documentElement.style.backfaceVisibility = '';
      document.documentElement.style.perspective = '';
    };
  }, []);

  return <>{children}</>;
}