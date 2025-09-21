import { useEffect } from 'react';
import {
    Flex,
    Select,
    Title,
    Text,
    Loader,
    Center,
    Button,
    Grid,
    ThemeIcon,
    rem,
    Divider,
    Group,
    Card
} from '@mantine/core';
import { useCharts } from '../contexts/ChartContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import {IconListNumbers, IconSettings} from "@tabler/icons-react";

const SettingsPage = () => {
    const { isAuthenticated } = useAuth();
    const { charts, isLoading, activeChartId, fetchCharts, setActiveChartId } = useCharts();
    const { t } = useTranslation();

    useEffect(() => {
        if (isAuthenticated) {
            fetchCharts();
        }
    }, [isAuthenticated, fetchCharts]);

    if (isLoading) {
        return (
            <Center style={{ height: '100vh' }}>
                <Flex direction="column" align="center" gap="md">
                    <Loader size="xl" />
                    <Text>{t('settings.loadingCharts')}</Text>
                </Flex>
            </Center>
        );
    }

    const chartOptions = charts.map(chart => ({
        value: String(chart.id),
        label: chart.name,
    }));

    return (
        <Flex direction="column" p="xs" gap="sm">
            <Grid>
                <Grid.Col span={{ base: 12 }}>
                    <Title order={2}>
                        <ThemeIcon variant="light" color="blue" size="md" me="sm">
                            <IconSettings style={{ width: rem(20), height: rem(20) }}/>
                        </ThemeIcon>
                        {t('settings.title')}
                    </Title>
                </Grid.Col>
            </Grid>
            <Divider variant="solid" size="sm" my="md"/>
            <Grid>
                <Grid.Col span={{ base: 12 }}>
                    <Title order={2}>
                        <ThemeIcon variant="light" color="blue" size="md" me="sm">
                            <IconListNumbers style={{ width: rem(20), height: rem(20) }}/>
                        </ThemeIcon>
                        {t('settings.chartTitle')}
                    </Title>
                </Grid.Col>
            </Grid>
            <Grid>
                <Grid.Col span={{base: 12, md: 8, lg: 6}}>
                    <Card shadow="md" p="md">
                        <Group justify="space-between">
                            <Text fw={500} size="lg">{t('settings.activeChartPlaceholder')}</Text>
                        </Group>
                        <Divider variant="dashed" size="sm" my="xs"/>
                        <Group justify="space-between" mb="xs">
                            <Text fw={500} size="sm">{t('settings.activeChartInfo')}</Text>
                            {charts.length === 0 && (
                                <Text size="sm" c="red">
                                    {t('settings.noCharts')}
                                </Text>
                            )}
                        </Group>
                        <Flex gap="md" align="flex-end">
                            <Select
                                label={t('settings.activeChartLabel')}
                                placeholder={t('settings.activeChartPlaceholder')}
                                data={chartOptions}
                                value={activeChartId ? String(activeChartId) : null}
                                onChange={(value) => setActiveChartId(value ? Number(value) : null)}
                                allowDeselect
                                clearable
                                style={{ flex: 1 }}
                            />
                            <Button component={NavLink} to="/settings/chart" mt="md">
                                {t('forms.createChart.title')}
                            </Button>
                        </Flex>
                    </Card>
                </Grid.Col>
                <Grid.Col span={{base: 12}}>
                    {charts.length > 0 && (
                        <Text c="dimmed" mt="md">
                            {t('settings.noCharts')}
                        </Text>
                    )}
                </Grid.Col>
            </Grid>
        </Flex>
    );
};

export default SettingsPage;