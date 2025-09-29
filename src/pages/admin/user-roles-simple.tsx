import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Users, UserPlus, Edit, Trash2, Shield, Key, Settings, Search, Crown, UserCheck } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'superuser';
  subscriptionTier: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

// Mock data for demonstration
const MOCK_ADMIN_USERS: AdminUser[] = [
  {
    id: "1",
    email: "admin@demo.com",
    firstName: "Admin",
    lastName: "User",
    role: "admin",
    subscriptionTier: "pro",
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: "2",
    email: "superadmin@demo.com",
    firstName: "Super",
    lastName: "Admin",
    role: "superuser",
    subscriptionTier: "pro",
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
];

const MOCK_ROLES = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system administration access',
    permissions: ['users.view', 'users.create', 'users.edit', 'users.delete', 'admin.dashboard', 'signals.manage'],
    userCount: 1
  },
  {
    id: 'superuser',
    name: 'Super Administrator',
    description: 'Complete system control and access',
    permissions: ['*'], // All permissions
    userCount: 1
  }
];

export default function AdminUserRoles() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "admin" as "admin" | "superuser",
  });

  // Use mock data directly without API calls
  const adminUsers = MOCK_ADMIN_USERS;
  const userRoles = MOCK_ROLES;
  const isLoadingUsers = false;

  // Simple state-based user creation (no API calls)
  const [isCreating, setIsCreating] = useState(false);

  // Filter users
  const filteredUsers = adminUsers.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = () => {
    if (!newUser.email || !newUser.firstName || !newUser.lastName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreating(true);
    // Simulate creating user
    setTimeout(() => {
      setIsCreating(false);
      setIsCreateUserOpen(false);
      setNewUser({ email: "", firstName: "", lastName: "", role: "admin" });
      toast({
        title: "Success",
        description: "Admin user created successfully (demo mode)",
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-72">
        <Header />
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin User Management</h1>
              <p className="text-muted-foreground">
                Manage administrator accounts and role assignments
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">
                <Shield className="h-3 w-3 mr-1" />
                {adminUsers.length} Admin Users
              </Badge>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminUsers.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active administrators
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {adminUsers.filter(u => u.role === 'admin').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Standard admin access
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {adminUsers.filter(u => u.role === 'superuser').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Full system access
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {adminUsers.filter(u => u.isActive).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently online
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList>
              <TabsTrigger value="users">Admin Users</TabsTrigger>
              <TabsTrigger value="roles">Role Definitions</TabsTrigger>
              <TabsTrigger value="permissions">Permission Matrix</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Administrator Accounts</CardTitle>
                      <CardDescription>
                        Manage admin user accounts and their role assignments
                      </CardDescription>
                    </div>
                    <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Create Admin User
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Administrator Account</DialogTitle>
                          <DialogDescription>
                            Create a new admin user with specified role and permissions.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="firstName">First Name</Label>
                              <Input
                                id="firstName"
                                value={newUser.firstName}
                                onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                                placeholder="Enter first name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="lastName">Last Name</Label>
                              <Input
                                id="lastName"
                                value={newUser.lastName}
                                onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                                placeholder="Enter last name"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              type="email"
                              value={newUser.email}
                              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                              placeholder="Enter email address"
                            />
                          </div>
                          <div>
                            <Label htmlFor="role">Administrator Role</Label>
                            <Select
                              value={newUser.role}
                              onValueChange={(value: "admin" | "superuser") => 
                                setNewUser({ ...newUser, role: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Administrator</SelectItem>
                                <SelectItem value="superuser">Super Administrator</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleCreateUser}
                            disabled={isCreating}
                          >
                            {isCreating ? "Creating..." : "Create Admin User"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search admin users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="superuser">Super Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Users Table */}
                  {isLoadingUsers ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Admin User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8">
                                No admin users found
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredUsers.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-semibold">
                                      {user.firstName} {user.lastName}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {user.email}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={user.role === 'superuser' ? 'default' : 'secondary'}
                                    className={user.role === 'superuser' ? 'bg-purple-500' : ''}
                                  >
                                    {user.role === 'superuser' ? (
                                      <><Crown className="mr-1 h-3 w-3" /> Super Admin</>
                                    ) : (
                                      <><Shield className="mr-1 h-3 w-3" /> Admin</>
                                    )}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                    {user.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-destructive">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roles" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Role Definitions</CardTitle>
                  <CardDescription>
                    Manage role permissions and capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userRoles.map((role) => (
                      <Card key={role.id} className="border-2">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                {role.id === 'superuser' ? (
                                  <Crown className="h-5 w-5 text-purple-500" />
                                ) : (
                                  <Shield className="h-5 w-5 text-blue-500" />
                                )}
                                {role.name}
                              </CardTitle>
                              <CardDescription>{role.description}</CardDescription>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">{role.userCount}</div>
                              <div className="text-sm text-muted-foreground">users</div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Permissions:</div>
                            <div className="flex flex-wrap gap-2">
                              {role.permissions[0] === '*' ? (
                                <Badge variant="default" className="bg-green-500">
                                  <Key className="h-3 w-3 mr-1" />
                                  All Permissions
                                </Badge>
                              ) : (
                                role.permissions.slice(0, 5).map((permission) => (
                                  <Badge key={permission} variant="outline" className="text-xs">
                                    {permission}
                                  </Badge>
                                ))
                              )}
                              {role.permissions.length > 5 && role.permissions[0] !== '*' && (
                                <Badge variant="secondary" className="text-xs">
                                  +{role.permissions.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Permission Matrix</CardTitle>
                  <CardDescription>
                    View detailed permission breakdown by role
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Permission Matrix</h3>
                    <p className="text-muted-foreground mb-4">
                      Detailed permission matrices are available in the Permission Management section.
                    </p>
                    <Button variant="outline">
                      Go to Permission Management
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}