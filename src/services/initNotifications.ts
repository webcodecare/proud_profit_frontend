import { notificationDeliveryService } from './notificationDeliveryService';

let isInitialized = false;

export function initializeNotificationSystem() {
  if (isInitialized) {
    console.log('⚠️ Notification system already initialized');
    return;
  }

  console.log('🔔 Initializing notification system...');
  
  // Initialize the real-time notification delivery service
  notificationDeliveryService.initialize();
  
  isInitialized = true;
  console.log('✅ Notification system initialized');
}

export function cleanupNotificationSystem() {
  if (isInitialized) {
    notificationDeliveryService.cleanup();
    isInitialized = false;
    console.log('🧹 Notification system cleaned up');
  }
}
