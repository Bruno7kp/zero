// src/layouts/MainLayout.tsx
import React from 'react';
import { Outlet, NavLink as ReactNavLink } from 'react-router-dom';
import { AppShell, NavLink, rem, ThemeIcon, Group, Text, Anchor } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Header } from '../components/Header';
import { useTranslation } from 'react-i18next';
import { useAuth } from "../contexts/AuthContext.tsx";
import {
    IconFlame,
    IconInfoCircle,
    IconListNumbers,
    IconMessageCircle, IconPlaylist, IconSettings, IconUsers
} from "@tabler/icons-react";

const MainLayout: React.FC = () => {
    const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
    const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth();
    const currentYear = new Date().getFullYear();

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
                                color="red"
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
                                color="red"
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
                    <Group p="sm">
                        <Text size="xs">
                            © {currentYear} ZeroCharts. Todos os direitos reservados.<br/>
                            <Anchor href="/termos-de-uso" size="sm">
                                Termos de Uso
                            </Anchor>
                            {' | '}
                            <Anchor href="/politica-de-privacidade" size="sm">
                                Política de Privacidade
                            </Anchor>
                        </Text>
                    </Group>
                </AppShell.Section>
            </AppShell.Navbar>

            <AppShell.Main>
                <Outlet />
            </AppShell.Main>
        </AppShell>
    );
};

export default MainLayout;