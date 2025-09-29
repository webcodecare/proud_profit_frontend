import React, { useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Target,
  BarChart3,
  Settings
} from "lucide-react";

export default function TradingPlaygroundSimple() {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [balance, setBalance] = useState(10000);
  const [riskLevel, setRiskLevel] = useState([2]);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        
        {/* Main Content */}
        <div className="ml-0 md:ml-64 flex-1">
          {/* Top Bar */}
          <header className="bg-card border-b border-border p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Target className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Trading Playground</h1>
              </div>
              <Badge variant="outline" className="text-emerald-400">
                Risk-Free Practice
              </Badge>
            </div>
          </header>

          {/* Trading Content */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Simulation Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Simulation Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="balance">Starting Balance</Label>
                    <Input 
                      id="balance"
                      type="number"
                      value={balance}
                      onChange={(e) => setBalance(Number(e.target.value))}
                      placeholder="10000"
                    />
                  </div>
                  
                  <div>
                    <Label>Risk Level: {riskLevel[0]}%</Label>
                    <Slider
                      value={riskLevel}
                      onValueChange={setRiskLevel}
                      max={10}
                      min={0.5}
                      step={0.5}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="pair">Trading Pair</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pair" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BTCUSDT">BTC/USDT</SelectItem>
                        <SelectItem value="ETHUSDT">ETH/USDT</SelectItem>
                        <SelectItem value="SOLUSDT">SOL/USDT</SelectItem>
                        <SelectItem value="ADAUSDT">ADA/USDT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-trade">Auto Trade</Label>
                    <Switch id="auto-trade" />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setIsRunning(!isRunning)}
                      className="flex-1"
                      variant={isRunning ? "destructive" : "default"}
                    >
                      {isRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                      {isRunning ? "Pause" : "Start"}
                    </Button>
                    <Button variant="outline" onClick={() => setIsRunning(false)}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Portfolio Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Portfolio Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Current Balance</span>
                    <span className="font-bold text-green-500">${balance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total P&L</span>
                    <span className="font-bold text-green-500">+$125.50</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Win Rate</span>
                    <span className="font-bold">68%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Trades</span>
                    <span className="font-bold">25</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Best Trade</span>
                    <span className="font-bold text-green-500">+$45.20</span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Trades */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Trades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="font-medium">BTC Buy</span>
                      </div>
                      <span className="text-green-500">+$12.45</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        <span className="font-medium">ETH Sell</span>
                      </div>
                      <span className="text-red-500">-$8.20</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="font-medium">SOL Buy</span>
                      </div>
                      <span className="text-green-500">+$25.80</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Trading Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-muted rounded flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Trading chart will appear here</p>
                    <p className="text-sm text-muted-foreground mt-2">Start simulation to see live data</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}