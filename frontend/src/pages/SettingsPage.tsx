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
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { fetchCharts, setActiveChartId, deleteChart } from '../store/chartsSlice';
import { useTranslation } from 'react-i18next';
import { IconSettings } from '@tabler/icons-react';
import ActiveChartCard from '../components/ActiveChartCard';
import ChartsListCard from '../components/ChartsListCard';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';

const SettingsPage = () => {
    const dispatch = useDispatch<AppDispatch>();
    const charts = useSelector((state: any) => state.charts.charts);
    const isLoading = useSelector((state: any) => state.charts.loading);
    const activeChartId = useSelector((state: any) => state.charts.activeChartId);
    const isAuthenticated = useSelector((state: any) => state.auth.user !== null);
    const { t, i18n } = useTranslation();
    const reduxLanguage = useSelector((state: any) => state.i18n.language);


    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchCharts());
        }
    }, [isAuthenticated, dispatch]);

    // Set activeChartId to first chart if none is selected
    useEffect(() => {
        if (charts.length > 0 && activeChartId == null) {
            dispatch(setActiveChartId(charts[0].id));
        }
    }, [charts, activeChartId, dispatch]);

    useEffect(() => {
        if (i18n.language !== reduxLanguage) {
            i18n.changeLanguage(reduxLanguage);
        }
    }, [reduxLanguage, i18n]);

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
                try {
                    await dispatch(deleteChart(chartId) as any).unwrap();
                    notifications.show({
                        message: t('notifications.charts.delete.success', { chart: chartName }),
                        color: 'green',
                        icon: <IconCheck />,
                    });
                } catch {
                    notifications.show({
                        message: t('notifications.charts.delete.error', { chart: chartName }),
                        color: 'red',
                        icon: <IconX />,
                    });
                }
            },
        });

    const handleSetActiveChartId = (id: number) => {
        dispatch(setActiveChartId(id));
    };

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
                          setActiveChartId={handleSetActiveChartId}
                          t={t}
                          chartOptions={charts.map((chart: any) => ({ value: String(chart.id), label: chart.name }))}
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