import React, { type ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter } from 'react-router-dom';
import { DatesProvider } from '@mantine/dates';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { useTranslation } from 'react-i18next';
import { Provider } from 'react-redux';
import { store } from '../store';
import { buildTheme } from '../theme/appTheme';
import { useSelector } from 'react-redux';
import type { ThemeMode } from '../theme/modes';

// Theme creation moved to src/theme/appTheme.ts

interface AppProvidersProps { children: ReactNode; }

const ThemedProviders: React.FC<AppProvidersProps> = ({ children }) => {
    const { i18n } = useTranslation();
    const themeMode = useSelector((s: any) => (s.theme?.value as ThemeMode) || 'dark');
    const langKey = i18n.language.split('-')[0];

    const theme = buildTheme(themeMode);

    return (
        <MantineProvider theme={theme} defaultColorScheme="dark">
            <DatesProvider settings={{ locale: langKey || 'en' }}>
                <ModalsProvider>
                    <Notifications position="top-left" />
                    <BrowserRouter>{children}</BrowserRouter>
                </ModalsProvider>
            </DatesProvider>
        </MantineProvider>
    );
};

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => (
    <Provider store={store}>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <ThemedProviders>{children}</ThemedProviders>
        </GoogleOAuthProvider>
    </Provider>
);
