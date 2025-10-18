import React from 'react';
import { Card, Group, Text, Stack, useMantineTheme } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { getCardBackgroundByMode, type ThemeMode } from '../../theme/modes';

interface LibraryStatsProps {
    type: 'artist' | 'album' | 'track';
    total: number;
    number1s: number;
    inChart: number;
}

export const LibraryStats: React.FC<LibraryStatsProps> = ({ type, total, number1s, inChart }) => {
    const { t } = useTranslation();
    const theme = useMantineTheme();
    const themeMode = useSelector((s: any) => (s.theme?.value as ThemeMode) || 'dark');

    return (
        <Card withBorder style={{ background: getCardBackgroundByMode(theme, themeMode) }}>
            <Group justify="space-around" grow>
                <Stack gap="xs" align="center">
                    <Text size="sm" c="dimmed">
                        {t(`library.total${type.charAt(0).toUpperCase() + type.slice(1)}s`)}
                    </Text>
                    <Text size="xl" fw={600}>
                        {total.toLocaleString()}
                    </Text>
                </Stack>

                <Stack gap="xs" align="center">
                    <Text size="sm" c="dimmed">
                        {t('library.number1s')}
                    </Text>
                    <Text size="xl" fw={600}>
                        {number1s.toLocaleString()}
                    </Text>
                </Stack>

                <Stack gap="xs" align="center">
                    <Text size="sm" c="dimmed">
                        {t('library.inChart')}
                    </Text>
                    <Text size="xl" fw={600}>
                        {inChart.toLocaleString()}
                    </Text>
                </Stack>
            </Group>
        </Card>
    );
};
