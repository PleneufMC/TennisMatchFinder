'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

/**
 * Debug page to check session state
 * /debug-session
 * 
 * TEMPORARY - Remove after debugging
 */
export default function DebugSessionPage() {
  const { data: session, status } = useSession();
  const [cookies, setCookies] = useState<string>('');
  const [apiSession, setApiSession] = useState<any>(null);

  useEffect(() => {
    // Get cookies (only non-httponly ones visible to JS)
    setCookies(document.cookie);
    
    // Also try to get session from API
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => setApiSession(data))
      .catch(err => setApiSession({ error: err.message }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">🔍 Debug Session</h1>
        
        {/* useSession Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">useSession() Hook</h2>
          <div className="space-y-2">
            <p><strong>Status:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{status}</code></p>
            <p><strong>Has Session:</strong> {session ? '✅ Yes' : '❌ No'}</p>
            {session && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
        
        {/* API Session */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">API /api/auth/session</h2>
          <div className="p-4 bg-gray-50 rounded">
            <pre className="text-sm overflow-auto">
              {apiSession ? JSON.stringify(apiSession, null, 2) : 'Loading...'}
            </pre>
          </div>
        </div>
        
        {/* Cookies */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Cookies (JS visible)</h2>
          <p className="text-sm text-gray-600 mb-2">
            Note: HttpOnly cookies (like session tokens) are not visible to JavaScript.
          </p>
          <div className="p-4 bg-gray-50 rounded">
            <pre className="text-sm overflow-auto whitespace-pre-wrap">
              {cookies || '(No JS-visible cookies)'}
            </pre>
          </div>
        </div>
        
        {/* Player Data */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Player Data</h2>
          <div className="space-y-2">
            <p><strong>Has Player:</strong> {(session?.user as any)?.player ? '✅ Yes' : '❌ No'}</p>
            {(session?.user as any)?.player && (
              <div className="mt-4 p-4 bg-green-50 rounded">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify((session?.user as any)?.player, null, 2)}
                </pre>
              </div>
            )}
            {status === 'authenticated' && !(session?.user as any)?.player && (
              <div className="mt-4 p-4 bg-yellow-50 rounded border border-yellow-200">
                <p className="text-yellow-800 font-medium">⚠️ Authenticated but no player!</p>
                <p className="text-sm text-yellow-600 mt-2">
                  This is likely the cause of the redirect issue. The session callback
                  may not be fetching the player correctly.
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="flex gap-4">
            <a 
              href="/dashboard" 
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Try Dashboard →
            </a>
            <a 
              href="/login" 
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Go to Login
            </a>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
