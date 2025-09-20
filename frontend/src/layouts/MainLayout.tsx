// src/layouts/MainLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppShell, NavLink } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Header } from '../components/Header';
import { useTranslation } from 'react-i18next';
import { useAuth } from "../contexts/AuthContext.tsx";

const MainLayout: React.FC = () => {
    const [mobileMenuOpened, { toggle: toggleMobileMenu }] = useDisclosure();
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth();

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !mobileMenuOpened } }}
            padding="md"
        >
            <AppShell.Header>
                <Header mobileMenuOpened={mobileMenuOpened} toggleMobileMenu={toggleMobileMenu} />
            </AppShell.Header>

            <AppShell.Navbar p="md" hiddenFrom="sm">
                {/* Itens do menu mobile aqui */}
                {isAuthenticated && (
                    <>
                        <NavLink label={t('charts')} component="a" href="/charts" onClick={toggleMobileMenu} />
                        <NavLink label={t('live')} component="a" href="/live" onClick={toggleMobileMenu} />
                    </>
                )}
                <NavLink label={t('FAQ')} component="a" href="/faq" onClick={toggleMobileMenu} />
                <NavLink label={t('forum')} component="a" href="/forum" onClick={toggleMobileMenu} />
            </AppShell.Navbar>

            <AppShell.Main>
                <Outlet />
            </AppShell.Main>
        </AppShell>
    );
};

export default MainLayout;