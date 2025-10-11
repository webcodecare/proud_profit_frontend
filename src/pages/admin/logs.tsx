import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Activity, 
  User, 
  Settings, 
  Database, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Search,
  Calendar,
  Download
} from "lucide-react";

interface AdminLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  status: "success" | "error" | "warning";
  timestamp: string;
}

interface LogFilters {
  userId?: string;
  action?: string;
  resource?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export default function AdminLogs() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<LogFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 50;

  // Fetch admin logs
  const { data: logsData, isLoading } = useQuery({
    queryKey: ["/api/admin/activity-logs", filters, currentPage],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      if (filters.userId) searchParams.append("userId", filters.userId);
      if (filters.action) searchParams.append("action", filters.action);
      if (filters.resource && filters.resource !== "all") searchParams.append("resource", filters.resource);
      if (filters.status && filters.status !== "all") searchParams.append("status", filters.status);
      if (filters.dateFrom) searchParams.append("startDate", filters.dateFrom);
      if (filters.dateTo) searchParams.append("endDate", filters.dateTo);
      if (filters.search) searchParams.append("search", filters.search);
      
      searchParams.append("page", currentPage.toString());
      searchParams.append("limit", logsPerPage.toString());

      const response = await fetch(`/api/admin/activity-logs?${searchParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch admin logs");
      }
      return await response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch users for filter dropdown
  const { data: users } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return await response.json();
    }
  });

  const logs = logsData?.logs || [];
  const totalLogs = logsData?.total || 0;
  const totalPages = Math.ceil(totalLogs / logsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="default" className="bg-emerald-500"><CheckCircle className="w-3 h-3 mr-1" />Success</Badge>;
      case "error":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
      case "warning":
        return <Badge variant="secondary" className="bg-yellow-500"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
      default:
        return <Badge variant="outline"><Info className="w-3 h-3 mr-1" />{status}</Badge>;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes("user")) return <User className="w-4 h-4" />;
    if (action.includes("settings") || action.includes("config")) return <Settings className="w-4 h-4" />;
    if (action.includes("database") || action.includes("data")) return <Database className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const exportLogs = () => {
    const csvContent = [
      "Timestamp,User,Action,Resource,Status,Details,IP Address",
      ...logs.map((log: AdminLog) => 
        `${log.timestamp},"${log.userEmail}","${log.action}","${log.resource}","${log.status}","${log.details.replace(/"/g, '""')}","${log.ipAddress}"`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Admin logs exported successfully"
    });
  };

  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  // Get unique actions and resources for filter dropdowns
  const uniqueActions = [...new Set(logs.map((log: AdminLog) => log.action))];
  const uniqueResources = [...new Set(logs.map((log: AdminLog) => log.resource))];

  const logStats = {
    total: totalLogs,
    success: logs.filter((log: AdminLog) => log.status === "success").length,
    errors: logs.filter((log: AdminLog) => log.status === "error").length,
    warnings: logs.filter((log: AdminLog) => log.status === "warning").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar className="hidden lg:block lg:w-64" />
        
        {/* Main Content */}
        <div className="flex-1 lg:ml-64">
          {/* Header */}
          <Header 
            title="Admin Activity Logs" 
            subtitle="View and export administrative activity logs"
          >
            <Button variant="outline" onClick={exportLogs}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </Header>

          {/* Content */}
          <div className="p-4 lg:p-6 space-y-6">

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{logStats.success}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{logStats.errors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{logStats.warnings}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Input
                placeholder="Search logs..."
                value={filters.search || ""}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>

            <Select value={filters.userId || ""} onValueChange={(value) => setFilters(prev => ({ ...prev, userId: value || undefined }))}>
              <SelectTrigger>
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users?.map((user: any) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.action || ""} onValueChange={(value) => setFilters(prev => ({ ...prev, action: value || undefined }))}>
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.resource || ""} onValueChange={(value) => setFilters(prev => ({ ...prev, resource: value || undefined }))}>
              <SelectTrigger>
                <SelectValue placeholder="Resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                {uniqueResources.map((resource) => (
                  <SelectItem key={resource} value={resource}>
                    {resource}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status || ""} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value || undefined }))}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="datetime-local"
                value={filters.dateFrom || ""}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">To Date</label>
              <Input
                type="datetime-local"
                value={filters.dateTo || ""}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activity Logs</CardTitle>
            <div className="text-sm text-muted-foreground">
              Showing {logs.length} of {totalLogs} logs
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: AdminLog) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="max-w-xs truncate">{log.userEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getActionIcon(log.action)}
                          <span>{log.action}</span>
                        </div>
                      </TableCell>
                      <TableCell>{log.resource}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="max-w-sm truncate">
                        {log.details}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ipAddress}
                      </TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No logs found matching your criteria
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
          </div>
        </div>
      </div>
    </div>
  );
}