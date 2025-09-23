// src/layouts/MainLayout.tsx
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import {
    AppShell,
    rem,
    Group,
    Text,
    Anchor,
    useMantineColorScheme,
    useMantineTheme,
    Container,
    ActionIcon
} from '@mantine/core';
import { Header } from '../components/Header';
import { useTranslation } from 'react-i18next';
import {
    IconBrandGithub
} from "@tabler/icons-react";

const MainLayout: React.FC = () => {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();
    const { colorScheme } = useMantineColorScheme();
    const theme = useMantineTheme();

    return (
        <AppShell
            header={{ height: 60 }}
            padding="md"
        >
            <AppShell.Header>
                <Header/>
            </AppShell.Header>

            <AppShell.Main
                style={{
                    backgroundColor:
                        colorScheme === 'dark'
                            ? theme.colors.dark[8]
                            : theme.colors.gray[1],
                }}
            >
                <Outlet />
            </AppShell.Main>
            <Container>
                <Group p="sm" w="100%" justify="center" gap={0}>
                    <ActionIcon
                        component="a"
                        href="https://github.com/bruno7kp/zero"
                        target="_blank"
                        variant="subtle"
                        size="md"
                        aria-label={t('github')}
                    >
                        <IconBrandGithub style={{ width: rem(15), height: rem(15) }} />
                    </ActionIcon>
                    <Text size="sm" ta="center">
                        <Anchor component={Link} to="/changelog" size="sm">
                            {t('changelog.current')}
                        </Anchor>
                        {' - '}
                        © {currentYear} ZeroCharts. {t('user.rights')}.
                        {' - '}
                        <Anchor component={Link} to="/terms" size="sm">
                            {t('user.terms')}
                        </Anchor>
                        {' - '}
                        <Anchor component={Link} to="/privacy" size="sm">
                            {t('user.privacy')}
                        </Anchor>
                    </Text>
                </Group>
            </Container>

        </AppShell>
    );
};

export default MainLayout;