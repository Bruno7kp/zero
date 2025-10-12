import React, { useState, useEffect } from 'react';
import { Divider, Flex, Loader, Alert, Anchor, Text, Container, rem } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
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
import LiveTitle from '../components/live/LiveTitle';
import TypeSegmented from '../components/live/TypeSegmented';
import PeriodAndToggle from '../components/live/PeriodAndToggle';
import LiveTable from '../components/live/LiveTable';
import { useLiveColumns } from '../components/live/buildLiveColumns';
import type { LiveRow } from '../components/live/types';

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
        } catch {
            // ignore localStorage read errors (e.g., privacy mode)
        }
        return true; // default: show
    });
    useEffect(() => {
        try {
            localStorage.setItem(LIVE_VARIATION_KEY, showVariation ? '1' : '0');
        } catch {
            // ignore localStorage write errors
        }
    }, [showVariation]);
    
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
                // Swallow error and surface a friendly message
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
            } catch { /* ignore fetch of previous weeks */ }
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

    const columns = useLiveColumns({ chartType, showInlineImage, artistMode, showVariation });

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

        return <LiveTable columns={columns} records={chartData} paperProps={paperProps} />;
    };

    return (
        <Container className="noPaddingMobile">
            <Flex direction="column" p="xs" gap="sm">
                <LiveTitle title={`${t('charts.live')}${chartName ? ` - ${chartName}` : ''}`} />
                <Divider variant="solid" size="sm" my="md"/>
                <Flex gap="sm" direction="column">
                    <Flex justify="center" align="center" style={{ width: '100%' }}>
                        <TypeSegmented value={chartType} onChange={setChartType} />
                    </Flex>
                    <PeriodAndToggle
                      chartName={chartName}
                      startDate={startDate}
                      endDate={endDate}
                      showVariation={showVariation}
                      setShowVariation={(v) => setShowVariation(typeof v === 'boolean' ? v : !showVariation)}
                    />
                    {renderTable()}
                </Flex>
            </Flex>
        </Container>
    );
};

export default LivePage;