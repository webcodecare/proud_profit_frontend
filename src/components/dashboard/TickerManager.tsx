import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, Minus } from "lucide-react";

interface Ticker {
  id: string;
  symbol: string;
  description: string;
  category: string;
  isEnabled: boolean;
}

interface TickerManagerProps {
  selectedTickers: string[];
  onTickerToggle: (symbol: string) => void;
}

export default function TickerManager({ selectedTickers, onTickerToggle }: TickerManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: tickers, isLoading } = useQuery({
    queryKey: ["/api/tickers/enabled"],
    queryFn: async () => {
      const response = await fetch("/api/tickers/enabled");
      if (!response.ok) throw new Error("Failed to fetch tickers");
      return await response.json() as Ticker[];
    },
  });

  const filteredTickers = tickers?.filter(
    (ticker) =>
      ticker.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticker.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const categoryColors: Record<string, string> = {
    major: "bg-blue-100 text-blue-800",
    layer1: "bg-green-100 text-green-800",
    defi: "bg-purple-100 text-purple-800",
    utility: "bg-orange-100 text-orange-800",
    legacy: "bg-gray-100 text-gray-800",
    emerging: "bg-yellow-100 text-yellow-800",
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ticker Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-3 sm:p-4">
      <CardHeader className="p-0 pb-3">
        <CardTitle className="text-sm sm:text-base">Ticker Manager</CardTitle>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 sm:pl-10 text-sm h-8 sm:h-9"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
          {filteredTickers.map((ticker) => {
            const isSelected = selectedTickers.includes(ticker.symbol);
            return (
              <div
                key={ticker.id}
                className="flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs sm:text-sm truncate">{ticker.symbol}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {ticker.description}
                    </p>
                  </div>
                  <Badge 
                    className={`text-xs px-1 py-0.5 sm:px-2 sm:py-1 ${categoryColors[ticker.category || 'emerging'] || categoryColors.emerging}`}
                  >
                    <span className="hidden sm:inline">{ticker.category || 'N/A'}</span>
                    <span className="sm:hidden">{(ticker.category || 'N/A').substring(0, 3)}</span>
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant={isSelected ? "destructive" : "default"}
                  onClick={() => onTickerToggle(ticker.symbol)}
                  className="ml-2 text-xs px-2 sm:px-3 h-7 sm:h-8"
                >
                  {isSelected ? (
                    <>
                      <Minus className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                      <span className="hidden sm:inline">Remove</span>
                      <span className="sm:hidden">-</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                      <span className="hidden sm:inline">Add</span>
                      <span className="sm:hidden">+</span>
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}