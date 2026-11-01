import { regionalCache } from '../cache/ttlCache.js';
import { cloudClient } from '../services/cloudClient.js';
import { pendingBookingQueue } from '../queue/pendingQueue.js';
import { metricsService } from '../services/metricsService.js';

export async function forwardBookingViaFog(req, res) {
  const startTime = Date.now();
  const payload = req.body;

  // Step 1: Validate request structure
  if (!payload || !payload.garageId || !payload.service || !payload.scheduledTime) {
    return res.status(400).json({
      success: false,
      message: 'Invalid booking payload: garageId, service, and scheduledTime are required.'
    });
  }

  // Step 2: Check local cache for fast-fail heuristics if known to be full/unavailable
  const cachedAvail = regionalCache.get(`garage_avail:${payload.garageId}`);
  if (cachedAvail && cachedAvail.isAvailable === false) {
    return res.status(400).json({
      success: false,
      message: 'Local Fog Cache indicates this garage is currently marked unavailable.'
    });
  }

  // Step 3 & 4: Forward request to Authoritative Cloud Backend
  try {
    const cloudResponse = await cloudClient.forwardBooking(payload);

    // Step 5: Invalidate local cache entries for this garage and nearby queries
    regionalCache.invalidate(`garage_avail:${payload.garageId}`);
    regionalCache.invalidatePattern('nearby:');

    const duration = Date.now() - startTime;
    metricsService.recordRequest(duration, false, false);
    metricsService.recordBookingAttempt('confirmed');

    // Return authoritative result from cloud
    return res.status(201).json({
      ...cloudResponse,
      fog: {
        routedViaFog: true,
        region: process.env.FOG_REGION_ID || 'local-fog-node',
        latencyMs: duration,
        status: 'Authoritatively Confirmed by Cloud Backend'
      }
    });
  } catch (error) {
    console.warn('[Fog Booking Forward Error]:', error.message);

    // If authoritative backend is unavailable (network error / offline), record into pending queue
    if (!cloudClient.isOnline || error.name === 'AbortError' || error.message?.includes('fetch failed')) {
      const queuedItem = pendingBookingQueue.enqueue(payload);

      const duration = Date.now() - startTime;
      metricsService.recordRequest(duration, false, false);
      metricsService.recordBookingAttempt('queued');

      return res.status(202).json({
        success: false,
        pending: true,
        status: 'Awaiting confirmation',
        queueId: queuedItem.queueId,
        message: 'Authoritative Cloud Backend is currently unreachable. Booking request has been securely buffered in the Fog Node durable queue and is awaiting central confirmation.',
        queuedAt: queuedItem.queuedAt,
        fog: {
          routedViaFog: true,
          region: process.env.FOG_REGION_ID || 'local-fog-node',
          latencyMs: duration
        }
      });
    }

    // Backend returned a business validation error (e.g. 409 slot capacity full)
    const duration = Date.now() - startTime;
    metricsService.recordRequest(duration, false, true);

    return res.status(400).json({
      success: false,
      message: error.message || 'Authoritative backend rejected booking.',
      fog: {
        routedViaFog: true,
        latencyMs: duration
      }
    });
  }
}

