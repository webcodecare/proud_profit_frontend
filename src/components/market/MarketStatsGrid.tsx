import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MarketStat {
  symbol: string;
  price: string;
  change24h: string;
  changePercent: string;
  volume: string;
}

interface MarketStatsGridProps {
  stats: MarketStat[];
  isLoading: boolean;
}

export default function MarketStatsGrid({ stats, isLoading }: MarketStatsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                <div className="h-8 bg-muted rounded w-32 mb-2"></div>
                <div className="h-4 bg-muted rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats?.map((stat) => {
        const isPositive = stat.changePercent.startsWith('+');
        return (
          <Card key={stat.symbol} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono font-semibold text-lg">{stat.symbol}</div>
                {isPositive ? (
                  <TrendingUp className="h-5 w-5 text-orange-400" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="text-2xl font-bold mb-2">${stat.price}</div>
              <div className={`text-sm ${isPositive ? 'text-orange-400' : 'text-red-400'}`}>
                {stat.change24h} ({stat.changePercent})
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Vol: ${stat.volume}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}