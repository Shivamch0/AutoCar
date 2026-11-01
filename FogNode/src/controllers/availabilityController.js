import { regionalCache } from '../cache/ttlCache.js';
import { cloudClient } from '../services/cloudClient.js';
import { metricsService } from '../services/metricsService.js';

export async function getGarageAvailabilityViaFog(req, res) {
  const startTime = Date.now();
  const { id } = req.params;

  const cacheKey = `garage_avail:${id}`;
  const cachedData = regionalCache.get(cacheKey);

  if (cachedData) {
    const duration = Date.now() - startTime;
    metricsService.recordRequest(duration, true, false);

    return res.json({
      success: true,
      data: cachedData,
      fog: {
        source: 'fog_cache',
        latencyMs: duration,
        isCached: true
      }
    });
  }

  try {
    const cloudResponse = await cloudClient.fetchGarageAvailability(id);
    const garage = cloudResponse.data;

    const availabilityData = {
      garageId: garage._id,
      isAvailable: garage.isAvailable,
      capacity: garage.capacity,
      currentOccupancy: garage.currentOccupancy,
      cachedAt: new Date().toISOString()
    };

    // Cache availability for 15 seconds
    regionalCache.set(cacheKey, availabilityData, 15);

    const duration = Date.now() - startTime;
    metricsService.recordRequest(duration, false, false);

    return res.json({
      success: true,
      data: availabilityData,
      fog: {
        source: 'cloud_fetched_via_fog',
        latencyMs: duration,
        isCached: false
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    metricsService.recordRequest(duration, false, true);

    return res.status(503).json({
      success: false,
      message: 'Failed to retrieve garage availability: ' + error.message,
      fog: { latencyMs: duration }
    });
  }
}

