import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import AlertsTable from './AlertsTable';
import { 
  Target, 
  Activity,
  TrendingUp,
  Bell
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
  const { toast } = useToast();

  const handleAlertRowClick = useCallback((alert: AlertSignal) => {
    setSelectedAlert(alert);
    
    toast({
      title: "Signal Selected",
      description: `Selected ${alert.signalType.toUpperCase()} signal for ${alert.ticker} at $${alert.price}`,
    });
  }, [toast]);

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
            Monitor trading signals and manage your alert preferences
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