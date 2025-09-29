import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/useWebSocket';
import { apiRequest } from '@/lib/queryClient';
import { ContextualAlertData } from '@/components/notifications/ContextualAlert';

interface Notification {
  id: string;
  type: 'signal' | 'price' | 'news' | 'system' | 'achievement';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  isArchived: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata?: {
    symbol?: string;
    price?: number;
    change?: number;
    signalType?: 'buy' | 'sell';
  };
}

interface NotificationPreferences {
  enableSound: boolean;
  enableBrowser: boolean;
  enableContextual: boolean;
  categories: {
    signals: boolean;
    price: boolean;
    news: boolean;
    system: boolean;
    achievements: boolean;
  };
  priorities: {
    low: boolean;
    medium: boolean;
    high: boolean;
    critical: boolean;
  };
}

export function useNotifications() {
  const [contextualAlerts, setContextualAlerts] = useState<ContextualAlertData[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enableSound: true,
    enableBrowser: true,
    enableContextual: true,
    categories: {
      signals: true,
      price: true,
      news: true,
      system: true,
      achievements: true,
    },
    priorities: {
      low: true,
      medium: true,
      high: true,
      critical: true,
    },
  });

  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000,
  });

  // Fetch notification preferences
  const { data: userPreferences } = useQuery<NotificationPreferences>({
    queryKey: ['/api/user/notification-preferences'],
  });

  // Update preferences when data changes
  useEffect(() => {
    if (userPreferences) {
      setPreferences(userPreferences);
    }
  }, [userPreferences]);

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: Partial<NotificationPreferences>) => {
      return apiRequest('/api/user/notification-preferences', 'PUT', newPreferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/notification-preferences'] });
    },
  });

  // WebSocket for real-time notifications
  const { isConnected } = useWebSocket('ws://localhost:5000/ws', {
    onMessage: (data: any) => {
      if (data.type === 'notification') {
        handleNewNotification(data.notification);
      }
    },
  });

  // Handle new notifications
  const handleNewNotification = useCallback((notification: Notification) => {
    // Update notifications list
    queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });

    // Check if notification should be shown based on preferences
    if (!shouldShowNotification(notification)) {
      return;
    }

    // Show contextual alert
    if (preferences.enableContextual) {
      const contextualAlert: ContextualAlertData = {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        metadata: notification.metadata,
      };

      setContextualAlerts(prev => [contextualAlert, ...prev.slice(0, 4)]); // Keep max 5 alerts
    }

    // Play sound
    if (preferences.enableSound && notification.priority !== 'low') {
      playNotificationSound();
    }

    // Show browser notification
    if (preferences.enableBrowser && 'Notification' in window && Notification.permission === 'granted') {
      showBrowserNotification(notification);
    }
  }, [preferences, queryClient]);

  const shouldShowNotification = (notification: Notification): boolean => {
    // Check category preferences
    if (!preferences.categories[notification.type as keyof typeof preferences.categories]) {
      return false;
    }

    // Check priority preferences
    if (!preferences.priorities[notification.priority as keyof typeof preferences.priorities]) {
      return false;
    }

    return true;
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYdBTSJ2O3PeDEEJnvH9N6TSA0SUqzh7aZQEwxMpOD1wGIdBTSJ2O3PeDEEJnvH9N6TSA0SUqzh7aZQEwxMpOD1wGIdBTSJ2O3PeDEEJnvH9N6TSA0SUqzh7aZQEwxMpOD1wGIdBTSJ2O3PeDEEJnvH9N6TSA0SUqzh7aZQEwxMpOD1wGId');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio errors in restricted environments
      });
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  };

  const showBrowserNotification = (notification: Notification) => {
    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'critical',
      });

      // Auto-close after 5 seconds unless critical
      if (notification.priority !== 'critical') {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        // Navigate to relevant page based on notification type
        if (notification.type === 'signal') {
          window.location.href = '/trading';
        } else if (notification.type === 'price') {
          window.location.href = '/dashboard';
        }
      };
    } catch (error) {
      console.warn('Failed to show browser notification:', error);
    }
  };

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  // Dismiss contextual alert
  const dismissContextualAlert = useCallback((alertId: string) => {
    setContextualAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // Mark notification as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest(`/api/notifications/${notificationId}/read`, 'PATCH');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/notifications/mark-all-read', 'PATCH');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Archive notification
  const archiveNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest(`/api/notifications/${notificationId}/archive`, 'PATCH');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Create test notification
  const createTestNotification = useCallback((type: Notification['type'] = 'system') => {
    const testNotification: Notification = {
      id: `test-${Date.now()}`,
      type,
      title: `Test ${type} notification`,
      message: `This is a test ${type} notification to verify the system is working correctly.`,
      timestamp: new Date().toISOString(),
      isRead: false,
      isArchived: false,
      priority: 'medium',
      metadata: type === 'signal' ? {
        symbol: 'BTCUSDT',
        price: 45000,
        change: 2.5,
        signalType: 'buy' as const,
      } : undefined,
    };

    handleNewNotification(testNotification);
  }, [handleNewNotification]);

  const unreadCount = notifications.filter(n => !n.isRead && !n.isArchived).length;

  return {
    notifications,
    contextualAlerts,
    preferences,
    unreadCount,
    isConnected,
    isLoading,
    
    // Actions
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    archiveNotification: archiveNotification.mutate,
    dismissContextualAlert,
    updatePreferences: (newPrefs: Partial<NotificationPreferences>) => {
      setPreferences(prev => ({ ...prev, ...newPrefs }));
      updatePreferencesMutation.mutate(newPrefs);
    },
    requestNotificationPermission,
    createTestNotification,
    
    // Status
    isMarkingAsRead: markAsRead.isPending,
    isMarkingAllAsRead: markAllAsRead.isPending,
    isArchiving: archiveNotification.isPending,
    isUpdatingPreferences: updatePreferencesMutation.isPending,
  };
}