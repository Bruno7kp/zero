import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { DataTable, type DataTableColumnTextAlign } from 'mantine-datatable';
import type { DataTableColumn, DataTableRowExpansionProps } from 'mantine-datatable';
import { Paper, Text, Checkbox, Menu, ActionIcon, Badge, Flex } from '@mantine/core';
import type { ChartData } from '../db/indexedDb';
import { fetchChartData, fetchStatsMap } from '../store/chartsSlice';
import { IconFilter } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { updateColumn } from '../store/columnsSlice';



export function ChartWeekTableColumnsMenu() {
    const [opened, setOpened] = useState(false);
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const columns = useSelector((state: RootState) => state.columns.columns);
    const handleToggle = (key: string) => {
        const col = columns.find((c: any) => c.key === key);
        if (col) {
            dispatch(updateColumn({ key, visible: !col.visible }));
        }
    };
    return (
        <Menu shadow="md" width={200} opened={opened} onChange={setOpened} closeOnItemClick={false}>
            <Menu.Target>
                <ActionIcon size="lg" variant="subtle" onClick={() => setOpened((o) => !o)}>
                    <IconFilter size={18} />
                </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                {columns.map((col: any) => (
                    <Menu.Item key={col.key}>
                        <Checkbox
                            checked={col.visible}
                            onChange={() => handleToggle(col.key)}
                            label={col.labelComplete ? t(col.labelComplete) : t(col.label) || col.key}
                        />
                    </Menu.Item>
                ))}
            </Menu.Dropdown>
        </Menu>
    );
}




export const ChartWeekTable: React.FC<{ chart: any; week?: string; type: string }> = ({ chart, week, type }) => {
    const dispatch = useDispatch<AppDispatch>();
    const data = useSelector((state: RootState) => state.charts.data);
    const statsMap = useSelector((state: RootState) => state.charts.statsMap);
    const columns = useSelector((state: RootState) => state.columns.columns);
    const { t } = useTranslation();

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
    // Opção para mostrar/esconder badge delta
    const showDeltaBadge = columns.find((c: any) => c.key === 'deltaRankBadge')?.visible;
    const showDeltaPlaysBadge = columns.find((c: any) => c.key === 'deltaPlaysBadge')?.visible;
    // Remove badges e deltaPlays das colunas visíveis (não são colunas reais)
    const filteredColumns = visibleColumns.filter((c: any) => c.key !== 'deltaRankBadge' && c.key !== 'deltaPlaysBadge' && c.key !== 'image');




    // Row expansion
    const renderExpansion: DataTableRowExpansionProps<ChartData>['content'] = ({ record }) => {
        const stats = statsMap[record.entityId];
        return (
            <Paper p="sm">
                {stats ? (
                    <div>
                        <Text size="sm" fw={500}>Stats:</Text>
                        <pre style={{ fontSize: 12 }}>{JSON.stringify(stats, null, 2)}</pre>
                        {/* Aqui pode renderizar o chart-run e outros dados bonitos */}
                    </div>
                ) : (
                    <Text size="sm">Carregando stats...</Text>
                )}
            </Paper>
        );
    };

    // Monta colunas para o DataTable
    // Função utilitária para cor/label do badge
    function getDeltaBadgeProps(delta: any, stats?: any) {
        let color = 'gray';
        let label = delta;
        if (typeof delta === 'number') {
            if (delta > 0) { color = 'green'; label = `+${delta}`; }
            else if (delta < 0) { color = 'red'; label = `${delta}`; }
            else { color = 'gray'; label = '='; }
        } else if (delta === 'NEW') {
            const totalWeeks = stats?.totals?.withinCutoff ?? 1;
            if (totalWeeks > 1) {
                color = 'yellow'; label = 'RE';
            } else {
                color = 'blue'; label = 'NEW';
            }
        } else if (delta === 'RE') {
            color = 'yellow'; label = 'RE';
        }
        return { color, label };
    }
    const dtColumns: DataTableColumn<ChartData>[] = filteredColumns.map((col: any): DataTableColumn<ChartData> => {
        // Centraliza todos os heads exceto 'name'
        const base = {
            accessor: col.key,
            title: col.labelComplete ? t(col.label) : t(col.labelComplete) || col.key,
            textAlign: col.key === 'name' ? 'left' : ('center' as const) as DataTableColumnTextAlign,
            width: col.key === 'name' ? undefined : 80,
        };
        if (col.key === 'rank') {
            return {
                ...base,
                render: (row, _index) => {
                    let badge = null;
                    if (showDeltaBadge) {
                        const stats = statsMap[row.entityId];
                        const { color, label } = getDeltaBadgeProps(row.deltaRank, stats);
                        badge = (
                            <Badge variant="light" color={color} size="xs">{label}</Badge>
                        );
                    }
                    return (
                        <Flex direction="column" align="center">
                            <Text fw={700} size="lg">{row.rank}</Text>
                            {badge}
                        </Flex>
                    );
                }
            };
        }
        if (col.key === 'plays') {
            return {
                ...base,
                render: (row, _index) => {
                    let badge = null;
                    if (showDeltaPlaysBadge) {
                        const stats = statsMap[row.entityId];
                        const { color, label } = getDeltaBadgeProps(row.deltaPlays, stats);
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
                render: (row, _index) => (
                    <Flex>
                        <Flex mr="sm" justify="center" align="center">
                            <div style={{ width: 40, height: 40, background: '#eee' }} />
                        </Flex>
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
                render: (row, _index) => {
                    const stats = statsMap[row.entityId];
                    const peakVal = stats?.peak?.position ?? '-';
                    return (
                        <Flex direction="column" align="center">
                            <Text fw={700}>{peakVal}</Text>
                        </Flex>
                    );
                },
            };
        }
        if (col.key === 'totalWeeks') {
            return {
                ...base,
                render: (row, _index) => {
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
            render: (row, _index) => {
                // Garante que o tipo de retorno é um ReactNode
                return <Text>{row.id}</Text>;
            }
        };
    });

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
