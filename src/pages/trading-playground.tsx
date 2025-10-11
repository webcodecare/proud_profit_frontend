import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import Header from "@/components/layout/Header";
import SubscriptionGuard from "@/components/auth/SubscriptionGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  AlertTriangle,
  BarChart3
} from "lucide-react";

interface TradingViewSignal {
  id: string;
  ticker: string;
  timeframe: string;
  signal: 'buy' | 'sell';
  price: number;
  timestamp: Date;
}

interface SimulationPosition {
  ticker: string;
  signal: 'buy' | 'sell';
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  timestamp: Date;
}

export default function TradingPlayground() {
  // Simple simulation state
  const [selectedTicker, setSelectedTicker] = useState('BTCUSDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState('30M');
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  const [simulatedBalance, setSimulatedBalance] = useState(10000);
  const [positions, setPositions] = useState<SimulationPosition[]>([]);

  // Available timeframes that support TradingView signals (matching database format)
  const timeframes = [
    { value: '30M', label: '30 Minutes' },
    { value: '1H', label: '1 Hour' },
    { value: '4H', label: '4 Hours' },
    { value: '8H', label: '8 Hours' },
    { value: '12H', label: '12 Hours' },
    { value: '1D', label: '1 Day' },
    { value: '1W', label: '1 Week' },
    { value: '1M', label: '1 Month' }
  ];

  // Fetch available tickers
  const { data: tickers } = useQuery({
    queryKey: ['/api/tickers'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/tickers');
      return response.json();
    }
  });

  // Fetch current price for selected ticker
  const { data: currentPrice, refetch: refetchPrice } = useQuery({
    queryKey: ['/api/market/price', selectedTicker],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/market/price/${selectedTicker}`);
      const data = await response.json();
      return data.price;
    },
    refetchInterval: isSimulationActive ? 5000 : false
  });

  // Fetch TradingView signals for selected ticker and timeframe
  const { data: signals } = useQuery({
    queryKey: ['/api/signals', selectedTicker],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/signals/${selectedTicker}?timeframe=${selectedTimeframe}`);
      return response.json();
    },
    refetchInterval: isSimulationActive ? 10000 : false
  });

  // Reset simulation
  const resetSimulation = () => {
    setIsSimulationActive(false);
    setSimulatedBalance(10000);
    setPositions([]);
  };

  // Calculate total P&L
  const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);
  const totalPnLPercentage = ((simulatedBalance - 10000) / 10000) * 100;

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="w-full">
        <Header />
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          <SubscriptionGuard feature="tradingPlayground">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">Trading Playground</h1>
                  <p className="text-gray-400 mt-1 text-sm sm:text-base">Simulate trading with real TradingView signals</p>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <Button
                    onClick={() => setIsSimulationActive(!isSimulationActive)}
                    className={`${isSimulationActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    {isSimulationActive ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={resetSimulation}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:text-white"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-300 mb-2 block">Trading Pair</label>
                        <Select 
                          value={selectedTicker} 
                          onValueChange={setSelectedTicker}
                          disabled={isSimulationActive}
                        >
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {tickers?.map((ticker: any) => (
                              <SelectItem key={ticker.symbol} value={ticker.symbol}>
                                {ticker.symbol}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-300 mb-2 block">Timeframe</label>
                        <Select 
                          value={selectedTimeframe} 
                          onValueChange={setSelectedTimeframe}
                          disabled={isSimulationActive}
                        >
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {timeframes.map((tf) => (
                              <SelectItem key={tf.value} value={tf.value}>
                                {tf.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Current Price</p>
                          <p className="text-xl font-bold text-white">
                            ${currentPrice?.toLocaleString() || '---'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">Balance</p>
                          <p className="text-xl font-bold text-white">
                            ${simulatedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className={`text-sm ${totalPnLPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {totalPnLPercentage >= 0 ? '+' : ''}{totalPnLPercentage.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Signals Display */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    TradingView Signals - {selectedTicker} ({selectedTimeframe})
                    {isSimulationActive && (
                      <span className="w-2 h-2 bg-green-500 rounded-full ml-2 animate-pulse" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {signals && signals.length > 0 ? (
                      signals.slice(0, 10).map((signal: TradingViewSignal) => (
                        <div
                          key={signal.id}
                          className="p-3 rounded-lg bg-gray-750 border border-gray-600 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            {signal.signal === 'buy' ? (
                              <TrendingUp className="w-4 h-4 text-green-500" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-500" />
                            )}
                            <div>
                              <p className="text-white font-medium">
                                {signal.signal.toUpperCase()} Signal
                              </p>
                              <p className="text-sm text-gray-400">
                                ${signal.price?.toLocaleString()} • {signal.timeframe}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={signal.signal === 'buy' ? 'default' : 'destructive'}>
                              {signal.signal.toUpperCase()}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(signal.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <AlertTriangle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-500">
                          {isSimulationActive ? 'Waiting for TradingView signals...' : 'Select ticker and start simulation'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>



            </SubscriptionGuard>
          </div>
        </div>
      </div>
  );
}