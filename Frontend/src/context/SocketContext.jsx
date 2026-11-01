import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { socketManager } from '../services/socketClient.js';
import { useAuth } from './AuthContext.jsx';
import { notificationsApi, bookingsApi } from '../services/api.js';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [transportMode, setTransportMode] = useState('connecting'); // 'websocket' | 'polling'
  const [latestBookingEvent, setLatestBookingEvent] = useState(null);
  const [latestAvailabilityEvent, setLatestAvailabilityEvent] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fallback Polling Worker (Essential for Vercel Serverless deployments)
  const pollUpdates = useCallback(async () => {
    if (!token) return;
    try {
      const [notifsRes, bookingsRes] = await Promise.allSettled([
        notificationsApi.getMy(),
        bookingsApi.getMy()
      ]);

      if (notifsRes.status === 'fulfilled' && notifsRes.value?.data?.data) {
        const notifList = notifsRes.value.data.data;
        setNotifications(notifList);
        setUnreadCount(notifList.filter((n) => !n.isRead).length);
      }

      if (bookingsRes.status === 'fulfilled' && bookingsRes.value?.data?.data) {
        const bookings = bookingsRes.value.data.data;
        if (bookings.length > 0) {
          setLatestBookingEvent({ type: 'poll_sync', booking: bookings[0] });
        }
      }
    } catch (err) {
      console.warn('[HTTP Polling Fallback Error]:', err.message);
    }
  }, [token]);

  useEffect(() => {
    let pollingInterval = null;

    if (token) {
      const socket = socketManager.connect(token);

      const handleConnect = () => {
        setIsConnected(true);
        setTransportMode('websocket');
      };

      const handleDisconnect = () => {
        setIsConnected(false);
        setTransportMode('polling');
      };

      const handleConnectError = () => {
        setIsConnected(false);
        setTransportMode('polling');
      };

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('connect_error', handleConnectError);

      // Event Listeners
      const unsubBookingCreated = socketManager.subscribe('booking:created', (booking) => {
        setLatestBookingEvent({ type: 'created', booking });
      });

      const unsubBookingUpdated = socketManager.subscribe('booking:updated', (booking) => {
        setLatestBookingEvent({ type: 'updated', booking });
      });

      const unsubBookingCancelled = socketManager.subscribe('booking:cancelled', (booking) => {
        setLatestBookingEvent({ type: 'cancelled', booking });
      });

      const unsubAvailability = socketManager.subscribe('garage:availabilityUpdated', (data) => {
        setLatestAvailabilityEvent(data);
      });

      const unsubNotification = socketManager.subscribe('notification:new', (notif) => {
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((c) => c + 1);
      });

      // If socket doesn't connect within 3s or fails, activate HTTP polling fallback
      const timer = setTimeout(() => {
        if (!socket.connected) {
          setTransportMode('polling');
          pollUpdates();
        }
      }, 3000);

      // Setup Polling Interval (runs every 10s if in polling mode or disconnected)
      pollingInterval = setInterval(() => {
        if (!socket.connected) {
          pollUpdates();
        }
      }, 10000);

      // Initial notifications fetch
      pollUpdates();

      return () => {
        clearTimeout(timer);
        if (pollingInterval) clearInterval(pollingInterval);
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('connect_error', handleConnectError);
        unsubBookingCreated();
        unsubBookingUpdated();
        unsubBookingCancelled();
        unsubAvailability();
        unsubNotification();
        socketManager.disconnect();
      };
    } else {
      setIsConnected(false);
      setTransportMode('disconnected');
    }
  }, [token, pollUpdates]);

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        transportMode,
        latestBookingEvent,
        latestAvailabilityEvent,
        notifications,
        unreadCount,
        refreshViaPolling: pollUpdates
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

