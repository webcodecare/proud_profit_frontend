import { supabase } from '@/lib/supabase';

export async function createTestNotifications() {
  if (!supabase) {
    console.error('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const testNotifications = [
    {
      user_id: 'admin-user-id',
      channel: 'email',
      recipient: 'admin@proudprofits.com',
      subject: 'BUY Signal Alert - BTC',
      message: 'BUY Signal for BTC at $65,000',

      status: 'delivered',
      priority: 8,
      current_attempts: 1,
      max_retries: 3,
      scheduled_for: new Date(Date.now() - 3600000).toISOString(),
      sent_at: new Date(Date.now() - 3500000).toISOString(),
    },
    {
      user_id: 'admin-user-id',
      channel: 'sms',
      recipient: '+1234567890',
      message: 'SELL Signal: ETH at $3,200',
      status: 'sent',
      priority: 7,
      current_attempts: 1,
      max_retries: 3,
      scheduled_for: new Date(Date.now() - 7200000).toISOString(),
      sent_at: new Date(Date.now() - 7100000).toISOString(),
    },
    {
      user_id: 'admin-user-id',
      channel: 'push',
      recipient: 'push-token-123',
      subject: 'Price Alert',
      message: 'Bitcoin reached your target price of $66,000',
      status: 'delivered',
      priority: 9,
      current_attempts: 1,
      max_retries: 3,
      scheduled_for: new Date(Date.now() - 1800000).toISOString(),
      sent_at: new Date(Date.now() - 1700000).toISOString(),
    },
    {
      user_id: 'admin-user-id',
      channel: 'telegram',
      recipient: '@proudprofits',
      message: '🟢 BUY SIGNAL: SOL at $145',
      status: 'pending',
      priority: 6,
      current_attempts: 0,
      max_retries: 3,
      scheduled_for: new Date().toISOString(),
    },
    {
      user_id: 'admin-user-id',
      channel: 'email',
      recipient: 'user@example.com',
      subject: 'Trading Alert Failed',
      message: 'Failed to send alert for DOGE',
      status: 'failed',
      priority: 5,
      current_attempts: 3,
      max_retries: 3,
      last_error: 'SMTP connection timeout',
      scheduled_for: new Date(Date.now() - 10800000).toISOString(),
    },
  ];

  try {
    // Delete old test notifications first (keep only last 50)
    const { data: existing } = await supabase
      .from('notification_queue')
      .select('id')
      .order('created_at', { ascending: false })
      .range(50, 1000);
    
    if (existing && existing.length > 0) {
      await supabase
        .from('notification_queue')
        .delete()
        .in('id', existing.map(n => n.id));
    }

    // Insert new test data
    const { data, error } = await supabase
      .from('notification_queue')
      .insert(testNotifications)
      .select();

    if (error) {
      console.error('Error creating test notifications:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Created', data?.length || 0, 'test notifications');
    return { success: true, count: data?.length || 0 };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: String(error) };
  }
}

export async function createTestChannels() {
  if (!supabase) {
    console.error('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const testChannels = [
    {
      name: 'Email Service',
      type: 'email',
      is_enabled: true,
      is_healthy: true,
      provider: 'sendgrid',
      config: { smtp_host: 'smtp.sendgrid.net', smtp_port: 587 },
      provider_config: { api_key: 'configured' },
      total_sent: 1245,
      total_delivered: 1180,
      total_failed: 65,
    },
    {
      name: 'SMS Service (Twilio)',
      type: 'sms',
      is_enabled: true,
      is_healthy: true,
      provider: 'twilio',
      config: { from_number: '+12293049137' },
      provider_config: { account_sid: 'configured', auth_token: 'configured' },
      total_sent: 892,
      total_delivered: 875,
      total_failed: 17,
    },
    {
      name: 'Push Notifications',
      type: 'push',
      is_enabled: true,
      is_healthy: true,
      provider: 'firebase',
      config: { fcm_enabled: true },
      provider_config: { server_key: 'configured' },
      total_sent: 2156,
      total_delivered: 2089,
      total_failed: 67,
    },
    {
      name: 'Telegram Bot',
      type: 'telegram',
      is_enabled: false,
      is_healthy: false,
      provider: 'telegram',
      config: { bot_username: 'ProudProfitsBot' },
      provider_config: { bot_token: 'configured' },
      total_sent: 45,
      total_delivered: 38,
      total_failed: 7,
    },
  ];

  try {
    // First, delete existing test channels to avoid duplicates
    await supabase
      .from('notification_channels')
      .delete()
      .in('name', testChannels.map(c => c.name));

    // Now insert fresh test data
    const { data, error } = await supabase
      .from('notification_channels')
      .insert(testChannels)
      .select();

    if (error) {
      console.error('Error creating test channels:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Created', data?.length || 0, 'test channels');
    return { success: true, count: data?.length || 0 };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: String(error) };
  }
}
