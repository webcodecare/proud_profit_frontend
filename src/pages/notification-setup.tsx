import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Separator } from '@/components/ui/separator';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Bell, 
  Send, 
  CheckCircle, 
  ExternalLink,
  Settings,
  AlertTriangle,
  Info,
  Copy,
  Bot,
  Check,
  X,
  Phone
} from 'lucide-react';

export default function NotificationSetup() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('email');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isTelegramConnected, setIsTelegramConnected] = useState(false);

  // Fetch SMS status
  const { data: smsStatus, isLoading: smsLoading } = useQuery({
    queryKey: ['/api/notifications/sms/status'],
    retry: false,
  });

  // Fetch Telegram status
  const { data: telegramStatus, isLoading: telegramLoading } = useQuery({
    queryKey: ['/api/notifications/telegram/status'],
    retry: false,
  });

  // SMS verification mutation
  const smsVerifyMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      return await apiRequest('POST', '/api/notifications/sms/verify', { phoneNumber });
    },
    onSuccess: (data) => {
      if (data.demo) {
        toast({
          title: "Demo Mode",
          description: `Demo verification code: ${data.code} (SMS service not configured)`,
          variant: "default"
        });
      } else {
        toast({
          title: "Verification Code Sent",
          description: `SMS sent to ${phoneNumber}. Code: ${data.code}`,
        });
      }
      setIsPhoneVerified(true);
    },
    onError: (error: any) => {
      let errorMessage = "Failed to send verification code";
      
      if (error.message.includes("not configured")) {
        errorMessage = "SMS service is not configured. Please contact admin to set up Twilio credentials.";
      } else if (error.message.includes("country code")) {
        errorMessage = "Phone number must include country code (e.g., +1234567890)";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "SMS Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Telegram validation mutation
  const telegramValidateMutation = useMutation({
    mutationFn: async (chatId: string) => {
      return await apiRequest('POST', '/api/notifications/telegram/validate', { chatId });
    },
    onSuccess: (data) => {
      setIsTelegramConnected(true);
      if (data.demo) {
        toast({
          title: "Demo Mode",
          description: "Chat ID validated in demo mode (Telegram service not configured)",
        });
      } else {
        toast({
          title: "Telegram Connected",
          description: "Chat ID validated successfully!",
        });
      }
    },
    onError: (error: any) => {
      let errorMessage = "Failed to validate Telegram chat ID";
      
      if (error.message.includes("not configured")) {
        errorMessage = "Telegram bot is not configured. Please contact admin to set up bot credentials.";
      } else if (error.message.includes("Invalid chat ID")) {
        errorMessage = "Invalid chat ID format. Please check and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Telegram Validation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Telegram test mutation
  const telegramTestMutation = useMutation({
    mutationFn: async (chatId: string) => {
      return await apiRequest('POST', '/api/notifications/telegram/test', { chatId });
    },
    onSuccess: (data) => {
      if (data.demo) {
        toast({
          title: "Demo Mode",
          description: "Test message simulated (Telegram service not configured)",
        });
      } else {
        toast({
          title: "Test Message Sent",
          description: "Check your Telegram for the test message!",
        });
      }
    },
    onError: (error: any) => {
      let errorMessage = "Failed to send test message";
      
      if (error.message.includes("not configured")) {
        errorMessage = "Telegram bot is not configured. Please contact admin to set up bot credentials.";
      } else if (error.message.includes("chat not found")) {
        errorMessage = "Chat ID not found. Please verify your Chat ID and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Telegram Test Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSmsVerify = () => {
    if (!phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number with country code",
        variant: "destructive",
      });
      return;
    }
    smsVerifyMutation.mutate(phoneNumber);
  };

  const handleTelegramValidate = () => {
    if (!telegramChatId) {
      toast({
        title: "Chat ID Required",
        description: "Please enter your Telegram Chat ID",
        variant: "destructive",
      });
      return;
    }
    telegramValidateMutation.mutate(telegramChatId);
  };

  const handleTelegramTest = () => {
    if (!telegramChatId) {
      toast({
        title: "Chat ID Required",
        description: "Please enter your Telegram Chat ID first",
        variant: "destructive",
      });
      return;
    }
    telegramTestMutation.mutate(telegramChatId);
  };

  const copyBotUsername = () => {
    if (telegramStatus?.botUsername) {
      navigator.clipboard.writeText(telegramStatus.botUsername);
      toast({
        title: "Copied",
        description: "Bot username copied to clipboard",
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <Navigation />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 ml-0 md:ml-64 p-3 sm:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Notification Setup</h1>
              <p className="text-gray-400 text-sm sm:text-base">Configure how you receive trading signals and market alerts</p>
            </div>

            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 text-xs sm:text-sm">
                <TabsTrigger value="email" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Email</span>
                  <span className="sm:hidden">📧</span>
                </TabsTrigger>
                <TabsTrigger value="sms" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
                  <Smartphone className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">SMS</span>
                  <span className="sm:hidden">📱</span>
                </TabsTrigger>
                <TabsTrigger value="telegram" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
                  <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Telegram</span>
                  <span className="sm:hidden">💬</span>
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden lg:inline">Advanced</span>
                  <span className="lg:hidden">⚙️</span>
                </TabsTrigger>
                <TabsTrigger value="setup" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
                  <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden lg:inline">Setup Guide</span>
                  <span className="lg:hidden">📋</span>
                </TabsTrigger>
              </TabsList>

              {/* Email Tab */}
              <TabsContent value="email">
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-white">
                      <Mail className="w-5 h-5" />
                      Email Notifications
                      <Badge variant="secondary" className="bg-green-900/50 text-green-300">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Configured
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 bg-green-900/20 border border-green-800 rounded-lg">
                      <div className="flex items-center gap-2 text-green-300 mb-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">Email notifications are active</span>
                      </div>
                      <p className="text-sm text-green-200">
                        You'll receive trading signals and market updates via email instantly.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-white">Email Address</Label>
                        <Input
                          value="demo@cryptostrategy.pro"
                          disabled
                          className="bg-gray-800 border-gray-700 text-gray-300"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Instant Alerts</Label>
                          <p className="text-sm text-gray-400">Get notified immediately when signals are generated</p>
                        </div>
                        <Switch checked={true} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Daily Summary</Label>
                          <p className="text-sm text-gray-400">Receive a daily recap of all signals</p>
                        </div>
                        <Switch checked={true} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SMS Tab */}
              <TabsContent value="sms">
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-white">
                      <Smartphone className="w-5 h-5" />
                      SMS Alerts
                      <Badge variant="secondary" className={
                        smsStatus?.configured 
                          ? "bg-green-900/50 text-green-300" 
                          : "bg-yellow-900/50 text-yellow-300"
                      }>
                        {smsStatus?.configured ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Ready
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Setup Required
                          </>
                        )}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {!smsStatus?.configured ? (
                      <div className="p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-300 mb-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="font-medium">SMS service requires configuration</span>
                        </div>
                        <p className="text-sm text-yellow-200 mb-3">
                          To enable SMS alerts, you need to provide Twilio API credentials in your environment variables:
                        </p>
                        <div className="bg-gray-800 p-3 rounded font-mono text-sm text-gray-300">
                          <div>TWILIO_ACCOUNT_SID=your_account_sid</div>
                          <div>TWILIO_AUTH_TOKEN=your_auth_token</div>
                          <div>TWILIO_PHONE_NUMBER=+1234567890</div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-green-900/20 border border-green-800 rounded-lg">
                        <div className="flex items-center gap-2 text-green-300 mb-2">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium">SMS service configured with {smsStatus.provider}</span>
                        </div>
                        <p className="text-sm text-green-200">
                          Ready to send instant SMS alerts for trading signals.
                        </p>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <Label className="text-white">Phone Number</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="+1 (555) 123-4567"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white"
                            disabled={!smsStatus?.configured}
                          />
                          <Button 
                            onClick={handleSmsVerify}
                            disabled={smsVerifyMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {smsVerifyMutation.isPending ? 'Sending...' : 'Verify'}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Include country code (e.g., +1 for US, +44 for UK)
                          {!smsStatus?.configured && (
                            <span className="text-blue-400 ml-1">• Demo mode available for testing</span>
                          )}
                        </p>
                      </div>

                      {isPhoneVerified && (
                        <div className="p-4 bg-green-900/20 border border-green-800 rounded-lg">
                          <div className="flex items-center gap-2 text-green-300">
                            <CheckCircle className="w-4 h-4" />
                            <span className="font-medium">Phone number verified!</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Critical Alerts Only</Label>
                          <p className="text-sm text-gray-400">Only send SMS for high-confidence signals</p>
                        </div>
                        <Switch checked={true} disabled={!smsStatus?.configured} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Telegram Tab */}
              <TabsContent value="telegram">
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-white">
                      <Bot className="w-5 h-5" />
                      Telegram Bot
                      <Badge variant="secondary" className={
                        telegramStatus?.configured 
                          ? "bg-green-900/50 text-green-300" 
                          : "bg-yellow-900/50 text-yellow-300"
                      }>
                        {telegramStatus?.configured ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Ready
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Setup Required
                          </>
                        )}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {!telegramStatus?.configured ? (
                      <div className="p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-300 mb-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="font-medium">Telegram bot requires configuration</span>
                        </div>
                        <p className="text-sm text-yellow-200 mb-3">
                          To enable Telegram alerts, you need to provide a bot token in your environment variables:
                        </p>
                        <div className="bg-gray-800 p-3 rounded font-mono text-sm text-gray-300">
                          TELEGRAM_BOT_TOKEN=your_bot_token
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="p-4 bg-green-900/20 border border-green-800 rounded-lg">
                          <div className="flex items-center gap-2 text-green-300 mb-2">
                            <CheckCircle className="w-4 h-4" />
                            <span className="font-medium">Telegram bot is online</span>
                          </div>
                          <p className="text-sm text-green-200">
                            Bot: {telegramStatus.botUsername || '@CryptoStrategyProBot'} is ready to send alerts.
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                            <h4 className="font-medium text-blue-300 mb-3">Setup Instructions:</h4>
                            <ol className="space-y-2 text-sm text-blue-200">
                              <li className="flex items-start gap-2">
                                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                                <div>
                                  Open Telegram and search for{" "}
                                  <button
                                    onClick={copyBotUsername}
                                    className="bg-blue-600 px-2 py-1 rounded text-white hover:bg-blue-700 inline-flex items-center gap-1"
                                  >
                                    {telegramStatus.botUsername || '@CryptoStrategyProBot'}
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                                <span>Send <code className="bg-gray-800 px-1 rounded">/start</code> command to the bot</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                                <span>Copy your Chat ID from the bot's response</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">4</span>
                                <span>Paste the Chat ID below and validate</span>
                              </li>
                            </ol>
                          </div>

                          <div>
                            <Label className="text-white">Telegram Chat ID</Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="123456789"
                                value={telegramChatId}
                                onChange={(e) => setTelegramChatId(e.target.value)}
                                className="bg-gray-800 border-gray-700 text-white"
                              />
                              <Button 
                                onClick={handleTelegramValidate}
                                disabled={telegramValidateMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {telegramValidateMutation.isPending ? 'Validating...' : 'Validate'}
                              </Button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              Get your Chat ID by messaging the bot
                            </p>
                          </div>

                          {isTelegramConnected && (
                            <div className="p-4 bg-green-900/20 border border-green-800 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-green-300">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="font-medium">Chat connected successfully!</span>
                                </div>
                                <Button 
                                  onClick={handleTelegramTest}
                                  disabled={telegramTestMutation.isPending}
                                  variant="outline"
                                  size="sm"
                                >
                                  {telegramTestMutation.isPending ? 'Sending...' : 'Send Test'}
                                </Button>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-white">Rich Formatting</Label>
                              <p className="text-sm text-gray-400">Send messages with charts and formatting</p>
                            </div>
                            <Switch checked={true} />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-white">Signal Previews</Label>
                              <p className="text-sm text-gray-400">Include price charts in messages</p>
                            </div>
                            <Switch checked={true} />
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced">
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-white">
                      <Settings className="w-5 h-5" />
                      Advanced Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white">Discord Webhook URL</Label>
                        <Input
                          placeholder="https://discord.com/api/webhooks/..."
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Send signals to your Discord server
                        </p>
                      </div>

                      <div>
                        <Label className="text-white">Custom Webhook URL</Label>
                        <Input
                          placeholder="https://your-api.com/webhook"
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Send POST requests to your custom endpoint
                        </p>
                      </div>

                      <Separator className="bg-gray-700" />

                      <div className="space-y-4">
                        <h4 className="font-medium text-white">Notification Preferences</h4>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-white">Sound Alerts</Label>
                            <p className="text-sm text-gray-400">Play notification sounds in browser</p>
                          </div>
                          <Switch />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-white">Desktop Notifications</Label>
                            <p className="text-sm text-gray-400">Show browser notifications when page is not active</p>
                          </div>
                          <Switch />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-white">Quiet Hours</Label>
                            <p className="text-sm text-gray-400">Disable notifications from 10 PM to 8 AM</p>
                          </div>
                          <Switch />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Setup Guide Tab */}
              <TabsContent value="setup">
                <div className="space-y-6">
                  <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-white">
                        <Info className="w-5 h-5" />
                        Setup Guide
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* SMS Setup Guide */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Smartphone className="w-5 h-5" />
                          SMS Setup (Twilio)
                        </h3>
                        <div className="bg-gray-800/50 p-4 rounded-lg">
                          <p className="text-gray-300 mb-4">
                            To enable SMS notifications, an administrator needs to configure Twilio credentials:
                          </p>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                              <div>
                                <p className="text-white">Create a Twilio account at <a href="https://www.twilio.com" target="_blank" className="text-blue-400 hover:text-blue-300">twilio.com</a></p>
                                <p className="text-gray-400 text-sm">Sign up for a free account to get started</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                              <div>
                                <p className="text-white">Get your Account SID and Auth Token</p>
                                <p className="text-gray-400 text-sm">Found in your Twilio Console Dashboard</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                              <div>
                                <p className="text-white">Purchase a phone number</p>
                                <p className="text-gray-400 text-sm">This will be used to send SMS alerts</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
                              <div>
                                <p className="text-white">Set environment variables:</p>
                                <div className="bg-gray-900 p-2 rounded mt-1 font-mono text-sm">
                                  <p className="text-green-400">TWILIO_ACCOUNT_SID=your_account_sid</p>
                                  <p className="text-green-400">TWILIO_AUTH_TOKEN=your_auth_token</p>
                                  <p className="text-green-400">TWILIO_PHONE_NUMBER=+1234567890</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Telegram Setup Guide */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Bot className="w-5 h-5" />
                          Telegram Setup
                        </h3>
                        <div className="bg-gray-800/50 p-4 rounded-lg">
                          <p className="text-gray-300 mb-4">
                            To enable Telegram notifications, an administrator needs to create a bot:
                          </p>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                              <div>
                                <p className="text-white">Message @BotFather on Telegram</p>
                                <p className="text-gray-400 text-sm">The official bot for creating new bots</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                              <div>
                                <p className="text-white">Send /newbot command</p>
                                <p className="text-gray-400 text-sm">Follow the prompts to create your bot</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                              <div>
                                <p className="text-white">Get your bot token</p>
                                <p className="text-gray-400 text-sm">BotFather will provide a token like: 123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
                              <div>
                                <p className="text-white">Set environment variable:</p>
                                <div className="bg-gray-900 p-2 rounded mt-1 font-mono text-sm">
                                  <p className="text-green-400">TELEGRAM_BOT_TOKEN=your_bot_token</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* User Instructions */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Bell className="w-5 h-5" />
                          User Instructions
                        </h3>
                        <div className="bg-gray-800/50 p-4 rounded-lg">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium text-white mb-2">For SMS Notifications:</h4>
                              <p className="text-gray-300 text-sm">
                                Enter your phone number with country code (e.g., +1234567890) and click Verify to receive a test SMS.
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium text-white mb-2">For Telegram Notifications:</h4>
                              <ol className="text-gray-300 text-sm space-y-1">
                                <li>1. Start a chat with the bot (once configured)</li>
                                <li>2. Send /start to the bot</li>
                                <li>3. Get your Chat ID from @userinfobot</li>
                                <li>4. Enter your Chat ID and validate</li>
                              </ol>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-8 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-300 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-300 mb-2">About Notifications</h4>
                  <p className="text-sm text-blue-200">
                    Our notification system delivers real-time trading signals from advanced algorithms and TradingView webhooks. 
                    Choose your preferred channels to stay informed about market opportunities without missing critical signals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}