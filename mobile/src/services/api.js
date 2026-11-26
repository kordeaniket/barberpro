import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

let activeRequests = 0;
const listeners = new Set();

export const subscribeToLoading = (cb) => {
  listeners.add(cb);
  cb(activeRequests > 0);
  return () => listeners.delete(cb);
};

export const startLoading = () => {
  activeRequests++;
  listeners.forEach((cb) => cb(activeRequests > 0));
};

export const stopLoading = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  listeners.forEach((cb) => cb(activeRequests > 0));
};

const rawBase = process.env.EXPO_PUBLIC_API_URL || 'https://backend-drab-beta.vercel.app';
export const API_BASE = `${rawBase.replace(/\/+$/, '')}/api`;
export const SOCKET_URL = (process.env.EXPO_PUBLIC_SOCKET_URL || rawBase).replace(/\/+$/, '');

let memoryToken = null;
let memoryRefreshToken = null;
let onUnauthorizedCallback = null;

export const setUnauthorizedHandler = (fn) => {
  onUnauthorizedCallback = fn;
};

export const hydrateTokens = async () => {
  try {
    const [t, rt, userStr] = await Promise.all([
      AsyncStorage.getItem('token'),
      AsyncStorage.getItem('refreshToken'),
      AsyncStorage.getItem('user'),
    ]);
    memoryToken = t;
    memoryRefreshToken = rt;
    return { token: t, refreshToken: rt, user: userStr ? JSON.parse(userStr) : null };
  } catch {
    return { token: null, refreshToken: null, user: null };
  }
};

export const saveSession = async (d) => {
  memoryToken = d.token || null;
  memoryRefreshToken = d.refreshToken || null;
  try {
    const ops = [];
    if (d.token) ops.push(AsyncStorage.setItem('token', d.token));
    if (d.refreshToken) ops.push(AsyncStorage.setItem('refreshToken', d.refreshToken));
    if (d.user) ops.push(AsyncStorage.setItem('user', JSON.stringify(d.user)));
    if (d.user?.shop?.shopCode) ops.push(AsyncStorage.setItem('shopCode', d.user.shop.shopCode));
    await Promise.all(ops);
  } catch {}
};

export const clearSession = async () => {
  memoryToken = null;
  memoryRefreshToken = null;
  try {
    await AsyncStorage.multiRemove([
      'token',
      'refreshToken',
      'user',
      'shopCode',
      'barber_notifications',
    ]);
  } catch {}
};

const api = axios.create({ baseURL: API_BASE, timeout: 20000 });

api.interceptors.request.use(
  async (c) => {
    if (!c.skipGlobalLoader) {
      c._tracked = true;
      startLoading();
    }
    const token = memoryToken || (await AsyncStorage.getItem('token'));
    if (token) {
      memoryToken = token;
      c.headers.Authorization = `Bearer ${token}`;
    }
    return c;
  },
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (r) => {
    if (r.config?._tracked) stopLoading();
    return r;
  },
  async (e) => {
    const o = e.config;
    const rt = memoryRefreshToken || (await AsyncStorage.getItem('refreshToken'));
    if (e.response?.status === 401 && rt && !o?._retry && !o?.url?.includes('/auth/')) {
      o._retry = true;
      try {
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken: rt });
        await saveSession(data);
        if (o?._tracked) stopLoading();
        return api(o);
      } catch (refreshErr) {
        if (o?._tracked) stopLoading();
        await clearSession();
        if (onUnauthorizedCallback) onUnauthorizedCallback();
        return Promise.reject(refreshErr);
      }
    }
    if (o?._tracked) stopLoading();
    return Promise.reject(e);
  }
);

export default api;
