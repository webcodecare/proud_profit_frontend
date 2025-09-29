import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  const mockData = {
    totalUsers: 12847,
    userGrowth: 15.3,
    monthlyRevenue: 45892,
    revenueGrowth: 22.1,
    totalTrades: 89420,
    tradesGrowth: 18.7,
    signalAccuracy: 84.2,
    accuracyChange: 2.1
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
      <AdminStats
        title="Total Users"
        value={isLoading ? "..." : (analyticsData?.overview?.totalUsers || mockData.totalUsers).toLocaleString()}
        icon={Users}
        trend={`+${analyticsData?.overview?.userGrowth || mockData.userGrowth}% from last period`}
      />
      <AdminStats
        title="Monthly Revenue"
        value={isLoading ? "..." : `$${(analyticsData?.overview?.monthlyRevenue || mockData.monthlyRevenue).toLocaleString()}`}
        icon={DollarSign}
        trend={`+${analyticsData?.overview?.revenueGrowth || mockData.revenueGrowth}% from last month`}
      />
      <AdminStats
        title="Total Trades"
        value={isLoading ? "..." : (analyticsData?.overview?.totalTrades || mockData.totalTrades).toLocaleString()}
        icon={Activity}
        trend={`+${analyticsData?.overview?.tradesGrowth || mockData.tradesGrowth}% from last period`}
      />
      <AdminStats
        title="Signal Accuracy"
        value={isLoading ? "..." : `${analyticsData?.overview?.signalAccuracy || mockData.signalAccuracy}%`}
        icon={Target}
        trend={`+${analyticsData?.overview?.accuracyChange || mockData.accuracyChange}% improvement`}
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

  // Mock data for demonstration
  const mockChartData = [
    { name: 'Jan', users: 4000, revenue: 24000, trades: 2400 },
    { name: 'Feb', users: 3000, revenue: 13980, trades: 2210 },
    { name: 'Mar', users: 2000, revenue: 29800, trades: 2290 },
    { name: 'Apr', users: 2780, revenue: 39080, trades: 2000 },
    { name: 'May', users: 1890, revenue: 48000, trades: 2181 },
    { name: 'Jun', users: 2390, revenue: 38000, trades: 2500 },
    { name: 'Jul', users: 3490, revenue: 43000, trades: 2100 },
  ];

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["/api/admin/analytics", selectedPeriod],
    enabled: false, // Disabled for demo
  });

  const exportReport = () => {
    const reportData = {
      period: selectedPeriod,
      generated: new Date().toISOString(),
      chartData: mockChartData
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
    <div className="flex h-screen bg-background">
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
                      <LineChart data={mockChartData}>
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
                      <BarChart data={mockChartData}>
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
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">15,247</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Active Users (30d)</div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-muted/20 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">89.4%</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">User Retention Rate</div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-muted/20 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-purple-600">4.2</div>
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
                      <BarChart data={[
                        { name: 'Mon', users: 45 },
                        { name: 'Tue', users: 52 },
                        { name: 'Wed', users: 38 },
                        { name: 'Thu', users: 61 },
                        { name: 'Fri', users: 47 },
                        { name: 'Sat', users: 33 },
                        { name: 'Sun', users: 29 },
                      ]}>
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
                      <Badge variant="outline" className="text-xs">3,247</Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Weekly Active Users</span>
                      <Badge variant="outline" className="text-xs">8,934</Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Monthly Active Users</span>
                      <Badge variant="outline" className="text-xs">12,847</Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Avg. Session Time</span>
                      <Badge variant="outline" className="text-xs">4h 12m</Badge>
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