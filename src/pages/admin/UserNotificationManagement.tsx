import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Users, 
  Send, 
  Settings, 
  Bell, 
  MessageSquare, 
  History,
  UserCheck,
  Mail,
  Phone,
  Smartphone,
  Globe,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2
} from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  subscriptionTier: string;
  lastLoginAt?: string;
}

interface UserNotification {
  id: string;
  userId: string;
  channel: string;
  subject: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  createdAt: string;
  sentAt?: string;
}

interface UserSettings {
  id: string;
  userId: string;
  notificationEmail: boolean;
  notificationSms: boolean;
  notificationPush: boolean;
  notificationTelegram: boolean;
  emailFrequency: string;
  phoneNumber?: string;
  telegramChatId?: string;
}

export default function UserNotificationManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("send");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isPreferencesDialogOpen, setIsPreferencesDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);

  const [notificationForm, setNotificationForm] = useState({
    userId: "",
    channel: "email",
    subject: "",
    message: "",
    priority: "normal",
    scheduledFor: ""
  });

  const [bulkForm, setBulkForm] = useState({
    sendToAll: false,
    userIds: [] as string[],
    criteria: {},
    channel: "email",
    subject: "",
    message: "",
    priority: "normal"
  });

  // Fetch all users
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: () => apiRequest('/api/admin/users')
  });

  const users = usersData?.users || [];

  // Fetch user notifications for selected user
  const { data: userNotifications, isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['/api/admin/users', selectedUser?.id, 'notifications'],
    queryFn: () => apiRequest(`/api/admin/users/${selectedUser?.id}/notifications`),
    enabled: !!selectedUser
  });

  // Fetch user preferences for selected user
  const { data: userPreferences, isLoading: isLoadingPreferences } = useQuery({
    queryKey: ['/api/admin/users', selectedUser?.id, 'notification-preferences'],
    queryFn: () => apiRequest(`/api/admin/users/${selectedUser?.id}/notification-preferences`),
    enabled: !!selectedUser
  });

  // Send notification to user mutation
  const sendNotificationMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest(`/api/admin/users/${data.userId}/notifications`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users', selectedUser?.id, 'notifications'] });
      setIsSendDialogOpen(false);
      setNotificationForm({
        userId: "",
        channel: "email",
        subject: "",
        message: "",
        priority: "normal",
        scheduledFor: ""
      });
      toast({
        title: "Notification Sent",
        description: "The notification has been sent successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send notification",
        variant: "destructive"
      });
    }
  });

  // Send bulk notification mutation
  const sendBulkMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('/api/admin/notifications/bulk', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: (data: any) => {
      setIsBulkDialogOpen(false);
      setBulkForm({
        sendToAll: false,
        userIds: [],
        criteria: {},
        channel: "email",
        subject: "",
        message: "",
        priority: "normal"
      });
      toast({
        title: "Bulk Notification Sent",
        description: `Successfully queued ${data.results.queued} notifications. ${data.results.failed} failed.`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send bulk notification",
        variant: "destructive"
      });
    }
  });

  // Update user preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest(`/api/admin/users/${selectedUser?.id}/notification-preferences`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users', selectedUser?.id, 'notification-preferences'] });
      setIsPreferencesDialogOpen(false);
      toast({
        title: "Preferences Updated",
        description: "User notification preferences have been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update preferences",
        variant: "destructive"
      });
    }
  });

  const handleSendNotification = () => {
    if (!selectedUser) {
      toast({
        title: "Error",
        description: "Please select a user first",
        variant: "destructive"
      });
      return;
    }

    const data = {
      ...notificationForm,
      userId: selectedUser.id
    };

    sendNotificationMutation.mutate(data);
  };

  const handleSendBulkNotification = () => {
    sendBulkMutation.mutate(bulkForm);
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Phone className="h-4 w-4" />;
      case 'push': return <Smartphone className="h-4 w-4" />;
      case 'telegram': return <MessageSquare className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-72">
        <Header />
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">User Notification Management</h1>
              <p className="text-muted-foreground">Send notifications and manage user notification preferences</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsBulkDialogOpen(true)} variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Bulk Send
              </Button>
            </div>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="send" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Send Notifications
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Manage Users
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History & Analytics
              </TabsTrigger>
            </TabsList>

            {/* Send Notifications Tab */}
            <TabsContent value="send" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Select User
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                        data-testid="input-search-users"
                      />
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {isLoadingUsers ? (
                        <p className="text-center text-muted-foreground">Loading users...</p>
                      ) : filteredUsers.length === 0 ? (
                        <p className="text-center text-muted-foreground">No users found</p>
                      ) : (
                        filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedUser?.id === user.id
                                ? 'bg-primary/10 border-primary'
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => setSelectedUser(user)}
                            data-testid={`user-item-${user.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{user.firstName} {user.lastName}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                                <Badge variant="outline">{user.subscriptionTier}</Badge>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Send Notification Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      Send Notification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedUser ? (
                      <>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="font-medium">Sending to: {selectedUser.firstName} {selectedUser.lastName}</p>
                          <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                        </div>

                        <div className="space-y-2">
                          <Label>Channel</Label>
                          <Select
                            value={notificationForm.channel}
                            onValueChange={(value) => setNotificationForm(prev => ({ ...prev, channel: value }))}
                          >
                            <SelectTrigger data-testid="select-channel">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  Email
                                </div>
                              </SelectItem>
                              <SelectItem value="sms">
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  SMS
                                </div>
                              </SelectItem>
                              <SelectItem value="push">
                                <div className="flex items-center gap-2">
                                  <Smartphone className="h-4 w-4" />
                                  Push
                                </div>
                              </SelectItem>
                              <SelectItem value="telegram">
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="h-4 w-4" />
                                  Telegram
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Priority</Label>
                          <Select
                            value={notificationForm.priority}
                            onValueChange={(value) => setNotificationForm(prev => ({ ...prev, priority: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Subject</Label>
                          <Input
                            placeholder="Notification subject"
                            value={notificationForm.subject}
                            onChange={(e) => setNotificationForm(prev => ({ ...prev, subject: e.target.value }))}
                            data-testid="input-subject"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Message</Label>
                          <Textarea
                            placeholder="Notification message"
                            value={notificationForm.message}
                            onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                            rows={4}
                            data-testid="textarea-message"
                          />
                        </div>

                        <Button
                          onClick={handleSendNotification}
                          disabled={!notificationForm.subject || !notificationForm.message || sendNotificationMutation.isPending}
                          className="w-full"
                          data-testid="button-send-notification"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {sendNotificationMutation.isPending ? 'Sending...' : 'Send Notification'}
                        </Button>
                      </>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Please select a user to send a notification
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* User Notifications History */}
              {selectedUser && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Notification History for {selectedUser.firstName} {selectedUser.lastName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingNotifications ? (
                      <p className="text-center text-muted-foreground py-4">Loading notifications...</p>
                    ) : userNotifications?.notifications?.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">No notifications found</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Channel</TableHead>
                              <TableHead>Subject</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Sent</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {userNotifications?.notifications?.map((notification: UserNotification) => (
                              <TableRow key={notification.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getChannelIcon(notification.channel)}
                                    <span className="capitalize">{notification.channel}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">{notification.subject}</TableCell>
                                <TableCell>{getStatusBadge(notification.status)}</TableCell>
                                <TableCell>
                                  {new Date(notification.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  {notification.sentAt 
                                    ? new Date(notification.sentAt).toLocaleDateString() 
                                    : '-'
                                  }
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Manage Users Tab */}
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    User Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedUser ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="font-medium">Managing: {selectedUser.firstName} {selectedUser.lastName}</p>
                        <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                      </div>

                      {isLoadingPreferences ? (
                        <p className="text-center text-muted-foreground py-4">Loading preferences...</p>
                      ) : userPreferences?.settings ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h4 className="font-medium">Notification Channels</h4>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  <span>Email Notifications</span>
                                </div>
                                <Switch
                                  checked={userPreferences.settings.notificationEmail}
                                  onCheckedChange={(checked) => {
                                    updatePreferencesMutation.mutate({
                                      notificationEmail: checked
                                    });
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  <span>SMS Notifications</span>
                                </div>
                                <Switch
                                  checked={userPreferences.settings.notificationSms}
                                  onCheckedChange={(checked) => {
                                    updatePreferencesMutation.mutate({
                                      notificationSms: checked
                                    });
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Smartphone className="h-4 w-4" />
                                  <span>Push Notifications</span>
                                </div>
                                <Switch
                                  checked={userPreferences.settings.notificationPush}
                                  onCheckedChange={(checked) => {
                                    updatePreferencesMutation.mutate({
                                      notificationPush: checked
                                    });
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="font-medium">Contact Information</h4>
                            <div className="space-y-3">
                              <div>
                                <Label>Phone Number</Label>
                                <Input
                                  value={userPreferences.settings.phoneNumber || ''}
                                  placeholder="Not configured"
                                  readOnly
                                  className="bg-muted"
                                />
                              </div>
                              <div>
                                <Label>Telegram Chat ID</Label>
                                <Input
                                  value={userPreferences.settings.telegramChatId || ''}
                                  placeholder="Not configured"
                                  readOnly
                                  className="bg-muted"
                                />
                              </div>
                              <div>
                                <Label>Email Frequency</Label>
                                <Input
                                  value={userPreferences.settings.emailFrequency || 'realtime'}
                                  readOnly
                                  className="bg-muted capitalize"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          No preferences found for this user
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Please select a user to manage their notification preferences
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* History & Analytics Tab */}
            <TabsContent value="history" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1,234</div>
                    <p className="text-xs text-muted-foreground">+10% from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">94.5%</div>
                    <p className="text-xs text-muted-foreground">+2% from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Failed Notifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">67</div>
                    <p className="text-xs text-muted-foreground">-15% from last month</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Bulk Send Dialog */}
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Send Bulk Notification</DialogTitle>
                <DialogDescription>
                  Send notifications to multiple users or all users at once.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={bulkForm.sendToAll}
                    onCheckedChange={(checked) => setBulkForm(prev => ({ ...prev, sendToAll: checked }))}
                  />
                  <Label>Send to all active users</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Channel</Label>
                    <Select
                      value={bulkForm.channel}
                      onValueChange={(value) => setBulkForm(prev => ({ ...prev, channel: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="push">Push</SelectItem>
                        <SelectItem value="telegram">Telegram</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={bulkForm.priority}
                      onValueChange={(value) => setBulkForm(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
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

                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    placeholder="Bulk notification subject"
                    value={bulkForm.subject}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Bulk notification message"
                    value={bulkForm.message}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSendBulkNotification}
                  disabled={!bulkForm.subject || !bulkForm.message || sendBulkMutation.isPending}
                >
                  {sendBulkMutation.isPending ? 'Sending...' : 'Send Bulk Notification'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}