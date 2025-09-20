// src/providers/AppProviders.tsx
import React, { type ReactNode } from 'react';
import { MantineProvider, createTheme } from '@mantine/core';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '../contexts/AuthContext';

const theme = createTheme({
    defaultRadius: 'lg',
});

interface AppProvidersProps {
    children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
    return (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <AuthProvider>
                <MantineProvider theme={theme} defaultColorScheme="dark">
                    {children}
                </MantineProvider>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
};