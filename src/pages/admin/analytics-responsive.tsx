import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Target,
  Download,
  LineChart as LineChartIcon,
  BarChart3,
} from "lucide-react";
import { AdminStats, AdminTableCard, QuickActions, MobileResponsiveButton } from "@/components/admin/ResponseDesignFix";

// Modular components for responsive design
function AnalyticsHeader({ selectedPeriod, onPeriodChange, onExportReport }: {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  onExportReport: () => void;
}) {
  const periods = [
    { value: '1d', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Analytics & Reporting</h1>
        <p className="text-sm text-muted-foreground">Comprehensive platform analytics and performance metrics</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Select value={selectedPeriod} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periods.map((period) => (
              <SelectItem key={period.value} value={period.value}>
                {period.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <MobileResponsiveButton variant="outline" onClick={onExportReport}>
          <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          Export
        </MobileResponsiveButton>
      </div>
    </div>
  );
}

function OverviewStats({ analyticsData, isLoading }: { 
  analyticsData?: any; 
  isLoading: boolean; 
}) {
  // Use real API data with fallbacks to zero
  const overviewData = {
    totalUsers: analyticsData?.overview?.totalUsers || 0,
    userGrowth: analyticsData?.overview?.userGrowth || 0,
    monthlyRevenue: analyticsData?.overview?.monthlyRevenue || 0,
    revenueGrowth: analyticsData?.overview?.revenueGrowth || 0,
    totalTrades: analyticsData?.overview?.totalTrades || 0,
    tradesGrowth: analyticsData?.overview?.tradesGrowth || 0,
    signalAccuracy: analyticsData?.overview?.signalAccuracy || 0,
    accuracyChange: analyticsData?.overview?.accuracyChange || 0
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
      <AdminStats
        title="Total Users"
        value={isLoading ? "..." : overviewData.totalUsers.toLocaleString()}
        icon={Users}
        trend={`+${overviewData.userGrowth}% from last period`}
      />
      <AdminStats
        title="Monthly Revenue"
        value={isLoading ? "..." : `$${overviewData.monthlyRevenue.toLocaleString()}`}
        icon={DollarSign}
        trend={`+${overviewData.revenueGrowth}% from last month`}
      />
      <AdminStats
        title="Total Trades"
        value={isLoading ? "..." : overviewData.totalTrades.toLocaleString()}
        icon={Activity}
        trend={`+${overviewData.tradesGrowth}% from last period`}
      />
      <AdminStats
        title="Signal Accuracy"
        value={isLoading ? "..." : `${overviewData.signalAccuracy}%`}
        icon={Target}
        trend={`+${overviewData.accuracyChange}% improvement`}
      />
    </div>
  );
}

function ChartCard({ title, icon: Icon, children, className = "" }: {
  title: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="p-3 sm:p-4 pb-2">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0">
        {children}
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  // Fetch real analytics data from API
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["/api/admin/analytics", selectedPeriod],
    queryFn: () => apiRequest(`/api/admin/analytics?period=${selectedPeriod}`),
    retry: 1,
  });

  // Use real chart data from API
  const chartData = analyticsData?.chartData || [];

  const exportReport = () => {
    const reportData = {
      period: selectedPeriod,
      generated: new Date().toISOString(),
      chartData: chartData,
      overview: analyticsData?.overview || {}
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 md:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
          <AnalyticsHeader
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            onExportReport={exportReport}
          />

          <OverviewStats analyticsData={analyticsData} isLoading={isLoading} />

          {/* Analytics Tabs */}
          <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="users" className="text-xs sm:text-sm">Users</TabsTrigger>
              <TabsTrigger value="revenue" className="text-xs sm:text-sm hidden sm:inline-flex">Revenue</TabsTrigger>
              <TabsTrigger value="trading" className="text-xs sm:text-sm hidden sm:inline-flex">Trading</TabsTrigger>
              <TabsTrigger value="signals" className="text-xs sm:text-sm hidden sm:inline-flex">Signals</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <ChartCard title="User Growth Trends" icon={LineChartIcon}>
                  <div className="h-60 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard title="Revenue Analytics" icon={BarChart3}>
                  <div className="h-60 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip formatter={(value) => [`$${value?.toLocaleString()}`, "Revenue"]} />
                        <Bar dataKey="revenue" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>

              {/* Activity Summary */}
              <AdminTableCard title="Platform Activity Summary" description="Key metrics and performance indicators">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="text-center p-3 sm:p-4 bg-muted/20 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">
                      {isLoading ? "..." : (analyticsData?.activity?.activeUsers || 0).toLocaleString()}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Active Users (30d)</div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-muted/20 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">
                      {isLoading ? "..." : `${analyticsData?.activity?.retentionRate || 0}%`}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">User Retention Rate</div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-muted/20 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-purple-600">
                      {isLoading ? "..." : (analyticsData?.activity?.avgSessionDuration || 0)}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Avg. Session Duration (hrs)</div>
                  </div>
                </div>
              </AdminTableCard>
            </TabsContent>

            <TabsContent value="users" className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <ChartCard title="User Registration Trends" icon={BarChart3}>
                  <div className="h-60 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData?.userRegistrations || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="users" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <AdminTableCard title="User Engagement Metrics" description="Activity and retention statistics">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span>Daily Active Users</span>
                      <Badge variant="outline" className="text-xs">
                        {isLoading ? "..." : (analyticsData?.engagement?.dailyActiveUsers || 0).toLocaleString()}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Weekly Active Users</span>
                      <Badge variant="outline" className="text-xs">
                        {isLoading ? "..." : (analyticsData?.engagement?.weeklyActiveUsers || 0).toLocaleString()}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Monthly Active Users</span>
                      <Badge variant="outline" className="text-xs">
                        {isLoading ? "..." : (analyticsData?.engagement?.monthlyActiveUsers || 0).toLocaleString()}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Avg. Session Time</span>
                      <Badge variant="outline" className="text-xs">
                        {isLoading ? "..." : (analyticsData?.engagement?.avgSessionTime || "0h 0m")}
                      </Badge>
                    </div>
                  </div>
                </AdminTableCard>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}