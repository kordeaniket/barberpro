import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider, useDispatch } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store, authSlice } from './src/redux/store';
import { hydrateTokens, setUnauthorizedHandler } from './src/services/api';
import { I18nProvider } from './src/i18n';
import SplashScreen from './src/components/SplashScreen';
import GlobalLoader from './src/components/GlobalLoader';
import ToastBanner from './src/components/ToastBanner';
import AppNavigator from './src/navigation/AppNavigator';

function Bootstrap() {
  const dispatch = useDispatch();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      dispatch(authSlice.actions.logout());
    });

    const start = Date.now();
    hydrateTokens().then(({ user }) => {
      dispatch(authSlice.actions.hydrateDone(user));
      const elapsed = Date.now() - start;
      const wait = Math.max(0, 1200 - elapsed);
      setTimeout(() => setReady(true), wait);
    });
  }, [dispatch]);

  if (!ready) {
    return <SplashScreen />;
  }

  return (
    <>
      <AppNavigator />
      <GlobalLoader />
      <ToastBanner />
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
