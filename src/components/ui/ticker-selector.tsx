import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Star, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AvailableTicker {
  id: string;
  symbol: string;
  description: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap?: number;
}

interface TickerSelectorProps {
  selectedTickers: string[];
  onTickerToggle: (symbol: string) => void;
  maxTickers?: number;
  className?: string;
}

export default function TickerSelector({ 
  selectedTickers, 
  onTickerToggle, 
  maxTickers = 10,
  className = "" 
}: TickerSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: tickers = [], isLoading } = useQuery<AvailableTicker[]>({
    queryKey: ["/api/tickers/enabled"],
  });

  const { data: marketData = [], isLoading: isLoadingMarket } = useQuery<MarketData[]>({
    queryKey: ["/api/market/prices", selectedTickers],
    queryFn: async () => {
      if (selectedTickers.length === 0) return [];
      const response = await fetch(`/api/market/prices?symbols=${selectedTickers.join(',')}`);
      if (!response.ok) throw new Error('Failed to fetch market data');
      return response.json();
    },
    enabled: selectedTickers.length > 0,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const filteredTickers = tickers.filter(ticker =>
    ticker.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticker.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const popularTickers = [
    "BTCUSDT", "ETHUSDT", "BNBUSDT", "ADAUSDT", 
    "SOLUSDT", "XRPUSDT", "DOTUSDT", "MATICUSDT"
  ];

  const getMarketDataForTicker = (symbol: string) => {
    return marketData.find(data => data.symbol === symbol);
  };

  const formatPrice = (price: number) => {
    if (price < 1) return `$${price.toFixed(6)}`;
    if (price < 100) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  const formatChange = (change: number, isPercent: boolean = false) => {
    const formatted = isPercent ? `${change.toFixed(2)}%` : formatPrice(Math.abs(change));
    return change >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  return (
    <div className={className}>
      {/* Selected Tickers Display */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Your Watchlist</h3>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Ticker
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Cryptocurrency Tickers</DialogTitle>
                <DialogDescription>
                  Select up to {maxTickers} cryptocurrencies to track on your dashboard
                </DialogDescription>
              </DialogHeader>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cryptocurrencies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Popular Tickers */}
              <div>
                <h4 className="text-sm font-medium mb-3">Popular Cryptocurrencies</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {popularTickers.map((symbol) => {
                    const ticker = tickers.find(t => t.symbol === symbol);
                    if (!ticker || !ticker.isEnabled) return null;
                    
                    const isSelected = selectedTickers.includes(symbol);
                    const canSelect = selectedTickers.length < maxTickers || isSelected;
                    
                    return (
                      <Button
                        key={symbol}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        disabled={!canSelect}
                        onClick={() => onTickerToggle(symbol)}
                        className="h-auto p-3 flex-col"
                      >
                        <div className="font-mono text-xs">{symbol.replace('USDT', '')}</div>
                        <div className="text-xs opacity-70">{ticker.description.split(' ')[0]}</div>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* All Available Tickers */}
              <div>
                <h4 className="text-sm font-medium mb-3">All Available Tickers</h4>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {isLoading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
                      ))
                    ) : (
                      filteredTickers.map((ticker) => {
                        const isSelected = selectedTickers.includes(ticker.symbol);
                        const canSelect = selectedTickers.length < maxTickers || isSelected;
                        
                        return (
                          <div key={ticker.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div>
                                <p className="font-mono font-medium">{ticker.symbol}</p>
                                <p className="text-sm text-muted-foreground">{ticker.description}</p>
                              </div>
                            </div>
                            <Button
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              disabled={!canSelect}
                              onClick={() => onTickerToggle(ticker.symbol)}
                            >
                              {isSelected ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                              {isSelected ? "Remove" : "Add"}
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="text-sm text-muted-foreground">
                {selectedTickers.length} of {maxTickers} tickers selected
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Selected Tickers Grid */}
        {selectedTickers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="space-y-3">
                <Star className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-medium">No tickers selected</h3>
                <p className="text-sm text-muted-foreground">
                  Add cryptocurrencies to your watchlist to track their performance
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Ticker
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedTickers.map((symbol) => {
              const ticker = tickers.find(t => t.symbol === symbol);
              const marketInfo = getMarketDataForTicker(symbol);
              
              return (
                <Card key={symbol} className="relative group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-mono">{symbol.replace('USDT', '')}</CardTitle>
                        <p className="text-sm text-muted-foreground">{ticker?.description.split(' ')[0] || symbol}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onTickerToggle(symbol)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingMarket ? (
                      <div className="space-y-2">
                        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                      </div>
                    ) : marketInfo ? (
                      <div className="space-y-2">
                        <div className="text-2xl font-bold">
                          {formatPrice(marketInfo.price)}
                        </div>
                        <div className="flex items-center space-x-2">
                          {marketInfo.changePercent24h >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`text-sm font-medium ${
                            marketInfo.changePercent24h >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {formatChange(marketInfo.changePercent24h, true)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatChange(marketInfo.change24h)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Vol: {marketInfo.volume24h ? `$${(marketInfo.volume24h / 1000000).toFixed(1)}M` : 'N/A'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Market data unavailable
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}