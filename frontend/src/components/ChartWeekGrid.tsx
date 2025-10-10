import React, { useEffect, useState, useRef } from 'react';
import { ImageEditModal } from './ImageEditModal';
import type { AppDispatch } from '../store/index';
import { useSelector, useDispatch } from 'react-redux';
import { fetchChartData, fetchStatsMapIncremental, computeWeekDeltas } from '../store/charts';
import { useProgressiveReveal } from '../hooks/useProgressiveReveal';
import { useDroppedItems } from '../hooks/useDroppedItems';
import { Text, Box, Grid, Modal, Divider } from '@mantine/core';
import { selectResolvedBadge } from '../store/badgeStylesSlice';
import type { ChartData } from '../db/indexedDb';
import { ChartItemStatsLoader } from './ChartItemStatsLoader';
import { makeScaleSize } from '../hooks/useFontScale';
import GridCard from './chartGrid/GridCard';
import GridAltVariationCorner from './chartGrid/GridAltVariationCorner';
import GridUnderRankVariation from './chartGrid/GridUnderRankVariation';
import { useTranslation } from 'react-i18next';

interface ChartWeekGridProps {
    chart: any;
    week?: string;
    type: string;
    clientId: string;
    clientSecret: string;
    altVariation?: (row: ChartData, index: number) => string | number | false | null | undefined;
}

export const ChartWeekGrid: React.FC<ChartWeekGridProps> = ({ chart, week, type, clientId, clientSecret, altVariation }) => {
    const dispatch = useDispatch<AppDispatch>();
    // Sincroniza colunas do grid com localStorage
    useEffect(() => {
        const storageKey = 'chart_columns_grid';
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    parsed.forEach((col: any) => {
                        dispatch({ type: 'columns/updateColumn', payload: { view: 'grid', key: col.key, visible: col.visible } });
                    });
                }
            } catch {
                // Ignora JSON inválido no localStorage
            }
        }
    }, [dispatch]);
    const [lastImageUrlByEntityId, setLastImageUrlByEntityId] = useState<{ [entityId: string]: string | null }>({});
    const badgeStylesRank = useSelector((s: any) => selectResolvedBadge(s, 'rank', 'grid'));
    const rankVariationLocation = useSelector((state: any) => (state.columns?.views?.grid?.settings?.rankVariationLocation) || 'under');
    const peakCountStyle = useSelector((state: any) => state.columns?.views?.grid?.settings?.peakCountStyle) || 'noCount';
    const showPeakCount = peakCountStyle === 'withCount';
    const showDroppedItems = useSelector((state: any) => state.columns?.views?.grid?.settings?.showDroppedItems) || false;
    const { t } = useTranslation();

    const renderUnderRankVariation = (value: any) => (
        <GridUnderRankVariation value={value} badgeStylesRank={badgeStylesRank} />
    );
    const data = useSelector((state: any) => state.charts.data);
    // Persist previous data while new data is loading to prevent flicker
    const [displayedData, setDisplayedData] = useState<any[]>(data);
    const prevDataRef = useRef<any[]>(data);
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
        return ready >= Math.ceil(cur.length * 0.9); // 90% prontos
    }, []);
    useEffect(() => {
        if (!Array.isArray(data) || data.length === 0) return; // mantém anterior
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

    // Garante que displayedData nunca fique vazio
    const safeDisplayedData = displayedData && displayedData.length > 0 ? displayedData : prevDataRef.current;
    const statsMap = useSelector((state: any) => state.charts.statsMap);
    const columns = useSelector((state: any) => (state.columns?.views?.grid?.columns) || state.columns?.columns || []);
    const showImage = columns.find((c: any) => c.key === 'image')?.visible;
    const showPeak = columns.find((c: any) => c.key === 'peak')?.visible;
    const showPlays = columns.find((c: any) => c.key === 'plays')?.visible;
    const showTotalWeeks = columns.find((c: any) => c.key === 'totalWeeks')?.visible;
    // altVariation column is never used in grid (mapping forces it off); badge visibility controls variation
    const gridView = useSelector((state: any) => (state as any).columns?.views?.grid);
    const fontScale = (gridView?.settings as any)?.fontScale ?? 0;
    const scaleSize = makeScaleSize(fontScale);

    // Modal de detalhes
    const [modalOpen, setModalOpen] = useState(false);
    const [modalRow, setModalRow] = useState<ChartData | null>(null);
    // Modal de imagem
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [imageModalRow] = useState<ChartData | null>(null); // setImageModalRow unused
    const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
    // Forçar atualização da imagem ao salvar
    const [imageForceUpdate, setImageForceUpdate] = useState<{ [entityId: string]: number }>({});

    // Últimos valores estáveis para Peak/Weeks para evitar flicker
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
            if (changed) {
                setLastPeakById(nextPeak);
                setLastWeeksById(nextWeeks);
                setLastWeeksAtPeakById(nextWeeksAtPeak);
            }
        } catch { /* noop */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statsMap]);

    // Fetch dropped items
    const droppedItems = useDroppedItems(`${chart?.id}`, type, week, safeDisplayedData, showDroppedItems);

    useEffect(() => {
        if (!week || !chart?.id) return;
        dispatch(fetchChartData({ chartId: `${chart.id}`, chartType: type, week }));
    }, [chart?.id, week, type, dispatch]);

    useEffect(() => {
        if (!data.length || !week || !chart?.id) return;
        dispatch(computeWeekDeltas({ chartId: `${chart.id}`, chartType: type, week, rows: data }));
    }, [data, week, chart?.id, type, dispatch]);

    // Stats diferidos somente se peak ou totalWeeks estiverem visíveis
    useEffect(() => {
        if (!data.length || !week || !chart?.id) return;
        const wantsStats = columns.some((c: any) => (c.key === 'peak' || c.key === 'totalWeeks') && c.visible);
        if (!wantsStats) return;
        let cancelled = false;
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const id = setTimeout(() => {
                if (cancelled) return;
                dispatch(fetchStatsMapIncremental({ chartId: `${chart.id}`, chartType: type, data, week }));
            }, 900);
            (window as any).__gridStatsTimer = id;
        }));
        return () => {
            cancelled = true;
            if ((window as any).__gridStatsTimer) clearTimeout((window as any).__gridStatsTimer);
        };
    }, [data, chart?.id, type, week, dispatch, columns]);

    // Progressive reveal dos cards (melhora percepção de velocidade em listas grandes)
    const useProgressive = safeDisplayedData.length > 120;
    const progressiveAll = useProgressiveReveal(safeDisplayedData, { initial: 30, step: 36, intervalMs: 24, adaptive: true, disableBelow: 180, targetDurationMs: 240 });
    const progressive = useProgressive ? progressiveAll : { items: safeDisplayedData, done: true, total: safeDisplayedData.length } as any;
    const visibleCards = progressive.items;
    const showLoadingTail = useProgressive && !progressive.done;

    const modalTitle = modalRow ? `${modalRow.name}${modalRow.artistName ? ' — ' + modalRow.artistName : ''}` : 'Detalhes';
    return (
        <>
            <Modal
                opened={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalTitle}
                size="xl"
                styles={{
                    header: { justifyContent: 'center', position: 'relative' },
                    title: { width: '100%', textAlign: 'center', fontWeight: 700 },
                    close: { position: 'absolute', right: 8 }
                }}
            >
                {modalRow && (
                    <ChartItemStatsLoader
                        chartId={modalRow.chartId}
                        chartType={modalRow.chartType}
                        entityId={modalRow.entityId}
                        week={week}
                    />
                )}
            </Modal>
            <Grid gutter="md" columns={30}>
                {visibleCards.map((row: ChartData, idx: number) => {
                    const stats = statsMap[row.entityId];
                    return (
                        <Grid.Col key={row.id} span={{ base: 15, md: 10, lg: 6 }}>
                            <GridCard
                                row={row}
                                type={(type === 'artist' || type === 'album' || type === 'track') ? type : 'artist'}
                                clientId={clientId}
                                clientSecret={clientSecret}
                                rankVariationLocation={rankVariationLocation}
                                showImage={!!showImage}
                                showPeak={!!showPeak}
                                showPlays={!!showPlays}
                                showTotalWeeks={!!showTotalWeeks}
                                scaleSize={scaleSize as any}
                                onOpenModal={(r) => { setModalRow(r); setModalOpen(true); }}
                                imageForceUpdate={imageForceUpdate[row.entityId]}
                                lastImageUrl={lastImageUrlByEntityId[row.entityId]}
                                onImageChange={() => {
                                    if (row.entityId) {
                                        setImageForceUpdate(fu => ({ ...fu, [row.entityId]: (fu[row.entityId] || 0) + 1 }));
                                    }
                                }}
                                onImageLoad={(url: string) => {
                                    if (row.entityId && url && lastImageUrlByEntityId[row.entityId] !== url) {
                                        setTimeout(() => {
                                            setLastImageUrlByEntityId(prev => {
                                                if (prev[row.entityId] !== url) {
                                                    return { ...prev, [row.entityId]: url };
                                                }
                                                return prev;
                                            });
                                        }, 1000);
                                    }
                                }}
                                renderUnderRankVariation={(val) => renderUnderRankVariation(val)}
                                cornerOverlay={rankVariationLocation === 'corner' ? (
                                    <GridAltVariationCorner row={row} idx={idx} badgeStylesRank={badgeStylesRank} altVariation={altVariation} />
                                ) : undefined}
                                stats={{
                                    peak: {
                                        position: (stats?.peak?.position != null ? stats?.peak?.position : lastPeakById[row.entityId]) ?? undefined,
                                        weeksAtPeak: (stats?.peak?.weeksAtPeak != null ? stats?.peak?.weeksAtPeak : lastWeeksAtPeakById[row.entityId]) ?? undefined,
                                    },
                                    totals: { withinCutoff: (stats?.totals?.withinCutoff != null ? stats?.totals?.withinCutoff : lastWeeksById[row.entityId]) ?? undefined },
                                }}
                                showPeakCount={showPeakCount}
                            />
                        </Grid.Col>
                    );
                })}
            </Grid>
            {showLoadingTail && (
                <Box py="sm" style={{ textAlign: 'center' }}>
                    <Text size="xs" c="dimmed">Carregando {visibleCards.length}/{progressive.total}…</Text>
                </Box>
            )}
            
            {/* Dropped items section */}
            {showDroppedItems && droppedItems.length > 0 && (
                <>
                    <Divider my="md" label={t('charts.droppedItemsLabel', { count: droppedItems.length })} labelPosition="center" />
                    <Grid gutter="sm">
                        {droppedItems.map((row: ChartData, idx: number) => {
                            const stats = (row && row.entityId) ? statsMap[row.entityId] : null;
                            return (
                                <Grid.Col span={{ base: 6, xs: 4, sm: 3, md: 3, lg: 2 }} key={row.id}>
                                    <GridCard
                                        row={row}
                                        type={(type === 'artist' || type === 'album' || type === 'track') ? type : 'artist'}
                                        clientId={clientId}
                                        clientSecret={clientSecret}
                                        rankVariationLocation={rankVariationLocation}
                                        showImage={!!showImage}
                                        showPeak={!!showPeak}
                                        showPlays={!!showPlays}
                                        showTotalWeeks={!!showTotalWeeks}
                                        scaleSize={scaleSize as any}
                                        onOpenModal={(r) => { setModalRow(r); setModalOpen(true); }}
                                        imageForceUpdate={imageForceUpdate[row.entityId]}
                                        lastImageUrl={lastImageUrlByEntityId[row.entityId]}
                                        onImageChange={() => {
                                            if (row.entityId) {
                                                setImageForceUpdate(fu => ({ ...fu, [row.entityId]: (fu[row.entityId] || 0) + 1 }));
                                            }
                                        }}
                                        onImageLoad={(url: string) => {
                                            if (row.entityId && url && lastImageUrlByEntityId[row.entityId] !== url) {
                                                setTimeout(() => {
                                                    setLastImageUrlByEntityId(prev => {
                                                        if (prev[row.entityId] !== url) {
                                                            return { ...prev, [row.entityId]: url };
                                                        }
                                                        return prev;
                                                    });
                                                }, 1000);
                                            }
                                        }}
                                        renderUnderRankVariation={(val) => renderUnderRankVariation(val)}
                                        cornerOverlay={rankVariationLocation === 'corner' ? (
                                            <GridAltVariationCorner row={row} idx={idx} badgeStylesRank={badgeStylesRank} altVariation={altVariation} />
                                        ) : undefined}
                                        stats={{
                                            peak: {
                                                position: (stats?.peak?.position != null ? stats?.peak?.position : lastPeakById[row.entityId]) ?? undefined,
                                                weeksAtPeak: (stats?.peak?.weeksAtPeak != null ? stats?.peak?.weeksAtPeak : lastWeeksAtPeakById[row.entityId]) ?? undefined,
                                            },
                                            totals: { withinCutoff: (stats?.totals?.withinCutoff != null ? stats?.totals?.withinCutoff : lastWeeksById[row.entityId]) ?? undefined },
                                        }}
                                        showPeakCount={showPeakCount}
                                    />
                                </Grid.Col>
                            );
                        })}
                    </Grid>
                </>
            )}
            
            {/* Modal de imagem grande e edição */}
            <ImageEditModal
                opened={imageModalOpen}
                onClose={() => setImageModalOpen(false)}
                entityId={imageModalRow?.entityId || ''}
                name={imageModalRow?.name || ''}
                artistName={imageModalRow?.artistName || ''}
                imageUrl={imageModalUrl || ''}
                type={type === 'artist' || type === 'album' || type === 'track' ? type : 'artist'}
                clientId={clientId}
                clientSecret={clientSecret}
                onImageChange={url => {
                    setImageModalUrl(url);
                    if (imageModalRow?.entityId) {
                        setImageForceUpdate(fu => ({ ...fu, [imageModalRow.entityId]: (fu[imageModalRow.entityId] || 0) + 1 }));
                    }
                }}
            />
        </>
    );
};
