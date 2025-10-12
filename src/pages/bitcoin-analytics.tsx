import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SidebarWithSubscription from "../components/layout/SidebarWithSubscription";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import HeatmapChart from "../components/charts/HeatmapChart";
import CycleChart from "../components/charts/CycleChart";
import AdvancedForecastChart from "../components/charts/AdvancedForecastChart";
import MetricsGrid from "../components/analytics/MetricsGrid";
import FeatureCard from "../components/analytics/FeatureCard";
import AlgorithmGrid from "../components/analytics/AlgorithmGrid";
import {
  Bitcoin,
  BarChart3,
  Activity,
  Brain,
  Zap,
  Loader2,
} from "lucide-react";
import { buildApiUrl } from "../lib/config";

export default function BitcoinAnalytics() {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch real-time Bitcoin analytics data
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useQuery({
    queryKey: ["/api/public/market/overview"],
    queryFn: async () => {
      const response = await fetch(buildApiUrl("/api/public/market/overview"));
      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000,
    gcTime: 60000,
    retry: 2,
  });

  const {
    data: heatmapData,
    isLoading: heatmapLoading,
    error: heatmapError,
  } = useQuery({
    queryKey: ["/api/public/chart/heatmap/BTC"],
    queryFn: async () => {
      const response = await fetch(
        buildApiUrl("/api/public/chart/heatmap/BTC")
      );
      if (!response.ok) {
        throw new Error("Failed to fetch heatmap data");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  const {
    data: cycleData,
    isLoading: cycleLoading,
    error: cycleError,
  } = useQuery({
    queryKey: ["/api/public/chart/cycle/BTC"],
    queryFn: async () => {
      const response = await fetch(buildApiUrl("/api/public/chart/cycle/BTC"));
      if (!response.ok) {
        throw new Error("Failed to fetch cycle data");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  // Fetch algorithm performance data - fully dynamic from database
  const { data: algorithmsData, isLoading: algorithmsLoading, error: algorithmsError } = useQuery({
    queryKey: ["/api/public/analytics/algorithms"],
    queryFn: async () => {
      const response = await fetch(
        buildApiUrl("/api/public/analytics/algorithms")
      );
      if (!response.ok) {
        throw new Error("Failed to fetch algorithms data");
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  const features = [
    {
      title: "200-Week SMA Heatmap",
      description:
        "Visualizes price deviations from the 200-week simple moving average with color-coded heatmap",
      icon: <BarChart3 className="h-5 w-5" />,
      status: "Active",
      component: "HeatmapChart",
    },
    {
      title: "2-Year Cycle Analysis",
      description:
        "Tracks 2-year moving average deviations with halving event overlays and cycle phases",
      icon: <Activity className="h-5 w-5" />,
      status: "Active",
      component: "CycleChart",
    },
    {
      title: "Advanced Cycle Forecasting",
      description:
        "6-algorithm ensemble including Fourier, Elliott Wave, Gann, Harmonic, Fractal, and Entropy analysis",
      icon: <Brain className="h-5 w-5" />,
      status: "Active",
      component: "AdvancedForecastChart",
    },
    {
      title: "Edge Function Computing",
      description:
        "Server-side computation of SMA deviations, cycle indicators, and forecasting models",
      icon: <Zap className="h-5 w-5" />,
      status: "Active",
      component: "CycleForecastingService",
    },
  ];

  // Fully dynamic metrics from database - no static fallbacks
  const metrics = [
    {
      label: "Current 200W SMA Deviation",
      value:
        heatmapData?.deviationPercent ||
        (heatmapData &&
          Array.isArray(heatmapData) &&
          heatmapData[0]?.deviationPercent) ||
        (heatmapLoading ? "Loading..." : "--"),
      trend: (heatmapData?.trend || "neutral") as "up" | "down" | "neutral",
      color: "text-green-400",
    },
    {
      label: "2Y Cycle Position",
      value:
        cycleData?.cycleMomentum ||
        (cycleData &&
          Array.isArray(cycleData) &&
          cycleData[0]?.cycleMomentum) ||
        (cycleLoading ? "Loading..." : "--"),
      trend: (cycleData?.trend || "neutral") as "up" | "down" | "neutral",
      color: "text-blue-400",
    },
    {
      label: "Forecast Confidence",
      value: analyticsData?.forecastConfidence || (analyticsLoading ? "Loading..." : "--"),
      trend: (analyticsData?.trend || "neutral") as "up" | "down" | "neutral",
      color: "text-purple-400",
    },
    {
      label: "Halving Progress",
      value: analyticsData?.halvingProgress || (analyticsLoading ? "Loading..." : "--"),
      trend: "neutral" as const,
      color: "text-orange-400",
    },
  ];

  // Enhanced loading state - show loading only if all critical data is loading
  const isMainLoading = analyticsLoading && heatmapLoading && cycleLoading;

  if (isMainLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex">
          <SidebarWithSubscription />
          <div className="ml-0 lg:ml-64 flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading Bitcoin analytics...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced error state - only show error if all APIs fail
  const hasAllErrors = analyticsError && heatmapError && cycleError;

  if (hasAllErrors) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex">
          <SidebarWithSubscription />
          <div className="ml-0 lg:ml-64 flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-destructive mb-2">
                Error Loading Analytics
              </h2>
              <p className="text-sm text-muted-foreground">
                Unable to connect to analytics services. Please try again later.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <SidebarWithSubscription />

        <div className="ml-0 lg:ml-64 flex-1">
          <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Bitcoin className="h-5 w-5 sm:h-6 sm:w-6 text-[#FF6B35]" />
                <h1 className="text-lg sm:text-2xl font-bold">
                  Bitcoin Analytics
                </h1>
              </div>
              <Badge
                variant="outline"
                className="text-green-400 border-green-400 text-xs px-2 py-1"
              >
                <span className="hidden sm:inline">All Systems </span>Active
              </Badge>
            </div>

            {/* Key Metrics */}
            <MetricsGrid metrics={metrics} />

            {/* Feature Status Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {features.map((feature, index) => (
                <FeatureCard key={index} feature={feature} />
              ))}
            </div>

            {/* Analytics Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
                <TabsTrigger value="overview" className="text-xs sm:text-sm">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="heatmap" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">200W </span>Heatmap
                </TabsTrigger>
                <TabsTrigger value="cycle" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">2Y </span>Cycle
                </TabsTrigger>
                <TabsTrigger value="forecast" className="text-xs sm:text-sm">
                  Forecast
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <Card className="p-3 sm:p-4">
                    <CardHeader className="p-0 pb-3">
                      <CardTitle className="text-sm sm:text-base">
                        200-Week SMA Heatmap
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {heatmapError ? (
                        <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                          <p className="text-sm">Unable to load heatmap data</p>
                        </div>
                      ) : (
                        <HeatmapChart symbol="BTC" height={250} />
                      )}
                    </CardContent>
                  </Card>

                  <Card className="p-3 sm:p-4">
                    <CardHeader className="p-0 pb-3">
                      <CardTitle className="text-sm sm:text-base">
                        2-Year Cycle Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {cycleError ? (
                        <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                          <p className="text-sm">Unable to load cycle data</p>
                        </div>
                      ) : (
                        <CycleChart symbol="BTC" height={250} />
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="heatmap" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>200-Week SMA Deviation Heatmap</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Color-coded visualization of Bitcoin price deviations from
                      200-week SMA with tooltip support
                    </p>
                  </CardHeader>
                  <CardContent>
                    {heatmapError ? (
                      <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <p className="text-sm mb-2">
                            Unable to load heatmap data
                          </p>
                          <p className="text-xs">
                            Please check your connection and try again
                          </p>
                        </div>
                      </div>
                    ) : (
                      <HeatmapChart symbol="BTC" height={500} />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cycle" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>2-Year MA Deviation Indicator</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Line chart with shaded bands showing 2-year moving average
                      deviations and halving events
                    </p>
                  </CardHeader>
                  <CardContent>
                    {cycleError ? (
                      <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <p className="text-sm mb-2">
                            Unable to load cycle data
                          </p>
                          <p className="text-xs">
                            Please check your connection and try again
                          </p>
                        </div>
                      </div>
                    ) : (
                      <CycleChart symbol="BTC" height={500} />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="forecast" className="space-y-6">
                <AdvancedForecastChart ticker="BTC" />
              </TabsContent>

            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
