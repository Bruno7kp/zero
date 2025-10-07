import React, { useEffect, useMemo, useState } from 'react';
import { ImageEditModal } from './ImageEditModal';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { DataTable, type DataTableColumnTextAlign } from 'mantine-datatable';
import type { DataTableColumn, DataTableRowExpansionProps } from 'mantine-datatable';
import { Paper, Text, Flex } from '@mantine/core';
import { DeltaBadge } from './DeltaBadge';
import { selectResolvedBadge } from '../store/badgeStylesSlice';
import type { ChartData } from '../db/indexedDb';
import { fetchChartData, fetchStatsMapIncremental, computeWeekDeltas } from '../store/chartsSlice';
import { useProgressiveReveal } from '../hooks/useProgressiveReveal';
import { ChartItemStatsLoader } from './ChartItemStatsLoader';
import { IconArrowsDownUp } from '@tabler/icons-react';
import { SpotifyImageWithModal } from './SpotifyImageWithModal';
import { useTranslation } from 'react-i18next';
import { updateColumn } from '../store/columnsSlice';
import { CertificationIcon } from './CertificationIcon';

interface ChartWeekTableProps {
    chart: any;
    week: string;
    type: string;
    altVariation?: (row: ChartData, index: number) => string | number | false | null | undefined;
    clientId: string;
    clientSecret: string;
}

export const ChartWeekTable: React.FC<ChartWeekTableProps> = ({ chart, week, type, altVariation, clientId, clientSecret }) => {
    // Para edição de imagem
    const [imageModalRow, setImageModalRow] = useState<any>(null);
    const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
    const [imageForceUpdate, setImageForceUpdate] = useState<{ [entityId: string]: number }>({});
    const [lastImageUrlByEntityId, setLastImageUrlByEntityId] = useState<{ [entityId: string]: string | null }>({});
    const data = useSelector((state: RootState) => state.charts.data);
    // Preserve previous non-empty data to avoid flicker/shifting during week/type/view transitions
    const [displayedData, setDisplayedData] = useState<any[]>(data);
    const prevDataRef = React.useRef<any[]>(data);
    const [displayedKey, setDisplayedKey] = useState<string | null>(null);
    const [switchHoldUntil, setSwitchHoldUntil] = useState<number | null>(null);
    const currentKey = `${chart?.id || 'x'}|${type}|${week || 'n/a'}`;
    const isDeltasReady = React.useCallback((rows: any[], targetWeek?: string) => {
        if (!Array.isArray(rows) || !rows.length || !targetWeek) return false;
        const cur = rows.filter((r: any) => r.week === targetWeek);
        if (!cur.length) return false;
        let ready = 0;
        for (const r of cur) {
            const d = (r as any).deltaRank;
            if (d !== undefined && d !== null && d !== '-') ready++;
        }
        return ready >= Math.ceil(cur.length * 0.9);
    }, []);
    useEffect(() => {
        if (!Array.isArray(data) || data.length === 0) return; // keep previous
        const sameKey = displayedKey === currentKey;
        const ready = isDeltasReady(data as any[], week);
        if (!sameKey) {
            if (ready) {
                setDisplayedData(data);
                prevDataRef.current = data;
                setDisplayedKey(currentKey);
                setSwitchHoldUntil(null);
            } else {
                if (!switchHoldUntil) setSwitchHoldUntil(Date.now() + 450);
            }
        } else {
            if (ready) {
                setDisplayedData(data);
                prevDataRef.current = data;
            }
        }
    }, [data, week, type, chart?.id, displayedKey, currentKey, isDeltasReady, switchHoldUntil]);
    useEffect(() => {
        if (!switchHoldUntil) return;
        const id = setInterval(() => {
            const ready = isDeltasReady(data as any[], week);
            if (ready || Date.now() >= switchHoldUntil) {
                if (Array.isArray(data) && data.length) {
                    setDisplayedData(data);
                    prevDataRef.current = data;
                    setDisplayedKey(currentKey);
                }
                setSwitchHoldUntil(null);
            }
        }, 60);
        return () => clearInterval(id);
    }, [switchHoldUntil, data, week, isDeltasReady, currentKey]);
    const safeDisplayedData = displayedData && displayedData.length > 0 ? displayedData : prevDataRef.current;
    const statsMap = useSelector((state: RootState) => state.charts.statsMap);
    // const loadingStats = useSelector((state: RootState) => state.charts.loadingStats); // no longer needed in table columns
    const viewConfig = useSelector((state: RootState) => (state as any).columns?.views?.table);
    const columns = useMemo(() => viewConfig?.columns ?? [], [viewConfig?.columns]);
    const dispatch = useDispatch<AppDispatch>();
    const { t } = useTranslation();
    useEffect(() => {
        const mandatory = ['rank', 'name'];
        mandatory.forEach(key => {
            const col: any = columns.find((c: any) => c.key === key);
            if (col && !col.visible) {
                dispatch(updateColumn({ view: 'table', key, visible: true }));
            }
        });
    }, [columns, dispatch]);

    // Busca dados da semana
    useEffect(() => {
        if (!week) return;
        dispatch(fetchChartData({ chartId: `${chart.id}`, chartType: type, week }));
    }, [chart.id, week, type, dispatch]);

    // Recalcula deltas (NEW/RE e variações) assim que os dados da semana chegam
    useEffect(() => {
        if (!data.length || !week) return;
        dispatch(computeWeekDeltas({ chartId: `${chart.id}`, chartType: type, week, rows: data }));
    }, [data, week, chart.id, type, dispatch]);

    // Agendamento diferido dos stats (carrega só depois de um pequeno atraso para não impactar troca de semana)
    useEffect(() => {
        if (!data.length || !week) return;
        const wantsStats = columns.some((c: any) => (c.key === 'peak' || c.key === 'totalWeeks' || c.key === 'cert') && c.visible);
        if (!wantsStats) return;
        let cancelled = false;
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const id = setTimeout(() => {
                if (cancelled) return;
                dispatch(fetchStatsMapIncremental({ chartId: `${chart.id}`, chartType: type, data, week }));
            }, 600); // levemente reduzido
            (window as any).__tableStatsTimer = id;
        }));
        return () => {
            cancelled = true;
            if ((window as any).__tableStatsTimer) clearTimeout((window as any).__tableStatsTimer);
        };
    }, [data, chart.id, type, week, dispatch, columns]);

    // Refetch incremental quando usuário habilita colunas de stats após já ter carregado dados
    const statsColumnsVisible = useMemo(
        () => columns.some((c: any) => (c.key === 'peak' || c.key === 'totalWeeks' || c.key === 'cert') && c.visible),
        [columns]
    );
    const [statsColumnsPrev, setStatsColumnsPrev] = useState(statsColumnsVisible);
    useEffect(() => {
        if (statsColumnsVisible && !statsColumnsPrev && data.length && week) {
            dispatch(fetchStatsMapIncremental({ chartId: `${chart.id}`, chartType: type, data, week }));
        }
        if (statsColumnsPrev !== statsColumnsVisible) setStatsColumnsPrev(statsColumnsVisible);
    }, [statsColumnsVisible, statsColumnsPrev, data, week, chart.id, type, dispatch]);

    // Fallback: se colunas de stats visíveis mas statsMap continua vazio após pequeno intervalo, força uma nova tentativa
    useEffect(() => {
        if (!statsColumnsVisible || !data.length || !week) return;
        const hasAnyStats = data.some((r: any) => {
            const s = (statsMap as any)[r.entityId];
            return s && s.totals && s.totals.withinCutoff != null;
        });
        if (hasAnyStats) return;
        const id = setTimeout(() => {
            const stillEmpty = data.every((r: any) => {
                const s = (statsMap as any)[r.entityId];
                return !s || !s.totals || s.totals.withinCutoff == null;
            });
            if (stillEmpty) {
                dispatch(fetchStatsMapIncremental({ chartId: `${chart.id}`, chartType: type, data, week }));
            }
        }, 1200);
        return () => clearTimeout(id);
    }, [statsColumnsVisible, statsMap, data, week, chart.id, type, dispatch]);

    // Colunas dinâmicas
    const visibleColumns = useMemo(() => columns.filter((c: any) => c.visible), [columns]);
    const showAltVariationRedux = columns.find((c: any) => c.key === 'altVariation')?.visible;
    // Opção para mostrar/esconder badge delta
    const showDeltaBadge = columns.find((c: any) => c.key === 'deltaRankBadge')?.visible;
    const showDeltaPlaysBadge = columns.find((c: any) => c.key === 'deltaPlaysBadge')?.visible;
    const showDeltaPercentPlaysBadge = columns.find((c: any) => c.key === 'deltaPercentPlaysBadge')?.visible;
    const showAltPlaysVariationRedux = columns.find((c: any) => c.key === 'altPlaysVariation')?.visible;
    const playsVariationLocation = (useSelector((state: any) => state.columns?.views?.table?.settings?.playsVariationLocation) || 'under') as 'hidden' | 'under' | 'column';
    const showImage = columns.find((c: any) => c.key === 'image')?.visible;
    const badgeStylesRank = useSelector((s: any) => selectResolvedBadge(s, 'rank', 'table'));
    const badgeStylesPlays = useSelector((s: any) => selectResolvedBadge(s, 'plays', 'table'));
    const playsVariationDisplay = (useSelector((state: any) => state.columns?.views?.table?.settings?.playsVariationDisplay) || 'percent') as 'hidden' | 'absolute' | 'percent';
    const peakCountStyle = (useSelector((state: any) => state.columns?.views?.table?.settings?.peakCountStyle) || 'noCount') as 'withCount' | 'noCount';
    const showPeakCount = peakCountStyle === 'withCount';
    // Remove badges e deltaPlays das colunas visíveis (não são colunas reais)
    const filteredColumns = useMemo(() => {
        const base = visibleColumns.filter((c: any) => c.isColumn);
        // Hide certification and artist columns entirely for artist charts
        return type === 'artist' ? base.filter((c: any) => c.key !== 'cert' && c.key !== 'artist') : base;
    }, [visibleColumns, type]);

    // Stable caches for Peak/Weeks to avoid flicker
    const [lastPeakById, setLastPeakById] = useState<Record<string, number | null>>({});
    const [lastWeeksById, setLastWeeksById] = useState<Record<string, number | null>>({});
    const [lastWeeksAtPeakById, setLastWeeksAtPeakById] = useState<Record<string, number | null>>({});
    useEffect(() => {
        try {
            const nextPeak = { ...lastPeakById };
            const nextWeeks = { ...lastWeeksById };
            const nextWeeksAtPeak = { ...lastWeeksAtPeakById };
            let changed = false;
            for (const [entityId, s] of Object.entries(statsMap || {})) {
                const peak = (s as any)?.peak?.position;
                if (peak != null && nextPeak[entityId] !== peak) { nextPeak[entityId] = peak; changed = true; }
                const weeks = (s as any)?.totals?.withinCutoff;
                if (weeks != null && nextWeeks[entityId] !== weeks) { nextWeeks[entityId] = weeks; changed = true; }
                const weeksAtPeak = (s as any)?.peak?.weeksAtPeak;
                if (weeksAtPeak != null && nextWeeksAtPeak[entityId] !== weeksAtPeak) { nextWeeksAtPeak[entityId] = weeksAtPeak; changed = true; }
            }
            if (changed) { setLastPeakById(nextPeak); setLastWeeksById(nextWeeks); setLastWeeksAtPeakById(nextWeeksAtPeak); }
        } catch { /* noop */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statsMap]);

    // Row expansion
    // Exibe stats gerais (todas as semanas) ao expandir
    const renderExpansion: DataTableRowExpansionProps<ChartData>['content'] = ({ record }) => (
        <ChartItemStatsLoader
            chartId={record.chartId}
            chartType={record.chartType}
            entityId={record.entityId}
            week={week}
        />
    );

    // Monta colunas para o DataTable
    // Função utilitária para cor/label do badge
    // getDeltaBadgeProps removed (logic centralized in DeltaBadge)
    // Mapeamento das colunas para o DataTable
    const dtColumns: DataTableColumn<ChartData>[] = useMemo(() => {
        const artistMode: 'under' | 'column' = (viewConfig?.settings as any)?.artistDisplayMode || 'under';
        let built = filteredColumns.map((col: any): DataTableColumn<ChartData> => {
            const resolvedTitle =
                col.label != null
                    ? (typeof col.label === 'string'
                        ? (col.label.startsWith('charts.') ? t(col.label as any) : col.label)
                        : col.label)
                    : (col.labelComplete
                        ? t(col.labelComplete)
                        : col.key);
            const base = {
                accessor: col.key,
                title: resolvedTitle,
                textAlign: col.key === 'name' ? 'left' : ('center' as const) as DataTableColumnTextAlign,
                width: col.key === 'name' ? undefined : 80,
            };
            if (col.key === 'rank') {
                return {
                    ...base,
                    render: (row: ChartData) => {
                        let badge = null;
                        if (showDeltaBadge) {
                            // Under-number badge context -> compact font size xs
                            badge = <DeltaBadge delta={row.deltaRank} cfg={badgeStylesRank} kind="rank" textSize="xs" columnContext contextView="table" />;
                        }
                        return (
                            <Flex direction="column" align="center">
                                <Text fw={row.rank === 1 ? 700 : 600} size="lg" c={row.rank === 1 ? 'blue' : undefined}>{row.rank}</Text>
                                {badge}
                            </Flex>
                        );
                    }
                };
            }
            if (col.key === 'plays') {
                return {
                    ...base,
                    render: (row: ChartData) => {
                        let badge = null;
                        if (playsVariationLocation === 'under' && (showDeltaPlaysBadge || showDeltaPercentPlaysBadge)) {
                            // Under-number badge context -> compact font size xs
                            badge = <DeltaBadge delta={row.deltaPlays} cfg={badgeStylesPlays} kind="plays" showPercent={showDeltaPercentPlaysBadge} currentValue={row.plays} textSize="xs" columnContext contextView="table" />;
                        }
                        return (
                            <Flex direction="column" align="center">
                                <Text fw={600}>{row.plays}</Text>
                                {badge}
                            </Flex>
                        );
                    }
                };
            }
            if (col.key === 'name') {
                return {
                    ...base,
                    render: (row: ChartData) => (
                        <Flex>
                            {showImage && (
                                <Flex
                                    mr="sm"
                                    justify="center"
                                    align="center"
                                    onClick={e => e.stopPropagation()}
                                    onMouseDown={e => e.stopPropagation()}
                                >
                                    <SpotifyImageWithModal
                                        entityId={row.entityId}
                                        name={row.name}
                                        artistName={row.artistName}
                                        type={type as 'artist' | 'album' | 'track'}
                                        clientId={clientId}
                                        clientSecret={clientSecret}
                                        forceUpdate={imageForceUpdate[row.entityId]}
                                        width={40}
                                        height={40}
                                        borderRadius={0}
                                        style={{ minWidth: 40, maxWidth: 40 }}
                                        lastImageUrl={lastImageUrlByEntityId[row.entityId]}
                                        onImageChange={() => {
                                            setImageForceUpdate(f => ({ ...f, [row.entityId]: Date.now() }));
                                        }}
                                        onImageLoad={(url: string) => {
                                            if (row.entityId && url && lastImageUrlByEntityId[row.entityId] !== url) {
                                                setLastImageUrlByEntityId(prev => ({ ...prev, [row.entityId]: url }));
                                            }
                                        }}
                                    />
                                </Flex>
                            )}
                            <Flex direction="column" justify="center" align="flex-start">
                                <Text fw={700}>{row.name}</Text>
                                {artistMode === 'under' && row.artistName && <Text size="sm">{row.artistName}</Text>}
                            </Flex>
                        </Flex>
                    ),
                };
            }
            if (col.key === 'artist') {
                return {
                    ...base,
                    title: t('charts.artistLabel') as any,
                    accessor: 'artist',
                    textAlign: 'left' as const,
                    width: undefined,
                    render: (row: ChartData) => (
                        <Text fw={500} style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{row.artistName || '-'}</Text>
                    ),
                } as DataTableColumn<ChartData>;
            }
            if (col.key === 'peak') {
                return {
                    ...base,
                    render: (row: ChartData) => {
                        const stats = statsMap[row.entityId];
                        const current = stats?.peak?.position;
                        const stable = lastPeakById[row.entityId];
                        const display = (current != null) ? current : (stable != null ? stable : undefined);
                        const showCount = showPeakCount;
                        const hasStats = !!stats;
                        const liveCount = stats?.peak?.weeksAtPeak;
                        const stableWeeksAtPeak = lastWeeksAtPeakById[row.entityId];
                        const rawCountAtOne = (liveCount != null ? liveCount : stableWeeksAtPeak);
                        const renderedCountAtOne = display === 1 ? (hasStats ? Math.max(1, (rawCountAtOne as number) ?? 1) : 1) : null;
                        return (
                            <Flex direction="column" align="center">
                                <Text fw={display === 1 ? 700 : 500} c={display === 1 ? 'blue' : undefined} style={{ transition: 'color 120ms ease' }}>
                                    {display != null ? display : <span style={{ opacity: 0, display: 'inline-block', minWidth: 10 }}>0</span>}
                                </Text>
                                {showCount && display === 1 && renderedCountAtOne != null && (
                                    <Text  c="dimmed" style={{ lineHeight: 1, marginTop: 2, fontSize: '0.75em' }}>{`${renderedCountAtOne}x`}</Text>
                                )}
                            </Flex>
                        );
                    },
                };
            }
            if (col.key === 'totalWeeks') {
                return {
                    ...base,
                    render: (row: ChartData) => {
                        const stats = statsMap[row.entityId];
                        const current = stats?.totals?.withinCutoff;
                        const stable = lastWeeksById[row.entityId];
                        const display = (current != null) ? current : (stable != null ? stable : undefined);
                        return (
                            <Flex direction="column" align="center">
                                <Text fw={500} style={{ transition: 'color 120ms ease' }}>
                                    {display != null ? display : <span style={{ opacity: 0, display: 'inline-block', minWidth: 10 }}>0</span>}
                                </Text>
                            </Flex>
                        );
                    },
                };
            }
            if (col.key === 'cert') {
                return {
                    ...base,
                    title: 'Cert.',
                    render: (row: ChartData) => {
                        if (!(type === 'album' || type === 'track')) return null;
                        const stats = statsMap[row.entityId];
                        const totals = stats?.totals as any;
                        return (
                            <Flex direction="column" align="center">
                                {stats ? (
                                    <CertificationIcon
                                        key={`cert-${row.entityId}-${chart?.lastfm_username || 'nouser'}`}
                                        chart={chart}
                                        chartType={type as 'album' | 'track'}
                                        totals={totals}
                                        entity={{ name: row.name, artistName: row.artistName || '' }}
                                        entityId={row.entityId}
                                        username={chart?.lastfm_username}
                                        size={24}
                                        deferMs={300}
                                    />
                                ) : (
                                    <Text fw={700} size="xl">-</Text>
                                )}
                            </Flex>
                        );
                    },
                };
            }
            return {
                ...base,
                render: (row: ChartData) => <Text>{row.id}</Text>
            };
        });
        // Ensure artist column appears if artistMode is 'column' and it's not already present (defensive fallback)
        if (artistMode === 'column' && type !== 'artist') {
            const hasArtist = built.some((c: any) => c.accessor === 'artist');
            if (!hasArtist) {
                const artistCol: DataTableColumn<ChartData> = {
                    accessor: 'artist',
                    title: t('charts.artistLabel') as any,
                    textAlign: 'left' as const,
                    render: (row: ChartData) => (
                        <Text fw={500} style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{row.artistName || '-'}</Text>
                    ),
                };
                const nameIdx = built.findIndex((c: any) => c.accessor === 'name');
                if (nameIdx !== -1) built.splice(nameIdx + 1, 0, artistCol); else built.push(artistCol);
            }
        }
        if (showAltVariationRedux) {
            // Build proper altVariation column definition
            const altVariationCol: DataTableColumn<ChartData> = {
                accessor: 'altVariation',
                title: <IconArrowsDownUp size={18} stroke={2} style={{ verticalAlign: 'middle' }} />,
                textAlign: 'center',
                width: 65,
                cellsStyle: () => ({ paddingRight: 0, paddingLeft: 0 }),
                render: (row: ChartData, index: number) => {
                    const rawVal: any = altVariation ? altVariation(row, index) : undefined;
                    const value: any = (rawVal || rawVal === 0) ? (rawVal === '-' ? undefined : rawVal) : undefined;
                    // Only use splitTall if current preset actually uses split (maximalist). Otherwise follow current style.
                    let cfg: any = badgeStylesRank;
                    if (badgeStylesRank.iconPosition === 'split') {
                        cfg = { ...badgeStylesRank, iconPosition: 'split', splitTall: badgeStylesRank.splitTall !== false };
                    } else if (badgeStylesRank.iconPosition === 'hidden') {
                        // ensure some icon visibility for altVariation? Keep hidden to mirror style.
                        cfg = { ...badgeStylesRank, iconPosition: 'hidden', splitTall: false };
                    } else {
                        cfg = { ...badgeStylesRank, splitTall: false };
                    }
                    // Alt variation shown in its own column -> emphasized font size md, centered horizontally
                    return (
                        <Flex justify="center" align="center" style={{ width: '100%' }}>
                            <DeltaBadge delta={value} cfg={cfg} kind="rank" textSize="md" columnContext noSidePadding contextView="table" />
                        </Flex>
                    );
                }
            };
            const existingIdx = built.findIndex((c: DataTableColumn<ChartData>) => (c as any).accessor === 'altVariation');
            if (existingIdx !== -1) {
                built[existingIdx] = altVariationCol;
            } else {
                const rankIdx = built.findIndex((c: DataTableColumn<ChartData>) => (c as any).accessor === 'rank');
                if (rankIdx !== -1) built = [...built.slice(0, rankIdx + 1), altVariationCol, ...built.slice(rankIdx + 1)];
                else built = [altVariationCol, ...built];
            }
        }
        // Plays variation in its own column
        if (showAltPlaysVariationRedux) {
            const altPlaysCol: DataTableColumn<ChartData> = {
                accessor: 'altPlaysVariation',
                title: <IconArrowsDownUp size={18} stroke={2} style={{ verticalAlign: 'middle' }} />,
                textAlign: 'center',
                width: 84,
                cellsStyle: () => ({ paddingRight: 0, paddingLeft: 0 }),
                render: (row: ChartData) => {
                    // mirror badge style but for plays and set dynamic width like rank: compact vs icon+text
                    const cfg: any = { ...badgeStylesPlays };
                    const treatAsHiddenForWidth = cfg.hideLabel && cfg.iconPosition === 'before';
                    const isCompact = cfg.iconPosition === 'hidden' || treatAsHiddenForWidth; // only icon or only text
                    const widthOverride = isCompact ? 50 : 65; // plays: 50 (compact) / 65 (icon+text)
                    return (
                        <Flex justify="center" align="center" style={{ width: '100%' }}>
                            <DeltaBadge
                                delta={row.deltaPlays}
                                cfg={cfg}
                                kind="plays"
                                textSize="md"
                                columnContext
                                noSidePadding
                                contextView="table"
                                showPercent={playsVariationDisplay === 'percent'}
                                currentValue={row.plays}
                                fixedWidthOverride={widthOverride}
                            />
                        </Flex>
                    );
                }
            };
            const existingIdx = built.findIndex((c: DataTableColumn<ChartData>) => (c as any).accessor === 'altPlaysVariation');
            if (existingIdx !== -1) {
                built[existingIdx] = altPlaysCol;
            } else {
                const playsIdx = built.findIndex((c: DataTableColumn<ChartData>) => (c as any).accessor === 'plays');
                if (playsIdx !== -1) built = [...built.slice(0, playsIdx + 1), altPlaysCol, ...built.slice(playsIdx + 1)];
                else built = [altPlaysCol, ...built];
            }
        }
        return built;
    }, [
        filteredColumns,
        t,
        showDeltaBadge,
        showDeltaPlaysBadge,
        showDeltaPercentPlaysBadge,
        showImage,
        statsMap,
        clientId,
        clientSecret,
        imageForceUpdate,
        lastImageUrlByEntityId,
        type,
        badgeStylesRank,
        badgeStylesPlays,
        showAltVariationRedux,
        showAltPlaysVariationRedux,
        playsVariationLocation,
        playsVariationDisplay,
        showPeakCount,
        lastPeakById,
        lastWeeksById,
        lastWeeksAtPeakById,
        altVariation,
        chart,
        viewConfig?.settings
    ]);

    // legacy helper removed (logic centralized in DeltaBadge)

    const useProgressive = safeDisplayedData.length > 120; // desativa para listas pequenas
    const progressiveAll = useProgressiveReveal(safeDisplayedData, { initial: 40, step: 50, intervalMs: 24, adaptive: true, disableBelow: 250, targetDurationMs: 260 });
    const progressive = useProgressive ? progressiveAll : { items: safeDisplayedData, done: true, total: safeDisplayedData.length } as any;
    const displayedRecords = progressive.items as ChartData[];
    const showLoadingTail = useProgressive && !progressive.done;

    const tableBgSetting = (useSelector((state: RootState) => (state as any).columns?.views?.table?.settings?.tableBackground) || 'default') as 'default' | 'transparent';
    const paperProps = tableBgSetting === 'transparent' ? { shadow: 'none' as const, bg: 'transparent' as const } : { shadow: 'xs' as const };

    return (
        <>
            <Paper {...paperProps} p="md">
                <DataTable
                    className="datatable-transparent"
                    columns={dtColumns}
                    records={displayedRecords}
                    rowExpansion={{ content: renderExpansion, trigger: 'click', allowMultiple: true, }}
                    highlightOnHover
                    minHeight={300}
                />
                {showLoadingTail && (
                    <Flex justify="center" py="sm">
                        <Text size="xs" c="dimmed">Carregando {displayedRecords.length}/{progressive.total}…</Text>
                    </Flex>
                )}
            </Paper>
            <ImageEditModal
                opened={!!imageModalRow}
                onClose={() => setImageModalRow(null)}
                entityId={imageModalRow?.entityId || ''}
                name={imageModalRow?.name || ''}
                artistName={imageModalRow?.artistName}
                imageUrl={imageModalUrl || ''}
                type={type as 'artist' | 'album' | 'track'}
                clientId={clientId}
                clientSecret={clientSecret}
                onImageChange={url => {
                    setImageForceUpdate(f => ({ ...f, [imageModalRow.entityId]: Date.now() }));
                    setImageModalUrl(url);
                }}
            />
        </>
    );
};
