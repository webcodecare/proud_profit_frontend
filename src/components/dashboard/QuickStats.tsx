import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock, Target } from "lucide-react";

interface QuickStatsProps {
  recentSignals: Array<{
    id: string;
    ticker: string;
    signalType: "buy" | "sell";
    price: string;
    timestamp: string;
  }>;
}

export default function QuickStats({ recentSignals }: QuickStatsProps) {
  const buySignals = recentSignals.filter(s => s.signalType === "buy").length;
  const sellSignals = recentSignals.filter(s => s.signalType === "sell").length;
  const totalSignals = recentSignals.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Signals</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSignals}</div>
          <p className="text-xs text-muted-foreground">Last 24 hours</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Buy Signals</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{buySignals}</div>
          <p className="text-xs text-muted-foreground">Active buy opportunities</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sell Signals</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{sellSignals}</div>
          <p className="text-xs text-muted-foreground">Active sell opportunities</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Last Signal</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {recentSignals.length > 0 ? (
              <Badge 
                variant={recentSignals[0].signalType === "buy" ? "default" : "destructive"}
                className="text-sm"
              >
                {recentSignals[0].signalType.toUpperCase()}
              </Badge>
            ) : (
              "No signals"
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {recentSignals.length > 0 ? recentSignals[0].ticker : "Waiting for signals"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}