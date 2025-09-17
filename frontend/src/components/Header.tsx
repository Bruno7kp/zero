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
    //IconQuestionMark,
    //IconUsers,
    IconPalette, // Novo ícone para o seletor de tema
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
//import { useDisclosure } from '@mantine/hooks';

interface HeaderProps {
    mobileMenuOpened: boolean;
    toggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ mobileMenuOpened, toggleMobileMenu }) => {
    const { setColorScheme } = useMantineColorScheme(); // Adicionado setColorScheme
    const { i18n, t } = useTranslation();

    const changeLanguage = (lng: 'en' | 'pt') => {
        i18n.changeLanguage(lng);
    };

    const menuItems = (
        <Group visibleFrom="sm">
            <Button component={NavLink} to="/charts" variant="subtle">{t('Charts')}</Button>
            <Button component={NavLink} to="/live" variant="subtle">{t('Live')}</Button>
            <Button component={NavLink} to="/faq" variant="subtle">{t('FAQ')}</Button>
            <Button component={NavLink} to="/forum" variant="subtle">{t('Fórum')}</Button>
        </Group>
    );

    const rightSection = (
        <Group>
            {/* Botão do GitHub em primeiro */}
            <ActionIcon
                component="a"
                href="https://github.com/seu-usuario"
                target="_blank"
                variant="subtle"
                size="lg"
                aria-label={t('github')}
            >
                <IconBrandGithub style={{ width: rem(20), height: rem(20) }} />
            </ActionIcon>

            {/* Dropdown de Idioma */}
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

            {/* Dropdown de Tema (novo) */}
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

            {/* Dropdown de Usuário */}
            <Menu shadow="md" width={200}>
                <Menu.Target>
                    <ActionIcon variant="subtle" size="lg" aria-label={t('userMenu')}>
                        <IconUserCircle style={{ width: rem(24), height: rem(24) }} />
                    </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Label>{t('user')}</Menu.Label>
                    <Menu.Item leftSection={<IconUserCircle style={{ width: rem(14), height: rem(14) }} />}>{t('profile')}</Menu.Item>
                    <Menu.Item leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}>{t('settings')}</Menu.Item>
                    <Menu.Divider />
                    <Menu.Item leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}>{t('logout')}</Menu.Item>
                </Menu.Dropdown>
            </Menu>
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