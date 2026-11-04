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
