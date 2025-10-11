import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
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
import { Settings, Key, Zap, DollarSign, Bell, Smartphone, Edit, Save, TestTube, Activity } from "lucide-react";

interface APIIntegration {
  id: string;
  name: string;
  service: "tradingview" | "binance" | "coincap" | "stripe" | "onesignal" | "twilio";
  description: string;
  apiKey: string;
  apiSecret?: string;
  endpoint: string;
  isActive: boolean;
  lastUsed: string;
  usageCount: number;
  errorCount: number;
  rateLimit: number;
  configuration: any;
}

interface UsageLog {
  id: string;
  integrationId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: string;
  errorMessage?: string;
}

export default function AdminIntegrations() {
  const [selectedIntegration, setSelectedIntegration] = useState<APIIntegration | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    apiKey: "",
    apiSecret: "",
    endpoint: "",
    isActive: false,
    configuration: {},
  });
  const { toast } = useToast();

  const { data: integrations = [], isLoading } = useQuery<APIIntegration[]>({
    queryKey: ["/api/admin/integrations"],
  });

  const { data: usageLogs = [] } = useQuery<UsageLog[]>({
    queryKey: ["/api/admin/integrations/usage"],
  });

  const updateIntegrationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/admin/integrations/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integrations"] });
      setIsEditDialogOpen(false);
      toast({
        title: "Integration Updated",
        description: "API integration has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update integration",
        variant: "destructive",
      });
    },
  });

  const testIntegrationMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await apiRequest("POST", `/api/admin/integrations/${integrationId}/test`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Test Successful",
        description: data.message || "Integration test completed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test Failed",
        description: error.message || "Integration test failed",
        variant: "destructive",
      });
    },
  });

  const getServiceIcon = (service: string) => {
    switch (service) {
      case "tradingview":
        return <Zap className="h-5 w-5 text-blue-500" />;
      case "binance":
        return <Activity className="h-5 w-5 text-yellow-500" />;
      case "coincap":
        return <Activity className="h-5 w-5 text-green-500" />;
      case "stripe":
        return <DollarSign className="h-5 w-5 text-purple-500" />;
      case "onesignal":
        return <Bell className="h-5 w-5 text-red-500" />;
      case "twilio":
        return <Smartphone className="h-5 w-5 text-blue-600" />;
      default:
        return <Settings className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (integration: APIIntegration) => {
    if (!integration.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (integration.errorCount > 0) {
      return <Badge variant="destructive">Errors</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const handleEditIntegration = (integration: APIIntegration) => {
    setSelectedIntegration(integration);
    setEditForm({
      apiKey: integration.apiKey,
      apiSecret: integration.apiSecret || "",
      endpoint: integration.endpoint,
      isActive: integration.isActive,
      configuration: integration.configuration || {},
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateIntegration = () => {
    if (!selectedIntegration) return;
    
    updateIntegrationMutation.mutate({
      id: selectedIntegration.id,
      data: editForm,
    });
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.slice(0, 4) + "•".repeat(key.length - 8) + key.slice(-4);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        
        {/* Main Content */}
        <div className="ml-0 lg:ml-64 flex-1">
          {/* Header */}
          <header className="bg-card border-b border-border p-4 lg:p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">3rd Party API Integrations</h1>
                <p className="text-muted-foreground">Manage API keys, endpoints, and usage logs for external services</p>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="p-4 lg:p-6 space-y-6">

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">API Integrations</TabsTrigger>
          <TabsTrigger value="usage">Usage Logs</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              integrations.map((integration) => (
                <Card key={integration.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        {getServiceIcon(integration.service)}
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <CardDescription className="capitalize">{integration.service}</CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(integration)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-1">API Key</p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {maskApiKey(integration.apiKey)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Endpoint</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {integration.endpoint}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Usage Count</p>
                          <p className="text-muted-foreground">{integration.usageCount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="font-medium">Error Count</p>
                          <p className="text-muted-foreground text-red-600">{integration.errorCount}</p>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditIntegration(integration)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testIntegrationMutation.mutate(integration.id)}
                          disabled={testIntegrationMutation.isPending}
                          className="flex-1"
                        >
                          <TestTube className="h-4 w-4 mr-1" />
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

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Usage Logs</CardTitle>
              <CardDescription>Recent API calls and their response status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {usageLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No usage logs available</p>
                  </div>
                ) : (
                  usageLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Badge variant={log.statusCode >= 200 && log.statusCode < 300 ? "default" : "destructive"}>
                          {log.statusCode}
                        </Badge>
                        <div>
                          <p className="font-medium">{log.endpoint}</p>
                          <p className="text-sm text-muted-foreground">
                            {log.method} • {new Date(log.timestamp).toLocaleString()}
                          </p>
                          {log.errorMessage && (
                            <p className="text-sm text-red-600">{log.errorMessage}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{log.responseTime}ms</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total API Calls</p>
                    <p className="text-2xl font-bold">
                      {integrations.reduce((sum, int) => sum + int.usageCount, 0).toLocaleString()}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Integrations</p>
                    <p className="text-2xl font-bold">
                      {integrations.filter(int => int.isActive).length}
                    </p>
                  </div>
                  <Settings className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Errors</p>
                    <p className="text-2xl font-bold">
                      {integrations.reduce((sum, int) => sum + int.errorCount, 0)}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold">
                      {integrations.length > 0 
                        ? (((integrations.reduce((sum, int) => sum + int.usageCount, 0) - integrations.reduce((sum, int) => sum + int.errorCount, 0)) / integrations.reduce((sum, int) => sum + int.usageCount, 0)) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Integration Health Status</CardTitle>
              <CardDescription>Real-time status of all API integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {integrations.map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getServiceIcon(integration.service)}
                      <div>
                        <p className="font-medium">{integration.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Last used: {integration.lastUsed ? new Date(integration.lastUsed).toRelativeTimeString() : "Never"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right text-sm">
                        <p className="font-medium">{integration.usageCount} calls</p>
                        <p className="text-muted-foreground">{integration.errorCount} errors</p>
                      </div>
                      {getStatusBadge(integration)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Integration Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Integration: {selectedIntegration?.name}</DialogTitle>
            <DialogDescription>
              Update API configuration for {selectedIntegration?.service}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={editForm.apiKey}
                  onChange={(e) => setEditForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Enter API key"
                />
              </div>
              
              {selectedIntegration?.service === "stripe" && (
                <div className="space-y-2">
                  <Label htmlFor="api-secret">API Secret</Label>
                  <Input
                    id="api-secret"
                    type="password"
                    value={editForm.apiSecret}
                    onChange={(e) => setEditForm(prev => ({ ...prev, apiSecret: e.target.value }))}
                    placeholder="Enter API secret"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="endpoint">Endpoint URL</Label>
                <Input
                  id="endpoint"
                  value={editForm.endpoint}
                  onChange={(e) => setEditForm(prev => ({ ...prev, endpoint: e.target.value }))}
                  placeholder="https://api.example.com/v1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editForm.isActive}
                  onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, isActive: checked }))}
                />
                <Label>Enable Integration</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateIntegration} disabled={updateIntegrationMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateIntegrationMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}