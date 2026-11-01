import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketClientManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.connectionFailed = false;
  }

  connect(token = null) {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(SOCKET_SERVER_URL, {
      auth: { token: token || localStorage.getItem('autonear_access_token') },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 4,
      reconnectionDelay: 1500,
      timeout: 4000
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.connectionFailed = false;
      console.log(`[SocketClient] Connected to Real-Time server: ${this.socket.id}`);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log(`[SocketClient] Disconnected: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      this.isConnected = false;
      this.connectionFailed = true;
      console.warn('[SocketClient] Connection error (falling back to polling):', error.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('[SocketClient] Disconnected and cleaned up.');
    }
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }

    return () => {
      this.unsubscribe(event, callback);
    };
  }

  unsubscribe(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  joinGarage(garageId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe:garage', garageId);
    }
  }

  leaveGarage(garageId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe:garage', garageId);
    }
  }
}

export const socketManager = new SocketClientManager();

