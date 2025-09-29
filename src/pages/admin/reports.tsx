import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BarChart3, Download, Calendar, TrendingUp, Users, DollarSign, Zap, Activity } from "lucide-react";

interface ReportData {
  id: string;
  name: string;
  type: "user_activity" | "signal_effectiveness" | "subscription_trends" | "revenue_analytics";
  generatedAt: string;
  downloadUrl: string;
  status: "generating" | "ready" | "expired";
  fileSize: string;
}

export default function AdminReports() {
  const [selectedReportType, setSelectedReportType] = useState("user_activity");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const { toast } = useToast();

  const { data: reports = [], isLoading } = useQuery<ReportData[]>({
    queryKey: ["/api/admin/reports"],
  });

  const generateReportMutation = useMutation({
    mutationFn: async (reportConfig: any) => {
      const response = await apiRequest("POST", "/api/admin/reports/generate", reportConfig);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      toast({
        title: "Report Generated",
        description: "Your report has been generated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate report",
        variant: "destructive",
      });
    },
  });

  const downloadReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await apiRequest("GET", `/api/admin/reports/${reportId}/download`);
      return response.blob();
    },
    onSuccess: (blob, reportId) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Started",
        description: "Your report is being downloaded.",
      });
    },
  });

  const handleGenerateReport = () => {
    if (!dateRange.start || !dateRange.end) {
      toast({
        title: "Date Range Required",
        description: "Please select both start and end dates.",
        variant: "destructive",
      });
      return;
    }

    generateReportMutation.mutate({
      type: selectedReportType,
      dateRange,
      format: "xlsx",
    });
  };

  const reportTypes = [
    { value: "user_activity", label: "User Activity Report", icon: Users, description: "User login patterns, session durations, feature usage" },
    { value: "signal_analytics", label: "Signal Analytics", icon: TrendingUp, description: "Raw TradingView signal accuracy, delivery rates, timeframe analysis" },
    { value: "subscription_trends", label: "Subscription Trends", icon: BarChart3, description: "Plan upgrades, downgrades, churn analysis, retention metrics" },
    { value: "revenue_analytics", label: "Revenue Analytics", icon: DollarSign, description: "Payment trends, MRR, subscription revenue forecasts" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "generating":
        return <Badge variant="secondary">Generating...</Badge>;
      case "ready":
        return <Badge variant="default">Ready</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        
        {/* Main Content */}
        <div className="ml-0 lg:ml-64 flex-1">
          {/* Header */}
          <header className="bg-card border-b border-border p-4 lg:p-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">Reports & Analytics</h1>
                <p className="text-muted-foreground">Generate and download comprehensive platform reports</p>
              </div>
              <Button onClick={handleGenerateReport} disabled={generateReportMutation.isPending}>
                {generateReportMutation.isPending ? "Generating..." : "Generate Report"}
              </Button>
            </div>
          </header>

          {/* Content */}
          <div className="p-4 lg:p-6 space-y-6">

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">Generate New Report</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
          <TabsTrigger value="analytics">Quick Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>Configure and generate downloadable reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <Card 
                      key={type.value}
                      className={`cursor-pointer transition-colors ${
                        selectedReportType === type.value ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => setSelectedReportType(type.value)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <IconComponent className="h-5 w-5 mt-0.5 text-primary" />
                          <div>
                            <h4 className="font-medium">{type.label}</h4>
                            <p className="text-sm text-muted-foreground">{type.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
              <CardDescription>Download previously generated reports</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No reports generated yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {reports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{report.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>Generated: {new Date(report.generatedAt).toLocaleDateString()}</span>
                          <span>Size: {report.fileSize}</span>
                          {getStatusBadge(report.status)}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadReportMutation.mutate(report.id)}
                        disabled={report.status !== "ready" || downloadReportMutation.isPending}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">1,247</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">+12% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                    <p className="text-2xl font-bold">892</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">+8% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Signals Sent</p>
                    <p className="text-2xl font-bold">15,432</p>
                  </div>
                  <Zap className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">+24% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                    <p className="text-2xl font-bold">$24,891</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">+15% from last month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Platform Health</CardTitle>
              <CardDescription>Real-time system metrics and performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Activity className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">System Status</p>
                  <p className="text-xs text-muted-foreground">All systems operational</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">Uptime</p>
                  <p className="text-xs text-muted-foreground">99.9% (30 days)</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">Response Time</p>
                  <p className="text-xs text-muted-foreground">&lt; 200ms average</p>
                </div>
              </div>
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