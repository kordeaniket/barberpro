import { createSlice, configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { call, put, takeEvery, takeLatest, all } from 'redux-saga/effects';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { saveSession, clearSession } from '../services/api';

const errMsg = (e) => e?.response?.data?.message || e?.message || 'Something went wrong';

export const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, error: null, busy: false, hydrated: false },
  reducers: {
    hydrateDone: (s, a) => {
      s.user = a.payload;
      s.hydrated = true;
    },
    loginRequest: (s) => {
      s.error = null;
      s.busy = true;
    },
    loginSuccess: (s, a) => {
      s.user = a.payload;
      s.busy = false;
      s.error = null;
    },
    loginFailure: (s, a) => {
      s.error = a.payload;
      s.busy = false;
    },
    clearError: (s) => {
      s.error = null;
    },
    logout: (s) => {
      s.user = null;
      s.error = null;
      s.busy = false;
    },
    updateUser: (s, a) => {
      if (s.user) {
        s.user = { ...s.user, ...a.payload };
        AsyncStorage.setItem('user', JSON.stringify(s.user)).catch(() => {});
      }
    },
    updateUserShop: (s, a) => {
      if (s.user) {
        s.user.shop = { ...(s.user.shop || {}), ...a.payload };
        AsyncStorage.setItem('user', JSON.stringify(s.user)).catch(() => {});
      }
    },
  },
});

export const uiSlice = createSlice({
  name: 'ui',
  initialState: { data: {}, msg: null, refreshTrigger: 0 },
  reducers: {
    fetchRequest: () => {},
    setData: (s, a) => {
      s.data[a.payload.key] = a.payload.data;
    },
    submitRequest: () => {},
    setMsg: (s, a) => {
      s.msg = a.payload;
    },
    clearMsg: (s) => {
      s.msg = null;
    },
    triggerRefresh: (s) => {
      s.refreshTrigger += 1;
    },
  },
});

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], unreadCount: 0 },
  reducers: {
    setNotifications: (s, a) => {
      const readMap = new Map(s.items.map((n) => [n.id, n.read]));
      s.items = (a.payload || []).map((item) => ({
        ...item,
        read: readMap.has(item.id) ? readMap.get(item.id) : Boolean(item.read),
      }));
      s.unreadCount = s.items.filter((n) => !n.read).length;
    },
    addNotification: (s, a) => {
      if (s.items.some((n) => n.id === a.payload.id)) return;
      s.items.unshift({ ...a.payload, read: false });
      if (s.items.length > 50) s.items.pop();
      s.unreadCount = s.items.filter((n) => !n.read).length;
    },
    markAllAsRead: (s) => {
      s.items.forEach((n) => {
        n.read = true;
      });
      s.unreadCount = 0;
    },
    clearAll: (s) => {
      s.items = [];
      s.unreadCount = 0;
    },
  },
});

function* loginSaga({ payload }) {
  try {
    const { data } = yield call(api.post, '/auth/login', payload);
    if (data.user) data.user.mustChangePassword = false;
    yield call(saveSession, data);
    yield put(authSlice.actions.loginSuccess(data.user));
  } catch (e) {
    yield put(authSlice.actions.loginFailure(errMsg(e)));
  }
}

function* fetchSaga({ payload: { key, url } }) {
  try {
    const { data } = yield call(api.get, url);
    yield put(uiSlice.actions.setData({ key, data }));
  } catch (e) {
    yield put(uiSlice.actions.setMsg({ type: 'error', text: errMsg(e) }));
  }
}

function* submitSaga({ payload: { method = 'post', url, body, refresh = [] } }) {
  try {
    const { data } = yield call(api[method], url, body);
    yield put(uiSlice.actions.setMsg({ type: 'ok', text: data.message || 'Done' }));
    for (const r of [].concat(refresh)) {
      yield put(uiSlice.actions.fetchRequest(r));
    }
  } catch (e) {
    yield put(uiSlice.actions.setMsg({ type: 'error', text: errMsg(e) }));
  }
}

function* logoutSaga() {
  yield call(clearSession);
  yield put(notificationsSlice.actions.clearAll());
}

function* rootSaga() {
  yield all([
    takeLatest(authSlice.actions.loginRequest.type, loginSaga),
    takeEvery(uiSlice.actions.fetchRequest.type, fetchSaga),
    takeEvery(uiSlice.actions.submitRequest.type, submitSaga),
    takeEvery(authSlice.actions.logout.type, logoutSaga),
  ]);
}

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    ui: uiSlice.reducer,
    notifications: notificationsSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false, serializableCheck: false }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);
