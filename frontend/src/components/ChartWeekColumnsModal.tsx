import React, { useEffect, useState } from 'react';
import { Modal, Checkbox, Stack, Group, Button, ScrollArea } from '@mantine/core';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { useTranslation } from 'react-i18next';
import { updateColumn, defaultColumns } from '../store/columnsSlice';
import { IconSettings } from '@tabler/icons-react';

interface ChartWeekColumnsModalProps {
  viewType: 'table' | 'list' | 'grid';
  onColumnsChange?: (cols: any[]) => void;
}

export const ChartWeekColumnsModal: React.FC<ChartWeekColumnsModalProps> = ({ viewType, onColumnsChange }) => {
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
      <Modal opened={opened} onClose={() => setOpened(false)} title={t('charts.columnsConfig')} size="sm" centered>
        <Stack gap="sm">
          <ScrollArea h={300} type="auto" offsetScrollbars>
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
          </ScrollArea>
          <Group justify="space-between" mt="sm">
            <Button variant="light" size="xs" onClick={handleReset}>{t('common.reset')}</Button>
            <Button size="xs" onClick={() => setOpened(false)}>{t('common.close')}</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};
