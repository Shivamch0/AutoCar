import { Router } from 'express';
import {
  getNearbyGarages,
  getAllGarages,
  getGarageById,
  createGarage,
  updateGarageAvailability
} from '../controllers/garageController.js';
import { validateNearbyQuery } from '../middleware/validator.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// Geospatial search: /api/v1/garages/nearby?lat=...&lng=...&radiusKm=...
router.get('/nearby', validateNearbyQuery, getNearbyGarages);

// General listings
router.get('/', getAllGarages);
router.get('/:id', getGarageById);

// Protected routes
router.post('/', authenticateToken, requireRole(ROLES.GARAGE_OWNER, ROLES.ADMIN), createGarage);
router.patch('/:id/availability', updateGarageAvailability);

export default router;

