// import React from 'react';
import { Card, Group, ThemeIcon, Text, Divider, Table, ActionIcon, ScrollArea, Menu, Tooltip, useMantineTheme } from '@mantine/core';
import { IconListNumbers, IconEdit, IconTrash, IconEraser, IconRefresh, IconDotsVertical } from '@tabler/icons-react';
// import { DataTable } from 'mantine-datatable';
import { Link, generatePath } from 'react-router-dom';

import type { TFunction } from 'i18next';
import { useSelector } from 'react-redux';
import { getCardBackgroundByMode, type ThemeMode } from '../theme/modes';

interface ChartsListCardProps {
    charts: any[];
    t: TFunction;
    openDeleteModal: (id: number, name: string) => void;
    isOnline: boolean;
    onRebuildStats: (id: number, name: string) => void;
    onClearChartData: (id: number, name: string) => void;
    processingState?: Record<string, { clearing?: boolean; rebuilding?: boolean; progress?: number; total?: number }>; // opcional
}

const ChartsListCard = ({ charts, t, openDeleteModal, isOnline, onRebuildStats, onClearChartData, processingState }: ChartsListCardProps) => {
    const hasCharts = charts && charts.length > 0;
    const theme = useMantineTheme();
    const themeMode = useSelector((s: any) => (s.theme?.value as ThemeMode) || 'dark');
    return (
        <Card shadow="md" p="md" style={{ background: getCardBackgroundByMode(theme, themeMode) }}>
            <Group>
                <ThemeIcon variant="light" size="md">
                    <IconListNumbers style={{ width: 20, height: 20 }} />
                </ThemeIcon>
                <Text fw={600} size="lg">{t('charts.title')}</Text>
            </Group>
            <Divider variant="dashed" size="sm" my="xs" />
            <ScrollArea.Autosize mah={300} offsetScrollbars>
                <Table verticalSpacing="xs" highlightOnHover withRowBorders>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th style={{ width: '40%' }}>{t('charts.title')}</Table.Th>
                            <Table.Th style={{ width: '40%' }}>{t('forms.createChart.lastfmUsernameLabel')}</Table.Th>
                            <Table.Th style={{ width: '20%', textAlign: 'right' }}>{t('charts.actions')}</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {hasCharts ? (
                            charts.map((chart: any) => {
                                const proc = processingState?.[String(chart.id)];
                                const rebuilding = proc?.rebuilding;
                                const clearing = proc?.clearing;
                                const disabled = clearing || rebuilding;
                                const progressPct = rebuilding && proc?.total ? Math.min(100, Math.round(((proc.progress || 0) / (proc.total || 1)) * 100)) : null;
                                return (
                                    <Table.Tr key={chart.id} opacity={disabled ? 0.6 : 1}>
                                        <Table.Td>
                                            <Text fw={600} size="sm">{chart.name}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c="dimmed">{chart.lastfm_username || '-'}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap={4} justify="flex-end" wrap="nowrap">
                                                <Tooltip label={t('forms.editChart.title')} withArrow>
                                                    <ActionIcon
                                                        size="sm"
                                                        variant="light"
                                                        component={Link as any}
                                                        to={generatePath('/settings/charts/:id', { id: chart.id.toString() })}
                                                        disabled={!isOnline || disabled}
                                                        aria-label={t('forms.editChart.title')}
                                                    >
                                                        <IconEdit size={16} />
                                                    </ActionIcon>
                                                </Tooltip>
                                                <Menu withinPortal shadow="md" position="bottom-end">
                                                    <Menu.Target>
                                                        <ActionIcon size="sm" variant="subtle" aria-label={t('charts.actions')} disabled={disabled}>
                                                            <IconDotsVertical size={16} />
                                                        </ActionIcon>
                                                    </Menu.Target>
                                                    <Menu.Dropdown>
                                                        <Menu.Label>{t('charts.actions')}</Menu.Label>
                                                        <Menu.Item
                                                            leftSection={<IconEraser size={14} />}
                                                            disabled={disabled}
                                                            onClick={() => !disabled && onClearChartData(chart.id, chart.name)}
                                                        >
                                                            {t('settings.clearChartData')}
                                                        </Menu.Item>
                                                        <Menu.Item
                                                            leftSection={<IconRefresh size={14} />}
                                                            disabled={disabled}
                                                            onClick={() => !disabled && onRebuildStats(chart.id, chart.name)}
                                                        >
                                                            {rebuilding && progressPct != null ? `${t('settings.rebuildStats')} (${progressPct}%)` : t('settings.rebuildStats')}
                                                        </Menu.Item>
                                                        <Menu.Divider />
                                                        <Menu.Item
                                                            leftSection={<IconTrash size={14} />}
                                                            color="red"
                                                            disabled={!isOnline || disabled}
                                                            onClick={() => isOnline && !disabled && openDeleteModal(chart.id, chart.name)}
                                                        >
                                                            {t('forms.deleteChart.title')}
                                                        </Menu.Item>
                                                    </Menu.Dropdown>
                                                </Menu>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })
                        ) : (
                            <Table.Tr>
                                <Table.Td colSpan={3}>
                                    <Text size="sm" c="dimmed">{t('settings.noCharts')}</Text>
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>
            </ScrollArea.Autosize>
        </Card>
    );
};

export default ChartsListCard;
