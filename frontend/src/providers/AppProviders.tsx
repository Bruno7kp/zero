import React, { type ReactNode } from 'react';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter } from 'react-router-dom';
import { DatesProvider } from '@mantine/dates';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { useTranslation } from 'react-i18next';
import { Provider } from 'react-redux';
import { store, persistor } from '../store';
import { PersistGate } from 'redux-persist/integration/react';
import { buildTheme } from '../theme/appTheme';
import { useSelector } from 'react-redux';
import type { ThemeMode } from '../theme/modes';

// Theme creation moved to src/theme/appTheme.ts

interface AppProvidersProps {
  children: ReactNode;
}

const ThemedProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const themeMode = useSelector((s: any) => (s.theme?.value as ThemeMode) || 'dark');
  const langKey = i18n.language.split('-')[0];

  const theme = React.useMemo(() => buildTheme(themeMode), [themeMode]);

  // Cross-tab sync: when another tab updates persisted Redux (persist:root),
  // mirror theme changes into this tab's store to keep Mantine and Redux aligned.
  React.useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== 'persist:root' || !e.newValue) return;
      try {
        const root = JSON.parse(e.newValue);
        if (!root?.theme) return;
        const incoming = JSON.parse(root.theme);
        const incomingValue = incoming?.value as ThemeMode | undefined;
        if (incomingValue && incomingValue !== themeMode) {
          // Simpler strategy: reload this tab to apply the new theme cleanly
          // and avoid any intermediate flicker/loops.
          window.location.reload();
        }
      } catch {
        // ignore malformed values
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [themeMode]);

  return (
    <>
      <ColorSchemeScript defaultColorScheme="dark" />
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <DatesProvider settings={{ locale: langKey || 'en' }}>
          <ModalsProvider>
            <Notifications position="top-left" />
            <BrowserRouter>{children}</BrowserRouter>
          </ModalsProvider>
        </DatesProvider>
      </MantineProvider>
    </>
  );
};

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => (
  <Provider store={store}>
    <PersistGate persistor={persistor} loading={null}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <ThemedProviders>{children}</ThemedProviders>
      </GoogleOAuthProvider>
    </PersistGate>
  </Provider>
);
