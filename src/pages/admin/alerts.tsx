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
  Activity, 
  Webhook, 
  Send, 
  CheckCircle, 
  XCircle, 
  Play,
  Pause,
  Trash2,
  Edit,
  Plus
} from "lucide-react";

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  secret: string;
  isEnabled: boolean;
  totalSignals: number;
  lastSignalAt?: string;
  createdAt: string;
}

interface AlertQueue {
  id: string;
  ticker: string;
  signalType: "buy" | "sell";
  price: string;
  status: "pending" | "sent" | "failed";
  source: string;
  createdAt: string;
  sentAt?: string;
  error?: string;
}

interface WebhookForm {
  name: string;
  url: string;
  secret: string;
}

export default function AdminAlerts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newWebhook, setNewWebhook] = useState<WebhookForm>({
    name: "",
    url: "",
    secret: ""
  });
  const [isWebhookDialogOpen, setIsWebhookDialogOpen] = useState(false);

  // Fetch webhook configurations
  const { data: webhookData, isLoading: isLoadingWebhooks } = useQuery({
    queryKey: ["/api/admin/webhooks"],
    queryFn: async () => {
      const response = await apiRequest("/api/admin/webhooks");
      return response as any;
    }
  });

  const webhooks = webhookData?.secrets || [];

  // Fetch alert queue
  const { data: alertQueue, isLoading: isLoadingQueue } = useQuery({
    queryKey: ["/api/admin/alert-queue"],
    queryFn: async () => {
      const response = await apiRequest("/api/admin/alert-queue");
      return response as AlertQueue[];
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Create webhook mutation
  const createWebhookMutation = useMutation({
    mutationFn: async (webhook: WebhookForm) => {
      await apiRequest("/api/admin/webhooks", {
        method: "POST",
        body: JSON.stringify(webhook)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/webhooks"] });
      setNewWebhook({ name: "", url: "", secret: "" });
      setIsWebhookDialogOpen(false);
      toast({
        title: "Success",
        description: "Webhook configuration created successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Toggle webhook mutation
  const toggleWebhookMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      await apiRequest(`/api/admin/webhooks/${id}/toggle`, {
        method: "PATCH",
        body: JSON.stringify({ enabled })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/webhooks"] });
      toast({
        title: "Success",
        description: "Webhook status updated"
      });
    }
  });

  // Delete webhook mutation
  const deleteWebhookMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/admin/webhooks/${id}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/webhooks"] });
      toast({
        title: "Success",
        description: "Webhook deleted successfully"
      });
    }
  });

  // Retry failed alert mutation
  const retryAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await apiRequest(`/api/admin/alerts/${alertId}/retry`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/alert-queue"] });
      toast({
        title: "Success",
        description: "Alert retry initiated"
      });
    }
  });

  const handleCreateWebhook = () => {
    if (!newWebhook.name || !newWebhook.url) {
      toast({
        title: "Error",
        description: "Name and URL are required",
        variant: "destructive"
      });
      return;
    }
    
    // Generate secret if not provided
    if (!newWebhook.secret) {
      setNewWebhook(prev => ({
        ...prev,
        secret: crypto.randomUUID()
      }));
      return;
    }

    createWebhookMutation.mutate(newWebhook);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge variant="default" className="bg-emerald-500"><CheckCircle className="w-3 h-3 mr-1" />Sent</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case "pending":
        return <Badge variant="secondary"><Activity className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar className="hidden lg:block lg:w-64" />
        
        {/* Main Content */}
        <div className="flex-1 lg:ml-64">
          {/* Header */}
          <Header 
            title="Alert System Management" 
            subtitle="Manage webhook configurations and alert delivery queue"
          />
          
          {/* Page Content */}
          <main className="p-4 lg:p-6">
            <div className="space-y-6">

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Webhooks</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {webhooks?.filter(w => w.isEnabled).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Alerts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alertQueue?.filter(a => a.status === "pending").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Alerts</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {alertQueue?.filter(a => a.status === "failed").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {alertQueue?.length ? 
                `${Math.round((alertQueue.filter(a => a.status === "sent").length / alertQueue.length) * 100)}%` : 
                "100%"
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Webhook Configurations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Webhook Configurations</CardTitle>
              <p className="text-sm text-muted-foreground">Configure TradingView webhook endpoints</p>
            </div>
            <Dialog open={isWebhookDialogOpen} onOpenChange={setIsWebhookDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Webhook
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Webhook Configuration</DialogTitle>
                  <DialogDescription>
                    Add a new webhook endpoint for receiving TradingView alerts
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="webhook-name">Name</Label>
                    <Input
                      id="webhook-name"
                      value={newWebhook.name}
                      onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="TradingView Alerts"
                    />
                  </div>
                  <div>
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <Input
                      id="webhook-url"
                      value={newWebhook.url}
                      onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://your-domain.com/api/webhook/alerts"
                    />
                  </div>
                  <div>
                    <Label htmlFor="webhook-secret">Secret Key (optional)</Label>
                    <Input
                      id="webhook-secret"
                      value={newWebhook.secret}
                      onChange={(e) => setNewWebhook(prev => ({ ...prev, secret: e.target.value }))}
                      placeholder="Leave empty to auto-generate"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={handleCreateWebhook}
                    disabled={createWebhookMutation.isPending}
                  >
                    {createWebhookMutation.isPending ? "Creating..." : "Create Webhook"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingWebhooks ? (
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
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Signals</TableHead>
                  <TableHead>Last Signal</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks?.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-medium">{webhook.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{webhook.url}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={webhook.isEnabled}
                          onCheckedChange={(enabled) => 
                            toggleWebhookMutation.mutate({ id: webhook.id, enabled })
                          }
                          disabled={toggleWebhookMutation.isPending}
                        />
                        <span className={`text-sm ${webhook.isEnabled ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                          {webhook.isEnabled ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{webhook.totalSignals}</TableCell>
                    <TableCell>
                      {webhook.lastSignalAt ? 
                        new Date(webhook.lastSignalAt).toLocaleString() : 
                        "Never"
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deleteWebhookMutation.mutate(webhook.id)}
                          disabled={deleteWebhookMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!webhooks || webhooks.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No webhook configurations found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Alert Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Delivery Queue</CardTitle>
          <p className="text-sm text-muted-foreground">Monitor alert delivery status and retry failed alerts</p>
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
                  <TableHead>Ticker</TableHead>
                  <TableHead>Signal</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertQueue?.slice(0, 20).map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-medium">{alert.ticker}</TableCell>
                    <TableCell>
                      <Badge variant={alert.signalType === "buy" ? "default" : "destructive"}>
                        {alert.signalType.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>${alert.price}</TableCell>
                    <TableCell>{getStatusBadge(alert.status)}</TableCell>
                    <TableCell>{alert.source}</TableCell>
                    <TableCell>{new Date(alert.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      {alert.status === "failed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => retryAlertMutation.mutate(alert.id)}
                          disabled={retryAlertMutation.isPending}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Retry
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(!alertQueue || alertQueue.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No alerts in queue
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}