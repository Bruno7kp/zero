// src/layouts/MainLayout.tsx
import React from 'react';
import { Outlet, NavLink as ReactNavLink, Link } from 'react-router-dom';
import { AppShell, NavLink, rem, ThemeIcon, Group, Text, Anchor, useMantineColorScheme, useMantineTheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Header } from '../components/Header';
import { useTranslation } from 'react-i18next';
import { useAuth } from "../contexts/AuthContext.tsx";
import {
    IconFlame,
    IconInfoCircle,
    IconListNumbers,
    IconMessageCircle,
    IconPlaylist,
    IconSettings,
    IconUsers
} from "@tabler/icons-react";

const MainLayout: React.FC = () => {
    const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
    const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(false);
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth();
    const currentYear = new Date().getFullYear();
    const { colorScheme } = useMantineColorScheme();
    const theme = useMantineTheme();

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !mobileOpened, desktop: !desktopOpened, } }}
            padding="md"
        >
            <AppShell.Header>
                <Header
                    mobileOpened={mobileOpened}
                    toggleMobile={toggleMobile}
                    desktopOpened={desktopOpened}
                    toggleDesktop={toggleDesktop}
                />
            </AppShell.Header>

            <AppShell.Navbar>
                {/* Itens do menu mobile aqui */}
                <AppShell.Section grow>
                    {isAuthenticated && (
                        <>
                            <NavLink
                                leftSection={
                                    <ThemeIcon variant="transparent" size="sm" radius="sm" color="blue" autoContrast>
                                        <IconListNumbers style={{width: rem(20), height: rem(20)}}/>
                                    </ThemeIcon>}
                                label={t('charts.title')}
                                to="/charts"
                                component={ReactNavLink}
                                onClick={toggleMobile}
                            />
                            <NavLink
                                leftSection={
                                    <ThemeIcon variant="transparent" size="sm" radius="sm" color="red" autoContrast>
                                        <IconFlame style={{width: rem(20), height: rem(20)}}/>
                                    </ThemeIcon>}
                                label={t('charts.live')}
                                to="/live"
                                component={ReactNavLink}
                                onClick={toggleMobile}
                                color="red"
                            />
                            <NavLink
                                leftSection={
                                    <ThemeIcon variant="transparent" size="sm" radius="sm" color="blue" autoContrast>
                                        <IconPlaylist style={{width: rem(20), height: rem(20)}}/>
                                    </ThemeIcon>}
                                label={t('library.title')}
                                to="/library"
                                component={ReactNavLink}
                                onClick={toggleMobile}
                                color="blue"
                            />
                            <NavLink
                                leftSection={
                                    <ThemeIcon variant="transparent" size="sm" radius="sm" color="blue" autoContrast>
                                        <IconUsers style={{width: rem(20), height: rem(20)}}/>
                                    </ThemeIcon>}
                                label={t('user.friends')}
                                to="/friends"
                                component={ReactNavLink}
                                onClick={toggleMobile}
                                color="blue"
                            />
                        </>
                    )}
                    <NavLink
                        leftSection={
                            <ThemeIcon variant="transparent" size="sm" radius="sm" color="blue" autoContrast>
                                <IconInfoCircle style={{width: rem(20), height: rem(20)}}/>
                            </ThemeIcon>}
                        label={t('user.faq')}
                        to="/faq"
                        component={ReactNavLink}
                        onClick={toggleMobile}
                        color="blue"
                    />
                    <NavLink
                        leftSection={
                            <ThemeIcon variant="transparent" size="sm" radius="sm" color="blue" autoContrast>
                                <IconMessageCircle style={{width: rem(20), height: rem(20)}}/>
                            </ThemeIcon>}
                        label={t('user.forum')}
                        to="/forum"
                        component={ReactNavLink}
                        onClick={toggleMobile}
                        color="blue"
                    />
                </AppShell.Section>
                <AppShell.Section>
                    {isAuthenticated && (
                        <NavLink
                            leftSection={
                                <ThemeIcon variant="transparent" size="sm" radius="sm" color="blue" autoContrast>
                                    <IconSettings style={{width: rem(20), height: rem(20)}}/>
                                </ThemeIcon>}
                            label={t('settings.title')}
                            to="/settings"
                            component={ReactNavLink}
                            onClick={toggleMobile}
                            color="blue"
                        />
                    )}
                    <Group p="sm" align="center">
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
                </AppShell.Section>
            </AppShell.Navbar>

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
        </AppShell>
    );
};

export default MainLayout;