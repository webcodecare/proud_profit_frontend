import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, UserPlus, CheckCircle, AlertCircle, Copy, Eye } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface TestUser {
  email: string;
  password: string;
  tier: string;
}

export default function TestUsersPage() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [createdUsers, setCreatedUsers] = useState<TestUser[]>([]);

  const createTestUsersMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/create-test-users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }),
    onSuccess: (data) => {
      setCreatedUsers(data.credentials || []);
      toast({
        title: "Test Users Created",
        description: `Successfully created ${data.users?.length || 0} test users`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create test users",
        variant: "destructive",
      });
    },
  });

  const handleCreateTestUsers = () => {
    setIsCreating(true);
    createTestUsersMutation.mutate();
    setTimeout(() => setIsCreating(false), 2000);
  };

  const copyCredentials = (user: TestUser) => {
    const text = `Email: ${user.email}\nPassword: ${user.password}\nTier: ${user.tier}`;
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "User credentials copied to clipboard",
    });
  };

  const testAllUsers = () => {
    toast({
      title: "Test Instructions",
      description: "Use these credentials to test different subscription levels. Each user has different feature access.",
    });
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 md:ml-64">
        <Header />
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Test Users Management</h1>
                <p className="text-muted-foreground">
                  Create and manage test users for different subscription levels
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleCreateTestUsers}
                  disabled={isCreating || createTestUsersMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  {isCreating ? "Creating..." : "Create Test Users"}
                </Button>
                {createdUsers.length > 0 && (
                  <Button variant="outline" onClick={testAllUsers}>
                    <Eye className="h-4 w-4 mr-2" />
                    Test Instructions
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Subscription Level Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Free Tier</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs">
                    <p>• Basic signals only</p>
                    <p>• 3 tickers max</p>
                    <p>• Email alerts only</p>
                    <p>• No advanced features</p>
                  </div>
                  <Badge variant="outline" className="mt-2">Limited Access</Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Basic Tier</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs">
                    <p>• Premium signals</p>
                    <p>• 10 tickers max</p>
                    <p>• SMS + Email alerts</p>
                    <p>• Heatmap analysis</p>
                    <p>• Trading playground</p>
                  </div>
                  <Badge variant="secondary" className="mt-2">Good Access</Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Premium Tier</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs">
                    <p>• All Basic features</p>
                    <p>• 25 tickers max</p>
                    <p>• Advanced analytics</p>
                    <p>• Cycle forecasting</p>
                    <p>• Telegram alerts</p>
                    <p>• API access</p>
                  </div>
                  <Badge className="mt-2">Full Access</Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Pro Tier</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs">
                    <p>• All Premium features</p>
                    <p>• Unlimited tickers</p>
                    <p>• Custom indicators</p>
                    <p>• White-label options</p>
                    <p>• Priority support</p>
                  </div>
                  <Badge variant="default" className="mt-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black">
                    Ultimate Access
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Test User Credentials */}
            {createdUsers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Test User Credentials
                  </CardTitle>
                  <CardDescription>
                    Use these credentials to test different subscription access levels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {createdUsers.map((user, index) => (
                      <Card key={index} className="bg-muted/50">
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge 
                                className={
                                  user.tier === 'free' ? 'bg-gray-500' :
                                  user.tier === 'basic' ? 'bg-blue-500' :
                                  user.tier === 'premium' ? 'bg-purple-500' :
                                  'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black'
                                }
                              >
                                {user.tier.toUpperCase()}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyCredentials(user)}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="text-sm space-y-1">
                              <p className="font-medium">Email:</p>
                              <p className="font-mono text-xs bg-background px-2 py-1 rounded">
                                {user.email}
                              </p>
                            </div>
                            
                            <div className="text-sm space-y-1">
                              <p className="font-medium">Password:</p>
                              <p className="font-mono text-xs bg-background px-2 py-1 rounded">
                                {user.password}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                  Testing Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>How to test subscription restrictions:</strong>
                    <br />
                    1. Logout from your current admin account
                    <br />
                    2. Login with each test user to see different feature access
                    <br />
                    3. Navigate to Dashboard, Multi-ticker, Trading Playground, etc.
                    <br />
                    4. Premium features will show upgrade prompts for lower tiers
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">Features to Test:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Multi-ticker dashboard</li>
                      <li>• 200-week heatmap analysis</li>
                      <li>• Cycle forecasting</li>
                      <li>• Advanced analytics tab</li>
                      <li>• SMS/Telegram alerts setup</li>
                      <li>• Trading playground (simulation)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Expected Behavior:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Free users see upgrade prompts</li>
                      <li>• Basic users access some premium features</li>
                      <li>• Premium users access most features</li>
                      <li>• Pro users access everything</li>
                      <li>• Ticker limits enforced properly</li>
                      <li>• Alert method restrictions applied</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}