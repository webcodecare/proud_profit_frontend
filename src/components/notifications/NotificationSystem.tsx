import React, { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info,
  X,
  Bell
} from 'lucide-react';

export interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationItemProps extends NotificationProps {
  id: string;
  onClose: (id: string) => void;
}

function NotificationItem({ id, type, title, message, duration = 5000, action, onClose }: NotificationItemProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info': return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200';
      case 'error': return 'border-red-200 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200';
      case 'warning': return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200';
      case 'info': return 'border-blue-200 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200';
    }
  };

  return (
    <div 
      className={`transition-all duration-300 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <Alert className={`${getColorClasses()} shadow-lg border-2`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {getIcon()}
            <div className="flex-1">
              <h4 className="font-semibold text-sm sm:text-base">{title}</h4>
              <p className="text-xs sm:text-sm mt-1 opacity-90">{message}</p>
              {action && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 h-7 text-xs"
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-transparent"
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose(id), 300);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </Alert>
    </div>
  );
}

class NotificationManager {
  private notifications: Map<string, NotificationProps> = new Map();
  private listeners: Set<(notifications: NotificationProps[]) => void> = new Set();

  show(notification: NotificationProps) {
    const id = Math.random().toString(36).substr(2, 9);
    this.notifications.set(id, notification);
    this.notifyListeners();
    
    // Also use the toast system for compatibility
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'error' ? 'destructive' : 'default',
    });
    
    return id;
  }

  remove(id: string) {
    this.notifications.delete(id);
    this.notifyListeners();
  }

  clear() {
    this.notifications.clear();
    this.notifyListeners();
  }

  subscribe(listener: (notifications: NotificationProps[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const notificationArray = Array.from(this.notifications.entries()).map(([id, notification]) => ({
      ...notification,
      id
    }));
    this.listeners.forEach(listener => listener(notificationArray));
  }

  // Convenience methods
  success(title: string, message: string, action?: NotificationProps['action']) {
    return this.show({ type: 'success', title, message, action });
  }

  error(title: string, message: string, action?: NotificationProps['action']) {
    return this.show({ type: 'error', title, message, action, duration: 8000 });
  }

  warning(title: string, message: string, action?: NotificationProps['action']) {
    return this.show({ type: 'warning', title, message, action });
  }

  info(title: string, message: string, action?: NotificationProps['action']) {
    return this.show({ type: 'info', title, message, action });
  }

  // Login specific notifications
  loginSuccess(userEmail: string) {
    return this.success(
      'Login Successful',
      `Welcome back! You are now logged in as ${userEmail}`,
      {
        label: 'Go to Dashboard',
        onClick: () => window.location.href = '/dashboard'
      }
    );
  }

  loginError(error: string) {
    return this.error(
      'Login Failed',
      error || 'Invalid email or password. Please check your credentials and try again.',
      {
        label: 'Reset Password',
        onClick: () => window.location.href = '/forgot-password'
      }
    );
  }

  paymentSuccess(plan: string) {
    return this.success(
      'Payment Successful',
      `Your ${plan} subscription has been activated! You now have access to all premium features.`,
      {
        label: 'Explore Features',
        onClick: () => window.location.href = '/dashboard'
      }
    );
  }

  paymentError(error: string) {
    return this.error(
      'Payment Failed',
      error || 'Your payment could not be processed. Please try again or contact support.',
      {
        label: 'Try Again',
        onClick: () => window.location.reload()
      }
    );
  }
}

export const notifications = new NotificationManager();

export function NotificationContainer() {
  const [notificationList, setNotificationList] = useState<(NotificationProps & { id: string })[]>([]);

  useEffect(() => {
    const unsubscribe = notifications.subscribe(setNotificationList);
    return unsubscribe;
  }, []);

  if (notificationList.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
      {notificationList.map((notification) => (
        <NotificationItem
          key={notification.id}
          {...notification}
          onClose={notifications.remove.bind(notifications)}
        />
      ))}
    </div>
  );
}

// React hook for using notifications
export function useNotifications() {
  return {
    show: notifications.show.bind(notifications),
    success: notifications.success.bind(notifications),
    error: notifications.error.bind(notifications),
    warning: notifications.warning.bind(notifications),
    info: notifications.info.bind(notifications),
    loginSuccess: notifications.loginSuccess.bind(notifications),
    loginError: notifications.loginError.bind(notifications),
    paymentSuccess: notifications.paymentSuccess.bind(notifications),
    paymentError: notifications.paymentError.bind(notifications),
    clear: notifications.clear.bind(notifications)
  };
}