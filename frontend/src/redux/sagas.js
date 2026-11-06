import { call, put, takeEvery, takeLatest, all } from 'redux-saga/effects';
import api, { saveSession, clearSession } from '../api';
import { auth, ui } from './slices';
const err = (e) => e.response?.data?.message || e.message;
function* login({ payload }) {
  try {
    const { data } = yield call(api.post, '/auth/login', payload);
    if (data.user) {
      data.user.mustChangePassword = false;
    }
    saveSession(data);
    if (data.user?.shop?.shopCode) {
      localStorage.setItem('shopCode', data.user.shop.shopCode);
    }
    yield put(auth.actions.loginSuccess(data.user));
  }
  catch (e) { yield put(auth.actions.loginFailure(err(e))); }
}
function* fetchData({ payload: { key, url } }) {
  try { const { data } = yield call(api.get, url); yield put(ui.actions.setData({ key, data })); }
  catch (e) { yield put(ui.actions.setMsg({ type: 'error', text: err(e) })); }
}
function* submit({ payload: { method = 'post', url, body, refresh = [] } }) {
  try {
    const { data } = yield call(api[method], url, body);
    yield put(ui.actions.setMsg({ type: 'ok', text: data.message || 'Done' }));
    for (const r of [].concat(refresh)) yield put(ui.actions.fetchRequest(r));
  } catch (e) { yield put(ui.actions.setMsg({ type: 'error', text: err(e) })); }
}
function* logout() { clearSession(); yield; }
export default function* root() {
  yield all([takeLatest(auth.actions.loginRequest.type, login), takeEvery(ui.actions.fetchRequest.type, fetchData), takeEvery(ui.actions.submitRequest.type, submit), takeEvery(auth.actions.logout.type, logout)]);
}
