# Supabase Real-time Signal Integration Guide

## Overview
This guide shows how to migrate from Neon PostgreSQL to Supabase for real-time buy/sell signal markers on the BTCUSD chart.

## Current Status
- ✅ Working with Neon PostgreSQL
- ✅ 10 trading signals in database
- ✅ Signal markers displaying on chart
- ❌ Need Supabase integration for client requirements

## Supabase Migration Steps

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Get your project URL and anon key
4. Note your database password

### 2. Database Schema Migration
```sql
-- Create alert_signals table in Supabase
CREATE TABLE alert_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker VARCHAR(20) NOT NULL,
    signal_type VARCHAR(10) NOT NULL CHECK (signal_type IN ('buy', 'sell')),
    price DECIMAL(15,2) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    timeframe VARCHAR(10) NOT NULL,
    note TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE alert_signals;

-- Insert sample BTCUSD signals
INSERT INTO alert_signals (ticker, signal_type, price, timestamp, timeframe, note) VALUES
('BTCUSD', 'buy', 15500, '2023-01-15T00:00:00Z', '1W', 'Weekly support level hold'),
('BTCUSD', 'sell', 24000, '2023-04-22T00:00:00Z', '1W', 'Weekly resistance rejection'),
('BTCUSD', 'buy', 19800, '2023-06-18T00:00:00Z', '1W', 'Weekly oversold bounce'),
('BTCUSD', 'sell', 31200, '2023-10-15T00:00:00Z', '1W', 'Weekly trend reversal'),
('BTCUSD', 'buy', 26400, '2023-11-26T00:00:00Z', '1W', 'Weekly accumulation zone'),
('BTCUSD', 'sell', 43800, '2024-03-10T00:00:00Z', '1W', 'Weekly resistance test'),
('BTCUSD', 'buy', 38200, '2024-05-05T00:00:00Z', '1W', 'Weekly dip buy opportunity'),
('BTCUSD', 'sell', 73200, '2024-11-17T00:00:00Z', '1W', 'Weekly cycle peak'),
('BTCUSD', 'buy', 54800, '2024-12-22T00:00:00Z', '1W', 'Weekly holiday support'),
('BTCUSD', 'sell', 92400, '2025-01-05T00:00:00Z', '1W', 'Weekly profit taking');
```

### 3. Environment Variables
```env
# Add to .env file
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Frontend Integration
```typescript
// Install Supabase client
npm install @supabase/supabase-js

// Create supabase client
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

// Real-time subscription for signals
const subscription = supabase
  .channel('alert_signals')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'alert_signals' },
    (payload) => {
      // New signal received - update chart
      console.log('New signal:', payload.new)
    }
  )
  .subscribe()
```

## Benefits of Supabase
- ✅ Real-time updates via WebSocket
- ✅ Built-in authentication
- ✅ Row Level Security
- ✅ Automatic API generation
- ✅ Dashboard for data management

## Next Steps
1. Provide Supabase credentials
2. Migrate database schema
3. Update frontend to use Supabase client
4. Test real-time signal updates