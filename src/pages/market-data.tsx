import Navigation from "@/components/layout/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MarketWidget from "@/components/widgets/MarketWidget";
import MarketStatsGrid from "@/components/market/MarketStatsGrid";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";
import { 
  DollarSign, 
  BarChart3,
  Activity,
  Globe,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  TrendingDown
} from "lucide-react";

// Simple Bitcoin Chart Component
function SimpleBitcoinChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [priceData, setPriceData] = useState<Array<{time: number, price: number}>>([]);
  
  // Fetch current Bitcoin price
  const { data: currentPrice, isLoading } = useQuery({
    queryKey: ["/api/public/market/price/BTCUSDT"],
    refetchInterval: 10000, // Update every 10 seconds
  });

  // Generate sample historical data when we get the current price
  useEffect(() => {
    if (currentPrice?.price && priceData.length === 0) {
      const basePrice = currentPrice.price;
      const data = [];
      const now = Date.now();
      
      // Generate 24 hours of data (144 points, 10 minute intervals)
      for (let i = 143; i >= 0; i--) {
        const time = now - (i * 10 * 60 * 1000); // 10 minutes ago
        const randomVariation = (Math.random() - 0.5) * 0.05; // ±2.5% variation
        const price = basePrice * (1 + randomVariation);
        data.push({ time, price });
      }
      
      setPriceData(data);
    }
  }, [currentPrice, priceData.length]);

  // Add new data point when price updates
  useEffect(() => {
    if (currentPrice?.price && priceData.length > 0) {
      const now = Date.now();
      setPriceData(prev => {
        const newData = [...prev.slice(1), { time: now, price: currentPrice.price }];
        return newData;
      });
    }
  }, [currentPrice]);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || priceData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = '#020617'; // slate-950
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (priceData.length < 2) return;

    const padding = 60;
    const chartWidth = rect.width - 2 * padding;
    const chartHeight = rect.height - 2 * padding;

    const prices = priceData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Draw grid
    ctx.strokeStyle = '#334155'; // slate-700
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(rect.width - padding, y);
      ctx.stroke();
      
      // Price labels
      const price = maxPrice - (priceRange * i) / 5;
      ctx.fillStyle = '#64748b'; // slate-500
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, padding - 10, y + 4);
    }

    // Draw price line
    const gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
    gradient.addColorStop(0, '#f97316'); // orange-500
    gradient.addColorStop(1, '#ea580c'); // orange-600
    
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 3;
    ctx.beginPath();

    priceData.forEach((point, index) => {
      const x = padding + (chartWidth * index) / (priceData.length - 1);
      const y = padding + chartHeight - ((point.price - minPrice) / priceRange) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();

    // Draw area under line
    ctx.fillStyle = 'rgba(249, 115, 22, 0.1)';
    ctx.beginPath();
    
    priceData.forEach((point, index) => {
      const x = padding + (chartWidth * index) / (priceData.length - 1);
      const y = padding + chartHeight - ((point.price - minPrice) / priceRange) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.lineTo(rect.width - padding, rect.height - padding);
    ctx.lineTo(padding, rect.height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw current price dot
    if (priceData.length > 0) {
      const lastPoint = priceData[priceData.length - 1];
      const x = rect.width - padding;
      const y = padding + chartHeight - ((lastPoint.price - minPrice) / priceRange) * chartHeight;
      
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

  }, [priceData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-950 rounded-lg">
        <div className="flex items-center space-x-2 text-slate-400">
          <Activity className="h-6 w-6 animate-spin" />
          <span className="text-lg">Loading Bitcoin chart...</span>
        </div>
      </div>
    );
  }

  const currentPriceValue = currentPrice?.price || 0;
  const previousPrice = priceData.length > 1 ? priceData[priceData.length - 2].price : currentPriceValue;
  const priceChange = currentPriceValue - previousPrice;
  const priceChangePercent = previousPrice ? (priceChange / previousPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="bg-slate-950 rounded-lg p-6">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">₿</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Bitcoin</h3>
            <p className="text-slate-400 text-sm">BTC/USDT</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">
            ${currentPriceValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
          <div className={`flex items-center justify-end text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
            {isPositive ? '+' : ''}${priceChange.toFixed(2)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative h-96">
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-lg"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Chart Info */}
      <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
        <div className="flex items-center space-x-4">
          <span>24H Chart</span>
          <span>•</span>
          <span>{priceData.length} data points</span>
          <span>•</span>
          <span>Real-time updates</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <span>Live Data</span>
        </div>
      </div>
    </div>
  );
}

interface MarketStat {
  symbol: string;
  price: string;
  change24h: string;
  changePercent: string;
  volume: string;
}

export default function MarketData() {
  // This would normally fetch real market data
  const { data: marketStats, isLoading } = useQuery({
    queryKey: ["/api/market/overview"],
    queryFn: async () => {
      // Mock data for demonstration - in real app this would fetch from your API
      return [
        {
          symbol: "BTCUSDT",
          price: "67,543.21",
          change24h: "+1,234.56",
          changePercent: "+1.86%",
          volume: "28.4B"
        },
        {
          symbol: "ETHUSDT", 
          price: "3,421.89",
          change24h: "-45.67",
          changePercent: "-1.32%",
          volume: "15.2B"
        },
        {
          symbol: "ADAUSDT",
          price: "0.4567",
          change24h: "+0.0123",
          changePercent: "+2.77%",
          volume: "892M"
        },
        {
          symbol: "SOLUSDT",
          price: "98.34",
          change24h: "+2.45",
          changePercent: "+2.55%",
          volume: "1.8B"
        }
      ] as MarketStat[];
    },
  });

  const topCoins = [
    "BTCUSDT", "ETHUSDT", "BNBUSDT", "ADAUSDT", 
    "SOLUSDT", "XRPUSDT", "DOTUSDT", "MATICUSDT"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-background to-muted/20">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Globe className="h-8 w-8 text-orange-500 mr-2" />
              <Badge variant="secondary" className="text-lg px-4 py-1 bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-orange-500/30">
                Live Market Data
              </Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Cryptocurrency <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
                Market Overview
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Real-time prices, market trends, and comprehensive analysis for major cryptocurrencies
            </p>
          </div>

          {/* Market Stats Cards */}
          <div className="mb-12">
            <MarketStatsGrid stats={marketStats || []} isLoading={isLoading} />
          </div>
        </div>
      </section>

      {/* Main Chart */}
      <section className="py-16">
        <div className="container px-4 mx-auto">
          <Card className="mb-12">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Bitcoin Price Chart
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Full Dashboard
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <SimpleBitcoinChart />
              </div>
            </CardContent>
          </Card>

          {/* Market Widgets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  Market Movers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCoins.slice(0, 4).map((symbol) => (
                    <div key={symbol} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="font-mono font-semibold">{symbol}</div>
                      <div className="text-right">
                        <div className="font-semibold">Loading...</div>
                        <div className="text-sm text-muted-foreground">24h change</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Volume Leaders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCoins.slice(4, 8).map((symbol) => (
                    <div key={symbol} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="font-mono font-semibold">{symbol}</div>
                      <div className="text-right">
                        <div className="font-semibold">Loading...</div>
                        <div className="text-sm text-muted-foreground">24h volume</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trading View Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <MarketWidget symbol="BTCUSDT" name="Bitcoin" />
            <Card>
              <CardHeader>
                <CardTitle>Economic Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Economic Events</h3>
                  <p className="text-muted-foreground mb-4">
                    Stay updated with important market events
                  </p>
                  <Button asChild variant="outline">
                    <Link href="/dashboard">
                      View in Dashboard
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold mb-4">Get Advanced Market Analysis</h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Access real-time trading signals, advanced charts, and professional analytics tools
                </p>
                <div className="flex justify-center space-x-4">
                  <Button asChild size="lg" className="crypto-gradient text-white">
                    <Link href="/auth">
                      Start Trading
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/pricing">
                      View Plans
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}