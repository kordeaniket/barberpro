import axios from 'axios';
const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((c) => { const t = localStorage.getItem('token'); if (t) c.headers.Authorization = 'Bearer ' + t; return c; });
api.interceptors.response.use((r) => r, async (e) => {
  const o = e.config, rt = localStorage.getItem('refreshToken');
  if (e.response?.status === 401 && rt && !o._retry && !o.url.includes('/auth/')) {
    o._retry = true;
    try {
      const { data } = await axios.post('/api/auth/refresh', { refreshToken: rt });
      saveSession(data); return api(o);
    } catch { clearSession(); location.href = '/login'; }
  }
  return Promise.reject(e);
});
export const saveSession = (d) => { localStorage.setItem('token', d.token); localStorage.setItem('refreshToken', d.refreshToken); localStorage.setItem('user', JSON.stringify(d.user)); };
export const clearSession = () => { ['token', 'refreshToken', 'user'].forEach((k) => localStorage.removeItem(k)); };
export default api;
