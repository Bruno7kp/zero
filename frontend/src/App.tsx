// src/App.tsx
import { type JSX } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import FaqPage from './pages/FaqPage';
import ForumPage from './pages/ForumPage';
import LivePage from './pages/LivePage';
import ProfilePage from './pages/ProfilePage';
import ChartsPage from './pages/ChartsPage';
import ChartsWeekPage from './pages/ChartsWeekPage';
import SettingsPage from './pages/SettingsPage';
import MainLayout from './layouts/MainLayout';
import { useAuth } from './contexts/AuthContext';
import './i18n';
import CreateChartPage from "./pages/CreateChartPage.tsx";
import { Loader, Center, Flex, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

// Componente para proteger rotas. Redireciona para o login se não estiver autenticado.
const ProtectedRoute = ({ children }: { children: JSX.Element; }) => {
    const { isAuthenticated, isAuthLoading } = useAuth();
    const { t } = useTranslation();

    // Se a autenticação ainda está sendo carregada, mostre um loader
    if (isAuthLoading) {
        return (
            <Center style={{ height: '100vh' }}>
                <Flex direction="column" align="center" gap="md">
                    <Loader size="xl" />
                    <Text>{t('settings.loadingAuth')}</Text>
                </Flex>
            </Center>
        );
    }

    // Redireciona para a página de login se o usuário não estiver autenticado
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

function App() {
    return (
        <Routes>
            {/* A rota de login é pública e não usa o MainLayout */}
            <Route path="/login" element={<LoginPage />} />

            {/* MainLayout como rota pai, que inclui todas as páginas da aplicação */}
            <Route path="/" element={<MainLayout />}>
                {/* Rotas públicas */}
                <Route index element={<HomePage />} />
                <Route path="faq" element={<FaqPage />} />
                <Route path="forum" element={<ForumPage />} />
                <Route path="terms" element={<FaqPage />} />
                <Route path="privacy" element={<FaqPage />} />
                <Route path="changelog" element={<FaqPage />} />

                {/* Rotas protegidas */}
                <Route
                    path="charts"
                    element={
                        <ProtectedRoute>
                            <ChartsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="charts/week/:week?/:type?"
                    element={
                        <ProtectedRoute>
                            <ChartsWeekPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="live"
                    element={
                        <ProtectedRoute>
                            <LivePage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="profile"
                    element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="library"
                    element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="friends"
                    element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="settings"
                    element={
                        <ProtectedRoute>
                            <SettingsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="settings/add-chart"
                    element={
                        <ProtectedRoute>
                            <CreateChartPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="settings/charts/:id"
                    element={
                        <ProtectedRoute>
                            <CreateChartPage />
                        </ProtectedRoute>
                    }
                />
            </Route>
        </Routes>
    );
}

export default App;