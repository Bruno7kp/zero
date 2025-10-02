import React, { useEffect, useState } from 'react';
import { Checkbox, Stack, Group, Button, Paper, Drawer } from '@mantine/core';
import { useIsMobile } from '../hooks/useIsMobile';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { useTranslation } from 'react-i18next';
import { updateColumn, defaultColumns, resetColumns, setContainerSize } from '../store/columnsSlice';
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
    const [opened, setOpened] = useState(false);
    const mandatory = ['rank', 'name'];

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

    const handleToggle = (key: string) => {
        if (mandatory.includes(key)) return;
        const col = columns.find((c: any) => c.key === key);
    if (viewConfig && col) dispatch(updateColumn({ view: viewType, key, visible: !col.visible }));
    };

    const handleReset = () => {
        if (viewConfig) dispatch(resetColumns({ view: viewType }));
    };

    const handleContainerSize = (size: 'md' | 'lg' | 'xl' | '100%') => {
        if (viewConfig) dispatch(setContainerSize({ view: viewType, size }));
    };

    // Agrupamentos de seções
    const sections: { title: string; items: string[] }[] = [
        { title: t('charts.rankLabel'), items: ['rank', 'deltaRankBadge', 'altVariation'] },
        { title: t('charts.imageLabel'), items: ['image'] },
        { title: t('charts.titleLabel'), items: ['name'] },
        { title: t('charts.playsLabel'), items: ['plays', 'deltaPlaysBadge', 'deltaPercentPlaysBadge'] },
        { title: t('charts.peakLabel'), items: ['peak'] },
        { title: t('charts.weeksLabel'), items: ['totalWeeks'] },
    ];

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
                title={t('charts.columnsConfig')}
                styles={{
                    content: { boxShadow: '0 0 16px 0 rgba(0,0,0,0.15)' },
                }}
            >
                <Paper p="md" radius={0} style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Stack gap="sm" style={{ overflowY: 'auto' }}>
                                                {/* Seletor de tamanho do container (desktop apenas) */}
                                                {!isMobile && (
                                                    <Group gap="xs">
                                                            <strong style={{ fontSize: 12 }}>{t('charts.columns')}: size</strong>
                                                            {(['md','lg','xl','100%'] as const).map(size => (
                                                                    <Button
                                                                        key={size}
                                                                        size="xs"
                                                                        variant={containerSize === size ? 'filled' : 'light'}
                                                                        onClick={() => handleContainerSize(size)}
                                                                    >{size}</Button>
                                                            ))}
                                                    </Group>
                                                )}
                        {sections.map(section => {
                            const sectionItems = columnsWithVisibility.filter(c => section.items.includes(c.key));
                            if (!sectionItems.length) return null;
                            return (
                                <Stack key={section.title} gap={4} style={{ border: '1px solid var(--mantine-color-gray-3)', padding: 8 }}>
                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{section.title}</div>
                                    {sectionItems.map(col => {
                                        const isMandatory = mandatory.includes(col.key);
                                        return (
                                            <Checkbox
                                                key={col.key}
                                                checked={isMandatory ? true : col.visible}
                                                disabled={isMandatory}
                                                onChange={() => handleToggle(col.key)}
                                                label={(col.labelComplete ? t(col.labelComplete) : t(col.label)) || col.key}
                                            />
                                        );
                                    })}
                                </Stack>
                            );
                        })}
                    </Stack>
                    <Group justify="space-between" mt="sm" style={{ marginTop: 'auto' }}>
                        <Button variant="light" size="xs" onClick={handleReset}>{t('common.reset')}</Button>
                        <Button size="xs" onClick={() => setOpened(false)}>{t('common.close')}</Button>
                    </Group>
                </Paper>
            </Drawer>
        </>
    );
};
