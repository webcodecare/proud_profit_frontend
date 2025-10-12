// import { supabase } from '@/lib/supabase';
// import { RealtimeChannel } from '@supabase/supabase-js';

// export interface AlertSignal {
//   id: string;
//   ticker: string;
//   signal_type: 'buy' | 'sell' | 'price_alert';
//   price: string;
//   timestamp: string;
//   created_at: string;
//   source?: string;
//   note?: string;
// }

// export interface UserNotificationPrefs {
//   user_id: string;
//   email?: string;
//   notification_email: boolean;
//   notification_sms: boolean;
//   notification_push: boolean;
//   notification_telegram: boolean;
//   email_address?: string;
//   phone_number?: string;
//   telegram_chat_id?: string;
//   price_alerts: boolean;
//   volume_alerts: boolean;
//   news_alerts: boolean;
//   technical_alerts: boolean;
//   whale_alerts: boolean;
// }

// class NotificationDeliveryService {
//   private channel: RealtimeChannel | null = null;
//   private isInitialized = false;

//   async initialize() {
//     if (this.isInitialized || !supabase) {
//       console.log('⚠️ Notification delivery service already initialized or Supabase not available');
//       return;
//     }

//     console.log('🚀 Initializing real-time notification delivery service...');

//     // Subscribe to alert_signals table for real-time updates
//     this.channel = supabase
//       .channel('alert-signals-notifications')
//       .on(
//         'postgres_changes',
//         {
//           event: 'INSERT',
//           schema: 'public',
//           table: 'alert_signals'
//         },
//         async (payload) => {
//           console.log('📨 New signal detected:', payload.new);
//           await this.handleNewSignal(payload.new as AlertSignal);
//         }
//       )
//       .subscribe((status) => {
//         if (status === 'SUBSCRIBED') {
//           console.log('✅ Real-time notification delivery service subscribed');
//           this.isInitialized = true;
//         } else if (status === 'CHANNEL_ERROR') {
//           console.error('❌ Error subscribing to alert signals');
//         }
//       });
//   }

//   async handleNewSignal(signal: AlertSignal) {
//     try {
//       console.log(`🔔 Processing notifications for signal: ${signal.ticker} ${signal.signal_type} at $${signal.price}`);

//       // Fetch all users with their notification preferences
//       const { data: users, error: usersError } = await supabase!
//         .from('user_settings')
//         .select(`
//           user_id,
//           notification_email,
//           notification_sms,
//           notification_push,
//           notification_telegram,
//           email_address,
//           phone_number,
//           telegram_chat_id,
//           price_alerts,
//           volume_alerts,
//           news_alerts,
//           technical_alerts,
//           whale_alerts
//         `);

//       if (usersError) {
//         console.error('Error fetching users:', usersError);
//         return;
//       }

//       if (!users || users.length === 0) {
//         console.log('⚠️ No users found with notification preferences');
//         return;
//       }

//       // Get user emails from users table
//       const { data: userEmails, error: emailError } = await supabase!
//         .from('users')
//         .select('id, email')
//         .in('id', users.map(u => u.user_id));

//       if (emailError) {
//         console.error('Error fetching user emails:', emailError);
//       }

//       const emailMap = new Map(userEmails?.map(u => [u.id, u.email]) || []);

//       // Create notification tasks for each user based on their preferences
//       const notificationTasks: any[] = [];

//       for (const user of users) {
//         const userEmail = emailMap.get(user.user_id) || user.email_address;

//         // Check if user has the alert type enabled (default to true for backward compatibility)
//         const alertTypeEnabled = this.isAlertTypeEnabled(signal, user);
        
//         if (!alertTypeEnabled) {
//           console.log(`⏭️ User ${user.user_id} has this alert type disabled`);
//           continue;
//         }

//         const message = this.formatSignalMessage(signal);
//         const subject = this.formatSignalSubject(signal);

//         // Email notification
//         if (user.notification_email && userEmail) {
//           notificationTasks.push({
//             user_id: user.user_id,
//             alert_id: signal.id,
//             channel: 'email',
//             recipient: userEmail,
//             subject: subject,
//             message: message,
//             status: 'pending',
//             priority: this.getSignalPriority(signal),
//             current_attempts: 0,
//             max_retries: 3,
//             scheduled_for: new Date().toISOString(),
//           });
//         }

//         // SMS notification
//         if (user.notification_sms && user.phone_number) {
//           notificationTasks.push({
//             user_id: user.user_id,
//             alert_id: signal.id,
//             channel: 'sms',
//             recipient: user.phone_number,
//             message: this.formatSMSMessage(signal),
//             status: 'pending',
//             priority: this.getSignalPriority(signal),
//             current_attempts: 0,
//             max_retries: 3,
//             scheduled_for: new Date().toISOString(),
//           });
//         }

//         // Push notification
//         if (user.notification_push) {
//           notificationTasks.push({
//             user_id: user.user_id,
//             alert_id: signal.id,
//             channel: 'push',
//             recipient: user.user_id, // Will use push subscription from user_settings
//             subject: subject,
//             message: message,
//             status: 'pending',
//             priority: this.getSignalPriority(signal),
//             current_attempts: 0,
//             max_retries: 3,
//             scheduled_for: new Date().toISOString(),
//           });
//         }

//         // Telegram notification
//         if (user.notification_telegram && user.telegram_chat_id) {
//           notificationTasks.push({
//             user_id: user.user_id,
//             alert_id: signal.id,
//             channel: 'telegram',
//             recipient: user.telegram_chat_id,
//             message: this.formatTelegramMessage(signal),
//             status: 'pending',
//             priority: this.getSignalPriority(signal),
//             current_attempts: 0,
//             max_retries: 3,
//             scheduled_for: new Date().toISOString(),
//           });
//         }
//       }

//       // Batch insert notification tasks to queue
//       if (notificationTasks.length > 0) {
//         const { data, error } = await supabase!
//           .from('notification_queue')
//           .insert(notificationTasks)
//           .select();

//         if (error) {
//           console.error('❌ Error creating notification tasks:', error);
//         } else {
//           console.log(`✅ Created ${notificationTasks.length} notification tasks for signal ${signal.id}`);
          
//           // Trigger immediate processing of notifications
//           await this.processNotificationQueue();
//         }
//       } else {
//         console.log('⚠️ No notification tasks created (no users with enabled channels)');
//       }

//     } catch (error) {
//       console.error('❌ Error handling new signal:', error);
//     }
//   }

//   private isAlertTypeEnabled(signal: AlertSignal, user: UserNotificationPrefs): boolean {
//     // Map signal types to user preferences
//     const signalType = signal.signal_type?.toLowerCase();
    
//     if (signalType === 'price_alert' || signalType === 'buy' || signalType === 'sell') {
//       return user.price_alerts ?? true; // Default to enabled
//     }
    
//     // For other types, default to enabled
//     return true;
//   }

//   private formatSignalMessage(signal: AlertSignal): string {
//     const emoji = signal.signal_type === 'buy' ? '🟢' : signal.signal_type === 'sell' ? '🔴' : '⚠️';
//     const action = signal.signal_type?.toUpperCase() || 'ALERT';
    
//     return `${emoji} ${action} SIGNAL: ${signal.ticker} at $${signal.price}\n\n` +
//            `Time: ${new Date(signal.timestamp || signal.created_at).toLocaleString()}\n` +
//            (signal.note ? `\nNote: ${signal.note}` : '');
//   }

//   private formatSignalSubject(signal: AlertSignal): string {
//     const action = signal.signal_type?.toUpperCase() || 'ALERT';
//     return `${action} Signal: ${signal.ticker} at $${signal.price}`;
//   }

//   private formatSMSMessage(signal: AlertSignal): string {
//     const emoji = signal.signal_type === 'buy' ? '🟢' : signal.signal_type === 'sell' ? '🔴' : '⚠️';
//     const action = signal.signal_type?.toUpperCase() || 'ALERT';
//     return `${emoji} ${action}: ${signal.ticker} @ $${signal.price}`;
//   }

//   private formatTelegramMessage(signal: AlertSignal): string {
//     const emoji = signal.signal_type === 'buy' ? '🟢' : signal.signal_type === 'sell' ? '🔴' : '⚠️';
//     const action = signal.signal_type?.toUpperCase() || 'ALERT';
    
//     return `${emoji} <b>${action} SIGNAL</b>\n\n` +
//            `<b>Ticker:</b> ${signal.ticker}\n` +
//            `<b>Price:</b> $${signal.price}\n` +
//            `<b>Time:</b> ${new Date(signal.timestamp || signal.created_at).toLocaleString()}\n` +
//            (signal.note ? `\n<i>${signal.note}</i>` : '');
//   }

//   private getSignalPriority(signal: AlertSignal): number {
//     // Higher priority for buy/sell signals
//     if (signal.signal_type === 'buy' || signal.signal_type === 'sell') {
//       return 8;
//     }
//     return 6;
//   }

//   async processNotificationQueue() {
//     try {
//       // Fetch pending notifications
//       const { data: pendingNotifications, error } = await supabase!
//         .from('notification_queue')
//         .select('*')
//         .eq('status', 'pending')
//         .order('priority', { ascending: false })
//         .order('created_at', { ascending: true })
//         .limit(50);

//       if (error) {
//         console.error('Error fetching pending notifications:', error);
//         return;
//       }

//       if (!pendingNotifications || pendingNotifications.length === 0) {
//         return;
//       }

//       console.log(`📤 Processing ${pendingNotifications.length} pending notifications...`);

//       for (const notification of pendingNotifications) {
//         await this.sendNotification(notification);
//       }

//     } catch (error) {
//       console.error('Error processing notification queue:', error);
//     }
//   }

//   private async sendNotification(notification: any) {
//     try {
//       // Update status to processing
//       await supabase!
//         .from('notification_queue')
//         .update({ status: 'processing' })
//         .eq('id', notification.id);

//       let success = false;
//       let error = null;

//       switch (notification.channel) {
//         case 'email':
//           success = await this.sendEmail(notification);
//           break;
//         case 'sms':
//           success = await this.sendSMS(notification);
//           break;
//         case 'push':
//           success = await this.sendPush(notification);
//           break;
//         case 'telegram':
//           success = await this.sendTelegram(notification);
//           break;
//         default:
//           console.warn(`Unknown channel: ${notification.channel}`);
//       }

//       // Update notification status
//       if (success) {
//         await supabase!
//           .from('notification_queue')
//           .update({ 
//             status: 'sent',
//             sent_at: new Date().toISOString(),
//             current_attempts: notification.current_attempts + 1
//           })
//           .eq('id', notification.id);

//         console.log(`✅ ${notification.channel} notification sent to ${notification.recipient}`);
//       } else {
//         const newAttempts = notification.current_attempts + 1;
//         const newStatus = newAttempts >= notification.max_retries ? 'failed' : 'pending';
        
//         await supabase!
//           .from('notification_queue')
//           .update({ 
//             status: newStatus,
//             current_attempts: newAttempts,
//             last_error: error || 'Unknown error'
//           })
//           .eq('id', notification.id);

//         console.error(`❌ Failed to send ${notification.channel} notification (attempt ${newAttempts}/${notification.max_retries})`);
//       }

//     } catch (error: any) {
//       console.error(`Error sending notification ${notification.id}:`, error);
      
//       await supabase!
//         .from('notification_queue')
//         .update({ 
//           status: 'failed',
//           last_error: error?.message || 'Unknown error'
//         })
//         .eq('id', notification.id);
//     }
//   }

//   private async sendEmail(notification: any): Promise<boolean> {
//     // Check for Resend API key
//     const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;
    
//     if (!resendApiKey) {
//       console.warn('⚠️ RESEND_API_KEY not configured, email not sent (demo mode)');
//       return true; // Return true in demo mode
//     }

//     try {
//       const response = await fetch('https://api.resend.com/emails', {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${resendApiKey}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           from: 'Proud Profits <signals@proudprofits.com>',
//           to: [notification.recipient],
//           subject: notification.subject,
//           html: `<div style="font-family: Arial, sans-serif;">
//             <h2>${notification.subject}</h2>
//             <pre style="white-space: pre-wrap; font-family: monospace;">${notification.message}</pre>
//             <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
//             <p style="color: #666; font-size: 12px;">This is an automated trading signal from Proud Profits. 
//             Visit your <a href="${window.location.origin}/settings">settings</a> to manage notifications.</p>
//           </div>`,
//         }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         console.error('Resend API error:', errorData);
//         return false;
//       }

//       return true;
//     } catch (error) {
//       console.error('Email send error:', error);
//       return false;
//     }
//   }

//   private async sendSMS(notification: any): Promise<boolean> {
//     // Check for Twilio credentials
//     const twilioAccountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
//     const twilioAuthToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
//     const twilioPhoneNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER;
    
//     if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
//       console.warn('⚠️ Twilio credentials not configured, SMS not sent (demo mode)');
//       return true; // Return true in demo mode
//     }

//     try {
//       const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
      
//       const response = await fetch(
//         `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
//         {
//           method: 'POST',
//           headers: {
//             'Authorization': `Basic ${auth}`,
//             'Content-Type': 'application/x-www-form-urlencoded',
//           },
//           body: new URLSearchParams({
//             From: twilioPhoneNumber,
//             To: notification.recipient,
//             Body: notification.message,
//           }),
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         console.error('Twilio API error:', errorData);
//         return false;
//       }

//       return true;
//     } catch (error) {
//       console.error('SMS send error:', error);
//       return false;
//     }
//   }

//   private async sendPush(notification: any): Promise<boolean> {
//     // Browser push notifications
//     if ('Notification' in window && Notification.permission === 'granted') {
//       try {
//         new Notification(notification.subject || 'Trading Signal', {
//           body: notification.message,
//           icon: '/logo.png',
//           badge: '/logo.png',
//           tag: `signal-${notification.alert_id}`,
//         });
//         return true;
//       } catch (error) {
//         console.error('Push notification error:', error);
//         return false;
//       }
//     }
    
//     console.warn('⚠️ Push notifications not available or permission not granted');
//     return false;
//   }

//   private async sendTelegram(notification: any): Promise<boolean> {
//     // Check for Telegram bot token
//     const telegramBotToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    
//     if (!telegramBotToken) {
//       console.warn('⚠️ TELEGRAM_BOT_TOKEN not configured, telegram not sent (demo mode)');
//       return true; // Return true in demo mode
//     }

//     try {
//       const response = await fetch(
//         `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
//         {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             chat_id: notification.recipient,
//             text: notification.message,
//             parse_mode: 'HTML',
//           }),
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         console.error('Telegram API error:', errorData);
//         return false;
//       }

//       return true;
//     } catch (error) {
//       console.error('Telegram send error:', error);
//       return false;
//     }
//   }

//   cleanup() {
//     if (this.channel) {
//       supabase?.removeChannel(this.channel);
//       this.channel = null;
//       this.isInitialized = false;
//       console.log('🧹 Notification delivery service cleaned up');
//     }
//   }
// }

// // Singleton instance
// export const notificationDeliveryService = new NotificationDeliveryService();


export default function NotificationInitializer() {
  return null;
}
