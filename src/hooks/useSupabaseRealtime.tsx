import { useEffect, useState, useCallback } from 'react'
import { supabase, type AlertSignalRealtime, type RealtimePayload } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export interface RealtimeAlert {
  id: string
  userId: string | null
  ticker: string
  signalType: 'buy' | 'sell'
  price: number
  timestamp: string
  timeframe: string
  strategy?: string
  source: string
  note?: string
  createdAt: string
}

export function useSupabaseRealtime() {
  const { user } = useAuth()
  const [realtimeAlerts, setRealtimeAlerts] = useState<RealtimeAlert[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // Transform Supabase alert to our format
  const transformAlert = useCallback((alert: AlertSignalRealtime): RealtimeAlert => ({
    id: alert.id,
    userId: alert.user_id,
    ticker: alert.ticker,
    signalType: alert.signal_type,
    price: alert.price,
    timestamp: alert.timestamp,
    timeframe: alert.timeframe,
    strategy: alert.strategy,
    source: alert.source,
    note: alert.note,
    createdAt: alert.created_at
  }), [])

  useEffect(() => {
    // Skip Supabase connection if environment variables are not set
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co') {
      console.warn('Supabase URL not configured, using fallback WebSocket')
      setConnectionError('Supabase not configured')
      return
    }

    // Set up Supabase Realtime subscription for alert_signals table
    const channel = supabase
      .channel('alert_signals_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alert_signals',
          // Filter by user_id if user is authenticated, otherwise get all system alerts
          filter: user ? `user_id=eq.${user.id}` : 'user_id=is.null'
        },
        (payload: RealtimePayload) => {
          console.log('Supabase Realtime: New alert received', payload)
          
          const newAlert = transformAlert(payload.new)
          setRealtimeAlerts(prev => [newAlert, ...prev.slice(0, 49)]) // Keep last 50 alerts
          
          // Trigger chart marker update
          window.dispatchEvent(new CustomEvent('new-trading-signal', {
            detail: newAlert
          }))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'alert_signals',
          filter: user ? `user_id=eq.${user.id}` : 'user_id=is.null'
        },
        (payload: RealtimePayload) => {
          console.log('Supabase Realtime: Alert updated', payload)
          
          const updatedAlert = transformAlert(payload.new)
          setRealtimeAlerts(prev => 
            prev.map(alert => alert.id === updatedAlert.id ? updatedAlert : alert)
          )
        }
      )
      .subscribe((status) => {
        console.log('Supabase Realtime status:', status)
        setIsConnected(status === 'SUBSCRIBED')
        
        if (status === 'CHANNEL_ERROR') {
          setConnectionError('Realtime subscription failed')
        } else if (status === 'SUBSCRIBED') {
          setConnectionError(null)
        }
      })

    return () => {
      console.log('Cleaning up Supabase Realtime subscription')
      supabase.removeChannel(channel)
    }
  }, [user, transformAlert])

  // Clear alerts when user changes
  useEffect(() => {
    setRealtimeAlerts([])
  }, [user?.id])

  return {
    realtimeAlerts,
    isConnected,
    connectionError,
    clearAlerts: () => setRealtimeAlerts([])
  }
}

// Hook specifically for chart marker updates
export function useRealtimeChartMarkers(ticker: string, onNewSignal?: (alert: RealtimeAlert) => void) {
  const { realtimeAlerts } = useSupabaseRealtime()
  
  useEffect(() => {
    const handleNewSignal = (event: CustomEvent<RealtimeAlert>) => {
      const alert = event.detail
      
      // Only process alerts for the current ticker
      if (alert.ticker === ticker && onNewSignal) {
        onNewSignal(alert)
      }
    }

    // Listen for new trading signals
    window.addEventListener('new-trading-signal', handleNewSignal as EventListener)
    
    return () => {
      window.removeEventListener('new-trading-signal', handleNewSignal as EventListener)
    }
  }, [ticker, onNewSignal])

  // Return filtered alerts for the specific ticker
  const tickerAlerts = realtimeAlerts.filter(alert => alert.ticker === ticker)
  
  return {
    tickerAlerts,
    latestAlert: tickerAlerts[0] || null
  }
}