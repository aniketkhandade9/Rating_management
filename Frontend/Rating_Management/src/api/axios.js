import axios from 'axios';

// With the Vite proxy configured, /api/* is forwarded to http://localhost:5000
// This means no hardcoded port and no CORS issues in development.
const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Return response body directly; reject with the server's error object
api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err.response?.data ?? { message: 'Network error. Is the server running?' })
);

export default api;
