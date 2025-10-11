import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { tokenStorage } from '@/lib/auth';
import { User, Upload, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';

interface ProfileSettingsProps {
  user: any;
  onUpdate: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export default function ProfileSettings({ user, onUpdate, isLoading }: ProfileSettingsProps) {
  const { toast } = useToast();
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || user?.first_name || '',
    lastName: user?.lastName || user?.last_name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    company: user?.company || '',
    website: user?.website || '',
    location: user?.location || '',
    avatar: user?.avatar || '',
  });

  const handleSave = async () => {
    try {
      const emailChanged = profileData.email !== (user?.email || '');
      
      // If email changed and password not provided, show error
      if (emailChanged && !currentPassword) {
        toast({
          title: 'Password Required',
          description: 'Please enter your current password to change your email address.',
          variant: 'destructive',
        });
        setShowPasswordField(true);
        return;
      }

      // Include password if email changed
      const updateData = emailChanged 
        ? { ...profileData, currentPassword }
        : profileData;

      await onUpdate(updateData);
      
      // Clear password after successful update
      setCurrentPassword('');
      setShowPasswordField(false);
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    
    // Show password field when email is changed
    if (field === 'email' && value !== (user?.email || '')) {
      setShowPasswordField(true);
    } else if (field === 'email' && value === (user?.email || '')) {
      setShowPasswordField(false);
      setCurrentPassword('');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (1MB max)
    if (file.size > 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload an image smaller than 1MB.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload an image file (JPG, PNG, or GIF).',
        variant: 'destructive',
      });
      return;
    }

    const token = tokenStorage.get();
    if (!token) {
      toast({
        title: 'Upload Failed',
        description: 'Please log in to upload an avatar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploadingImage(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('avatar', file);

      // Get API base URL
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      
      // Upload to backend API
      const response = await fetch(`${apiBaseUrl}/api/user/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Upload failed');
      }

      const data = await response.json();
      const avatarUrl = data.avatarUrl || data.avatar || data.url;

      if (!avatarUrl) {
        throw new Error('No avatar URL returned from server');
      }

      // Update profile data with new avatar URL
      setProfileData(prev => ({ ...prev, avatar: avatarUrl }));

      // Automatically save the new avatar to user profile
      await onUpdate({ ...profileData, avatar: avatarUrl });

      toast({
        title: 'Avatar Updated',
        description: 'Your profile picture has been uploaded successfully.',
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      
      toast({
        title: 'Upload Failed',
        description: error?.message || 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Generate webhook secret
  const generateWebhookSecret = () => {
    const secret = crypto.randomUUID().replace(/-/g, '');
    return secret;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Webhook secret copied to clipboard',
    });
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profileData.avatar || user?.avatar} />
              <AvatarFallback className="text-lg">
                {profileData.firstName?.[0]}{profileData.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground mt-1">
                JPG, GIF or PNG. 1MB max.
              </p>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={profileData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Enter your first name"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={profileData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Enter your last name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={profileData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Changing your email will update your login credentials. You'll need to use the new email to sign in.
            </p>
          </div>

          {showPasswordField && (
            <div className="animate-in slide-in-from-top-2 duration-200">
              <Label htmlFor="currentPasswordForEmail">Current Password</Label>
              <Input
                id="currentPasswordForEmail"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password to confirm email change"
              />
              <p className="text-xs text-amber-600 mt-1">
                Your current password is required to change your email address for security.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profileData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us about yourself"
              className="min-h-[100px]"
            />
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={profileData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Your company name"
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={profileData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={profileData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="City, Country"
            />
          </div>

          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Profile Changes'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Account Type</p>
              <p className="text-sm text-muted-foreground">Your current subscription plan</p>
            </div>
            <Badge variant={user?.subscriptionTier === 'premium' || user?.subscription_tier === 'premium' ? 'default' : 'secondary'}>
              {user?.subscriptionTier || user?.subscription_tier || 'Free'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Account Status</p>
              <p className="text-sm text-muted-foreground">Verification and security status</p>
            </div>
            <Badge variant={user?.emailVerified || user?.email_verified ? 'default' : 'destructive'}>
              {user?.emailVerified || user?.email_verified ? 'Verified' : 'Unverified'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Member Since</p>
              <p className="text-sm text-muted-foreground">Account creation date</p>
            </div>
            <span className="text-sm">
              {user?.createdAt || user?.created_at ? new Date(user.createdAt || user.created_at).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Secret Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Webhook Secret
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Your Webhook Secret</p>
              <p className="text-sm text-muted-foreground">
                Use this secret for TradingView webhook authentication
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWebhookSecret(!showWebhookSecret)}
            >
              {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>

          {showWebhookSecret && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={user?.webhookSecret || user?.webhook_secret || generateWebhookSecret()}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(user?.webhookSecret || user?.webhook_secret || generateWebhookSecret())}
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Keep this secret secure. Include it in your TradingView webhook messages.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
