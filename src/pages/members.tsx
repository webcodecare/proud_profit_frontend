import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import Navigation from "@/components/layout/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TradingViewChart from "@/components/charts/TradingViewChart";
import HeatmapChart from "@/components/charts/HeatmapChart";
import { 
  TrendingUp, 
  Lock, 
  Crown, 
  Zap,
  ArrowRight,
  Star
} from "lucide-react";

export default function Members() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Members Only</h2>
              <p className="text-muted-foreground mb-6">
                Please sign in to access the members area
              </p>
              <div className="flex space-x-3">
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/auth">Sign In</Link>
                </Button>
                <Button asChild className="flex-1 crypto-gradient text-white">
                  <Link href="/pricing">View Plans</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-background to-muted/20">
        <div className="container px-4 mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <Crown className="h-8 w-8 text-yellow-500 mr-2" />
            <Badge variant="secondary" className="text-lg px-4 py-1">
              Members Area
            </Badge>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome Back, <span className="crypto-gradient bg-clip-text text-transparent">
              {user?.firstName || 'Trader'}
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Access your limited dashboard and essential trading tools
          </p>
          <div className="flex justify-center space-x-4">
            <Button asChild size="lg" className="crypto-gradient text-white">
              <Link href="/dashboard">
                <Zap className="mr-2 h-5 w-5" />
                Full Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">
                <Crown className="mr-2 h-5 w-5" />
                Upgrade Plan
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Limited Dashboard Content */}
      <section className="py-16">
        <div className="container px-4 mx-auto">
          <div className="grid gap-8">
            {/* Basic Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Bitcoin Price Chart
                  </CardTitle>
                  <Badge variant="secondary">Limited View</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <TradingViewChart 
                  symbol="BTCUSDT" 
                  height={300}
                  showSignals={false}
                />
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Upgrade to Pro to see buy/sell signals and advanced indicators
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Limited Heatmap */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>200-Week Heatmap (Sample)</CardTitle>
                  <Badge variant="secondary">Preview Only</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <HeatmapChart symbol="BTC" />
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                    <div className="text-center">
                      <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-xl font-semibold mb-2">Upgrade Required</h3>
                      <p className="text-muted-foreground mb-4">
                        Full heatmap analysis available with Pro plan
                      </p>
                      <Button asChild className="crypto-gradient text-white">
                        <Link href="/pricing">
                          Upgrade Now
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upgrade CTA */}
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="p-8 text-center">
                <Star className="h-16 w-16 mx-auto mb-6 text-primary" />
                <h2 className="text-3xl font-bold mb-4">Ready for Full Access?</h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Unlock all features including real-time signals, advanced analytics, 
                  cycle forecasting, and priority alerts
                </p>
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="crypto-gradient w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">Real-time Signals</h3>
                    <p className="text-sm text-muted-foreground">
                      Get instant buy/sell alerts
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="crypto-gradient w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">Advanced Analytics</h3>
                    <p className="text-sm text-muted-foreground">
                      Complete heatmap & forecasting
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="crypto-gradient w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Crown className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">Priority Support</h3>
                    <p className="text-sm text-muted-foreground">
                      Direct access to our team
                    </p>
                  </div>
                </div>
                <div className="flex justify-center space-x-4">
                  <Button asChild size="lg" className="crypto-gradient text-white">
                    <Link href="/pricing">
                      <Crown className="mr-2 h-5 w-5" />
                      View Plans
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/dashboard">
                      Try Dashboard
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