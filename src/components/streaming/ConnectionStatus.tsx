import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, Zap, Activity, RefreshCw } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  connectionSource: string;
  symbolCount: number;
  lastUpdate: string | null;
  onReconnect: () => void;
  onDisconnect: () => void;
}

export default function ConnectionStatus({
  isConnected,
  connectionSource,
  symbolCount,
  lastUpdate,
  onReconnect,
  onDisconnect,
}: ConnectionStatusProps) {
  const getStatusColor = () => {
    if (!isConnected) return 'text-red-500';
    if (connectionSource === 'binance') return 'text-green-500';
    if (connectionSource === 'coincap') return 'text-yellow-500';
    return 'text-gray-500';
  };

  const getStatusIcon = () => {
    if (!isConnected) return <WifiOff className="h-4 w-4" />;
    if (connectionSource === 'binance') return <Zap className="h-4 w-4" />;
    if (connectionSource === 'coincap') return <Activity className="h-4 w-4" />;
    return <Wifi className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (!isConnected) return 'Disconnected';
    if (connectionSource === 'binance') return 'Binance WebSocket';
    if (connectionSource === 'coincap') return 'CoinCap SSE';
    return 'Unknown';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className={getStatusColor()}>
            {getStatusIcon()}
          </span>
          Connection Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge 
            variant={isConnected ? "default" : "destructive"}
            className={`${
              isConnected 
                ? connectionSource === 'binance' 
                  ? 'bg-green-500/10 text-green-500 border-green-500/20'
                  : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                : 'bg-red-500/10 text-red-500 border-red-500/20'
            }`}
          >
            {getStatusText()}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Symbols</span>
          <span className="font-medium">{symbolCount}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Last Update</span>
          <span className="font-medium text-xs">
            {lastUpdate 
              ? new Date(lastUpdate).toLocaleTimeString()
              : 'Never'
            }
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Source</span>
          <span className="font-medium capitalize">{connectionSource}</span>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onReconnect}
            disabled={isConnected}
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Reconnect
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onDisconnect}
            disabled={!isConnected}
            className="flex-1"
          >
            <WifiOff className="h-4 w-4 mr-1" />
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}