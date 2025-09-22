// src/pages/SettingsPage.tsx
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
    Card,
    ActionIcon
} from '@mantine/core';
import { useCharts } from '../contexts/ChartContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {generatePath, Link, NavLink} from 'react-router-dom';
import {IconEdit, IconListNumbers, IconSettings, IconTrash} from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from "@tabler/icons-react";

const SettingsPage = () => {
    const { isAuthenticated } = useAuth();
    const { charts, isLoading, activeChartId, fetchCharts, setActiveChartId, deleteChart } = useCharts();
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

    const openDeleteModal = (chartId: number, chartName: string) =>
        modals.openConfirmModal({
            title: t('forms.deleteChart.title', { name: chartName }),
            children: (
                <Text size="sm">
                    {t('forms.deleteChart.message', { name: chartName })}
                </Text>
            ),
            labels: { confirm: t('forms.deleteChart.deleteButton'), cancel: t('forms.deleteChart.cancelButton') },
            confirmProps: { color: 'red' },
            onCancel: () => console.log('Deleção cancelada'),
            onConfirm: async () => {
                const success = await deleteChart(chartId);
                if (success) {
                    notifications.show({
                        message: t('notifications.charts.delete.success', { chart: chartName }),
                        color: 'green',
                        icon: <IconCheck />,
                    });
                } else {
                    notifications.show({
                        message: t('notifications.charts.delete.error', { chart: chartName }),
                        color: 'red',
                        icon: <IconX />,
                    });
                }
            },
        });

    const chartOptions = charts.map(chart => ({
        value: String(chart.id),
        label: chart.name,
    }));

    return (
        <Flex direction="column" p="xs" gap="sm">
            <Flex align="center" gap="sm">
                <Title order={2} style={{ display: 'flex', alignItems: 'center', gap: rem(8) }}>
                    <ThemeIcon variant="light" color="blue" size="md">
                        <IconSettings style={{ width: rem(20), height: rem(20) }} />
                    </ThemeIcon>
                    {t('settings.title')}
                </Title>
            </Flex>
            <Divider variant="solid" size="sm" my="md"/>
            <Grid>
                <Grid.Col span={{ base: 12 }}>
                    <Title order={2}>
                        <ThemeIcon variant="light" color="blue" size="md" me="sm">
                            <IconListNumbers style={{ width: rem(20), height: rem(20) }}/>
                        </ThemeIcon>
                        {t('charts.title')}
                    </Title>
                </Grid.Col>
            </Grid>
            <Grid>
                <Grid.Col span={{base: 12, md: 8, lg: 6}}>
                    <Card shadow="md" p="md">
                        <Group justify="space-between">
                            <Text fw={600} size="lg">{t('settings.activeChartPlaceholder')}</Text>
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
                            <Button component={NavLink} to="/settings/add-chart" mt="md">
                                {t('forms.createChart.title')}
                            </Button>
                        </Flex>
                    </Card>
                </Grid.Col>
            </Grid>
            <Grid>
                <Grid.Col span={{base: 12, md: 8, lg: 6}}>
                    {charts.length > 0 && (
                        <Card shadow="md" p="md">
                            <Group justify="space-between">
                                <Text fw={600} size="lg">{t('charts.title')}</Text>
                            </Group>
                            <Divider variant="dashed" size="sm" my="xs"/>
                            <DataTable
                                backgroundColor="transparent"
                                columns={[
                                    { accessor: 'name', title: t('charts.title') },
                                    { accessor: 'lastfm_username', title: t('forms.createChart.lastfmUsernameLabel') },
                                    {
                                        accessor: 'actions',
                                        title: t('charts.actions'),
                                        textAlign: 'right',
                                        render: (chart) => (
                                            <Group gap={4} justify="right" wrap="nowrap">
                                                <ActionIcon
                                                    component={Link}
                                                    size="sm"
                                                    variant="subtle"
                                                    color="blue"
                                                    to={generatePath('/settings/charts/:id', { id: chart.id.toString() })}
                                                >
                                                    <IconEdit size={16} />
                                                </ActionIcon>
                                                <ActionIcon
                                                    size="sm"
                                                    variant="subtle"
                                                    color="red"
                                                    onClick={() => openDeleteModal(chart.id, chart.name)}
                                                >
                                                    <IconTrash size={16} />
                                                </ActionIcon>
                                            </Group>
                                        )
                                    }
                                ]}
                                records={charts}
                            />
                        </Card>
                    )}
                </Grid.Col>
            </Grid>
        </Flex>
    );
};

export default SettingsPage;