import React from 'react';
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  PieChart,
  Activity,
  Target,
  AlertTriangle
} from "lucide-react";

export default function AdvancedPortfolioSimple() {
  const { user } = useAuth();

  const portfolioData = [
    { symbol: 'BTC', value: 5000, change: 2.5, allocation: 50 },
    { symbol: 'ETH', value: 2000, change: -1.2, allocation: 20 },
    { symbol: 'SOL', value: 1500, change: 4.8, allocation: 15 },
    { symbol: 'ADA', value: 1000, change: 1.1, allocation: 10 },
    { symbol: 'USDT', value: 500, change: 0, allocation: 5 }
  ];

  const totalValue = portfolioData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        
        {/* Main Content */}
        <div className="ml-0 md:ml-64 flex-1">
          {/* Top Bar */}
          <header className="bg-card border-b border-border p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2 md:space-x-3">
                <BarChart3 className="h-5 w-5 md:h-6 md:w-6" />
                <h1 className="text-xl md:text-2xl font-bold">Advanced Portfolio</h1>
              </div>
              <Badge variant="outline" className="text-emerald-400 text-xs md:text-sm self-start sm:self-auto">
                Professional Analytics
              </Badge>
            </div>
          </header>

          {/* Portfolio Content */}
          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            
            {/* Portfolio Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Card>
                <CardHeader className="pb-2 md:pb-3">
                  <CardTitle className="text-xs md:text-sm font-medium">Total Value</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="text-lg md:text-2xl font-bold">${totalValue.toLocaleString()}</div>
                  <div className="flex items-center text-xs md:text-sm text-green-500">
                    <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    +2.8% (24h)
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 md:pb-3">
                  <CardTitle className="text-xs md:text-sm font-medium">Daily P&L</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="text-lg md:text-2xl font-bold text-green-500">+$245.60</div>
                  <div className="flex items-center text-xs md:text-sm text-muted-foreground">
                    <Activity className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    Today's change
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 md:pb-3">
                  <CardTitle className="text-xs md:text-sm font-medium">Asset Count</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="text-lg md:text-2xl font-bold">{portfolioData.length}</div>
                  <div className="flex items-center text-xs md:text-sm text-muted-foreground">
                    <PieChart className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    Different coins
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 md:pb-3">
                  <CardTitle className="text-xs md:text-sm font-medium">Risk Score</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="text-lg md:text-2xl font-bold">Medium</div>
                  <div className="flex items-center text-xs md:text-sm text-yellow-500">
                    <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    Balanced risk
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Holdings */}
            <Card>
              <CardHeader>
                <CardTitle>Holdings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portfolioData.map((asset, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted rounded">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="font-bold text-primary">{asset.symbol}</span>
                        </div>
                        <div>
                          <div className="font-medium">{asset.symbol}</div>
                          <div className="text-sm text-muted-foreground">{asset.allocation}% allocation</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${asset.value.toLocaleString()}</div>
                        <div className={`text-sm flex items-center ${asset.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {asset.change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {asset.change > 0 ? '+' : ''}{asset.change}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Allocation Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portfolioData.map((asset, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{asset.symbol}</span>
                        <span className="text-sm text-muted-foreground">{asset.allocation}%</span>
                      </div>
                      <Progress value={asset.allocation} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Rebalance Portfolio
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Generate Report
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Export Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}