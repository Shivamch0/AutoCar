import { isValidCoordinate } from '../utils/geoUtils.js';
import { MAX_SEARCH_RADIUS_KM } from '../config/constants.js';

export function validateNearbyQuery(req, res, next) {
  const { lat, lng, radiusKm } = req.query;

  if (lat === undefined || lng === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Both latitude (lat) and longitude (lng) query parameters are required.'
    });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (!isValidCoordinate(longitude, latitude)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid coordinates. Longitude must be between -180 and 180, Latitude between -90 and 90.'
    });
  }

  req.geoCoords = { latitude, longitude };

  if (radiusKm !== undefined) {
    const radius = parseFloat(radiusKm);
    if (isNaN(radius) || radius <= 0 || radius > MAX_SEARCH_RADIUS_KM) {
      return res.status(400).json({
        success: false,
        message: `Radius must be a positive number up to ${MAX_SEARCH_RADIUS_KM} km.`
      });
    }
    req.radiusKm = radius;
  } else {
    req.radiusKm = 15;
  }

  next();
}

export function validateBookingPayload(req, res, next) {
  const { garageId, service, scheduledTime, vehicleDetails } = req.body;

  if (!garageId) {
    return res.status(400).json({ success: false, message: 'garageId is required.' });
  }

  if (!service || !service.name || typeof service.price !== 'number') {
    return res.status(400).json({
      success: false,
      message: 'service object with name and price is required.'
    });
  }

  if (!scheduledTime || isNaN(new Date(scheduledTime).getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Valid scheduledTime date/time string is required.'
    });
  }

  if (!vehicleDetails || !vehicleDetails.make || !vehicleDetails.model) {
    return res.status(400).json({
      success: false,
      message: 'vehicleDetails with make and model is required.'
    });
  }

  next();
}

