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
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Plus, Trash2, Settings, Activity, TrendingUp, TrendingDown, Edit, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { buildApiUrl } from '@/config/api';
import { SessionManager } from '@/lib/sessionManager';
import Sidebar from '@/components/layout/Sidebar';
import { supabase } from '@/lib/supabase';

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
  ticker: string;
  signalType?: 'buy' | 'sell';
  action?: 'buy' | 'sell';
  price: number;
  timeframe?: string;
  timestamp?: string;
  createdAt?: string;
  note?: string;
  message?: string;
  source?: string;
  strategy?: string;
}

interface Ticker {
  id: string;
  symbol: string;
  description: string;
  isEnabled: boolean;
}

export default function SignalManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const authToken = SessionManager.getToken();
  
  // Form states
  const [newCombination, setNewCombination] = useState({
    tickerSymbol: '',
    timeframe: '',
    description: ''
  });
  
  const [newSignal, setNewSignal] = useState({
    ticker: '',
    signalType: 'buy' as 'buy' | 'sell',
    price: '',
    timeframe: '1H',
    note: ''
  });

  // Timeframe options
  const timeframes = ['30M', '1H', '4H', '8H', '12H', '1D', '1W', '1M'];

  // Fetch ticker/timeframe combinations
  const { data: combinationsData, isLoading: combinationsLoading } = useQuery({
    queryKey: ['/api/admin/ticker-timeframes'],
    queryFn: async () => {
      // Fetch combinations and tickers separately, then join in memory
      const [combosRes, tickersRes] = await Promise.all([
        supabase.from('ticker_timeframes').select('*').order('created_at', { ascending: false }),
        supabase.from('available_tickers').select('*')
      ]);
      
      if (combosRes.error) throw new Error(combosRes.error.message || 'Failed to fetch combinations');
      if (tickersRes.error) throw new Error(tickersRes.error.message || 'Failed to fetch tickers');
      
      // Create ticker lookup map
      const tickerMap = new Map(tickersRes.data?.map((t: any) => [t.id, t.symbol]) || []);
      
      // Add ticker symbol to each combination
      const dataWithSymbols = combosRes.data?.map((combo: any) => ({
        ...combo,
        ticker_symbol: tickerMap.get(combo.ticker_id) || ''
      })) || [];
      
      return { combinations: dataWithSymbols };
    },
    enabled: !!authToken
  });

  // Fetch all signals
  const { data: signalsData, isLoading: signalsLoading } = useQuery({
    queryKey: ['/api/admin/signals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alert_signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw new Error(error.message || 'Failed to fetch signals');
      return { signals: data };
    },
    enabled: !!authToken,
    refetchInterval: 5000 // Auto-refresh every 5 seconds
  });

  // Fetch available tickers
  const { data: tickersData, isLoading: tickersLoading } = useQuery({
    queryKey: ['/api/admin/tickers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('available_tickers')
        .select('*')
        .eq('is_enabled', true)
        .order('symbol');
      
      if (error) throw new Error(error.message || 'Failed to fetch tickers');
      
      // Transform to camelCase format
      const transformedTickers = data?.map((ticker: any) => ({
        id: ticker.id,
        symbol: ticker.symbol,
        description: ticker.description,
        isEnabled: ticker.is_enabled,
        category: ticker.category,
        createdAt: ticker.created_at,
        updatedAt: ticker.updated_at
      })) || [];
      
      return { tickers: transformedTickers };
    },
    enabled: !!authToken
  });

  const tickers = Array.isArray(tickersData) ? tickersData : tickersData?.tickers || [];
  
  // Create a lookup map for tickers by ID
  const tickerLookup = React.useMemo(() => {
    const map: Record<string, Ticker> = {};
    tickers.forEach((ticker: Ticker) => {
      map[ticker.id] = ticker;
    });
    return map;
  }, [tickers]);

  // Create ticker/timeframe combination mutation
  const createCombinationMutation = useMutation({
    mutationFn: async (combination: any) => {
      // First, find the ticker ID from the symbol
      const tickerObj = tickers.find((t: Ticker) => t.symbol === combination.tickerSymbol);
      
      if (!tickerObj) {
        throw new Error('Ticker not found');
      }
      
      // Insert directly into Supabase using ticker_id
      const { data, error } = await supabase
        .from('ticker_timeframes')
        .insert({
          ticker_id: tickerObj.id,
          timeframe: combination.timeframe,
          is_active: true
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message || 'Failed to create combination');
      }
      return data;
    },
    onSuccess: async () => {
      // Force refetch to ensure UI updates
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/ticker-timeframes'] });
      await queryClient.refetchQueries({ queryKey: ['/api/admin/ticker-timeframes'] });
      
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

  // Toggle combination status
  const toggleCombinationMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: string; isEnabled: boolean }) => {
      const { data, error } = await supabase
        .from('ticker_timeframes')
        .update({ is_active: isEnabled })
        .eq('id', id)
        .select();
      
      if (error) {
        throw new Error(error.message || 'Failed to update combination');
      }
      return data;
    },
    onSuccess: async () => {
      // Force refetch to ensure UI updates
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/ticker-timeframes'] });
      await queryClient.refetchQueries({ queryKey: ['/api/admin/ticker-timeframes'] });
      
      toast({
        title: 'Status Updated',
        description: 'Combination status updated successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update combination',
        variant: 'destructive'
      });
    }
  });

  // Delete combination mutation
  const deleteCombinationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('ticker_timeframes')
        .delete()
        .eq('id', id)
        .select();
      
      if (error) {
        throw new Error(error.message || 'Failed to delete combination');
      }
      return data;
    },
    onSuccess: async () => {
      // Force refetch to ensure UI updates
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/ticker-timeframes'] });
      await queryClient.refetchQueries({ queryKey: ['/api/admin/ticker-timeframes'] });
      
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
    mutationFn: async (signal: any) => {
      const { data, error } = await supabase
        .from('alert_signals')
        .insert({
          ticker: signal.ticker,
          signal_type: signal.signalType,
          price: parseFloat(signal.price),
          timestamp: new Date().toISOString(),
          timeframe: signal.timeframe,
          source: 'manual',
          note: signal.note || 'Manual signal from admin panel'
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message || 'Failed to create signal');
      }
      return data;
    },
    onSuccess: async () => {
      // Force refetch to ensure UI updates
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/signals'] });
      await queryClient.refetchQueries({ queryKey: ['/api/admin/signals'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/signals'] });
      
      // Reset form completely
      setNewSignal({
        ticker: '',
        signalType: 'buy',
        price: '',
        timeframe: '1H',
        note: ''
      });
      
      toast({
        title: 'Signal Created',
        description: 'Buy/sell signal sent successfully to all subscribers'
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
    if (!newSignal.ticker || !newSignal.price) {
      toast({
        title: 'Missing Information',
        description: 'Please provide ticker and price',
        variant: 'destructive'
      });
      return;
    }
    createSignalMutation.mutate(newSignal);
  };

  // Map backend combinations to frontend format
  const rawCombinations = Array.isArray(combinationsData) ? combinationsData : combinationsData?.combinations || [];
  const combinations: TickerTimeframe[] = React.useMemo(() => {
    if (!Array.isArray(rawCombinations)) return [];
    return rawCombinations.map((combo: any) => {
      return {
        id: String(combo.id),
        tickerSymbol: combo.ticker_symbol || '',
        timeframe: combo.timeframe || '',
        description: '',
        isEnabled: combo.is_active || false,
        createdAt: combo.created_at || new Date().toISOString()
      };
    });
  }, [rawCombinations]);

  const rawSignals = Array.isArray(signalsData) ? signalsData : signalsData?.signals || [];
  const signals = Array.isArray(rawSignals) ? rawSignals.map((signal: any) => ({
    ...signal,
    id: signal.id,
    ticker: signal.ticker,
    signalType: signal.signal_type || 'buy',
    price: signal.price,
    timeframe: signal.timeframe,
    timestamp: signal.timestamp || signal.created_at,
    note: signal.note,
    source: signal.source || 'manual'
  })) : [];
  
  // Get enabled combinations for signal creation
  const enabledCombinations = combinations.filter((combo: TickerTimeframe) => combo.isEnabled);

  // Group combinations by ticker to show active timeframes
  const tickerTimeframeMap = combinations.reduce((acc: any, combo: TickerTimeframe) => {
    const tickerSymbol = combo.tickerSymbol;
    if (!tickerSymbol) return acc;
    if (!acc[tickerSymbol]) {
      acc[tickerSymbol] = [];
    }
    if (combo.isEnabled) {
      acc[tickerSymbol].push(combo.timeframe);
    }
    return acc;
  }, {});

  return (
    <div className="flex h-screen bg-gray-900 dark:bg-gray-950">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 ml-0 md:ml-64 p-6 overflow-y-auto bg-gray-900 dark:bg-gray-950">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Signal Management</h1>
              <p className="text-gray-400">
                Manage ticker/timeframe combinations and create buy/sell signals
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Combinations</p>
                    <p className="text-2xl font-bold text-white">{combinations.length}</p>
                  </div>
                  <Settings className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Active Combinations</p>
                    <p className="text-2xl font-bold text-green-400">{enabledCombinations.length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Signals</p>
                    <p className="text-2xl font-bold text-white">{signals.length}</p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Active Tickers</p>
                    <p className="text-2xl font-bold text-orange-400">{Object.keys(tickerTimeframeMap).length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>

      <Tabs defaultValue="active-timeframes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active-timeframes">Active Timeframes by Ticker</TabsTrigger>
          <TabsTrigger value="combinations">Manage Combinations</TabsTrigger>
          <TabsTrigger value="signals">Create Signals</TabsTrigger>
          <TabsTrigger value="signal-history">Signal History</TabsTrigger>
        </TabsList>

        {/* NEW TAB: Active Timeframes by Ticker */}
        <TabsContent value="active-timeframes">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Active Timeframes by Ticker</CardTitle>
              <CardDescription className="text-gray-400">
                Click the X on any timeframe to remove that combination
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tickersLoading || combinationsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-700 rounded animate-pulse" />
                  ))}
                </div>
              ) : combinations.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No Ticker/Timeframe Combinations</p>
                  <p>Create combinations in the "Manage Combinations" tab</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-600">
                        <th className="text-left p-4 font-semibold text-gray-200 bg-gray-900">TICKER</th>
                        <th className="text-left p-4 font-semibold text-gray-200 bg-gray-900">ACTIVE TIMEFRAMES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(
                        combinations.reduce((acc: any, combo: TickerTimeframe) => {
                          const tickerSymbol = combo.tickerSymbol;
                          if (!tickerSymbol) return acc;
                          if (!acc[tickerSymbol]) {
                            acc[tickerSymbol] = [];
                          }
                          acc[tickerSymbol].push(combo);
                          return acc;
                        }, {})
                      ).map(([ticker, tickerCombos]: [string, any]) => (
                        <tr key={ticker} className="border-b border-gray-700 hover:bg-gray-750">
                          <td className="p-4 font-semibold text-lg text-white">{ticker || 'Unknown'}</td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-2">
                              {tickerCombos.length > 0 ? (
                                tickerCombos.map((combo: TickerTimeframe) => (
                                  <Badge 
                                    key={combo.id} 
                                    variant={combo.isEnabled ? "default" : "secondary"}
                                    className={`${combo.isEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600'} text-white relative group pr-8`}
                                  >
                                    <Clock className="h-3 w-3 mr-1" />
                                    {combo.timeframe}
                                    <button
                                      onClick={() => deleteCombinationMutation.mutate(combo.id)}
                                      disabled={deleteCombinationMutation.isPending}
                                      className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-red-600 rounded-full p-0.5 transition-colors"
                                      title="Remove this timeframe"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))
                              ) : (
                                <Badge variant="secondary" className="bg-gray-600 text-gray-300">No timeframes</Badge>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="combinations">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Combination Form */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Plus className="w-5 h-5" />
                  Add Ticker/Timeframe
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Create new ticker/timeframe combinations for users to subscribe to
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tickers.length === 0 && !tickersLoading ? (
                  <div className="text-center py-8 space-y-4">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-400 opacity-50" />
                    <p className="text-lg font-semibold text-white">No Tickers Available</p>
                    <p className="text-gray-400">You need to create tickers first before adding combinations</p>
                    <Button
                      onClick={() => window.location.href = '/admin/tickers'}
                      className="crypto-gradient text-white"
                    >
                      Go to Tickers Management
                    </Button>
                  </div>
                ) : (
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
                          {tickersLoading ? (
                            <div className="p-2 text-sm text-muted-foreground">Loading...</div>
                          ) : (
                            tickers.map((ticker: Ticker) => (
                              <SelectItem key={ticker.id} value={ticker.symbol}>
                                {ticker.symbol} - {ticker.description}
                              </SelectItem>
                            ))
                          )}
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
                )}
              </CardContent>
            </Card>

            {/* Existing Combinations */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">All Combinations</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage all ticker/timeframe combinations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {combinationsLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-700 rounded animate-pulse" />
                    ))}
                  </div>
                ) : combinations.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No combinations created yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {combinations.map((combination: TickerTimeframe) => (
                      <div key={combination.id} className="flex items-center justify-between p-3 border border-gray-700 rounded-lg bg-gray-900">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <p className="font-semibold text-white">
                              {combination.tickerSymbol} - {combination.timeframe}
                            </p>
                            <Badge variant={combination.isEnabled ? "default" : "secondary"} className={combination.isEnabled ? "bg-green-600" : "bg-gray-600"}>
                              {combination.isEnabled ? "Active" : "Disabled"}
                            </Badge>
                          </div>
                          {combination.description && (
                            <p className="text-sm text-gray-400">
                              {combination.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={combination.isEnabled}
                            onCheckedChange={(checked) => 
                              toggleCombinationMutation.mutate({ 
                                id: combination.id, 
                                isEnabled: checked 
                              })
                            }
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteCombinationMutation.mutate(combination.id)}
                            disabled={deleteCombinationMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
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
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Activity className="w-5 h-5" />
                  Create Buy/Sell Signal
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Send signals to all subscribed users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tickers.length === 0 && !tickersLoading ? (
                  <div className="text-center py-8 space-y-4">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-400 opacity-50" />
                    <p className="text-lg font-semibold text-white">No Tickers Available</p>
                    <p className="text-gray-400">You need to create tickers first before sending signals</p>
                    <Button
                      onClick={() => window.location.href = '/admin/tickers'}
                      className="crypto-gradient text-white"
                    >
                      Go to Tickers Management
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateSignal} className="space-y-4">
                    <div>
                      <Label htmlFor="ticker">Ticker</Label>
                      <Select
                        value={newSignal.ticker}
                        onValueChange={(value) => setNewSignal(prev => ({...prev, ticker: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ticker" />
                        </SelectTrigger>
                        <SelectContent>
                          {tickersLoading ? (
                            <div className="p-2 text-sm text-muted-foreground">Loading...</div>
                          ) : (
                            tickers.map((ticker: Ticker) => (
                              <SelectItem key={ticker.id} value={ticker.symbol}>
                                {ticker.symbol} - {ticker.description}
                              </SelectItem>
                            ))
                          )}
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
                    <Label htmlFor="timeframe">Timeframe</Label>
                    <Select
                      value={newSignal.timeframe}
                      onValueChange={(value) => setNewSignal(prev => ({...prev, timeframe: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                    <Label htmlFor="note">Note (Optional)</Label>
                    <Textarea
                      id="note"
                      placeholder="Additional information about this signal..."
                      value={newSignal.note}
                      onChange={(e) => setNewSignal(prev => ({...prev, note: e.target.value}))}
                    />
                  </div>

                    <Button 
                      type="submit" 
                      className="w-full crypto-gradient text-white"
                      disabled={createSignalMutation.isPending}
                    >
                      {createSignalMutation.isPending ? 'Sending Signal...' : 'Send Signal to All Subscribers'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Signal Preview */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Signal Preview</CardTitle>
                <CardDescription className="text-gray-400">
                  Preview of the signal that will be sent
                </CardDescription>
              </CardHeader>
              <CardContent>
{newSignal.ticker && newSignal.price ? (
                  <div className="border border-gray-600 rounded-lg p-4 bg-gray-900">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {newSignal.signalType === 'buy' ? (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                            <Badge className="bg-green-600 text-white">BUY</Badge>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <TrendingDown className="w-5 h-5 text-red-400" />
                            <Badge className="bg-red-600 text-white">SELL</Badge>
                          </div>
                        )}
                        <h3 className="font-semibold text-lg text-white">{newSignal.ticker}</h3>
                        <Badge variant="outline" className="border-gray-600 text-gray-300">{newSignal.timeframe}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">${parseFloat(newSignal.price).toFixed(2)}</p>
                        <p className="text-sm text-gray-400">
                          {new Date().toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    {newSignal.note && (
                      <p className="text-sm text-gray-400">{newSignal.note}</p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Fill in the signal details to see preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="signal-history">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Signals</CardTitle>
              <CardDescription className="text-gray-400">
                History of all signals sent through the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {signalsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-700 rounded animate-pulse" />
                  ))}
                </div>
              ) : signals.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No Signals Sent</p>
                  <p>Create your first signal to see it here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {signals.map((signal: Signal) => {
                    const signalType = signal.signalType || signal.action;
                    const timestamp = signal.timestamp || signal.createdAt;
                    const note = signal.note || signal.message;
                    const source = signal.source || signal.strategy;
                    
                    return (
                      <div key={signal.id} className="border border-gray-600 rounded-lg p-4 bg-gray-900">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {signalType === 'buy' ? (
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-400" />
                                <Badge className="bg-green-600 text-white">BUY</Badge>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <TrendingDown className="w-5 h-5 text-red-400" />
                                <Badge className="bg-red-600 text-white">SELL</Badge>
                              </div>
                            )}
                            <h3 className="font-semibold text-lg text-white">{signal.ticker}</h3>
                            {signal.timeframe && (
                              <Badge variant="outline" className="border-gray-600 text-gray-300">{signal.timeframe}</Badge>
                            )}
                            {source && (
                              <Badge variant="secondary" className="bg-gray-700 text-gray-300">{source}</Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-white">${signal.price?.toFixed(2)}</p>
                            <p className="text-sm text-gray-400">
                              {timestamp ? new Date(timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        {note && (
                          <p className="text-sm text-gray-400">{note}</p>
                        )}
                      </div>
                    );
                  })}
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
