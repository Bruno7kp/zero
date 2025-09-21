import { useEffect } from 'react';
import { Flex, Select, Title, Text, Loader, Center, Button, Grid } from '@mantine/core';
import { useCharts } from '../contexts/ChartContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom'; // Importe o hook de navegação

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
            {/* O Modal foi removido daqui */}
            <Title order={2}>{t('settings.pageTitle')}</Title>
            <Text>{t('settings.pageDescription')}</Text>

            <Flex direction="column" gap="sm">
                <Grid>
                    <Grid.Col span={{base: 12, md: 6}}>
                        <Select
                            label={t('settings.activeChartLabel')}
                            placeholder={t('settings.activeChartPlaceholder')}
                            data={chartOptions}
                            value={activeChartId ? String(activeChartId) : null}
                            onChange={(value) => setActiveChartId(value ? Number(value) : null)}
                            allowDeselect
                            clearable
                        />
                        {/* Altere o onClick para a nova função de navegação */}
                        <Button component={NavLink} to="/settings/chart" mt="md">
                            {t('forms.createChart.title')}
                        </Button>
                    </Grid.Col>
                    <Grid.Col span={{base: 12}}>
                        {charts.length === 0 && (
                            <Text c="dimmed" mt="md">
                                {t('settings.noCharts')}
                            </Text>
                        )}
                    </Grid.Col>
                </Grid>
            </Flex>
        </Flex>
    );
};

export default SettingsPage;