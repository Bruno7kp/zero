// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// Tipagem para o estado do usuário. Você pode expandir isso mais tarde.
interface User {
    name: string;
    email: string;
    avatar: string;
}

interface AuthContextProps {
    user: User | null;
    isAuthenticated: boolean;
    loginWithGoogle: (googleResponse: any) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const isAuthenticated = !!user;

    // Função para lidar com o login do Google
    const loginWithGoogle = async (googleResponse: any) => {
        try {
            // 1. Enviar o token do Google para a nova rota do Laravel
            const response = await fetch('http://localhost:8081/api/auth/google/callback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: googleResponse.credential }),
            });

            if (!response.ok) {
                throw new Error('Failed to authenticate with backend');
            }

            const data = await response.json();

            // 2. Salvar o token de autenticação e os dados do usuário no localStorage
            localStorage.setItem('user-token', data.token);
            localStorage.setItem('user-data', JSON.stringify(data.user));

            // 3. Atualizar o estado do usuário
            setUser(data.user);

            console.log('Login successful:', data.user);

        } catch (error) {
            console.error('Login failed:', error);
            // Aqui você pode adicionar um aviso ao usuário (ex: toast notification)
        }
    };

    const logout = () => {
        // Limpar o localStorage e o estado do usuário
        localStorage.removeItem('user-token');
        localStorage.removeItem('user-data');
        setUser(null);
    };

    // Carregar o usuário do localStorage ao iniciar a aplicação
    useEffect(() => {
        const storedUser = localStorage.getItem('user-data');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};