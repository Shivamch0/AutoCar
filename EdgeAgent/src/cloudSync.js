import { localEdgeBuffer } from './localBuffer.js';
import { bayMonitor } from './bayMonitor.js';

export class CloudSyncService {
  constructor() {
    this.backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    this.garageId = process.env.GARAGE_ID || '672000000000000000000001';
    this.agentId = process.env.EDGE_AGENT_ID || 'agent_sf_apex_01';
    this.secret = process.env.EDGE_AGENT_SECRET || 'autonear_fog_shared_secret_token_xyz_2026';
    this.isOnline = true;
    this.lastSync = null;
    this.lastError = null;
    this.syncCount = 0;
  }

  async syncWithCloud() {
    const pendingEvents = localEdgeBuffer.getPendingEvents();
    const status = bayMonitor.getStatus();

    const payload = {
      garageId: this.garageId,
      agentId: this.agentId,
      events: pendingEvents,
      currentOccupancy: status.currentOccupancy,
      activeBays: status.activeBays,
      isAvailable: status.currentOccupancy < status.totalBays,
      syncTimestamp: new Date().toISOString()
    };

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(`${this.backendUrl}/api/v1/edge/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-edge-secret': this.secret
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Sync rejected by Cloud Backend (HTTP ${res.status}): ${errorText}`);
      }

      const data = await res.json();

      // Clear buffer for synchronized events
      if (pendingEvents.length > 0) {
        const highestSeq = pendingEvents[pendingEvents.length - 1].sequence;
        localEdgeBuffer.clearSynced(highestSeq);
      }

      this.isOnline = true;
      this.lastSync = new Date().toISOString();
      this.lastError = null;
      this.syncCount++;

      return {
        success: true,
        data,
        eventsSynced: pendingEvents.length
      };
    } catch (err) {
      this.isOnline = false;
      this.lastError = err.message;
      return {
        success: false,
        error: err.message,
        eventsBuffered: localEdgeBuffer.count()
      };
    }
  }

  getSyncStatus() {
    return {
      agentId: this.agentId,
      garageId: this.garageId,
      backendUrl: this.backendUrl,
      isOnline: this.isOnline,
      lastSync: this.lastSync,
      lastError: this.lastError,
      syncCount: this.syncCount,
      bufferedEventsCount: localEdgeBuffer.count()
    };
  }
}

export const cloudSyncService = new CloudSyncService();

