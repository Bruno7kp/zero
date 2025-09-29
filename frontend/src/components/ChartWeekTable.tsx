import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { DataTable, type DataTableColumnTextAlign } from 'mantine-datatable';
import type { DataTableColumn, DataTableRowExpansionProps } from 'mantine-datatable';
import { Paper, Text, Checkbox, Menu, ActionIcon, Badge, Flex } from '@mantine/core';
import type { ChartData } from '../db/indexedDb';
import { fetchChartData, fetchStatsMap } from '../store/chartsSlice';
import { ChartItemStatsLoader } from './ChartItemStatsLoader';
import { IconFilter, IconArrowsDownUp, IconCaretDownFilled, IconCaretUpFilled, IconStarFilled, IconArrowBackUp } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { updateColumn } from '../store/columnsSlice';
import { defaultColumns } from '../store/columnsSlice';

export function ChartWeekTableColumnsMenu() {
    const [opened, setOpened] = useState(false);
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const columns = useSelector((state: RootState) => state.columns.columns);
    const mandatory = ['rank', 'name'];

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
                    <IconFilter size={18} />
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
    week?: string;
    type: string;
    altVariation?: (row: ChartData, index: number) => string | number | false | null | undefined;
}

export const ChartWeekTable: React.FC<ChartWeekTableProps> = ({ chart, week, type, altVariation }) => {
    const data = useSelector((state: RootState) => state.charts.data);
    const statsMap = useSelector((state: RootState) => state.charts.statsMap);
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

    // Busca stats até a semana selecionada
    useEffect(() => {
        if (!data.length || !week) return;
        const cutoff = 100;
        dispatch(fetchStatsMap({ chartId: `${chart.id}`, chartType: type, data, cutoff, week }));
    }, [data, chart.id, type, week, dispatch]);

    // Colunas dinâmicas
    const visibleColumns = useMemo(() => columns.filter((c: any) => c.visible), [columns]);
    const showAltVariationRedux = columns.find((c: any) => c.key === 'altVariation')?.visible;
    // Opção para mostrar/esconder badge delta
    const showDeltaBadge = columns.find((c: any) => c.key === 'deltaRankBadge')?.visible;
    const showDeltaPlaysBadge = columns.find((c: any) => c.key === 'deltaPlaysBadge')?.visible;
    const showImage = columns.find((c: any) => c.key === 'image')?.visible;
    // Remove badges e deltaPlays das colunas visíveis (não são colunas reais)
    const filteredColumns = visibleColumns.filter((c: any) => c.key !== 'deltaRankBadge' && c.key !== 'deltaPlaysBadge' && c.key !== 'image');

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
    function getDeltaBadgeProps(delta: any) {
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
            if (delta > 0) { color = 'green'; label = `+${delta}`; }
            else if (delta < 0) { color = 'red'; label = `${delta}`; }
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
                        const { color, label } = getDeltaBadgeProps(row.deltaPlays);
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
                render: (row: ChartData, _index: number) => (
                    <Flex>
                        {showImage && (
                            <Flex mr="sm" justify="center" align="center">
                                <div style={{ width: 40, height: 40, background: '#eee' }} />
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
                render: (row: ChartData, _index: number) => {
                    const stats = statsMap[row.entityId];
                    const peakVal = stats?.peak?.position ?? '-';
                    return (
                        <Flex direction="column" align="center">
                            <Text fw={700} c={peakVal === 1 ? 'blue' : undefined}>{peakVal}</Text>
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
                            <Text fw={700}>{totalWeeks}</Text>
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
    }), [filteredColumns, t, showDeltaBadge, showDeltaPlaysBadge, showImage, statsMap]);
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
                let value: any = altVariation ? altVariation(row, index) : false;
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

    return (
        <Paper shadow="xs" p="md" withBorder>
            <DataTable
                columns={dtColumns}
                records={data}
                rowExpansion={{ content: renderExpansion, trigger: 'click', allowMultiple: true, }}
                highlightOnHover
                minHeight={300}
            />
        </Paper>
    );
};
