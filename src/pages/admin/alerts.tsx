import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Activity, 
  CheckCircle, 
  XCircle, 
  Trash2,
  RefreshCw,
  Bell,
  Database,
  TrendingUp,
  TrendingDown
} from "lucide-react";

interface AlertSignal {
  id: string;
  user_id?: string;
  ticker: string;
  signal_type: "buy" | "sell";
  price: string;
  timestamp: string;
  timeframe?: string;
  source: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminAlerts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Fetch alert signals directly from Supabase
  const { data: alertSignals, isLoading: isLoadingSignals, refetch: refetchSignals } = useQuery({
    queryKey: ["alert-signals-supabase"],
    queryFn: async () => {
      if (!supabase) {
        throw new Error("Supabase not configured");
      }

      const { data, error } = await supabase
        .from('alert_signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error("Supabase query error:", error);
        throw error;
      }

      console.log("📊 Fetched", data?.length || 0, "alert signals from Supabase");
      return data as AlertSignal[];
    },
    refetchInterval: 30000 // Refresh every 30 seconds as backup to real-time
  });

  // Supabase Real-time subscription for alert_signals table
  useEffect(() => {
    if (!supabase) {
      console.log("Supabase not configured, skipping real-time subscription");
      return;
    }

    console.log("🔔 Setting up Supabase real-time subscription for alert_signals");

    const channel = supabase
      .channel('alert-signals-admin')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alert_signals'
        },
        (payload) => {
          console.log('🔔 Real-time alert signal update:', payload);
          
          // Refetch data
          refetchSignals();
          
          // Show notification
          if (payload.eventType === 'INSERT') {
            const newAlert = payload.new as AlertSignal;
            toast({
              title: "🔔 New Alert Created",
              description: `${newAlert.ticker} - ${newAlert.signal_type?.toUpperCase()} at $${newAlert.price}`,
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
            description: "Real-time alerts are now active",
          });
        }
      });

    return () => {
      console.log('🔌 Cleaning up Supabase real-time subscription');
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [toast, refetchSignals]);

  // Delete alert mutation - direct Supabase operation
  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      if (!supabase) {
        throw new Error("Supabase not configured");
      }

      const { error } = await supabase
        .from('alert_signals')
        .delete()
        .eq('id', alertId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      refetchSignals();
      toast({
        title: "✅ Success",
        description: "Alert deleted successfully"
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

  const getStatusBadge = (source: string) => {
    if (source === "webhook" || source === "tradingview") {
      return <Badge variant="default" className="bg-emerald-500"><CheckCircle className="w-3 h-3 mr-1" />Webhook</Badge>;
    }
    if (source === "manual") {
      return <Badge variant="secondary"><Activity className="w-3 h-3 mr-1" />Manual</Badge>;
    }
    return <Badge variant="outline">{source}</Badge>;
  };

  // Calculate stats from alert signals
  const stats = {
    totalSignals: alertSignals?.length || 0,
    buySignals: alertSignals?.filter(s => s.signal_type === "buy").length || 0,
    sellSignals: alertSignals?.filter(s => s.signal_type === "sell").length || 0,
    todaySignals: alertSignals?.filter(s => {
      const signalDate = new Date(s.created_at);
      const today = new Date();
      return signalDate.toDateString() === today.toDateString();
    }).length || 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar className="hidden lg:block lg:w-64" />
        
        <div className="flex-1 lg:ml-64">
          <div className="bg-card border-b border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Alert System Management</h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground">Monitor and manage trading alerts from Supabase database</p>
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
            </div>
          </div>
          
          <main className="p-4 lg:p-6">
            <div className="space-y-6">

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Signals</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSignals}</div>
                  <p className="text-xs text-muted-foreground mt-1">All time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Buy Signals</CardTitle>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">{stats.buySignals}</div>
                  <p className="text-xs text-muted-foreground mt-1">All time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sell Signals</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.sellSignals}</div>
                  <p className="text-xs text-muted-foreground mt-1">All time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Signals</CardTitle>
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.todaySignals}</div>
                  <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
                </CardContent>
              </Card>
            </div>

            {/* Alert Signals Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Alert Signals</CardTitle>
                    <p className="text-sm text-muted-foreground">Real-time monitoring of all trading signals from database</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => refetchSignals()}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingSignals ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ticker</TableHead>
                          <TableHead>Signal</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Timeframe</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Note</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {alertSignals?.slice(0, 50).map((alert) => (
                          <TableRow key={alert.id}>
                            <TableCell className="font-medium">{alert.ticker}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={alert.signal_type === "buy" ? "default" : "destructive"} 
                                className={alert.signal_type === "buy" ? "bg-emerald-500" : "bg-red-500"}
                              >
                                {alert.signal_type === "buy" ? (
                                  <><TrendingUp className="w-3 h-3 mr-1" />BUY</>
                                ) : (
                                  <><TrendingDown className="w-3 h-3 mr-1" />SELL</>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono">${alert.price}</TableCell>
                            <TableCell>{alert.timeframe || "—"}</TableCell>
                            <TableCell>{getStatusBadge(alert.source)}</TableCell>
                            <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                              {alert.note || "—"}
                            </TableCell>
                            <TableCell className="text-sm">{new Date(alert.created_at).toLocaleString()}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteAlertMutation.mutate(alert.id)}
                                disabled={deleteAlertMutation.isPending}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!alertSignals || alertSignals.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                              No alert signals found in database. Signals will appear here when created.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
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
