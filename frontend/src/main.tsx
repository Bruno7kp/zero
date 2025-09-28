// src/main.tsx
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ensureDbReady } from './db/indexedDb';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import 'mantine-datatable/styles.css';
import './assets/styles/custom.css';
import { AppProviders } from './providers/AppProviders';

export function Root() {
    const [ready, setReady] = useState(false);
    useEffect(() => {
        let mounted = true;
        ensureDbReady().finally(() => { if (mounted) setReady(true); });
        return () => { mounted = false; };
    }, []);
    if (!ready) return null; // could render a splash/loading if desired
    return (
        <AppProviders>
            <App />
        </AppProviders>
    );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <Root />
    </React.StrictMode>
);