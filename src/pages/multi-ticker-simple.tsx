import React, { useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Bell,
  BarChart3,
  LineChart,
  PieChart,
  Target,
  Clock
} from "lucide-react";

export default function MultiTickerSimple() {
  const { user } = useAuth();
  const [selectedTickers, setSelectedTickers] = useState<string[]>(["BTCUSDT", "ETHUSDT", "SOLUSDT"]);

  const tickers = [
    { symbol: "BTCUSDT", name: "Bitcoin", price: "$69,420", change: "+2.5%" },
    { symbol: "ETHUSDT", name: "Ethereum", price: "$3,420", change: "-1.2%" },
    { symbol: "SOLUSDT", name: "Solana", price: "$101", change: "+4.8%" },
    { symbol: "ADAUSDT", name: "Cardano", price: "$0.45", change: "+1.1%" },
    { symbol: "DOTUSD", name: "Polkadot", price: "$7.25", change: "-0.8%" },
    { symbol: "AVAXUSDT", name: "Avalanche", price: "$42.50", change: "+3.2%" }
  ];

  const recentSignals = [
    { symbol: "BTCUSDT", type: "buy", price: "$69,200", time: "2 min ago" },
    { symbol: "ETHUSDT", type: "sell", price: "$3,400", time: "5 min ago" },
    { symbol: "SOLUSDT", type: "buy", price: "$98.50", time: "10 min ago" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        
        {/* Main Content */}
        <div className="ml-0 md:ml-64 flex-1">
          {/* Top Bar */}
          <header className="bg-card border-b border-border p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-5 w-5 md:h-6 md:w-6" />
                <h1 className="text-xl md:text-2xl font-bold">Multi-Ticker Dashboard</h1>
              </div>
              <Badge variant="outline" className="text-emerald-400">
                Real-Time Data
              </Badge>
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="p-4 md:p-6">
            <Tabs defaultValue="overview" className="space-y-4 md:space-y-6">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
                <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
                <TabsTrigger value="charts" className="text-xs sm:text-sm">Charts</TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
                <TabsTrigger value="signals" className="text-xs sm:text-sm">Signals</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 md:space-y-6">
                {/* Market Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {tickers.map((ticker, index) => (
                    <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{ticker.symbol}</CardTitle>
                          <Badge variant="outline">{ticker.name}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-2">{ticker.price}</div>
                        <div className={`flex items-center text-sm ${ticker.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                          {ticker.change.startsWith('+') ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                          {ticker.change}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Recent Signals */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Recent Signals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentSignals.map((signal, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded">
                          <div className="flex items-center space-x-3">
                            {signal.type === 'buy' ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <div>
                              <span className="font-medium">{signal.symbol}</span>
                              <span className={`ml-2 text-sm ${signal.type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                                {signal.type.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{signal.price}</div>
                            <div className="text-sm text-muted-foreground">{signal.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="charts" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Price Charts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 bg-muted rounded flex items-center justify-center">
                      <div className="text-center">
                        <LineChart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Interactive charts will appear here</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Analytics Dashboard</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 bg-muted rounded flex items-center justify-center">
                      <div className="text-center">
                        <PieChart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Advanced analytics will appear here</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="signals" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Signal History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentSignals.concat(recentSignals).map((signal, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded">
                          <div className="flex items-center space-x-3">
                            {signal.type === 'buy' ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <div>
                              <span className="font-medium">{signal.symbol}</span>
                              <span className={`ml-2 text-sm ${signal.type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                                {signal.type.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{signal.price}</div>
                            <div className="text-sm text-muted-foreground">{signal.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}