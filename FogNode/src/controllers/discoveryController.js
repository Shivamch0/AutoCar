import { regionalCache } from '../cache/ttlCache.js';
import { cloudClient } from '../services/cloudClient.js';
import { metricsService } from '../services/metricsService.js';

export async function getNearbyGaragesViaFog(req, res) {
  const startTime = Date.now();
  const { lat, lng, radiusKm = 15, category, minRating, isAvailable, sortBy } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      message: 'Both lat and lng query parameters are required for fog discovery.'
    });
  }

  // Quantize coordinates slightly (approx ~100m) for spatial cache locality in regional fog
  const roundedLat = Math.round(parseFloat(lat) * 100) / 100;
  const roundedLng = Math.round(parseFloat(lng) * 100) / 100;
  const cacheKey = `nearby:${roundedLat}:${roundedLng}:${radiusKm}:${category || 'all'}:${sortBy || 'distance'}`;

  const cachedData = regionalCache.get(cacheKey);

  if (cachedData) {
    const duration = Date.now() - startTime;
    metricsService.recordRequest(duration, true, false);

    return res.json({
      ...cachedData,
      fog: {
        source: 'fog_cache',
        region: process.env.FOG_REGION_ID || 'local-fog-node',
        latencyMs: duration,
        isCached: true
      }
    });
  }

  // Cache Miss: Fetch from Authoritative Cloud Backend
  try {
    const cloudResponse = await cloudClient.fetchNearbyGarages(req.query);

    // Store in regional TTL cache
    regionalCache.set(cacheKey, cloudResponse);

    const duration = Date.now() - startTime;
    metricsService.recordRequest(duration, false, false);

    return res.json({
      ...cloudResponse,
      fog: {
        source: 'cloud_fetched_via_fog',
        region: process.env.FOG_REGION_ID || 'local-fog-node',
        latencyMs: duration,
        isCached: false
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    metricsService.recordRequest(duration, false, true);

    return res.status(503).json({
      success: false,
      message: 'Fog Node could not reach authoritative backend: ' + error.message,
      fog: {
        source: 'error',
        region: process.env.FOG_REGION_ID || 'local-fog-node',
        latencyMs: duration
      }
    });
  }
}

