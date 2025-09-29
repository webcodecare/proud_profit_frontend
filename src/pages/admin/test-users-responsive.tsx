import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { AdminStats, AdminTableCard, QuickActions, MobileResponsiveButton, StatusBadge } from "@/components/admin/ResponseDesignFix";

interface TestUser {
  email: string;
  password: string;
  tier: string;
}

// Small modular components
function CreateUsersCard({ 
  onCreateUsers, 
  isCreating 
}: { 
  onCreateUsers: () => void; 
  isCreating: boolean; 
}) {
  return (
    <Card className="p-4 sm:p-6">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
          Generate Test Users
        </CardTitle>
        <CardDescription className="text-sm">
          Create test accounts for different subscription tiers to validate system functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
            <div className="p-2 sm:p-3 bg-muted/50 rounded-lg">
              <div className="font-medium">Free Tier</div>
              <div className="text-muted-foreground">Basic access</div>
            </div>
            <div className="p-2 sm:p-3 bg-muted/50 rounded-lg">
              <div className="font-medium">Pro Tier</div>
              <div className="text-muted-foreground">Advanced features</div>
            </div>
            <div className="p-2 sm:p-3 bg-muted/50 rounded-lg">
              <div className="font-medium">Premium Tier</div>
              <div className="text-muted-foreground">Full access</div>
            </div>
          </div>
          <MobileResponsiveButton 
            onClick={onCreateUsers} 
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? (
              <>
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                Creating Users...
              </>
            ) : (
              <>
                <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Create Test Users
              </>
            )}
          </MobileResponsiveButton>
        </div>
      </CardContent>
    </Card>
  );
}

function CreatedUsersTable({ users, onCopyCredentials }: { 
  users: TestUser[]; 
  onCopyCredentials: (user: TestUser) => void; 
}) {
  if (users.length === 0) return null;

  return (
    <AdminTableCard 
      title="Generated Test Accounts" 
      description="Use these credentials to test different subscription levels"
    >
      <div className="space-y-2 sm:space-y-3">
        {users.map((user, index) => (
          <div 
            key={index} 
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-2 sm:gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <div className="font-medium text-sm sm:text-base truncate">{user.email}</div>
                <StatusBadge status="active" size="sm" />
                <Badge variant="outline" className="text-xs w-fit">{user.tier}</Badge>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                Password: <code className="bg-muted px-1 rounded">{user.password}</code>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onCopyCredentials(user)}
                className="text-xs h-8"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
          </div>
        ))}
      </div>
    </AdminTableCard>
  );
}

function TestInstructions() {
  const instructions = [
    "Each test user has different subscription access levels",
    "Use the credentials to validate feature access controls", 
    "Test payment flows with different subscription tiers",
    "Verify role-based permissions work correctly"
  ];

  return (
    <Card className="p-4 sm:p-6">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          Testing Instructions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-2">
          {instructions.map((instruction, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              <span>{instruction}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TestUsersPage() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [createdUsers, setCreatedUsers] = useState<TestUser[]>([]);

  const createTestUsersMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/create-test-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 md:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <AdminStats 
              title="Test Users Created" 
              value={createdUsers.length} 
              icon={Users}
              trend="Ready for testing"
            />
            <AdminStats 
              title="Subscription Tiers" 
              value="3" 
              icon={CheckCircle}
              trend="Free, Pro, Premium"
            />
            <AdminStats 
              title="Success Rate" 
              value="100%" 
              icon={AlertCircle}
              trend="All users created successfully"
            />
            <AdminStats 
              title="Status" 
              value="Active" 
              icon={Eye}
              trend="System ready for testing"
            />
          </div>

          {/* Create Users Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <CreateUsersCard 
              onCreateUsers={handleCreateTestUsers}
              isCreating={isCreating}
            />
            <TestInstructions />
          </div>

          {/* Created Users Table */}
          <CreatedUsersTable 
            users={createdUsers}
            onCopyCredentials={copyCredentials} 
          />

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs sm:text-sm">
              Test users are created with temporary credentials. Use them to validate subscription features and access controls.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    </div>
  );
}