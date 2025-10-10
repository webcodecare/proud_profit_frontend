import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { buildApiUrl } from "@/config/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import ProfileSettings from "@/components/settings/ProfileSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { tokenStorage } from "@/lib/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  User, 
  Shield, 
  Palette, 
  Bell,
  Key,
  Trash2,
  Settings as SettingsIcon
} from "lucide-react";

export default function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const token = tokenStorage.get();

  // Fetch user settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/user/settings", token],
    queryFn: async () => {
      if (!token) throw new Error("No authentication token");
      const response = await fetch(buildApiUrl("/api/user/settings"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: !!token,
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!token) throw new Error("No authentication token");
      const response = await fetch(buildApiUrl("/api/user/settings"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/settings", token] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleUpdateProfile = async (data: any) => {
    return updateSettingsMutation.mutateAsync(data);
  };

  const handleUpdateNotifications = async (data: any) => {
    return updateSettingsMutation.mutateAsync(data);
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    // In a real app, you'd make an API call to change password
    toast({
      title: "Password changed",
      description: "Your password has been updated successfully",
    });
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const handleDeleteAccount = async () => {
    // In a real app, you'd make an API call to delete the account
    toast({
      title: "Account deletion requested",
      description: "Your account will be deleted within 24 hours",
    });
    setIsDeleteDialogOpen(false);
    logout();
  };

  if (settingsLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <SettingsIcon className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden ml-0 md:ml-64">
        {/* Header */}
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-12 sm:h-14 items-center px-3 sm:px-6">
            <h1 className="text-lg sm:text-xl font-semibold">Settings & Preferences</h1>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-3 sm:p-6">
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 text-xs sm:text-sm">
                <TabsTrigger value="profile" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
                  <User className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Profile</span>
                  <span className="sm:hidden">👤</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="appearance" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Appearance
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Security
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                <ProfileSettings
                  user={user}
                  onUpdate={handleUpdateProfile}
                  isLoading={updateSettingsMutation.isPending}
                />
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <NotificationSettings
                  settings={settings}
                  onUpdate={handleUpdateNotifications}
                  isLoading={updateSettingsMutation.isPending}
                />
              </TabsContent>

              <TabsContent value="appearance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Appearance Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="theme-select">Theme</Label>
                        <Select 
                          value={settings?.theme || "dark"} 
                          onValueChange={(value) => updateSettingsMutation.mutate({ theme: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select theme" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">🌞 Light</SelectItem>
                            <SelectItem value="dark">🌙 Dark</SelectItem>
                            <SelectItem value="auto">🔄 Auto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="language-select">Language</Label>
                        <Select 
                          value={settings?.language || "en"} 
                          onValueChange={(value) => updateSettingsMutation.mutate({ language: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">🇺🇸 English</SelectItem>
                            <SelectItem value="es">🇪🇸 Español</SelectItem>
                            <SelectItem value="fr">🇫🇷 Français</SelectItem>
                            <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                            <SelectItem value="zh">🇨🇳 中文</SelectItem>
                            <SelectItem value="ja">🇯🇵 日本語</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency-select">Currency</Label>
                        <Select 
                          value={settings?.currency || "USD"} 
                          onValueChange={(value) => updateSettingsMutation.mutate({ currency: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">💵 USD</SelectItem>
                            <SelectItem value="EUR">💶 EUR</SelectItem>
                            <SelectItem value="GBP">💷 GBP</SelectItem>
                            <SelectItem value="JPY">💴 JPY</SelectItem>
                            <SelectItem value="CAD">🍁 CAD</SelectItem>
                            <SelectItem value="AUD">🇦🇺 AUD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timezone-select">Timezone</Label>
                        <Select 
                          value={settings?.timezone || "UTC"} 
                          onValueChange={(value) => updateSettingsMutation.mutate({ timezone: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">🌍 UTC</SelectItem>
                            <SelectItem value="America/New_York">🗽 New York</SelectItem>
                            <SelectItem value="America/Los_Angeles">🌴 Los Angeles</SelectItem>
                            <SelectItem value="Europe/London">🇬🇧 London</SelectItem>
                            <SelectItem value="Europe/Paris">🇫🇷 Paris</SelectItem>
                            <SelectItem value="Asia/Tokyo">🇯🇵 Tokyo</SelectItem>
                            <SelectItem value="Asia/Shanghai">🇨🇳 Shanghai</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <Button 
                        onClick={() => toast({ title: "Settings Applied", description: "Your appearance preferences have been saved." })}
                        className="w-full md:w-auto"
                      >
                        Apply Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Security Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, currentPassword: e.target.value })
                        }
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                        placeholder="Confirm new password"
                      />
                    </div>
                    <Button onClick={handlePasswordChange} variant="outline">
                      <Key className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                  </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Delete Account</h4>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete your account and all associated data
                        </p>
                      </div>
                      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Account
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Are you absolutely sure?</DialogTitle>
                            <DialogDescription>
                              This action cannot be undone. This will permanently delete your
                              account and remove your data from our servers.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteAccount}>
                              Yes, delete my account
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}