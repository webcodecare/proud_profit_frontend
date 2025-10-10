import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout/Sidebar";
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
import { Settings, Plus, Edit, Trash2, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface SystemSetting {
  key: string;
  value: any;
  category?: string;
  type?: string;
  label?: string;
  description?: string;
  isPublic?: boolean;
  isEditable?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface SettingsResponse {
  settings: SystemSetting[];
}

export default function SystemSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newSetting, setNewSetting] = useState({
    key: "",
    value: "",
    category: "general",
    description: "",
    is_public: false,
    is_editable: true,
  });

  // Fetch settings
  const { data: settingsResponse, isLoading, error, refetch } = useQuery<SettingsResponse>({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const response = await apiRequest("/api/admin/settings");
      return response;
    },
  });

  const settings = settingsResponse?.settings || [];

  // Create setting mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof newSetting) => {
      return apiRequest("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      setIsCreateDialogOpen(false);
      setNewSetting({
        key: "",
        value: "",
        category: "general",
        description: "",
        is_public: false,
        is_editable: true,
      });
      toast({
        title: "Setting Created",
        description: "System setting has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create setting",
        variant: "destructive",
      });
    },
  });

  // Update setting mutation
  const updateMutation = useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: any; description?: string }) => {
      return apiRequest(`/api/admin/settings/${key}`, {
        method: "PUT",
        body: JSON.stringify({ value, description }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      setIsEditDialogOpen(false);
      setEditingSetting(null);
      toast({
        title: "Setting Updated",
        description: "System setting has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update setting",
        variant: "destructive",
      });
    },
  });

  // Delete setting mutation
  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      return apiRequest(`/api/admin/settings/${key}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Setting Deleted",
        description: "System setting has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete setting",
        variant: "destructive",
      });
    },
  });

  const handleCreateSetting = () => {
    if (!newSetting.key || !newSetting.value) {
      toast({
        title: "Validation Error",
        description: "Key and value are required",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(newSetting);
  };

  const handleUpdateSetting = () => {
    if (!editingSetting) return;
    updateMutation.mutate({
      key: editingSetting.key,
      value: editingSetting.value,
      description: editingSetting.description,
    });
  };

  const handleDeleteSetting = (setting: SystemSetting) => {
    if (!setting.isEditable) {
      toast({
        title: "Cannot Delete",
        description: "This setting is not editable and cannot be deleted",
        variant: "destructive",
      });
      return;
    }
    
    if (confirm(`Are you sure you want to delete the setting "${setting.key}"?`)) {
      deleteMutation.mutate(setting.key);
    }
  };

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64 p-6 overflow-y-auto flex items-center justify-center">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Failed to load settings. Please try again.</p>
              <Button onClick={() => refetch()} className="mt-4">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">System Settings</h1>
              <p className="text-muted-foreground">
                Manage system configuration and parameters
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Setting
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Setting</DialogTitle>
                  <DialogDescription>
                    Add a new system configuration setting
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="key">Key</Label>
                    <Input
                      id="key"
                      value={newSetting.key}
                      onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                      placeholder="max_alerts_per_user"
                    />
                  </div>
                  <div>
                    <Label htmlFor="value">Value</Label>
                    <Input
                      id="value"
                      value={newSetting.value}
                      onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newSetting.category}
                      onValueChange={(value) => setNewSetting({ ...newSetting, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="limits">Limits</SelectItem>
                        <SelectItem value="features">Features</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newSetting.description}
                      onChange={(e) =>
                        setNewSetting({ ...newSetting, description: e.target.value })
                      }
                      placeholder="Maximum number of alerts per user"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newSetting.is_public}
                      onCheckedChange={(checked) =>
                        setNewSetting({ ...newSetting, is_public: checked })
                      }
                    />
                    <Label>Public Setting</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSetting} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Setting"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Setting</DialogTitle>
                  <DialogDescription>
                    Update system configuration value
                  </DialogDescription>
                </DialogHeader>
                {editingSetting && (
                  <div className="space-y-4">
                    <div>
                      <Label>Key</Label>
                      <Input value={editingSetting.key} disabled className="bg-muted" />
                    </div>
                    <div>
                      <Label htmlFor="edit-value">Value</Label>
                      <Input
                        id="edit-value"
                        value={editingSetting.value}
                        onChange={(e) =>
                          setEditingSetting({ ...editingSetting, value: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-description">Description</Label>
                      <Input
                        id="edit-description"
                        value={editingSetting.description || ""}
                        onChange={(e) =>
                          setEditingSetting({ ...editingSetting, description: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateSetting} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Updating..." : "Update Setting"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Settings Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Settings</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{settings.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Public Settings</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {settings.filter((s) => s.isPublic).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Editable Settings</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {settings.filter((s) => s.isEditable).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Table */}
          <Card>
            <CardHeader>
              <CardTitle>Settings Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  <div className="text-muted-foreground">Loading settings...</div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Key</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {settings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No settings configured
                          </TableCell>
                        </TableRow>
                      ) : (
                        settings.map((setting) => (
                          <TableRow key={setting.key}>
                            <TableCell className="font-mono">{setting.key}</TableCell>
                            <TableCell className="font-medium">{String(setting.value)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{setting.category || "general"}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {setting.description || "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {setting.isPublic && <Badge variant="secondary">Public</Badge>}
                                {setting.isEditable && <Badge>Editable</Badge>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingSetting(setting);
                                    setIsEditDialogOpen(true);
                                  }}
                                  disabled={!setting.isEditable}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteSetting(setting)}
                                  disabled={!setting.isEditable}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
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
        </div>
      </div>
    </div>
  );
}
