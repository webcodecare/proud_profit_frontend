import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Play, BarChart3, TrendingUp } from "lucide-react";
import PublicDemoChart from "@/components/charts/PublicDemoChart";

export default function DemoChartsSection() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Live Trading Signals Demo</h2>
          <p className="text-xl text-muted-foreground mb-6">
            Experience our professional-grade charts with real-time OHLC data and simulated trading alerts
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Button asChild className="crypto-gradient text-white">
              <Link href="/auth">
                <Play className="mr-2 h-4 w-4" />
                Try Live Demo
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pricing">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Pricing
              </Link>
            </Button>
          </div>
        </div>

        {/* Main Demo Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Bitcoin Demo Chart with Live Signals */}
          <PublicDemoChart 
            title="Bitcoin Analytics Dashboard"
            symbol="BTCUSDT"
            className="border border-border hover:border-primary/30 transition-colors"
          />

          {/* Ethereum Demo Chart */}
          <PublicDemoChart 
            title="Ethereum Live Signals"
            symbol="ETHUSDT"
            className="border border-border hover:border-primary/30 transition-colors"
          />
        </div>

        {/* Additional Demo Charts */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <PublicDemoChart 
            title="Solana Market Analysis"
            symbol="SOLUSDT"
            className="border border-border hover:border-primary/30 transition-colors"
          />
          <PublicDemoChart 
            title="Cardano Trading Signals"
            symbol="ADAUSDT" 
            className="border border-border hover:border-primary/30 transition-colors"
          />
        </div>

        {/* Demo Features Highlight */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="hover:border-primary/50 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-time OHLC Data</h3>
              <p className="text-muted-foreground text-sm">
                Live candlestick charts with authentic market data updated every second
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Simulated Buy/Sell Alerts</h3>
              <p className="text-muted-foreground text-sm">
                Experience our signal system with live trading alerts and markers
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Professional Analytics</h3>
              <p className="text-muted-foreground text-sm">
                Advanced charting tools and technical indicators for serious traders
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12 p-8 bg-muted rounded-lg">
          <h3 className="text-2xl font-bold mb-4">Ready to Start Trading with Real Signals?</h3>
          <p className="text-muted-foreground mb-6">
            Join thousands of traders using our professional-grade platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="crypto-gradient text-white">
              <Link href="/login">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth">Create Account</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}