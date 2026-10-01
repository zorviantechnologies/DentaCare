import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

// Automatically inject the live Supabase session token into every request.
// We fetch it fresh from Supabase each time so it is always valid even after refresh.
api.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch {
      // Unable to retrieve session — send request without token
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response handling for token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Check if it is a protected route before redirecting
      const isAuthRoute =
        window.location.pathname.startsWith('/login') ||
        window.location.pathname.startsWith('/register') ||
        window.location.pathname === '/';

      if (!isAuthRoute) {
        await supabase.auth.signOut();
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
