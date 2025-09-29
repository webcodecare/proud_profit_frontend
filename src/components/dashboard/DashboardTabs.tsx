import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, LineChart, PieChart, Zap } from "lucide-react";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load heavy chart components
const HeatmapChart = lazy(() => import("@/components/charts/HeatmapChart"));
const CycleChart = lazy(() => import("@/components/charts/CycleChart"));
const TradingViewRealWidget = lazy(() => import("@/components/charts/TradingViewRealWidget"));

interface DashboardTabsProps {
  selectedTickers: string[];
}

const ChartSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-64 w-full" />
  </div>
);

export default function DashboardTabs({ selectedTickers }: DashboardTabsProps) {
  return (
    <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
        <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
          <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Overview</span>
          <span className="sm:hidden">Charts</span>
        </TabsTrigger>
        <TabsTrigger value="charts" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
          <LineChart className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Charts</span>
          <span className="sm:hidden">Heat</span>
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
          <PieChart className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Analytics</span>
          <span className="sm:hidden">Data</span>
        </TabsTrigger>
        <TabsTrigger value="advanced" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
          <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Advanced</span>
          <span className="sm:hidden">Pro</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {selectedTickers.map((ticker) => (
            <Suspense key={ticker} fallback={<ChartSkeleton />}>
              <TradingViewRealWidget ticker={ticker} />
            </Suspense>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="charts" className="space-y-4 sm:space-y-6">
        <Suspense fallback={<ChartSkeleton />}>
          <HeatmapChart />
        </Suspense>
      </TabsContent>

      <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
        <Suspense fallback={<ChartSkeleton />}>
          <CycleChart />
        </Suspense>
      </TabsContent>

      <TabsContent value="advanced" className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-6">
          <Suspense fallback={<ChartSkeleton />}>
            <HeatmapChart />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <CycleChart />
          </Suspense>
        </div>
      </TabsContent>
    </Tabs>
  );
}