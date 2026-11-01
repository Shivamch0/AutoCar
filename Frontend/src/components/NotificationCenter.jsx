import React from 'react';
import { useSocket } from '../context/SocketContext.jsx';
import { notificationsApi } from '../services/api.js';
import { Bell, Check, X, CheckCheck, Clock, ShieldCheck, Car } from 'lucide-react';

export default function NotificationCenter({ isOpen, onClose }) {
  const { notifications, unreadCount, refreshViaPolling } = useSocket();

  if (!isOpen) return null;

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      refreshViaPolling();
    } catch (e) {
      console.warn('Failed to mark read', e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      refreshViaPolling();
    } catch (e) {
      console.warn('Failed to mark all read', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Live Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs flex items-center gap-1"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs space-y-2">
              <Bell className="w-8 h-8 mx-auto opacity-30" />
              <p>No notifications yet</p>
              <p className="text-[11px] opacity-70">
                Live events from Socket.IO or polling will appear here in real-time.
              </p>
            </div>
          ) : (
            notifications.map((notif, index) => (
              <div
                key={notif._id || index}
                onClick={() => notif._id && handleMarkAsRead(notif._id)}
                className={`p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                  notif.isRead
                    ? 'bg-slate-50 dark:bg-slate-850/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    : 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-slate-900 dark:text-slate-100 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span className="font-semibold text-xs text-sky-800 dark:text-sky-300">
                    {notif.title}
                  </span>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0 mt-1"></span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                  {notif.message}
                </p>
                <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString() : 'Just now'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

