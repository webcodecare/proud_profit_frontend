import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PERMISSIONS, ROLES, PermissionManager, usePermissions } from "@/lib/permissions";
import { useAuth } from "@/hooks/useAuth";
import { AdminGuard, PermissionGuard } from "@/components/auth/PermissionGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { Shield, Users, Key, Settings, Search, Filter, Plus, Edit, Trash2 } from "lucide-react";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export default function AdminPermissions() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRole, setSelectedRole] = useState("user");

  // Filter permissions by search term and category
  const filteredPermissions = Object.values(PERMISSIONS).filter(permission => {
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || permission.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ["all", ...new Set(Object.values(PERMISSIONS).map(p => p.category))];

  // Get user permissions
  const userPermissions = PermissionManager.getUserPermissions(user);

  return (
    <AdminGuard fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    }>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="lg:pl-72">
          <TopBar />
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Permission Management</h1>
                <p className="text-muted-foreground">
                  Manage role-based access control and user permissions
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                  <Shield className="h-3 w-3 mr-1" />
                  RBAC Enabled
                </Badge>
              </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
                  <Key className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Object.keys(PERMISSIONS).length}</div>
                  <p className="text-xs text-muted-foreground">
                    System-wide permissions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Object.keys(ROLES).length}</div>
                  <p className="text-xs text-muted-foreground">
                    Configured user roles
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Permission Categories</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{categories.length - 1}</div>
                  <p className="text-xs text-muted-foreground">
                    Feature categories
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Your Permissions</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userPermissions.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Granted to your account
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="permissions" className="space-y-4">
              <TabsList>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="roles">Roles</TabsTrigger>
                <TabsTrigger value="users">User Access</TabsTrigger>
                <TabsTrigger value="matrix">Permission Matrix</TabsTrigger>
              </TabsList>

              {/* Permissions Tab */}
              <TabsContent value="permissions" className="space-y-4">
                {/* Filters */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search permissions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category === "all" ? "All Categories" : category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Permissions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPermissions.map((permission) => (
                    <Card key={permission.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{permission.name}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {permission.category}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs">
                          {permission.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {permission.id}
                          </code>
                          <div className="flex items-center gap-1">
                            {userPermissions.includes(permission.id) ? (
                              <Badge variant="default" className="text-xs bg-green-500">
                                Granted
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                No Access
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Roles Tab */}
              <TabsContent value="roles" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {Object.values(ROLES).map((role) => (
                    <Card key={role.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            {role.name}
                            {role.isDefault && (
                              <Badge variant="outline" className="text-xs">Default</Badge>
                            )}
                          </CardTitle>
                        </div>
                        <CardDescription>{role.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-2">Permissions ({role.permissions.length})</p>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.slice(0, 6).map((permission) => (
                              <Badge key={permission} variant="secondary" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                            {role.permissions.length > 6 && (
                              <Badge variant="outline" className="text-xs">
                                +{role.permissions.length - 6} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <Badge 
                            variant={user?.role === role.id ? "default" : "outline"}
                            className="text-xs"
                          >
                            {user?.role === role.id ? "Your Role" : "Available"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* User Access Tab */}
              <TabsContent value="users" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Current User Access</CardTitle>
                    <CardDescription>
                      Your current permissions and access levels
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium">Role</p>
                        <Badge variant="default" className="mt-1">
                          {user?.role || 'Unknown'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Subscription</p>
                        <Badge variant="outline" className="mt-1">
                          {user?.subscriptionTier || 'Free'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Total Permissions</p>
                        <Badge variant="secondary" className="mt-1">
                          {userPermissions.length} granted
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Your Permissions</p>
                      <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                        {userPermissions.map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Permission Matrix Tab */}
              <TabsContent value="matrix" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Role Permission Matrix</CardTitle>
                    <CardDescription>
                      Overview of which roles have access to which permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Permission Matrix view coming soon...</p>
                      <p className="text-xs mt-2">This will show a detailed comparison of role permissions</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}