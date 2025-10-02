import React, { useEffect, useState } from 'react';
import { Stack, Group, Button, Paper, Drawer, Text, SegmentedControl, Divider } from '@mantine/core';
import { useIsMobile } from '../hooks/useIsMobile';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { useTranslation } from 'react-i18next';
import { updateColumn, defaultColumns, resetColumns, setContainerSize, setRankVariationLocation, setPlaysVariationDisplay } from '../store/columnsSlice';
import { IconSettings } from '@tabler/icons-react';

interface ChartWeekColumnsDrawerProps {
    viewType: 'table' | 'list' | 'grid';
    onColumnsChange?: (cols: any[]) => void;
}

export const ChartWeekColumnsDrawer: React.FC<ChartWeekColumnsDrawerProps> = ({ viewType, onColumnsChange }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const isMobile = useIsMobile();
    const viewConfig = useSelector((state: RootState) => (state as any)?.columns?.views?.[viewType]);
    const columns = viewConfig?.columns || defaultColumns;
    const containerSize = viewConfig?.settings?.containerSize || (viewType === 'grid' ? 'xl' : 'md');
    // Default: 'under' for all view types (grid uses show/hide UI but mapped to 'under' internally when shown)
    const rankVariationLocation = viewConfig?.settings?.rankVariationLocation || 'under';
    const [opened, setOpened] = useState(false);
    // Colunas obrigatórias (rank, name) exibidas como sempre visíveis (badge), sem toggle

    const storageKey = `chart_columns_${viewType}`; // legado (ainda lido para migração leve se necessário)

    // Carrega config persistida
    useEffect(() => {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    parsed.forEach((col: any) => {
                        dispatch(updateColumn({ view: viewType, key: col.key, visible: col.visible }));
                    });
                    onColumnsChange?.(parsed);
                }
            } catch { /* noop */ }
        } else {
            localStorage.setItem(storageKey, JSON.stringify(columns));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewType]);

    // Persiste sempre que mudar
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(columns));
        onColumnsChange?.(columns);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [columns]);

    // Garante altVariation registrada
    useEffect(() => {
        if (viewConfig && !columns.find((c: any) => c.key === 'altVariation')) {
            dispatch(updateColumn({ view: viewType, key: 'altVariation', visible: false }));
        }
    }, [columns, dispatch, viewConfig, viewType]);

    const columnsWithVisibility = defaultColumns.map((col: { key: string; label: string; labelComplete?: string; visible: boolean }) => {
        const reduxCol = columns.find((c: any) => c.key === col.key);
        return { ...col, visible: reduxCol ? reduxCol.visible : col.visible };
    });

    // Toggles agora são feitos inline em cada SegmentedControl

    const handleReset = () => {
        if (viewConfig) dispatch(resetColumns({ view: viewType }));
    };

    const handleContainerSize = (size: 'md' | 'lg' | 'xl' | '100%') => {
        if (viewConfig) dispatch(setContainerSize({ view: viewType, size }));
    };

    // Ordem agora definida diretamente na renderização das seções abaixo

    const viewTypeLabel = viewType === 'table' ? 'charts.tableView' : viewType === 'list' ? 'charts.listView' : 'charts.gridView';

    return (
        <>
            <Button variant="subtle" size="xs" onClick={() => setOpened(true)}>
                <IconSettings size={16} />
            </Button>
            <Drawer
                opened={opened}
                onClose={() => setOpened(false)}
                position="right"
                size="md"
                withCloseButton={false}
                overlayProps={{ opacity: 0 }}
                title={`${t('charts.columnsConfig')}: ${t(viewTypeLabel)}`}
                styles={{
                    content: { boxShadow: '0 0 16px 0 rgba(0,0,0,0.15)' },
                }}
            >
                <Paper p="sm" radius={0} style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Stack gap={6} style={{ overflowY: 'auto' }}>
                        {/* Seletor de tamanho do container (desktop apenas) */}
                        {!isMobile && (
                            <Stack gap={2}>
                                <Text size="sm" fw={600}>{t('charts.size')}</Text>
                                <SegmentedControl
                                    fullWidth
                                    size="xs"
                                    value={containerSize}
                                    onChange={(v) => handleContainerSize(v as 'md' | 'lg' | 'xl' | '100%')}
                                    data={[
                                        { label: 'MD', value: 'md' },
                                        { label: 'LG', value: 'lg' },
                                        { label: 'XL', value: 'xl' },
                                        { label: '100%', value: '100%' }
                                    ]}
                                />
                            </Stack>
                        )}
                        {!isMobile && <Divider my={4} />}
                        {/* Exibição da variação de rank */}
                        <Stack gap={2}>
                            <Text size="sm" fw={600}>{t('charts.rankVariationLocationLabel')}</Text>
                            {viewType === 'grid' ? (
                                <SegmentedControl
                                    fullWidth
                                    size="xs"
                                    value={rankVariationLocation === 'hidden' ? 'hidden' : 'under'}
                                    onChange={(v) => dispatch(setRankVariationLocation({ view: viewType, location: (v === 'hidden' ? 'hidden' : 'under') }))}
                                    data={[
                                        { label: t('charts.show'), value: 'under' },
                                        { label: t('charts.hide'), value: 'hidden' }
                                    ]}
                                />
                            ) : (
                                <SegmentedControl
                                    fullWidth
                                    size="xs"
                                    value={rankVariationLocation}
                                    onChange={(v) => dispatch(setRankVariationLocation({ view: viewType, location: v as 'under' | 'column' | 'hidden' }))}
                                    data={[
                                        { label: t('charts.rankVariationUnder'), value: 'under' },
                                        { label: t('charts.rankVariationColumn'), value: 'column' },
                                        { label: t('charts.hide'), value: 'hidden' }
                                    ]}
                                />
                            )}
                        </Stack>
                        <Divider my={6} />
                        {/* Imagem */}
                        <Stack gap={2}>
                            <Text size="sm" fw={600}>{t('charts.imageLabel')}</Text>
                            <SegmentedControl
                                fullWidth
                                size="xs"
                                value={columnsWithVisibility.find(c => c.key === 'image')?.visible ? 'show' : 'hide'}
                                onChange={(v) => dispatch(updateColumn({ view: viewType, key: 'image', visible: v === 'show' }))}
                                data={[{ label: t('charts.show'), value: 'show' }, { label: t('charts.hide'), value: 'hide' }]}
                            />
                        </Stack>
                        <Divider my={6} />
                        {/* Plays */}
                        <Stack gap={2}>
                            <Text size="sm" fw={600}>{t('charts.playsLabel')}</Text>
                            <SegmentedControl
                                fullWidth
                                size="xs"
                                value={columnsWithVisibility.find(c => c.key === 'plays')?.visible ? 'show' : 'hide'}
                                onChange={(v) => dispatch(updateColumn({ view: viewType, key: 'plays', visible: v === 'show' }))}
                                data={[{ label: t('charts.show'), value: 'show' }, { label: t('charts.hide'), value: 'hide' }]}
                            />
                        </Stack>
                        {/* Variação de reproduções (após plays) */}
                        {viewType !== 'grid' && (
                            <Stack gap={2}>
                                <Text size="sm" fw={600}>{t('charts.playsVariationDisplayLabel')}</Text>
                                <SegmentedControl
                                    size="xs"
                                    fullWidth
                                    value={(viewConfig?.settings as any)?.playsVariationDisplay || 'percent'}
                                    onChange={(value) => dispatch(setPlaysVariationDisplay({ view: viewType, display: value as 'hidden' | 'absolute' | 'percent' }))}
                                    data={[
                                        { label: t('charts.playsVariationDisplay_hidden'), value: 'hidden' },
                                        { label: t('charts.playsVariationDisplay_absolute'), value: 'absolute' },
                                        { label: t('charts.playsVariationDisplay_percent'), value: 'percent' },
                                    ]}
                                />
                            </Stack>
                        )}
                        {viewType !== 'grid' && <Divider my={6} />}
                        {/* Peak */}
                        <Stack gap={2}>
                            <Text size="sm" fw={600}>{t('charts.peakLabel')}</Text>
                            <SegmentedControl
                                fullWidth
                                size="xs"
                                value={columnsWithVisibility.find(c => c.key === 'peak')?.visible ? 'show' : 'hide'}
                                onChange={(v) => dispatch(updateColumn({ view: viewType, key: 'peak', visible: v === 'show' }))}
                                data={[{ label: t('charts.show'), value: 'show' }, { label: t('charts.hide'), value: 'hide' }]}
                            />
                        </Stack>
                        <Divider my={6} />
                        {/* Weeks */}
                        <Stack gap={2}>
                            <Text size="sm" fw={600}>{t('charts.weeksLabel')}</Text>
                            <SegmentedControl
                                fullWidth
                                size="xs"
                                value={columnsWithVisibility.find(c => c.key === 'totalWeeks')?.visible ? 'show' : 'hide'}
                                onChange={(v) => dispatch(updateColumn({ view: viewType, key: 'totalWeeks', visible: v === 'show' }))}
                                data={[{ label: t('charts.show'), value: 'show' }, { label: t('charts.hide'), value: 'hide' }]}
                            />
                        </Stack>
                    </Stack>
                    <Group justify="space-between" mt={8} style={{ marginTop: 'auto' }}>
                        <Button variant="light" size="xs" onClick={handleReset}>{t('common.reset')}</Button>
                        <Button size="xs" onClick={() => setOpened(false)}>{t('common.close')}</Button>
                    </Group>
                </Paper>
            </Drawer>
        </>
    );
};
