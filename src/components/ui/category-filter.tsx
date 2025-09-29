import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Bitcoin, 
  Layers, 
  DollarSign, 
  Clock, 
  Settings, 
  TrendingUp,
  Star,
  Filter
} from "lucide-react";

interface AvailableTicker {
  id: string;
  symbol: string;
  description: string;
  category: "major" | "layer1" | "defi" | "legacy" | "utility" | "emerging" | "other";
  marketCap?: number;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CategoryFilterProps {
  tickers: AvailableTicker[];
  selectedTickers: string[];
  onTickerToggle: (symbol: string) => void;
  maxTickers?: number;
}

const categoryInfo = {
  major: {
    icon: Bitcoin,
    label: "Major",
    description: "Top market cap cryptocurrencies",
    color: "bg-yellow-500",
  },
  layer1: {
    icon: Layers,
    label: "Layer 1",
    description: "Blockchain protocols",
    color: "bg-blue-500",
  },
  defi: {
    icon: DollarSign,
    label: "DeFi",
    description: "Decentralized finance tokens",
    color: "bg-green-500",
  },
  legacy: {
    icon: Clock,
    label: "Legacy",
    description: "Established cryptocurrencies",
    color: "bg-gray-500",
  },
  utility: {
    icon: Settings,
    label: "Utility",
    description: "Infrastructure and utility tokens",
    color: "bg-purple-500",
  },
  emerging: {
    icon: TrendingUp,
    label: "Emerging",
    description: "Growing market opportunities",
    color: "bg-orange-500",
  },
  other: {
    icon: Star,
    label: "Other",
    description: "Miscellaneous tokens",
    color: "bg-pink-500",
  },
};

export default function CategoryFilter({ 
  tickers, 
  selectedTickers, 
  onTickerToggle, 
  maxTickers = 10 
}: CategoryFilterProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const groupedTickers = tickers.reduce((acc, ticker) => {
    const category = ticker.category || "other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(ticker);
    return acc;
  }, {} as Record<string, AvailableTicker[]>);

  // Sort tickers within each category by market cap
  Object.keys(groupedTickers).forEach(category => {
    groupedTickers[category].sort((a, b) => (a.marketCap || 999) - (b.marketCap || 999));
  });

  const filteredTickers = selectedCategory === "all" 
    ? tickers.sort((a, b) => (a.marketCap || 999) - (b.marketCap || 999))
    : groupedTickers[selectedCategory] || [];

  const getCategoryCount = (category: string) => {
    return groupedTickers[category]?.length || 0;
  };

  const getSelectedCount = (category: string) => {
    return groupedTickers[category]?.filter(t => selectedTickers.includes(t.symbol)).length || 0;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Cryptocurrency Categories
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 mb-6">
            <TabsTrigger value="all" className="text-xs">
              All ({tickers.length})
            </TabsTrigger>
            {Object.entries(categoryInfo).map(([category, info]) => {
              const count = getCategoryCount(category);
              if (count === 0) return null;
              
              return (
                <TabsTrigger 
                  key={category} 
                  value={category}
                  className="text-xs flex flex-col gap-1"
                >
                  <div className="flex items-center gap-1">
                    <info.icon className="h-3 w-3" />
                    {info.label}
                  </div>
                  <span className="text-xs opacity-70">({count})</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="all">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(categoryInfo).map(([category, info]) => {
                  const count = getCategoryCount(category);
                  const selectedCount = getSelectedCount(category);
                  if (count === 0) return null;

                  return (
                    <Card key={category} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${info.color}`} />
                            <info.icon className="h-4 w-4" />
                            <span className="font-medium">{info.label}</span>
                          </div>
                          <Badge variant="outline">
                            {selectedCount}/{count}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {info.description}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setSelectedCategory(category)}
                          className="w-full"
                        >
                          View Tokens
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {Object.entries(categoryInfo).map(([category, info]) => {
            const categoryTickers = groupedTickers[category] || [];
            if (categoryTickers.length === 0) return null;

            return (
              <TabsContent key={category} value={category}>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-4 h-4 rounded-full ${info.color}`} />
                    <info.icon className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">{info.label} Tokens</h3>
                    <Badge variant="outline">
                      {getSelectedCount(category)}/{categoryTickers.length} selected
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categoryTickers.map((ticker) => {
                      const isSelected = selectedTickers.includes(ticker.symbol);
                      const canSelect = selectedTickers.length < maxTickers || isSelected;
                      
                      return (
                        <Card 
                          key={ticker.id}
                          className={`cursor-pointer transition-all ${
                            isSelected 
                              ? "ring-2 ring-primary bg-primary/5" 
                              : "hover:shadow-md"
                          } ${!canSelect ? "opacity-50" : ""}`}
                          onClick={() => canSelect && onTickerToggle(ticker.symbol)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm">
                                  {ticker.symbol.replace("USDT", "")}
                                </span>
                                {ticker.marketCap && ticker.marketCap <= 10 && (
                                  <Badge variant="secondary" className="text-xs">
                                    #{ticker.marketCap}
                                  </Badge>
                                )}
                              </div>
                              {isSelected && (
                                <Badge variant="default" className="text-xs">
                                  Selected
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {ticker.description}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>

        {selectedTickers.length >= maxTickers && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Maximum of {maxTickers} tickers selected. Remove some to add new ones.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}