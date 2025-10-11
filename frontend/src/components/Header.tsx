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
    Indicator,
    Badge,
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
    IconDroplet,
    IconMoon,
    IconBell,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { NavLink, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout as reduxLogout } from '../store/authSlice';
import { setTheme } from '../store/themeSlice';
import { getNextThemeMode, toMantineColorScheme } from '../theme/modes';
import { getThemeAssets } from '../theme/assets';
import type { ThemeMode } from '../theme/modes';
import { setLanguage } from '../store/i18nSlice';
import { useNotifications } from '../hooks/useNotifications';

export const Header: React.FC = () => {
    const dispatch = useDispatch();
    const user = useSelector((state: any) => state.auth.user);
    const isAuthenticated = useSelector((state: any) => state.auth.user !== null);
    const reduxTheme = useSelector((state: any) => state.theme.value);
    const reduxLanguage = useSelector((state: any) => state.i18n.language);
    const { setColorScheme } = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme('dark', { getInitialValueInEffect: true });
    const { i18n, t } = useTranslation();
    const { unreadCount } = useNotifications();
    const unreadBadgeLabel = unreadCount > 99 ? '99+' : `${unreadCount}`;

    const handleLogout = () => {
        dispatch(reduxLogout() as any).unwrap();
    };

    // Sincroniza Redux -> Mantine (blue usa esquema dark internamente)
    React.useEffect(() => {
        const target = toMantineColorScheme(reduxTheme as ThemeMode);
        setColorScheme(target);
    }, [reduxTheme, setColorScheme]);

    // Sincroniza Redux -> i18next
    React.useEffect(() => {
        if (i18n.language !== reduxLanguage) {
            i18n.changeLanguage(reduxLanguage);
        }
    }, [reduxLanguage, i18n]);

    // Ao trocar tema pelo botão
    const handleToggleTheme = () => {
        const next = getNextThemeMode(reduxTheme as ThemeMode);
        dispatch(setTheme(next));
        // setColorScheme will be updated by the effect above
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
                {(() => {
                    const { toggleIconId: id } = getThemeAssets(reduxTheme as any, computedColorScheme);
                    if (id === 'droplet') return <IconDroplet style={{ width: rem(20), height: rem(20) }} />;
                    if (id === 'sun') return <IconSun style={{ width: rem(20), height: rem(20) }} />;
                    if (id === 'moonAlt') return <IconMoon style={{ width: rem(20), height: rem(20) }} />;
                    return <IconMoonStars style={{ width: rem(20), height: rem(20) }} />;
                })()}
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
                        <Indicator disabled={unreadCount === 0} color="red" size={10} offset={7}>
                            <ActionIcon variant="subtle" size="lg" aria-label={t('user.title')}>
                                <IconUserCircle style={{ width: rem(24), height: rem(24) }} />
                            </ActionIcon>
                        </Indicator>
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
                        <Menu.Divider />
                        <Menu.Item
                            component={NavLink}
                            to="/notifications"
                            leftSection={<IconBell style={{ width: rem(14), height: rem(14) }} />}
                            rightSection={unreadCount > 0 ? (
                                <Badge color="red" variant="filled" size="xs">
                                    {unreadBadgeLabel}
                                </Badge>
                            ) : undefined}
                        >
                            {t('notifications.title')}
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
                        src={ getThemeAssets(reduxTheme as any, computedColorScheme).logoSrc }
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