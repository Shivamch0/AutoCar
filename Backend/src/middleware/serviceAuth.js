/**
 * Middleware to authenticate Fog Node and Edge Agent requests to authoritative Cloud Backend.
 * Uses server-side pre-shared secrets (FOG_SERVICE_SECRET) not exposed to frontend clients.
 */
export function authenticateFogService(req, res, next) {
  const secretHeader = req.headers['x-fog-secret'];
  const expectedSecret = process.env.FOG_SERVICE_SECRET || 'autonear_fog_shared_secret_token_xyz_2026';

  if (!secretHeader || secretHeader !== expectedSecret) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: invalid or missing Fog service secret header.'
    });
  }

  req.isFogService = true;
  next();
}

/**
 * Middleware for Edge Agent synchronization.
 */
export function authenticateEdgeAgent(req, res, next) {
  const secretHeader = req.headers['x-edge-secret'] || req.headers['x-fog-secret'];
  const expectedSecret = process.env.FOG_SERVICE_SECRET || 'autonear_fog_shared_secret_token_xyz_2026';

  if (!secretHeader || secretHeader !== expectedSecret) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: invalid or missing edge agent authentication secret.'
    });
  }

  req.isEdgeAgent = true;
  next();
}

