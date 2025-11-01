import React from 'react';
import { Paper, useMantineTheme } from '@mantine/core';
import { DataTable } from 'mantine-datatable';
import type { DataTableColumn } from 'mantine-datatable';
import type { LiveRow } from './types';
import { useSelector } from 'react-redux';
import { getCardBackgroundByMode, type ThemeMode } from '../../theme/modes';

type Props = {
  columns: DataTableColumn<LiveRow>[];
  records: LiveRow[];
  paperProps: { shadow?: any; bg?: any };
};

const LiveTable: React.FC<Props> = ({ columns, records, paperProps }) => {
  const theme = useMantineTheme();
  const themeMode = useSelector((s: any) => (s.theme?.value as ThemeMode) || 'dark');
  const bgStyle =
    paperProps?.bg === 'transparent'
      ? { background: 'transparent' }
      : { background: getCardBackgroundByMode(theme, themeMode) };
  return (
    <Paper {...paperProps} p="md" style={{ ...(paperProps as any), ...bgStyle }}>
      <DataTable
        columns={columns}
        records={records}
        highlightOnHover
        withTableBorder={false}
        className="datatable-transparent"
      />
    </Paper>
  );
};

export default LiveTable;
