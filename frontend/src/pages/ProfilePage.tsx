//import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage = () => {
    const { user } = useAuth();

    if (!user) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h1>Carregando Perfil...</h1>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h1>Perfil do Usuário</h1>
            <p>Bem-vindo, {user.name}!</p>
            <p>Email: {user.email}</p>
        </div>
    );
};

export default ProfilePage;
