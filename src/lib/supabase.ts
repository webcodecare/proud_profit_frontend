import { createClient } from '@supabase/supabase-js'

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Only create client if both URL and key are provided
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null;

// Log configuration for debugging
if (supabase) {
  console.log('✅ Supabase client initialized with URL:', supabaseUrl.substring(0, 30) + '...');
} else {
  console.warn('⚠️ Supabase client not initialized - missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}
