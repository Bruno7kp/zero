import React, { type ReactNode } from 'react';
import { MantineProvider, createTheme } from '@mantine/core';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter } from 'react-router-dom';
import { DatesProvider } from '@mantine/dates';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { useTranslation } from 'react-i18next';
import { Provider } from 'react-redux';
import { store } from '../store';


const theme = createTheme({
    defaultRadius: 'lg',
});

interface AppProvidersProps {
    children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
    const { i18n } = useTranslation();

    // pega só "pt" em vez de "pt-BR", se necessário
    const langKey = i18n.language.split('-')[0];

    return (
        <Provider store={store}>
            <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                <MantineProvider theme={theme} defaultColorScheme="dark">
                    <DatesProvider settings={{ locale: langKey || 'en' }}>
                        <ModalsProvider>
                            <Notifications position="top-left" />
                            <BrowserRouter>{children}</BrowserRouter>
                        </ModalsProvider>
                    </DatesProvider>
                </MantineProvider>
            </GoogleOAuthProvider>
        </Provider>
    );
};
