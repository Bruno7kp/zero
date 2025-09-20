// src/pages/LoginPage.tsx
import React from 'react';
import {
    Paper,
    Title,
    Container,
    Group,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
    const { t } = useTranslation();
    const { loginWithGoogle, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Redirecionar para a home se o usuário já estiver autenticado
    React.useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleGoogleSuccess = async (credentialResponse: any) => {
        // Enviar a resposta do Google para a nossa função de login do contexto
        await loginWithGoogle(credentialResponse);
    };

    const handleGoogleFailure = () => {
        console.log("Login with Google failed");
    };

    return (
        <Container size={420} my={40}>
            <Title ta="center">{t('welcome')}</Title>

            <Paper withBorder shadow="md" p={30} mt={30} radius="md">
                <Group grow mb="md" mt="md" justify="center">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleFailure}
                    />
                </Group>
            </Paper>
        </Container>
    );
};

export default LoginPage;