// src/pages/SettingsPage.tsx
import { useEffect } from 'react';
import {
    Flex,
    Title,
    Text,
    Loader,
    Center,
    Grid,
    ThemeIcon,
    rem,
    Divider,
    Container
} from '@mantine/core';
import { useCharts } from '../contexts/ChartContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { IconSettings } from '@tabler/icons-react';
import ActiveChartCard from '../components/ActiveChartCard';
import ChartsListCard from '../components/ChartsListCard';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';

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
        <Container>
            <Flex direction="column" p="xs" gap="sm">
                <Flex justify="center" align="center" gap="sm">
                    <Title order={2} style={{ display: 'flex', alignItems: 'center', gap: rem(8) }}>
                        <ThemeIcon variant="light" color="blue" size="md">
                            <IconSettings style={{ width: rem(20), height: rem(20) }} />
                        </ThemeIcon>
                        {t('settings.title')}
                    </Title>
                </Flex>
                <Divider variant="solid" size="sm" my="md"/>
                <Grid>
                    <Grid.Col span={{base: 12}}>
                        <ActiveChartCard
                          charts={charts}
                          activeChartId={activeChartId}
                          setActiveChartId={setActiveChartId}
                          t={t}
                          chartOptions={chartOptions}
                        />
                    </Grid.Col>
                </Grid>
                <Grid>
                    <Grid.Col span={{base: 12}}>
                        {charts.length > 0 && (
                          <ChartsListCard charts={charts} t={t} openDeleteModal={openDeleteModal} />
                        )}
                    </Grid.Col>
                </Grid>
            </Flex>
        </Container>
    );
};

export default SettingsPage;