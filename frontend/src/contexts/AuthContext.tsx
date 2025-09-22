// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface User {
    name: string;
    email: string;
    avatar: string;
}

interface AuthContextProps {
    user: User | null;
    isAuthenticated: boolean;
    isAuthLoading: boolean;
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
    const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
    const isAuthenticated = !!user;

    const loginWithGoogle = async (googleResponse: any) => {
        try {
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
            localStorage.setItem('user-token', data.token);
            localStorage.setItem('user-data', JSON.stringify(data.user));
            setUser(data.user);
            console.log('Login successful:', data.user);
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    const logout = () => {
        localStorage.removeItem('user-token');
        localStorage.removeItem('user-data');
        setUser(null);
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user-data');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsAuthLoading(false);
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isAuthLoading, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};