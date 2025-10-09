// import React from 'react';
import { Button, Card, Divider, Group, rem, Text, ThemeIcon, useMantineTheme } from '@mantine/core';
import { IconFlame } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { getCardBackgroundByMode, type ThemeMode } from '../theme/modes';

export const ChartLiveSummary = () => {
    const { t } = useTranslation();
    const theme = useMantineTheme();
    const themeMode = useSelector((s: any) => (s.theme?.value as ThemeMode) || 'dark');
    return (
        <Card shadow="md" p="md" style={{ background: getCardBackgroundByMode(theme, themeMode) }}>
            <Group>
                <ThemeIcon variant="light" color="red" size="md">
                    <IconFlame style={{ width: rem(20), height: rem(20) }} />
                </ThemeIcon>
                <Text fw={600} size="lg">{t('charts.live')}</Text>
            </Group>
            <Divider variant="dashed" size="sm" my="xs"/>
            <Group justify="space-between">
                <Button
                    component={Link}
                    to={`/live`}
                    size="sm"
                    fullWidth
                    variant="light"
                    aria-label={t('charts.viewLive')}
                >
                    {t('charts.viewLive')}
                </Button>
            </Group>
        </Card>
    );
};