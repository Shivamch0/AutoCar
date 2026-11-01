import Garage from '../models/Garage.js';
import { broadcastGarageAvailability } from '../sockets/socketManager.js';

export async function syncEdgeEvents(req, res, next) {
  try {
    const { garageId, agentId, events = [], currentOccupancy, activeBays, isAvailable, syncTimestamp } = req.body;

    if (!garageId) {
      return res.status(400).json({ success: false, message: 'garageId is required for edge sync.' });
    }

    const garage = await Garage.findById(garageId);
    if (!garage) {
      return res.status(404).json({ success: false, message: 'Garage not found.' });
    }

    const syncTime = syncTimestamp ? new Date(syncTimestamp) : new Date();

    // Conflict Resolution: Last-Write-Wins / Timestamp ordering check
    if (garage.lastEdgeSync && garage.lastEdgeSync > syncTime) {
      return res.status(200).json({
        success: true,
        message: 'Sync acknowledged; central state has newer updates.',
        conflictResolved: true,
        currentStatus: {
          activeBays: garage.capacity.activeBays,
          currentOccupancy: garage.currentOccupancy,
          isAvailable: garage.isAvailable,
          lastEdgeSync: garage.lastEdgeSync
        }
      });
    }

    // Process buffered events
    let processedCount = 0;
    if (Array.isArray(events) && events.length > 0) {
      // Sort chronologically
      events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      processedCount = events.length;
    }

    if (currentOccupancy !== undefined) {
      garage.currentOccupancy = Math.max(0, Math.min(garage.capacity.totalBays, currentOccupancy));
    }
    if (activeBays !== undefined) {
      garage.capacity.activeBays = activeBays;
    }
    if (isAvailable !== undefined) {
      garage.isAvailable = isAvailable;
    }

    garage.edgeAgentId = agentId || garage.edgeAgentId;
    garage.lastEdgeSync = syncTime;
    await garage.save();

    // Broadcast real-time availability update
    broadcastGarageAvailability(garage._id.toString(), {
      garageId: garage._id,
      isAvailable: garage.isAvailable,
      activeBays: garage.capacity.activeBays,
      currentOccupancy: garage.currentOccupancy,
      timestamp: syncTime.toISOString(),
      source: 'edge_agent_sync'
    });

    res.json({
      success: true,
      processedCount,
      garage: {
        id: garage._id,
        name: garage.name,
        currentOccupancy: garage.currentOccupancy,
        activeBays: garage.capacity.activeBays,
        isAvailable: garage.isAvailable,
        lastEdgeSync: garage.lastEdgeSync
      }
    });
  } catch (err) {
    next(err);
  }
}

