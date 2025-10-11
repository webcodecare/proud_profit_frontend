import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { buildApiUrl } from "@/lib/config";

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
}

export default function MarketOverview() {
  const { data: btcData, isLoading: btcLoading } = useQuery({
    queryKey: ["/api/public/market/price/BTCUSDT"],
    queryFn: async () => {
      const response = await fetch(buildApiUrl("/api/public/market/price/BTCUSDT"));
      if (!response.ok) throw new Error("Failed to fetch BTC price");
      const data = await response.json();
      return {
        symbol: data.symbol,
        price: data.price,
        change24h: 0,
        changePercent24h: 0,
        volume24h: 0
      } as MarketData;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: ethData, isLoading: ethLoading } = useQuery({
    queryKey: ["/api/public/market/price/ETHUSDT"],
    queryFn: async () => {
      const response = await fetch(buildApiUrl("/api/public/market/price/ETHUSDT"));
      if (!response.ok) throw new Error("Failed to fetch ETH price");
      const data = await response.json();
      return {
        symbol: data.symbol,
        price: data.price,
        change24h: 0,
        changePercent24h: 0,
        volume24h: 0
      } as MarketData;
    },
    refetchInterval: 5000,
  });

  const isLoading = btcLoading || ethLoading;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
    return volume.toFixed(0);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Market Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                  <div className="space-y-1">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const marketData = [
    { name: "Bitcoin", symbol: "BTC", data: btcData },
    { name: "Ethereum", symbol: "ETH", data: ethData }
  ].filter(item => item.data);

  return (
    <Card className="p-3 sm:p-4">
      <CardHeader className="p-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
          Market Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-3 sm:space-y-4">
          {marketData.map((item) => {
            const isPositive = (item.data?.changePercent24h || 0) >= 0;
            const TrendIcon = isPositive ? TrendingUp : TrendingDown;
            
            return (
              <div
                key={item.symbol}
                className="flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div className="h-6 w-6 sm:h-8 sm:w-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-orange-700">
                      {item.symbol}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-xs sm:text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="hidden sm:inline">Vol: </span>
                      {formatVolume(item.data?.volume24h || 0)}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-xs sm:text-sm">
                    {formatPrice(item.data?.price || 0)}
                  </p>
                  <Badge
                    variant={isPositive ? "default" : "destructive"}
                    className="text-xs flex items-center gap-1 mt-1"
                  >
                    <TrendIcon className="h-2 w-2 sm:h-3 sm:w-3" />
                    {Math.abs(item.data?.changePercent24h || 0).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}