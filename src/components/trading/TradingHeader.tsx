import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Activity, DollarSign, Volume2, BarChart3 } from "lucide-react";

interface TradingHeaderProps {
  symbol: string;
}

export default function TradingHeader({ symbol }: TradingHeaderProps) {
  const { data: priceData } = useQuery({
    queryKey: ['/api/market/price', symbol],
    refetchInterval: 5000,
  });

  // Mock data for demonstration
  const mockPrice = 67432.50;
  const mockChange = 2.34;
  const mockVolume = 28456789123;
  const mockHigh = 68250.00;
  const mockLow = 66890.00;

  const currentPrice = priceData?.price || mockPrice;
  const change24h = mockChange;
  const volume24h = mockVolume;
  const high24h = mockHigh;
  const low24h = mockLow;

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Main Price Info */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">₿</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{symbol.replace('BINANCE:', '').replace('USDT', '/USDT')}</h2>
                <p className="text-sm text-muted-foreground">Bitcoin/Tether USD</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <span className="text-3xl font-bold">${currentPrice.toLocaleString()}</span>
              <Badge 
                variant="outline" 
                className={`ml-2 ${change24h >= 0 ? 'text-green-600 border-green-600' : 'text-red-600 border-red-600'}`}
              >
                {change24h >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
              </Badge>
            </div>
          </div>

          {/* Market Stats */}
          <div className="flex items-center space-x-8">
            <div className="text-center">
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                <span>24h High</span>
              </div>
              <div className="font-semibold">${high24h.toLocaleString()}</div>
            </div>

            <div className="text-center">
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                <span>24h Low</span>
              </div>
              <div className="font-semibold">${low24h.toLocaleString()}</div>
            </div>

            <div className="text-center">
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Volume2 className="h-4 w-4" />
                <span>24h Volume</span>
              </div>
              <div className="font-semibold">${(volume24h / 1000000000).toFixed(2)}B</div>
            </div>

            <div className="text-center">
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span>Market Cap</span>
              </div>
              <div className="font-semibold">$1.34T</div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                Live Data
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <span className="text-muted-foreground">Last: <span className="text-foreground font-medium">${currentPrice.toLocaleString()}</span></span>
              <span className="text-muted-foreground">Change: <span className={change24h >= 0 ? 'text-green-600' : 'text-red-600'}>{change24h >= 0 ? '+' : ''}${Math.abs(change24h * currentPrice / 100).toFixed(2)}</span></span>
              <span className="text-muted-foreground">Volume: <span className="text-foreground font-medium">{(volume24h / 1000000).toFixed(0)}M USDT</span></span>
            </div>
            
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>Updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}