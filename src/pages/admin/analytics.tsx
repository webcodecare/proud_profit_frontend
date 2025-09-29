import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Activity, 
  Target,
  Download,
  Filter,
  Calendar,
  PieChart,
  LineChart,
  BarChart2
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart, Cell } from "recharts";

export default function AdminAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('all');

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['/api/admin/analytics', selectedPeriod, selectedMetric],
    refetchInterval: 30000,
  });

  const { data: revenueData } = useQuery({
    queryKey: ['/api/admin/analytics/revenue', selectedPeriod],
  });

  const { data: userMetrics } = useQuery({
    queryKey: ['/api/admin/analytics/users', selectedPeriod],
  });


  const { data: signalPerformance } = useQuery({
    queryKey: ['/api/admin/analytics/signals', selectedPeriod],
  });

  // Mock data for demonstration
  const mockOverviewData = {
    totalUsers: 12847,
    activeUsers: 8934,
    totalRevenue: 284567.89,
    monthlyRevenue: 45892.34,
    signalAccuracy: 78.4,
    userGrowth: 12.5,
    revenueGrowth: 8.3,
    accuracyChange: 2.1
  };

  const mockChartData = [
    { name: 'Jan', users: 4000, revenue: 24000 },
    { name: 'Feb', users: 3000, revenue: 13980 },
    { name: 'Mar', users: 2000, revenue: 29800 },
    { name: 'Apr', users: 2780, revenue: 39080 },
    { name: 'May', users: 1890, revenue: 48000 },
    { name: 'Jun', users: 2390, revenue: 38000 },
    { name: 'Jul', users: 3490, revenue: 43000 },
  ];

  const mockRevenueData = [
    { month: 'Jan', revenue: 24000 },
    { month: 'Feb', revenue: 13980 },
    { month: 'Mar', revenue: 29800 },
    { month: 'Apr', revenue: 39080 },
    { month: 'May', revenue: 48000 },
    { month: 'Jun', revenue: 38000 },
    { month: 'Jul', revenue: 43000 },
  ];


  const mockSignalData = [
    { date: '2025-01-01', accuracy: 78.5 },
    { date: '2025-01-07', accuracy: 82.1 },
    { date: '2025-01-14', accuracy: 75.3 },
    { date: '2025-01-21', accuracy: 84.7 },
    { date: '2025-01-28', accuracy: 79.2 },
    { date: '2025-02-04', accuracy: 86.1 },
    { date: '2025-02-11', accuracy: 83.4 },
  ];

  const periods = [
    { value: '1d', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const exportReport = () => {
    // Generate and download comprehensive report
    const reportData = {
      period: selectedPeriod,
      generated: new Date().toISOString(),
      metrics: mockOverviewData,
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
          {/* Header */}
          <Header 
            title="Analytics & Reporting" 
            subtitle="Comprehensive platform analytics and performance metrics"
          >
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={exportReport}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((period) => (
                    <SelectItem key={period.value} value={period.value || "default"}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Header>

          {/* Content */}
          <div className="p-4 lg:p-6 space-y-6">

            {/* Key Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading ? "..." : ((analyticsData as any)?.overview?.totalUsers || mockOverviewData.totalUsers).toLocaleString()}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    +{(analyticsData as any)?.overview?.userGrowth || mockOverviewData.userGrowth}% from last period
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading ? "..." : `$${((analyticsData as any)?.overview?.monthlyRevenue || mockOverviewData.monthlyRevenue).toLocaleString()}`}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    +{(analyticsData as any)?.overview?.revenueGrowth || mockOverviewData.revenueGrowth}% from last month
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading ? "..." : ((analyticsData as any)?.overview?.activeSubscriptions || 892).toLocaleString()}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    +8.2% from last period
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Signal Accuracy</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading ? "..." : `${(analyticsData as any)?.overview?.signalAccuracy || mockOverviewData.signalAccuracy}%`}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    +{(analyticsData as any)?.overview?.accuracyChange || mockOverviewData.accuracyChange}% improvement
                  </div>
                </CardContent>
              </Card>
            </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="signals">Signals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  User Growth Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <RechartsLineChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Revenue Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                    <span className="text-sm font-medium">Subscriptions</span>
                    <Badge variant="outline">75.3%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                    <span className="text-sm font-medium">API Access</span>
                    <Badge variant="outline">19.4%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                    <span className="text-sm font-medium">Premium Features</span>
                    <Badge variant="outline">5.3%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Platform Activity Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{mockOverviewData.activeUsers.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Active Users (30d)</div>
                </div>
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">89.4%</div>
                  <div className="text-sm text-muted-foreground">User Retention Rate</div>
                </div>
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">4.2</div>
                  <div className="text-sm text-muted-foreground">Avg. Session Duration (hrs)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Registration Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
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
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="users" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Daily Active Users</span>
                    <Badge variant="outline">3,247</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Weekly Active Users</span>
                    <Badge variant="outline">8,934</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Monthly Active Users</span>
                    <Badge variant="outline">12,847</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Avg. Session Time</span>
                    <Badge variant="outline">4h 12m</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(revenueData as any)?.monthlyRevenue || mockRevenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value?.toLocaleString()}`, "Revenue"]} />
                      <Bar dataKey="revenue" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Subscriptions</span>
                    <span className="font-medium">$34,567</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Trading Fees</span>
                    <span className="font-medium">$8,923</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Premium Features</span>
                    <span className="font-medium">$2,402</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center font-bold">
                      <span>Total</span>
                      <span>${mockOverviewData.monthlyRevenue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>


        <TabsContent value="signals" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Signal Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={(signalPerformance as any)?.accuracyData || mockSignalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, "Accuracy"]} />
                      <Line type="monotone" dataKey="accuracy" stroke="#8B5CF6" strokeWidth={2} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Signal Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Signals</span>
                    <Badge variant="outline">{(signalPerformance as any)?.totalSignals || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Successful Signals</span>
                    <Badge variant="outline" className="text-green-600">{(signalPerformance as any)?.successfulSignals || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Failed Signals</span>
                    <Badge variant="outline" className="text-red-600">{(signalPerformance as any)?.failedSignals || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Accuracy Rate</span>
                    <Badge variant="outline">{(signalPerformance as any)?.accuracy || 0}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </div>
  );
}