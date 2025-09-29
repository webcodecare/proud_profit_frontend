import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Mail, 
  MessageSquare, 
  Bell, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock,
  Users,
  Settings,
  Plus,
  Edit,
  Trash2
} from "lucide-react";

interface NotificationConfig {
  id: string;
  type: "email" | "sms" | "push";
  isEnabled: boolean;
  settings: {
    apiKey?: string;
    sender?: string;
    template?: string;
  };
  totalSent: number;
  lastSentAt?: string;
}

interface NotificationQueue {
  id: string;
  type: "email" | "sms" | "push";
  recipient: string;
  subject: string;
  message: string;
  status: "pending" | "sent" | "failed";
  attempts: number;
  createdAt: string;
  sentAt?: string;
  error?: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  type: "email" | "sms" | "push";
  subject: string;
  content: string;
  variables: string[];
  isActive: boolean;
}

export default function AdminNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<"queue" | "processor" | "config" | "templates">("queue");

  // Fetch notification configurations
  const { data: configs, isLoading: isLoadingConfigs } = useQuery({
    queryKey: ["/api/admin/notification-configs"],
    queryFn: async () => {
      const response = await apiRequest("/api/admin/notification-configs");
      return response as NotificationConfig[];
    }
  });

  // Fetch notification queue
  const { data: queue, isLoading: isLoadingQueue } = useQuery({
    queryKey: ["/api/admin/notification-queue"],
    queryFn: async () => {
      const response = await apiRequest("/api/admin/notification-queue");
      return response as NotificationQueue[];
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Fetch notification queue stats
  const { data: queueStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/admin/notification-queue/stats"],
    queryFn: async () => {
      const response = await apiRequest("/api/admin/notification-queue/stats");
      return response;
    },
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Fetch processor status
  const { data: processorStatus, isLoading: isLoadingProcessor } = useQuery({
    queryKey: ["/api/admin/notification-processor/status"],
    queryFn: async () => {
      const response = await apiRequest("/api/admin/notification-processor/status");
      return response;
    },
    refetchInterval: 15000 // Refresh every 15 seconds
  });

  // Fetch notification templates
  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["/api/admin/notification-templates"],
    queryFn: async () => {
      const response = await apiRequest("/api/admin/notification-templates");
      return response as NotificationTemplate[];
    }
  });

  // Toggle notification config mutation
  const toggleConfigMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      await apiRequest(`/api/admin/notification-configs/${id}/toggle`, {
        method: "PATCH",
        body: JSON.stringify({ enabled })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notification-configs"] });
      toast({
        title: "Success",
        description: "Notification configuration updated"
      });
    }
  });

  // Retry failed notification mutation
  const retryNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest(`/api/admin/notifications/${notificationId}/retry`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notification-queue"] });
      toast({
        title: "Success",
        description: "Notification retry initiated"
      });
    }
  });

  // Send test notification mutation
  const sendTestMutation = useMutation({
    mutationFn: async ({ type, recipient }: { type: string; recipient: string }) => {
      await apiRequest("/api/admin/notifications/test", {
        method: "POST",
        body: JSON.stringify({ type, recipient })
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test notification sent"
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge variant="default" className="bg-emerald-500"><CheckCircle className="w-3 h-3 mr-1" />Sent</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
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
        return <Bell className="w-4 h-4" />;
      default:
        return <Send className="w-4 h-4" />;
    }
  };

  const emailConfig = configs?.find(c => c.type === "email");
  const smsConfig = configs?.find(c => c.type === "sms");
  const pushConfig = configs?.find(c => c.type === "push");

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar className="hidden lg:block lg:w-64" />
        
        {/* Main Content */}
        <div className="flex-1 lg:ml-64">
          {/* Header */}
          <Header 
            title="Notification System" 
            subtitle="Manage email, SMS, and push notification delivery"
          />
          
          {/* Page Content */}
          <main className="p-4 lg:p-6">
            <div className="space-y-6">

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Enabled</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={emailConfig?.isEnabled ? "default" : "secondary"}>
                {emailConfig?.isEnabled ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS Enabled</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={smsConfig?.isEnabled ? "default" : "secondary"}>
                {smsConfig?.isEnabled ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Push Enabled</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={pushConfig?.isEnabled ? "default" : "secondary"}>
                {pushConfig?.isEnabled ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Size</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {queue?.filter(n => n.status === "pending").length || 0}
            </div>
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
          variant={selectedTab === "config" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSelectedTab("config")}
        >
          <Settings className="w-4 h-4 mr-2" />
          Configuration
        </Button>
        <Button
          variant={selectedTab === "templates" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSelectedTab("templates")}
        >
          <Edit className="w-4 h-4 mr-2" />
          Templates
        </Button>
      </div>

      {/* Notification Queue Tab */}
      {selectedTab === "queue" && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Queue</CardTitle>
            <p className="text-sm text-muted-foreground">Monitor notification delivery status</p>
          </CardHeader>
          <CardContent>
            {isLoadingQueue ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue?.slice(0, 20).map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(notification.type)}
                          <span className="capitalize">{notification.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{notification.recipient}</TableCell>
                      <TableCell className="max-w-xs truncate">{notification.subject}</TableCell>
                      <TableCell>{getStatusBadge(notification.status)}</TableCell>
                      <TableCell>{notification.attempts}</TableCell>
                      <TableCell>{new Date(notification.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        {notification.status === "failed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => retryNotificationMutation.mutate(notification.id)}
                            disabled={retryNotificationMutation.isPending}
                          >
                            Retry
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!queue || queue.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No notifications in queue
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Configuration Tab */}
      {selectedTab === "config" && (
        <div className="space-y-6">
          {/* Email Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <CardTitle>Email Configuration</CardTitle>
                </div>
                <Switch
                  checked={emailConfig?.isEnabled || false}
                  onCheckedChange={(enabled) => 
                    emailConfig && toggleConfigMutation.mutate({ id: emailConfig.id, enabled })
                  }
                  disabled={toggleConfigMutation.isPending}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>SMTP Server</Label>
                  <Input defaultValue="smtp.sendgrid.net" />
                </div>
                <div>
                  <Label>Port</Label>
                  <Input defaultValue="587" />
                </div>
                <div>
                  <Label>Username</Label>
                  <Input defaultValue="apikey" />
                </div>
                <div>
                  <Label>API Key</Label>
                  <Input type="password" placeholder="sg.xxx" />
                </div>
                <div>
                  <Label>From Email</Label>
                  <Input defaultValue="alerts@cryptostrategy.pro" />
                </div>
                <div>
                  <Label>From Name</Label>
                  <Input defaultValue="Proud Profits" />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline">Save Changes</Button>
                <Button 
                  variant="outline" 
                  onClick={() => sendTestMutation.mutate({ type: "email", recipient: "test@example.com" })}
                  disabled={sendTestMutation.isPending}
                >
                  Send Test Email
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SMS Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <CardTitle>SMS Configuration (Twilio)</CardTitle>
                </div>
                <Switch
                  checked={smsConfig?.isEnabled || false}
                  onCheckedChange={(enabled) => 
                    smsConfig && toggleConfigMutation.mutate({ id: smsConfig.id, enabled })
                  }
                  disabled={toggleConfigMutation.isPending}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Account SID</Label>
                  <Input type="password" placeholder="ACxxxxxxxxxx" />
                </div>
                <div>
                  <Label>Auth Token</Label>
                  <Input type="password" placeholder="xxxxxxxxxx" />
                </div>
                <div>
                  <Label>From Phone Number</Label>
                  <Input defaultValue="+1234567890" />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline">Save Changes</Button>
                <Button 
                  variant="outline"
                  onClick={() => sendTestMutation.mutate({ type: "sms", recipient: "+1234567890" })}
                  disabled={sendTestMutation.isPending}
                >
                  Send Test SMS
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Push Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <CardTitle>Push Notification Configuration</CardTitle>
                </div>
                <Switch
                  checked={pushConfig?.isEnabled || false}
                  onCheckedChange={(enabled) => 
                    pushConfig && toggleConfigMutation.mutate({ id: pushConfig.id, enabled })
                  }
                  disabled={toggleConfigMutation.isPending}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>VAPID Public Key</Label>
                  <Input type="password" placeholder="BK..." />
                </div>
                <div>
                  <Label>VAPID Private Key</Label>
                  <Input type="password" placeholder="..." />
                </div>
                <div>
                  <Label>Subject</Label>
                  <Input defaultValue="mailto:admin@cryptostrategy.pro" />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline">Save Changes</Button>
                <Button variant="outline">Send Test Push</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Templates Tab */}
      {selectedTab === "templates" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Notification Templates</CardTitle>
                <p className="text-sm text-muted-foreground">Manage message templates for different notification types</p>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Template
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingTemplates ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Variables</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates?.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(template.type)}
                          <span className="capitalize">{template.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{template.subject}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.slice(0, 3).map((variable) => (
                            <Badge key={variable} variant="outline" className="text-xs">
                              {variable}
                            </Badge>
                          ))}
                          {template.variables.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.variables.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!templates || templates.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No notification templates found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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