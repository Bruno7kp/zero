// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import '@mantine/core/styles.css';
import { AppProviders } from './providers/AppProviders';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <AppProviders>
            <App />
        </AppProviders>
    </React.StrictMode>,
);