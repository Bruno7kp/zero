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

const forest: [string, string, string, string, string, string, string, string, string, string] = [
    '#e6f4ea',
    '#b3e1c6',
    '#80cd9f',
    '#4dbd78',
    '#26a65b',
    '#008f4c',
    '#0f7b45',
    '#007a3e',
    '#00672f',
    '#00541f',
];

const ruby: [string, string, string, string, string, string, string, string, string, string] = [
    '#ffe5e5',
    '#ffb3b3',
    '#ff8080',
    '#ff4d4d',
    '#ff1a1a',
    '#e60000',
    '#cc0000',
    '#b30000',
    '#990000',
    '#800000',
];

const cobalt: [string, string, string, string, string, string, string, string, string, string] = [
    '#e6f0ff',
    '#b3ccff',
    '#80aaff',
    '#4d94ff',
    '#1a75ff',
    '#0066e6',
    '#0052cc',
    '#0040b3',
    '#002d99',
    '#001a80',
];

const honey: [string, string, string, string, string, string, string, string, string, string] = [
    '#fff5e6',
    '#ffe6b3',
    '#ffd1a1',
    '#ffbc80',
    '#ffa65a',
    '#ff991f',
    '#ff8c00',
    '#ff8600',
    '#ff8000',
    '#ff7a00',
];

const theme = createTheme({
    defaultRadius: 'lg',
    fontFamily: 'Inter, Greycliff CF, sans-serif',
    colors: {
        forest,
        ruby,
        cobalt,
        honey,
    },
    components: {
        Modal: {
            defaultProps: {
                centered: true,
                overlayProps: {
                    blur: 5,
                    backgroundOpacity: 0.5,
                },
            },
        },
    },
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
