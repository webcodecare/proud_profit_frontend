import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Signal {
  id: string;
  ticker: string;
  signalType: "buy" | "sell";
  price: string;
  timestamp: string;
  source?: string;
  timeframe?: string;
  notes?: string;
}

interface SignalsListProps {
  ticker?: string;
  limit?: number;
  title?: string;
}

export default function SignalsList({ 
  ticker = "BTCUSDT", 
  limit = 5, 
  title = "Recent Signals" 
}: SignalsListProps) {
  const { data: signals, isLoading, error } = useQuery({
    queryKey: ["/api/public/signals/alerts", ticker, limit],
    queryFn: async () => {
      const response = await fetch(
        `/api/public/signals/alerts?ticker=${ticker}&limit=${limit}`
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Signals API error:", errorText);
        throw new Error("Failed to fetch signals");
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    retry: 2,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Unable to load signals</p>
            <p className="text-sm text-muted-foreground mt-1">
              Please try again later
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-6 w-12" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const signalsList = signals || [];

  return (
    <Card className="p-3 sm:p-4">
      <CardHeader className="p-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-3 sm:space-y-4">
          {signalsList.length > 0 ? (
            signalsList.map((signal: Signal) => {
              const isPositive = signal.signalType === "buy";
              const TrendIcon = isPositive ? TrendingUp : TrendingDown;
              
              return (
                <div
                  key={signal.id}
                  className="flex items-center justify-between border-b pb-2 sm:pb-3 last:border-b-0"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <Badge
                      variant={isPositive ? "default" : "destructive"}
                      className="flex items-center gap-1 text-xs px-2 py-1"
                    >
                      <TrendIcon className="h-2 w-2 sm:h-3 sm:w-3" />
                      <span className="hidden sm:inline">{signal.signalType.toUpperCase()}</span>
                      <span className="sm:hidden">{signal.signalType === "buy" ? "B" : "S"}</span>
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs sm:text-sm truncate">{signal.ticker}</p>
                      <div className="flex items-center gap-1 sm:gap-2 text-xs text-muted-foreground">
                        <span>${signal.price}</span>
                        {signal.timeframe && (
                          <span className="hidden sm:inline">• {signal.timeframe}</span>
                        )}
                        {signal.source && (
                          <span className="hidden md:inline">• {signal.source}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(signal.timestamp), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 sm:py-8">
              <Clock className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <p className="text-muted-foreground text-sm">No signals available</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Check back later for trading opportunities
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}