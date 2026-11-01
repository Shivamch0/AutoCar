import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingStatus
} from '../controllers/bookingController.js';
import { validateBookingPayload } from '../middleware/validator.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Middleware to permit either token auth OR Fog service secret header for booking creation
function authenticateUserOrFog(req, res, next) {
  const fogSecret = req.headers['x-fog-secret'];
  const expectedSecret = process.env.FOG_SERVICE_SECRET || 'autonear_fog_shared_secret_token_xyz_2026';

  if (fogSecret && fogSecret === expectedSecret) {
    req.isFogService = true;
    return next();
  }

  // Fallback to normal JWT authentication
  return authenticateToken(req, res, next);
}

router.post('/', authenticateUserOrFog, validateBookingPayload, createBooking);
router.get('/my', authenticateToken, getMyBookings);
router.get('/:id', authenticateToken, getBookingById);
router.patch('/:id/status', authenticateToken, updateBookingStatus);

export default router;

