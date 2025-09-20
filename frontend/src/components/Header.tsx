// src/components/Header.tsx
import React from 'react';
import {
    Group,
    Button,
    Menu,
    Text,
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
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
    mobileMenuOpened: boolean;
    toggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ mobileMenuOpened, toggleMobileMenu }) => {
    const { setColorScheme } = useMantineColorScheme();
    const { i18n, t } = useTranslation();
    const { user, isAuthenticated, logout } = useAuth(); // Usando o hook de autenticação

    const changeLanguage = (lng: 'en' | 'pt') => {
        i18n.changeLanguage(lng);
    };

    const handleLogout = () => {
        logout();
    };

    const menuItems = (
        <Group visibleFrom="sm">
            {isAuthenticated && (
                <>
                    <Button component={NavLink} to="/charts" variant="subtle">{t('charts')}</Button>
                    <Button component={NavLink} to="/live" variant="subtle">{t('live')}</Button>
                </>
            )}
            <Button component={NavLink} to="/faq" variant="subtle">{t('FAQ')}</Button>
            <Button component={NavLink} to="/forum" variant="subtle">{t('forum')}</Button>
        </Group>
    );

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
                    <ActionIcon variant="subtle" size="lg" aria-label={t('changeLanguage')}>
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
                    <ActionIcon variant="subtle" size="lg" aria-label={t('toggleTheme')}>
                        <IconPalette style={{ width: rem(20), height: rem(20) }} />
                    </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Item onClick={() => setColorScheme('light')} leftSection={<IconSun style={{ width: rem(14), height: rem(14) }} />}>
                        {t('lightTheme')}
                    </Menu.Item>
                    <Menu.Item onClick={() => setColorScheme('dark')} leftSection={<IconMoonStars style={{ width: rem(14), height: rem(14) }} />}>
                        {t('darkTheme')}
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>

            {/* Renderização condicional do botão de Login ou do Dropdown de Usuário */}
            {!isAuthenticated ? (
                // Botão de Login para usuários não autenticados
                <Button component={NavLink} to="/login" variant="default">
                    {t('signIn')}
                </Button>
            ) : (
                // Dropdown de Usuário para usuários autenticados
                <Menu shadow="md" width={200}>
                    <Menu.Target>
                        <ActionIcon variant="subtle" size="lg" aria-label={t('userMenu')}>
                            <IconUserCircle style={{ width: rem(24), height: rem(24) }} />
                        </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Menu.Label>
                            <Text fw={500} size="sm">
                                {user?.name || t('user')}
                            </Text>
                        </Menu.Label>
                        <Menu.Item
                            component={NavLink}
                            to="/profile"
                            leftSection={<IconUserCircle style={{ width: rem(14), height: rem(14) }} />}
                        >
                            {t('profile')}
                        </Menu.Item>
                        <Menu.Item
                            component={NavLink}
                            to="/settings"
                            leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}
                        >
                            {t('settings')}
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
            <Burger opened={mobileMenuOpened} onClick={toggleMobileMenu} hiddenFrom="sm" size="sm" />
            <Text fw={700}>ZeroCharts</Text>
            {menuItems}
            {rightSection}
        </Group>
    );
};