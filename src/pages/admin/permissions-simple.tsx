import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Shield, Users, Key, Settings, Search } from "lucide-react";

// Simple mock permissions data
const MOCK_PERMISSIONS = {
  'users.view': { name: 'View Users', description: 'View user information', category: 'User Management' },
  'users.create': { name: 'Create Users', description: 'Create new users', category: 'User Management' },
  'users.edit': { name: 'Edit Users', description: 'Edit user information', category: 'User Management' },
  'users.delete': { name: 'Delete Users', description: 'Delete users', category: 'User Management' },
  'admin.dashboard': { name: 'Admin Dashboard', description: 'Access admin dashboard', category: 'Administration' },
  'signals.view': { name: 'View Signals', description: 'View trading signals', category: 'Trading' },
  'signals.create': { name: 'Create Signals', description: 'Create trading signals', category: 'Trading' },
  'analytics.view': { name: 'View Analytics', description: 'View analytics data', category: 'Analytics' },
  'analytics.advanced': { name: 'Advanced Analytics', description: 'Access advanced analytics', category: 'Analytics' },
};

const MOCK_ROLES = {
  'user': { name: 'User', description: 'Standard user access', permissions: ['signals.view'] },
  'admin': { name: 'Admin', description: 'Administrative access', permissions: ['users.view', 'users.create', 'users.edit', 'admin.dashboard', 'signals.view', 'signals.create', 'analytics.view'] },
  'superuser': { name: 'Super Admin', description: 'Full system access', permissions: Object.keys(MOCK_PERMISSIONS) }
};

export default function AdminPermissions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRole, setSelectedRole] = useState("user");

  // Filter permissions by search term and category
  const filteredPermissions = Object.entries(MOCK_PERMISSIONS).filter(([key, permission]) => {
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || permission.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ["all", ...new Set(Object.values(MOCK_PERMISSIONS).map(p => p.category))];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-72">
        <Header />
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Permission Management</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Manage role-based access control and user permissions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 text-xs md:text-sm">
                <Shield className="h-3 w-3 mr-1" />
                RBAC Enabled
              </Badge>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Total Permissions</CardTitle>
                <Key className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">{Object.keys(MOCK_PERMISSIONS).length}</div>
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
                <div className="text-2xl font-bold">{Object.keys(MOCK_ROLES).length}</div>
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
                <CardTitle className="text-sm font-medium">Your Role</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Admin</div>
                <p className="text-xs text-muted-foreground">
                  Administrative access
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="permissions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="roles">Roles</TabsTrigger>
              <TabsTrigger value="users">User Assignments</TabsTrigger>
            </TabsList>

            <TabsContent value="permissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>System Permissions</CardTitle>
                      <CardDescription>
                        All available permissions in the system
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search permissions..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 w-64"
                        />
                      </div>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 border rounded-md bg-background"
                      >
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {category === "all" ? "All Categories" : category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPermissions.map(([key, permission]) => (
                      <Card key={key} className="border-2">
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
                              {key}
                            </code>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roles" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Roles</CardTitle>
                  <CardDescription>
                    Manage role-based permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(MOCK_ROLES).map(([key, role]) => (
                      <Card key={key} className="border-2">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{role.name}</CardTitle>
                              <CardDescription>{role.description}</CardDescription>
                            </div>
                            <Badge variant="outline">
                              {role.permissions.length} permissions
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {role.permissions.slice(0, 5).map(permission => (
                              <Badge key={permission} variant="secondary" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                            {role.permissions.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{role.permissions.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Permission Assignments</CardTitle>
                  <CardDescription>
                    View and manage user role assignments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">User Management</h3>
                    <p className="text-muted-foreground mb-4">
                      User role assignments are managed in the User Management section.
                    </p>
                    <Button variant="outline">
                      Go to User Management
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