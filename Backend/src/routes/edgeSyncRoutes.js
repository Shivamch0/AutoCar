import { Router } from 'express';
import { syncEdgeEvents } from '../controllers/edgeSyncController.js';
import { authenticateEdgeAgent } from '../middleware/serviceAuth.js';

const router = Router();

// Endpoint for garage-side edge agent synchronization
router.post('/sync', authenticateEdgeAgent, syncEdgeEvents);

export default router;

