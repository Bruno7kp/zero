// src/pages/LoginPage.tsx
import React from 'react';
import {
    Container,
    Group, Card, Text, Divider, Image, Anchor, useMantineColorScheme,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { GoogleLogin } from '@react-oauth/google';
import { useSelector, useDispatch } from 'react-redux';
import { loginWithGoogle } from '../store/authSlice';
import {Link, useNavigate} from 'react-router-dom';

const LoginPage: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const isAuthenticated = useSelector((state: any) => state.auth.user !== null);
    const navigate = useNavigate();
    const { colorScheme } = useMantineColorScheme();
    const currentYear = new Date().getFullYear();

    // Redirecionar para a home se o usuário já estiver autenticado
    React.useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleGoogleSuccess = async (credentialResponse: any) => {
        // Enviar a resposta do Google para a nossa função de login do contexto
        await dispatch(loginWithGoogle(credentialResponse) as any).unwrap();
    };

    const handleGoogleFailure = () => {
        console.log("Login with Google failed");
    };

    return (
        <Container size={420} my={40}>
            <Group justify="center">
                <Anchor
                    component={Link}
                    mb="lg"
                    to="/">
                    <Image
                        src={ colorScheme !== 'dark' ? "/zero-black.png" : "/zero-white.png" }
                        radius="md"
                        h={40}
                        w="auto"
                        fit="contain"
                    />
                </Anchor>
            </Group>

            <Card shadow="md">
                <Group justify="center">
                    <Text fw={600} size="lg">{t('user.login')}</Text>
                </Group>
                <Divider variant="dashed" size="sm" my="xs"/>
                <Group grow mb="md" mt="md" justify="center">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleFailure}
                    />
                </Group>
                <Divider variant="dashed" size="sm" my="xs"/>
                <Group p="sm" justify="center">
                    <Text size="xs" ta="center">
                        © {currentYear} ZeroCharts. {t('user.rights')}.<br/>
                        <Anchor component={Link} to="/terms" size="sm">
                            {t('user.terms')}
                        </Anchor>
                        {' | '}
                        <Anchor component={Link} to="/privacy" size="sm">
                            {t('user.privacy')}
                        </Anchor>
                    </Text>
                </Group>
            </Card>
        </Container>
    );
};

export default LoginPage;