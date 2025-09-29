import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function AlertsTest() {
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [testAlert, setTestAlert] = useState({
    type: 'price',
    ticker: 'BTCUSDT',
    condition: 'above',
    value: 70000,
    channels: ['email']
  });
  const { toast } = useToast();

  const testGetAlerts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/alerts', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      setAlerts(data);
      toast({
        title: "Success",
        description: `Retrieved ${data.length} alerts`,
      });
    } catch (error: any) {
      console.error('Failed to get alerts:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testCreateAlert = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testAlert),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      toast({
        title: "Success",
        description: `Created alert with ID: ${data.id}`,
      });
      
      // Refresh alerts list
      await testGetAlerts();
    } catch (error: any) {
      console.error('Failed to create alert:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Alerts API Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={testGetAlerts} disabled={loading}>
              Get Alerts ({alerts.length})
            </Button>
            <Button onClick={testCreateAlert} disabled={loading}>
              Create Test Alert
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Ticker</Label>
              <Input 
                value={testAlert.ticker}
                onChange={(e) => setTestAlert({...testAlert, ticker: e.target.value})}
              />
            </div>
            <div>
              <Label>Price</Label>
              <Input 
                type="number"
                value={testAlert.value}
                onChange={(e) => setTestAlert({...testAlert, value: Number(e.target.value)})}
              />
            </div>
          </div>

          {alerts.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Current Alerts:</h3>
              <div className="space-y-2">
                {alerts.map((alert: any) => (
                  <div key={alert.id} className="p-2 border rounded">
                    <div className="text-sm">
                      {alert.ticker} {alert.condition} ${alert.value} ({alert.type})
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ID: {alert.id} | Enabled: {alert.enabled ? 'Yes' : 'No'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}