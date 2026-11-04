import { configureStore } from '@reduxjs/toolkit'; import createSagaMiddleware from 'redux-saga';
import { auth, ui } from './slices'; import rootSaga from './sagas';
const saga = createSagaMiddleware();
export const store = configureStore({ reducer: { auth: auth.reducer, ui: ui.reducer }, middleware: (g) => g({ thunk: false }).concat(saga) });
saga.run(rootSaga);
