// src/layouts/MainLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppShell, NavLink } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Header } from '../components/Header';
import { useTranslation } from 'react-i18next';

const MainLayout: React.FC = () => {
    const [mobileMenuOpened, { toggle: toggleMobileMenu }] = useDisclosure();
    const { t } = useTranslation();

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
                <NavLink label={t('Charts')} component="a" href="/charts" onClick={toggleMobileMenu} />
                <NavLink label={t('Live')} component="a" href="/live" onClick={toggleMobileMenu} />
                <NavLink label={t('FAQ')} component="a" href="/faq" onClick={toggleMobileMenu} />
                <NavLink label={t('Fórum')} component="a" href="/forum" onClick={toggleMobileMenu} />
            </AppShell.Navbar>

            <AppShell.Main>
                <Outlet />
            </AppShell.Main>
        </AppShell>
    );
};

export default MainLayout;