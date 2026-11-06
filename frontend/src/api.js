import axios from 'axios';

let activeRequests = 0;
const listeners = new Set();

export const subscribeToLoading = (cb) => {
  listeners.add(cb);
  cb(activeRequests > 0);
  return () => {
    listeners.delete(cb);
  };
};

export const startLoading = () => {
  activeRequests++;
  listeners.forEach((cb) => cb(activeRequests > 0));
};

export const stopLoading = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  listeners.forEach((cb) => cb(activeRequests > 0));
};

const rawBase = import.meta.env.VITE_API_URL;
export const API_BASE = rawBase ? `${rawBase.replace(/\/+$/, '')}/api` : '/api';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(
  (c) => {
    if (!c.skipGlobalLoader) {
      c._tracked = true;
      startLoading();
    }
    const t = localStorage.getItem('token');
    if (t) c.headers.Authorization = 'Bearer ' + t;
    return c;
  },
  (err) => {
    return Promise.reject(err);
  }
);

api.interceptors.response.use(
  (r) => {
    if (r.config?._tracked) {
      stopLoading();
    }
    return r;
  },
  async (e) => {
    const o = e.config, rt = localStorage.getItem('refreshToken');
    if (e.response?.status === 401 && rt && !o?._retry && !o?.url?.includes('/auth/')) {
      o._retry = true;
      try {
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken: rt });
        saveSession(data);
        if (o?._tracked) stopLoading();
        return api(o);
      } catch (refreshErr) {
        if (o?._tracked) stopLoading();
        clearSession();
        location.href = '/login';
        return Promise.reject(refreshErr);
      }
    }
    if (o?._tracked) {
      stopLoading();
    }
    return Promise.reject(e);
  }
);

export const saveSession = (d) => {
  localStorage.setItem('token', d.token);
  localStorage.setItem('refreshToken', d.refreshToken);
  localStorage.setItem('user', JSON.stringify(d.user));
};

export const clearSession = () => {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {
    ['token', 'refreshToken', 'user', 'shopCode', 'barber_notifications', 'customer_notifications'].forEach((k) => localStorage.removeItem(k));
  }
};

export default api;
