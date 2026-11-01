import dotenv from 'dotenv';
import app from './app.js';
import { pendingBookingQueue } from './queue/pendingQueue.js';
import { cloudClient } from './services/cloudClient.js';

dotenv.config();

const PORT = process.env.PORT || 4100;

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`[AutoNear FogNode] Regional Fog Node running on port ${PORT}`);
  console.log(`[AutoNear FogNode] Region: ${process.env.FOG_REGION_ID || 'local-fog-node'} (${process.env.FOG_REGION_NAME || 'Local Fog Zone'})`);
  console.log(`[AutoNear FogNode] Authoritative Cloud Backend: ${process.env.BACKEND_URL || 'http://localhost:5000'}`);
  console.log(`[AutoNear FogNode] Health check: http://localhost:${PORT}/health`);
  console.log(`[AutoNear FogNode] Metrics: http://localhost:${PORT}/metrics`);
  console.log(`====================================================`);
});

// Periodic background synchronization worker for durable offline queue
const QUEUE_SYNC_INTERVAL_MS = 20000;
setInterval(async () => {
  if (pendingBookingQueue.count() > 0) {
    console.log(`[Fog Queue Worker] Detected ${pendingBookingQueue.count()} pending offline bookings. Checking cloud connectivity...`);
    const health = await cloudClient.checkCloudHealth();
    if (health.online) {
      console.log(`[Fog Queue Worker] Cloud is reachable! Synchronizing pending bookings...`);
      let synced = 0;
      while (pendingBookingQueue.count() > 0) {
        const res = await pendingBookingQueue.processNext(async (payload) => {
          return cloudClient.forwardBooking(payload);
        });
        if (res && res.success) {
          synced++;
        } else {
          break;
        }
      }
      console.log(`[Fog Queue Worker] Synchronized ${synced} booking(s) to authoritative backend.`);
    }
  }
}, QUEUE_SYNC_INTERVAL_MS);

const shutdown = () => {
  console.log('\n[AutoNear FogNode] Shutting down Fog Node...');
  server.close(() => {
    console.log('[AutoNear FogNode] Fog Node server terminated.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

