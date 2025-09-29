import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// Mock data for demonstration
const MOCK_LOGS = [
  {
    id: "1",
    userId: "admin@demo.com",
    userEmail: "admin@demo.com",
    action: "user.create",
    resource: "users",
    resourceId: "user_123",
    details: "Created new user account",
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    status: "success" as const,
    timestamp: new Date().toISOString(),
  },
  {
    id: "2",
    userId: "admin@demo.com",
    userEmail: "admin@demo.com",
    action: "signal.create",
    resource: "signals",
    resourceId: "signal_456",
    details: "Created BTC buy signal",
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    status: "success" as const,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "3",
    userId: "admin@demo.com",
    userEmail: "admin@demo.com",
    action: "settings.update",
    resource: "system",
    resourceId: "config_789",
    details: "Updated notification settings",
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    status: "warning" as const,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
];

export default function AdminLogs() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  // Simulate loading state
  const [isLoading] = useState(false);

  // Filter logs based on search and filters
  const filteredLogs = MOCK_LOGS.filter(log => {
    const matchesSearch = !searchTerm || 
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    const matchesAction = actionFilter === "all" || log.action.includes(actionFilter);
    
    return matchesSearch && matchesStatus && matchesAction;
  });

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

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-72">
        <Header />
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Activity Logs</h1>
              <p className="text-muted-foreground">
                Monitor and track all administrative actions and system events
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Logs
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{MOCK_LOGS.length}</div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round((MOCK_LOGS.filter(l => l.status === 'success').length / MOCK_LOGS.length) * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Successful operations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(MOCK_LOGS.map(l => l.userId)).size}
                </div>
                <p className="text-xs text-muted-foreground">
                  Unique administrators
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Warnings</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {MOCK_LOGS.filter(l => l.status === 'warning').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requires attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background"
                >
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
                
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background"
                >
                  <option value="all">All Actions</option>
                  <option value="user">User Actions</option>
                  <option value="signal">Signal Actions</option>
                  <option value="settings">Settings</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            No logs found matching your criteria
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono text-sm">
                              {formatTimestamp(log.timestamp)}
                            </TableCell>
                            <TableCell className="font-medium">
                              {log.userEmail}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getActionIcon(log.action)}
                                <code className="text-sm bg-muted px-2 py-1 rounded">
                                  {log.action}
                                </code>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.resource}</Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {log.details}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(log.status)}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {log.ipAddress}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}