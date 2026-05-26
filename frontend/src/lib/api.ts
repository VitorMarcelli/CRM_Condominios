import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

// Request interceptor to add the token
api.interceptors.request.use((config) => {
  const isBrowser = typeof window !== 'undefined';
  const token = isBrowser ? localStorage.getItem('access_token') : null;
  const orgId = isBrowser ? localStorage.getItem('organization_id') : null;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (orgId) {
    config.headers['x-organization-id'] = orgId;
  }
  
  return config;
});

// Response interceptor to handle 401 and generic errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Add logic here to try token refresh if we have a refresh_token
    // For MVP, if it's 401 we just redirect to login
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      // Do not redirect if we are already on the login page or attempting to login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
