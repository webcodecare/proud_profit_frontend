import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Users,
  TrendingUp,
  DollarSign,
  Server,
  RefreshCw,
  CheckCircle,
  XCircle,
  Database,
  Mail,
  MessageSquare,
  CreditCard,
} from "lucide-react";

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalSignals: number;
  signalsToday: number;
  totalRevenue: number;
  revenueThisMonth: number;
  activeSessions: number;
  systemUptime: number;
  databaseSize: string;
  apiCallsToday: number;
}

interface Integration {
  name: string;
  status: "connected" | "disconnected";
  type: string;
  last_checked: string;
}

interface IntegrationsResponse {
  integrations: Integration[];
  summary: {
    total: number;
    connected: number;
    disconnected: number;
    health: string;
  };
  last_updated: string;
}

export default function SystemMonitoring() {
  // Fetch system stats
  const { data: statsData, isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
    queryKey: ["/api/admin/system/stats"],
    queryFn: async () => {
      const response = await apiRequest("/api/admin/system/stats");
      return response.stats as SystemStats;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch integrations status
  const { data: integrationsData, isLoading: isLoadingIntegrations, refetch: refetchIntegrations } = useQuery<IntegrationsResponse>({
    queryKey: ["/api/admin/system/integrations"],
    queryFn: async () => {
      const response = await apiRequest("/api/admin/system/integrations");
      return response;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const stats = statsData || {} as SystemStats;
  const integrations = integrationsData?.integrations || [];
  const summary = integrationsData?.summary;

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case "database":
        return <Database className="h-4 w-4" />;
      case "payment":
        return <CreditCard className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "sms":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">System Monitoring</h1>
              <p className="text-muted-foreground">
                Real-time system statistics and integration status
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                refetchStats();
                refetchIntegrations();
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* System Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeUsers || 0} active users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Signals</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSignals || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.signalsToday || 0} signals today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(stats.totalRevenue || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  ${(stats.revenueThisMonth || 0).toLocaleString()} this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeSessions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {(stats.systemUptime || 0).toFixed(2)}% uptime
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database Size</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.databaseSize || "N/A"}</div>
                <p className="text-xs text-muted-foreground">Total storage used</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Calls Today</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(stats.apiCallsToday || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">API requests processed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <Badge variant={summary?.health === "healthy" ? "default" : "destructive"}>
                    {summary?.health || "Unknown"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Overall system status</p>
              </CardContent>
            </Card>
          </div>

          {/* Integrations Status */}
          <Card>
            <CardHeader>
              <CardTitle>Integration Status</CardTitle>
              <p className="text-sm text-muted-foreground">
                Monitor the status of all external service integrations
              </p>
            </CardHeader>
            <CardContent>
              {isLoadingIntegrations ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  <div className="text-muted-foreground">Loading integrations...</div>
                </div>
              ) : (
                <>
                  {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">{summary.total}</div>
                          <p className="text-sm text-muted-foreground">Total Integrations</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-green-600">
                            {summary.connected}
                          </div>
                          <p className="text-sm text-muted-foreground">Connected</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-red-600">
                            {summary.disconnected}
                          </div>
                          <p className="text-sm text-muted-foreground">Disconnected</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <div className="space-y-4">
                    {integrations.map((integration) => (
                      <div
                        key={integration.name}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {getIntegrationIcon(integration.type)}
                          </div>
                          <div>
                            <h3 className="font-medium">{integration.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {integration.type.charAt(0).toUpperCase() + integration.type.slice(1)} service
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              Last checked:{" "}
                              {new Date(integration.last_checked).toLocaleString()}
                            </p>
                          </div>
                          <Badge
                            variant={
                              integration.status === "connected" ? "default" : "destructive"
                            }
                            className="flex items-center gap-1"
                          >
                            {integration.status === "connected" ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {integration.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
