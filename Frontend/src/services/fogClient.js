import axios from 'axios';

const FOG_BASE_URL = import.meta.env.VITE_FOG_URL || 'http://localhost:4100';

const fogApi = axios.create({
  baseURL: FOG_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const fogClient = {
  getNearby: (params) => fogApi.get('/api/fog/garages/nearby', { params }),
  getAvailability: (garageId) => fogApi.get(`/api/fog/garages/${garageId}/availability`),
  createBooking: (payload) => fogApi.post('/api/fog/bookings', payload),
  getHealth: () => fogApi.get('/health'),
  getMetrics: () => fogApi.get('/metrics'),
  resetMetrics: () => fogApi.post('/api/fog/metrics/reset'),
  invalidateCache: (pattern) => fogApi.post('/api/fog/cache/invalidate', { pattern }),
  getQueue: () => fogApi.get('/api/fog/queue'),
  processQueue: () => fogApi.post('/api/fog/queue/process')
};

export default fogClient;

