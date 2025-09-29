import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Plus, Trash2, Settings, Activity, TrendingUp, TrendingDown, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import Sidebar from '@/components/layout/Sidebar';

interface TickerTimeframe {
  id: string;
  tickerSymbol: string;
  timeframe: string;
  description: string;
  isEnabled: boolean;
  createdAt: string;
}

interface Signal {
  id: string;
  symbol: string;
  signalType: 'buy' | 'sell';
  price: number;
  timeframe: string;
  timestamp: string;
  notes?: string;
  confidence?: number;
}

export default function SignalManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form states
  const [newCombination, setNewCombination] = useState({
    tickerSymbol: '',
    timeframe: '',
    description: ''
  });
  
  const [newSignal, setNewSignal] = useState({
    symbol: '',
    signalType: 'buy' as 'buy' | 'sell',
    price: '',
    timeframe: '',
    notes: '',
    confidence: ''
  });

  // Timeframe options
  const timeframes = ['30M', '1H', '4H', '8H', '12H', '1D', '1W', '1M'];

  // Fetch ticker/timeframe combinations
  const { data: combinationsData, isLoading: combinationsLoading } = useQuery({
    queryKey: ['/api/admin/ticker-timeframes'],
    queryFn: () => apiRequest('/api/admin/ticker-timeframes')
  });

  // Fetch all signals
  const { data: signalsData, isLoading: signalsLoading } = useQuery({
    queryKey: ['/api/admin/signals'],
    queryFn: () => apiRequest('/api/admin/signals')
  });

  // Fetch available tickers
  const { data: tickers, isLoading: tickersLoading } = useQuery({
    queryKey: ['/api/admin/tickers'],
    queryFn: () => apiRequest('/api/admin/tickers')
  });

  // Create ticker/timeframe combination mutation
  const createCombinationMutation = useMutation({
    mutationFn: (combination: any) => apiRequest('/api/admin/ticker-timeframes', {
      method: 'POST',
      body: JSON.stringify(combination)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ticker-timeframes'] });
      setNewCombination({ tickerSymbol: '', timeframe: '', description: '' });
      toast({
        title: 'Combination Added',
        description: 'New ticker/timeframe combination created successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create combination',
        variant: 'destructive'
      });
    }
  });

  // Delete combination mutation
  const deleteCombinationMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/ticker-timeframes/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ticker-timeframes'] });
      toast({
        title: 'Combination Removed',
        description: 'Ticker/timeframe combination deleted successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Deletion Failed',
        description: error.message || 'Failed to delete combination',
        variant: 'destructive'
      });
    }
  });

  // Create signal mutation
  const createSignalMutation = useMutation({
    mutationFn: (signal: any) => apiRequest('/api/admin/signals', {
      method: 'POST',
      body: JSON.stringify({
        symbol: signal.symbol,
        timeframe: signal.timeframe,
        signalType: signal.signalType,
        price: parseFloat(signal.price),
        notes: signal.notes,
        confidence: signal.confidence ? parseInt(signal.confidence) : undefined
      })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/signals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/signals'] });
      setNewSignal({
        symbol: '',
        signalType: 'buy',
        price: '',
        timeframe: '',
        notes: '',
        confidence: ''
      });
      toast({
        title: 'Signal Created',
        description: 'Buy/sell signal sent successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Signal Failed',
        description: error.message || 'Failed to create signal',
        variant: 'destructive'
      });
    }
  });

  // Handle form submissions
  const handleCreateCombination = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCombination.tickerSymbol || !newCombination.timeframe) {
      toast({
        title: 'Missing Information',
        description: 'Please provide ticker symbol and timeframe',
        variant: 'destructive'
      });
      return;
    }

    // Check if combination already exists
    const existingCombination = combinations.find((combo: TickerTimeframe) => 
      combo.tickerSymbol === newCombination.tickerSymbol && 
      combo.timeframe === newCombination.timeframe
    );

    if (existingCombination) {
      toast({
        title: 'Combination Exists',
        description: `${newCombination.tickerSymbol} - ${newCombination.timeframe} already exists`,
        variant: 'destructive'
      });
      return;
    }

    createCombinationMutation.mutate(newCombination);
  };

  const handleCreateSignal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSignal.symbol || !newSignal.price || !newSignal.timeframe) {
      toast({
        title: 'Missing Information',
        description: 'Please provide symbol, price, and timeframe',
        variant: 'destructive'
      });
      return;
    }
    createSignalMutation.mutate(newSignal);
  };

  const combinations = combinationsData?.combinations || [];
  const signals = signalsData?.signals || [];
  
  // Get enabled combinations for signal creation
  const enabledCombinations = combinations.filter((combo: TickerTimeframe) => combo.isEnabled);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 ml-64 p-6 overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Signal Management</h1>
              <p className="text-muted-foreground">
                Manage ticker/timeframe combinations and create buy/sell signals
              </p>
            </div>
          </div>

      <Tabs defaultValue="combinations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="combinations">Ticker/Timeframe Combinations</TabsTrigger>
          <TabsTrigger value="signals">Create Signals</TabsTrigger>
          <TabsTrigger value="signal-history">Signal History</TabsTrigger>
        </TabsList>

        <TabsContent value="combinations">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Combination Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Ticker/Timeframe
                </CardTitle>
                <CardDescription>
                  Create new ticker/timeframe combinations for users to subscribe to
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCombination} className="space-y-4">
                  <div>
                    <Label htmlFor="tickerSymbol">Ticker Symbol</Label>
                    <Select
                      value={newCombination.tickerSymbol}
                      onValueChange={(value) => setNewCombination(prev => ({...prev, tickerSymbol: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ticker" />
                      </SelectTrigger>
                      <SelectContent>
                        {tickers?.map((ticker: any) => (
                          <SelectItem key={ticker.id} value={ticker.symbol}>
                            {ticker.symbol} - {ticker.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="timeframe">Timeframe</Label>
                    <Select
                      value={newCombination.timeframe}
                      onValueChange={(value) => setNewCombination(prev => ({...prev, timeframe: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeframes.map((tf) => (
                          <SelectItem key={tf} value={tf}>
                            {tf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      placeholder="e.g., Bitcoin 4-hour signals"
                      value={newCombination.description}
                      onChange={(e) => setNewCombination(prev => ({...prev, description: e.target.value}))}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createCombinationMutation.isPending}
                  >
                    {createCombinationMutation.isPending ? 'Creating...' : 'Add Combination'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Existing Combinations */}
            <Card>
              <CardHeader>
                <CardTitle>Active Combinations</CardTitle>
                <CardDescription>
                  Ticker/timeframe combinations available for user subscriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {combinationsLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : combinations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No combinations created yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {combinations.map((combination: TickerTimeframe) => (
                      <div key={combination.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="flex items-center gap-3">
                            <p className="font-semibold">
                              {combination.tickerSymbol} - {combination.timeframe}
                            </p>
                            <Badge variant={combination.isEnabled ? "default" : "secondary"}>
                              {combination.isEnabled ? "Active" : "Disabled"}
                            </Badge>
                          </div>
                          {combination.description && (
                            <p className="text-sm text-muted-foreground">
                              {combination.description}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteCombinationMutation.mutate(combination.id)}
                          disabled={deleteCombinationMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="signals">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Signal Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Create Buy/Sell Signal
                </CardTitle>
                <CardDescription>
                  Send signals to subscribed users for specific ticker/timeframe combinations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateSignal} className="space-y-4">
                  <div>
                    <Label htmlFor="combination">Ticker/Timeframe</Label>
                    <Select
                      value={`${newSignal.symbol}-${newSignal.timeframe}`}
                      onValueChange={(value) => {
                        const [symbol, timeframe] = value.split('-');
                        setNewSignal(prev => ({...prev, symbol, timeframe}));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ticker/timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        {enabledCombinations.map((combo: TickerTimeframe) => (
                          <SelectItem key={combo.id} value={`${combo.tickerSymbol}-${combo.timeframe}`}>
                            {combo.tickerSymbol} - {combo.timeframe}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="signalType">Signal Type</Label>
                    <Select
                      value={newSignal.signalType}
                      onValueChange={(value) => setNewSignal(prev => ({...prev, signalType: value as 'buy' | 'sell'}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">Buy Signal</SelectItem>
                        <SelectItem value="sell">Sell Signal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 45000.00"
                      value={newSignal.price}
                      onChange={(e) => setNewSignal(prev => ({...prev, price: e.target.value}))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="confidence">Confidence % (Optional)</Label>
                    <Input
                      id="confidence"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="e.g., 85"
                      value={newSignal.confidence}
                      onChange={(e) => setNewSignal(prev => ({...prev, confidence: e.target.value}))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Additional information about this signal..."
                      value={newSignal.notes}
                      onChange={(e) => setNewSignal(prev => ({...prev, notes: e.target.value}))}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createSignalMutation.isPending || enabledCombinations.length === 0}
                  >
                    {createSignalMutation.isPending ? 'Sending Signal...' : 'Send Signal'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Signal Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Signal Preview</CardTitle>
                <CardDescription>
                  Preview of the signal that will be sent to subscribers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {newSignal.symbol && newSignal.price && newSignal.timeframe ? (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {newSignal.signalType === 'buy' ? (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                            <Badge className="bg-green-100 text-green-800">BUY</Badge>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <TrendingDown className="w-5 h-5 text-red-500" />
                            <Badge className="bg-red-100 text-red-800">SELL</Badge>
                          </div>
                        )}
                        <h3 className="font-semibold text-lg">{newSignal.symbol}</h3>
                        <Badge variant="outline">{newSignal.timeframe}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">${newSignal.price}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date().toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    {newSignal.notes && (
                      <p className="text-sm text-muted-foreground mb-2">{newSignal.notes}</p>
                    )}
                    
                    {newSignal.confidence && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Confidence:</span>
                        <Badge variant="outline">{newSignal.confidence}%</Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Fill in the signal details to see preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="signal-history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Signals</CardTitle>
              <CardDescription>
                History of all signals sent through the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {signalsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : signals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No Signals Sent</p>
                  <p>Create your first signal to see it here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {signals.map((signal: Signal) => (
                    <div key={signal.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {signal.signalType === 'buy' ? (
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-5 h-5 text-green-500" />
                              <Badge className="bg-green-100 text-green-800">BUY</Badge>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <TrendingDown className="w-5 h-5 text-red-500" />
                              <Badge className="bg-red-100 text-red-800">SELL</Badge>
                            </div>
                          )}
                          <h3 className="font-semibold text-lg">{signal.symbol}</h3>
                          <Badge variant="outline">{signal.timeframe}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">${signal.price}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(signal.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      {signal.notes && (
                        <p className="text-sm text-muted-foreground mb-2">{signal.notes}</p>
                      )}
                      
                      {signal.confidence && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Confidence:</span>
                          <Badge variant="outline">{signal.confidence}%</Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </div>
  );
}