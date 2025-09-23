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
            <h1>Página em construção</h1>
        </div>
    );
};

export default ProfilePage;
