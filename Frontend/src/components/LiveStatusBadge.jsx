import React from 'react';
import { useSocket } from '../context/SocketContext.jsx';
import { Radio, RefreshCw, WifiOff } from 'lucide-react';

export default function LiveStatusBadge() {
  const { isConnected, transportMode, refreshViaPolling } = useSocket();

  if (isConnected && transportMode === 'websocket') {
    return (
      <div
        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
        title="Connected to persistent Socket.IO server. Receiving instant live booking and availability broadcasts."
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="hidden sm:inline">Socket.IO Live</span>
        <span className="sm:hidden">Live</span>
      </div>
    );
  }

  if (transportMode === 'polling') {
    return (
      <div
        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800"
        title="Operating in Vercel Serverless mode: persistent WebSockets are unavailable, so short-interval HTTP polling is maintaining real-time updates."
      >
        <RefreshCw className="w-3 h-3 text-amber-600 dark:text-amber-400 animate-spin" />
        <span className="hidden sm:inline">Polling Fallback (Serverless)</span>
        <span className="sm:hidden">Polling</span>
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
      title="Real-time transport disconnected. Click to refresh manually."
      onClick={refreshViaPolling}
    >
      <WifiOff className="w-3 h-3 text-slate-400" />
      <span>Offline</span>
    </div>
  );
}

