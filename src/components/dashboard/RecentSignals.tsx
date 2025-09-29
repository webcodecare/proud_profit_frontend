import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface Signal {
  id: string;
  ticker: string;
  signalType: "buy" | "sell";
  price: string;
  timestamp: string;
  source?: string;
  note?: string;
}

interface RecentSignalsProps {
  signals: Signal[];
  isLoading: boolean;
}

export default function RecentSignals({ signals, isLoading }: RecentSignalsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Signals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Signals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {signals.length > 0 ? (
            signals.slice(0, 5).map((signal) => (
              <div
                key={signal.id}
                className="flex items-center justify-between border-b pb-4 last:border-b-0"
              >
                <div className="flex items-center space-x-3">
                  <Badge
                    variant={signal.signalType === "buy" ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {signal.signalType.toUpperCase()}
                  </Badge>
                  <div>
                    <p className="font-medium text-sm">{signal.ticker}</p>
                    <p className="text-xs text-muted-foreground">
                      ${signal.price}
                      {signal.source && ` • ${signal.source}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(signal.timestamp), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No recent signals</p>
              <p className="text-sm text-muted-foreground mt-1">
                Check back later for trading opportunities
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}