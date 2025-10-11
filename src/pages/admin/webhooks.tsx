import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Globe, 
  Key, 
  CheckCircle, 
  XCircle, 
  Trash2,
  RefreshCw,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Shield,
  Bell,
  Database
} from "lucide-react";

interface WebhookSecret {
  id: string;
  name: string;
  secret: string;
  description?: string;
  is_active?: boolean;
  allowed_sources?: string[];
  created_at: string;
  updated_at: string;
  last_used?: string;
  usage_count?: number;
}

export default function AdminWebhooks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [webhookForm, setWebhookForm] = useState({
    name: "",
    secret: "",
    description: "",
    is_active: true,
    allowed_sources: [] as string[],
  });

  // Fetch webhooks from Supabase
  const { data: webhooks, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ["webhook-secrets-supabase"],
    queryFn: async () => {
      if (!supabase) {
        throw new Error("Supabase not configured");
      }

      const { data, error } = await supabase
        .from('webhook_secrets')
        .select('*')
        .order('created_at', { ascending: false});

      if (error) {
        console.error("Supabase query error:", error);
        // Check if it's an RLS policy error
        if (error.message?.includes('row-level security') || error.code === 'PGRST301') {
          throw new Error("RLS_POLICY_ERROR: You need admin role to view webhooks. Check the fix-webhook-rls.sql file for setup instructions.");
        }
        throw error;
      }

      console.log("📊 Fetched", data?.length || 0, "webhooks from Supabase");
      return data as WebhookSecret[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds as backup
    retry: false // Don't retry on RLS errors
  });

  // Supabase Real-time subscription for webhook_secrets table
  useEffect(() => {
    if (!supabase) {
      console.log("Supabase not configured, skipping real-time subscription");
      return;
    }

    console.log("🔔 Setting up Supabase real-time subscription for webhook_secrets");

    const channel = supabase
      .channel('webhook-secrets-admin')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'webhook_secrets'
        },
        (payload) => {
          console.log('🔔 Real-time webhook update:', payload);
          
          // Refetch data
          refetch();
          
          // Show notification
          if (payload.eventType === 'INSERT') {
            const newWebhook = payload.new as WebhookSecret;
            toast({
              title: "🔔 New Webhook Created",
              description: `${newWebhook.name} has been added`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedWebhook = payload.new as WebhookSecret;
            toast({
              title: "🔔 Webhook Updated",
              description: `${updatedWebhook.name} has been modified`,
            });
          } else if (payload.eventType === 'DELETE') {
            toast({
              title: "🔔 Webhook Deleted",
              description: "A webhook has been removed",
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
            description: "Real-time webhook monitoring is active",
          });
        }
      });

    return () => {
      console.log('🔌 Cleaning up Supabase real-time subscription');
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [toast, refetch]);

  // Create webhook mutation
  const createWebhookMutation = useMutation({
    mutationFn: async (webhookData: typeof webhookForm) => {
      if (!supabase) {
        throw new Error("Supabase not configured");
      }

      const { data, error } = await supabase
        .from('webhook_secrets')
        .insert({
          name: webhookData.name,
          secret: webhookData.secret,
          description: webhookData.description,
          is_active: webhookData.is_active,
          allowed_sources: webhookData.allowed_sources,
        })
        .select()
        .single();

      if (error) {
        // Check if it's an RLS policy error
        if (error.message?.includes('row-level security') || error.code === '42501') {
          throw new Error("Permission denied: You need admin role to create webhooks. Run the SQL commands in fix-webhook-rls.sql file.");
        }
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "✅ Webhook Created",
        description: "Webhook secret has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Error Creating Webhook",
        description: error.message?.includes('admin role') 
          ? error.message 
          : `${error.message}. Check console for details.`,
        variant: "destructive",
        duration: 10000, // Show longer for important errors
      });
    },
  });

  // Delete webhook mutation
  const deleteWebhookMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      if (!supabase) {
        throw new Error("Supabase not configured");
      }

      const { error } = await supabase
        .from('webhook_secrets')
        .delete()
        .eq('id', webhookId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "✅ Success",
        description: "Webhook deleted successfully",
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

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      if (!supabase) {
        throw new Error("Supabase not configured");
      }

      const { error } = await supabase
        .from('webhook_secrets')
        .update({ is_active })
        .eq('id', id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "✅ Updated",
        description: "Webhook status updated",
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

  const resetForm = () => {
    setWebhookForm({
      name: "",
      secret: "",
      description: "",
      is_active: true,
      allowed_sources: [],
    });
  };

  const generateSecret = () => {
    // Check if crypto API is available (requires HTTPS or localhost)
    if (!window.crypto || !window.crypto.getRandomValues) {
      toast({
        title: "❌ Error",
        description: "Secure random generation not available. Please use HTTPS or a modern browser.",
        variant: "destructive",
      });
      return;
    }

    // Use cryptographically secure random number generation
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    const secret = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    setWebhookForm({ ...webhookForm, secret });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "📋 Copied",
      description: `${label} copied to clipboard`,
    });
  };

  const toggleSecretVisibility = (id: string) => {
    setShowSecret(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="flex">
        <Sidebar className="hidden lg:block lg:w-64" />
        
        <div className="flex-1 lg:ml-64 overflow-x-hidden">
          <div className="bg-card border-b border-border p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold">Webhook Management</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-xs md:text-sm text-muted-foreground">Manage webhook secrets for secure API integrations</p>
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
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full md:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Webhook
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Webhook Secret</DialogTitle>
                    <DialogDescription>
                      Create a new webhook secret for secure API integrations
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        placeholder="TradingView Webhook"
                        value={webhookForm.name}
                        onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="secret">Secret Key *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secret"
                          type="password"
                          placeholder="Click generate button for secure secret"
                          value={webhookForm.secret}
                          onChange={(e) => setWebhookForm({ ...webhookForm, secret: e.target.value })}
                          readOnly
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generateSecret}
                          title="Generate cryptographically secure 64-character hex secret"
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Must be 64 hexadecimal characters. Use generate button for security.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Description of this webhook..."
                        value={webhookForm.description}
                        onChange={(e) => setWebhookForm({ ...webhookForm, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="allowed_sources">Allowed Sources (comma-separated)</Label>
                      <Input
                        id="allowed_sources"
                        placeholder="tradingview, custom_bot"
                        value={webhookForm.allowed_sources.join(', ')}
                        onChange={(e) => setWebhookForm({ 
                          ...webhookForm, 
                          allowed_sources: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        })}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={webhookForm.is_active}
                        onCheckedChange={(checked) => setWebhookForm({ ...webhookForm, is_active: checked })}
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        // Enforce secure 64-character hex secret for security
                        const hexPattern = /^[0-9a-f]{64}$/i;
                        if (!hexPattern.test(webhookForm.secret)) {
                          toast({
                            title: "❌ Invalid Secret",
                            description: "Secret must be exactly 64 hexadecimal characters. Please use the generate button to create a secure secret.",
                            variant: "destructive",
                          });
                          return;
                        }
                        createWebhookMutation.mutate(webhookForm);
                      }}
                      disabled={createWebhookMutation.isPending || !webhookForm.name || !webhookForm.secret}
                    >
                      {createWebhookMutation.isPending ? "Creating..." : "Create Webhook"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <main className="p-4 lg:p-6">
            <div className="space-y-6">
              {/* RLS Error Alert */}
              {queryError && (
                <Card className="border-red-500 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-700 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Database Security Error
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-red-600">
                      {queryError.message}
                    </p>
                    <div className="bg-white p-3 rounded border border-red-200">
                      <p className="text-sm font-semibold mb-2">📋 Quick Fix:</p>
                      <ol className="text-sm space-y-1 list-decimal list-inside">
                        <li>Open Supabase SQL Editor</li>
                        <li>Run the SQL commands from <code className="bg-red-100 px-1 rounded">fix-webhook-rls.sql</code></li>
                        <li>Update your user role to 'admin'</li>
                        <li>Refresh this page</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Stats Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Webhooks</CardTitle>
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{webhooks?.length || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active</CardTitle>
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">
                      {webhooks?.filter(w => w.is_active).length || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inactive</CardTitle>
                    <XCircle className="h-4 w-4 text-gray-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-600">
                      {webhooks?.filter(w => !w.is_active).length || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Webhooks Table */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle>Webhook Secrets</CardTitle>
                      <CardDescription>Manage your webhook authentication secrets</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => refetch()}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
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
                            <TableHead>Name</TableHead>
                            <TableHead>Secret</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Sources</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Usage</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {webhooks?.map((webhook) => (
                            <TableRow key={webhook.id}>
                              <TableCell className="font-medium">{webhook.name}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <code className="text-xs bg-muted px-2 py-1 rounded break-all max-w-[150px] md:max-w-none truncate">
                                    {showSecret[webhook.id] ? webhook.secret : '•'.repeat(20)}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleSecretVisibility(webhook.id)}
                                  >
                                    {showSecret[webhook.id] ? (
                                      <EyeOff className="w-3 h-3" />
                                    ) : (
                                      <Eye className="w-3 h-3" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(webhook.secret, 'Secret')}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                                {webhook.description || "—"}
                              </TableCell>
                              <TableCell>
                                {webhook.allowed_sources && webhook.allowed_sources.length > 0 ? (
                                  <div className="flex gap-1 flex-wrap">
                                    {webhook.allowed_sources.map((source, i) => (
                                      <Badge key={i} variant="outline" className="text-xs">
                                        {source}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">Any</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={webhook.is_active}
                                    onCheckedChange={(checked) => 
                                      toggleActiveMutation.mutate({ id: webhook.id, is_active: checked })
                                    }
                                  />
                                  <Badge variant={webhook.is_active ? "default" : "secondary"} className={webhook.is_active ? "bg-emerald-500" : ""}>
                                    {webhook.is_active ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>{webhook.usage_count || 0} calls</div>
                                  {webhook.last_used && (
                                    <div className="text-xs text-muted-foreground">
                                      Last: {new Date(webhook.last_used).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                {new Date(webhook.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteWebhookMutation.mutate(webhook.id)}
                                  disabled={deleteWebhookMutation.isPending}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {(!webhooks || webhooks.length === 0) && (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                <div className="flex flex-col items-center gap-2">
                                  <Shield className="w-12 h-12 text-muted-foreground/50" />
                                  <p>No webhooks configured yet</p>
                                  <p className="text-sm">Create your first webhook to get started</p>
                                </div>
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
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
