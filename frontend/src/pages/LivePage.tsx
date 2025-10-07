import React, { useState, useEffect, useMemo } from 'react';
import {
    Divider, Flex, rem, ThemeIcon, Title, Loader, Alert, Anchor, Text, SegmentedControl, Center, Group,
    Container, Paper, ActionIcon
} from '@mantine/core';
import { DataTable, type DataTableColumn } from 'mantine-datatable';
import {IconFlame, IconInfoCircle, IconMicrophone, IconMusic, IconDisc, IconArrowsDownUp} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { getWeeklyArtistChart, getWeeklyTrackChart, getWeeklyAlbumChart, type FormattedChartItem } from '../services/lastfm.ts';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/pt-br';
import { Link } from 'react-router-dom';
import { db } from '../db/indexedDb';
import { DeltaBadge } from '../components/DeltaBadge';
import { selectResolvedBadge } from '../store/badgeStylesSlice';
import { SpotifyImageWithModal } from '../components/SpotifyImageWithModal';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../services/SpotifyApi';

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
    type LiveRow = FormattedChartItem & { deltaRank?: number | string };
    const [chartData, setChartData] = useState<LiveRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [chartType, setChartType] = useState<string>('artist');
    const [chartName, setChartName] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [lastSavedWeek, setLastSavedWeek] = useState<string | null>(null);
    // Live-only toggle to show/hide variation (delta). Persist locally.
    const LIVE_VARIATION_KEY = 'live_showVariation';
    const [showVariation, setShowVariation] = useState<boolean>(() => {
        try {
            const saved = localStorage.getItem(LIVE_VARIATION_KEY);
            if (saved === '0') return false;
            if (saved === '1') return true;
        } catch {}
        return true; // default: show
    });
    useEffect(() => {
        try { localStorage.setItem(LIVE_VARIATION_KEY, showVariation ? '1' : '0'); } catch {}
    }, [showVariation]);
    
    const badgeStylesRank = useSelector((s: any) => selectResolvedBadge(s, 'rank', 'table'));
    const tableBgSetting = (useSelector((state: any) => state.columns?.views?.table?.settings?.tableBackground) || 'default') as 'default' | 'transparent';
    const paperProps = tableBgSetting === 'transparent' ? { shadow: 'none' as const, bg: 'transparent' as const } : { shadow: 'xs' as const };
    const artistMode: 'under' | 'column' = (useSelector((state: any) => state.columns?.views?.table?.settings?.artistDisplayMode) || 'under') as any;
    const showInlineImage = !!useSelector((state: any) => state.columns?.views?.table?.columns?.find((c: any) => c.key === 'image')?.visible);

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
                const cutoffVal = (activeChart as any)[cutoffKey] !== undefined ? (activeChart as any)[cutoffKey] : 100;
                const limit = cutoffVal + 10;

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

                // Após obter os dados live, computa variação de rank com base na última semana salva (se houver)
                // Obter última semana salva no IndexedDB para este chart/tipo
                const chartIdStr = String(activeChartId);
                let liveWithDelta: LiveRow[] = data;
                try {
                    const lastRow = await db.charts_data
                        .where('[chartId+chartType+week]')
                        .between([chartIdStr, chartType, '0000'], [chartIdStr, chartType, '9999'])
                        .reverse()
                        .first();
                    const prevWeek = lastRow?.week;
                    setLastSavedWeek(prevWeek || null);
                    if (prevWeek) {
                        const prevRows = await db.charts_data
                            .where(['chartId','chartType','week'])
                            .equals([chartIdStr, chartType, prevWeek])
                            .toArray();
                        const norm = (s: string) => s.normalize('NFKC').toLowerCase().trim();
                        const keyOf = (name?: string, artist?: string) => `${norm(name || '')}|${norm(artist || '')}`;
                        const prevMap = new Map<string, number>();
                        for (const r of prevRows) prevMap.set(keyOf(r.name, r.artistName), r.rank);
                        liveWithDelta = data.map((it) => {
                            const prevRank = prevMap.get(keyOf(it.name, it.artist));
                            let delta: any = '-';
                            if (typeof prevRank === 'number' && typeof it.rank === 'number') {
                                delta = (prevRank - it.rank);
                            }
                            // Não mostrar variação para quem está fora do cutoff atual
                            if (typeof it.rank === 'number' && cutoffVal && it.rank > cutoffVal) {
                                delta = '-';
                            }
                            return { ...it, deltaRank: delta };
                        });
                    } else {
                        liveWithDelta = data.map(it => ({ ...it, deltaRank: '-' }));
                    }
                } catch {
                    liveWithDelta = data.map(it => ({ ...it, deltaRank: '-' }));
                }
                setChartData(liveWithDelta);
            } catch {
                setError(t("errors.dataError"));
            } finally {
                setLoading(false);
            }
        };

        // Re-executa a busca sempre que o chart ativo, a lista de charts ou o tipo de chart mudar
        fetchLiveChart();
    }, [activeChartId, charts, chartType, t]);

    // Lazy enrichment: determine NEW/RE per row based on last saved week in IndexedDB
    useEffect(() => {
        const enrichNewRe = async () => {
            if (!lastSavedWeek || !activeChartId || !chartData.length) return;
            const chartIdStr = String(activeChartId);
            const cutoffKey = chartType === 'track' ? 'music_cutoff' : `${chartType}_cutoff`;
            const activeChart = charts.find((c: any) => c.id === activeChartId);
            const cutoffVal = (activeChart as any)?.[cutoffKey] ?? 100;
            const norm = (s: string) => s.normalize('NFKC').toLowerCase().trim();
            const keyOf = (name?: string, artist?: string) => `${norm(name || '')}|${norm(artist || '')}`;
            // Build set of items present in lastSavedWeek for quick membership check
            let prevSet = new Set<string>();
            let prevAnySet = new Set<string>();
            try {
                const prevRows = await db.charts_data
                    .where(['chartId','chartType','week'])
                    .equals([chartIdStr, chartType, lastSavedWeek])
                    .toArray();
                prevSet = new Set(prevRows.map(r => keyOf(r.name, r.artistName)));
                const allPrevRows = await db.charts_data
                    .where('[chartId+chartType+week]')
                    .below([chartIdStr, chartType, lastSavedWeek])
                    .toArray();
                prevAnySet = new Set(allPrevRows.map(r => keyOf(r.name, r.artistName)));
            } catch { /* ignore */ }
            const updates: Array<{ idx: number; value: 'NEW' | 'RE' } > = [];
            for (let i = 0; i < chartData.length; i++) {
                const row = chartData[i];
                const rankNum = typeof row.rank === 'number' ? row.rank : Number(row.rank);
                if (!rankNum || rankNum > cutoffVal) continue; // outside cutoff or invalid rank
                if (typeof row.deltaRank === 'number') continue; // already has numeric variation
                if (row.deltaRank === 'RE' || row.deltaRank === 'NEW') continue; // already enriched
                const rowKey = keyOf(row.name, row.artist);
                // If it existed in the last saved week, do nothing (delta stays '-' or numeric logic handled earlier)
                if (prevSet.has(rowKey)) continue;
                // Check any prior appearance
                if (prevAnySet.has(rowKey)) updates.push({ idx: i, value: 'RE' }); else updates.push({ idx: i, value: 'NEW' });
            }
            if (updates.length) {
                setChartData(prev => prev.map((r, idx) => {
                    const up = updates.find(u => u.idx === idx);
                    return up ? { ...r, deltaRank: up.value } : r;
                }));
            }
        };
        const id = setTimeout(() => { enrichNewRe(); }, 0);
        return () => clearTimeout(id);
    }, [lastSavedWeek, activeChartId, chartData, chartType, charts]);

    // Define as colunas do Mantine DataTable
    const columns: DataTableColumn<LiveRow>[] = useMemo(() => {
        const norm = (s: string) => s.normalize('NFKC').toLowerCase().trim();
        const keyOf = (name?: string, artist?: string) => `${norm(name || '')}|${norm(artist || '')}`;
        const cols: DataTableColumn<LiveRow>[] = [
        {
            accessor: 'rank',
            title: 'Rank',
            width: 80,
            textAlign: 'center',
            render: ({ rank }) => (
                <Text fw={700}>{rank}</Text>
            ),
        },
        // Conditionally include variation column if enabled
        ...(showVariation ? ([{
            accessor: 'deltaRank',
            title: <IconArrowsDownUp size={18} stroke={2} style={{ verticalAlign: 'middle' }} />,
            width: rem(65),
            textAlign: 'center',
            cellsStyle: () => ({ paddingRight: 0, paddingLeft: 0 }),
            render: ({ deltaRank }) => {
                // Replicar estilo da coluna de variação alternativa da tabela
                let cfg: any = badgeStylesRank;
                if (badgeStylesRank.iconPosition === 'split') {
                    cfg = { ...badgeStylesRank, iconPosition: 'split', splitTall: badgeStylesRank.splitTall !== false };
                } else if (badgeStylesRank.iconPosition === 'hidden') {
                    cfg = { ...badgeStylesRank, iconPosition: 'hidden', splitTall: false };
                } else {
                    cfg = { ...badgeStylesRank, splitTall: false };
                }
                return (
                    <Flex justify="center" align="center" style={{ width: '100%' }}>
                        <DeltaBadge delta={deltaRank ?? '-'} cfg={cfg} kind="rank" textSize="md" columnContext noSidePadding contextView="table" />
                    </Flex>
                );
            },
        }] as DataTableColumn<LiveRow>[]) : ([] as DataTableColumn<LiveRow>[])),
        {
            accessor: 'name',
            title: t('charts.titleLabel'),
            render: (item) => (
                <Flex>
                    {showInlineImage && (
                        <Flex
                            mr="sm"
                            justify="center"
                            align="center"
                            onClick={e => e.stopPropagation()}
                            onMouseDown={e => e.stopPropagation()}
                        >
                            <SpotifyImageWithModal
                                entityId={`${chartType}:${keyOf(item.name, item.artist)}`}
                                name={item.name}
                                artistName={item.artist}
                                type={chartType as 'artist' | 'album' | 'track'}
                                clientId={SPOTIFY_TOKEN}
                                clientSecret={SPOTIFY_SECRET}
                                width={40}
                                height={40}
                                style={{ minWidth: 40, maxWidth: 40 }}
                            />
                        </Flex>
                    )}
                    <Flex direction="column" justify="center" align="flex-start">
                        <Text fw={700}>{item.name}</Text>
                        {artistMode === 'under' && chartType !== 'artist' && !!item.artist && (
                            <Text size="sm">{item.artist}</Text>
                        )}
                    </Flex>
                </Flex>
            ),
            width: 'auto',
        },
        // Coluna de artista separada somente se configurado como 'column' e não for chartType 'artist'
        ...((chartType === 'artist' || artistMode !== 'column') ? [] : ([{
            accessor: 'artist',
            title: t('charts.artistLabel'),
            render: (item: LiveRow) => (
                <Text>{item.artist || '-'}</Text>
            ),
            width: 'auto',
        }] as DataTableColumn<LiveRow>[])),
        {
            accessor: 'playcount',
            title: 'Plays',
            width: rem(80),
            textAlign: 'center',
        }
    ];
        return cols;
    }, [badgeStylesRank, chartType, t, artistMode, showInlineImage, showVariation]);

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
            <Paper {...paperProps} p="md">
                <DataTable
                    columns={columns}
                    records={chartData}
                    highlightOnHover
                    withTableBorder={false}
                    className="datatable-transparent"
                />
            </Paper>
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
                            <Flex align="center" gap="xs">
                                <Text size="sm" c="dimmed">
                                    {t('charts.live_chart_period', { from: startDate, to: endDate })}
                                </Text>
                                <ActionIcon
                                    variant={showVariation ? 'filled' : 'subtle'}
                                    color={showVariation ? 'blue' : 'gray'}
                                    size="sm"
                                    aria-pressed={showVariation}
                                    aria-label={t('charts.deltaRankLabel')}
                                    title={`${t('charts.deltaRankLabel')} — ${showVariation ? t('charts.show') : t('charts.hide')}`}
                                    onClick={() => setShowVariation(v => !v)}
                                >
                                    <IconArrowsDownUp size={16} />
                                </ActionIcon>
                            </Flex>
                        )}
                    </Group>
                    {renderTable()}
                </Flex>
            </Flex>
        </Container>
    );
};

export default LivePage;