/**
 * AutoNear Browser-Side Edge Processing Module
 * 
 * ROLE IN ARCHITECTURE: Client-Edge Processing
 * Performs local computation close to user interaction:
 * - Local validation of browser coordinates
 * - Haversine great-circle distance calculations
 * - Instant client-side filtering and ranking of cached datasets (Mode C evaluation)
 * - Session storage / LocalStorage caching with TTL and staleness indicators
 * 
 * NOTE: Browser edge processing optimizes user experience and mitigates redundant network round-trips.
 * Authoritative booking decisions, validation, and capacity constraints remain strictly enforced
 * in the Cloud Backend.
 */

const EARTH_RADIUS_KM = 6371;
const CLIENT_CACHE_KEY = 'autonear_client_edge_cache_v1';
const DEFAULT_CLIENT_TTL_MS = 3 * 60 * 1000; // 3 minutes

/**
 * Validates browser geolocation coordinates.
 */
export function validateClientCoordinates(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Client-side Haversine distance calculation in kilometers.
 */
export function calculateClientHaversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 100) / 100;
}

/**
 * Filters already-retrieved garages locally without issuing a network call.
 * Recalculates distances from customer position and filters by radius, category, availability, and rating.
 */
export function filterGaragesAtClientEdge(garages, userCoords, options = {}) {
  const {
    radiusKm = 25,
    category = 'All',
    minRating = 0,
    onlyAvailable = false,
    sortBy = 'distance' // 'distance' | 'rating' | 'price'
  } = options;

  if (!Array.isArray(garages)) return [];

  const processed = garages
    .map((garage) => {
      let distanceKm = garage.distanceKm;

      // If user coords are known, compute exact Haversine distance at the client edge
      if (userCoords && garage.location?.coordinates) {
        const [gLng, gLat] = garage.location.coordinates;
        distanceKm = calculateClientHaversineKm(userCoords.latitude, userCoords.longitude, gLat, gLng);
      }

      return {
        ...garage,
        distanceKm
      };
    })
    .filter((garage) => {
      // Radius filter
      if (garage.distanceKm !== undefined && garage.distanceKm > radiusKm) {
        return false;
      }

      // Rating filter
      if (minRating > 0 && (garage.rating || 0) < minRating) {
        return false;
      }

      // Availability filter
      if (onlyAvailable && !garage.isAvailable) {
        return false;
      }

      // Service category filter
      if (category && category !== 'All') {
        const hasService = garage.services?.some((s) => s.category === category);
        if (!hasService) return false;
      }

      return true;
    });

  // Client-edge ranking
  return processed.sort((a, b) => {
    if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    }
    if (sortBy === 'price') {
      const minPriceA = Math.min(...(a.services?.map((s) => s.price) || [Infinity]));
      const minPriceB = Math.min(...(b.services?.map((s) => s.price) || [Infinity]));
      return minPriceA - minPriceB;
    }
    // Default: Proximity
    return (a.distanceKm || 0) - (b.distanceKm || 0);
  });
}

/**
 * Saves non-sensitive search results to client storage with TTL.
 */
export function cacheResultsAtClientEdge(key, data, ttlMs = DEFAULT_CLIENT_TTL_MS) {
  try {
    const entry = {
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
      data
    };
    sessionStorage.setItem(`${CLIENT_CACHE_KEY}_${key}`, JSON.stringify(entry));
  } catch (e) {
    console.warn('[BrowserEdge] Failed to write client-edge cache:', e);
  }
}

/**
 * Retrieves cached results with staleness detection.
 */
export function getCachedResultsAtClientEdge(key) {
  try {
    const item = sessionStorage.getItem(`${CLIENT_CACHE_KEY}_${key}`);
    if (!item) return null;

    const parsed = JSON.parse(item);
    const now = Date.now();
    const isStale = now > parsed.expiresAt;
    const ageSeconds = Math.round((now - parsed.timestamp) / 1000);

    return {
      data: parsed.data,
      isStale,
      ageSeconds,
      timestamp: parsed.timestamp
    };
  } catch (e) {
    return null;
  }
}

