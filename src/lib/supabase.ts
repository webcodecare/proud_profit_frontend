import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Debug environment variables
console.log('Supabase Config Debug:', {
  url: supabaseUrl ? 'present' : 'missing',
  key: supabaseAnonKey ? 'present' : 'missing',
  urlLength: supabaseUrl?.length,
  keyLength: supabaseAnonKey?.length
});

// Make Supabase client optional if environment variables are not set
let supabase: any = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    console.log('✅ Supabase client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
    supabase = null;
  }
} else {
  console.warn('Supabase client not initialized - missing environment variables:', {
    VITE_SUPABASE_URL: supabaseUrl ? 'present' : 'missing',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'present' : 'missing'
  });
}

export { supabase };

// Types for Supabase Realtime
export interface AlertSignalRealtime {
  id: string
  user_id: string | null
  ticker: string
  signal_type: 'buy' | 'sell'
  price: number
  timestamp: string
  timeframe: string
  strategy?: string
  source: string
  note?: string
  created_at: string
}

export interface RealtimePayload {
  new: AlertSignalRealtime
  old?: AlertSignalRealtime
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
}