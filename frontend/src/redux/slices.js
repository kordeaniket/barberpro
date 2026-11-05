import { createSlice } from '@reduxjs/toolkit';
export const auth = createSlice({ name: 'auth', initialState: { user: JSON.parse(localStorage.getItem('user') || 'null'), error: null, busy: false },
  reducers: {
    loginRequest: (s) => { s.error = null; s.busy = true; },
    loginSuccess: (s, a) => { s.user = a.payload; s.busy = false; },
    loginFailure: (s, a) => { s.error = a.payload; s.busy = false; },
    logout: (s) => { s.user = null; },
    passwordChanged: (s) => { if (s.user) s.user.mustChangePassword = false; },
    updateUserShop: (s, a) => {
      if (s.user) {
        s.user.shop = { ...(s.user.shop || {}), ...a.payload };
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...stored, shop: s.user.shop }));
      }
    }
  }
});
export const ui = createSlice({ name: 'ui', initialState: { data: {}, msg: null },
  reducers: { fetchRequest: () => {}, setData: (s, a) => { s.data[a.payload.key] = a.payload.data; }, submitRequest: () => {}, setMsg: (s, a) => { s.msg = a.payload; } } });

const initialNotifs = JSON.parse(localStorage.getItem('barber_notifications') || '[]');
export const notifications = createSlice({
  name: 'notifications',
  initialState: {
    items: initialNotifs,
    unreadCount: initialNotifs.filter((n) => !n.read).length
  },
  reducers: {
    setNotifications: (s, a) => {
      s.items = a.payload;
      s.unreadCount = a.payload.filter((n) => !n.read).length;
      localStorage.setItem('barber_notifications', JSON.stringify(s.items));
    },
    addNotification: (s, a) => {
      const exists = s.items.some((n) => n.id === a.payload.id);
      if (exists) return;

      const item = {
        id: a.payload.id || Date.now().toString(),
        title: a.payload.title || 'New Appointment',
        message: a.payload.message || '',
        customer: a.payload.customer,
        serviceName: a.payload.serviceName,
        price: a.payload.price,
        date: a.payload.date,
        time: a.payload.time,
        type: a.payload.type || 'booking',
        timestamp: a.payload.timestamp || new Date().toISOString(),
        read: false
      };
      s.items.unshift(item);
      if (s.items.length > 50) s.items.pop();
      s.unreadCount = s.items.filter((n) => !n.read).length;
      localStorage.setItem('barber_notifications', JSON.stringify(s.items));
    },
    markAsRead: (s, a) => {
      const item = s.items.find((n) => n.id === a.payload);
      if (item && !item.read) {
        item.read = true;
        s.unreadCount = s.items.filter((n) => !n.read).length;
        localStorage.setItem('barber_notifications', JSON.stringify(s.items));
      }
    },
    markAllAsRead: (s) => {
      s.items.forEach((n) => {
        n.read = true;
      });
      s.unreadCount = 0;
      localStorage.setItem('barber_notifications', JSON.stringify(s.items));
    },
    clearAll: (s) => {
      s.items = [];
      s.unreadCount = 0;
      localStorage.removeItem('barber_notifications');
    }
  }
});
