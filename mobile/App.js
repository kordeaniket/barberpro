import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store, authSlice } from './src/redux/store';
import { hydrateTokens, setUnauthorizedHandler } from './src/services/api';
import { startRealtimeNotifications, stopRealtimeNotifications } from './src/services/socket';
import { I18nProvider } from './src/i18n';
import SplashScreen from './src/components/SplashScreen';
import GlobalLoader from './src/components/GlobalLoader';
import ToastBanner from './src/components/ToastBanner';
import LiveNotificationBanner from './src/components/LiveNotificationBanner';
import AppNavigator from './src/navigation/AppNavigator';

function Bootstrap() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      dispatch(authSlice.actions.logout());
    });

    const start = Date.now();
    hydrateTokens().then(({ user: storedUser }) => {
      dispatch(authSlice.actions.hydrateDone(storedUser));
      const elapsed = Date.now() - start;
      const wait = Math.max(0, 1200 - elapsed);
      setTimeout(() => setReady(true), wait);
    });
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      startRealtimeNotifications(user, dispatch);
    } else {
      stopRealtimeNotifications();
    }
    return () => stopRealtimeNotifications();
  }, [user, dispatch]);

  if (!ready) {
    return <SplashScreen />;
  }

  return (
    <>
      <AppNavigator />
      <GlobalLoader />
      <ToastBanner />
      <LiveNotificationBanner />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <I18nProvider>
          <StatusBar style="dark" />
          <Bootstrap />
        </I18nProvider>
      </Provider>
    </SafeAreaProvider>
  );
}
