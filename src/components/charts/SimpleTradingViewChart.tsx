import React, { useEffect, useRef } from 'react';

interface SimpleTradingViewChartProps {
  ticker: string;
  height?: number;
}

export default function SimpleTradingViewChart({ 
  ticker, 
  height = 600 
}: SimpleTradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;

    const tradingViewSymbol = ticker.includes('USDT') 
      ? `BINANCE:${ticker}` 
      : `BINANCE:${ticker}USDT`;

    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tradingViewSymbol,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      toolbar_bg: '#f1f3f6',
      enable_publishing: false,
      allow_symbol_change: true,
      container_id: 'tradingview_chart'
    });

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    const chartDiv = document.createElement('div');
    chartDiv.className = 'tradingview-widget-container__widget';
    chartDiv.id = 'tradingview_chart';
    chartDiv.style.height = 'calc(100% - 32px)';
    chartDiv.style.width = '100%';

    widgetContainer.appendChild(chartDiv);
    widgetContainer.appendChild(script);
    container.appendChild(widgetContainer);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [ticker]);

  return (
    <div 
      ref={containerRef} 
      style={{ height: `${height}px`, width: '100%' }}
      className="tradingview-chart-wrapper"
    />
  );
}
