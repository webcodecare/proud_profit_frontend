import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Users, Award } from "lucide-react";
import PublicDemoChart from "@/components/charts/PublicDemoChart";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 crypto-gradient opacity-20"></div>
      <div className="relative container mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Professional <span className="text-primary">Crypto</span> Trading Signals
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Advanced Bitcoin analytics with real-time TradingView signals, 200-week heatmaps, and cycle forecasting. Join thousands of traders making data-driven decisions.
              </p>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="crypto-gradient text-white">
                <Link href="/login">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/auth">Sign Up Now</Link>
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex items-center space-x-8 pt-8">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">12,847+ Active Traders</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <span className="text-sm text-muted-foreground">87% Win Rate</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-muted-foreground">4.9/5 Rating</span>
              </div>
            </div>
            
            {/* Track Record Metrics */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-400">87%</div>
                <div className="text-sm text-muted-foreground">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">12,847</div>
                <div className="text-sm text-muted-foreground">Active Traders</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-400">+234%</div>
                <div className="text-sm text-muted-foreground">Avg ROI</div>
              </div>
            </div>
          </div>
          
          {/* Live Demo Chart with Simulated Signals */}
          <div className="lg:ml-8">
            <PublicDemoChart 
              title="Bitcoin Live Chart with Signals"
              symbol="BTCUSDT"
              className="shadow-xl"
            />
            
            {/* Additional Demo Features */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Live Demo Features:</span>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Real-time Signals</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>OHLC Data</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span>Alert Markers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}