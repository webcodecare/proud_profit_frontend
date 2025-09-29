import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface TradingViewRealWidgetProps {
  ticker: string;
  onTrade?: (action: 'buy' | 'sell', price: number) => void;
}

export default function TradingViewRealWidget({ ticker, onTrade }: TradingViewRealWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!containerRef.current || !ticker) return;

    // Clear previous widget
    containerRef.current.innerHTML = '';

    // Create TradingView widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = 'calc(100% - 25px)';
    widgetDiv.style.width = '100%';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;

    // Convert our ticker format to TradingView format - ensure ticker is valid
    const safeTicker = ticker || 'BTCUSDT';
    const tradingViewSymbol = safeTicker === 'BTCUSDT' ? 'BINANCE:BTCUSDT' :
                             safeTicker === 'ETHUSDT' ? 'BINANCE:ETHUSDT' :
                             safeTicker === 'SOLUSDT' ? 'BINANCE:SOLUSDT' :
                             safeTicker === 'ADAUSDT' ? 'BINANCE:ADAUSDT' :
                             safeTicker.includes('USDT') ? `BINANCE:${safeTicker}` :
                             `BINANCE:${safeTicker}USDT`;

    // Advanced TradingView widget configuration with professional features
    const widgetConfig = {
      "autosize": true,
      "symbol": tradingViewSymbol,
      "interval": "15",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "toolbar_bg": "#131722",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "container_id": "tradingview_widget",
      "hide_top_toolbar": false,
      "hide_legend": false,
      "save_image": true,
      "hide_volume": false,
      "support_host": "https://www.tradingview.com",
      "studies": [
        "RSI@tv-basicstudies",
        "MASimple@tv-basicstudies",
        "MACD@tv-basicstudies",
        "BB@tv-basicstudies",
        "StochasticRSI@tv-basicstudies",
        "Volume@tv-basicstudies"
      ],
      "show_popup_button": true,
      "popup_width": "1200",
      "popup_height": "800",
      "overrides": {
        "paneProperties.background": "#131722",
        "paneProperties.backgroundType": "solid",
        "paneProperties.vertGridProperties.color": "#2a2e39",
        "paneProperties.horzGridProperties.color": "#2a2e39", 
        "paneProperties.vertGridProperties.style": 0,
        "paneProperties.horzGridProperties.style": 0,
        "symbolWatermarkProperties.transparency": 90,
        "scalesProperties.textColor": "#787b86",
        "scalesProperties.backgroundColor": "#131722",
        "mainSeriesProperties.candleStyle.upColor": "#089981",
        "mainSeriesProperties.candleStyle.downColor": "#f23645",
        "mainSeriesProperties.candleStyle.wickUpColor": "#089981",
        "mainSeriesProperties.candleStyle.wickDownColor": "#f23645",
        "mainSeriesProperties.candleStyle.borderUpColor": "#089981",
        "mainSeriesProperties.candleStyle.borderDownColor": "#f23645",
        "volumePaneSize": "medium"
      },
      "enabled_features": [
        "study_templates",
        "create_volume_indicator_by_default",
        "header_symbol_search",
        "header_resolutions",
        "header_chart_type",
        "header_settings",
        "header_indicators",
        "header_compare",
        "header_undo_redo",
        "header_screenshot",
        "header_fullscreen_button",
        "use_localstorage_for_settings",
        "drawing_templates",
        "left_toolbar",
        "control_bar",
        "timeframes_toolbar",
        "edit_buttons_in_legend",
        "context_menus",
        "border_around_the_chart",
        "remove_library_container_border"
      ],
      "disabled_features": [
        "header_saveload",
        "go_to_date"
      ],
      "favorites": {
        "intervals": ["1", "5", "15", "30", "60", "240", "1D", "1W"],
        "chartTypes": ["Area", "Candles", "Line"]
      },
      "custom_css_url": "",
      "loading_screen": {
        "backgroundColor": "#131722",
        "foregroundColor": "#2962ff"
      }
    };

    script.innerHTML = JSON.stringify(widgetConfig);

    widgetContainer.appendChild(widgetDiv);
    widgetContainer.appendChild(script);

    // Copyright notice (required by TradingView)
    const copyrightDiv = document.createElement('div');
    copyrightDiv.className = 'tradingview-widget-copyright';
    copyrightDiv.innerHTML = '<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span class="blue-text">Track all markets on TradingView</span></a>';
    copyrightDiv.style.height = '25px';
    copyrightDiv.style.lineHeight = '25px';
    copyrightDiv.style.textAlign = 'center';
    copyrightDiv.style.fontSize = '12px';
    copyrightDiv.style.fontFamily = '-apple-system,BlinkMacSystemFont,Trebuchet MS,Roboto,Ubuntu,sans-serif';
    copyrightDiv.style.color = '#B2B5BE';

    widgetContainer.appendChild(copyrightDiv);
    containerRef.current.appendChild(widgetContainer);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [ticker]);

  if (!ticker) {
    return (
      <div ref={containerRef} className="w-full h-[400px] bg-card border rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No ticker selected</p>
          <p className="text-xs mt-1">Select a ticker to view chart</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-[400px] bg-card border rounded-lg overflow-hidden">
      {/* Loading state while TradingView loads */}
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading {ticker} chart...</p>
        </div>
      </div>
    </div>
  );
}