import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API calls
export const authAPI = {
  register: (email, password, firstName, lastName) =>
    api.post('/auth/register', { email, password, firstName, lastName }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  verifyOTP: (loginAttemptId, code) =>
    api.post('/auth/verify-otp', { loginAttemptId, code }),
  getCurrentUser: () =>
    api.get('/auth/me'),
};

// Admin API calls
export const adminAPI = {
  getLoginAttempts: (page = 1, limit = 50, filters = {}) =>
    api.get('/admin/login-attempts', { params: { page, limit, ...filters } }),
  getSuspiciousEvents: (page = 1, limit = 50, filters = {}) =>
    api.get('/admin/suspicious-events', { params: { page, limit, ...filters } }),
  getDashboardStats: () =>
    api.get('/admin/dashboard-stats'),
  getLocationData: () =>
    api.get('/admin/location-data'),
  getUserDetails: (userId) =>
    api.get(`/admin/user/${userId}`),
  resolveSuspiciousEvent: (eventId, resolvedBy) =>
    api.put(`/admin/resolve-event/${eventId}`, { resolvedBy }),
  unlockUserAccount: (userId) =>
    api.put(`/admin/unlock-user/${userId}`),
};

export default api;
