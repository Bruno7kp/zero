import React, { type ReactNode } from 'react';
import { MantineProvider, createTheme } from '@mantine/core';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '../contexts/AuthContext';
import { ChartProvider } from '../contexts/ChartContext';
import { BrowserRouter } from 'react-router-dom';
import { DatesProvider } from '@mantine/dates';
import { useTranslation } from 'react-i18next';

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
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <AuthProvider>
                <ChartProvider>
                    <MantineProvider theme={theme} defaultColorScheme="dark">
                        <DatesProvider settings={{ locale: langKey || 'en' }}>
                            <BrowserRouter>{children}</BrowserRouter>
                        </DatesProvider>
                    </MantineProvider>
                </ChartProvider>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
};
