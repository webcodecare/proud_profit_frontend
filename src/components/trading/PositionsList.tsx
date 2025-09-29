import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, X } from "lucide-react";

interface Position {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  timestamp: Date;
}

interface PositionsListProps {
  positions: Position[];
  onClosePosition: (id: string) => void;
}

export default function PositionsList({ positions, onClosePosition }: PositionsListProps) {
  if (positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Open Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No open positions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Open Positions ({positions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {positions.map((position) => (
            <div key={position.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{position.symbol}</span>
                  <Badge variant={position.type === 'buy' ? 'default' : 'secondary'}>
                    {position.type.toUpperCase()}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onClosePosition(position.id)}
                  className="text-red-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Entry Price</p>
                  <p className="font-medium">${position.entryPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Price</p>
                  <p className="font-medium">${position.currentPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Quantity</p>
                  <p className="font-medium">{position.quantity.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">P&L</p>
                  <div className="flex items-center space-x-1">
                    {position.pnl >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-orange-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-400" />
                    )}
                    <span className={`font-medium ${position.pnl >= 0 ? 'text-orange-400' : 'text-red-400'}`}>
                      ${position.pnl.toFixed(2)} ({position.pnlPercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                Opened: {position.timestamp.toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}