import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  MessageSquare,
  Bell,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Database,
  Activity,
  Beaker
} from "lucide-react";
import { createTestNotifications, createTestChannels } from "@/utils/createTestNotifications";

interface NotificationQueueItem {
  id: string;
  user_id: string;
  alert_id?: string;
  channel: "email" | "sms" | "push" | "telegram" | "discord";
  recipient: string;
  subject?: string;
  message: string;
  status: "pending" | "processing" | "sent" | "delivered" | "failed" | "cancelled";
  priority: number;
  current_attempts: number;
  max_retries: number;
  last_error?: string;
  scheduled_for: string;
  sent_at?: string;
  created_at: string;
}

interface NotificationChannel {
  id: string;
  name: string;
  type: "email" | "sms" | "push" | "telegram" | "discord";
  is_enabled: boolean;
  is_healthy: boolean;
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  created_at: string;
}

export default function AdminNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<"queue" | "channels">("queue");
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isCreatingTestData, setIsCreatingTestData] = useState(false);

  // Fetch notification queue from Supabase
  const { data: notificationQueue, isLoading: isLoadingQueue, refetch: refetchQueue } = useQuery({
    queryKey: ["notification-queue-supabase"],
    queryFn: async () => {
      if (!supabase) {
        throw new Error("Supabase not configured");
      }

      const { data, error } = await supabase
        .from('notification_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error("Supabase query error:", error);
        throw error;
      }

      console.log("📊 Fetched", data?.length || 0, "notifications from queue");
      return data as NotificationQueueItem[];
    },
    refetchInterval: 10000 // Refresh every 10 seconds as backup
  });

  // Fetch notification channels from Supabase
  const { data: notificationChannels, isLoading: isLoadingChannels, refetch: refetchChannels } = useQuery({
    queryKey: ["notification-channels-supabase"],
    queryFn: async () => {
      if (!supabase) {
        throw new Error("Supabase not configured");
      }

      const { data, error } = await supabase
        .from('notification_channels')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase query error:", error);
        throw error;
      }

      console.log("📊 Fetched", data?.length || 0, "notification channels");
      return data as NotificationChannel[];
    },
  });

  // Supabase Real-time subscriptions for notification queue and channels
  useEffect(() => {
    if (!supabase) {
      console.log("Supabase not configured, skipping real-time subscription");
      return;
    }

    console.log("🔔 Setting up Supabase real-time subscriptions for notifications");

    const channel = supabase
      .channel('notifications-admin')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification_queue'
        },
        (payload) => {
          console.log('🔔 Real-time notification queue update:', payload);
          refetchQueue();
          
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new as NotificationQueueItem;
            toast({
              title: "🔔 New Notification Queued",
              description: `${newNotif.channel.toUpperCase()} to ${newNotif.recipient}`,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification_channels'
        },
        (payload) => {
          console.log('🔔 Real-time notification channels update:', payload);
          refetchChannels();
          
          if (payload.eventType === 'UPDATE') {
            const channel = payload.new as NotificationChannel;
            toast({
              title: "🔔 Channel Updated",
              description: `${channel.name} status changed`,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
        setRealtimeConnected(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          toast({
            title: "✅ Live Updates Connected",
            description: "Real-time notification monitoring is active",
          });
        }
      });

    return () => {
      console.log('🔌 Cleaning up Supabase real-time subscription');
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [toast, refetchQueue, refetchChannels]);

  // Retry failed notification mutation
  const retryNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!supabase) {
        throw new Error("Supabase not configured");
      }

      const { error } = await supabase
        .from('notification_queue')
        .update({ 
          status: 'pending',
          current_attempts: 0,
          last_error: null
        })
        .eq('id', notificationId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      refetchQueue();
      toast({
        title: "✅ Success",
        description: "Notification retry initiated"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Toggle channel status mutation
  const toggleChannelMutation = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      if (!supabase) {
        throw new Error("Supabase not configured");
      }

      const { error } = await supabase
        .from('notification_channels')
        .update({ is_enabled })
        .eq('id', id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      refetchChannels();
      toast({
        title: "✅ Updated",
        description: "Channel status updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
      case "delivered":
        return (
          <Badge variant="default" className="bg-emerald-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case "pending":
      case "processing":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="w-4 h-4" />;
      case "sms":
        return <MessageSquare className="w-4 h-4" />;
      case "push":
      case "telegram":
      case "discord":
        return <Bell className="w-4 h-4" />;
      default:
        return <Send className="w-4 h-4" />;
    }
  };

  // Calculate stats
  const stats = {
    totalQueued: notificationQueue?.length || 0,
    pending: notificationQueue?.filter(n => n.status === "pending").length || 0,
    sent: notificationQueue?.filter(n => n.status === "sent" || n.status === "delivered").length || 0,
    failed: notificationQueue?.filter(n => n.status === "failed").length || 0,
    activeChannels: notificationChannels?.filter(c => c.is_enabled).length || 0,
  };

  // Filter notifications
  const filteredQueue = filterStatus === "all" 
    ? notificationQueue 
    : notificationQueue?.filter(n => n.status === filterStatus);

  // Handler to create test data
  const handleCreateTestData = async () => {
    setIsCreatingTestData(true);
    try {
      const [notifResult, channelResult] = await Promise.all([
        createTestNotifications(),
        createTestChannels()
      ]);

      if (notifResult.success && channelResult.success) {
        toast({
          title: "Test Data Created",
          description: `Created ${notifResult.count} notifications and ${channelResult.count} channels`,
        });
        
        // Refresh the data
        refetchQueue();
        refetchChannels();
      } else {
        toast({
          title: "Error Creating Test Data",
          description: notifResult.error || channelResult.error || "Unknown error",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive"
      });
    } finally {
      setIsCreatingTestData(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 overflow-x-hidden">
      <div className="flex">
        <Sidebar className="hidden lg:block lg:w-64" />

        <div className="flex-1 lg:ml-64 overflow-x-hidden">
          <div className="bg-card border-b border-border p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold">Notification System</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-xs md:text-sm text-muted-foreground">Real-time notification queue monitoring</p>
                  {realtimeConnected && (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      <Bell className="w-3 h-3 mr-1" />
                      Live
                    </Badge>
                  )}
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                    <Database className="w-3 h-3 mr-1" />
                    Supabase
                  </Badge>
                </div>
              </div>
              <Button 
                onClick={handleCreateTestData}
                disabled={isCreatingTestData}
                variant="outline"
                className="flex items-center justify-center gap-2 w-full md:w-auto"
              >
                <Beaker className="w-4 h-4" />
                {isCreatingTestData ? "Creating..." : "Create Test Data"}
              </Button>
            </div>
          </div>

          <main className="p-4 lg:p-6">
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Queued</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalQueued}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    <Clock className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sent</CardTitle>
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">{stats.sent}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Failed</CardTitle>
                    <XCircle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Channels</CardTitle>
                    <Bell className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{stats.activeChannels}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Tab Navigation */}
              <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
                <Button
                  variant={selectedTab === "queue" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedTab("queue")}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Queue
                </Button>
                <Button
                  variant={selectedTab === "channels" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedTab("channels")}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Channels
                </Button>
              </div>

              {/* API Configuration Display */}
              <Card>
                <CardHeader>
                  <CardTitle>🔧 Notification API Configuration</CardTitle>
                  <CardDescription>Active notification service credentials</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    

                  

                    <div className="p-4 bg-gray-700 dark:bg-orange-950 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Bell className="w-5 h-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-900 dark:text-orange-100">Browser Push</h3>
                      </div>
                      <div className="text-sm space-y-1">
                        <p><strong>Status:</strong> {Notification?.permission || 'Not supported'}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-1"
                          onClick={async () => {
                            if ('Notification' in window) {
                              const permission = await Notification.requestPermission();
                              toast({
                                title: permission === 'granted' ? '✅ Permission Granted' : '❌ Permission Denied',
                                description: permission === 'granted' ? 'Push notifications enabled' : 'Please enable in browser settings'
                              });
                            }
                          }}
                        >
                          Enable Push
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-gray-700 dark:bg-gray-900 rounded-lg">
                    <h4 className="font-semibold mb-3">🧪 Test All Notification Channels</h4>
                    <p className="text-sm text-muted-foreground mb-4">Test each notification channel individually</p>
                    
                    <div className="space-y-4">
                   

                      {/* Push Notification Test */}
                      <div className="p-3 bg-gray-700 dark:bg-orange-950/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Bell className="w-4 h-4 text-gray-600" />
                          <h5 className="font-medium">Browser Push Notification</h5>
                        </div>
                        <Button
                          size="sm"
                          className="w-full bg-gray-600 hover:bg-gray-700"
                          onClick={async () => {
                            if (!('Notification' in window)) {
                              toast({ title: '❌ Not Supported', description: 'Browser does not support notifications', variant: 'destructive' });
                              return;
                            }

                            let permission = Notification.permission;
                            
                            if (permission === 'default') {
                              permission = await Notification.requestPermission();
                            }

                            if (permission === 'granted') {
                              new Notification('🟢 BUY Signal Alert', {
                                body: 'BTCUSDT at $45000 (1H)\n\n✅ Your push notifications are working!',
                                icon: '/logo.png',
                                badge: '/logo.png',
                                tag: 'test-notification',
                                requireInteraction: true
                              });
                              toast({ 
                                title: '✅ Push Sent!', 
                                description: 'Look at the TOP-RIGHT corner of your browser!',
                              });
                            } else {
                              toast({ 
                                title: '❌ Permission Denied', 
                                description: 'Enable notifications in browser settings',
                                variant: 'destructive'
                              });
                            }
                          }}
                        >
                          Test Push (Look at browser top-right corner)
                        </Button>
                      </div>

                      {/* SMS Test */}
                      <div className="p-3 bg-gray-400 dark:bg-green-950/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-gray-600" />
                          <h5 className="font-medium">SMS (Twilio)</h5>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            id="testPhone"
                            placeholder="+1234567890 (US/Canada only)"
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            className="bg-gray-600 hover:bg-gray-700"
                            onClick={async () => {
                              const phone = (document.getElementById('testPhone') as HTMLInputElement)?.value;
                              if (!phone) {
                                toast({ title: '❌ Error', description: 'Enter phone number', variant: 'destructive' });
                                return;
                              }

                              toast({ title: '📱 Sending...', description: 'Sending test SMS' });

                              try {
                              

                                if (response.ok) {
                                  const data = await response.json();
                                  toast({ 
                                    title: '✅ SMS Sent!', 
                                    description: `Status: ${data.status}`,
                                  });
                                } else {
                                  const error = await response.json();
                                  toast({ 
                                    title: '❌ SMS Failed', 
                                    description: error.message || 'Failed to send',
                                    variant: 'destructive'
                                  });
                                }
                              } catch (error: any) {
                                toast({ 
                                  title: '❌ Error', 
                                  description: error.message,
                                  variant: 'destructive'
                                });
                              }
                            }}
                          >
                            Test
                          </Button>
                        </div>
                        <p className="text-xs text-yellow-600 mt-1">
                          ⚠️ Only works for US/Canada numbers
                        </p>
                      </div>

                      {/* Email Test */}
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4 text-blue-600" />
                          <h5 className="font-medium">Email (SMTP)</h5>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            id="testEmail"
                            placeholder="your@email.com"
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                              const email = (document.getElementById('testEmail') as HTMLInputElement)?.value;
                              if (!email) {
                                toast({ title: '❌ Error', description: 'Enter email address', variant: 'destructive' });
                                return;
                              }
                              
                              toast({ 
                                title: '⚠️ Email Unavailable', 
                                description: 'Browser cannot send SMTP emails. Need backend server.',
                                variant: 'destructive'
                              });
                            }}
                          >
                            Test
                          </Button>
                        </div>
                        <p className="text-xs text-yellow-600 mt-1">
                          ⚠️ Requires backend server (currently offline)
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                      <p className="text-sm">
                        <strong>💡 Quick Status:</strong>
                      </p>
                     
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Queue Tab */}
              {selectedTab === "queue" && (
                <Card>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle>Notification Queue</CardTitle>
                        <CardDescription>Monitor notification delivery status in real-time</CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => refetchQueue()}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingQueue ? (
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : (
                      <div className="overflow-x-auto -mx-4 md:mx-0">
                        <div className="inline-block min-w-full align-middle">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Channel</TableHead>
                              <TableHead>Recipient</TableHead>
                              <TableHead>Message</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Priority</TableHead>
                              <TableHead>Attempts</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredQueue?.slice(0, 50).map((notification) => (
                              <TableRow key={notification.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getTypeIcon(notification.channel)}
                                    <span className="capitalize">{notification.channel}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono text-sm max-w-xs truncate">
                                  {notification.recipient}
                                </TableCell>
                                <TableCell className="max-w-md truncate text-sm">
                                  {notification.subject && <strong>{notification.subject}: </strong>}
                                  {notification.message}
                                </TableCell>
                                <TableCell>{getStatusBadge(notification.status)}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{notification.priority}</Badge>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {notification.current_attempts}/{notification.max_retries}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {new Date(notification.created_at).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  {notification.status === "failed" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => retryNotificationMutation.mutate(notification.id)}
                                      disabled={retryNotificationMutation.isPending}
                                    >
                                      <RefreshCw className="w-3 h-3 mr-1" />
                                      Retry
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                            {(!filteredQueue || filteredQueue.length === 0) && (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                  No notifications in queue. Notifications will appear here when created.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Channels Tab */}
              {selectedTab === "channels" && (
                <Card>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle>Notification Channels</CardTitle>
                        <CardDescription>Manage notification delivery channels</CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => refetchChannels()}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingChannels ? (
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : (
                      <div className="overflow-x-auto -mx-4 md:mx-0">
                        <div className="inline-block min-w-full align-middle">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Channel</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Health</TableHead>
                              <TableHead>Sent</TableHead>
                              <TableHead>Delivered</TableHead>
                              <TableHead>Failed</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {notificationChannels?.map((channel) => (
                              <TableRow key={channel.id}>
                                <TableCell className="font-medium">{channel.name}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getTypeIcon(channel.type)}
                                    <span className="capitalize">{channel.type}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={channel.is_enabled}
                                      onCheckedChange={(checked) => 
                                        toggleChannelMutation.mutate({ id: channel.id, is_enabled: checked })
                                      }
                                    />
                                    <Badge variant={channel.is_enabled ? "default" : "secondary"} className={channel.is_enabled ? "bg-emerald-500" : ""}>
                                      {channel.is_enabled ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={channel.is_healthy ? "default" : "destructive"} className={channel.is_healthy ? "bg-emerald-500" : ""}>
                                    {channel.is_healthy ? "Healthy" : "Unhealthy"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono">{channel.total_sent.toLocaleString()}</TableCell>
                                <TableCell className="font-mono text-emerald-600">{channel.total_delivered.toLocaleString()}</TableCell>
                                <TableCell className="font-mono text-red-600">{channel.total_failed.toLocaleString()}</TableCell>
                                <TableCell>
                                  <Button variant="outline" size="sm">
                                    Configure
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            {(!notificationChannels || notificationChannels.length === 0) && (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                  No notification channels configured yet.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
