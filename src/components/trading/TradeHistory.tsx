import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";

interface Trade {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  duration: string;
  timestamp: Date;
  exitTimestamp: Date;
}

interface TradeHistoryProps {
  trades: Trade[];
}

export default function TradeHistory({ trades }: TradeHistoryProps) {
  const recentTrades = trades.slice(-10); // Show last 10 trades

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Trade History ({trades.length} total)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentTrades.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No completed trades</p>
        ) : (
          <div className="space-y-3">
            {recentTrades.reverse().map((trade) => (
              <div key={trade.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">{trade.symbol}</span>
                    <Badge 
                      variant={trade.type === 'buy' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {trade.type.toUpperCase()}
                    </Badge>
                    <Badge 
                      variant={trade.pnl >= 0 ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {trade.pnl >= 0 ? 'PROFIT' : 'LOSS'}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1">
                    {trade.pnl >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-orange-400" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-400" />
                    )}
                    <span className={`text-sm font-medium ${trade.pnl >= 0 ? 'text-orange-400' : 'text-red-400'}`}>
                      ${trade.pnl.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>
                    <p>Entry: ${trade.entryPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p>Exit: ${trade.exitPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p>Duration: {trade.duration}</p>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mt-1">
                  {trade.exitTimestamp.toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}