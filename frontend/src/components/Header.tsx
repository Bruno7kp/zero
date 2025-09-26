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
import { useSelector, useDispatch } from 'react-redux';
import { logout as reduxLogout } from '../store/authSlice';
import { setTheme } from '../store/themeSlice';
import { setLanguage } from '../store/i18nSlice';

export const Header: React.FC = () => {
    const dispatch = useDispatch();
    const user = useSelector((state: any) => state.auth.user);
    const isAuthenticated = useSelector((state: any) => state.auth.user !== null);
    const reduxTheme = useSelector((state: any) => state.theme.value);
    const reduxLanguage = useSelector((state: any) => state.i18n.language);
    const { colorScheme, setColorScheme } = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme('dark', { getInitialValueInEffect: true });
    const { i18n, t } = useTranslation();

    const handleLogout = () => {
        dispatch(reduxLogout() as any).unwrap();
    };

    // Sincroniza Redux -> Mantine
    React.useEffect(() => {
        if (reduxTheme !== colorScheme) {
            setColorScheme(reduxTheme);
        }
    }, [reduxTheme, colorScheme, setColorScheme]);

    // Sincroniza Redux -> i18next
    React.useEffect(() => {
        if (i18n.language !== reduxLanguage) {
            i18n.changeLanguage(reduxLanguage);
        }
    }, [reduxLanguage, i18n]);

    // Ao trocar tema pelo botão
    const handleToggleTheme = () => {
        const nextTheme = colorScheme === 'dark' ? 'light' : 'dark';
        dispatch(setTheme(nextTheme));
        setColorScheme(nextTheme);
    };

    // Ao trocar idioma pelo menu
    const changeLanguage = (lng: 'en' | 'pt') => {
        dispatch(setLanguage(lng));
    };

    const rightSection = (
        <Group>
            <ActionIcon
                onClick={handleToggleTheme}
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