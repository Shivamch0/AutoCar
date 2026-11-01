import { regionalCache } from '../cache/ttlCache.js';
import { pendingBookingQueue } from '../queue/pendingQueue.js';
import { metricsService } from '../services/metricsService.js';
import { cloudClient } from '../services/cloudClient.js';

export async function getHealth(req, res) {
  const cloudHealth = await cloudClient.checkCloudHealth();

  res.json({
    status: 'ok',
    service: 'AutoNear Regional Fog Node',
    regionId: process.env.FOG_REGION_ID || 'local-fog-node',
    regionName: process.env.FOG_REGION_NAME || 'Local Fog Development Zone',
    timestamp: new Date().toISOString(),
    cloudBackend: {
      url: cloudClient.backendUrl,
      reachable: cloudHealth.online,
      latencyMs: cloudHealth.latencyMs || null
    },
    cacheStats: regionalCache.getStats(),
    offlineQueue: {
      pendingCount: pendingBookingQueue.count()
    }
  });
}

export function getMetrics(req, res) {
  const metrics = metricsService.getMetrics();
  const cacheStats = regionalCache.getStats();

  res.json({
    service: 'AutoNear Regional Fog Node',
    timestamp: new Date().toISOString(),
    metrics,
    cache: cacheStats
  });
}

export function resetMetrics(req, res) {
  metricsService.reset();
  regionalCache.clear();
  res.json({ success: true, message: 'Fog metrics and cache reset successfully.' });
}

export function invalidateCache(req, res) {
  const { pattern, key } = req.body || {};
  let count = 0;

  if (key) {
    regionalCache.invalidate(key);
    count = 1;
  } else if (pattern) {
    count = regionalCache.invalidatePattern(pattern);
  } else {
    count = regionalCache.store.size;
    regionalCache.clear();
  }

  res.json({
    success: true,
    message: `Cache invalidated: ${count} entries cleared.`,
    remainingEntries: regionalCache.store.size
  });
}

export function getPendingQueue(req, res) {
  res.json({
    pendingCount: pendingBookingQueue.count(),
    pending: pendingBookingQueue.getAll(),
    processedRecent: pendingBookingQueue.getProcessed()
  });
}

export async function processPendingQueue(req, res) {
  if (pendingBookingQueue.count() === 0) {
    return res.json({ success: true, message: 'Queue is empty.', processedCount: 0 });
  }

  let processedCount = 0;
  const results = [];

  while (pendingBookingQueue.count() > 0) {
    const resItem = await pendingBookingQueue.processNext(async (payload) => {
      return cloudClient.forwardBooking(payload);
    });

    if (resItem) {
      results.push(resItem);
      if (resItem.success) {
        processedCount++;
      } else {
        // Stop batch if cloud error encountered
        break;
      }
    }
  }

  res.json({
    success: true,
    processedCount,
    remainingCount: pendingBookingQueue.count(),
    results
  });
}

