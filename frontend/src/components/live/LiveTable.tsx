import React from 'react';
import { Paper } from '@mantine/core';
import { DataTable } from 'mantine-datatable';
import type { DataTableColumn } from 'mantine-datatable';
import type { LiveRow } from './types';

type Props = {
  columns: DataTableColumn<LiveRow>[];
  records: LiveRow[];
  paperProps: { shadow?: any; bg?: any };
};

const LiveTable: React.FC<Props> = ({ columns, records, paperProps }) => (
  <Paper {...paperProps} p="md">
    <DataTable
      columns={columns}
      records={records}
      highlightOnHover
      withTableBorder={false}
      className="datatable-transparent"
    />
  </Paper>
);

export default LiveTable;
