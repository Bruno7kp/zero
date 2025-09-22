// src/pages/HomePage.tsx
import React from 'react';
import {
    Box,
    Button,
    Container,
    Flex,
    Text,
    Title,
    rem,
    SimpleGrid,
    Card,
    ThemeIcon,
    Divider,
    useMantineColorScheme,
    useMantineTheme, Image,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { NavLink } from 'react-router-dom';
import {
    IconArrowRight,
    IconChartBar,
    IconLogin,
    IconPlayerPlay,
    IconSettings,
    IconStar,
} from '@tabler/icons-react';

const HomePage: React.FC = () => {
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth();
    const { colorScheme } = useMantineColorScheme();
    const theme = useMantineTheme();

    // Dados para a seção "Última Atualização"
    const latestUpdate = {
        title: t('changelog.v1-0-0.title'),
        date: '2025-09-22',
        description: t('changelog.v1-0-0.description'),
    };

    return (
        <Box>
            {/* Seção Hero */}
            <Box
                style={{
                    height: rem(500),
                    background: 'url(/zero-bg.jpeg) no-repeat center center',
                    backgroundSize: 'cover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    '::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    },
                }}
            >
                <Flex direction="column" align="center" style={{ zIndex: 1, textAlign: 'center' }}>
                    <Image
                        src={colorScheme !== 'dark' ? "/zero-black.png" : "/zero-white.png"}
                        radius="md"
                        h={80}
                        w="auto"
                        fit="contain"
                    />
                    <Text
                        size="xl"
                        mt="md"
                        c="white"
                        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                    >
                        {t('home.hero.subtitle')}
                    </Text>
                </Flex>
            </Box>

            {/* Seção Sobre o ZeroCharts */}
            <Container py="xl" my="xl">
                <Title order={2} ta="center" mb="lg">
                    <ThemeIcon variant="light" color="blue" size="md" me="sm">
                        <IconChartBar style={{ width: rem(20), height: rem(20) }} />
                    </ThemeIcon>
                    {t('home.about.title')}
                </Title>
                <SimpleGrid
                    cols={{ base: 1, md: 3 }}
                    spacing="xl"
                    verticalSpacing="lg"
                    mt="xl"
                >
                    <Card shadow="sm" padding="lg" radius="md">
                        <ThemeIcon color="blue" size="xl" radius="xl">
                            <IconPlayerPlay style={{ width: rem(24), height: rem(24) }} />
                        </ThemeIcon>
                        <Title order={4} mt="sm">
                            {t('home.about.feature1Title')}
                        </Title>
                        <Text size="sm" c="dimmed">
                            {t('home.about.feature1Description')}
                        </Text>
                    </Card>
                    <Card shadow="sm" padding="lg" radius="md">
                        <ThemeIcon color="red" size="xl" radius="xl">
                            <IconSettings style={{ width: rem(24), height: rem(24) }} />
                        </ThemeIcon>
                        <Title order={4} mt="sm">
                            {t('home.about.feature2Title')}
                        </Title>
                        <Text size="sm" c="dimmed">
                            {t('home.about.feature2Description')}
                        </Text>
                    </Card>
                    <Card shadow="sm" padding="lg" radius="md">
                        <ThemeIcon color="green" size="xl" radius="xl">
                            <IconStar style={{ width: rem(24), height: rem(24) }} />
                        </ThemeIcon>
                        <Title order={4} mt="sm">
                            {t('home.about.feature3Title')}
                        </Title>
                        <Text size="sm" c="dimmed">
                            {t('home.about.feature3Description')}
                        </Text>
                    </Card>
                </SimpleGrid>
                <Flex justify="center" mt="xl">
                    {isAuthenticated ? (
                        <Button
                            component={NavLink}
                            to="/charts"
                            size="lg"
                            rightSection={<IconArrowRight size={16} />}
                        >
                            {t('home.about.ctaLoggedIn')}
                        </Button>
                    ) : (
                        <Button
                            component={NavLink}
                            to="/login"
                            size="lg"
                            rightSection={<IconLogin size={16} />}
                        >
                            {t('home.about.ctaLoggedOut')}
                        </Button>
                    )}
                </Flex>
            </Container>

            {/* Seção Última Atualização */}
            <Box py="xl" style={{
                backgroundColor:
                    colorScheme === 'dark'
                        ? theme.colors.dark[7]
                        : 'white',
            }}>
                <Container>
                    <Title order={3} ta="center" mb="lg">
                        {t('home.latestUpdate.title')}
                    </Title>
                    <Card shadow="sm" padding="lg" radius="md">
                        <Title order={4}>{latestUpdate.title}</Title>
                        <Text size="sm" c="dimmed" mb="md">
                            {latestUpdate.date}
                        </Text>
                        <Divider my="sm" />
                        <Text>{latestUpdate.description}</Text>
                        <Flex justify="flex-end" mt="md">
                            <Button
                                component={NavLink}
                                to="/changelog"
                                variant="subtle"
                                rightSection={<IconArrowRight size={16} />}
                            >
                                {t('home.latestUpdate.button')}
                            </Button>
                        </Flex>
                    </Card>
                </Container>
            </Box>
        </Box>
    );
};

export default HomePage;