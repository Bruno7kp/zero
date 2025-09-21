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
    Burger,
} from '@mantine/core';
import {
    IconSun,
    IconMoonStars,
    IconLanguage,
    IconUserCircle,
    IconSettings,
    IconLogout,
    IconBrandGithub,
    IconPalette,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
    mobileOpened: boolean;
    toggleMobile: () => void;
    desktopOpened: boolean;
    toggleDesktop: () => void;
}

export const Header: React.FC<HeaderProps> = ({ mobileOpened, toggleMobile, desktopOpened, toggleDesktop }) => {
    const { setColorScheme, colorScheme } = useMantineColorScheme();
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
                component="a"
                href="https://github.com/bruno7kp/zero"
                target="_blank"
                variant="subtle"
                size="lg"
                aria-label={t('github')}
            >
                <IconBrandGithub style={{ width: rem(20), height: rem(20) }} />
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

            <Menu shadow="md" width={150}>
                <Menu.Target>
                    <ActionIcon variant="subtle" size="lg" aria-label={t('theme.toggle')}>
                        <IconPalette style={{ width: rem(20), height: rem(20) }} />
                    </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Item onClick={() => setColorScheme('light')} leftSection={<IconSun style={{ width: rem(14), height: rem(14) }} />}>
                        {t('theme.light')}
                    </Menu.Item>
                    <Menu.Item onClick={() => setColorScheme('dark')} leftSection={<IconMoonStars style={{ width: rem(14), height: rem(14) }} />}>
                        {t('theme.dark')}
                    </Menu.Item>
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
                <Menu shadow="md" width={200}>
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
                            to="/profile"
                            leftSection={<IconUserCircle style={{ width: rem(14), height: rem(14) }} />}
                        >
                            {t('user.profile')}
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
                            color="red"
                            leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
                            onClick={handleLogout}
                        >
                            {t('logout')}
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            )}
        </Group>
    );

    return (
        <Group h="100%" px="md" justify="space-between">
            <Group>
                <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
                <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
                <Anchor
                    component={Link}
                    to="/">
                    <Image
                        src={ colorScheme !== 'dark' ? "https://i.imgur.com/NvbfhEa.png" : "https://i.imgur.com/N1c2b3t.png" }
                        radius="md"
                        h={40}
                        w="auto"
                        fit="contain"
                    />
                </Anchor>
            </Group>
            {rightSection}
        </Group>
    );
};