import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  DollarSign,
  Activity
} from 'lucide-react';

export interface ContextualAlertData {
  id: string;
  type: 'signal' | 'price' | 'news' | 'system' | 'achievement';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  autoClose?: boolean;
  duration?: number;
  metadata?: {
    symbol?: string;
    price?: number;
    change?: number;
    signalType?: 'buy' | 'sell';
    action?: {
      label: string;
      onClick: () => void;
    };
  };
}

interface ContextualAlertProps {
  alerts: ContextualAlertData[];
  onDismiss: (alertId: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export default function ContextualAlert({ 
  alerts, 
  onDismiss, 
  position = 'top-right' 
}: ContextualAlertProps) {
  const [visibleAlerts, setVisibleAlerts] = useState<ContextualAlertData[]>(alerts);

  useEffect(() => {
    setVisibleAlerts(alerts);
    
    // Handle auto-close alerts
    alerts.forEach(alert => {
      if (alert.autoClose !== false) {
        const duration = alert.duration || getDurationByPriority(alert.priority);
        setTimeout(() => {
          onDismiss(alert.id);
        }, duration);
      }
    });
  }, [alerts, onDismiss]);

  const getDurationByPriority = (priority: string) => {
    switch (priority) {
      case 'critical': return 10000; // 10 seconds
      case 'high': return 8000;     // 8 seconds
      case 'medium': return 6000;   // 6 seconds
      case 'low': return 4000;      // 4 seconds
      default: return 6000;
    }
  };

  const getAlertIcon = (type: string, signalType?: string) => {
    switch (type) {
      case 'signal':
        return signalType === 'buy' ? (
          <TrendingUp className="h-5 w-5 text-green-500" />
        ) : (
          <TrendingDown className="h-5 w-5 text-red-500" />
        );
      case 'price':
        return <DollarSign className="h-5 w-5 text-blue-500" />;
      case 'news':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'system':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'achievement':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertColors = (priority: string, type: string) => {
    if (priority === 'critical') {
      return 'border-red-500 bg-red-50 dark:bg-red-950/20';
    }
    if (priority === 'high') {
      return 'border-orange-500 bg-orange-50 dark:bg-orange-950/20';
    }
    if (type === 'signal') {
      return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20';
    }
    return 'border-gray-200 bg-white dark:bg-gray-950';
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-3 max-w-sm w-full`}>
      <AnimatePresence>
        {visibleAlerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: position.includes('right') ? 300 : -300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ 
              opacity: 0, 
              x: position.includes('right') ? 300 : -300, 
              scale: 0.8,
              transition: { duration: 0.2 }
            }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 30,
              delay: index * 0.1
            }}
            className="w-full"
          >
            <Card className={`border-2 shadow-lg ${getAlertColors(alert.priority, alert.type)}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.type, alert.metadata?.signalType)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm">{alert.title}</h4>
                      <div className="flex items-center gap-2">
                        {alert.priority === 'critical' && (
                          <Badge variant="destructive" className="text-xs">
                            Critical
                          </Badge>
                        )}
                        {alert.priority === 'high' && (
                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                            High
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onDismiss(alert.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {alert.message}
                    </p>
                    
                    {alert.metadata && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs">
                          {alert.metadata.symbol && (
                            <Badge variant="outline" className="text-xs font-mono">
                              {alert.metadata.symbol}
                            </Badge>
                          )}
                          {alert.metadata.price && (
                            <span className="font-medium">
                              ${alert.metadata.price.toLocaleString()}
                            </span>
                          )}
                          {alert.metadata.change && (
                            <span className={`font-medium ${
                              alert.metadata.change >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {alert.metadata.change >= 0 ? '+' : ''}{alert.metadata.change.toFixed(2)}%
                            </span>
                          )}
                        </div>
                        
                        {alert.metadata.action && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={alert.metadata.action.onClick}
                          >
                            {alert.metadata.action.label}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}