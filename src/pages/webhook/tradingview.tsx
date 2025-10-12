import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// This is a webhook endpoint page that handles TradingView webhook POST requests
// It should be accessed at /webhook/tradingview

export default function TradingViewWebhook() {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Handle POST requests from TradingView
    const handleWebhookRequest = async () => {
      // This would normally be handled by a backend endpoint
      // For now, we'll show instructions on how to set it up
      setStatus('idle');
      setMessage('Webhook endpoint requires backend setup. Please use the backend API endpoint: /api/webhook/tradingview');
    };

    handleWebhookRequest();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-4">TradingView Webhook Endpoint</h1>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="font-semibold text-blue-900 mb-2">Setup Instructions</h2>
            <p className="text-blue-700 text-sm">
              Configure your TradingView alert to send a webhook to this endpoint with the following format:
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Webhook URL:</h3>
            <code className="block bg-gray-800 text-white p-3 rounded text-sm break-all">
              {window.location.origin}/api/webhook/tradingview
            </code>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Webhook Payload Format:</h3>
            <pre className="bg-gray-800 text-white p-3 rounded text-sm overflow-x-auto">
{`{
  "ticker": "BTCUSDT",
  "signal_type": "buy",  // or "sell"
  "price": "65000.50",
  "timestamp": "2024-01-01T12:00:00Z",
  "note": "Optional note",
  "webhook_secret": "your-webhook-secret"
}`}
            </pre>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">Security Note:</h3>
            <p className="text-yellow-700 text-sm">
              Make sure to include your webhook secret in the payload for authentication. 
              Configure this in your admin settings.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">What Happens Next:</h3>
            <ul className="list-disc list-inside text-green-700 text-sm space-y-1">
              <li>Signal is saved to alert_signals table</li>
              <li>Admin page shows it instantly (real-time)</li>
              <li>Users receive notifications via Email, SMS, Push, or Telegram</li>
              <li>Notifications are sent based on user preferences</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Note:</strong> This frontend page is for information only. 
            The actual webhook processing happens on the backend at <code>/api/webhook/tradingview</code>
          </p>
        </div>
      </div>
    </div>
  );
}
