// src/App.tsx
import { type JSX } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import FaqPage from './pages/FaqPage';
import ForumPage from './pages/ForumPage';
import LivePage from './pages/LivePage';
import ProfilePage from './pages/ProfilePage';
import ChartsPage from './pages/ChartsPage';
import SettingsPage from './pages/SettingsPage';
import MainLayout from './layouts/MainLayout';
import { useAuth } from './contexts/AuthContext';
import './i18n';

// Componente para proteger rotas. Redireciona para o login se não estiver autenticado.
const ProtectedRoute = ({ children }: { children: JSX.Element; }) => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* A rota de login é pública e não usa o MainLayout */}
                <Route path="/login" element={<LoginPage />} />

                {/* MainLayout como rota pai, que inclui todas as páginas da aplicação */}
                <Route path="/" element={<MainLayout />}>
                    {/* Rotas públicas */}
                    <Route index element={<HomePage />} />
                    <Route path="faq" element={<FaqPage />} />
                    <Route path="forum" element={<ForumPage />} />

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
                        path="settings"
                        element={
                            <ProtectedRoute>
                                <SettingsPage />
                            </ProtectedRoute>
                        }
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;