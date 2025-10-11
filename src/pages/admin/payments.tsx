import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CreditCard, RefreshCw, AlertCircle, CheckCircle, XCircle, Clock, Search, Filter } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

interface PaymentLog {
  id: string;
  userId: string;
  userEmail: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: "succeeded" | "failed" | "pending" | "cancelled" | "refunded";
  paymentMethod: string;
  stripePaymentId: string;
  gatewayResponse: any;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentAnalytics {
  totalRevenue: number;
  successfulPayments: number;
  failedPayments: number;
  refundedAmount: number;
  averageTransactionAmount: number;
  conversionRate: number;
}

export default function AdminPayments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<PaymentLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const { data: payments = [], isLoading } = useQuery<PaymentLog[]>({
    queryKey: ["/api/admin/payments", searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);
      
      return await apiRequest(`/api/admin/payments?${params}`);
    },
  });

  const { data: analytics } = useQuery<PaymentAnalytics>({
    queryKey: ["/api/admin/payments/analytics"],
    queryFn: () => apiRequest("/api/admin/payments/analytics"),
  });

  const retryPaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      // Validate admin permissions before API call
      if (!hasPermission("admin")) {
        throw new Error("Insufficient permissions: Admin role required");
      }
      return await apiRequest(`/api/admin/payments/${paymentId}/retry`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      toast({
        title: "Payment Retry Initiated",
        description: "The payment retry has been initiated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Retry Failed",
        description: error.message || "Failed to retry payment",
        variant: "destructive",
      });
    },
  });

  const refundPaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      // Validate admin permissions before API call
      if (!hasPermission("admin")) {
        throw new Error("Insufficient permissions: Admin role required");
      }
      return await apiRequest(`/api/admin/payments/${paymentId}/refund`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      toast({
        title: "Refund Processed",
        description: "The payment refund has been processed.",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "succeeded":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case "refunded":
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "succeeded":
        return <Badge variant="default" className="bg-green-500">Succeeded</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      case "refunded":
        return <Badge variant="secondary" className="bg-blue-500">Refunded</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount / 100);
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = !searchTerm || 
      payment.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.stripePaymentId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const viewPaymentDetails = (payment: PaymentLog) => {
    setSelectedPayment(payment);
    setIsDetailsOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar className="hidden lg:block lg:w-64" />
        
        {/* Main Content */}
        <div className="flex-1 lg:ml-64">
          {/* Header */}
          <Header 
            title="Payment Management" 
            subtitle="Monitor payment transactions and gateway responses"
          />

          {/* Content */}
          <div className="p-4 lg:p-6 space-y-6">

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Payment Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="failed">Failed Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by email or payment ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="succeeded">Succeeded</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Logs Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No payment logs found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredPayments.map((payment) => (
                    <div key={payment.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => viewPaymentDetails(payment)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(payment.status)}
                          <div>
                            <h4 className="font-medium">{payment.userEmail}</h4>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <span>{payment.stripePaymentId}</span>
                              <span>•</span>
                              <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(payment.amount, payment.currency)}</p>
                            <p className="text-sm text-muted-foreground">{payment.paymentMethod}</p>
                          </div>
                          {getStatusBadge(payment.status)}
                          {payment.status === "failed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                retryPaymentMutation.mutate(payment.id);
                              }}
                              disabled={retryPaymentMutation.isPending}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>
                      {payment.errorMessage && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          <strong>Error:</strong> {payment.errorMessage}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</p>
                      </div>
                      <CreditCard className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Successful Payments</p>
                        <p className="text-2xl font-bold">{analytics.successfulPayments}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Failed Payments</p>
                        <p className="text-2xl font-bold">{analytics.failedPayments}</p>
                      </div>
                      <XCircle className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Refunded Amount</p>
                        <p className="text-2xl font-bold">{formatCurrency(analytics.refundedAmount)}</p>
                      </div>
                      <RefreshCw className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Avg Transaction</p>
                        <p className="text-2xl font-bold">{formatCurrency(analytics.averageTransactionAmount)}</p>
                      </div>
                      <CreditCard className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                        <p className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Failed Payments</CardTitle>
              <CardDescription>Review and manage failed payment attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payments
                  .filter(p => p.status === "failed")
                  .map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                      <div className="flex items-center space-x-4">
                        <XCircle className="h-5 w-5 text-red-500" />
                        <div>
                          <h4 className="font-medium">{payment.userEmail}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(payment.amount)} • {new Date(payment.createdAt).toLocaleDateString()}
                          </p>
                          {payment.errorMessage && (
                            <p className="text-sm text-red-600 mt-1">{payment.errorMessage}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewPaymentDetails(payment)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => retryPaymentMutation.mutate(payment.id)}
                          disabled={retryPaymentMutation.isPending}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Retry
                        </Button>
                      </div>
                    </div>
                  ))}
                {payments.filter(p => p.status === "failed").length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">No failed payments</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>Detailed payment information and gateway response</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Payment ID</Label>
                  <p className="text-sm">{selectedPayment.stripePaymentId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">User Email</Label>
                  <p className="text-sm">{selectedPayment.userEmail}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-sm">{formatCurrency(selectedPayment.amount, selectedPayment.currency)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <p className="text-sm">{selectedPayment.paymentMethod}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created At</Label>
                  <p className="text-sm">{new Date(selectedPayment.createdAt).toLocaleString()}</p>
                </div>
              </div>
              
              {selectedPayment.errorMessage && (
                <div>
                  <Label className="text-sm font-medium">Error Message</Label>
                  <p className="text-sm text-red-600 mt-1">{selectedPayment.errorMessage}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Gateway Response</Label>
                <pre className="text-xs bg-gray-50 p-3 rounded mt-1 overflow-auto max-h-40">
                  {JSON.stringify(selectedPayment.gatewayResponse, null, 2)}
                </pre>
              </div>

              <div className="flex space-x-2">
                {selectedPayment.status === "succeeded" && (
                  <Button
                    variant="outline"
                    onClick={() => refundPaymentMutation.mutate(selectedPayment.id)}
                    disabled={refundPaymentMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Process Refund
                  </Button>
                )}
                {selectedPayment.status === "failed" && (
                  <Button
                    onClick={() => retryPaymentMutation.mutate(selectedPayment.id)}
                    disabled={retryPaymentMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Payment
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}