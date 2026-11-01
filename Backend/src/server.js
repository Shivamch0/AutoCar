import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocketServer } from './sockets/socketManager.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Connect to database before starting the HTTP listener
    await connectDB();

    // Create standard HTTP server wrapping Express
    const server = http.createServer(app);

    // Initialize Socket.IO on the persistent Node.js HTTP server
    initSocketServer(server, process.env.CLIENT_URL || '*');

    server.listen(PORT, () => {
      console.log(`[AutoNear Backend] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`[AutoNear Backend] Socket.IO server attached and listening on port ${PORT}`);
    });

    const shutdown = async (signal) => {
      console.log(`\n[AutoNear Backend] Received ${signal}. Gracefully shutting down...`);
      server.close(() => {
        console.log('[AutoNear Backend] HTTP and Socket server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[AutoNear Backend] Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

