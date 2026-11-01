import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Inject auth token from localStorage if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('autonear_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (data) => apiClient.post('/auth/register', data),
  getMe: () => apiClient.get('/auth/me'),
  refreshToken: (token) => apiClient.post('/auth/refresh-token', { refreshToken: token })
};

export const garagesApi = {
  getNearby: (params) => apiClient.get('/garages/nearby', { params }),
  getAll: (params) => apiClient.get('/garages', { params }),
  getById: (id) => apiClient.get(`/garages/${id}`),
  updateAvailability: (id, data) => apiClient.patch(`/garages/${id}/availability`, data)
};

export const bookingsApi = {
  create: (data) => apiClient.post('/bookings', data),
  getMy: () => apiClient.get('/bookings/my'),
  getById: (id) => apiClient.get(`/bookings/${id}`),
  updateStatus: (id, status, note) => apiClient.patch(`/bookings/${id}/status`, { status, note })
};

export const notificationsApi = {
  getMy: () => apiClient.get('/notifications'),
  markAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.patch('/notifications/read-all')
};

export default apiClient;

