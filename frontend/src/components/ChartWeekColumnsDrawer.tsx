import React, { useEffect, useState } from 'react';
import { Checkbox, Stack, Group, Button, Paper, Drawer } from '@mantine/core';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { useTranslation } from 'react-i18next';
import { updateColumn, defaultColumns } from '../store/columnsSlice';
import { IconSettings } from '@tabler/icons-react';

interface ChartWeekColumnsDrawerProps {
    viewType: 'table' | 'list' | 'grid';
    onColumnsChange?: (cols: any[]) => void;
}

export const ChartWeekColumnsDrawer: React.FC<ChartWeekColumnsDrawerProps> = ({ viewType, onColumnsChange }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const columns = useSelector((state: RootState) => state.columns.columns);
    const [opened, setOpened] = useState(false);
    const mandatory = ['rank', 'name'];

    const storageKey = `chart_columns_${viewType}`;

    // Carrega config persistida
    useEffect(() => {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    parsed.forEach((col: any) => {
                        dispatch(updateColumn({ key: col.key, visible: col.visible }));
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
        if (!columns.find((c: any) => c.key === 'altVariation')) {
            dispatch(updateColumn({ key: 'altVariation', visible: false }));
        }
    }, [columns, dispatch]);

    const columnsWithVisibility = defaultColumns.map((col: { key: string; label: string; labelComplete?: string; visible: boolean }) => {
        const reduxCol = columns.find((c: any) => c.key === col.key);
        return { ...col, visible: reduxCol ? reduxCol.visible : col.visible };
    });

    const handleToggle = (key: string) => {
        if (mandatory.includes(key)) return;
        const col = columns.find((c: any) => c.key === key);
        if (col) dispatch(updateColumn({ key, visible: !col.visible }));
    };

    const handleReset = () => {
        defaultColumns.forEach(col => {
            dispatch(updateColumn({ key: col.key, visible: col.visible }));
        });
    };

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
                    <Stack gap="xs">
                        {columnsWithVisibility.map((col: any) => {
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
                    <Group justify="space-between" mt="sm" style={{ marginTop: 'auto' }}>
                        <Button variant="light" size="xs" onClick={handleReset}>{t('common.reset')}</Button>
                        <Button size="xs" onClick={() => setOpened(false)}>{t('common.close')}</Button>
                    </Group>
                </Paper>
            </Drawer>
        </>
    );
};
