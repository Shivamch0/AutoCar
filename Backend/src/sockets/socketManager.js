import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { SOCKET_EVENTS } from '../config/constants.js';

let ioInstance = null;

/**
 * Initializes Socket.IO on the persistent Node.js HTTP server.
 * Reusable and decoupled from Express app logic.
 */
export function initSocketServer(httpServer, corsOrigin = '*') {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true
    },
    pingTimeout: 30000,
    pingInterval: 25000
  });

  // Socket authentication middleware
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization?.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.split(' ')[1]
          : null);

      if (token) {
        try {
          const secret = process.env.JWT_ACCESS_SECRET || 'autonear_access_secret_super_secure_key_2026';
          const decoded = jwt.verify(token, secret);
          socket.user = decoded; // { id, role, garageId }
        } catch (err) {
          console.warn('[Socket Auth] Invalid or expired JWT token, proceeding as guest listener.');
          socket.user = null;
        }
      } else {
        socket.user = null;
      }
      next();
    } catch (e) {
      next(new Error('Socket authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user?.id || 'guest';
    const role = socket.user?.role || 'guest';
    console.log(`[Socket] Client connected: ${socket.id} (User: ${userId}, Role: ${role})`);

    // Public room for garage discovery & availability updates
    socket.join('public_garages');

    // Authenticated role-based room subscriptions
    if (socket.user) {
      socket.join(`user_${socket.user.id}`);
      socket.join(`role_${socket.user.role}`);

      if (socket.user.garageId) {
        socket.join(`garage_${socket.user.garageId}`);
      }

      if (socket.user.role === 'admin') {
        socket.join('admin_room');
      }
    }

    // Allow garage-specific live updates subscription
    socket.on('subscribe:garage', (garageId) => {
      if (garageId) {
        socket.join(`garage_${garageId}`);
      }
    });

    socket.on('unsubscribe:garage', (garageId) => {
      if (garageId) {
        socket.leave(`garage_${garageId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  ioInstance = io;
  return io;
}

export function getIO() {
  return ioInstance;
}

/**
 * Broadcast helper functions - ONLY called after authoritative DB operation succeeds.
 */
export function broadcastBookingCreated(booking) {
  if (!ioInstance) return;
  const customerId = booking.customer?._id || booking.customer;
  const garageId = booking.garage?._id || booking.garage;

  ioInstance.to(`user_${customerId}`).emit(SOCKET_EVENTS.BOOKING_CREATED, booking);
  ioInstance.to(`garage_${garageId}`).emit(SOCKET_EVENTS.BOOKING_CREATED, booking);
  ioInstance.to('admin_room').emit(SOCKET_EVENTS.BOOKING_CREATED, booking);
}

export function broadcastBookingUpdated(booking) {
  if (!ioInstance) return;
  const customerId = booking.customer?._id || booking.customer;
  const garageId = booking.garage?._id || booking.garage;

  ioInstance.to(`user_${customerId}`).emit(SOCKET_EVENTS.BOOKING_UPDATED, booking);
  ioInstance.to(`garage_${garageId}`).emit(SOCKET_EVENTS.BOOKING_UPDATED, booking);
  ioInstance.to('admin_room').emit(SOCKET_EVENTS.BOOKING_UPDATED, booking);
}

export function broadcastBookingCancelled(booking) {
  if (!ioInstance) return;
  const customerId = booking.customer?._id || booking.customer;
  const garageId = booking.garage?._id || booking.garage;

  ioInstance.to(`user_${customerId}`).emit(SOCKET_EVENTS.BOOKING_CANCELLED, booking);
  ioInstance.to(`garage_${garageId}`).emit(SOCKET_EVENTS.BOOKING_CANCELLED, booking);
  ioInstance.to('admin_room').emit(SOCKET_EVENTS.BOOKING_CANCELLED, booking);
}

export function broadcastGarageAvailability(garageId, availabilityPayload) {
  if (!ioInstance) return;
  ioInstance.to(`garage_${garageId}`).emit(SOCKET_EVENTS.GARAGE_AVAILABILITY_UPDATED, availabilityPayload);
  ioInstance.to('public_garages').emit(SOCKET_EVENTS.GARAGE_AVAILABILITY_UPDATED, availabilityPayload);
}

export function broadcastNotification(userId, notification) {
  if (!ioInstance) return;
  ioInstance.to(`user_${userId}`).emit(SOCKET_EVENTS.NOTIFICATION_NEW, notification);
}

export function broadcastFogStatus(fogStatus) {
  if (!ioInstance) return;
  ioInstance.to('admin_room').emit(SOCKET_EVENTS.FOG_STATUS_UPDATED, fogStatus);
}

