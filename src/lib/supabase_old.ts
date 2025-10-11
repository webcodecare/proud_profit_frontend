import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://your-project.supabase.co'
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

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