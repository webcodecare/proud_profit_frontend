import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { 
  Search, 
  Plus, 
  Minus, 
  TrendingUp, 
  TrendingDown, 
  Star,
  Bell,
  Activity,
  Filter,
  X,
  CheckCircle
} from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AvailableTicker {
  id: string;
  symbol: string;
  description: string;
  category: string;
  isEnabled: boolean;
  marketCap: number;
}

interface UserSubscription {
  id: string;
  userId: string;
  tickerSymbol: string;
  subscribedAt: string;
  ticker?: AvailableTicker;
}

interface TickerPrice {
  symbol: string;
  price: number;
  change24h?: number;
  volume24h?: number;
}

interface SubscriptionManagerProps {
  onTickerSelect?: (symbol: string) => void;
  selectedTicker?: string;
}

export default function SubscriptionManager({ 
  onTickerSelect, 
  selectedTicker 
}: SubscriptionManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [showSubscribed, setShowSubscribed] = useState(false);

  // Fetch available tickers with search and autocomplete
  const { data: tickersResponse, isLoading: isLoadingTickers } = useQuery({
    queryKey: [`/api/tickers?search=${searchQuery}&category=${categoryFilter === 'all' ? '' : categoryFilter}&limit=100`],
    enabled: true,
  });

  const availableTickers = tickersResponse?.data || [];

  // Fetch user subscriptions
  const { data: userSubscriptions = [], isLoading: isLoadingSubscriptions } = useQuery<UserSubscription[]>({
    queryKey: ['/api/user/subscriptions'],
    enabled: !!user,
  });

  // Fetch prices for subscribed tickers
  const subscribedSymbols = userSubscriptions.map(sub => sub.tickerSymbol);
  const { data: tickerPrices = {} } = useQuery<Record<string, TickerPrice>>({
    queryKey: ['/api/market/prices', subscribedSymbols],
    queryFn: async () => {
      if (subscribedSymbols.length === 0) return {};
      
      const prices: Record<string, TickerPrice> = {};
      
      // Fetch prices for all subscribed tickers
      await Promise.all(
        subscribedSymbols.map(async (symbol) => {
          try {
            const response = await fetch(`/api/public/market/price/${symbol}`);
            if (response.ok) {
              const data = await response.json();
              prices[symbol] = {
                symbol,
                price: data.price,
                change24h: Math.random() * 10 - 5, // Mock 24h change
                volume24h: Math.random() * 1000000000, // Mock volume
              };
            }
          } catch (error) {
            console.error(`Failed to fetch price for ${symbol}:`, error);
          }
        })
      );
      
      return prices;
    },
    enabled: subscribedSymbols.length > 0,
    refetchInterval: 10000, // Refresh prices every 10 seconds
  });

  // Add subscription mutation
  const addSubscriptionMutation = useMutation({
    mutationFn: async (tickerSymbol: string) => {
      return await apiRequest('/api/user/subscriptions', {
        method: 'POST',
        body: JSON.stringify({ tickerSymbol }),
      });
    },
    onSuccess: (data, tickerSymbol) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/subscriptions'] });
      toast({
        title: 'Subscription Added',
        description: `Successfully subscribed to ${tickerSymbol}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Subscription Failed',
        description: error.message || 'Failed to add subscription',
        variant: 'destructive',
      });
    },
  });

  // Remove subscription mutation
  const removeSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      return await apiRequest(`/api/user/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/subscriptions'] });
      toast({
        title: 'Subscription Removed',
        description: 'Successfully unsubscribed from ticker',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Unsubscribe Failed',
        description: error.message || 'Failed to remove subscription',
        variant: 'destructive',
      });
    },
  });

  // Filter tickers based on search and category
  const filteredTickers = useMemo(() => {
    let filtered = availableTickers.filter(ticker => ticker.isEnabled);

    if (showSubscribed) {
      const subscribedSymbols = userSubscriptions.map(sub => sub.tickerSymbol);
      filtered = filtered.filter(ticker => subscribedSymbols.includes(ticker.symbol));
    }

    return filtered;
  }, [availableTickers, userSubscriptions, showSubscribed]);

  // Get autocomplete suggestions
  const autocompleteSuggestions = useMemo(() => {
    if (!searchQuery) return [];
    
    return filteredTickers
      .filter(ticker => 
        ticker.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticker.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 10);
  }, [filteredTickers, searchQuery]);

  // Check if ticker is subscribed
  const isTickerSubscribed = (symbol: string) => {
    return userSubscriptions.some(sub => sub.tickerSymbol === symbol);
  };

  // Get subscription for ticker
  const getSubscription = (symbol: string) => {
    return userSubscriptions.find(sub => sub.tickerSymbol === symbol);
  };

  // Handle ticker subscription toggle
  const handleSubscriptionToggle = (ticker: AvailableTicker) => {
    const subscription = getSubscription(ticker.symbol);
    
    if (subscription) {
      removeSubscriptionMutation.mutate(subscription.id);
    } else {
      addSubscriptionMutation.mutate(ticker.symbol);
    }
  };

  // Handle ticker selection for chart
  const handleTickerSelect = (symbol: string) => {
    onTickerSelect?.(symbol);
  };

  // Format price change
  const formatPriceChange = (change: number) => {
    const isPositive = change >= 0;
    return (
      <span className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {isPositive ? '+' : ''}{change.toFixed(2)}%
      </span>
    );
  };

  // Format volume
  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
    return `$${volume.toFixed(2)}`;
  };

  // Category options
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'major', label: 'Major' },
    { value: 'layer1', label: 'Layer 1' },
    { value: 'defi', label: 'DeFi' },
    { value: 'utility', label: 'Utility' },
    { value: 'emerging', label: 'Emerging' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ticker Subscriptions</h2>
          <p className="text-muted-foreground">
            Manage your cryptocurrency subscriptions and monitor price alerts
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {userSubscriptions.length} Subscribed
          </Badge>
          <Badge variant={showSubscribed ? 'default' : 'secondary'}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSubscribed(!showSubscribed)}
              className="h-auto p-0 font-normal"
            >
              {showSubscribed ? 'Show All' : 'Show Subscribed'}
            </Button>
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Tickers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search with Autocomplete */}
            <div className="flex-1">
              <Label htmlFor="search">Search Tickers</Label>
              <Popover open={isAutocompleteOpen && autocompleteSuggestions.length > 0}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Input
                      id="search"
                      placeholder="Search by symbol or name (e.g., BTC, Bitcoin)..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsAutocompleteOpen(e.target.value.length > 0);
                      }}
                      onFocus={() => setIsAutocompleteOpen(searchQuery.length > 0)}
                      onBlur={() => setTimeout(() => setIsAutocompleteOpen(false), 200)}
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => {
                          setSearchQuery('');
                          setIsAutocompleteOpen(false);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandEmpty>No tickers found.</CommandEmpty>
                    <CommandGroup>
                      {autocompleteSuggestions.map(ticker => (
                        <CommandItem
                          key={ticker.id}
                          onSelect={() => {
                            setSearchQuery(ticker.symbol);
                            setIsAutocompleteOpen(false);
                          }}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {ticker.symbol}
                            </Badge>
                            <span className="text-sm">{ticker.description}</span>
                          </div>
                          {isTickerSubscribed(ticker.symbol) && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Category Filter */}
            <div className="lg:w-48">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscribed Tickers */}
      {userSubscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Your Subscriptions ({userSubscriptions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userSubscriptions.map(subscription => {
                const price = tickerPrices[subscription.tickerSymbol];
                const isSelected = selectedTicker === subscription.tickerSymbol;
                
                return (
                  <Card 
                    key={subscription.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleTickerSelect(subscription.tickerSymbol)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="default">
                              {subscription.tickerSymbol}
                            </Badge>
                            {isSelected && (
                              <Badge variant="outline" className="text-xs">
                                Active
                              </Badge>
                            )}
                          </div>
                          
                          {price && (
                            <div className="space-y-1">
                              <div className="text-lg font-bold">
                                ${price.price.toFixed(2)}
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span>24h Change:</span>
                                {formatPriceChange(price.change24h || 0)}
                              </div>
                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>Volume:</span>
                                <span>{formatVolume(price.volume24h || 0)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSubscriptionMutation.mutate(subscription.id);
                          }}
                          disabled={removeSubscriptionMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Tickers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Available Tickers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTickers ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Loading tickers...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {showSubscribed ? 'No subscribed tickers found.' : 'No tickers found matching your criteria.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {filteredTickers.map(ticker => {
                    const isSubscribed = isTickerSubscribed(ticker.symbol);
                    const price = tickerPrices[ticker.symbol];
                    
                    return (
                      <div
                        key={ticker.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {ticker.symbol}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {ticker.category}
                            </Badge>
                          </div>
                          
                          <div className="flex-1">
                            <p className="font-medium">{ticker.description}</p>
                            {price && (
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>${price.price.toFixed(2)}</span>
                                {formatPriceChange(price.change24h || 0)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isSubscribed && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTickerSelect(ticker.symbol)}
                              className="text-primary"
                            >
                              View Chart
                            </Button>
                          )}
                          
                          <Button
                            variant={isSubscribed ? "destructive" : "default"}
                            size="sm"
                            onClick={() => handleSubscriptionToggle(ticker)}
                            disabled={addSubscriptionMutation.isPending || removeSubscriptionMutation.isPending}
                          >
                            {isSubscribed ? (
                              <>
                                <Minus className="h-4 w-4 mr-1" />
                                Unsubscribe
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-1" />
                                Subscribe
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}