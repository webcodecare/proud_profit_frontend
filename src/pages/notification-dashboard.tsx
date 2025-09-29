import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tokenStorage } from '@/lib/auth';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Send,
  TrendingUp,
  AlertTriangle,
  Activity,
  Users,
  Globe,
  Zap,
  RefreshCw,
  Filter,
  Download,
  Settings
} from 'lucide-react';

interface NotificationStats {
  totalSent: number;
  deliveryRate: number;
  avgDeliveryTime: number;
  failureRate: number;
  channelBreakdown: {
    email: { sent: number; delivered: number; failed: number; };
    sms: { sent: number; delivered: number; failed: number; };
    telegram: { sent: number; delivered: number; failed: number; };
    discord: { sent: number; delivered: number; failed: number; };
  };
}

interface NotificationLog {
  id: string;
  type: 'email' | 'sms' | 'telegram' | 'discord';
  recipient: string;
  subject: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  sentAt?: string;
  deliveredAt?: string;
  failureReason?: string;
  attempts: number;
  alertType: 'buy' | 'sell' | 'price_alert' | 'system';
  ticker?: string;
  userId: string;
}

interface ChannelHealth {
  channel: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  lastFailure?: string;
  configStatus: 'configured' | 'missing_config' | 'invalid_config';
  rateLimitStatus: 'normal' | 'throttled' | 'blocked';
}

export default function NotificationDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = tokenStorage.get();
  const [selectedDateRange, setSelectedDateRange] = useState('24h');
  const [selectedChannel, setSelectedChannel] = useState('all');

  // Helper function for authenticated requests
  const authRequest = async (method: string, url: string, data?: any) => {
    if (!token) throw new Error("Authentication required");
    const response = await fetch(url, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `${response.status}: ${response.statusText}`);
    }
    return response.json();
  };

  // Fetch notification statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/notifications/stats', token, selectedDateRange],
    queryFn: () => authRequest('GET', `/api/notifications/stats?range=${selectedDateRange}`),
    enabled: !!token,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch notification logs
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['/api/notifications/logs', token, selectedChannel],
    queryFn: () => authRequest('GET', `/api/notifications/logs?channel=${selectedChannel}&limit=100`),
    enabled: !!token,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch channel health
  const { data: channelHealth = [], isLoading: healthLoading } = useQuery({
    queryKey: ['/api/notifications/health', token],
    queryFn: () => authRequest('GET', '/api/notifications/health'),
    enabled: !!token,
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Retry failed notification
  const retryNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => authRequest('POST', `/api/notifications/${notificationId}/retry`),
    onSuccess: () => {
      toast({
        title: "Notification Retry",
        description: "Notification has been queued for retry",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/logs', token] });
    },
  });

  // Test channel
  const testChannelMutation = useMutation({
    mutationFn: (channel: string) => authRequest('POST', `/api/notifications/test/${channel}`),
    onSuccess: (_, channel) => {
      toast({
        title: "Test Sent",
        description: `Test notification sent via ${channel}`,
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600';
      case 'sent': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      case 'bounced': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Smartphone className="h-4 w-4" />;
      case 'telegram': return <MessageSquare className="h-4 w-4" />;
      case 'discord': return <MessageSquare className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Healthy</Badge>;
      case 'degraded':
        return <Badge variant="outline" className="text-yellow-600"><AlertTriangle className="h-3 w-3 mr-1" />Degraded</Badge>;
      case 'down':
        return <Badge variant="outline" className="text-red-600"><XCircle className="h-3 w-3 mr-1" />Down</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Mock data for demonstration (will be replaced with real data)
  const mockStats: NotificationStats = {
    totalSent: 1247,
    deliveryRate: 94.2,
    avgDeliveryTime: 2.3,
    failureRate: 5.8,
    channelBreakdown: {
      email: { sent: 856, delivered: 812, failed: 44 },
      sms: { sent: 234, delivered: 229, failed: 5 },
      telegram: { sent: 123, delivered: 119, failed: 4 },
      discord: { sent: 34, delivered: 32, failed: 2 }
    }
  };

  const chartData = [
    { name: 'Email', sent: 856, delivered: 812, failed: 44 },
    { name: 'SMS', sent: 234, delivered: 229, failed: 5 },
    { name: 'Telegram', sent: 123, delivered: 119, failed: 4 },
    { name: 'Discord', sent: 34, delivered: 32, failed: 2 }
  ];

  const pieData = [
    { name: 'Delivered', value: 94.2, color: '#10b981' },
    { name: 'Failed', value: 5.8, color: '#ef4444' }
  ];

  const timeSeriesData = [
    { time: '00:00', email: 45, sms: 12, telegram: 8, discord: 3 },
    { time: '04:00', email: 52, sms: 18, telegram: 11, discord: 2 },
    { time: '08:00', email: 89, sms: 28, telegram: 15, discord: 5 },
    { time: '12:00', email: 134, sms: 45, telegram: 23, discord: 8 },
    { time: '16:00', email: 167, sms: 52, telegram: 28, discord: 12 },
    { time: '20:00', email: 198, sms: 41, telegram: 19, discord: 6 }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="flex">
        <Sidebar />
        
        <div className="ml-0 md:ml-64 flex-1">
          {/* Header */}
          <header className="bg-card border-b border-border p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Activity className="h-6 w-6" />
                <div>
                  <h1 className="text-2xl font-bold">Notification Dashboard</h1>
                  <p className="text-muted-foreground">Multi-channel delivery monitoring and analytics</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
                    toast({ title: "Dashboard Refreshed", description: "Latest data loaded" });
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Badge variant="outline" className="text-blue-400">
                  <Zap className="h-3 w-3 mr-1" />
                  Real-time
                </Badge>
              </div>
            </div>
          </header>

          <div className="p-6 space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Sent</p>
                      <p className="text-2xl font-bold">{stats?.totalSent || mockStats.totalSent}</p>
                    </div>
                    <Send className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+12% from yesterday</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Delivery Rate</p>
                      <p className="text-2xl font-bold">{stats?.deliveryRate || mockStats.deliveryRate}%</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <Progress value={stats?.deliveryRate || mockStats.deliveryRate} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Delivery Time</p>
                      <p className="text-2xl font-bold">{stats?.avgDeliveryTime || mockStats.avgDeliveryTime}s</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                  <div className="flex items-center mt-2">
                    <span className="text-sm text-muted-foreground">↓ 0.2s faster than average</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Failure Rate</p>
                      <p className="text-2xl font-bold">{stats?.failureRate || mockStats.failureRate}%</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                  <div className="flex items-center mt-2">
                    <span className="text-sm text-red-600">↑ 0.3% from yesterday</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Channel Health Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Channel Health Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {['email', 'sms', 'telegram', 'discord'].map((channel) => (
                    <div key={channel} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getChannelIcon(channel)}
                          <span className="font-semibold capitalize">{channel}</span>
                        </div>
                        {getHealthBadge('healthy')}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Uptime:</span>
                          <span className="font-medium">99.9%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rate Limit:</span>
                          <Badge variant="outline" className="text-green-600">Normal</Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-2"
                          onClick={() => testChannelMutation.mutate(channel)}
                          disabled={testChannelMutation.isPending}
                        >
                          Test Channel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Charts and Analytics */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="channels">By Channel</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="logs">Activity Logs</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Delivery Success Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={120}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value}%`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Channel Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="delivered" fill="#10b981" name="Delivered" />
                          <Bar dataKey="failed" fill="#ef4444" name="Failed" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>24-Hour Delivery Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="email" stroke="#3b82f6" strokeWidth={2} />
                        <Line type="monotone" dataKey="sms" stroke="#10b981" strokeWidth={2} />
                        <Line type="monotone" dataKey="telegram" stroke="#8b5cf6" strokeWidth={2} />
                        <Line type="monotone" dataKey="discord" stroke="#f59e0b" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="logs" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Recent Notification Activity</CardTitle>
                      <div className="flex items-center space-x-2">
                        <select
                          value={selectedChannel}
                          onChange={(e) => setSelectedChannel(e.target.value)}
                          className="px-3 py-1 border rounded text-sm"
                        >
                          <option value="all">All Channels</option>
                          <option value="email">Email</option>
                          <option value="sms">SMS</option>
                          <option value="telegram">Telegram</option>
                          <option value="discord">Discord</option>
                        </select>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Channel</TableHead>
                          <TableHead>Recipient</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Sent At</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Mock log entries for demonstration */}
                        {[
                          {
                            id: '1',
                            type: 'email' as const,
                            recipient: 'user@example.com',
                            subject: 'BTC Buy Signal Alert',
                            status: 'delivered' as const,
                            sentAt: '2025-01-07 22:00:15',
                            alertType: 'buy' as const,
                            ticker: 'BTCUSDT'
                          },
                          {
                            id: '2',
                            type: 'sms' as const,
                            recipient: '+1234567890',
                            subject: 'ETH Sell Signal',
                            status: 'sent' as const,
                            sentAt: '2025-01-07 21:58:42',
                            alertType: 'sell' as const,
                            ticker: 'ETHUSDT'
                          },
                          {
                            id: '3',
                            type: 'telegram' as const,
                            recipient: '123456789',
                            subject: 'Price Alert: BTC > $65,000',
                            status: 'failed' as const,
                            sentAt: '2025-01-07 21:55:12',
                            alertType: 'price_alert' as const,
                            ticker: 'BTCUSDT'
                          }
                        ].map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getChannelIcon(log.type)}
                                <span className="capitalize">{log.type}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{log.recipient}</TableCell>
                            <TableCell>{log.subject}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getStatusColor(log.status)}>
                                {log.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{log.sentAt}</TableCell>
                            <TableCell>
                              {log.status === 'failed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => retryNotificationMutation.mutate(log.id)}
                                  disabled={retryNotificationMutation.isPending}
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Retry
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}