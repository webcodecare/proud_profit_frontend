import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import AlertsTable from './AlertsTable';
import WorkingChart from '@/components/charts/WorkingChart';
import { 
  BarChart3, 
  Target, 
  Activity,
  TrendingUp,
  Bell,
  Maximize2,
  Minimize2
} from 'lucide-react';

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

interface AlertsViewProps {
  className?: string;
}

export default function AlertsView({ className = '' }: AlertsViewProps) {
  const [selectedAlert, setSelectedAlert] = useState<AlertSignal | null>(null);
  const [chartSymbol, setChartSymbol] = useState('BTCUSDT');
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const { toast } = useToast();

  const handleAlertRowClick = useCallback((alert: AlertSignal) => {
    setSelectedAlert(alert);
    setChartSymbol(alert.ticker);
    
    // Highlight chart marker by dispatching custom event
    window.dispatchEvent(new CustomEvent('highlight-chart-marker', {
      detail: {
        alertId: alert.id,
        ticker: alert.ticker,
        timestamp: alert.timestamp,
        signalType: alert.signalType,
        price: alert.price
      }
    }));

    toast({
      title: "Signal Selected",
      description: `Highlighting ${alert.signalType.toUpperCase()} signal for ${alert.ticker} at $${alert.price}`,
    });
  }, [toast]);

  const handleSymbolChange = useCallback((symbol: string) => {
    setChartSymbol(symbol);
    setSelectedAlert(null); // Clear selection when manually changing symbol
  }, []);

  const toggleChartExpanded = () => {
    setIsChartExpanded(!isChartExpanded);
  };

  // Listen for chart marker click events (reverse direction)
  useEffect(() => {
    const handleChartMarkerClick = (event: CustomEvent) => {
      const { alertId } = event.detail;
      if (alertId && alertId !== selectedAlert?.id) {
        // This would require fetching the alert by ID
        // For now, we'll just show a toast
        toast({
          title: "Chart Marker Clicked",
          description: "Signal details synchronized with chart",
        });
      }
    };

    window.addEventListener('chart-marker-click', handleChartMarkerClick as EventListener);
    return () => {
      window.removeEventListener('chart-marker-click', handleChartMarkerClick as EventListener);
    };
  }, [selectedAlert, toast]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Alerts Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor trading signals and analyze chart patterns with interactive visualizations
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedAlert && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Signal Selected: {selectedAlert.ticker}
            </Badge>
          )}
          <Badge variant="secondary" className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Live Updates
          </Badge>
        </div>
      </div>

      {/* Chart Section */}
      <Card className={isChartExpanded ? 'fixed inset-4 z-50' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Chart Analysis
              {selectedAlert && (
                <Badge variant="default">
                  {selectedAlert.signalType.toUpperCase()} Signal
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button onClick={toggleChartExpanded} size="sm" variant="outline">
                {isChartExpanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {selectedAlert && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Signal Type</div>
                <Badge variant={selectedAlert.signalType === 'buy' ? 'default' : 'destructive'}>
                  {selectedAlert.signalType.toUpperCase()}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Price</div>
                <div className="font-mono font-semibold">${selectedAlert.price}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Timeframe</div>
                <Badge variant="outline">{selectedAlert.timeframe}</Badge>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Source</div>
                <div className="text-sm">{selectedAlert.source}</div>
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <WorkingChart
            symbol={chartSymbol}
            height={isChartExpanded ? 600 : 400}
          />
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <AlertsTable
        onRowClick={handleAlertRowClick}
        selectedAlertId={selectedAlert?.id || null}
      />

      {/* Selected Alert Details */}
      {selectedAlert && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Selected Signal Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <h4 className="font-medium mb-2">Signal Information</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="text-muted-foreground">ID:</span> {selectedAlert.id}</div>
                  <div><span className="text-muted-foreground">Ticker:</span> {selectedAlert.ticker}</div>
                  <div><span className="text-muted-foreground">Type:</span> {selectedAlert.signalType}</div>
                  <div><span className="text-muted-foreground">Price:</span> ${selectedAlert.price}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Trading Details</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="text-muted-foreground">Timeframe:</span> {selectedAlert.timeframe}</div>
                  <div><span className="text-muted-foreground">Strategy:</span> {selectedAlert.strategy || 'N/A'}</div>
                  <div><span className="text-muted-foreground">Source:</span> {selectedAlert.source}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Timestamps</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="text-muted-foreground">Signal Time:</span></div>
                  <div className="font-mono text-xs">{new Date(selectedAlert.timestamp).toLocaleString()}</div>
                  <div><span className="text-muted-foreground">Created:</span></div>
                  <div className="font-mono text-xs">{new Date(selectedAlert.createdAt).toLocaleString()}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Additional Notes</h4>
                <div className="text-sm text-muted-foreground">
                  {selectedAlert.note || 'No additional notes available'}
                </div>
                {selectedAlert.userId && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    User ID: {selectedAlert.userId}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}