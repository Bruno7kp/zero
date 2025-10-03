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
    const statsMap = useSelector((state: RootState) => state.charts.statsMap);
    const loadingStats = useSelector((state: RootState) => state.charts.loadingStats);
    const columns = useSelector((state: RootState) => (state as any).columns?.views?.table?.columns || (state as any).columns?.columns || []);
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
    const statsColumnsVisible = useMemo(() => columns.some((c: any) => (c.key === 'peak' || c.key === 'totalWeeks' || c.key === 'cert') && c.visible), [columns]);
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
    const showImage = columns.find((c: any) => c.key === 'image')?.visible;
    const badgeStylesRank = useSelector((s: any) => selectResolvedBadge(s, 'rank', 'table'));
    const badgeStylesPlays = useSelector((s: any) => selectResolvedBadge(s, 'plays', 'table'));
    // Remove badges e deltaPlays das colunas visíveis (não são colunas reais)
    const filteredColumns = useMemo(() => {
        const base = visibleColumns.filter((c: any) => c.isColumn);
        // Hide certification column entirely for artist charts
        return type === 'artist' ? base.filter((c: any) => c.key !== 'cert') : base;
    }, [visibleColumns, type]);

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
        const built = filteredColumns.map((col: any): DataTableColumn<ChartData> => {
            const base = {
                accessor: col.key,
                title: (col.label ?? t(col.label)) || col.key,
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
                        if (showDeltaPlaysBadge || showDeltaPercentPlaysBadge) {
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
                                {row.artistName && <Text size="sm">{row.artistName}</Text>}
                            </Flex>
                        </Flex>
                    ),
                };
            }
            if (col.key === 'peak') {
                return {
                    ...base,
                    render: (row: ChartData) => {
                        const stats = statsMap[row.entityId];
                        const peakVal = stats?.peak?.position ?? '-';
                        return (
                            <Flex direction="column" align="center">
                                <Text fw={peakVal === 1 ? 700 : 500} c={peakVal === 1 ? 'blue' : undefined}>{stats ? peakVal : (loadingStats ? '…' : '-')}</Text>
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
                        const totalWeeks = stats?.totals?.withinCutoff ?? '-';
                        return (
                            <Flex direction="column" align="center">
                                <Text fw={500}>{stats ? totalWeeks : (loadingStats ? '…' : '-')}</Text>
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
                                {stats
                                    ? <CertificationIcon
                                        chart={chart}
                                        chartType={type as 'album' | 'track'}
                                        totals={totals}
                                        entity={{ name: row.name, artistName: row.artistName || '' }}
                                        username={chart?.lastfm_username}
                                        dayOfWeek={chart?.day_of_week}
                                        size={24}
                                        deferMs={300}
                                      />
                                    : (loadingStats ? <Text fw={500}>…</Text> : <Text fw={500}>-</Text>)}
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
        if (showAltVariationRedux) {
            // Build proper altVariation column definition
            const altVariationCol: DataTableColumn<ChartData> = {
                accessor: 'altVariation',
                title: <IconArrowsDownUp size={18} stroke={2} style={{ verticalAlign: 'middle' }} />,
                textAlign: 'center',
                width: 65,
                cellsStyle: () => ({ paddingRight: 0, paddingLeft: 0 }),
                render: (row: ChartData, index: number) => {
                    const value: any = altVariation ? altVariation(row, index) : false;
                    if (!value && value !== 0) return null;
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
                    // Alt variation shown in its own column -> emphasized font size lg
                    return <DeltaBadge delta={value} cfg={cfg} kind="rank" textSize="md" columnContext noSidePadding contextView="table" />;
                }
            };
            const existingIdx = built.findIndex((c: DataTableColumn<ChartData>) => (c as any).accessor === 'altVariation');
            if (existingIdx !== -1) {
                built[existingIdx] = altVariationCol;
                return built;
            }
            const rankIdx = built.findIndex((c: DataTableColumn<ChartData>) => (c as any).accessor === 'rank');
            if (rankIdx !== -1) {
                return [...built.slice(0, rankIdx + 1), altVariationCol, ...built.slice(rankIdx + 1)];
            }
            return [altVariationCol, ...built];
        }
        return built;        
    }, [filteredColumns, t, showDeltaBadge, showDeltaPlaysBadge, showDeltaPercentPlaysBadge, showImage, statsMap, loadingStats, clientId, clientSecret, imageForceUpdate, lastImageUrlByEntityId, type, badgeStylesRank, badgeStylesPlays, showAltVariationRedux, altVariation, chart]);

    // legacy helper removed (logic centralized in DeltaBadge)

    const useProgressive = data.length > 120; // desativa para listas pequenas
    const progressiveAll = useProgressiveReveal(data, { initial: 40, step: 50, intervalMs: 24, adaptive: true, disableBelow: 250, targetDurationMs: 260 });
    const progressive = useProgressive ? progressiveAll : { items: data, done: true, total: data.length } as any;
    const displayedRecords = progressive.items as ChartData[];
    const showLoadingTail = useProgressive && !progressive.done;

    return (
        <>
            <Paper shadow="xs" p="md" withBorder>
                <DataTable
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
