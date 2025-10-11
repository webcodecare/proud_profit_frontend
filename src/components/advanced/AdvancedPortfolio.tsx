import React, { useState } from 'react';
import { TrendingUp, TrendingDown, PieChart, BarChart3, Target, DollarSign, Percent, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface PortfolioAsset {
  id: string;
  ticker: string;
  name: string;
  amount: number;
  currentPrice: number;
  averagePrice: number;
  totalValue: number;
  pnl: number;
  pnlPercentage: number;
  allocation: number;
  targetAllocation?: number;
}

export default function AdvancedPortfolio() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [rebalanceThreshold, setRebalanceThreshold] = useState(5);
  const { toast } = useToast();

  // Sample portfolio data
  const portfolioAssets: PortfolioAsset[] = [
    {
      id: '1',
      ticker: 'BTC',
      name: 'Bitcoin',
      amount: 0.5,
      currentPrice: 67000,
      averagePrice: 65000,
      totalValue: 33500,
      pnl: 1000,
      pnlPercentage: 3.08,
      allocation: 50,
      targetAllocation: 40,
    },
    {
      id: '2',
      ticker: 'ETH',
      name: 'Ethereum',
      amount: 10,
      currentPrice: 3400,
      averagePrice: 3200,
      totalValue: 34000,
      pnl: 2000,
      pnlPercentage: 6.25,
      allocation: 50.7,
      targetAllocation: 35,
    },
    {
      id: '3',
      ticker: 'SOL',
      name: 'Solana',
      amount: 100,
      currentPrice: 98,
      averagePrice: 90,
      totalValue: 9800,
      pnl: 800,
      pnlPercentage: 8.89,
      allocation: 14.6,
      targetAllocation: 15,
    },
    {
      id: '4',
      ticker: 'ADA',
      name: 'Cardano',
      amount: 5000,
      currentPrice: 0.45,
      averagePrice: 0.42,
      totalValue: 2250,
      pnl: 150,
      pnlPercentage: 7.14,
      allocation: 3.4,
      targetAllocation: 10,
    },
  ];

  const totalValue = portfolioAssets.reduce((sum, asset) => sum + asset.totalValue, 0);
  const totalPnl = portfolioAssets.reduce((sum, asset) => sum + asset.pnl, 0);
  const totalPnlPercentage = totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getAssetAllocationColor = (index: number) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
      'bg-pink-500', 'bg-indigo-500', 'bg-orange-500', 'bg-teal-500'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen bg-background text-foreground space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Advanced Portfolio Management</h2>
          <p className="text-muted-foreground">
            Professional portfolio analytics, rebalancing, and risk management
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(totalPnlPercentage)} from {selectedTimeframe}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Sharpe Ratio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">1.42</div>
            <p className="text-xs text-muted-foreground">Risk-adjusted returns</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Max Drawdown</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">-15.2%</div>
            <p className="text-xs text-muted-foreground">Maximum loss from peak</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Portfolio Beta</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">0.95</div>
            <p className="text-xs text-muted-foreground">vs Bitcoin benchmark</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="holdings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="rebalance">Rebalance</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
        </TabsList>

        {/* Holdings Tab */}
        <TabsContent value="holdings" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Portfolio Holdings</CardTitle>
              <CardDescription>Current positions and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {portfolioAssets.map((asset, index) => (
                  <div key={asset.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/20">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getAssetAllocationColor(index)}`} />
                      <div>
                        <div className="font-medium text-foreground">{asset.name}</div>
                        <div className="text-sm text-muted-foreground">{asset.ticker}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-foreground">{formatCurrency(asset.totalValue)}</div>
                      <div className={`text-sm ${asset.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercentage(asset.pnlPercentage)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Amount</div>
                      <div className="font-medium text-foreground">{asset.amount}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Allocation</div>
                      <div className="font-medium text-foreground">{asset.allocation.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allocation Tab */}
        <TabsContent value="allocation" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Asset Allocation</CardTitle>
              <CardDescription>Current vs target allocation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {portfolioAssets.map((asset, index) => (
                  <div key={asset.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-foreground">{asset.ticker}</span>
                      <span className="text-sm text-muted-foreground">
                        {asset.allocation.toFixed(1)}% / {asset.targetAllocation}%
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex">
                        <div className="flex-1 bg-muted rounded-l-md">
                          <div 
                            className={`h-2 ${getAssetAllocationColor(index)} rounded-l-md`}
                            style={{ width: `${asset.allocation}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex">
                        <div className="flex-1 bg-muted/40 rounded-l-md">
                          <div 
                            className="h-1 bg-gray-400 rounded-l-md"
                            style={{ width: `${asset.targetAllocation}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rebalance Tab */}
        <TabsContent value="rebalance" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Portfolio Rebalancing</CardTitle>
              <CardDescription>Recommendations to align with target allocation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Label htmlFor="threshold" className="text-foreground">Rebalance Threshold:</Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={rebalanceThreshold}
                    onChange={(e) => setRebalanceThreshold(Number(e.target.value))}
                    className="w-20"
                    min="1"
                    max="20"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>

                <div className="space-y-3">
                  {portfolioAssets
                    .filter(asset => Math.abs(asset.allocation - (asset.targetAllocation || 0)) > rebalanceThreshold)
                    .map(asset => {
                      const difference = asset.allocation - (asset.targetAllocation || 0);
                      const action = difference > 0 ? 'sell' : 'buy';
                      return (
                        <div key={asset.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20">
                          <div className="flex items-center space-x-3">
                            <Badge variant={action === 'sell' ? 'destructive' : 'default'}>
                              {action.toUpperCase()}
                            </Badge>
                            <span className="font-medium text-foreground">{asset.ticker}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Deviation</div>
                            <div className="font-medium text-foreground">{difference.toFixed(1)}%</div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <Button className="w-full" onClick={() => {
                  toast({
                    title: "Rebalancing Simulated",
                    description: "In a real system, this would execute rebalancing trades",
                  });
                }}>
                  Execute Rebalancing
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Analysis Tab */}
        <TabsContent value="risk" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Risk Analysis</CardTitle>
              <CardDescription>Portfolio risk metrics and analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Risk Level</span>
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/20">Medium</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Diversification Score</span>
                    <span className="text-sm font-medium text-foreground">7.2/10</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Volatility (30d)</span>
                    <span className="text-sm font-medium text-foreground">24.5%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Value at Risk (1d)</span>
                    <span className="text-sm font-medium text-foreground">-$2,340</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Expected Shortfall</span>
                    <span className="text-sm font-medium text-foreground">-$3,120</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Correlation to BTC</span>
                    <span className="text-sm font-medium text-foreground">0.89</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm font-medium text-foreground">Risk Alerts</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    • High correlation to BTC (89%)
                  </div>
                  <div className="text-xs text-muted-foreground">
                    • ADA underallocated vs target
                  </div>
                  <div className="text-xs text-muted-foreground">
                    • Consider adding stablecoin exposure
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}