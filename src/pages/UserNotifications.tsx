import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  CheckCircle, 
  Archive,
  Trash2,
  MoreHorizontal,
  Settings,
  Filter
} from "lucide-react";

interface UserNotification {
  id: string;
  type: "signal" | "price" | "news" | "system" | "achievement";
  title: string;
  message: string;
  status: "unread" | "read" | "archived" | "deleted";
  channel: "in_app" | "email" | "sms" | "telegram" | "push" | "webhook";
  isRead: boolean;
  isArchived: boolean;
  priority: "low" | "medium" | "high" | "critical";
  metadata?: {
    symbol?: string;
    price?: number;
    change?: number;
    signalType?: "buy" | "sell";
    url?: string;
    action?: string;
  };
  createdAt: string;
  readAt?: string;
  archivedAt?: string;
}

export default function UserNotifications() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  // Fetch user notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["/api/notifications", filter],
    queryFn: async () => {
      const response = await apiRequest("/api/notifications");
      return response as UserNotification[];
    }
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest(`/api/notifications/${notificationId}/read`, {
        method: "PATCH"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Success",
        description: "Notification marked as read"
      });
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/notifications/read-all", {
        method: "PATCH"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Success",
        description: "All notifications marked as read"
      });
    }
  });

  // Archive notification mutation
  const archiveNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest(`/api/notifications/${notificationId}/archive`, {
        method: "PATCH"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Success",
        description: "Notification archived"
      });
    }
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest(`/api/notifications/${notificationId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Success",
        description: "Notification deleted"
      });
    }
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "signal":
        return <Bell className="w-4 h-4" />;
      case "price":
        return <MessageSquare className="w-4 h-4" />;
      case "news":
        return <Mail className="w-4 h-4" />;
      case "system":
        return <Settings className="w-4 h-4" />;
      case "achievement":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "high":
        return <Badge variant="default">High</Badge>;
      case "medium":
        return <Badge variant="secondary">Medium</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusBadge = (isRead: boolean, isArchived: boolean) => {
    if (isArchived) {
      return <Badge variant="outline">Archived</Badge>;
    }
    return isRead ? 
      <Badge variant="secondary">Read</Badge> : 
      <Badge variant="default">Unread</Badge>;
  };

  const filteredNotifications = notifications?.filter(notification => {
    if (filter === "all") return !notification.isArchived;
    if (filter === "unread") return !notification.isRead && !notification.isArchived;
    if (filter === "read") return notification.isRead && !notification.isArchived;
    return true;
  });

  const unreadCount = notifications?.filter(n => !n.isRead && !n.isArchived).length || 0;

  return (
    <div className="container mx-auto p-4 lg:p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your trading activities and system alerts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending || unreadCount === 0}
              data-testid="button-mark-all-read"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Archived</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {notifications?.filter(n => n.isArchived).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
            data-testid="filter-all"
          >
            <Filter className="w-4 h-4 mr-2" />
            All
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("unread")}
            data-testid="filter-unread"
          >
            <Mail className="w-4 h-4 mr-2" />
            Unread ({unreadCount})
          </Button>
          <Button
            variant={filter === "read" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("read")}
            data-testid="filter-read"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Read
          </Button>
        </div>

        {/* Notifications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotifications?.map((notification) => (
                    <TableRow 
                      key={notification.id}
                      className={!notification.isRead ? "bg-blue-50 dark:bg-blue-950/20" : ""}
                      data-testid={`notification-row-${notification.id}`}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(notification.type)}
                          <span className="capitalize">{notification.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <div className="font-medium" data-testid={`notification-title-${notification.id}`}>
                            {notification.title}
                          </div>
                          <div className="text-sm text-muted-foreground truncate" data-testid={`notification-message-${notification.id}`}>
                            {notification.message}
                          </div>
                          {notification.metadata && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {notification.metadata.symbol && `${notification.metadata.symbol} `}
                              {notification.metadata.price && `$${notification.metadata.price} `}
                              {notification.metadata.signalType && `(${notification.metadata.signalType})`}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(notification.priority)}</TableCell>
                      <TableCell>{getStatusBadge(notification.isRead, notification.isArchived)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(notification.createdAt).toLocaleDateString()}
                          <div className="text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" data-testid={`notification-actions-${notification.id}`}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {!notification.isRead && (
                              <DropdownMenuItem
                                onClick={() => markAsReadMutation.mutate(notification.id)}
                                data-testid={`action-mark-read-${notification.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark as Read
                              </DropdownMenuItem>
                            )}
                            {!notification.isArchived && (
                              <DropdownMenuItem
                                onClick={() => archiveNotificationMutation.mutate(notification.id)}
                                data-testid={`action-archive-${notification.id}`}
                              >
                                <Archive className="w-4 h-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => deleteNotificationMutation.mutate(notification.id)}
                              className="text-red-600"
                              data-testid={`action-delete-${notification.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!filteredNotifications || filteredNotifications.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8" data-testid="no-notifications">
                        {filter === "unread" ? "No unread notifications" : 
                         filter === "read" ? "No read notifications" : 
                         "No notifications found"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}