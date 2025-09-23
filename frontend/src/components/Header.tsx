// src/components/Header.tsx
import React from 'react';
import {
    Group,
    Button,
    Menu,
    Text,
    Anchor,
    Image,
    ActionIcon,
    useMantineColorScheme,
    rem,
    useComputedColorScheme,
} from '@mantine/core';
import {
    IconSun,
    IconMoonStars,
    IconLanguage,
    IconUserCircle,
    IconSettings,
    IconLogout,
    IconListNumbers,
    IconPlaylist,
    IconUsers,
    IconFlame,
    IconMessageCircle,
    IconInfoCircle,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Header: React.FC = () => {
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme('dark', { getInitialValueInEffect: true });
    const { i18n, t } = useTranslation();
    const { user, isAuthenticated, logout } = useAuth(); // Usando o hook de autenticação

    const changeLanguage = (lng: 'en' | 'pt') => {
        i18n.changeLanguage(lng);
    };

    const handleLogout = () => {
        logout();
    };

    const rightSection = (
        <Group>
            <ActionIcon
                onClick={() => toggleColorScheme()}
                variant="subtle"
                size="lg"
                aria-label={t('theme.toggle')}
            >
                {computedColorScheme === 'dark' ? (
                    <IconSun style={{ width: rem(20), height: rem(20) }} />
                ) : (
                    <IconMoonStars style={{ width: rem(20), height: rem(20) }} />
                )}
            </ActionIcon>

            <Menu shadow="md" width={150}>
                <Menu.Target>
                    <ActionIcon variant="subtle" size="lg" aria-label={t('user.changeLanguage')}>
                        <IconLanguage style={{ width: rem(20), height: rem(20) }} />
                    </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Item onClick={() => changeLanguage('en')}>English</Menu.Item>
                    <Menu.Item onClick={() => changeLanguage('pt')}>Português</Menu.Item>
                </Menu.Dropdown>
            </Menu>

            {/* Renderização condicional do botão de Login ou do Dropdown de Usuário */}
            {!isAuthenticated ? (
                // Botão de Login para usuários não autenticados
                <Button component={NavLink} to="/login" variant="default">
                    {t('user.login')}
                </Button>
            ) : (
                // Dropdown de Usuário para usuários autenticados
                <Menu shadow="md" width={200} trigger="click-hover" openDelay={100} closeDelay={400}>
                    <Menu.Target>
                        <ActionIcon variant="subtle" size="lg" aria-label={t('user.title')}>
                            <IconUserCircle style={{ width: rem(24), height: rem(24) }} />
                        </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Menu.Label>
                            <Text fw={500} size="sm">
                                {user?.name || t('user.title')}
                            </Text>
                        </Menu.Label>
                        <Menu.Item
                            component={NavLink}
                            to="/charts"
                            leftSection={<IconListNumbers style={{ width: rem(14), height: rem(14) }} />}
                        >
                            {t('charts.title')}
                        </Menu.Item>
                        <Menu.Item
                            component={NavLink}
                            to="/live"
                            leftSection={<IconFlame style={{ width: rem(14), height: rem(14) }} />}
                        >
                            {t('charts.live')}
                        </Menu.Item>
                        <Menu.Item
                            component={NavLink}
                            to="/library"
                            leftSection={<IconPlaylist style={{ width: rem(14), height: rem(14) }} />}
                        >
                            {t('library.title')}
                        </Menu.Item>
                        <Menu.Item
                            component={NavLink}
                            to="/friends"
                            leftSection={<IconUsers style={{ width: rem(14), height: rem(14) }} />}
                        >
                            {t('user.friends')}
                        </Menu.Item>
                        <Menu.Item
                            component={NavLink}
                            to="/settings"
                            leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}
                        >
                            {t('settings.title')}
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                            component={NavLink}
                            to="/forum"
                            leftSection={<IconMessageCircle style={{ width: rem(14), height: rem(14) }} />}
                        >
                            {t('user.forum')}
                        </Menu.Item>
                        <Menu.Item
                            component={NavLink}
                            to="/faq"
                            leftSection={<IconInfoCircle style={{ width: rem(14), height: rem(14) }} />}
                        >
                            {t('user.faq')}
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                            color="red"
                            leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
                            onClick={handleLogout}
                        >
                            {t('user.logout')}
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            )}
        </Group>
    );

    return (
        <Group h="100%" px="md" justify="space-between">
            <Group>
                <Anchor
                    component={Link}
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
            <Group visibleFrom="md">
                <Button component={NavLink} to="/charts" variant="subtle">
                    {t('charts.title')}
                </Button>
                <Button component={NavLink} to="/faq" variant="subtle">
                    {t('user.faq')}
                </Button>
                <Button component={NavLink} to="/forum" variant="subtle">
                    {t('user.forum')}
                </Button>
            </Group>
            {rightSection}
        </Group>
    );
};