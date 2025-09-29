import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Server
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

interface NotificationChannel {
  id: string;
  type: "email" | "sms" | "telegram" | "discord" | "webhook";
  name: string;
  isEnabled: boolean;
  configuration: Record<string, any>;
  lastTested?: string;
  status: "active" | "inactive" | "error";
}

interface NotificationTemplate {
  id: string;
  name: string;
  type: "signal_alert" | "price_alert" | "system_notification";
  subject?: string;
  content: string;
  isActive: boolean;
  channels: string[];
}

export default function AdminNotificationSetup() {
  const [activeTab, setActiveTab] = useState("channels");
  const [selectedChannel, setSelectedChannel] = useState<NotificationChannel | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [isChannelDialogOpen, setIsChannelDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  const [channelForm, setChannelForm] = useState({
    type: "email" as const,
    name: "",
    isEnabled: true,
    configuration: {},
  });
  const [templateForm, setTemplateForm] = useState({
    name: "",
    type: "signal_alert" as const,
    subject: "",
    content: "",
    isActive: true,
    channels: [] as string[],
  });
  const { toast } = useToast();

  const { data: channels = [], isLoading: channelsLoading } = useQuery<NotificationChannel[]>({
    queryKey: ["/api/admin/notification-channels"],
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery<NotificationTemplate[]>({
    queryKey: ["/api/admin/notification-templates"],
  });

  const createChannelMutation = useMutation({
    mutationFn: async (channelData: any) => {
      const response = await apiRequest("POST", "/api/admin/notification-channels", channelData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notification-channels"] });
      setIsChannelDialogOpen(false);
      resetChannelForm();
      toast({
        title: "Channel Created",
        description: "Notification channel has been created successfully.",
      });
    },
  });

  const updateChannelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/admin/notification-channels/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notification-channels"] });
      setIsChannelDialogOpen(false);
      setSelectedChannel(null);
      toast({
        title: "Channel Updated",
        description: "Notification channel has been updated successfully.",
      });
    },
  });

  const testChannelMutation = useMutation({
    mutationFn: async ({ channelId, message }: { channelId: string; message: string }) => {
      const response = await apiRequest("POST", `/api/admin/notification-channels/${channelId}/test`, { message });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Sent",
        description: "Test notification has been sent successfully.",
      });
    },
  });

  const resetChannelForm = () => {
    setChannelForm({
      type: "email",
      name: "",
      isEnabled: true,
      configuration: {},
    });
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: "",
      type: "signal_alert",
      subject: "",
      content: "",
      isActive: true,
      channels: [],
    });
  };

  const handleCreateChannel = () => {
    resetChannelForm();
    setSelectedChannel(null);
    setIsChannelDialogOpen(true);
  };

  const handleEditChannel = (channel: NotificationChannel) => {
    setSelectedChannel(channel);
    setChannelForm({
      type: channel.type,
      name: channel.name,
      isEnabled: channel.isEnabled,
      configuration: channel.configuration,
    });
    setIsChannelDialogOpen(true);
  };

  const handleSaveChannel = () => {
    if (selectedChannel) {
      updateChannelMutation.mutate({ id: selectedChannel.id, data: channelForm });
    } else {
      createChannelMutation.mutate(channelForm);
    }
  };

  const handleTestChannel = (channelId: string) => {
    testChannelMutation.mutate({ channelId, message: testMessage || "Test notification from Proud Profits admin panel" });
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4 text-blue-500" />;
      case "sms":
        return <Smartphone className="h-4 w-4 text-green-500" />;
      case "telegram":
        return <MessageSquare className="h-4 w-4 text-blue-400" />;
      case "discord":
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case "webhook":
        return <Globe className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const renderChannelConfiguration = () => {
    switch (channelForm.type) {
      case "email":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP Host</Label>
                <Input
                  id="smtp-host"
                  value={channelForm.configuration.host || ""}
                  onChange={(e) => setChannelForm(prev => ({
                    ...prev,
                    configuration: { ...prev.configuration, host: e.target.value }
                  }))}
                  placeholder="smtp.gmail.com"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-port">SMTP Port</Label>
                <Input
                  id="smtp-port"
                  type="number"
                  value={channelForm.configuration.port || ""}
                  onChange={(e) => setChannelForm(prev => ({
                    ...prev,
                    configuration: { ...prev.configuration, port: e.target.value }
                  }))}
                  placeholder="587"
                  className="text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-user">Username</Label>
                <Input
                  id="smtp-user"
                  value={channelForm.configuration.user || ""}
                  onChange={(e) => setChannelForm(prev => ({
                    ...prev,
                    configuration: { ...prev.configuration, user: e.target.value }
                  }))}
                  placeholder="your-email@gmail.com"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-pass">Password</Label>
                <Input
                  id="smtp-pass"
                  type="password"
                  value={channelForm.configuration.pass || ""}
                  onChange={(e) => setChannelForm(prev => ({
                    ...prev,
                    configuration: { ...prev.configuration, pass: e.target.value }
                  }))}
                  placeholder="App Password"
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        );
      case "sms":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="twilio-sid">Twilio Account SID</Label>
                <Input
                  id="twilio-sid"
                  value={channelForm.configuration.accountSid || ""}
                  onChange={(e) => setChannelForm(prev => ({
                    ...prev,
                    configuration: { ...prev.configuration, accountSid: e.target.value }
                  }))}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twilio-token">Auth Token</Label>
                <Input
                  id="twilio-token"
                  type="password"
                  value={channelForm.configuration.authToken || ""}
                  onChange={(e) => setChannelForm(prev => ({
                    ...prev,
                    configuration: { ...prev.configuration, authToken: e.target.value }
                  }))}
                  placeholder="Your Auth Token"
                  className="text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="twilio-phone">From Phone Number</Label>
              <Input
                id="twilio-phone"
                value={channelForm.configuration.fromPhone || ""}
                onChange={(e) => setChannelForm(prev => ({
                  ...prev,
                  configuration: { ...prev.configuration, fromPhone: e.target.value }
                }))}
                placeholder="+1234567890"
                className="text-sm"
              />
            </div>
          </div>
        );
      case "telegram":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="telegram-token">Bot Token</Label>
              <Input
                id="telegram-token"
                type="password"
                value={channelForm.configuration.botToken || ""}
                onChange={(e) => setChannelForm(prev => ({
                  ...prev,
                  configuration: { ...prev.configuration, botToken: e.target.value }
                }))}
                placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telegram-chat">Default Chat ID</Label>
              <Input
                id="telegram-chat"
                value={channelForm.configuration.chatId || ""}
                onChange={(e) => setChannelForm(prev => ({
                  ...prev,
                  configuration: { ...prev.configuration, chatId: e.target.value }
                }))}
                placeholder="-1001234567890"
                className="text-sm"
              />
            </div>
          </div>
        );
      case "webhook":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                value={channelForm.configuration.url || ""}
                onChange={(e) => setChannelForm(prev => ({
                  ...prev,
                  configuration: { ...prev.configuration, url: e.target.value }
                }))}
                placeholder="https://hooks.slack.com/services/..."
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-secret">Secret (optional)</Label>
              <Input
                id="webhook-secret"
                type="password"
                value={channelForm.configuration.secret || ""}
                onChange={(e) => setChannelForm(prev => ({
                  ...prev,
                  configuration: { ...prev.configuration, secret: e.target.value }
                }))}
                placeholder="Webhook secret"
                className="text-sm"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar className="hidden md:flex" />
      
      <div className="flex-1 flex flex-col overflow-hidden ml-0 md:ml-64">
        <Header 
          title="Notification Setup" 
          subtitle="Configure notification channels and message templates" 
        />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="space-y-6">

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="channels" className="text-xs sm:text-sm">Channels</TabsTrigger>
          <TabsTrigger value="templates" className="text-xs sm:text-sm">Templates</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs sm:text-sm">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg sm:text-xl font-semibold">Notification Channels</h2>
            <Button onClick={handleCreateChannel} className="w-full sm:w-auto">
              <Settings className="h-4 w-4 mr-2" />
              Add Channel
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {channelsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              channels.map((channel) => (
                <Card key={channel.id} className={!channel.isEnabled ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        {getChannelIcon(channel.type)}
                        <div>
                          <CardTitle className="text-base sm:text-lg">{channel.name}</CardTitle>
                          <CardDescription className="capitalize text-xs sm:text-sm">{channel.type} channel</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(channel.status)}
                        <Badge variant={channel.isEnabled ? "default" : "secondary"} className="text-xs">
                          {channel.isEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-xs text-muted-foreground">
                        Last tested: {channel.lastTested ? new Date(channel.lastTested).toLocaleDateString() : "Never"}
                      </div>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditChannel(channel)}
                          className="flex-1 text-xs"
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Configure
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestChannel(channel.id)}
                          disabled={testChannelMutation.isPending}
                          className="flex-1 text-xs"
                        >
                          <TestTube className="h-3 w-3 mr-1" />
                          Test
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg sm:text-xl font-semibold">Message Templates</h2>
            <Button className="w-full sm:w-auto">
              <Bell className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {templatesLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              templates.map((template) => (
                <Card key={template.id} className={!template.isActive ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base sm:text-lg">{template.name}</CardTitle>
                        <CardDescription className="capitalize text-xs sm:text-sm">{template.type.replace('_', ' ')}</CardDescription>
                      </div>
                      <Badge variant={template.isActive ? "default" : "secondary"} className="text-xs">
                        {template.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {template.subject && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Subject:</p>
                          <p className="text-xs sm:text-sm line-clamp-1">{template.subject}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Content Preview:</p>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{template.content}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Channels: {template.channels.length}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Global Notification Settings</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Configure system-wide notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Enable Notifications</Label>
                      <p className="text-xs text-muted-foreground">Master switch for all notifications</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Rate Limiting</Label>
                      <p className="text-xs text-muted-foreground">Prevent notification spam</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Queue Processing</Label>
                      <p className="text-xs text-muted-foreground">Process notifications in background</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="retry-attempts" className="text-sm">Retry Attempts</Label>
                    <Input
                      id="retry-attempts"
                      type="number"
                      defaultValue="3"
                      min="1"
                      max="10"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch-size" className="text-sm">Batch Size</Label>
                    <Input
                      id="batch-size"
                      type="number"
                      defaultValue="50"
                      min="1"
                      max="500"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="queue-interval" className="text-sm">Queue Interval (seconds)</Label>
                    <Input
                      id="queue-interval"
                      type="number"
                      defaultValue="30"
                      min="5"
                      max="300"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Notification Logs</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Recent notification delivery history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Server className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Notification logs will appear here once the system is active.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Message Input */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Test Message</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Enter a custom message for testing notification channels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Input
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter test message..."
              className="flex-1 text-sm"
            />
            <Button variant="outline" className="w-full sm:w-auto">
              <Send className="h-4 w-4 mr-2" />
              Send Test
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Channel Configuration Dialog */}
      <Dialog open={isChannelDialogOpen} onOpenChange={setIsChannelDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedChannel ? "Configure Channel" : "Add Notification Channel"}
            </DialogTitle>
            <DialogDescription>
              {selectedChannel ? "Update notification channel settings" : "Set up a new notification channel"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="channel-name">Channel Name</Label>
                <Input
                  id="channel-name"
                  value={channelForm.name}
                  onChange={(e) => setChannelForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Email Channel"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="channel-type">Channel Type</Label>
                <select
                  id="channel-type"
                  value={channelForm.type}
                  onChange={(e) => setChannelForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="telegram">Telegram</option>
                  <option value="discord">Discord</option>
                  <option value="webhook">Webhook</option>
                </select>
              </div>
            </div>
            
            {renderChannelConfiguration()}

            <div className="flex items-center space-x-2">
              <Switch
                checked={channelForm.isEnabled}
                onCheckedChange={(checked) => setChannelForm(prev => ({ ...prev, isEnabled: checked }))}
              />
              <Label className="text-sm">Enable this channel</Label>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsChannelDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSaveChannel} disabled={createChannelMutation.isPending || updateChannelMutation.isPending} className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-2" />
              {createChannelMutation.isPending || updateChannelMutation.isPending ? "Saving..." : "Save Channel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}