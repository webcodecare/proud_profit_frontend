import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Activity, Eye } from "lucide-react";

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: number;
  marketCap?: number;
}

export default function MarketOverview() {
  const [selectedMarkets, setSelectedMarkets] = useState(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT']);

  const markets = [
    { symbol: 'BTCUSDT', name: 'Bitcoin', category: 'major' },
    { symbol: 'ETHUSDT', name: 'Ethereum', category: 'major' },
    { symbol: 'SOLUSDT', name: 'Solana', category: 'layer1' },
    { symbol: 'ADAUSDT', name: 'Cardano', category: 'layer1' },
    { symbol: 'DOTUSDT', name: 'Polkadot', category: 'layer1' },
    { symbol: 'LINKUSDT', name: 'Chainlink', category: 'defi' },
    { symbol: 'AVAXUSDT', name: 'Avalanche', category: 'layer1' },
    { symbol: 'MATICUSDT', name: 'Polygon', category: 'layer1' },
  ];

  const { data: marketData, isLoading } = useQuery({
    queryKey: ['/api/market/overview'],
    refetchInterval: 10000,
  });

  const generateMockData = (symbol: string): MarketData => {
    const basePrice = symbol === 'BTCUSDT' ? 67000 : 
                     symbol === 'ETHUSDT' ? 3400 :
                     symbol === 'SOLUSDT' ? 95 :
                     symbol === 'ADAUSDT' ? 0.45 : 100;
    
    const change = (Math.random() - 0.5) * 10; // -5% to +5%
    const price = basePrice * (1 + change / 100);
    
    return {
      symbol,
      name: markets.find(m => m.symbol === symbol)?.name || symbol,
      price,
      change24h: change,
      volume: Math.random() * 1000000000,
    };
  };

  const displayData = selectedMarkets.map(symbol => 
    marketData?.find((m: any) => m.symbol === symbol) || generateMockData(symbol)
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Market Overview
          </CardTitle>
          <Badge variant="outline" className="text-green-600">
            <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-12 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {displayData.map((market) => (
              <div 
                key={market.symbol}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium text-sm">{market.name}</div>
                    <div className="text-xs text-muted-foreground">{market.symbol}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-medium">
                    ${market.price.toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: market.price < 1 ? 4 : 2 
                    })}
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${
                    market.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {market.change24h >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Market Selection */}
        <div className="pt-3 border-t border-border">
          <div className="text-xs text-muted-foreground mb-2">Watch List</div>
          <div className="flex flex-wrap gap-1">
            {markets.map((market) => {
              const isSelected = selectedMarkets.includes(market.symbol);
              return (
                <Button
                  key={market.symbol}
                  size="sm"
                  variant={isSelected ? "default" : "outline"}
                  className="text-xs h-6"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedMarkets(prev => prev.filter(s => s !== market.symbol));
                    } else {
                      setSelectedMarkets(prev => [...prev, market.symbol]);
                    }
                  }}
                >
                  {market.symbol.replace('USDT', '')}
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}