import { createClient } from '@supabase/supabase-js';


 const SUPABASE_URL = process.env.SUPABASE_URL || '';
 const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';


 const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
  const TWILIO_PHONE = process.env.TWILIO_PHONE || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface NotificationData {
  ticker: string;
  signalType: 'buy' | 'sell';
  price: number;
  timeframe?: string;
  note?: string;
}

async function sendEmailNotification(email: string, data: NotificationData) {
  try {
    const subject = `${data.signalType.toUpperCase()} Signal Alert - ${data.ticker}`;
    const body = `
${data.signalType.toUpperCase()} SIGNAL ALERT

Ticker: ${data.ticker}
Price: $${data.price}
${data.timeframe ? `Timeframe: ${data.timeframe}` : ''}
${data.note ? `Note: ${data.note}` : ''}

Signal generated at ${new Date().toLocaleString()}
    `.trim();
    
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: 'default_service',
        template_id: 'signal_alert',
        user_id: 'public_key',
        template_params: {
          to_email: email,
          subject,
          message: body,
          ticker: data.ticker,
          price: data.price,
          signal_type: data.signalType
        }
      })
    });
    
    console.log(`✉️ Email notification queued for ${email}`);
    return { success: true, channel: 'email' };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, channel: 'email', error };
  }
}

async function sendSMSNotification(phoneNumber: string, data: NotificationData) {
  try {
    const message = `${data.signalType.toUpperCase()} Signal: ${data.ticker} at $${data.price}${data.timeframe ? ` (${data.timeframe})` : ''}`;
    
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: phoneNumber,
        From: TWILIO_PHONE,
        Body: message
      })
    });
    
    if (response.ok) {
      console.log(`📱 SMS sent to ${phoneNumber}`);
      return { success: true, channel: 'sms' };
    } else {
      const error = await response.text();
      console.error('SMS error:', error);
      return { success: false, channel: 'sms', error };
    }
  } catch (error) {
    console.error('SMS error:', error);
    return { success: false, channel: 'sms', error };
  }
}

async function sendTelegramNotification(chatId: string, data: NotificationData) {
  try {
    const emoji = data.signalType === 'buy' ? '🟢' : '🔴';
    const message = `
${emoji} *${data.signalType.toUpperCase()} SIGNAL ALERT*

📊 *Ticker:* ${data.ticker}
💰 *Price:* $${data.price}
${data.timeframe ? `⏰ *Timeframe:* ${data.timeframe}` : ''}
${data.note ? `📝 *Note:* ${data.note}` : ''}

🕐 ${new Date().toLocaleString()}
    `.trim();
    
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });
    
    if (response.ok) {
      console.log(`💬 Telegram sent to ${chatId}`);
      return { success: true, channel: 'telegram' };
    } else {
      const error = await response.text();
      console.error('Telegram error:', error);
      return { success: false, channel: 'telegram', error };
    }
  } catch (error) {
    console.error('Telegram error:', error);
    return { success: false, channel: 'telegram', error };
  }
}

async function sendPushNotification(fcmToken: string, data: NotificationData) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${data.signalType.toUpperCase()} Signal Alert`, {
        body: `${data.ticker} at $${data.price}${data.timeframe ? ` (${data.timeframe})` : ''}`,
        icon: '/logo.png',
        badge: '/badge.png',
        tag: `signal-${Date.now()}`
      });
      
      console.log(`🔔 Push notification sent`);
      return { success: true, channel: 'push' };
    } else {
      console.log('Push notifications not available or not permitted');
      return { success: false, channel: 'push', error: 'Not permitted' };
    }
  } catch (error) {
    console.error('Push error:', error);
    return { success: false, channel: 'push', error };
  }
}

export async function sendNotificationsForSignal(signalData: NotificationData) {
  try {
    const { data: users, error } = await supabase
      .from('user_settings')
      .select(`
        userId,
        notificationEmail,
        notificationSms,
        notificationPush,
        notificationTelegram,
        emailAddress,
        phoneNumber,
        telegramChatId,
        pushSubscription
      `)
      .or('notificationEmail.eq.true,notificationSms.eq.true,notificationPush.eq.true,notificationTelegram.eq.true');
    
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    const notifications = [];
    
    for (const user of users || []) {
      if (user.notificationEmail && user.emailAddress) {
        notifications.push(sendEmailNotification(user.emailAddress, signalData));
      }
      
      if (user.notificationSms && user.phoneNumber) {
        notifications.push(sendSMSNotification(user.phoneNumber, signalData));
      }
      
      if (user.notificationTelegram && user.telegramChatId) {
        notifications.push(sendTelegramNotification(user.telegramChatId, signalData));
      }
      
      if (user.notificationPush) {
        notifications.push(sendPushNotification('', signalData));
      }
    }
    
    const results = await Promise.allSettled(notifications);
    console.log(`✅ Sent ${results.filter(r => r.status === 'fulfilled').length}/${results.length} notifications`);
    
    return results;
  } catch (error) {
    console.error('Error sending notifications:', error);
    throw error;
  }
}

export function subscribeToSignals(callback: (signal: any) => void) {
  const channel = supabase
    .channel('alert_signals_channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'alert_signals'
      },
      async (payload) => {
        console.log('🔔 New signal detected:', payload.new);
        
        const signalData: NotificationData = {
          ticker: payload.new.ticker,
          signalType: payload.new.signalType || payload.new.signal_type,
          price: parseFloat(payload.new.price),
          timeframe: payload.new.timeframe,
          note: payload.new.note
        };
        
        await sendNotificationsForSignal(signalData);
        
        callback(payload.new);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}
