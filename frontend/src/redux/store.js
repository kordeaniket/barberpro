import { configureStore, combineReducers } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { auth, ui, notifications } from './slices';
import rootSaga from './sagas';

const appReducer = combineReducers({
  auth: auth.reducer,
  ui: ui.reducer,
  notifications: notifications.reducer
});

const rootReducer = (state, action) => {
  if (action.type === auth.actions.logout.type) {
    state = undefined;
  }
  return appReducer(state, action);
};

const saga = createSagaMiddleware();
export const store = configureStore({
  reducer: rootReducer,
  middleware: (g) => g({ thunk: false }).concat(saga)
});
saga.run(rootSaga);
