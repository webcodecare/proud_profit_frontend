import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Activity, Clock, Zap } from 'lucide-react';

interface StreamingMetricsProps {
  updateCount: number;
  averageLatency: number;
  updateRate: number;
  dataTransferred: number;
}

export default function StreamingMetrics({
  updateCount = 0,
  averageLatency = 0,
  updateRate = 0,
  dataTransferred = 0,
}: StreamingMetricsProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 100) return 'text-green-500';
    if (latency < 300) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getUpdateRateColor = (rate: number) => {
    if (rate > 1) return 'text-green-500';
    if (rate > 0.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Streaming Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Updates</span>
            </div>
            <p className="text-2xl font-bold">{updateCount.toLocaleString()}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className={`h-4 w-4 ${getLatencyColor(averageLatency)}`} />
              <span className="text-sm text-muted-foreground">Latency</span>
            </div>
            <p className={`text-2xl font-bold ${getLatencyColor(averageLatency)}`}>
              {averageLatency}ms
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className={`h-4 w-4 ${getUpdateRateColor(updateRate)}`} />
              <span className="text-sm text-muted-foreground">Rate</span>
            </div>
            <p className={`text-lg font-bold ${getUpdateRateColor(updateRate)}`}>
              {updateRate.toFixed(1)}/s
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Data</span>
            </div>
            <p className="text-lg font-bold">
              {formatBytes(dataTransferred)}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Performance</span>
            <Badge 
              variant="outline"
              className={`${
                averageLatency < 100 && updateRate > 1
                  ? 'bg-green-500/10 text-green-500 border-green-500/20'
                  : averageLatency < 300 && updateRate > 0.5
                  ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                  : 'bg-red-500/10 text-red-500 border-red-500/20'
              }`}
            >
              {averageLatency < 100 && updateRate > 1 
                ? 'Excellent' 
                : averageLatency < 300 && updateRate > 0.5 
                ? 'Good' 
                : 'Poor'
              }
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}