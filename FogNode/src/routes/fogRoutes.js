import { Router } from 'express';
import { getNearbyGaragesViaFog } from '../controllers/discoveryController.js';
import { getGarageAvailabilityViaFog } from '../controllers/availabilityController.js';
import { forwardBookingViaFog } from '../controllers/bookingController.js';
import {
  getHealth,
  getMetrics,
  resetMetrics,
  invalidateCache,
  getPendingQueue,
  processPendingQueue
} from '../controllers/systemController.js';

const router = Router();

// Mandatory required Fog endpoints
router.get('/health', getHealth);
router.get('/metrics', getMetrics);
router.get('/api/fog/garages/nearby', getNearbyGaragesViaFog);
router.get('/api/fog/garages/:id/availability', getGarageAvailabilityViaFog);
router.post('/api/fog/bookings', forwardBookingViaFog);

// Auxiliary endpoints for cache management, metrics reset, and queue inspection
router.post('/api/fog/metrics/reset', resetMetrics);
router.post('/api/fog/cache/invalidate', invalidateCache);
router.get('/api/fog/queue', getPendingQueue);
router.post('/api/fog/queue/process', processPendingQueue);

export default router;

