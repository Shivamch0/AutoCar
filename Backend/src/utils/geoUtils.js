/**
 * Geographic utilities for AutoNear: coordinates validation, Haversine formula, and unit conversions.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Validates [longitude, latitude] pair or { latitude, longitude } object.
 */
export function isValidCoordinate(lng, lat) {
  if (typeof lng !== 'number' || typeof lat !== 'number') return false;
  if (isNaN(lng) || isNaN(lat)) return false;
  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
}

/**
 * Haversine formula to compute great-circle distance between two points.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} distance in kilometers
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Converts kilometers to meters.
 */
export function kmToMeters(km) {
  return km * 1000;
}

/**
 * Converts meters to kilometers rounded to 2 decimal places.
 */
export function metersToKm(meters) {
  return Math.round((meters / 1000) * 100) / 100;
}

