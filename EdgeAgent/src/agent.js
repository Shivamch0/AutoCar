import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { bayMonitor } from './bayMonitor.js';
import { localEdgeBuffer } from './localBuffer.js';
import { cloudSyncService } from './cloudSync.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4200;

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint (Required by prompt)
app.get('/health', (req, res) => {
  const syncStatus = cloudSyncService.getSyncStatus();
  res.json({
    status: 'ok',
    service: 'AutoNear Garage-Side Edge Computing Agent',
    agentId: process.env.EDGE_AGENT_ID || 'agent_sf_apex_01',
    garageId: process.env.GARAGE_ID || '672000000000000000000001',
    timestamp: new Date().toISOString(),
    cloudConnection: {
      isOnline: syncStatus.isOnline,
      lastSync: syncStatus.lastSync,
      bufferedEvents: localEdgeBuffer.count(),
      lastError: syncStatus.lastError
    },
    bays: bayMonitor.getStatus()
  });
});

// Full garage status endpoint
app.get('/status', (req, res) => {
  res.json({
    bayStatus: bayMonitor.getStatus(),
    bufferStatus: {
      count: localEdgeBuffer.count(),
      events: localEdgeBuffer.getPendingEvents()
    },
    syncStatus: cloudSyncService.getSyncStatus()
  });
});

// Manual local bay toggle (demonstrates hardware/sensor trigger override)
app.post('/api/agent/bays/:index/toggle', (req, res) => {
  const bayIndex = parseInt(req.params.index, 10);
  const status = bayMonitor.getStatus();
  const currentBay = status.bays.find((b) => b.bayIndex === bayIndex);

  if (!currentBay) {
    return res.status(404).json({ success: false, message: `Bay index ${bayIndex} not found.` });
  }

  const newState = !currentBay.isOccupied;
  const updateResult = bayMonitor.updateBayStatus(bayIndex, newState, null, true);

  res.json({
    success: true,
    message: `Bay ${bayIndex} updated to ${newState ? 'Occupied' : 'Available'}`,
    bay: updateResult.bay,
    currentOccupancy: updateResult.occupancy,
    eventBuffered: updateResult.event
  });
});

// Manual cloud sync trigger
app.post('/api/agent/sync', async (req, res) => {
  const syncResult = await cloudSyncService.syncWithCloud();
  res.json(syncResult);
});

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`[AutoNear EdgeAgent] Garage Edge Agent running on port ${PORT}`);
  console.log(`[AutoNear EdgeAgent] Garage ID: ${process.env.GARAGE_ID || '672000000000000000000001'}`);
  console.log(`[AutoNear EdgeAgent] Cloud Target: ${process.env.BACKEND_URL || 'http://localhost:5000'}`);
  console.log(`[AutoNear EdgeAgent] Health: http://localhost:${PORT}/health`);
  console.log(`====================================================`);
});

// Background sensor simulation loop (simulates bay occupancy changes)
const SIM_INTERVAL = parseInt(process.env.SIMULATION_INTERVAL_MS || '15000', 10);
if (process.env.SIMULATION_ENABLED !== 'false') {
  setInterval(() => {
    try {
      const sim = bayMonitor.simulateRandomEvent();
      console.log(`[Edge Sensor Sim] Bay ${sim.bay.bayIndex} is now ${sim.bay.isOccupied ? 'OCCUPIED' : 'CLEARED'}. Total Occupancy: ${sim.occupancy}/${bayMonitor.totalBays}`);
    } catch (e) {
      console.error('[Edge Sensor Sim Error]:', e.message);
    }
  }, SIM_INTERVAL);
}

// Background Cloud Synchronization loop
const SYNC_INTERVAL = parseInt(process.env.SYNC_INTERVAL_MS || '10000', 10);
setInterval(async () => {
  try {
    const result = await cloudSyncService.syncWithCloud();
    if (result.success && result.eventsSynced > 0) {
      console.log(`[Edge Cloud Sync] Successfully synced ${result.eventsSynced} sensor event(s) to central Cloud Backend.`);
    } else if (!result.success) {
      console.warn(`[Edge Cloud Sync] Backend unreachable (${result.error}). Buffering events locally (depth: ${result.eventsBuffered}).`);
    }
  } catch (err) {
    console.error('[Edge Sync Loop Error]:', err.message);
  }
}, SYNC_INTERVAL);

export default app;

