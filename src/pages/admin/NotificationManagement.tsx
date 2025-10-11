import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Bell, 
  Settings, 
  Save, 
  TestTube, 
  Send, 
  CheckCircle, 
  AlertTriangle,
  Globe,
  Key,
  Server,
  Plus,
  Eye,
  BarChart3,
  Clock,
  Filter,
  Search,
  Download,
  RefreshCw
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

interface NotificationChannel {
  id: string;
  name: string;
  type: "email" | "sms" | "push" | "telegram" | "discord";
  isEnabled: boolean;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  type: "buy_signal" | "sell_signal" | "price_alert" | "system" | "welcome" | "security";
  subject: string;
  content: string;
  variables: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationQueue {
  id: string;
  userId: string;
  channel: string;
  recipient: string;
  subject: string;
  message: string;
  status: "pending" | "processing" | "sent" | "failed" | "cancelled";
  priority: "low" | "normal" | "high" | "urgent";
  retryCount: number;
  scheduledFor: string;
  createdAt: string;
}

interface NotificationLog {
  id: string;
  queueId: string;
  userId: string;
  channel: string;
  recipient: string;
  subject: string;
  status: "pending" | "sent" | "delivered" | "failed" | "bounced";
  sentAt?: string;
  deliveredAt?: string;
  failureReason?: string;
  createdAt: string;
}

interface NotificationStats {
  totalSent: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
  failureRate: number;
  channelBreakdown: Record<string, {
    sent: number;
    delivered: number;
    failed: number;
  }>;
}

export default function NotificationManagement() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isChannelDialogOpen, setIsChannelDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isQueueDialogOpen, setIsQueueDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<NotificationChannel | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");

  const [channelForm, setChannelForm] = useState({
    name: "",
    type: "email" as const,
    config: {},
    isEnabled: true
  });

  const [templateForm, setTemplateForm] = useState({
    name: "",
    type: "buy_signal" as const,
    subject: "",
    content: "",
    variables: [] as string[],
    isSystem: false
  });

  const [queueForm, setQueueForm] = useState({
    userId: "",
    channel: "email",
    recipient: "",
    subject: "",
    message: "",
    priority: "normal" as const,
    scheduledFor: new Date().toISOString().slice(0, 16)
  });

  const { toast } = useToast();

  // Data fetching queries
  const { data: stats, isLoading: statsLoading } = useQuery<{ stats: NotificationStats }>({
    queryKey: ["/api/admin/notifications/stats"],
    queryFn: async () => {
      const response = await apiRequest("/api/admin/notifications/stats");
      return response;
    }
  });

  const { data: channels = [], isLoading: channelsLoading } = useQuery<{ channels: NotificationChannel[] }>({
    queryKey: ["/api/admin/notifications/channels"],
    queryFn: async () => {
      const response = await apiRequest("/api/admin/notifications/channels");
      return response;
    }
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery<{ templates: NotificationTemplate[] }>({
    queryKey: ["/api/admin/notifications/templates"],
    queryFn: async () => {
      const response = await apiRequest("/api/admin/notifications/templates");
      return response;
    }
  });

  const { data: queue = [], isLoading: queueLoading } = useQuery<{ notifications: NotificationQueue[] }>({
    queryKey: ["/api/admin/notifications/queue", statusFilter],
    queryFn: async () => {
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const response = await apiRequest(`/api/admin/notifications/queue${params}`);
      return response;
    }
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery<{ logs: NotificationLog[] }>({
    queryKey: ["/api/admin/notifications/logs", channelFilter],
    queryFn: async () => {
      const params = channelFilter !== "all" ? `?channel=${channelFilter}` : "";
      const response = await apiRequest(`/api/admin/notifications/logs${params}`);
      return response;
    }
  });

  // Mutations
  const createChannelMutation = useMutation({
    mutationFn: async (channelData: any) => {
      return await apiRequest("POST", "/api/admin/notifications/channels", channelData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/channels"] });
      setIsChannelDialogOpen(false);
      resetChannelForm();
      toast({
        title: "Channel Created",
        description: "Notification channel has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create notification channel.",
        variant: "destructive",
      });
    }
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      return await apiRequest("POST", "/api/admin/notifications/templates", templateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/templates"] });
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
      toast({
        title: "Template Created",
        description: "Notification template has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create notification template.",
        variant: "destructive",
      });
    }
  });

  const addToQueueMutation = useMutation({
    mutationFn: async (queueData: any) => {
      return await apiRequest("POST", "/api/admin/notifications/queue", queueData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/queue"] });
      setIsQueueDialogOpen(false);
      resetQueueForm();
      toast({
        title: "Notification Queued",
        description: "Notification has been added to the queue successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to add notification to queue.",
        variant: "destructive",
      });
    }
  });

  const testChannelMutation = useMutation({
    mutationFn: async ({ channelId, message }: { channelId: string; message: string }) => {
      return await apiRequest("POST", `/api/admin/notifications/channels/${channelId}/test`, { message });
    },
    onSuccess: () => {
      toast({
        title: "Test Sent",
        description: "Test notification has been sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to send test notification.",
        variant: "destructive",
      });
    }
  });

  // Helper functions
  const resetChannelForm = () => {
    setChannelForm({
      name: "",
      type: "email",
      config: {},
      isEnabled: true
    });
    setSelectedChannel(null);
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: "",
      type: "buy_signal",
      subject: "",
      content: "",
      variables: [],
      isSystem: false
    });
    setSelectedTemplate(null);
  };

  const resetQueueForm = () => {
    setQueueForm({
      userId: "",
      channel: "email",
      recipient: "",
      subject: "",
      message: "",
      priority: "normal",
      scheduledFor: new Date().toISOString().slice(0, 16)
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "sent":
      case "delivered":
        return "default";
      case "pending":
      case "processing":
        return "secondary";
      case "failed":
      case "bounced":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      case "normal":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "sms":
        return <Smartphone className="h-4 w-4" />;
      case "telegram":
        return <MessageSquare className="h-4 w-4" />;
      case "discord":
        return <Globe className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50" data-testid="notification-management-page">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-6 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Notification Management
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage notification channels, templates, queues, and monitor delivery statistics
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview" data-testid="tab-overview">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="channels" data-testid="tab-channels">
                  <Settings className="h-4 w-4 mr-2" />
                  Channels
                </TabsTrigger>
                <TabsTrigger value="templates" data-testid="tab-templates">
                  <Key className="h-4 w-4 mr-2" />
                  Templates
                </TabsTrigger>
                <TabsTrigger value="queue" data-testid="tab-queue">
                  <Clock className="h-4 w-4 mr-2" />
                  Queue
                </TabsTrigger>
                <TabsTrigger value="logs" data-testid="tab-logs">
                  <Eye className="h-4 w-4 mr-2" />
                  Logs
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                      <Send className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {statsLoading ? "..." : stats?.stats?.totalSent || 0}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {statsLoading ? "..." : stats?.stats?.delivered || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {statsLoading ? "" : `${stats?.stats?.deliveryRate?.toFixed(1) || 0}% delivery rate`}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Failed</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {statsLoading ? "..." : stats?.stats?.failed || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {statsLoading ? "" : `${stats?.stats?.failureRate?.toFixed(1) || 0}% failure rate`}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Channels</CardTitle>
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {channelsLoading ? "..." : channels?.channels?.length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Active notification channels
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Channel Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Channel Performance</CardTitle>
                    <CardDescription>
                      Breakdown of notification performance by channel
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(stats?.stats?.channelBreakdown || {}).map(([channel, data]) => (
                          <div key={channel} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getChannelIcon(channel)}
                              <span className="capitalize">{channel}</span>
                            </div>
                            <div className="flex space-x-4 text-sm">
                              <span className="text-green-600">{data.delivered} delivered</span>
                              <span className="text-red-600">{data.failed} failed</span>
                              <span className="text-muted-foreground">{data.sent} total</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Channels Tab */}
              <TabsContent value="channels" className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Notification Channels</h2>
                    <p className="text-muted-foreground">Configure and manage notification delivery channels</p>
                  </div>
                  <Dialog open={isChannelDialogOpen} onOpenChange={setIsChannelDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-create-channel">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Channel
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {selectedChannel ? "Edit Channel" : "Create Channel"}
                        </DialogTitle>
                        <DialogDescription>
                          Configure a notification channel for message delivery.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="channel-name">Channel Name</Label>
                          <Input
                            id="channel-name"
                            placeholder="My Email Channel"
                            value={channelForm.name}
                            onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
                            data-testid="input-channel-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="channel-type">Channel Type</Label>
                          <Select
                            value={channelForm.type}
                            onValueChange={(value: any) => setChannelForm({ ...channelForm, type: value })}
                          >
                            <SelectTrigger data-testid="select-channel-type">
                              <SelectValue placeholder="Select channel type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="sms">SMS</SelectItem>
                              <SelectItem value="telegram">Telegram</SelectItem>
                              <SelectItem value="discord">Discord</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="channel-enabled"
                            checked={channelForm.isEnabled}
                            onCheckedChange={(checked) => setChannelForm({ ...channelForm, isEnabled: checked })}
                            data-testid="switch-channel-enabled"
                          />
                          <Label htmlFor="channel-enabled">Enabled</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsChannelDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={() => createChannelMutation.mutate(channelForm)}
                          disabled={createChannelMutation.isPending}
                          data-testid="button-save-channel"
                        >
                          {createChannelMutation.isPending ? "Creating..." : selectedChannel ? "Update" : "Create"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card>
                  <CardContent className="p-0">
                    {channelsLoading ? (
                      <div className="p-6 space-y-4">
                        {Array.from({ length: 3 }, (_, i) => (
                          <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                        ))}
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Channel</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(channels?.channels || []).map((channel) => (
                            <TableRow key={channel.id}>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {getChannelIcon(channel.type)}
                                  <span className="font-medium">{channel.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {channel.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={channel.isEnabled ? "default" : "secondary"}>
                                  {channel.isEnabled ? "Enabled" : "Disabled"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(channel.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => testChannelMutation.mutate({ 
                                      channelId: channel.id, 
                                      message: "Test notification from admin panel" 
                                    })}
                                    disabled={testChannelMutation.isPending}
                                    data-testid={`button-test-channel-${channel.id}`}
                                  >
                                    <TestTube className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Templates Tab */}
              <TabsContent value="templates" className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Notification Templates</h2>
                    <p className="text-muted-foreground">Create and manage reusable notification templates</p>
                  </div>
                  <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-create-template">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Template
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {selectedTemplate ? "Edit Template" : "Create Template"}
                        </DialogTitle>
                        <DialogDescription>
                          Create a reusable notification template with dynamic variables.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="template-name">Template Name</Label>
                          <Input
                            id="template-name"
                            placeholder="Welcome Email Template"
                            value={templateForm.name}
                            onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                            data-testid="input-template-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="template-type">Template Type</Label>
                          <Select
                            value={templateForm.type}
                            onValueChange={(value: any) => setTemplateForm({ ...templateForm, type: value })}
                          >
                            <SelectTrigger data-testid="select-template-type">
                              <SelectValue placeholder="Select template type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="buy_signal">Buy Signal</SelectItem>
                              <SelectItem value="sell_signal">Sell Signal</SelectItem>
                              <SelectItem value="price_alert">Price Alert</SelectItem>
                              <SelectItem value="system">System</SelectItem>
                              <SelectItem value="welcome">Welcome</SelectItem>
                              <SelectItem value="security">Security</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="template-subject">Subject</Label>
                          <Input
                            id="template-subject"
                            placeholder="Trading Signal Alert: {{symbol}}"
                            value={templateForm.subject}
                            onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                            data-testid="input-template-subject"
                          />
                        </div>
                        <div>
                          <Label htmlFor="template-content">Content</Label>
                          <Textarea
                            id="template-content"
                            placeholder="Your trading signal for {{symbol}} is ready..."
                            rows={6}
                            value={templateForm.content}
                            onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                            data-testid="textarea-template-content"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="template-system"
                            checked={templateForm.isSystem}
                            onCheckedChange={(checked) => setTemplateForm({ ...templateForm, isSystem: checked })}
                            data-testid="switch-template-system"
                          />
                          <Label htmlFor="template-system">System Template (Cannot be deleted)</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={() => createTemplateMutation.mutate(templateForm)}
                          disabled={createTemplateMutation.isPending}
                          data-testid="button-save-template"
                        >
                          {createTemplateMutation.isPending ? "Creating..." : selectedTemplate ? "Update" : "Create"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card>
                  <CardContent className="p-0">
                    {templatesLoading ? (
                      <div className="p-6 space-y-4">
                        {Array.from({ length: 3 }, (_, i) => (
                          <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                        ))}
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Template</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>System</TableHead>
                            <TableHead>Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(templates?.templates || []).map((template) => (
                            <TableRow key={template.id}>
                              <TableCell>
                                <span className="font-medium">{template.name}</span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {template.type.replace("_", " ")}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {template.subject}
                              </TableCell>
                              <TableCell>
                                <Badge variant={template.isSystem ? "default" : "secondary"}>
                                  {template.isSystem ? "System" : "Custom"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(template.createdAt).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Queue Tab */}
              <TabsContent value="queue" className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Notification Queue</h2>
                    <p className="text-muted-foreground">Monitor and manage queued notifications</p>
                  </div>
                  <div className="flex space-x-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40" data-testid="select-status-filter">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Dialog open={isQueueDialogOpen} onOpenChange={setIsQueueDialogOpen}>
                      <DialogTrigger asChild>
                        <Button data-testid="button-add-to-queue">
                          <Plus className="h-4 w-4 mr-2" />
                          Add to Queue
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Add Notification to Queue</DialogTitle>
                          <DialogDescription>
                            Manually add a notification to the processing queue.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="queue-userId">User ID</Label>
                            <Input
                              id="queue-userId"
                              placeholder="User UUID"
                              value={queueForm.userId}
                              onChange={(e) => setQueueForm({ ...queueForm, userId: e.target.value })}
                              data-testid="input-queue-userId"
                            />
                          </div>
                          <div>
                            <Label htmlFor="queue-channel">Channel</Label>
                            <Select
                              value={queueForm.channel}
                              onValueChange={(value) => setQueueForm({ ...queueForm, channel: value })}
                            >
                              <SelectTrigger data-testid="select-queue-channel">
                                <SelectValue placeholder="Select channel" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="sms">SMS</SelectItem>
                                <SelectItem value="push">Push</SelectItem>
                                <SelectItem value="telegram">Telegram</SelectItem>
                                <SelectItem value="discord">Discord</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="queue-recipient">Recipient</Label>
                            <Input
                              id="queue-recipient"
                              placeholder="email@example.com or +1234567890"
                              value={queueForm.recipient}
                              onChange={(e) => setQueueForm({ ...queueForm, recipient: e.target.value })}
                              data-testid="input-queue-recipient"
                            />
                          </div>
                          <div>
                            <Label htmlFor="queue-subject">Subject</Label>
                            <Input
                              id="queue-subject"
                              placeholder="Notification subject"
                              value={queueForm.subject}
                              onChange={(e) => setQueueForm({ ...queueForm, subject: e.target.value })}
                              data-testid="input-queue-subject"
                            />
                          </div>
                          <div>
                            <Label htmlFor="queue-message">Message</Label>
                            <Textarea
                              id="queue-message"
                              placeholder="Notification message content"
                              rows={4}
                              value={queueForm.message}
                              onChange={(e) => setQueueForm({ ...queueForm, message: e.target.value })}
                              data-testid="textarea-queue-message"
                            />
                          </div>
                          <div>
                            <Label htmlFor="queue-priority">Priority</Label>
                            <Select
                              value={queueForm.priority}
                              onValueChange={(value: any) => setQueueForm({ ...queueForm, priority: value })}
                            >
                              <SelectTrigger data-testid="select-queue-priority">
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsQueueDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button
                            onClick={() => addToQueueMutation.mutate(queueForm)}
                            disabled={addToQueueMutation.isPending}
                            data-testid="button-save-queue"
                          >
                            {addToQueueMutation.isPending ? "Adding..." : "Add to Queue"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <Card>
                  <CardContent className="p-0">
                    {queueLoading ? (
                      <div className="p-6 space-y-4">
                        {Array.from({ length: 5 }, (_, i) => (
                          <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                        ))}
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Recipient</TableHead>
                            <TableHead>Channel</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Scheduled</TableHead>
                            <TableHead>Retries</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(queue?.notifications || []).map((notification) => (
                            <TableRow key={notification.id}>
                              <TableCell className="max-w-xs truncate">
                                {notification.recipient}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  {getChannelIcon(notification.channel)}
                                  <span className="capitalize">{notification.channel}</span>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {notification.subject}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getPriorityBadgeVariant(notification.priority)}>
                                  {notification.priority}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(notification.status)}>
                                  {notification.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(notification.scheduledFor).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <span className={notification.retryCount > 0 ? "text-yellow-600" : ""}>
                                  {notification.retryCount}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Logs Tab */}
              <TabsContent value="logs" className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Notification Logs</h2>
                    <p className="text-muted-foreground">View detailed notification delivery logs</p>
                  </div>
                  <div className="flex space-x-2">
                    <Select value={channelFilter} onValueChange={setChannelFilter}>
                      <SelectTrigger className="w-40" data-testid="select-channel-filter">
                        <SelectValue placeholder="Filter by channel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Channels</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="push">Push</SelectItem>
                        <SelectItem value="telegram">Telegram</SelectItem>
                        <SelectItem value="discord">Discord</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" data-testid="button-refresh-logs">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Card>
                  <CardContent className="p-0">
                    {logsLoading ? (
                      <div className="p-6 space-y-4">
                        {Array.from({ length: 5 }, (_, i) => (
                          <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                        ))}
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Recipient</TableHead>
                            <TableHead>Channel</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Sent At</TableHead>
                            <TableHead>Delivered At</TableHead>
                            <TableHead>Failure Reason</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(logs?.logs || []).map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="max-w-xs truncate">
                                {log.recipient}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  {getChannelIcon(log.channel)}
                                  <span className="capitalize">{log.channel}</span>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {log.subject}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(log.status)}>
                                  {log.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {log.sentAt ? new Date(log.sentAt).toLocaleString() : "-"}
                              </TableCell>
                              <TableCell>
                                {log.deliveredAt ? new Date(log.deliveredAt).toLocaleString() : "-"}
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {log.failureReason || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}