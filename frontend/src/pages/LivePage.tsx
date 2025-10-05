import React, { useState, useEffect } from 'react';
import {
    Divider, Flex, rem, ThemeIcon, Title, Loader, Alert, Anchor, Text, SegmentedControl, Center, Card, Group,
    Container, useMantineTheme, useMantineColorScheme
} from '@mantine/core';
import { DataTable, type DataTableColumn } from 'mantine-datatable';
import {IconFlame, IconInfoCircle, IconMicrophone, IconMusic, IconDisc} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { getWeeklyArtistChart, getWeeklyTrackChart, getWeeklyAlbumChart, type FormattedChartItem } from '../services/lastfm.ts';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/pt-br';
import { Link } from 'react-router-dom';

// Adiciona os plugins para dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);

const LivePage = () => {
    const { t, i18n } = useTranslation();
    const reduxLanguage = useSelector((state: any) => state.i18n.language);
    React.useEffect(() => {
        if (i18n.language !== reduxLanguage) {
            i18n.changeLanguage(reduxLanguage);
        }
    }, [reduxLanguage, i18n]);

    const charts = useSelector((state: any) => state.charts.charts);
    const activeChartId = useSelector((state: any) => state.charts.activeChartId);
    const [chartData, setChartData] = useState<FormattedChartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [chartType, setChartType] = useState<string>('artist');
    const [chartName, setChartName] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();

    useEffect(() => {
        const fetchLiveChart = async () => {
            if (!activeChartId) {
                setChartData([]);
                setError(t('errors.selectActiveChart'));
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const activeChart = charts.find((chart: any) => chart.id === activeChartId);

                if (!activeChart || activeChart.day_of_week === undefined || !activeChart.timezone || !activeChart.lastfm_username) {
                    throw new Error("Dados do chart incompletos. Verifique 'day_of_week', 'timezone' e 'lastfm_username'.");
                }
                setChartName(activeChart.name);

                // Pega a data de hoje no fuso horário do chart
                const now = dayjs().tz(activeChart.timezone);

                // Determina o dia de início do chart da semana atual
                const startOfWeek = now.day(activeChart.day_of_week).startOf('day');

                // Se o dia de início for no futuro, pega o dia de início da semana anterior
                let fromDate = startOfWeek;
                if (startOfWeek.isAfter(now)) {
                    fromDate = startOfWeek.subtract(7, 'days');
                }
                const toDate = now;

                // Salva as datas formatadas para exibição
                setStartDate(fromDate.locale('pt-br').format('L'));
                setEndDate(toDate.locale('pt-br').format('L'));

                // Converte as datas para Unix timestamps (string)
                const from = fromDate.unix().toString();
                const to = toDate.unix().toString();

                // Pega o limite de corte
                const cutoffKey = chartType === 'track' ? 'music_cutoff' : `${chartType}_cutoff`;
                const cutoff = (activeChart as any)[cutoffKey] !== undefined ? (activeChart as any)[cutoffKey] : 100;
                const limit = cutoff + 10;

                let data: FormattedChartItem[];
                switch (chartType) {
                    case 'artist':
                        data = await getWeeklyArtistChart(activeChart.lastfm_username, from, to, limit);
                        break;
                    case 'track':
                        data = await getWeeklyTrackChart(activeChart.lastfm_username, from, to, limit);
                        break;
                    case 'album':
                        data = await getWeeklyAlbumChart(activeChart.lastfm_username, from, to, limit);
                        break;
                    default:
                        throw new Error("Tipo de chart desconhecido.");
                }

                setChartData(data);
            } catch {
                setError(t("errors.dataError"));
            } finally {
                setLoading(false);
            }
        };

        // Re-executa a busca sempre que o chart ativo, a lista de charts ou o tipo de chart mudar
        fetchLiveChart();
    }, [activeChartId, charts, chartType, t]);

    // Define as colunas do Mantine DataTable
    const columns: DataTableColumn<FormattedChartItem>[] = [
        {
            accessor: 'rank',
            title: '#',
            width: rem(40),
            textAlign: 'center',
            render: ({ rank }) => (
                <Text fw={700}>{rank}</Text>
            ),
        },
        {
            accessor: 'name',
            title: 'Title',
            render: (item) => (
                <Flex direction="column">
                    <Text fw={700}>{item.name}</Text>
                    {item.artist && <Text fz="sm">{item.artist}</Text>}
                </Flex>
            ),
            width: 'auto',
        },
        {
            accessor: 'playcount',
            title: 'Plays',
            width: rem(80),
            textAlign: 'center',
        }
    ];

    const renderTable = () => {
        if (loading) {
            return (
                <Flex justify="center" align="center" style={{ minHeight: rem(200) }}>
                    <Loader size="xl" />
                </Flex>
            );
        }

        if (error) {
            return (
                <Alert icon={<IconInfoCircle />} color="blue" title={t('errors.warning')}>
                    <Text>{error}</Text>
                    {activeChartId === null && (
                        <Text mt="sm">
                            <Anchor component={Link} to="/settings">
                                {t('errors.noActiveChart')}
                            </Anchor>
                        </Text>
                    )}
                </Alert>
            );
        }

        if (chartData.length === 0) {
            return (
                <Alert icon={<IconInfoCircle />} color="blue" title={t('errors.noData.title')}>
                    {t('errors.noData.description')}
                </Alert>
            );
        }

        return (
            <Card>
                <DataTable
                    columns={columns}
                    records={chartData}
                    styles={{
                        table: {
                            background: colorScheme === 'dark'
                                ? theme.colors.dark[6]
                                : 'white',
                        },
                    }}
                />
            </Card>
        );
    };

    return (
        <Container>
            <Flex direction="column" p="xs" gap="sm">
                <Flex justify="center" align="center" gap="sm">
                    <Title order={2} style={{ display: 'flex', alignItems: 'center', gap: rem(8) }}>
                        <ThemeIcon variant="light" color="red" size="md">
                            <IconFlame style={{ width: rem(20), height: rem(20) }} />
                        </ThemeIcon>
                        {t('charts.live')}
                        {chartName && ` - ${chartName}`}
                    </Title>
                </Flex>
                <Divider variant="solid" size="sm" my="md"/>
                <Flex gap="sm" direction="column">
                    <Flex justify="center" align="center" style={{ width: '100%' }}>
                        <SegmentedControl
                            value={chartType}
                            withItemsBorders={false}
                            onChange={(value: string) => setChartType(value)}
                            data={[
                                {
                                    label: (
                                        <Center style={{ display: 'flex', alignItems: 'center', gap: rem(6) }}>
                                            <IconMicrophone style={{ width: rem(16), height: rem(16) }} />
                                            <span>{t('charts.artist')}</span>
                                        </Center>
                                    ),
                                    value: 'artist',
                                },
                                {
                                    label: (
                                        <Center style={{ display: 'flex', alignItems: 'center', gap: rem(6) }}>
                                            <IconDisc style={{ width: rem(16), height: rem(16) }} />
                                            <span>{t('charts.album')}</span>
                                        </Center>
                                    ),
                                    value: 'album',
                                },
                                {
                                    label: (
                                        <Center style={{ display: 'flex', alignItems: 'center', gap: rem(6) }}>
                                            <IconMusic style={{ width: rem(16), height: rem(16) }} />
                                            <span>{t('charts.track')}</span>
                                        </Center>
                                    ),
                                    value: 'track',
                                },
                            ]}
                            color="blue"
                        />
                    </Flex>
                    <Group justify="center">
                        {chartName && (
                            <Text size="sm" c="dimmed">{t('charts.live_chart_period', { from: startDate, to: endDate })}</Text>
                        )}
                    </Group>
                    {renderTable()}
                </Flex>
            </Flex>
        </Container>
    );
};

export default LivePage;