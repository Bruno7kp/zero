// import React from 'react';
import { Card, Group, ThemeIcon, Text, Divider, Grid, Select, Flex, Button, rem } from '@mantine/core';
import { IconStar } from '@tabler/icons-react';
import { NavLink } from 'react-router-dom';
import type { TFunction } from 'i18next';

interface ActiveChartOption {
    value: string;
    label: string;
}

interface ActiveChartCardProps {
    charts: { id: number; name: string;[key: string]: any }[];
    activeChartId: number | null;
    setActiveChartId: (id: number | null) => void;
    t: TFunction;
    chartOptions: ActiveChartOption[];
}

const ActiveChartCard: React.FC<ActiveChartCardProps> = ({
    charts,
    activeChartId,
    setActiveChartId,
    t,
    chartOptions
}) => (
    <Card shadow="md" p="md">
        <Group>
            <ThemeIcon variant="light" size="md">
                <IconStar style={{ width: rem(20), height: rem(20) }} />
            </ThemeIcon>
            <Text fw={600} size="lg">{t('settings.activeChartPlaceholder')}</Text>
        </Group>
        <Divider variant="dashed" size="sm" my="xs" />
        <Group justify="space-between" mb="xs">
            <Text fw={500} size="sm">{t('settings.activeChartInfo')}</Text>
            {charts.length === 0 && (
                <Text size="sm" c="red">
                    {t('settings.noCharts')}
                </Text>
            )}
        </Group>
        <Grid>
            <Grid.Col span={{ base: 12, md: 4, sm: 6 }}>
                <Select
                    label={t('settings.activeChartLabel')}
                    placeholder={t('settings.activeChartPlaceholder')}
                    data={chartOptions}
                    value={activeChartId ? String(activeChartId) : null}
                    onChange={(value) => setActiveChartId(value ? Number(value) : null)}
                    allowDeselect
                    clearable
                />
            </Grid.Col>
        </Grid>
        <Divider variant="dashed" size="sm" my="xs" />
        <Flex gap="xs" align="flex-end" justify="end">
            <Button component={NavLink} to="/settings/add-chart">
                {t('forms.createChart.title')}
            </Button>
        </Flex>
    </Card>
);

export default ActiveChartCard;
