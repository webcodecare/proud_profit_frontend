import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/layout/Sidebar";
import { Users, UserPlus, Edit, Trash2, Shield, Key, Settings, Search, Crown, UserCheck } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  subscriptionTier: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

export default function AdminUserRoles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [newUser, setNewUser] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "admin" as "admin" | "user",
    password: "admin123"
  });

  // Fetch admin users
  const { data: adminUsersResponse, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: () => apiRequest('/api/admin/users')
  });

  // Extract users array from response
  const allUsers = adminUsersResponse?.users || [];
  const adminUsers = allUsers.filter((user: any) => user.role === 'admin');

  // Fetch available roles (mock data for now)
  const userRoles: UserRole[] = [
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Full system administration access',
      permissions: ['users.view', 'users.create', 'users.edit', 'users.delete', 'admin.dashboard', 'signals.manage'],
      userCount: adminUsers.length
    },
    {
      id: 'user',
      name: 'Regular User',
      description: 'Standard user access to trading features',
      permissions: ['trading.view', 'signals.view', 'dashboard.view'],
      userCount: allUsers.filter((u: any) => u.role === 'user').length
    }
  ];

  // Create admin user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData: any) => 
      apiRequest('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsCreateUserOpen(false);
      setNewUser({
        email: "",
        firstName: "",
        lastName: "",
        role: "admin",
        password: "admin123"
      });
      toast({
        title: "Success",
        description: "User created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    }
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: any }) => 
      apiRequest(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => 
      apiRequest(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  });

  // Filter admin users based on search and role
  const filteredUsers = allUsers.filter((user: AdminUser) => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !selectedRole || selectedRole === "all" || user.role === selectedRole;
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
    
    const userData = {
      ...newUser,
      subscriptionTier: newUser.role === 'admin' ? 'pro' : 'free',
      isActive: true
    };
    createUserMutation.mutate(userData);
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    updateUserRoleMutation.mutate({ 
      userId, 
      updates: { 
        role: newRole,
        subscriptionTier: newRole === 'admin' ? 'pro' : 'free'
      } 
    });
  };

  const handleToggleStatus = (userId: string, currentStatus: boolean) => {
    updateUserRoleMutation.mutate({ 
      userId, 
      updates: { isActive: !currentStatus } 
    });
  };

  const handleDeleteUser = (userId: string, userEmail: string) => {
    if (confirm(`Are you sure you want to delete ${userEmail}?`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser({...user}); // Create a copy to avoid mutating the original
    setIsEditUserOpen(true);
  };

  const handleUpdateUser = () => {
    if (!selectedUser) return;
    
    updateUserRoleMutation.mutate({ 
      userId: selectedUser.id, 
      updates: {
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        role: selectedUser.role,
        isActive: selectedUser.isActive,
        subscriptionTier: selectedUser.role === 'admin' ? 'pro' : 'free'
      }
    });
    setIsEditUserOpen(false);
    setSelectedUser(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-64 p-6 overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Role Management</h1>
              <p className="text-muted-foreground">
                Manage user accounts, roles and permissions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">
                <Shield className="h-3 w-3 mr-1" />
                Role-Based Access
              </Badge>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{allUsers.length}</div>
                <p className="text-xs text-muted-foreground">
                  All user accounts
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
                  {adminUsers.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Admin role users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {allUsers.filter((u: any) => u.role === 'user').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Standard user role
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {allUsers.filter((u: AdminUser) => u.isActive).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList>
              <TabsTrigger value="users">All Users</TabsTrigger>
              <TabsTrigger value="roles">Role Management</TabsTrigger>
              <TabsTrigger value="permissions">Permission Matrix</TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              {/* Filters and Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                      <DialogDescription>
                        Add a new user to the system with specified role and permissions.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input 
                            value={newUser.firstName}
                            onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                            placeholder="John" 
                            required 
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input 
                            value={newUser.lastName}
                            onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                            placeholder="Doe" 
                            required 
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          type="email" 
                          placeholder="user@example.com" 
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select 
                          value={newUser.role} 
                          onValueChange={(value) => setNewUser({...newUser, role: value as "admin" | "user"})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrator</SelectItem>
                            <SelectItem value="user">User</SelectItem>
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
                        disabled={createUserMutation.isPending}
                      >
                        {createUserMutation.isPending ? "Creating..." : "Create User"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Edit User Dialog */}
                <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit User</DialogTitle>
                      <DialogDescription>
                        Update user information, role, and status.
                      </DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="edit-firstName">First Name</Label>
                            <Input 
                              value={selectedUser.firstName}
                              onChange={(e) => setSelectedUser({...selectedUser, firstName: e.target.value})}
                              placeholder="John" 
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-lastName">Last Name</Label>
                            <Input 
                              value={selectedUser.lastName}
                              onChange={(e) => setSelectedUser({...selectedUser, lastName: e.target.value})}
                              placeholder="Doe" 
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="edit-email">Email</Label>
                          <Input 
                            value={selectedUser.email}
                            onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                            type="email" 
                            placeholder="user@example.com" 
                            disabled
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-role">Role</Label>
                          <Select 
                            value={selectedUser.role} 
                            onValueChange={(value) => setSelectedUser({...selectedUser, role: value as "admin" | "user"})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrator</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="edit-isActive"
                            checked={selectedUser.isActive}
                            onChange={(e) => setSelectedUser({...selectedUser, isActive: e.target.checked})}
                            className="rounded"
                          />
                          <Label htmlFor="edit-isActive">Active User</Label>
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleUpdateUser}
                        disabled={updateUserRoleMutation.isPending}
                      >
                        {updateUserRoleMutation.isPending ? "Updating..." : "Update User"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Users Table */}
              <Card>
                <CardContent>
                  {isLoadingUsers ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-muted-foreground">Loading users...</div>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Subscription</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              {searchTerm || selectedRole ? "No users found matching your filters." : "No users found."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((user: AdminUser) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{user.firstName} {user.lastName}</div>
                                  <div className="text-sm text-muted-foreground">{user.email}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select 
                                  value={user.role} 
                                  onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">Administrator</SelectItem>
                                    <SelectItem value="user">User</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {user.subscriptionTier}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {formatDate(user.createdAt)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditUser(user)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleToggleStatus(user.id, user.isActive)}
                                    disabled={updateUserRoleMutation.isPending}
                                  >
                                    {user.isActive ? 'Disable' : 'Enable'}
                                  </Button>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteUser(user.id, user.email)}
                                    disabled={deleteUserMutation.isPending}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Role Management Tab */}
            <TabsContent value="roles" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userRoles.map((role: UserRole) => (
                  <Card key={role.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          {role.id === 'admin' ? <Shield className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                          {role.name}
                        </CardTitle>
                        <Badge variant="outline">{role.userCount} users</Badge>
                      </div>
                      <CardDescription>{role.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Permissions:</p>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 4).map((permission) => (
                            <Badge key={permission} variant="secondary" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                          {role.permissions.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Permission Matrix Tab */}
            <TabsContent value="permissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Permission Matrix</CardTitle>
                  <CardDescription>
                    Compare permissions across different user roles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Detailed permission matrix coming soon...</p>
                    <p className="text-xs mt-2">This will show a comprehensive comparison of role permissions</p>
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