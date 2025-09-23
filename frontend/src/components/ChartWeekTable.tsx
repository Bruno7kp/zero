import React, { useEffect, useState, useMemo } from 'react';
import { DataTable } from 'mantine-datatable';
import type { DataTableColumn, DataTableRowExpansionProps } from 'mantine-datatable';
import { Paper, Button, Text, Checkbox, Menu, ActionIcon } from '@mantine/core';
import { db } from '../db/indexedDb';
import type { ChartData } from '../db/indexedDb';
import { getChartStats } from '../utils/getChartStats';
import { IconFilter } from '@tabler/icons-react';

export const defaultColumns = [
  { key: 'rank', label: 'Posição', visible: true },
  { key: 'deltaRank', label: 'Δ Posição', visible: true },
  { key: 'peak', label: 'Pico', visible: true },
  { key: 'image', label: 'Imagem', visible: true },
  { key: 'name', label: 'Nome', visible: true },
  { key: 'plays', label: 'Reproduções', visible: true },
  { key: 'deltaPlays', label: 'Δ Reproduções', visible: true },
  { key: 'totalWeeks', label: 'Total Semanas', visible: true },
  { key: 'expand', label: '', visible: true },
];

export function ChartWeekTableColumnsMenu({ columns, toggleColumn }: { columns: typeof defaultColumns, toggleColumn: (key: string) => void }) {
  const [opened, setOpened] = useState(false);
  return (
    <Menu shadow="md" width={200} opened={opened} onChange={setOpened} closeOnItemClick={false}>
      <Menu.Target>
        <ActionIcon size="lg" variant="subtle" onClick={() => setOpened((o) => !o)}>
          <IconFilter size={18} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        {columns.map((col) => (
          <Menu.Item key={col.key}>
            <Checkbox
              checked={col.visible}
              onChange={() => toggleColumn(col.key)}
              label={col.label || col.key}
            />
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

interface ChartWeekTableProps {
  chart: any;
  week?: string;
  type: string;
}


export const ChartWeekTable: React.FC<ChartWeekTableProps & { columns: typeof defaultColumns, toggleColumn: (key: string) => void }> = ({ chart, week, type, columns }) => {
  const [data, setData] = useState<ChartData[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statsMap, setStatsMap] = useState<Record<string, any>>({});

  // Busca dados da semana
  useEffect(() => {
    if (!week) return;
    db.charts_data
      .where(['chartId', 'chartType', 'week'])
      .equals([`${chart.id}`, type, week])
      .toArray()
      .then(setData);
  }, [chart.id, week, type]);

  // Busca stats para entidades expandidas
  useEffect(() => {
    if (!expanded) return;
    const entityId = expanded;
    getChartStats(`${chart.id}`, type, entityId).then((stats: any) => {
      setStatsMap((prev: Record<string, any>) => ({ ...prev, [entityId]: stats }));
    });
  }, [expanded, chart.id, type]);

  // Colunas dinâmicas
  const visibleColumns = useMemo(() => columns.filter(c => c.visible), [columns]);


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
  const dtColumns: DataTableColumn<ChartData>[] = visibleColumns.map(col => {
    if (col.key === 'expand') {
      return {
        accessor: 'expand',
        title: '',
        render: (row) => (
          <Button size="xs" onClick={() => setExpanded(row.entityId)}>
            {expanded === row.entityId ? 'Fechar' : 'Expandir'}
          </Button>
        ),
      };
    }
    if (col.key === 'image') {
      return {
        accessor: 'image',
        title: 'Imagem',
        render: () => <div style={{ width: 40, height: 40, background: '#eee' }} />,
      };
    }
    if (col.key === 'name') {
      return {
        accessor: 'name',
        title: 'Nome',
        render: (row) => (
          <div>
            <Text fw={700}>{row.name}</Text>
            {row.artistName && <Text size="xs">{row.artistName}</Text>}
          </div>
        ),
      };
    }
    if (col.key === 'peak') {
      return {
        accessor: 'peak',
        title: 'Pico',
        render: (row) => {
          const stats = statsMap[row.entityId];
          return stats?.peak?.position ?? '-';
        },
      };
    }
    if (col.key === 'totalWeeks') {
      return {
        accessor: 'totalWeeks',
        title: 'Total Semanas',
        render: (row) => {
          const stats = statsMap[row.entityId];
          return stats?.totals?.withinCutoff ?? '-';
        },
      };
    }
    return {
      accessor: col.key as keyof ChartData,
      title: col.label,
    };
  });

  return (
    <Paper shadow="xs" p="md" withBorder>
      <DataTable
        columns={dtColumns}
        records={data}
        rowExpansion={{ content: renderExpansion }}
        highlightOnHover
        minHeight={300}
      />
    </Paper>
  );
};
