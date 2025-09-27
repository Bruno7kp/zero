//import React from 'react';
import {
    Divider,
    Flex,
    rem,
    ThemeIcon,
    Title,
    Container,
    Grid,
    Alert,
    Text,
    Anchor
} from '@mantine/core';
import { ChartWeekTop1Summary } from '../components/ChartWeekTop1Summary';
import { ChartSyncProgress } from '../components/ChartSyncProgress';
import { ChartLiveSummary } from "../components/ChartLiveSummary";
import { IconInfoCircle, IconListNumbers} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Masonry from 'react-masonry-css';
import { useState, useEffect } from 'react';


const ChartsPage = () => {
    const [chartName, setChartName] = useState<string>('');
    const [refreshKey, setRefreshKey] = useState(0);
    const { t } = useTranslation();
    const charts = useSelector((state: any) => state.charts.charts);
    const activeChartId = useSelector((state: any) => state.charts.activeChartId);
    const activeChart = charts.find((c: any) => c.id === activeChartId) || null;
    // Sincroniza nome do chart ativo sem disparar setState durante render
    useEffect(() => {
        if (activeChart) {
            setChartName(activeChart.name);
        } else {
            setChartName('');
        }
    }, [activeChart]);
    const breakpointColumns = {
        default: 2, // desktop
        1100: 2,    // tablet landscape
        700: 1,     // tablet portrait
        500: 1,     // mobile
    };

    const renderError = () => {
        return (
            <Grid>
                <Grid.Col>
                    <Alert icon={<IconInfoCircle />} color="blue" title={t('errors.warning')}>
                        <Text>{t('errors.selectActiveChart')}</Text>
                        {activeChartId === null && (
                            <Text mt="sm">
                                <Anchor component={Link} to="/settings">
                                    {t('errors.noActiveChart')}
                                </Anchor>
                            </Text>
                        )}
                    </Alert>
                </Grid.Col>
            </Grid>
        );
    };
    return (
        <Container>
            <Flex direction="column" p="xs" gap="sm">
                <Flex justify="center" align="center" gap="sm">
                    <Title order={2} style={{ display: 'flex', alignItems: 'center', gap: rem(8) }}>
                        <ThemeIcon variant="light" color="blue" size="md">
                            <IconListNumbers style={{ width: rem(20), height: rem(20) }} />
                        </ThemeIcon>
                        {t('charts.title')}
                        {chartName && ` - ${chartName}`}
                    </Title>
                </Flex>
                <Divider variant="solid" size="sm" my="md"/>
                {activeChartId !== null && activeChart && (
                    <Masonry
                        breakpointCols={breakpointColumns}
                        className="masonry-grid"
                        columnClassName="masonry-column"
                    >
                        <ChartSyncProgress chart={activeChart} onSyncComplete={() => setRefreshKey(k => k + 1)} />
                        <ChartWeekTop1Summary chartId={`${activeChart.id}`} refreshKey={refreshKey} />
                        <ChartLiveSummary />
                    </Masonry>
                )}
                { activeChartId === null && (
                    renderError()
                )}
            </Flex>
        </Container>
    );
};

export default ChartsPage;
