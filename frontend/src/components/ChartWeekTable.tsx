import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ImageEditModal } from './ImageEditModal';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { DataTable } from 'mantine-datatable';
import type { DataTableColumn, DataTableRowExpansionProps } from 'mantine-datatable';
import { Paper, Text, Flex } from '@mantine/core';
import { selectResolvedBadge } from '../store/badgeStylesSlice';
import type { ChartData } from '../db/indexedDb';
import { fetchChartData, fetchStatsMapIncremental, computeWeekDeltas } from '../store/charts';
import { useProgressiveReveal } from '../hooks/useProgressiveReveal';
// removed inline column builders for arrows and image; handled in builder/NameCell
import { useTranslation } from 'react-i18next';
import { updateColumn } from '../store/columnsSlice';
// Certification rendering moved to CertCell
import { makeScaleSize } from '../hooks/useFontScale';
// cells are used inside buildTableColumns
import buildTableColumns from './chartTable/buildTableColumns';
import RowExpansionStats from './chartTable/RowExpansionStats';
import { useStableDisplayedData } from './chartTable/hooks/useStableDisplayedData';
import { useDeferredStats } from './chartTable/hooks/useDeferredStats';
import { useStatsEmptyFallback } from './chartTable/hooks/useStatsEmptyFallback';

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
    const { safeDisplayedData } = useStableDisplayedData(data, week, type, chart?.id);
    const statsMap = useSelector((state: RootState) => state.charts.statsMap);
    // const loadingStats = useSelector((state: RootState) => state.charts.loadingStats); // no longer needed in table columns
    const viewConfig = useSelector((state: RootState) => (state as any).columns?.views?.table);
    const fontScale = (viewConfig?.settings as any)?.fontScale ?? 0;
    const scaleSize = makeScaleSize(fontScale);
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

    useDeferredStats(dispatch, { chartId: `${chart.id}`, chartType: type, data, week }, columns as any[]);

    // Refetch incremental quando usuário habilita colunas de stats após já ter carregado dados
    // stats visibility handled inside useDeferredStats

    // Fallback: se colunas de stats visíveis mas statsMap continua vazio após pequeno intervalo, força uma nova tentativa
    const triggerRefetch = useCallback(() => {
        dispatch(fetchStatsMapIncremental({ chartId: `${chart.id}`, chartType: type, data, week }));
    }, [dispatch, chart.id, type, data, week]);
    useStatsEmptyFallback(true, statsMap, data, week, triggerRefetch);

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
        <RowExpansionStats chartId={record.chartId} chartType={record.chartType} entityId={record.entityId} week={week} />
    );

    // Monta colunas para o DataTable
    // Função utilitária para cor/label do badge
    // getDeltaBadgeProps removed (logic centralized in DeltaBadge)
    // Mapeamento das colunas para o DataTable
    const dtColumns: DataTableColumn<ChartData>[] = useMemo(() => {
        return buildTableColumns({
            filteredColumns,
            t,
            showDeltaBadge: !!showDeltaBadge,
            showDeltaPlaysBadge: !!showDeltaPlaysBadge,
            showDeltaPercentPlaysBadge: !!showDeltaPercentPlaysBadge,
            showImage: !!showImage,
            statsMap,
            clientId,
            clientSecret,
            imageForceUpdate,
            lastImageUrlByEntityId,
            type,
            badgeStylesRank,
            badgeStylesPlays,
            showAltVariationRedux: !!showAltVariationRedux,
            showAltPlaysVariationRedux: !!showAltPlaysVariationRedux,
            playsVariationLocation,
            playsVariationDisplay,
            showPeakCount,
            lastPeakById,
            lastWeeksById,
            lastWeeksAtPeakById,
            altVariation,
            chart,
            viewSettings: viewConfig?.settings,
            scaleSize: scaleSize as any,
            onNameImageChange: (row) => {
                setImageForceUpdate(f => ({ ...f, [row.entityId]: Date.now() }));
            },
            onNameImageLoad: (row, url) => {
                if (row.entityId && url && lastImageUrlByEntityId[row.entityId] !== url) {
                    setLastImageUrlByEntityId(prev => ({ ...prev, [row.entityId]: url }));
                }
            },
        });
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
        viewConfig?.settings,
        scaleSize,
        
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
