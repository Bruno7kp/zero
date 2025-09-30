import React, { useEffect, useMemo, useState } from 'react';
import { ImageEditModal } from './ImageEditModal';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { DataTable, type DataTableColumnTextAlign } from 'mantine-datatable';
import type { DataTableColumn, DataTableRowExpansionProps } from 'mantine-datatable';
import { Paper, Text, Checkbox, Menu, ActionIcon, Badge, Flex } from '@mantine/core';
import type { ChartData } from '../db/indexedDb';
import { fetchChartData, fetchStatsMapIncremental, computeWeekDeltas } from '../store/chartsSlice';
import { useProgressiveReveal } from '../hooks/useProgressiveReveal';
import { ChartItemStatsLoader } from './ChartItemStatsLoader';
import { IconArrowsDownUp, IconCaretDownFilled, IconCaretUpFilled, IconStarFilled, IconArrowBackUp, IconSettings } from '@tabler/icons-react';
import { SpotifyImageWithModal } from './SpotifyImageWithModal';
import { useTranslation } from 'react-i18next';
import { updateColumn } from '../store/columnsSlice';
import { defaultColumns } from '../store/columnsSlice';

// Permite configurações de colunas separadas para cada tipo de visualização (table/list/grid)
export function ChartWeekTableColumnsMenu({ viewType, onColumnsChange }: { viewType: 'table' | 'list' | 'grid', onColumnsChange?: (cols: any[]) => void }) {
    const [opened, setOpened] = useState(false);
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const columns = useSelector((state: RootState) => state.columns.columns);
    const mandatory = ['rank', 'name'];

    // Chave de storage por tipo de visualização
    const storageKey = `chart_columns_${viewType}`;

    // Carrega do localStorage ao trocar viewType
    useEffect(() => {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    parsed.forEach((col: any) => {
                        dispatch(updateColumn({ key: col.key, visible: col.visible }));
                    });
                    if (onColumnsChange) onColumnsChange(parsed);
                }
            } catch {}
        } else {
            // Se não houver, salva o default atual
            localStorage.setItem(storageKey, JSON.stringify(columns));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewType]);

    // Sempre que columns mudar, salva no localStorage para o tipo atual
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(columns));
        if (onColumnsChange) onColumnsChange(columns);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [columns]);

    // Garante que a coluna altVariation está presente no Redux
    useEffect(() => {
        if (!columns.find((c: any) => c.key === 'altVariation')) {
            dispatch(updateColumn({ key: 'altVariation', visible: false }));
        }
    }, [columns, dispatch]);

    // Mapeia visibilidade do Redux para a ordem e labels do defaultColumns
    const columnsWithVisibility = defaultColumns.map((col: { key: string; label: string; labelComplete?: string; visible: boolean }) => {
        const reduxCol = columns.find((c: any) => c.key === col.key);
        return { ...col, visible: reduxCol ? reduxCol.visible : col.visible };
    });

    const handleToggle = (key: string) => {
        if (mandatory.includes(key)) return; // não permite desmarcar colunas obrigatórias
        const col = columns.find((c: any) => c.key === key);
        if (col) {
            dispatch(updateColumn({ key, visible: !col.visible }));
        }
    };
    return (
        <Menu shadow="md" width={250} opened={opened} onChange={setOpened} closeOnItemClick={false}>
            <Menu.Target>
                <ActionIcon size="lg" variant="subtle" onClick={() => setOpened((o) => !o)}>
                    <IconSettings size={18} />
                </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                {columnsWithVisibility.map((col: any) => {
                    const isMandatory = mandatory.includes(col.key);
                    return (
                        <Menu.Item key={col.key}>
                            <Checkbox
                                checked={isMandatory ? true : col.visible}
                                disabled={isMandatory}
                                onChange={() => handleToggle(col.key)}
                                label={(col.labelComplete ? t(col.labelComplete) : t(col.label)) || col.key}
                            />
                        </Menu.Item>
                    );
                })}
            </Menu.Dropdown>
        </Menu>
    );
}

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
    const columns = useSelector((state: RootState) => state.columns.columns);
    const dispatch = useDispatch<AppDispatch>();
    const { t } = useTranslation();
    useEffect(() => {
        const mandatory = ['rank', 'name'];
        mandatory.forEach(key => {
            const col: any = columns.find((c: any) => c.key === key);
            if (col && !col.visible) {
                dispatch(updateColumn({ key, visible: true }));
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
        // Só agenda se alguma coluna de stats estiver visível (peak ou totalWeeks)
        const wantsStats = columns.some((c: any) => c.key === 'peak' && c.visible) || columns.some((c: any) => c.key === 'totalWeeks' && c.visible);
        if (!wantsStats) return; // evita custo se usuário ocultou
        let cancelled = false;
        // dupla rAF para garantir pintura da semana, depois timeout para dar respiro
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const id = setTimeout(() => {
                if (cancelled) return;
                dispatch(fetchStatsMapIncremental({ chartId: `${chart.id}`, chartType: type, data, week }));
            }, 900); // atraso ~1s perceptivo, ajustável
            // store id em closure; cleanup abaixo
            (window as any).__tableStatsTimer = id;
        }));
        return () => {
            cancelled = true;
            if ((window as any).__tableStatsTimer) clearTimeout((window as any).__tableStatsTimer);
        };
    }, [data, chart.id, type, week, dispatch, columns]);

    // Colunas dinâmicas
    const visibleColumns = useMemo(() => columns.filter((c: any) => c.visible), [columns]);
    const showAltVariationRedux = columns.find((c: any) => c.key === 'altVariation')?.visible;
    // Opção para mostrar/esconder badge delta
    const showDeltaBadge = columns.find((c: any) => c.key === 'deltaRankBadge')?.visible;
    const showDeltaPlaysBadge = columns.find((c: any) => c.key === 'deltaPlaysBadge')?.visible;
    const showDeltaPercentPlaysBadge = columns.find((c: any) => c.key === 'deltaPercentPlaysBadge')?.visible;
    const showImage = columns.find((c: any) => c.key === 'image')?.visible;
    // Remove badges e deltaPlays das colunas visíveis (não são colunas reais)
    const filteredColumns = visibleColumns.filter((c: any) => c.isColumn);

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
    function getDeltaBadgeProps(delta: any, showPercent: boolean = false, currentValue: number = 0) {
        // Rules:
        //  - number > 0 => +N green
        //  - number < 0 => -N red
        //  - number === 0 => '=' gray
        //  - 'NEW' => blue
        //  - 'RE'  => yellow
        //  - anything else / '-' => gray
        let color = 'gray';
        let label: string | number = delta;
        if (typeof delta === 'number') {
            if (delta > 0) { 
                color = 'green';
                if (showPercent && currentValue - delta > 0) { 
                    const percent = ((delta / (currentValue - delta)) * 100);
                    label = `+${percent.toFixed(0)}%`; 
                } else {
                    label = `+${delta}`; 
                }
            }
            else if (delta < 0) {
                color = 'red';
                if (showPercent && currentValue - delta > 0) {
                    const percent = ((delta / (currentValue - delta)) * 100);
                    label = `${percent.toFixed(0)}%`;
                } else {
                    label = `${delta}`;
                }
            }
            else { color = 'gray'; label = '='; }
        } else if (delta === 'NEW') {
            color = 'blue'; label = 'NEW';
        } else if (delta === 'RE') {
            color = 'yellow'; label = 'RE';
        } else if (delta === '-' || delta == null) {
            color = 'gray'; label = '-';
        }
        return { color, label };
    }
    // Mapeamento das colunas para o DataTable
    let dtColumns: DataTableColumn<ChartData>[] = useMemo(() => filteredColumns.map((col: any): DataTableColumn<ChartData> => {
        const base = {
            accessor: col.key,
            title: col.labelComplete ? t(col.label) : t(col.labelComplete) || col.key,
            textAlign: col.key === 'name' ? 'left' : ('center' as const) as DataTableColumnTextAlign,
            width: col.key === 'name' ? undefined : 80,
        };
        if (col.key === 'rank') {
            return {
                ...base,
                render: (row: ChartData, _index: number) => {
                    let badge = null;
                    if (showDeltaBadge) {
                        const { color, label } = getDeltaBadgeProps(row.deltaRank);
                        badge = (
                            <Badge variant="light" color={color} size="xs">{label}</Badge>
                        );
                    }
                    return (
                        <Flex direction="column" align="center">
                            <Text fw={700} size="lg" c={row.rank === 1 ? 'blue' : undefined}>{row.rank}</Text>
                            {badge}
                        </Flex>
                    );
                }
            };
        }
        if (col.key === 'plays') {
            return {
                ...base,
                render: (row: ChartData, _index: number) => {
                    let badge = null;
                    if (showDeltaPlaysBadge) {
                        const { color, label } = getDeltaBadgeProps(row.deltaPlays, showDeltaPercentPlaysBadge, row.plays);
                        badge = (
                            <Badge variant="light" color={color} size="xs">{label}</Badge>
                        );
                    }
                    return (
                        <Flex direction="column" align="center">
                            <Text fw={700}>{row.plays}</Text>
                            {badge}
                        </Flex>
                    );
                }
            };
        }
        if (col.key === 'name') {
            return {
                ...base,
                render: (row: ChartData, _index: number) => {
                    return (
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
                                            // Não troca a imagem imediatamente, só quando a nova carregar
                                        }}
                                        onImageLoad={(url: string) => {
                                            // Só troca a imagem quando a nova já está pronta
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
                    );
                },
            };
        }
        if (col.key === 'peak') {
            return {
                ...base,
                render: (row: ChartData, _index: number) => {
                    const stats = statsMap[row.entityId];
                    const peakVal = stats?.peak?.position ?? '-';
                    return (
                        <Flex direction="column" align="center">
                            <Text fw={700} c={peakVal === 1 ? 'blue' : undefined}>{stats ? peakVal : (loadingStats ? '…' : '-')}</Text>
                        </Flex>
                    );
                },
            };
        }
        if (col.key === 'totalWeeks') {
            return {
                ...base,
                render: (row: ChartData, _index: number) => {
                    const stats = statsMap[row.entityId];
                    const totalWeeks = stats?.totals?.withinCutoff ?? '-';
                    return (
                        <Flex direction="column" align="center">
                            <Text fw={700}>{stats ? totalWeeks : (loadingStats ? '…' : '-')}</Text>
                        </Flex>
                    );
                },
            };
        }
        return {
            ...base,
            render: (row: ChartData, _index: number) => {
                return <Text>{row.id}</Text>;
            }
        };
    }), [filteredColumns, t, showDeltaBadge, showDeltaPlaysBadge, showDeltaPercentPlaysBadge, showImage, statsMap, loadingStats, clientId, clientSecret, imageForceUpdate, lastImageUrlByEntityId, type]);
    // Adiciona coluna de variação visual se ativada (agora controlada pelo Redux)
    if (showAltVariationRedux) {
        // Remove qualquer coluna Δ já existente
        dtColumns = dtColumns.filter(col => col.accessor !== 'altVariation');
        // Cria a coluna Δ
        const altVariationCol: DataTableColumn<ChartData> = {
            accessor: 'altVariation',
            title: <IconArrowsDownUp size={18} stroke={2} style={{ verticalAlign: 'middle' }} />, 
            textAlign: 'center',
            width: 80,
            cellsStyle: () => ({ paddingRight: 0 }),
            render: (row: ChartData, index: number) => {
                const value: any = altVariation ? altVariation(row, index) : false;
                let color = 'gray', label = '', rightIcon = null;
                if (value === 'NEW') {
                    color = 'blue'; label = 'NEW'; rightIcon = <IconStarFilled size={10} style={{ verticalAlign: 'middle' }} />;
                } else if (value === 'RE') {
                    color = 'yellow'; label = 'RE'; rightIcon = <IconArrowBackUp stroke={3} size={16} style={{ verticalAlign: 'middle', transform: "scaleX(-1)" }} />;
                } else if (typeof value === 'number' && value < 0) {
                    color = 'red'; label = String(value); rightIcon = <IconCaretDownFilled size={16} style={{ verticalAlign: 'middle' }} />;
                } else if (typeof value === 'number' && value > 0) {
                    color = 'green'; label = `+${value}`; rightIcon = <IconCaretUpFilled size={16} style={{ verticalAlign: 'middle' }} />;
                } else if (value === 0 || value === '=') {
                    color = 'gray'; label = '=';  rightIcon = ' ';
                } else if (!value || value === '-') {
                    color = 'gray'; label = '';
                } else {
                    label = String(value);
                }
                return label ? (
                    <Flex direction="row" gap="sm" align="center" style={{ height: 40 }}>
                        <Badge 
                            color={color} 
                            variant="light" 
                            size="md" 
                            style={{
                                borderRadius: 0,
                                width: 40,
                                padding: 0,
                                fontWeight: 700,
                                fontSize: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {label}
                        </Badge>
                        <Badge 
                            color={color} 
                            variant={color === 'gray' ? 'light' : 'filled'}
                            size="md" 
                            style={{
                                borderRadius: 0,
                                width: 15,
                                height: '100%',
                                minHeight: 32,
                                padding: 0,
                                display: 'flex',
                                alignItems: 'stretch',
                            }}
                        >
                            <Flex align="center" justify="center" style={{height: '100%', width: '100%'}}>
                                {rightIcon}
                            </Flex>
                        </Badge>
                    </Flex>
                ) : null;
            }
        };
        // Encontra o índice da coluna rank
        const rankIdx = dtColumns.findIndex(col => col.accessor === 'rank');
        if (rankIdx !== -1) {
            dtColumns = [
                ...dtColumns.slice(0, rankIdx + 1),
                altVariationCol,
                ...dtColumns.slice(rankIdx + 1)
            ];
        } else {
            dtColumns = [altVariationCol, ...dtColumns];
        }
    }

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
