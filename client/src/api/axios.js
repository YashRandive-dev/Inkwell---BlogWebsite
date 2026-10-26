import axios from 'axios';

// One configured instance used by the whole app.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // send the httpOnly auth cookie
});

// ---- Loading indicator: tells the top progress bar how many requests are in flight ----
let pending = 0;
const announce = () => window.dispatchEvent(new CustomEvent('api:pending', { detail: pending }));

api.interceptors.request.use((config) => {
  pending += 1;
  announce();
  return config;
});

api.interceptors.response.use(
  (response) => {
    pending = Math.max(0, pending - 1);
    announce();
    return response;
  },
  (error) => {
    pending = Math.max(0, pending - 1);
    announce();
    // Turn any failure into a friendly message on error.message.
    if (!error.response) {
      error.message = 'Cannot reach the server. Please check your connection and try again.';
    } else {
      error.message = error.response.data?.message || 'Something went wrong. Please try again.';
      // A 401 on a normal request means the session expired – let AuthContext clear the user.
      const url = error.config?.url || '';
      if (error.response.status === 401 && !url.includes('/auth/')) {
        window.dispatchEvent(new Event('auth:expired'));
      }
    }
    return Promise.reject(error);
  }
);

// ---- Tiny cache for data that rarely changes (topics, tags). Shared requests are de-duplicated. ----
const cache = new Map();
const TTL = 60 * 1000;

export const cachedGet = (url, config) => {
  const key = url + JSON.stringify(config?.params || {});
  const hit = cache.get(key);
  if (hit && Date.now() - hit.time < TTL) return hit.promise;
  const promise = api.get(url, config);
  cache.set(key, { time: Date.now(), promise });
  promise.catch(() => cache.delete(key)); // never keep a failed request
  return promise;
};

export const clearCache = () => cache.clear();

export default api;
