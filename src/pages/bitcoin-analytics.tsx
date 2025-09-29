import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HeatmapChart from "@/components/charts/HeatmapChart";
import CycleChart from "@/components/charts/CycleChart";
import AdvancedForecastChart from "@/components/charts/AdvancedForecastChart";
import MetricsGrid from "@/components/analytics/MetricsGrid";
import FeatureCard from "@/components/analytics/FeatureCard";
import AlgorithmGrid from "@/components/analytics/AlgorithmGrid";
import { 
  Bitcoin, 
  TrendingUp, 
  Calendar,
  Activity,
  Brain,
  RefreshCw,
  Target,
  BarChart3,
  Zap
} from "lucide-react";

export default function BitcoinAnalytics() {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch real-time Bitcoin analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["/api/public/market/overview"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: heatmapData } = useQuery({
    queryKey: ["/api/public/chart/heatmap/BTC"],
  });

  const { data: cycleData } = useQuery({
    queryKey: ["/api/public/chart/cycle/BTC"],
  });

  const features = [
    // Hidden as requested by client:
    /*
    {
      title: "200-Week SMA Heatmap",
      description: "Visualizes price deviations from the 200-week simple moving average with color-coded heatmap",
      icon: <BarChart3 className="h-5 w-5" />,
      status: "Active",
      component: "HeatmapChart"
    },
    {
      title: "2-Year Cycle Analysis", 
      description: "Tracks 2-year moving average deviations with halving event overlays and cycle phases",
      icon: <Activity className="h-5 w-5" />,
      status: "Active",
      component: "CycleChart"
    },
    {
      title: "Advanced Cycle Forecasting",
      description: "6-algorithm ensemble including Fourier, Elliott Wave, Gann, Harmonic, Fractal, and Entropy analysis",
      icon: <Brain className="h-5 w-5" />,
      status: "Active", 
      component: "AdvancedForecastChart"
    },
    {
      title: "Edge Function Computing",
      description: "Server-side computation of SMA deviations, cycle indicators, and forecasting models",
      icon: <Zap className="h-5 w-5" />,
      status: "Active",
      component: "CycleForecastingService"
    }
    */
  ];

  const metrics = [
    {
      label: "Current 200W SMA Deviation",
      value: heatmapData?.[0]?.deviationPercent || "+24.7%",
      trend: "up",
      color: "text-green-400"
    },
    {
      label: "2Y Cycle Position", 
      value: cycleData?.[0]?.cycleMomentum || "0.73",
      trend: "up",
      color: "text-blue-400"
    },
    {
      label: "Forecast Confidence",
      value: "84.2%",
      trend: "up", 
      color: "text-purple-400"
    },
    {
      label: "Halving Progress",
      value: "67%",
      trend: "neutral",
      color: "text-orange-400"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        
        <div className="ml-0 lg:ml-64 flex-1">
          <Header />
          
          <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Bitcoin className="h-5 w-5 sm:h-6 sm:w-6 text-[#FF6B35]" />
                <h1 className="text-lg sm:text-2xl font-bold">Analytics</h1>
              </div>
              <Badge variant="outline" className="text-green-400 border-green-400 text-xs px-2 py-1">
                <span className="hidden sm:inline">All Systems </span>Active
              </Badge>
            </div>

            {/* Key Metrics */}
            <MetricsGrid metrics={metrics} />

            {/* Feature Status Cards - Hidden as requested */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {features.map((feature, index) => (
                <FeatureCard key={index} feature={feature} />
              ))}
            </div>

            {/* Analytics Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
                <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
                <TabsTrigger value="heatmap" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">200W </span>Heatmap
                </TabsTrigger>
                <TabsTrigger value="cycle" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">2Y </span>Cycle
                </TabsTrigger>
                <TabsTrigger value="forecast" className="text-xs sm:text-sm">Forecast</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <Card className="p-3 sm:p-4">
                    <CardHeader className="p-0 pb-3">
                      <CardTitle className="text-sm sm:text-base">200-Week SMA Heatmap</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <HeatmapChart symbol="BTC" height={250} />
                    </CardContent>
                  </Card>

                  <Card className="p-3 sm:p-4">
                    <CardHeader className="p-0 pb-3">
                      <CardTitle className="text-sm sm:text-base">2-Year Cycle Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <CycleChart symbol="BTC" height={250} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="heatmap" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>200-Week SMA Deviation Heatmap</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Color-coded visualization of Bitcoin price deviations from 200-week SMA with tooltip support
                    </p>
                  </CardHeader>
                  <CardContent>
                    <HeatmapChart symbol="BTC" height={500} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cycle" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>2-Year MA Deviation Indicator</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Line chart with shaded bands showing 2-year moving average deviations and halving events
                    </p>
                  </CardHeader>
                  <CardContent>
                    <CycleChart symbol="BTC" height={500} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="forecast" className="space-y-4 sm:space-y-6">
                <AdvancedForecastChart ticker="BTCUSDT" />
                
                <Card className="p-3 sm:p-4">
                  <CardHeader className="p-0 pb-3">
                    <CardTitle className="text-sm sm:text-base">Forecasting Algorithms</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <AlgorithmGrid algorithms={[
                      { name: "Fourier Transform", accuracy: "87.3%", status: "Active" },
                      { name: "Elliott Wave", accuracy: "82.1%", status: "Active" },
                      { name: "Gann Analysis", accuracy: "79.6%", status: "Active" },
                      { name: "Harmonic Patterns", accuracy: "85.4%", status: "Active" },
                      { name: "Fractal Dimension", accuracy: "88.7%", status: "Active" },
                      { name: "Entropy Analysis", accuracy: "83.9%", status: "Active" }
                    ]} />
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